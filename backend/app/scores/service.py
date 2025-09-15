from sqlalchemy.ext.asyncio import AsyncSession

from app.teams.models import Team

from .models import Score


async def update_ranks(
    async_session: AsyncSession,
    wod_number: int,
    event_short_name: str,
) -> None:
    await update_score_ranks(async_session, wod_number)
    await update_overall_ranks(async_session, event_short_name)


async def update_score_ranks(
    async_session: AsyncSession,
    wod_number: int,
) -> None:
    scores = await Score.find_all(
        async_session=async_session,
        select_relationships=[Score.team],
        wod_number=wod_number,
        verified=True,
    )

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
        # Calculate total ranks for each team in this category
        team_total_ranks = []
        for team in category_teams:
            rank_score = 0
            scores = await Score.find_all(
                async_session=async_session,
                team_id=team.id,
                verified=True,
            )
            for score in scores:
                if score.wod_rank is not None:
                    rank_score += score.wod_rank
            team_total_ranks.append((team, rank_score))

        # Sort teams based on rank score (asc - lower total rank is better)
        sorted_teams = sorted(team_total_ranks, key=lambda tr: tr[1])

        # Update overall ranks with tie handling within this category
        current_rank = 1
        previous_rank_score = None

        for i, (team, rank_score) in enumerate(sorted_teams):
            if previous_rank_score is not None and rank_score != previous_rank_score:
                current_rank = i + 1

            team.overall_rank = current_rank
            async_session.add(team)
            previous_rank_score = rank_score

    await async_session.commit()
