import base64
import json
import logging
import urllib.parse as urlparse
from collections.abc import Sequence
from urllib.parse import quote
from uuid import UUID

import resend
from fastapi import APIRouter, BackgroundTasks, status

from app.athletes.models import Athlete
from app.athletes.schemas import AthleteRegistrationModel
from app.database.dependencies import db_dependency
from app.exceptions import conflict_exception
from app.firebase_auth.dependencies import admin_user_dependency
from app.settings import registration_settings, resend_settings

from .models import Team
from .schemas import (
    TeamRegistrationModel,
    TeamRegistrationResponseModel,
    TeamsCreateModel,
    TeamsOutputDetailModel,
    TeamsOutputModel,
    TeamsUpdateModel,
    WaiverLinkModel,
)

log = logging.getLogger("uvicorn.error")

teams_router = APIRouter(prefix="/teams", tags=["teams"])


@teams_router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=list[TeamsOutputDetailModel],
)
async def get_teams(
    db_session: db_dependency,
    event_short_name: str,
) -> Sequence[Team]:
    return await Team.find_all(
        async_session=db_session,
        select_relationships=[Team.athletes, Team.scores],
        event_short_name=event_short_name,
    )


@teams_router.get(
    "/{team_id}",
    status_code=status.HTTP_200_OK,
    response_model=TeamsOutputDetailModel,
)
async def get_team_info(
    db_session: db_dependency,
    team_id: UUID,
) -> Team:
    return await Team.find_or_raise(
        async_session=db_session,
        id=team_id,
        select_relationships=[Team.athletes, Team.scores],
    )


@teams_router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=TeamsOutputModel,
)
async def create_team(
    db_session: db_dependency,
    _: admin_user_dependency,
    team: TeamsCreateModel,
) -> Team:
    team_exists = await Team.find(
        async_session=db_session,
        team_name=team.team_name,
        event_short_name=team.event_short_name,
    )
    if team_exists:
        raise conflict_exception()

    new_team = Team(
        category=team.category,
        team_name=team.team_name,
        paid=team.paid,
        verified=team.verified,
        event_short_name=team.event_short_name,
    )
    db_session.add(new_team)
    await db_session.commit()
    await db_session.refresh(new_team)
    return new_team


@teams_router.patch(
    "/{team_id}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=TeamsOutputModel,
)
async def update_team(
    db_session: db_dependency,
    _: admin_user_dependency,
    team_id: UUID,
    update_data: TeamsUpdateModel,
) -> Team:
    team = await Team.find_or_raise(async_session=db_session, id=team_id)

    # Update only the fields that are provided
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(team, field, value)

    db_session.add(team)
    await db_session.commit()
    await db_session.refresh(team)
    return team


@teams_router.delete(
    "/{team_id}",
    status_code=status.HTTP_202_ACCEPTED,
)
async def delete_team(
    db_session: db_dependency,
    _: admin_user_dependency,
    team_id: UUID,
) -> None:
    team = await Team.find_or_raise(
        async_session=db_session,
        select_relationships=[Team.scores],
        id=team_id,
    )
    if len(team.scores) > 0:
        raise conflict_exception(detail="Cannot delete team with associated scores.")
    await team.delete(async_session=db_session)


@teams_router.post(
    "/register",
    status_code=status.HTTP_202_ACCEPTED,
)
async def register_team(
    db_session: db_dependency,
    team: TeamRegistrationModel,
    background_tasks: BackgroundTasks,
) -> TeamRegistrationResponseModel:
    if team.event_short_name != "dtteams2025":
        raise conflict_exception(detail="Team registration is not open for this event.")

    team_exists = await Team.find(
        async_session=db_session,
        team_name=team.team_name,
        event_short_name=team.event_short_name,
    )
    if team_exists:
        raise conflict_exception(detail="Team name already registered for this event.")

    if len(team.athletes) != 4:  # noqa: PLR2004
        raise conflict_exception(detail="A team must have exactly 4 athletes.")

    new_team = Team(
        category=team.category,
        team_name=team.team_name,
        paid=False,
        verified=False,
        event_short_name=team.event_short_name,
    )
    db_session.add(new_team)
    await db_session.commit()
    await db_session.refresh(new_team)

    for athlete_data in team.athletes:
        new_athlete = Athlete(**athlete_data.model_dump())
        new_athlete.team_id = new_team.id
        db_session.add(new_athlete)

    await db_session.commit()

    payment_link = get_payment_link(team)
    waiver_links = get_waiver_links(team)

    registration_response = TeamRegistrationResponseModel(
        payment_link=payment_link,
        waiver_links=waiver_links,
    )

    # Add background task for email
    background_tasks.add_task(
        send_registration_email,
        registration_response,
        team,
    )
    log.info("Registered new team: %s", team.team_name)

    return registration_response


def add_domain_redirect(link: str) -> str:
    encoded_target = quote(link, safe="")
    return f"{registration_settings.domain_redirect_url}?link={encoded_target}"


def get_payment_link(team: TeamRegistrationModel) -> str:
    payment_url_params = {
        "email": team.athletes[0].email,
        "phone": team.athletes[0].phone_number,
        "team_name": team.team_name,
    }
    url_parts = list(urlparse.urlparse(registration_settings.payment_link))
    query = dict(urlparse.parse_qsl(url_parts[4]))
    query.update(payment_url_params)
    url_parts[4] = urlparse.urlencode(query)
    payment_link = urlparse.urlunparse(url_parts)
    return add_domain_redirect(payment_link)


def get_waiver_links(team: TeamRegistrationModel) -> list[WaiverLinkModel] | None:
    waiver_links = []
    for athlete in team.athletes:
        if athlete.gym and athlete.gym != "CFMF":
            waiver_link = add_domain_redirect(get_waiver_link(athlete, team.team_name))
            waiver_links.append(
                WaiverLinkModel(athlete_name=f"{athlete.first_name} {athlete.last_name}", waiver_link=waiver_link),
            )
    return waiver_links if waiver_links else None


def get_waiver_link(athlete: AthleteRegistrationModel, team_name: str) -> str:
    if athlete.gym == "CFMF":
        return ""

    waiver_params = {
        "name": athlete.first_name + " " + athlete.last_name,
        "email": athlete.email,
        "team": team_name,
    }
    waiver_params_base64 = base64.b64encode(json.dumps(waiver_params).encode("utf-8")).decode("utf-8")

    return f"{registration_settings.waiver_link}{waiver_params_base64}"


def send_registration_email(registration_response: TeamRegistrationResponseModel, team: TeamRegistrationModel) -> None:
    athlete_emails = [athlete.email for athlete in team.athletes if athlete.email]
    email_payment_link = registration_response.payment_link

    waiver_section = ""
    if registration_response.waiver_links and len(registration_response.waiver_links) > 0:
        waiver_section = f"""
        <p>Please fill out the waiver forms (for Non-CFMF athletes), if not already filled:</p>
        <ul>
            {
            "".join(
                f'<li>{athlete.athlete_name}<a href="{athlete.waiver_link}" target="_blank">( Waiver Link )</a></li>'
                for athlete in registration_response.waiver_links
            )
        }
        </ul>
    """

    team_fees = (
        registration_settings.early_bird_team_fee
        if registration_settings.use_early_bird_fee
        else registration_settings.team_fee
    )

    params: resend.Emails.SendParams = {
        "from": resend_settings.resend_from_email,
        "to": athlete_emails,
        "cc": registration_settings.registration_cc_list,
        "subject": f"DT - Team Registration - {team.team_name}",
        "html": f"""
        <h1>Deccan Throwdown Teams</h1>
        <p>Thank you for registering for the Deccan Throwdown Teams event!</p>
        <h2>Team: {team.team_name}</h2>
        <h3>Category: {team.category}</h3>
        <ul>
            {"".join(f"<li>{athlete.first_name} {athlete.last_name}{f' ({athlete.phone_number})' if athlete.phone_number else ''}</li>" for athlete in team.athletes)}
        </ul>
        <p>Registration fees are Rs. {team_fees} per team.</p>
        <p>Here is the payment link if you haven't paid already: <a href="{email_payment_link}" target="_blank">Pay Now</a></p>
        <p>Once payment is processed, we will confirm your participation in the Teams event</p>
        {waiver_section}
        <p>Reply-all to this email if you have any questions.</p>
        <p>Train hard, stay humble,<br/>DT Team</p>
        """,
    }
    email_id: resend.Emails.SendResponse = resend.Emails.send(params)
    log.info("Sent team registration email to team %s, email id: %s", team.team_name, email_id)
