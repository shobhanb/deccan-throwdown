from collections.abc import AsyncIterator, Sequence
from contextlib import asynccontextmanager

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.even_scoring_tables.models import EvenScoringTable
from app.notifications.wod_complete import sync_wod_leaderboard_notification
from app.scores.detail import detail_affects_ranking, rank_ttmm_scores
from app.scores.detail.types import TtmmScoreDetail
from app.scores.models import Score, score_is_verified
from app.scores.points import points_for_rank, tie_points
from app.teams.models import Team

# Re-export for any existing imports / tests
_points_for_rank = points_for_rank
_tie_points = tie_points


def _score_sort_key(score: Score) -> tuple[float, float, float]:
    return (
        score.time_s if score.time_s is not None else float("inf"),
        -(score.reps if score.reps is not None else 0),
        score.tiebreak_s if score.tiebreak_s is not None else float("inf"),
    )


def _serialize_ttmm_detail(detail: TtmmScoreDetail) -> str:
    return detail.model_dump_json()


def _score_counts_for_rank(
    team: Team,
    score: Score,
    *,
    include_unverified: bool,
) -> bool:
    if include_unverified:
        return True
    return bool(team.verified) and score_is_verified(score.verified)


def apply_score_ranks(
    teams: Sequence[Team],
    table_rows: list[EvenScoringTable],
    wod_number: int,
    *,
    include_unverified: bool = False,
) -> None:
    """Rank scores for one WOD in-place. Does not commit."""
    scores_by_category: dict[str, list[Score]] = {}
    for team in teams:
        for score in team.scores:
            if score.wod_number != wod_number:
                continue
            if not _score_counts_for_rank(
                team, score, include_unverified=include_unverified
            ):
                score.wod_rank = None
                score.wod_points = None
                continue
            scores_by_category.setdefault(team.category, []).append(score)

    for category_scores in scores_by_category.values():
        ttmm_scores = [
            score for score in category_scores if detail_affects_ranking(score.score_detail)
        ]
        flat_scores = [
            score
            for score in category_scores
            if not detail_affects_ranking(score.score_detail)
        ]

        if ttmm_scores:
            rank_ttmm_scores(
                ttmm_scores,
                table_rows,
                serialize=_serialize_ttmm_detail,
            )

        if flat_scores:
            _rank_flat_scores(flat_scores, table_rows)


def apply_overall_ranks(
    teams: Sequence[Team],
    *,
    include_unverified: bool = False,
) -> None:
    """Assign overall ranks in-place from current score points. Does not commit."""
    teams_by_category: dict[str, list[Team]] = {}
    for team in teams:
        if not include_unverified and not team.verified:
            team.overall_rank = None
            team.overall_points = None
            continue
        teams_by_category.setdefault(team.category, []).append(team)

    for category_teams in teams_by_category.values():
        team_total_points: list[tuple[Team, int]] = []
        for team in category_teams:
            total_points = sum(
                score.wod_points
                for score in team.scores
                if score.wod_points is not None
                and (
                    include_unverified
                    or score_is_verified(score.verified)
                )
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
            previous_points = total_points


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


def _rank_flat_scores(
    category_scores: list[Score],
    table_rows: list[EvenScoringTable],
) -> None:
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
        points = tie_points(table_rows, field_size, current_rank, len(tied_scores))
        for score in tied_scores:
            score.wod_rank = current_rank
            score.wod_points = points
        current_rank += len(tied_scores)


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

    apply_score_ranks(
        teams,
        table_rows,
        wod_number,
        include_unverified=False,
    )
    for team in teams:
        for score in team.scores:
            if score.wod_number == wod_number:
                async_session.add(score)

    await async_session.commit()


async def update_overall_ranks(async_session: AsyncSession, event_short_name: str) -> None:
    teams = await Team.find_all(
        async_session=async_session,
        select_relationships=[Team.scores],
        event_short_name=event_short_name,
    )

    apply_overall_ranks(teams, include_unverified=False)
    for team in teams:
        async_session.add(team)

    await async_session.commit()


@asynccontextmanager
async def provisional_leaderboard_teams(
    async_session: AsyncSession,
    event_short_name: str,
) -> AsyncIterator[list[Team]]:
    """Yield teams ranked with unverified included; restore DB values on exit.

    Does not commit. Caller must serialize while inside the context.
    """
    teams = await Team.find_all(
        async_session=async_session,
        select_relationships=[Team.athletes, Team.scores],
        event_short_name=event_short_name,
    )
    table_rows = list(await async_session.scalars(select(EvenScoringTable)))

    score_snapshots = {
        id(score): (score.wod_rank, score.wod_points, score.score_detail)
        for team in teams
        for score in team.scores
    }
    team_snapshots = {
        id(team): (team.overall_rank, team.overall_points) for team in teams
    }

    wod_numbers = sorted(
        {score.wod_number for team in teams for score in team.scores}
    )
    for wod_number in wod_numbers:
        apply_score_ranks(
            teams,
            table_rows,
            wod_number,
            include_unverified=True,
        )
    apply_overall_ranks(teams, include_unverified=True)

    try:
        yield list(teams)
    finally:
        for team in teams:
            overall_rank, overall_points = team_snapshots[id(team)]
            team.overall_rank = overall_rank
            team.overall_points = overall_points
            for score in team.scores:
                wod_rank, wod_points, score_detail = score_snapshots[id(score)]
                score.wod_rank = wod_rank
                score.wod_points = wod_points
                score.score_detail = score_detail
