from collections.abc import Sequence
from uuid import UUID

from fastapi import APIRouter, status

from app.database.dependencies import db_dependency
from app.exceptions import conflict_exception

from .models import Score
from .schemas import ScoresCreateModel, ScoresOutputModel, ScoresUpdateModel

scores_router = APIRouter(prefix="/scores", tags=["scores"])


@scores_router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=list[ScoresOutputModel],
)
async def get_scores(
    db_session: db_dependency,
    team_id: UUID | None = None,
    wod_id: UUID | None = None,
) -> Sequence[Score]:
    filters = {}
    if team_id:
        filters["team_id"] = team_id
    if wod_id:
        filters["wod_id"] = wod_id

    return await Score.find_all(
        async_session=db_session,
        **filters,
    )


@scores_router.get(
    "/{score_id}",
    status_code=status.HTTP_200_OK,
    response_model=ScoresOutputModel,
)
async def get_score(
    db_session: db_dependency,
    score_id: UUID,
) -> Score:
    return await Score.find_or_raise(async_session=db_session, id=score_id)


@scores_router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ScoresOutputModel,
)
async def create_score(
    db_session: db_dependency,
    score: ScoresCreateModel,
) -> Score:
    score_exists = await Score.find(
        async_session=db_session,
        team_id=score.team_id,
        wod_id=score.wod_id,
    )
    if score_exists:
        raise conflict_exception()

    new_score = Score(
        reps=score.reps,
        time_s=score.time_s,
        tiebreak_s=score.tiebreak_s,
        score_detail=score.score_detail,
        team_id=score.team_id,
        wod_id=score.wod_id,
    )
    db_session.add(new_score)
    await db_session.commit()
    await db_session.refresh(new_score)
    return new_score


@scores_router.patch(
    "/{score_id}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=ScoresOutputModel,
)
async def update_score(
    db_session: db_dependency,
    score_id: UUID,
    update_data: ScoresUpdateModel,
) -> Score:
    score = await Score.find_or_raise(async_session=db_session, id=score_id)

    # Update only the fields that are provided
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(score, field, value)

    db_session.add(score)
    await db_session.commit()
    await db_session.refresh(score)
    return score


@scores_router.delete(
    "/{score_id}",
    status_code=status.HTTP_202_ACCEPTED,
)
async def delete_score(
    db_session: db_dependency,
    score_id: UUID,
) -> None:
    score = await Score.find_or_raise(async_session=db_session, id=score_id)
    await score.delete(async_session=db_session)
