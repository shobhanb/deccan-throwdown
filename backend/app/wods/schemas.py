from typing import Any
from uuid import UUID

from app.schemas import CustomBaseModel
from app.scores.schemas import ScoresOutputModel


class WodsBaseModel(CustomBaseModel):
    wod_number: int
    wod_name: str
    wod_score_type: str
    wod_description: dict[str, Any]
    event_id: UUID


class WodsModel(CustomBaseModel):
    id: UUID
    wod_number: int
    wod_name: str
    wod_score_type: str
    wod_description: dict[str, Any]
    event_id: UUID


class WodsOutputModel(WodsModel):
    pass


class WodsCreateModel(CustomBaseModel):
    wod_number: int
    wod_name: str
    wod_score_type: str
    wod_description: dict[str, Any]
    event_id: UUID


class WodsUpdateModel(CustomBaseModel):
    wod_number: int | None = None
    wod_name: str | None = None
    wod_score_type: str | None = None
    wod_description: dict[str, Any] | None = None
    event_id: UUID | None = None


class WodsOutputModelDetail(WodsOutputModel):
    scores: list[ScoresOutputModel]
