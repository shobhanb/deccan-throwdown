from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.even_scoring_tables.models import EvenScoringTable
from app.notifications.wod_complete import sync_wod_leaderboard_notification
from app.scores.models import Score, score_is_verified
from app.teams.models import Team


def _score_sort_key(score: Score) -> tuple[float, float, float]:
    return (
        score.time_s if score.time_s is not None else float("inf"),
        -(score.reps if score.reps is not None else 0),
        score.tiebreak_s if score.tiebreak_s is not None else float("inf"),
    )


def _points_for_rank(
    table_rows: list[EvenScoringTable],
    field_size: int,
    rank: int,
) -> int:
    for row in table_rows:
        if row.min_athletes <= field_size <= row.max_athletes and row.rank == rank:
            return row.points
    return 0


def _tie_points(
    table_rows: list[EvenScoringTable],
    field_size: int,
    start_rank: int,
    tied_count: int,
) -> int:
    if tied_count <= 0:
        return 0
    total = sum(
        _points_for_rank(table_rows, field_size, start_rank + offset)
        for offset in range(tied_count)
    )
    return round(total / tied_count)


async def update_ranks(
    async_session: AsyncSession,
    event_short_name: str,
    wod_number: int,
) -> None:
    await update_score_ranks(async_session, event_short_name, wod_number)
    await update_overall_ranks(async_session, event_short_name)
    await sync_wod_leaderboard_notification(async_session, event_short_name, wod_number)


async def rerank_event(async_session: AsyncSession, event_short_name: str) -> None:
    teams = await Team.find_all(
        async_session=async_session,
        select_relationships=[Team.scores],
        event_short_name=event_short_name,
    )
    wod_numbers = sorted({score.wod_number for team in teams for score in team.scores})
    for wod_number in wod_numbers:
        await update_score_ranks(async_session, event_short_name, wod_number)
    await update_overall_ranks(async_session, event_short_name)
    for wod_number in wod_numbers:
        await sync_wod_leaderboard_notification(async_session, event_short_name, wod_number)


async def update_score_ranks(
    async_session: AsyncSession,
    event_short_name: str,
    wod_number: int,
) -> None:
    teams = await Team.find_all(
        async_session=async_session,
        select_relationships=[Team.scores],
        event_short_name=event_short_name,
    )
    table_rows = list(await async_session.scalars(select(EvenScoringTable)))

    scores_by_category: dict[str, list[Score]] = {}
    for team in teams:
        for score in team.scores:
            if score.wod_number != wod_number:
                continue
            counts_for_rank = team.verified and score_is_verified(score.verified)
            if not counts_for_rank:
                score.wod_rank = None
                score.wod_points = None
                async_session.add(score)
                continue
            scores_by_category.setdefault(team.category, []).append(score)

    for category_scores in scores_by_category.values():
        field_size = len(category_scores)
        sorted_scores = sorted(category_scores, key=_score_sort_key)

        groups: list[tuple[tuple[float, float, float], list[Score]]] = []
        for score in sorted_scores:
            score_key = _score_sort_key(score)
            if groups and groups[-1][0] == score_key:
                groups[-1][1].append(score)
            else:
                groups.append((score_key, [score]))

        current_rank = 1
        for _, tied_scores in groups:
            points = _tie_points(table_rows, field_size, current_rank, len(tied_scores))
            for score in tied_scores:
                score.wod_rank = current_rank
                score.wod_points = points
                async_session.add(score)
            current_rank += len(tied_scores)

    await async_session.commit()


async def update_overall_ranks(async_session: AsyncSession, event_short_name: str) -> None:
    teams = await Team.find_all(
        async_session=async_session,
        select_relationships=[Team.scores],
        event_short_name=event_short_name,
    )

    teams_by_category: dict[str, list[Team]] = {}
    for team in teams:
        if not team.verified:
            team.overall_rank = None
            team.overall_points = None
            async_session.add(team)
            continue
        teams_by_category.setdefault(team.category, []).append(team)

    for category_teams in teams_by_category.values():
        team_total_points: list[tuple[Team, int]] = []
        for team in category_teams:
            total_points = sum(
                score.wod_points
                for score in team.scores
                if score_is_verified(score.verified) and score.wod_points is not None
            )
            team.overall_points = total_points
            team_total_points.append((team, total_points))

        sorted_teams = sorted(team_total_points, key=lambda item: item[1], reverse=True)

        current_rank = 1
        previous_points: int | None = None
        for index, (team, total_points) in enumerate(sorted_teams):
            if previous_points is not None and total_points != previous_points:
                current_rank = index + 1
            team.overall_rank = current_rank
            async_session.add(team)
            previous_points = total_points

    await async_session.commit()
