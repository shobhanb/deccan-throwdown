from __future__ import annotations

from app.even_scoring_tables.models import EvenScoringTable


def points_for_rank(
    table_rows: list[EvenScoringTable],
    field_size: int,
    rank: int,
) -> int:
    for row in table_rows:
        if row.min_athletes <= field_size <= row.max_athletes and row.rank == rank:
            return row.points
    return 0


def tie_points(
    table_rows: list[EvenScoringTable],
    field_size: int,
    start_rank: int,
    tied_count: int,
) -> int:
    if tied_count <= 0:
        return 0
    total = sum(
        points_for_rank(table_rows, field_size, start_rank + offset)
        for offset in range(tied_count)
    )
    return round(total / tied_count)
