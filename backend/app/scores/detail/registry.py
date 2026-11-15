from __future__ import annotations

import json
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from pydantic import ValidationError

from app.scores.detail.types import TtmmScoreDetail, apply_ttmm_default_tiebreaks


@dataclass(frozen=True)
class ScoreDetailHandler:
    type_name: str
    affects_ranking: bool
    validate_model: Callable[[dict[str, Any]], Any]


def _validate_ttmm(data: dict[str, Any]) -> TtmmScoreDetail:
    # Client-supplied results are ignored; ranking recomputes them.
    payload = {**data, "results": None}
    detail = TtmmScoreDetail.model_validate(payload)
    return apply_ttmm_default_tiebreaks(detail)


DETAIL_HANDLERS: dict[str, ScoreDetailHandler] = {
    "ttmm": ScoreDetailHandler(
        type_name="ttmm",
        affects_ranking=True,
        validate_model=_validate_ttmm,
    ),
}


class ScoreDetailValidationError(ValueError):
    pass


def parse_score_detail_raw(raw: str | None) -> dict[str, Any] | None:
    if raw is None:
        return None
    text = raw.strip()
    if not text:
        return None
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ScoreDetailValidationError("score_detail must be valid JSON") from exc
    if not isinstance(parsed, dict):
        raise ScoreDetailValidationError("score_detail must be a JSON object")
    return parsed


def get_detail_type(raw: str | None) -> str | None:
    parsed = parse_score_detail_raw(raw)
    if parsed is None:
        return None
    detail_type = parsed.get("type")
    return detail_type if isinstance(detail_type, str) else None


def detail_affects_ranking(raw: str | None) -> bool:
    detail_type = get_detail_type(raw)
    if detail_type is None:
        return False
    handler = DETAIL_HANDLERS.get(detail_type)
    return bool(handler and handler.affects_ranking)


def validate_and_normalize_score_detail(raw: str | None) -> str | None:
    """Validate score_detail JSON and return canonical JSON string (results cleared)."""
    parsed = parse_score_detail_raw(raw)
    if parsed is None:
        return None

    detail_type = parsed.get("type")
    if not isinstance(detail_type, str):
        raise ScoreDetailValidationError("score_detail.type is required")

    handler = DETAIL_HANDLERS.get(detail_type)
    if handler is None:
        raise ScoreDetailValidationError(f"unknown score_detail.type: {detail_type}")

    try:
        model = handler.validate_model(parsed)
    except ValidationError as exc:
        raise ScoreDetailValidationError(str(exc)) from exc

    return model.model_dump_json()


def parse_ttmm_detail(raw: str | None) -> TtmmScoreDetail | None:
    parsed = parse_score_detail_raw(raw)
    if parsed is None or parsed.get("type") != "ttmm":
        return None
    try:
        return apply_ttmm_default_tiebreaks(TtmmScoreDetail.model_validate(parsed))
    except ValidationError:
        return None
