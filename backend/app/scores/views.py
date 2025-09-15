from uuid import UUID

from fastapi import APIRouter, status

from app.database.dependencies import db_dependency
from app.exceptions import conflict_exception

from .models import Score
from .schemas import ScoreCreateModel, ScoreOutputModel, ScoreUpdateModel
from .service import update_ranks

scores_router = APIRouter(prefix="/scores", tags=["scores"])


@scores_router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=ScoreOutputModel,
)
async def get_scores(
    db_session: db_dependency,
    team_id: UUID,
    wod_number: int,
) -> Score:
    return await Score.find_or_raise(
        async_session=db_session,
        team_id=team_id,
        wod_number=wod_number,
    )


@scores_router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ScoreOutputModel,
)
async def create_score(
    db_session: db_dependency,
    score: ScoreCreateModel,
) -> Score:
    score_exists = await Score.find(
        async_session=db_session,
        team_id=score.team_id,
        wod_number=score.wod_number,
    )
    if score_exists:
        raise conflict_exception()

    new_score = Score(
        reps=score.reps,
        time_s=score.time_s,
        tiebreak_s=score.tiebreak_s,
        score_detail=score.score_detail,
        team_id=score.team_id,
        wod_number=score.wod_number,
    )
    db_session.add(new_score)
    await db_session.commit()
    await db_session.refresh(new_score)
    return new_score


@scores_router.patch(
    "/{score_id}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=ScoreOutputModel,
)
async def update_score(
    db_session: db_dependency,
    score_id: UUID,
    update_data: ScoreUpdateModel,
) -> Score:
    score = await Score.find_or_raise(async_session=db_session, select_relationships=[Score.team], id=score_id)

    # Update only the fields that are provided
    update_dict = update_data.model_dump()
    for field, value in update_dict.items():
        setattr(score, field, value)

    db_session.add(score)
    await db_session.commit()
    await db_session.refresh(score)

    await update_ranks(db_session, score.wod_number, score.team.event_short_name)

    return score


@scores_router.patch(
    "/verify/{score_id}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=ScoreOutputModel,
)
async def update_score_verification(
    db_session: db_dependency,
    score_id: UUID,
    verified: bool,  # noqa: FBT001
) -> Score:
    score = await Score.find_or_raise(async_session=db_session, select_relationships=[Score.team], id=score_id)

    score.verified = verified

    db_session.add(score)
    await db_session.commit()
    await db_session.refresh(score)

    await update_ranks(db_session, score.wod_number, score.team.event_short_name)

    return score


@scores_router.delete(
    "/{score_id}",
    status_code=status.HTTP_202_ACCEPTED,
)
async def delete_score(
    db_session: db_dependency,
    score_id: UUID,
) -> None:
    score = await Score.find_or_raise(async_session=db_session, select_relationships=[Score.team], id=score_id)
    await score.delete(async_session=db_session)

    await update_ranks(db_session, score.wod_number, score.team.event_short_name)
