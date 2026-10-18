import logging
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependencies import db_dependency
from app.firebase_auth.dependencies import admin_user_dependency
from app.teams.models import Team
from app.teams.schemas import TeamRegistrationModel, TeamRegistrationResponseModel
from app.teams.views import (
    get_payment_link,
    get_waiver_links,
    registration_model_from_team,
    send_registration_email_to,
)

from .models import Athlete
from .schemas import AthleteCreateModel, AthleteOutputModel, AthleteUpdateModel

log = logging.getLogger("uvicorn.error")

athletes_router = APIRouter(prefix="/athletes", tags=["athletes"])


@athletes_router.get(
    "/{athlete_id}",
    status_code=status.HTTP_200_OK,
    response_model=AthleteOutputModel,
)
async def get_athlete(
    db_session: db_dependency,
    _: admin_user_dependency,
    athlete_id: UUID,
) -> Athlete:
    return await Athlete.find_or_raise(async_session=db_session, id=athlete_id)


@athletes_router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=AthleteOutputModel,
)
async def create_athlete(
    db_session: db_dependency,
    _: admin_user_dependency,
    athlete: AthleteCreateModel,
) -> Athlete:
    new_athlete = Athlete(**athlete.model_dump())
    db_session.add(new_athlete)
    await db_session.commit()
    await db_session.refresh(new_athlete)
    return new_athlete


@athletes_router.patch(
    "/{athlete_id}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=AthleteOutputModel,
)
async def update_athlete(
    db_session: db_dependency,
    _: admin_user_dependency,
    athlete_id: UUID,
    update_data: AthleteUpdateModel,
    background_tasks: BackgroundTasks,
    send_registration_email: bool = False,
) -> Athlete:
    athlete = await Athlete.find_or_raise(async_session=db_session, id=athlete_id)
    previous_email = _normalized_email(athlete.email)

    # Update only the fields that are provided
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(athlete, field, value)
    if "email" in update_dict and isinstance(athlete.email, str):
        athlete.email = athlete.email.strip() or None

    new_email = (athlete.email or "").strip()
    email_changed = bool(new_email) and _normalized_email(new_email) != previous_email

    db_session.add(athlete)
    await db_session.commit()
    await db_session.refresh(athlete)

    if send_registration_email and email_changed:
        await _queue_registration_email(db_session, background_tasks, athlete)

    return athlete


@athletes_router.delete(
    "/{athlete_id}",
    status_code=status.HTTP_202_ACCEPTED,
)
async def delete_athlete(
    db_session: db_dependency,
    _: admin_user_dependency,
    athlete_id: UUID,
) -> None:
    athlete = await Athlete.find_or_raise(
        async_session=db_session,
        id=athlete_id,
    )
    await athlete.delete(async_session=db_session)


def _normalized_email(value: str | None) -> str:
    return (value or "").strip().lower()


async def _queue_registration_email(
    db_session: AsyncSession,
    background_tasks: BackgroundTasks,
    athlete: Athlete,
) -> None:
    try:
        registration_email = await _registration_email_for_athlete(db_session, athlete)
    except Exception:
        log.exception(
            "Could not prepare registration email for athlete %s",
            athlete.id,
        )
        return

    if registration_email is None:
        return

    recipient, registration_response, registration = registration_email
    background_tasks.add_task(
        send_registration_email_to,
        recipient,
        registration_response,
        registration,
    )


async def _registration_email_for_athlete(
    db_session: AsyncSession,
    athlete: Athlete,
) -> tuple[str, TeamRegistrationResponseModel, TeamRegistrationModel] | None:
    recipient = (athlete.email or "").strip()
    if not recipient:
        return None

    team = await Team.find_or_raise(
        async_session=db_session,
        id=athlete.team_id,
        select_relationships=[Team.athletes],
    )
    if not team.athletes:
        log.warning(
            "Skipped registration email for %s because team %s has no athletes",
            recipient,
            team.id,
        )
        return None

    registration = registration_model_from_team(team)
    registration_response = TeamRegistrationResponseModel(
        payment_link=get_payment_link(registration),
        waiver_links=get_waiver_links(registration),
    )
    return recipient, registration_response, registration
