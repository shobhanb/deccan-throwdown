"""Unit tests for TTMM per-athlete score_detail ranking."""

from __future__ import annotations

import json
import unittest
from types import SimpleNamespace
from uuid import uuid4

from app.scores.detail.registry import (
    ScoreDetailValidationError,
    validate_and_normalize_score_detail,
)
from app.scores.detail.ttmm import rank_ttmm_scores
from app.scores.detail.types import TtmmScoreDetail, validate_ttmm_roster_ids
from app.scores.points import tie_points


def _table_rows(max_rank: int = 12) -> list[SimpleNamespace]:
    """EvenScoringTable-like rows: 100, 90, 80, ... for field sizes 1..max_rank."""
    return [
        SimpleNamespace(
            min_athletes=1,
            max_athletes=max_rank,
            rank=rank,
            points=max(0, 100 - (rank - 1) * 10),
        )
        for rank in range(1, max_rank + 1)
    ]


def _ttmm_json(
    jump_rope: list[tuple[int, int]],
    hold: list[tuple[int, int]],
    yoke: list[int],
    *,
    athlete_ids: list[str] | None = None,
) -> str:
    ids = athlete_ids or [None] * 6

    def timed_athletes(
        pairs: list[tuple[int, int]], id_offset: int
    ) -> list[dict]:
        return [
            {
                "athlete_id": ids[id_offset + index],
                "reps": reps,
                "tiebreak_s": tiebreak,
            }
            for index, (reps, tiebreak) in enumerate(pairs)
        ]

    detail = {
        "type": "ttmm",
        "components": {
            "jump_rope": {"athletes": timed_athletes(jump_rope, 0)},
            "hold": {"athletes": timed_athletes(hold, 2)},
            "yoke": {
                "athletes": [
                    {"athlete_id": ids[4], "reps": yoke[0]},
                    {"athlete_id": ids[5], "reps": yoke[1]},
                ]
            },
        },
    }
    return json.dumps(detail)


def _sheet_scores() -> list[SimpleNamespace]:
    # From DT TTMM math - Sheet1.json (times as seconds)
    return [
        SimpleNamespace(
            name="Team 1",
            score_detail=_ttmm_json(
                jump_rope=[(200, 240), (100, 240)],
                hold=[(100, 180), (100, 120)],
                yoke=[13, 8],
            ),
            wod_rank=None,
            wod_points=None,
        ),
        SimpleNamespace(
            name="Team 2",
            score_detail=_ttmm_json(
                jump_rope=[(250, 180), (100, 240)],
                hold=[(100, 180), (60, 240)],
                yoke=[10, 12],
            ),
            wod_rank=None,
            wod_points=None,
        ),
        SimpleNamespace(
            name="Team 3",
            score_detail=_ttmm_json(
                jump_rope=[(250, 120), (100, 240)],
                hold=[(100, 120), (60, 240)],
                yoke=[10, 9],
            ),
            wod_rank=None,
            wod_points=None,
        ),
        SimpleNamespace(
            name="Team 4",
            score_detail=_ttmm_json(
                jump_rope=[(250, 120), (250, 180)],
                hold=[(70, 240), (60, 240)],
                yoke=[5, 3],
            ),
            wod_rank=None,
            wod_points=None,
        ),
    ]


def _athlete_result(
    detail: TtmmScoreDetail, component: str, slot: int
) -> tuple[int | None, int | None]:
    assert detail.results is not None
    result = getattr(detail.results, component)
    athlete = result.athletes[slot]
    return athlete.rank, athlete.points


class TtmmRankingTests(unittest.TestCase):
    def test_validate_normalizes_and_strips_results(self) -> None:
        raw = _ttmm_json(
            jump_rope=[(250, 120), (250, 180)],
            hold=[(100, 180), (100, 120)],
            yoke=[13, 8],
        )
        parsed = json.loads(raw)
        parsed["results"] = {
            "jump_rope": {
                "athletes": [{"rank": 1, "points": 100}],
                "total_reps": 1,
            },
            "total_component_points": 999,
        }
        normalized = validate_and_normalize_score_detail(json.dumps(parsed))
        assert normalized is not None
        detail = TtmmScoreDetail.model_validate_json(normalized)
        self.assertEqual(detail.type, "ttmm")
        self.assertIsNone(detail.results)

    def test_validate_rejects_unknown_type(self) -> None:
        with self.assertRaises(ScoreDetailValidationError):
            validate_and_normalize_score_detail(
                json.dumps({"type": "not_a_real_type", "components": {}})
            )

    def test_validate_defaults_timed_tiebreak_to_four_minutes(self) -> None:
        raw = json.dumps(
            {
                "type": "ttmm",
                "components": {
                    "jump_rope": {
                        "athletes": [
                            {"reps": 200, "tiebreak_s": None},
                            {"reps": 100, "tiebreak_s": 180},
                        ]
                    },
                    "hold": {
                        "athletes": [
                            {"reps": 60},
                            {"reps": None, "tiebreak_s": None},
                        ]
                    },
                    "yoke": {"athletes": [{"reps": 10}, {"reps": 8}]},
                },
            }
        )
        normalized = validate_and_normalize_score_detail(raw)
        assert normalized is not None
        detail = TtmmScoreDetail.model_validate_json(normalized)
        assert detail.components.jump_rope is not None
        assert detail.components.hold is not None
        self.assertEqual(detail.components.jump_rope.athletes[0].tiebreak_s, 240)
        self.assertEqual(detail.components.jump_rope.athletes[1].tiebreak_s, 180)
        self.assertEqual(detail.components.hold.athletes[0].tiebreak_s, 240)
        self.assertIsNone(detail.components.hold.athletes[1].tiebreak_s)

    def test_validate_ttmm_roster_ids_membership_and_uniqueness(self) -> None:
        a1, a2, a3 = uuid4(), uuid4(), uuid4()
        detail = TtmmScoreDetail.model_validate_json(
            _ttmm_json(
                jump_rope=[(250, 120), (100, 180)],
                hold=[(100, 180), (100, 120)],
                yoke=[13, 8],
                athlete_ids=[str(a1), str(a2), str(a3), str(a1), None, None],
            )
        )
        with self.assertRaises(ValueError):
            validate_ttmm_roster_ids(detail, {a1, a2, a3})

        ok_detail = TtmmScoreDetail.model_validate_json(
            _ttmm_json(
                jump_rope=[(250, 120), (100, 180)],
                hold=[(100, 180), (100, 120)],
                yoke=[13, 8],
                athlete_ids=[str(a1), str(a2), str(a3), None, None, None],
            )
        )
        validate_ttmm_roster_ids(ok_detail, {a1, a2, a3})

        with self.assertRaises(ValueError):
            validate_ttmm_roster_ids(ok_detail, {a1, a2})

    def test_sheet1_athlete_ranks_and_wod_points(self) -> None:
        scores = _sheet_scores()
        by_name = {score.name: score for score in scores}
        table_rows = _table_rows()

        rank_ttmm_scores(
            scores,  # type: ignore[arg-type]
            table_rows,  # type: ignore[arg-type]
            serialize=lambda detail: detail.model_dump_json(),
        )

        # Jump rope field size = 4 teams × 2 = 8:
        # 250@120 → T4.0 / T3.0 rank 1 (95pts)
        # 250@180 → T4.1 / T2.0 rank 3 (75pts)
        # 200@240 → T1.0 rank 5 (60pts)
        # 100@240 → T1.1 / T2.1 / T3.1 rank 6 (40pts)
        expected_jump = {
            "Team 1": [(5, 60), (6, 40)],
            "Team 2": [(3, 75), (6, 40)],
            "Team 3": [(1, 95), (6, 40)],
            "Team 4": [(1, 95), (3, 75)],
        }
        for name, slots in expected_jump.items():
            detail = TtmmScoreDetail.model_validate_json(by_name[name].score_detail)
            for slot, expected in enumerate(slots):
                self.assertEqual(
                    _athlete_result(detail, "jump_rope", slot),
                    expected,
                    f"{name} jump_rope slot {slot}",
                )

        # Hold field size = 4 teams × 2 = 8:
        # 100@120 → T1.1 / T3.0 rank 1 (95)
        # 100@180 → T1.0 / T2.0 rank 3 (75)
        # 70@240 → T4.0 rank 5 (60)
        # 60@240 → T2.1 / T3.1 / T4.1 rank 6 (40)
        expected_hold = {
            "Team 1": [(3, 75), (1, 95)],
            "Team 2": [(3, 75), (6, 40)],
            "Team 3": [(1, 95), (6, 40)],
            "Team 4": [(5, 60), (6, 40)],
        }
        for name, slots in expected_hold.items():
            detail = TtmmScoreDetail.model_validate_json(by_name[name].score_detail)
            for slot, expected in enumerate(slots):
                self.assertEqual(
                    _athlete_result(detail, "hold", slot),
                    expected,
                    f"{name} hold slot {slot}",
                )

        # Yoke field size = 4 teams × 2 = 8:
        # 13 T1.0 → 1 (100)
        # 12 T2.1 → 2 (90)
        # 10 T2.0 / T3.0 → 3 (75)
        # 9 T3.1 → 5 (60)
        # 8 T1.1 → 6 (50)
        # 5 T4.0 → 7 (40)
        # 3 T4.1 → 8 (30)
        expected_yoke = {
            "Team 1": [(1, 100), (6, 50)],
            "Team 2": [(3, 75), (2, 90)],
            "Team 3": [(3, 75), (5, 60)],
            "Team 4": [(7, 40), (8, 30)],
        }
        for name, slots in expected_yoke.items():
            detail = TtmmScoreDetail.model_validate_json(by_name[name].score_detail)
            for slot, expected in enumerate(slots):
                self.assertEqual(
                    _athlete_result(detail, "yoke", slot),
                    expected,
                    f"{name} yoke slot {slot}",
                )

        expected_totals = {
            "Team 1": 60 + 40 + 75 + 95 + 100 + 50,  # 420
            "Team 2": 75 + 40 + 75 + 40 + 75 + 90,  # 395
            "Team 3": 95 + 40 + 95 + 40 + 75 + 60,  # 405
            "Team 4": 95 + 75 + 60 + 40 + 40 + 30,  # 340
        }
        for name, total in expected_totals.items():
            detail = TtmmScoreDetail.model_validate_json(by_name[name].score_detail)
            assert detail.results is not None
            self.assertEqual(detail.results.total_component_points, total)

        self.assertEqual(by_name["Team 1"].wod_rank, 1)
        self.assertEqual(by_name["Team 3"].wod_rank, 2)
        self.assertEqual(by_name["Team 2"].wod_rank, 3)
        self.assertEqual(by_name["Team 4"].wod_rank, 4)

        self.assertEqual(by_name["Team 1"].wod_points, 100)
        self.assertEqual(by_name["Team 3"].wod_points, 90)
        self.assertEqual(by_name["Team 2"].wod_points, 80)
        self.assertEqual(by_name["Team 4"].wod_points, 70)

    def test_partial_partner_still_ranks_entered_athlete(self) -> None:
        table_rows = _table_rows()
        complete = SimpleNamespace(
            name="Complete",
            score_detail=_ttmm_json(
                jump_rope=[(250, 120), (250, 180)],
                hold=[(100, 180), (100, 120)],
                yoke=[13, 8],
            ),
            wod_rank=None,
            wod_points=None,
        )
        partial = SimpleNamespace(
            name="Partial",
            score_detail=json.dumps(
                {
                    "type": "ttmm",
                    "components": {
                        "jump_rope": {
                            "athletes": [
                                {"reps": 200, "tiebreak_s": 240},
                                {"reps": None, "tiebreak_s": None},
                            ]
                        },
                        "hold": {
                            "athletes": [
                                {"reps": 100, "tiebreak_s": 180},
                                {"reps": 100, "tiebreak_s": 120},
                            ]
                        },
                        "yoke": {"athletes": [{"reps": None}, {"reps": None}]},
                    },
                }
            ),
            wod_rank=None,
            wod_points=None,
        )

        rank_ttmm_scores(
            [complete, partial],  # type: ignore[arg-type]
            table_rows,  # type: ignore[arg-type]
            serialize=lambda detail: detail.model_dump_json(),
        )

        complete_detail = TtmmScoreDetail.model_validate_json(complete.score_detail)
        partial_detail = TtmmScoreDetail.model_validate_json(partial.score_detail)
        assert complete_detail.results is not None
        assert partial_detail.results is not None

        self.assertTrue(complete_detail.results.jump_rope.complete)
        self.assertFalse(partial_detail.results.jump_rope.complete)

        # Jump rope: 3 scorable athletes, but field size = 2 teams × 2 = 4
        self.assertEqual(
            _athlete_result(complete_detail, "jump_rope", 0),
            (1, 100),
        )
        self.assertEqual(
            _athlete_result(complete_detail, "jump_rope", 1),
            (2, 90),
        )
        self.assertEqual(
            _athlete_result(partial_detail, "jump_rope", 0),
            (3, 80),
        )
        self.assertIsNone(partial_detail.results.jump_rope.athletes[1].rank)
        self.assertIsNone(partial_detail.results.jump_rope.athletes[1].points)

        # Hold complete for both — field size still 2 teams × 2 = 4
        hold_points = tie_points(table_rows, 4, 1, 2)  # type: ignore[arg-type]
        self.assertEqual(hold_points, 95)
        # Best hold scores are 100@120 (complete slot1, partial slot1)
        self.assertEqual(
            _athlete_result(complete_detail, "hold", 1),
            (1, hold_points),
        )
        self.assertEqual(
            _athlete_result(partial_detail, "hold", 1),
            (1, hold_points),
        )

        self.assertFalse(partial_detail.results.yoke.complete)
        self.assertTrue(
            all(athlete.points is None for athlete in partial_detail.results.yoke.athletes)
        )

    def test_athlete_field_size_is_teams_times_two(self) -> None:
        """Points use teams×2 even when fewer athletes have entered scores."""
        # Distinct tables for field size 3 vs 4 so the choice is observable.
        table_rows = [
            SimpleNamespace(min_athletes=3, max_athletes=3, rank=1, points=30),
            SimpleNamespace(min_athletes=4, max_athletes=4, rank=1, points=40),
            SimpleNamespace(min_athletes=4, max_athletes=4, rank=2, points=35),
            SimpleNamespace(min_athletes=4, max_athletes=4, rank=3, points=30),
            SimpleNamespace(min_athletes=4, max_athletes=4, rank=4, points=25),
        ]
        complete = SimpleNamespace(
            name="Complete",
            score_detail=_ttmm_json(
                jump_rope=[(250, 120), (200, 180)],
                hold=[(100, 180), (100, 120)],
                yoke=[13, 8],
            ),
            wod_rank=None,
            wod_points=None,
        )
        partial = SimpleNamespace(
            name="Partial",
            score_detail=json.dumps(
                {
                    "type": "ttmm",
                    "components": {
                        "jump_rope": {
                            "athletes": [
                                {"reps": 100, "tiebreak_s": 240},
                                {"reps": None, "tiebreak_s": None},
                            ]
                        },
                        "hold": {"athletes": [{"reps": None}, {"reps": None}]},
                        "yoke": {"athletes": [{"reps": None}, {"reps": None}]},
                    },
                }
            ),
            wod_rank=None,
            wod_points=None,
        )

        rank_ttmm_scores(
            [complete, partial],  # type: ignore[arg-type]
            table_rows,  # type: ignore[arg-type]
            serialize=lambda detail: detail.model_dump_json(),
        )

        complete_detail = TtmmScoreDetail.model_validate_json(complete.score_detail)
        # 2 teams × 2 slots → field size 4 → rank 1 gets 40, not the size-3 value 30
        self.assertEqual(
            _athlete_result(complete_detail, "jump_rope", 0),
            (1, 40),
        )


if __name__ == "__main__":
    unittest.main()
