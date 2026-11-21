from __future__ import annotations

from collections.abc import Callable, Hashable, Sequence

from app.even_scoring_tables.models import EvenScoringTable
from app.scores.detail.registry import parse_ttmm_detail
from app.scores.detail.types import (
    TTMM_COMPONENT_KEYS,
    TTMM_TIMED_COMPONENTS,
    TtmmAthleteResult,
    TtmmAthleteScore,
    TtmmComponentResult,
    TtmmResults,
    TtmmScoreDetail,
    athlete_is_scorable,
    component_is_complete,
    component_totals,
    timed_component_sort_key,
    yoke_component_sort_key,
)
from app.scores.models import Score
from app.scores.points import tie_points


def _assign_competition_ranks(
    items: Sequence[tuple[tuple, Hashable]],
    table_rows: list[EvenScoringTable],
    field_size: int,
) -> dict[Hashable, tuple[int, int]]:
    """Group by sort key, assign competition ranks and EvenScoringTable points.

    Returns a map of entry_id -> (rank, points).
    """
    groups: list[tuple[tuple, list[Hashable]]] = []
    for key, entry_id in items:
        if groups and groups[-1][0] == key:
            groups[-1][1].append(entry_id)
        else:
            groups.append((key, [entry_id]))

    assigned: dict[Hashable, tuple[int, int]] = {}
    current_rank = 1
    for _, tied_ids in groups:
        points = tie_points(table_rows, field_size, current_rank, len(tied_ids))
        for entry_id in tied_ids:
            assigned[entry_id] = (current_rank, points)
        current_rank += len(tied_ids)
    return assigned


def _athlete_sort_key(athlete: TtmmAthleteScore, *, timed: bool) -> tuple:
    assert athlete.reps is not None
    if timed:
        assert athlete.tiebreak_s is not None
        return timed_component_sort_key(athlete.reps, athlete.tiebreak_s)
    return yoke_component_sort_key(athlete.reps)


def _component_athlete_entries(
    scores_with_detail: list[tuple[Score, TtmmScoreDetail]],
    component_key: str,
) -> list[tuple[tuple, tuple[int, int]]]:
    """Build (sort_key, (score_object_id, slot_index)) for scorable athletes."""
    timed = component_key in TTMM_TIMED_COMPONENTS
    entries: list[tuple[tuple, tuple[int, int]]] = []
    for score, detail in scores_with_detail:
        component = getattr(detail.components, component_key)
        athletes = list(component.athletes) if component else []
        while len(athletes) < 2:
            athletes.append(TtmmAthleteScore())
        athletes = athletes[:2]
        for slot_index, athlete in enumerate(athletes):
            if not athlete_is_scorable(athlete, timed=timed):
                continue
            entries.append(
                (
                    _athlete_sort_key(athlete, timed=timed),
                    (id(score), slot_index),
                )
            )
    entries.sort(key=lambda item: item[0])
    return entries


def rank_ttmm_scores(
    scores: list[Score],
    table_rows: list[EvenScoringTable],
    *,
    serialize: Callable[[TtmmScoreDetail], str],
) -> None:
    """Rank TTMM scores in-place: athlete component ranks → wod_rank → wod_points.

    Each scorable athlete is ranked within their component. EvenScoringTable field
    size is teams_in_category × 2 (two athlete slots per component). Team WOD
    points are the sum of those athlete points. Incomplete partner slots do not
    block ranking.
    """
    scores_with_detail: list[tuple[Score, TtmmScoreDetail]] = []
    for score in scores:
        detail = parse_ttmm_detail(score.score_detail)
        if detail is None:
            score.wod_rank = None
            score.wod_points = None
            continue
        scores_with_detail.append((score, detail))

    if not scores_with_detail:
        return

    overall_field_size = len(scores_with_detail)
    # Two athlete slots per component; points table uses full category capacity.
    athlete_field_size = overall_field_size * 2
    component_assignments: dict[str, dict[tuple[int, int], tuple[int, int]]] = {}
    for component_key in TTMM_COMPONENT_KEYS:
        entries = _component_athlete_entries(scores_with_detail, component_key)
        if not entries:
            component_assignments[component_key] = {}
            continue
        component_assignments[component_key] = _assign_competition_ranks(
            entries,
            table_rows,
            field_size=athlete_field_size,
        )

    totals: list[tuple[Score, int, TtmmScoreDetail]] = []
    for score, detail in scores_with_detail:
        result_fields: dict[str, TtmmComponentResult] = {}
        total_component_points = 0
        for component_key in TTMM_COMPONENT_KEYS:
            component = getattr(detail.components, component_key)
            timed = component_key in TTMM_TIMED_COMPONENTS
            athletes = list(component.athletes) if component else []
            while len(athletes) < 2:
                athletes.append(TtmmAthleteScore())
            athletes = athletes[:2]

            athlete_results: list[TtmmAthleteResult] = []
            for slot_index, athlete in enumerate(athletes):
                rank: int | None = None
                points: int | None = None
                if athlete_is_scorable(athlete, timed=timed):
                    assigned = component_assignments[component_key].get(
                        (id(score), slot_index)
                    )
                    if assigned is not None:
                        rank, points = assigned
                        total_component_points += points
                athlete_results.append(
                    TtmmAthleteResult(
                        athlete_id=athlete.athlete_id,
                        reps=athlete.reps,
                        tiebreak_s=athlete.tiebreak_s if timed else None,
                        rank=rank,
                        points=points,
                    )
                )

            total_reps, total_tiebreak = component_totals(component, timed=timed)
            result_fields[component_key] = TtmmComponentResult(
                athletes=athlete_results,
                total_reps=total_reps,
                total_tiebreak_s=total_tiebreak,
                complete=component_is_complete(component, timed=timed),
            )

        detail.results = TtmmResults(
            jump_rope=result_fields["jump_rope"],
            hold=result_fields["hold"],
            yoke=result_fields["yoke"],
            total_component_points=total_component_points,
        )
        score.score_detail = serialize(detail)
        totals.append((score, total_component_points, detail))

    totals.sort(key=lambda item: -item[1])
    wod_entries: list[tuple[tuple, Hashable]] = [
        ((-total_points,), id(score)) for score, total_points, _ in totals
    ]
    wod_assigned = _assign_competition_ranks(
        wod_entries, table_rows, overall_field_size
    )
    for score, _, _ in totals:
        rank, points = wod_assigned[id(score)]
        score.wod_rank = rank
        score.wod_points = points
