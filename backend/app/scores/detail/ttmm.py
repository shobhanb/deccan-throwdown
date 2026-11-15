from __future__ import annotations

from collections.abc import Callable, Sequence

from app.even_scoring_tables.models import EvenScoringTable
from app.scores.detail.registry import parse_ttmm_detail
from app.scores.detail.types import (
    TTMM_COMPONENT_KEYS,
    TTMM_TIMED_COMPONENTS,
    TtmmComponentResult,
    TtmmResults,
    TtmmScoreDetail,
    component_is_complete,
    component_totals,
    timed_component_sort_key,
    yoke_component_sort_key,
)
from app.scores.models import Score
from app.scores.points import tie_points


def _assign_competition_ranks(
    items: Sequence[tuple[tuple, Score]],
    table_rows: list[EvenScoringTable],
    field_size: int,
) -> dict[int, tuple[int, int]]:
    """Group by sort key, assign competition ranks and EvenScoringTable points.

    Returns a map of id(score) -> (rank, points).
    """
    groups: list[tuple[tuple, list[Score]]] = []
    for key, score in items:
        if groups and groups[-1][0] == key:
            groups[-1][1].append(score)
        else:
            groups.append((key, [score]))

    assigned: dict[int, tuple[int, int]] = {}
    current_rank = 1
    for _, tied_scores in groups:
        points = tie_points(table_rows, field_size, current_rank, len(tied_scores))
        for score in tied_scores:
            assigned[id(score)] = (current_rank, points)
        current_rank += len(tied_scores)
    return assigned


def _component_sort_entries(
    scores_with_detail: list[tuple[Score, TtmmScoreDetail]],
    component_key: str,
) -> list[tuple[tuple, Score]]:
    timed = component_key in TTMM_TIMED_COMPONENTS
    entries: list[tuple[tuple, Score]] = []
    for score, detail in scores_with_detail:
        component = getattr(detail.components, component_key)
        if not component_is_complete(component, timed=timed):
            continue
        total_reps, total_tiebreak = component_totals(component, timed=timed)
        assert total_reps is not None
        if timed:
            assert total_tiebreak is not None
            key = timed_component_sort_key(total_reps, total_tiebreak)
        else:
            key = yoke_component_sort_key(total_reps)
        entries.append((key, score))
    entries.sort(key=lambda item: item[0])
    return entries


def rank_ttmm_scores(
    scores: list[Score],
    table_rows: list[EvenScoringTable],
    *,
    serialize: Callable[[TtmmScoreDetail], str],
) -> None:
    """Rank TTMM scores in-place: component ranks → wod_rank → EvenScoringTable wod_points.

    Incomplete components are stored for display but excluded from that component's ranking.
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
    component_assignments: dict[str, dict[int, tuple[int, int]]] = {}
    for component_key in TTMM_COMPONENT_KEYS:
        entries = _component_sort_entries(scores_with_detail, component_key)
        if not entries:
            component_assignments[component_key] = {}
            continue
        component_assignments[component_key] = _assign_competition_ranks(
            entries,
            table_rows,
            field_size=len(entries),
        )

    totals: list[tuple[Score, int, TtmmScoreDetail]] = []
    for score, detail in scores_with_detail:
        result_fields: dict[str, TtmmComponentResult] = {}
        total_component_points = 0
        for component_key in TTMM_COMPONENT_KEYS:
            component = getattr(detail.components, component_key)
            timed = component_key in TTMM_TIMED_COMPONENTS
            total_reps, total_tiebreak = component_totals(component, timed=timed)
            complete = component_is_complete(component, timed=timed)
            if complete and id(score) in component_assignments[component_key]:
                rank, points = component_assignments[component_key][id(score)]
                total_component_points += points
            else:
                rank, points = None, None
            result_fields[component_key] = TtmmComponentResult(
                total_reps=total_reps,
                total_tiebreak_s=total_tiebreak,
                rank=rank,
                points=points,
                complete=complete,
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
    wod_entries: list[tuple[tuple, Score]] = [
        ((-total_points,), score) for score, total_points, _ in totals
    ]
    wod_assigned = _assign_competition_ranks(
        wod_entries, table_rows, overall_field_size
    )
    for score, _, _ in totals:
        rank, points = wod_assigned[id(score)]
        score.wod_rank = rank
        score.wod_points = points
