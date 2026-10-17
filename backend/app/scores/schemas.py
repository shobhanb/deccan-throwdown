from uuid import UUID

from pydantic import field_validator

from app.schemas import CustomBaseModel
from app.scores.models import score_is_verified


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
    pass


class ScoreUpdateModel(CustomBaseModel):
    reps: int | None = None
    time_s: int | None = None
    tiebreak_s: int | None = None
    score_detail: str | None = None
