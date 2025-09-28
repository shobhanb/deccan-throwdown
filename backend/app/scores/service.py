from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.even_scoring_tables.models import EvenScoringTable
from app.teams.models import Team

from .models import Score


async def update_ranks(
    async_session: AsyncSession,
    event_short_name: str,
    wod_number: int,
) -> None:
    await update_score_ranks(async_session, event_short_name, wod_number)
    await update_overall_ranks(async_session, event_short_name)


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

    # Calculate count of teams in each category
    teams_count_by_category = {}
    for team in teams:
        category = team.category
        if category not in teams_count_by_category:
            teams_count_by_category[category] = 0
        teams_count_by_category[category] += 1

    scores = [score for team in teams for score in team.scores if score.wod_number == wod_number and score.verified]

    # Group scores by team category
    scores_by_category = {}
    for score in scores:
        category = score.team.category
        if category not in scores_by_category:
            scores_by_category[category] = []
        scores_by_category[category].append(score)

    # Rank teams within each category
    for category_scores in scores_by_category.values():
        # Sort scores based on reps (desc), time_s (asc), tiebreak_s (asc)
        sorted_scores = sorted(
            category_scores,
            key=lambda s: (
                s.time_s if s.time_s is not None else float("inf"),
                -(s.reps if s.reps is not None else 0),
                s.tiebreak_s if s.tiebreak_s is not None else float("inf"),
            ),
        )

        # Update ranks with tie handling within this category
        current_rank = 1
        previous_score_key = None

        for i, score in enumerate(sorted_scores):
            # Create a comparison key for the current score
            score_key = (
                score.time_s if score.time_s is not None else float("inf"),
                -(score.reps if score.reps is not None else 0),
                score.tiebreak_s if score.tiebreak_s is not None else float("inf"),
            )

            # If this score is different from the previous one, update the rank
            if previous_score_key is not None and score_key != previous_score_key:
                current_rank = i + 1

            score.wod_rank = current_rank

            scoring_table_stmt = select(EvenScoringTable.points).where(
                (EvenScoringTable.min_athletes <= teams_count_by_category[score.team.category])
                & (EvenScoringTable.max_athletes >= teams_count_by_category[score.team.category])
                & (EvenScoringTable.rank == current_rank),
            )
            scoring_table_points = await async_session.scalar(scoring_table_stmt)
            score.wod_points = scoring_table_points

            async_session.add(score)
            previous_score_key = score_key

    await async_session.commit()


async def update_overall_ranks(async_session: AsyncSession, event_short_name: str) -> None:
    teams = await Team.find_all(async_session=async_session, event_short_name=event_short_name)

    # Group teams by category
    teams_by_category = {}
    for team in teams:
        category = team.category
        if category not in teams_by_category:
            teams_by_category[category] = []
        teams_by_category[category].append(team)

    # Rank teams within each category
    for category_teams in teams_by_category.values():
        # Calculate total points for each team in this category
        team_total_points = []
        for team in category_teams:
            total_points = 0
            scores = await Score.find_all(
                async_session=async_session,
                team_id=team.id,
                verified=True,
            )
            for score in scores:
                if score.wod_points is not None:
                    total_points += score.wod_points

            # Set the overall_points on the team
            team.overall_points = total_points
            team_total_points.append((team, total_points))

        # Sort teams based on total points (desc - higher points is better)
        sorted_teams = sorted(team_total_points, key=lambda tr: tr[1], reverse=True)

        # Update overall ranks with tie handling within this category
        current_rank = 1
        previous_points = None

        for i, (team, total_points) in enumerate(sorted_teams):
            if previous_points is not None and total_points != previous_points:
                current_rank = i + 1

            team.overall_rank = current_rank
            async_session.add(team)
            previous_points = total_points

    await async_session.commit()
