from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.teams.models import Team

from .models import WodLeaderboardNotification
from .service import NotificationService


async def is_wod_fully_verified(
    async_session: AsyncSession,
    event_short_name: str,
    wod_number: int,
) -> bool:
    teams = await Team.find_all(
        async_session=async_session,
        select_relationships=[Team.scores],
        event_short_name=event_short_name,
    )
    if not teams:
        return False

    for team in teams:
        score = next((s for s in team.scores if s.wod_number == wod_number), None)
        if score is None or not score.verified:
            return False
    return True


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
