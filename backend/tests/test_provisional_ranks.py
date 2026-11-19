"""Unit tests for verified-only vs provisional (include unverified) ranking."""

from __future__ import annotations

import unittest
from types import SimpleNamespace
from uuid import uuid4

from app.scores.service import apply_overall_ranks, apply_score_ranks


def _table_rows(field_size: int = 4) -> list[SimpleNamespace]:
    return [
        SimpleNamespace(min_athletes=1, max_athletes=field_size, rank=1, points=100),
        SimpleNamespace(min_athletes=1, max_athletes=field_size, rank=2, points=90),
        SimpleNamespace(min_athletes=1, max_athletes=field_size, rank=3, points=80),
        SimpleNamespace(min_athletes=1, max_athletes=field_size, rank=4, points=70),
    ]


def _score(
    *,
    wod_number: int = 1,
    reps: int | None = None,
    time_s: int | None = None,
    verified: bool = True,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        wod_number=wod_number,
        reps=reps,
        time_s=time_s,
        tiebreak_s=None,
        score_detail=None,
        verified=verified,
        wod_rank=None,
        wod_points=None,
    )


def _team(
    *,
    name: str,
    verified: bool = True,
    category: str = "RX",
    scores: list[SimpleNamespace] | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        team_name=name,
        category=category,
        verified=verified,
        scores=scores or [],
        overall_rank=None,
        overall_points=None,
    )


class ProvisionalRankTests(unittest.TestCase):
    def test_verified_only_excludes_unverified_score_and_team(self) -> None:
        verified_score = _score(reps=100, verified=True)
        unverified_score = _score(reps=200, verified=False)
        verified_team = _team(name="A", verified=True, scores=[verified_score])
        unverified_team = _team(
            name="B", verified=False, scores=[_score(reps=150, verified=True)]
        )
        teams = [verified_team, unverified_team, _team(name="C", scores=[unverified_score])]

        apply_score_ranks(teams, _table_rows(1), 1, include_unverified=False)

        self.assertEqual(verified_score.wod_rank, 1)
        self.assertEqual(verified_score.wod_points, 100)
        self.assertIsNone(unverified_score.wod_rank)
        self.assertIsNone(unverified_team.scores[0].wod_rank)

    def test_provisional_includes_unverified_teams_and_scores(self) -> None:
        low_verified = _score(reps=50, verified=True)
        high_unverified = _score(reps=200, verified=False)
        unverified_team_score = _score(reps=150, verified=True)

        team_a = _team(name="A", verified=True, scores=[low_verified])
        team_b = _team(name="B", verified=True, scores=[high_unverified])
        team_c = _team(name="C", verified=False, scores=[unverified_team_score])
        teams = [team_a, team_b, team_c]

        apply_score_ranks(teams, _table_rows(3), 1, include_unverified=True)

        self.assertEqual(high_unverified.wod_rank, 1)
        self.assertEqual(unverified_team_score.wod_rank, 2)
        self.assertEqual(low_verified.wod_rank, 3)

    def test_provisional_overall_includes_unverified_teams(self) -> None:
        score_a = _score(reps=10, verified=True)
        score_a.wod_points = 70
        score_b = _score(reps=20, verified=False)
        score_b.wod_points = 100
        team_a = _team(name="A", verified=True, scores=[score_a])
        team_b = _team(name="B", verified=False, scores=[score_b])

        apply_overall_ranks([team_a, team_b], include_unverified=True)

        self.assertEqual(team_b.overall_rank, 1)
        self.assertEqual(team_b.overall_points, 100)
        self.assertEqual(team_a.overall_rank, 2)
        self.assertEqual(team_a.overall_points, 70)

    def test_official_overall_skips_unverified_teams(self) -> None:
        score_a = _score(verified=True)
        score_a.wod_points = 70
        score_b = _score(verified=True)
        score_b.wod_points = 100
        team_a = _team(name="A", verified=True, scores=[score_a])
        team_b = _team(name="B", verified=False, scores=[score_b])

        apply_overall_ranks([team_a, team_b], include_unverified=False)

        self.assertEqual(team_a.overall_rank, 1)
        self.assertIsNone(team_b.overall_rank)
        self.assertIsNone(team_b.overall_points)


if __name__ == "__main__":
    unittest.main()
