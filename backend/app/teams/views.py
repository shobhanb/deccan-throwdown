from collections.abc import Sequence
from uuid import UUID

from fastapi import APIRouter, status

from app.database.dependencies import db_dependency
from app.exceptions import conflict_exception

from .models import Team
from .schemas import TeamsCreateModel, TeamsOutputDetailModel, TeamsOutputModel, TeamsUpdateModel

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
