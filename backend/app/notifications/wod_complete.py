import logging
from datetime import UTC, datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.scores.models import Score
from app.teams.models import Team

from .models import WodLeaderboardNotification
from .service import NotificationService

log = logging.getLogger("uvicorn.error")

# score.verified is stored as text ("0"/"1") in SQLite; avoid ORM relationship caches.
_SCORE_VERIFIED = or_(Score.verified == "1", Score.verified.is_(True))


async def is_wod_fully_verified(
    async_session: AsyncSession,
    event_short_name: str,
    wod_number: int,
) -> bool:
    team_count = await async_session.scalar(
        select(func.count()).select_from(Team).where(Team.event_short_name == event_short_name),
    )
    if not team_count:
        return False

    verified_team_count = await async_session.scalar(
        select(func.count(func.distinct(Team.id)))
        .select_from(Team)
        .join(Score, Team.id == Score.team_id)
        .where(
            Team.event_short_name == event_short_name,
            Score.wod_number == wod_number,
            _SCORE_VERIFIED,
        ),
    )
    verified = verified_team_count == team_count
    log.info(
        "WOD %s verification for %s: %s/%s teams",
        wod_number,
        event_short_name,
        verified_team_count,
        team_count,
    )
    return verified


async def sync_wod_leaderboard_notification(
    async_session: AsyncSession,
    event_short_name: str,
    wod_number: int,
) -> None:
    complete = await is_wod_fully_verified(async_session, event_short_name, wod_number)
    existing = await WodLeaderboardNotification.find(
        async_session=async_session,
        event_short_name=event_short_name,
        wod_number=wod_number,
    )

    if not complete:
        if existing:
            await async_session.delete(existing)
            await async_session.commit()
        return

    if existing:
        return

    NotificationService.send_wod_leaderboard_complete(event_short_name, wod_number)
    record = WodLeaderboardNotification(
        event_short_name=event_short_name,
        wod_number=wod_number,
        notified_at=datetime.now(UTC),
    )
    async_session.add(record)
    await async_session.commit()
