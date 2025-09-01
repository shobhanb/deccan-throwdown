from collections.abc import Sequence
from uuid import UUID

from fastapi import APIRouter, status

from app.database.dependencies import db_dependency
from app.exceptions import conflict_exception

from .models import Teams
from .schemas import TeamsCreateModel, TeamsOutputModel, TeamsUpdateModel

teams_router = APIRouter(prefix="/teams", tags=["teams"])


@teams_router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=list[TeamsOutputModel],
)
async def get_teams(
    db_session: db_dependency,
    event_id: UUID,
) -> Sequence[Teams]:
    return await Teams.find_all(
        async_session=db_session,
        select_relationships=[Teams.athletes],  # ✅ Add this line
        event_id=event_id,
    )


@teams_router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=TeamsOutputModel,
)
async def create_team(
    db_session: db_dependency,
    team: TeamsCreateModel,
) -> Teams:
    team_exists = await Teams.find(
        async_session=db_session,
        team_name=team.team_name,
        event_id=team.event_id,
    )
    if team_exists:
        raise conflict_exception()

    new_team = Teams(
        category=team.category,
        team_name=team.team_name,
        paid=team.paid,
        verified=team.verified,
        event_id=team.event_id,
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
    team_id: UUID,
    update_data: TeamsUpdateModel,
) -> Teams:
    team = await Teams.find_or_raise(async_session=db_session, id=team_id)

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
    team_id: UUID,
) -> None:
    team = await Teams.find_or_raise(async_session=db_session, id=team_id)
    await team.delete(async_session=db_session)
