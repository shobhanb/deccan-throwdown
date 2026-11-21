from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.athletes.models import Athlete
from app.database.dependencies import db_dependency
from app.exceptions import conflict_exception
from app.firebase_auth.dependencies import admin_user_dependency
from app.scores.detail.registry import parse_ttmm_detail
from app.scores.detail.types import validate_ttmm_roster_ids

from .models import Score
from .schemas import ScoreCreateModel, ScoreOutputModel, ScoreUpdateModel
from .service import update_ranks

scores_router = APIRouter(prefix="/scores", tags=["scores"])


async def _assert_ttmm_roster_ids(
    db_session: AsyncSession,
    *,
    team_id: UUID,
    score_detail: str | None,
) -> None:
    detail = parse_ttmm_detail(score_detail)
    if detail is None:
        return
    athletes = await Athlete.find_all(async_session=db_session, team_id=team_id)
    try:
        validate_ttmm_roster_ids(detail, {athlete.id for athlete in athletes})
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


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
    _: admin_user_dependency,
    score: ScoreCreateModel,
) -> Score:
    score_exists = await Score.find(
        async_session=db_session,
        team_id=score.team_id,
        wod_number=score.wod_number,
    )
    if score_exists:
        raise conflict_exception()

    await _assert_ttmm_roster_ids(
        db_session,
        team_id=score.team_id,
        score_detail=score.score_detail,
    )

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
    _: admin_user_dependency,
    score_id: UUID,
    update_data: ScoreUpdateModel,
) -> Score:
    score = await Score.find_or_raise(
        async_session=db_session, select_relationships=[Score.team], id=score_id
    )

    # Update only the fields that are provided
    update_dict = update_data.model_dump(exclude_unset=True)
    next_detail = update_dict.get("score_detail", score.score_detail)
    if "score_detail" in update_dict:
        await _assert_ttmm_roster_ids(
            db_session,
            team_id=score.team_id,
            score_detail=next_detail,
        )

    for field, value in update_dict.items():
        setattr(score, field, value)

    db_session.add(score)
    await db_session.commit()

    await update_ranks(
        async_session=db_session,
        event_short_name=score.team.event_short_name,
        wod_number=score.wod_number,
    )

    return score


@scores_router.patch(
    "/verify/{score_id}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=ScoreOutputModel,
)
async def update_score_verification(
    db_session: db_dependency,
    _: admin_user_dependency,
    score_id: UUID,
    verified: bool,
) -> Score:
    score = await Score.find_or_raise(
        async_session=db_session, select_relationships=[Score.team], id=score_id
    )

    score.verified = verified

    db_session.add(score)
    await db_session.commit()

    await update_ranks(
        async_session=db_session,
        event_short_name=score.team.event_short_name,
        wod_number=score.wod_number,
    )
    await db_session.refresh(score)

    return score


@scores_router.delete(
    "/{score_id}",
    status_code=status.HTTP_202_ACCEPTED,
)
async def delete_score(
    db_session: db_dependency,
    _: admin_user_dependency,
    score_id: UUID,
) -> None:
    score = await Score.find_or_raise(
        async_session=db_session, select_relationships=[Score.team], id=score_id
    )
    event_short_name = score.team.event_short_name
    wod_number = score.wod_number
    await score.delete(async_session=db_session)

    await update_ranks(
        async_session=db_session,
        event_short_name=event_short_name,
        wod_number=wod_number,
    )


@scores_router.put("/update-ranks", status_code=status.HTTP_200_OK)
async def update_event_ranks(
    db_session: db_dependency,
    _: admin_user_dependency,
    event_short_name: str,
    wod_number: int,
) -> None:
    await update_ranks(
        async_session=db_session,
        event_short_name=event_short_name,
        wod_number=wod_number,
    )
