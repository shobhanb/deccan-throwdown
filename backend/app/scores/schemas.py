from typing import Any
from uuid import UUID

from app.schemas import CustomBaseModel


class ScoresBaseModel(CustomBaseModel):
    reps: int | None = None
    time_s: int | None = None
    tiebreak_s: int | None = None
    score_detail: dict[str, Any]
    team_id: UUID
    wod_id: UUID


class ScoresModel(CustomBaseModel):
    id: UUID
    reps: int | None = None
    time_s: int | None = None
    tiebreak_s: int | None = None
    score_detail: dict[str, Any]
    team_id: UUID
    wod_id: UUID


class ScoresOutputModel(ScoresModel):
    pass


class ScoresCreateModel(CustomBaseModel):
    reps: int | None = None
    time_s: int | None = None
    tiebreak_s: int | None = None
    score_detail: dict[str, Any]
    team_id: UUID
    wod_id: UUID


class ScoresUpdateModel(CustomBaseModel):
    reps: int | None = None
    time_s: int | None = None
    tiebreak_s: int | None = None
    score_detail: dict[str, Any] | None = None
