"""Unit tests for TTMM score_detail ranking (Sheet1.json example)."""

from __future__ import annotations

import json
import unittest
from types import SimpleNamespace

from app.scores.detail.registry import (
    ScoreDetailValidationError,
    validate_and_normalize_score_detail,
)
from app.scores.detail.ttmm import rank_ttmm_scores
from app.scores.detail.types import TtmmScoreDetail
from app.scores.points import tie_points


def _table_rows_for_field_size_4() -> list[SimpleNamespace]:
    """EvenScoringTable-like rows matching sheet points: 100/90/80/70."""
    return [
        SimpleNamespace(min_athletes=1, max_athletes=4, rank=1, points=100),
        SimpleNamespace(min_athletes=1, max_athletes=4, rank=2, points=90),
        SimpleNamespace(min_athletes=1, max_athletes=4, rank=3, points=80),
        SimpleNamespace(min_athletes=1, max_athletes=4, rank=4, points=70),
    ]


def _ttmm_json(
    jump_rope: list[tuple[int, int]],
    hold: list[tuple[int, int]],
    yoke: list[int],
) -> str:
    detail = {
        "type": "ttmm",
        "components": {
            "jump_rope": {
                "athletes": [
                    {"reps": jump_rope[0][0], "tiebreak_s": jump_rope[0][1]},
                    {"reps": jump_rope[1][0], "tiebreak_s": jump_rope[1][1]},
                ]
            },
            "hold": {
                "athletes": [
                    {"reps": hold[0][0], "tiebreak_s": hold[0][1]},
                    {"reps": hold[1][0], "tiebreak_s": hold[1][1]},
                ]
            },
            "yoke": {
                "athletes": [
                    {"reps": yoke[0]},
                    {"reps": yoke[1]},
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


class TtmmRankingTests(unittest.TestCase):
    def test_validate_normalizes_and_strips_results(self) -> None:
        raw = _ttmm_json(
            jump_rope=[(250, 120), (250, 180)],
            hold=[(100, 180), (100, 120)],
            yoke=[13, 8],
        )
        parsed = json.loads(raw)
        parsed["results"] = {
            "jump_rope": {"total_reps": 1, "rank": 1, "points": 100},
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

    def test_sheet1_component_ranks_and_wod_points(self) -> None:
        scores = _sheet_scores()
        by_name = {score.name: score for score in scores}
        table_rows = _table_rows_for_field_size_4()

        rank_ttmm_scores(
            scores,  # type: ignore[arg-type]
            table_rows,  # type: ignore[arg-type]
            serialize=lambda detail: detail.model_dump_json(),
        )

        # Component ranks from sheet
        expected_components = {
            "Team 1": {"jump_rope": (4, 70), "hold": (1, 100), "yoke": (2, 90)},
            "Team 2": {"jump_rope": (3, 80), "hold": (3, 80), "yoke": (1, 100)},
            "Team 3": {"jump_rope": (2, 90), "hold": (2, 90), "yoke": (3, 80)},
            "Team 4": {"jump_rope": (1, 100), "hold": (4, 70), "yoke": (4, 70)},
        }
        expected_totals = {
            "Team 1": 260,
            "Team 2": 260,
            "Team 3": 260,
            "Team 4": 240,
        }

        for name, components in expected_components.items():
            detail = TtmmScoreDetail.model_validate_json(by_name[name].score_detail)
            assert detail.results is not None
            self.assertEqual(
                detail.results.total_component_points, expected_totals[name]
            )
            for key, (rank, points) in components.items():
                result = getattr(detail.results, key)
                self.assertEqual(result.rank, rank, f"{name} {key} rank")
                self.assertEqual(result.points, points, f"{name} {key} points")

        # WOD rank from component totals; tied teams 1-3 share rank 1
        self.assertEqual(by_name["Team 1"].wod_rank, 1)
        self.assertEqual(by_name["Team 2"].wod_rank, 1)
        self.assertEqual(by_name["Team 3"].wod_rank, 1)
        self.assertEqual(by_name["Team 4"].wod_rank, 4)

        # Final wod_points from EvenScoringTable (tie average for ranks 1-3)
        tied_points = tie_points(table_rows, 4, 1, 3)  # type: ignore[arg-type]
        self.assertEqual(tied_points, 90)
        self.assertEqual(by_name["Team 1"].wod_points, tied_points)
        self.assertEqual(by_name["Team 2"].wod_points, tied_points)
        self.assertEqual(by_name["Team 3"].wod_points, tied_points)
        self.assertEqual(by_name["Team 4"].wod_points, 70)

    def test_partial_component_excluded_from_component_rank(self) -> None:
        table_rows = _table_rows_for_field_size_4()
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
        self.assertIsNone(partial_detail.results.jump_rope.rank)
        self.assertIsNone(partial_detail.results.jump_rope.points)

        # Hold is complete for both — tied totals → shared rank 1, averaged points
        self.assertEqual(complete_detail.results.hold.rank, 1)
        self.assertEqual(partial_detail.results.hold.rank, 1)
        hold_points = tie_points(table_rows, 2, 1, 2)  # type: ignore[arg-type]
        self.assertEqual(hold_points, 95)
        self.assertEqual(complete_detail.results.hold.points, hold_points)
        self.assertEqual(partial_detail.results.hold.points, hold_points)

        # Yoke incomplete for partial → no yoke points
        self.assertFalse(partial_detail.results.yoke.complete)
        self.assertIsNone(partial_detail.results.yoke.points)


if __name__ == "__main__":
    unittest.main()
