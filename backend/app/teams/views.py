import asyncio
import base64
import html
import json
import logging
import re
import urllib.parse as urlparse
from collections.abc import Sequence
from datetime import date
from typing import Any, Literal
from urllib.parse import quote
from uuid import UUID

import resend
from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from app.apikey_auth.dependencies import api_key_admin_dependency
from app.athletes.models import Athlete
from app.athletes.schemas import (
    AthleteBaseModel,
    AthleteOutputModel,
    AthleteRegistrationModel,
)
from app.database.dependencies import db_dependency
from app.exceptions import conflict_exception
from app.firebase_auth.dependencies import (
    admin_user_dependency,
    admin_user_or_api_key_dependency,
    optional_admin_user_dependency,
)
from app.notifications.service import NotificationService
from app.scores.models import Score, score_is_verified
from app.scores.schemas import ScoreOutputModel
from app.scores.service import rerank_event
from app.settings import registration_settings, resend_settings

from .models import Team
from .schemas import (
    SentEmailDeliveryListModel,
    SentEmailDeliveryModel,
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


def serialize_score(score: Score) -> ScoreOutputModel:
    return ScoreOutputModel(
        id=score.id,
        reps=score.reps,
        time_s=score.time_s,
        tiebreak_s=score.tiebreak_s,
        score_detail=score.score_detail,
        team_id=score.team_id,
        wod_number=score.wod_number,
        verified=score_is_verified(score.verified),
        wod_rank=score.wod_rank,
        wod_points=score.wod_points,
    )


def serialize_team(team: Team, *, include_private: bool) -> TeamsOutputDetailModel:
    athletes = []
    for athlete in team.athletes:
        athlete_model = AthleteOutputModel.model_validate(athlete)
        if not include_private:
            athlete_model = athlete_model.model_copy(
                update={
                    "email": None,
                    "phone_number": None,
                    "date_of_birth": None,
                },
            )
        athletes.append(athlete_model)
    return TeamsOutputDetailModel(
        id=team.id,
        category=team.category,
        team_name=team.team_name,
        paid=team.paid,
        verified=team.verified,
        event_short_name=team.event_short_name,
        overall_rank=team.overall_rank,
        athletes=athletes,
        scores=[serialize_score(score) for score in team.scores],
    )


@teams_router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=list[TeamsOutputDetailModel],
)
async def get_teams(
    db_session: db_dependency,
    event_short_name: str,
    admin_user: optional_admin_user_dependency,
) -> list[TeamsOutputDetailModel]:
    teams = await Team.find_all(
        async_session=db_session,
        select_relationships=[Team.athletes, Team.scores],
        event_short_name=event_short_name,
    )
    include_private = admin_user is not None
    return [serialize_team(team, include_private=include_private) for team in teams]


def format_mailbox(name: str, email: str) -> str:
    """Format an address as `Name <email>`, quoted when the name has special characters."""
    cleaned = " ".join(name.split())
    if not cleaned:
        return f"<{email}>"
    if re.search(r'[,;<>@"]', cleaned):
        escaped = cleaned.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}" <{email}>'
    return f"{cleaned} <{email}>"


@teams_router.get("/emails", status_code=status.HTTP_200_OK)
async def get_team_emails(
    db_session: db_dependency,
    _: admin_user_or_api_key_dependency,
    event_short_name: str,
) -> str:
    """Comma-separated `Name <email>` addresses, safe to paste into To or Bcc."""
    teams = await Team.find_all(
        async_session=db_session,
        select_relationships=[Team.athletes],
        event_short_name=event_short_name,
    )
    seen: set[str] = set()
    mailboxes: list[str] = []
    for team in teams:
        for athlete in team.athletes or []:
            email = (athlete.email or "").strip()
            if not email:
                continue
            key = email.casefold()
            if key in seen:
                continue
            seen.add(key)
            name = f"{athlete.first_name} {athlete.last_name}"
            mailboxes.append(format_mailbox(name, email))
    mailboxes.sort(key=str.casefold)
    return ", ".join(mailboxes)


# Resend returns at most 100 emails per page. Cap the walk so an admin
# request stays bounded; `has_more` tells the UI when older sends exist.
_DELIVERY_PAGE_SIZE = 100
_DELIVERY_MAX_PAGES = 3

_UNDELIVERED_EVENTS = frozenset({"bounced", "failed", "suppressed", "canceled"})
_DELIVERED_EVENTS = frozenset({"delivered", "opened", "clicked", "complained"})


def _delivery_status(last_event: str) -> Literal["delivered", "undelivered", "pending"]:
    if last_event in _UNDELIVERED_EVENTS:
        return "undelivered"
    if last_event in _DELIVERED_EVENTS:
        return "delivered"
    return "pending"


def _as_address_list(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value] if value else []
    if isinstance(value, list):
        return [str(item) for item in value if item]
    return []


def _email_address(value: str) -> str:
    match = re.search(r"<([^>]+)>", value)
    if match:
        return match.group(1).strip()
    return value.strip()


async def _athlete_names_by_email(db_session: db_dependency) -> dict[str, str]:
    athletes = await Athlete.find_all(async_session=db_session)
    names_by_email: dict[str, str] = {}
    for athlete in sorted(athletes, key=lambda item: (item.created_at, str(item.id))):
        email = (athlete.email or "").strip()
        if not email:
            continue
        key = email.casefold()
        if key in names_by_email:
            continue
        name = " ".join(f"{athlete.first_name} {athlete.last_name}".split())
        if name:
            names_by_email[key] = name
    return names_by_email


def _delivery_recipient(address: str, names_by_email: dict[str, str]) -> str:
    email = _email_address(address)
    name = names_by_email.get(email.casefold())
    if not name:
        return address
    return f"{name} <{email}>"


def _list_sent_email_deliveries(
    names_by_email: dict[str, str],
) -> SentEmailDeliveryListModel:
    emails: list[SentEmailDeliveryModel] = []
    after: str | None = None
    has_more = False
    for _ in range(_DELIVERY_MAX_PAGES):
        params: dict[str, Any] = {"limit": _DELIVERY_PAGE_SIZE}
        if after:
            params["after"] = after
        page = resend.Emails.list(params)
        data = page.get("data") or []
        for item in data:
            last_event = str(item.get("last_event") or "sent")
            emails.append(
                SentEmailDeliveryModel(
                    id=str(item.get("id") or ""),
                    to=[
                        _delivery_recipient(address, names_by_email)
                        for address in _as_address_list(item.get("to"))
                    ],
                    sender=str(item.get("from") or ""),
                    subject=str(item.get("subject") or ""),
                    created_at=str(item.get("created_at") or ""),
                    last_event=last_event,
                    status=_delivery_status(last_event),
                )
            )
        has_more = bool(page.get("has_more"))
        if not data or not has_more:
            has_more = False
            break
        after = str(data[-1].get("id") or "")
        if not after:
            break
    return SentEmailDeliveryListModel(emails=emails, has_more=has_more)


@teams_router.get(
    "/email-deliveries",
    status_code=status.HTTP_200_OK,
    response_model=SentEmailDeliveryListModel,
)
async def get_sent_email_deliveries(
    db_session: db_dependency,
    _: admin_user_dependency,
) -> SentEmailDeliveryListModel:
    """Recent Resend sends, with delivery outcome for each message."""
    names_by_email = await _athlete_names_by_email(db_session)
    try:
        return await asyncio.to_thread(_list_sent_email_deliveries, names_by_email)
    except Exception:
        log.exception("Failed to list Resend email deliveries")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not load email delivery status",
        ) from None


@teams_router.get(
    "/waiver-links",
    status_code=status.HTTP_200_OK,
)
async def get_team_waiver_links(
    async_session: db_dependency,
    _: api_key_admin_dependency,
    team_name: str,
    event_short_name: str,
) -> list[WaiverLinkModel] | None:
    team = await Team.find_or_raise(
        async_session=async_session,
        select_relationships=[Team.athletes],
        team_name=team_name,
        event_short_name=event_short_name,
    )
    athletes = [
        AthleteBaseModel(
            first_name=athlete.first_name,
            last_name=athlete.last_name,
            email=athlete.email,
            phone_number=athlete.phone_number,
            date_of_birth=athlete.date_of_birth,
            gym=athlete.gym,
            sex=athlete.sex if athlete.sex in ("M", "F") else "M",
        )
        for athlete in team.athletes
    ]
    return get_waiver_links_for_athletes(team.team_name, athletes)


@teams_router.get(
    "/{team_id}",
    status_code=status.HTTP_200_OK,
    response_model=TeamsOutputDetailModel,
)
async def get_team_info(
    db_session: db_dependency,
    team_id: UUID,
    admin_user: optional_admin_user_dependency,
) -> TeamsOutputDetailModel:
    team = await Team.find_or_raise(
        async_session=db_session,
        id=team_id,
        select_relationships=[Team.athletes, Team.scores],
    )
    return serialize_team(team, include_private=admin_user is not None)


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
    if new_team.verified:
        NotificationService.send_team_verified(
            new_team.event_short_name,
            new_team.team_name,
            new_team.category,
        )
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
    was_verified = team.verified
    previous_category = team.category

    # Update only the fields that are provided
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(team, field, value)

    db_session.add(team)
    await db_session.commit()
    await db_session.refresh(team)
    if previous_category != team.category or was_verified != team.verified:
        await rerank_event(db_session, team.event_short_name)
    if not was_verified and team.verified:
        NotificationService.send_team_verified(
            team.event_short_name,
            team.team_name,
            team.category,
        )
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
        raise conflict_exception(
            detail="Cannot delete this team because it has scores.",
        )
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
    if team.event_short_name != "dtteams2026":
        raise conflict_exception(detail="Team registration is not open for this event.")

    team_exists = await Team.find(
        async_session=db_session,
        team_name=team.team_name,
        event_short_name=team.event_short_name,
    )
    if team_exists:
        raise conflict_exception(detail="Team name already registered for this event.")

    female_count = sum(1 for athlete in team.athletes if athlete.sex == "F")
    if len(team.athletes) != 6:  # noqa: PLR2004
        raise conflict_exception(detail="A team must have exactly 6 athletes.")
    if female_count < 2:  # noqa: PLR2004
        raise conflict_exception(
            detail="A team must have at least 2 female athletes.",
        )

    new_team = Team(
        category=team.category,
        team_name=team.team_name,
        paid=False,
        verified=False,
        event_short_name=team.event_short_name,
    )
    db_session.add(new_team)
    await db_session.flush()

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
    background_tasks.add_task(
        NotificationService.send_new_team_registration,
        new_team.event_short_name,
        new_team.team_name,
        new_team.category,
    )
    log.info("Registered new team: %s", team.team_name)

    return registration_response


def add_domain_redirect(link: str) -> str:
    encoded_target = quote(link, safe="")
    parsed = urlparse.urlparse(registration_settings.domain_redirect_url)
    base = urlparse.urlunparse(parsed._replace(query="", fragment=""))
    return f"{base}?link={encoded_target}"


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
    return get_waiver_links_for_athletes(team.team_name, team.athletes)


def get_waiver_links_for_athletes(
    team_name: str,
    athletes: Sequence[AthleteBaseModel],
) -> list[WaiverLinkModel] | None:
    waiver_links = []
    for athlete in athletes:
        if athlete.gym:
            waiver_link = add_domain_redirect(get_waiver_link(athlete, team_name))
            waiver_links.append(
                WaiverLinkModel(
                    athlete_name=f"{athlete.first_name} {athlete.last_name}",
                    waiver_link=waiver_link,
                ),
            )
    return waiver_links if waiver_links else None


def get_waiver_link(athlete: AthleteBaseModel, team_name: str) -> str:

    waiver_params = {
        "name": athlete.first_name + " " + athlete.last_name,
        "email": athlete.email,
        "team": team_name,
    }
    waiver_params_base64 = base64.urlsafe_b64encode(
        json.dumps(waiver_params).encode("utf-8")
    ).decode("utf-8")

    return f"{registration_settings.waiver_link}{quote(waiver_params_base64, safe='')}"


def _email_text(value: str | None) -> str:
    return html.escape(value or "")


def _registration_fee() -> int:
    if registration_settings.use_early_bird_fee:
        return registration_settings.early_bird_team_fee
    return registration_settings.team_fee


def _roster_entries(team: TeamRegistrationModel, *, include_email: bool) -> list[str]:
    entries = []
    for athlete in team.athletes:
        entry = f"{athlete.first_name} {athlete.last_name}"
        if athlete.phone_number:
            entry = f"{entry} ({athlete.phone_number})"
        if include_email and athlete.email:
            entry = f"{entry} <{athlete.email}>"
        entries.append(entry)
    return entries


def _registration_message(
    registration_response: TeamRegistrationResponseModel,
    team: TeamRegistrationModel,
    *,
    include_email: bool,
) -> tuple[str, str]:
    roster = _roster_entries(team, include_email=include_email)
    fee = _registration_fee()
    payment_link = registration_response.payment_link
    waiver_links = registration_response.waiver_links or []

    html_roster = "".join(f"<li>{_email_text(entry)}</li>" for entry in roster)
    html_waivers = ""
    if waiver_links:
        waiver_items = "".join(
            "<li>"
            f"{_email_text(link.athlete_name)} "
            f'<a href="{html.escape(link.waiver_link, quote=True)}">Waiver link</a>'
            "</li>"
            for link in waiver_links
        )
        html_waivers = (
            "<p>Please fill out a waiver for each athlete, if not already filled:</p>"
            f"<ul>{waiver_items}</ul>"
        )

    html_body = f"""
        <h1>Deccan Throwdown Teams</h1>
        <p>Thank you for registering for the Deccan Throwdown Teams event!</p>
        <h2>Team: {_email_text(team.team_name)}</h2>
        <h3>Category: {_email_text(team.category)}</h3>
        <ul>
            {html_roster}
        </ul>
        <p>Registration fees are Rs. {fee} per team.</p>
        <p>Here is the payment link if you haven't paid already:
        <a href="{html.escape(payment_link, quote=True)}">Pay now</a></p>
        <p>Once payment is processed, we will confirm your participation in the Teams event.</p>
        {html_waivers}
        <p>Reply to this email if you have any questions.</p>
        <p>Train hard, stay humble,<br/>DT Team</p>
        """

    text_lines = [
        "Deccan Throwdown Teams",
        "",
        "Thank you for registering for the Deccan Throwdown Teams event!",
        "",
        f"Team: {team.team_name}",
        f"Category: {team.category}",
        "",
        "Athletes:",
        *[f"- {entry}" for entry in roster],
        "",
        f"Registration fees are Rs. {fee} per team.",
        "",
        f"Payment link: {payment_link}",
        "",
        "Once payment is processed, we will confirm your participation in the Teams event.",
    ]
    if waiver_links:
        text_lines.extend(
            [
                "",
                "Please fill out a waiver for each athlete, if not already filled:",
                *[f"- {link.athlete_name}: {link.waiver_link}" for link in waiver_links],
            ]
        )
    text_lines.extend(
        [
            "",
            "Reply to this email if you have any questions.",
            "",
            "Train hard, stay humble,",
            "DT Team",
        ]
    )
    return html_body, "\n".join(text_lines)


def _send_registration_message(
    *,
    to: list[str],
    subject: str,
    html_body: str,
    text_body: str,
) -> None:
    params: resend.Emails.SendParams = {
        "from": resend_settings.resend_from_email,
        "to": to,
        "reply_to": registration_settings.registration_cc_list,
        "subject": subject,
        "html": html_body,
        "text": text_body,
    }
    try:
        email_id: resend.Emails.SendResponse = resend.Emails.send(params)
    except Exception:
        log.exception("Registration email failed for %s", ", ".join(to))
        return
    log.info("Sent registration email to %s, email id: %s", ", ".join(to), email_id)


def registration_model_from_team(team: Team) -> TeamRegistrationModel:
    athletes = sorted(team.athletes, key=lambda athlete: athlete.created_at)
    return TeamRegistrationModel(
        team_name=team.team_name,
        category=team.category,
        event_short_name=team.event_short_name,
        athletes=[
            AthleteRegistrationModel(
                first_name=athlete.first_name,
                last_name=athlete.last_name,
                email=athlete.email,
                phone_number=athlete.phone_number,
                sex=athlete.sex,
                date_of_birth=athlete.date_of_birth or date(1900, 1, 1),
                waiver=athlete.waiver,
                gym=athlete.gym,
                city=athlete.city,
            )
            for athlete in athletes
        ],
    )


def send_registration_email_to(
    recipient: str,
    registration_response: TeamRegistrationResponseModel,
    team: TeamRegistrationModel,
) -> None:
    safe_team_name = team.team_name.replace("\r", " ").replace("\n", " ")
    subject = f"DT - Team Registration - {safe_team_name}"
    html_body, text_body = _registration_message(
        registration_response,
        team,
        include_email=False,
    )
    _send_registration_message(
        to=[recipient],
        subject=subject,
        html_body=html_body,
        text_body=text_body,
    )


def send_registration_email(
    registration_response: TeamRegistrationResponseModel, team: TeamRegistrationModel
) -> None:
    safe_team_name = team.team_name.replace("\r", " ").replace("\n", " ")
    subject = f"DT - Team Registration - {safe_team_name}"
    athlete_html, athlete_text = _registration_message(
        registration_response,
        team,
        include_email=False,
    )
    organizer_html, organizer_text = _registration_message(
        registration_response,
        team,
        include_email=True,
    )
    organizer_text = (
        "A separate copy of this email was sent to each athlete.\n\n" + organizer_text
    )
    organizer_html = (
        "<p>A separate copy of this email was sent to each athlete.</p>" + organizer_html
    )

    athlete_emails = list(
        dict.fromkeys(athlete.email for athlete in team.athletes if athlete.email)
    )
    for athlete_email in athlete_emails:
        _send_registration_message(
            to=[athlete_email],
            subject=subject,
            html_body=athlete_html,
            text_body=athlete_text,
        )

    organizers = list(dict.fromkeys(registration_settings.registration_cc_list))
    if organizers:
        _send_registration_message(
            to=organizers,
            subject=subject,
            html_body=organizer_html,
            text_body=organizer_text,
        )
