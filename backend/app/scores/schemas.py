from uuid import UUID

from pydantic import field_validator

from app.schemas import CustomBaseModel
from app.scores.detail import (
    ScoreDetailValidationError,
    validate_and_normalize_score_detail,
)
from app.scores.models import score_is_verified


def _normalize_score_detail(value: object) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise TypeError("score_detail must be a string")
    try:
        return validate_and_normalize_score_detail(value)
    except ScoreDetailValidationError as exc:
        raise ValueError(str(exc)) from exc


# Base model with all fields, using correct types and defaults
class ScoreBaseModel(CustomBaseModel):
    reps: int | None = None
    time_s: int | None = None
    tiebreak_s: int | None = None
    score_detail: str | None = None
    team_id: UUID
    wod_number: int


class ScoreModel(ScoreBaseModel):
    id: UUID


class ScoreOutputModel(ScoreModel):
    verified: bool
    wod_rank: int | None = None
    wod_points: int | None = None

    @field_validator("verified", mode="before")
    @classmethod
    def coerce_verified(cls, value: object) -> bool:
        return score_is_verified(value)


class ScoreCreateModel(ScoreBaseModel):
    @field_validator("score_detail", mode="before")
    @classmethod
    def validate_score_detail(cls, value: object) -> str | None:
        return _normalize_score_detail(value)


class ScoreUpdateModel(CustomBaseModel):
    reps: int | None = None
    time_s: int | None = None
    tiebreak_s: int | None = None
    score_detail: str | None = None

    @field_validator("score_detail", mode="before")
    @classmethod
    def validate_score_detail(cls, value: object) -> str | None:
        return _normalize_score_detail(value)
