from uuid import UUID

from fastapi import APIRouter, status

from app.database.dependencies import db_dependency
from app.exceptions import conflict_exception

from .models import Athlete
from .schemas import AthleteCreateModel, AthleteOutputModel, AthleteUpdateModel

athletes_router = APIRouter(prefix="/athletes", tags=["athletes"])


@athletes_router.get(
    "/{athlete_id}",
    status_code=status.HTTP_200_OK,
    response_model=AthleteOutputModel,
)
async def get_athlete(
    db_session: db_dependency,
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
    athlete: AthleteCreateModel,
) -> Athlete:
    athlete_exists = await Athlete.find(async_session=db_session, email=athlete.email)
    if athlete_exists:
        raise conflict_exception()

    new_athlete = Athlete(
        first_name=athlete.first_name,
        last_name=athlete.last_name,
        email=athlete.email,
        waiver=athlete.waiver,
        gym=athlete.gym,
        city=athlete.city,
        sex=athlete.sex,
        team_id=athlete.team_id,
    )
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
    athlete_id: UUID,
    update_data: AthleteUpdateModel,
) -> Athlete:
    athlete = await Athlete.find_or_raise(async_session=db_session, id=athlete_id)

    # Update only the fields that are provided
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(athlete, field, value)

    db_session.add(athlete)
    await db_session.commit()
    await db_session.refresh(athlete)
    return athlete


@athletes_router.delete(
    "/{athlete_id}",
    status_code=status.HTTP_202_ACCEPTED,
)
async def delete_athlete(
    db_session: db_dependency,
    athlete_id: UUID,
) -> None:
    athlete = await Athlete.find_or_raise(
        async_session=db_session,
        id=athlete_id,
    )
    await athlete.delete(async_session=db_session)
