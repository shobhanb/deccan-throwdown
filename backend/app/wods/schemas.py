from uuid import UUID

from app.schemas import CustomBaseModel
from app.scores.schemas import ScoreOutputModel


# Base model with all fields, using correct types and defaults
class WodBaseModel(CustomBaseModel):
    wod_number: int
    wod_name: str
    wod_score_type: str
    wod_description: str | None = None
    event_short_name: str


class WodModel(WodBaseModel):
    id: UUID


class WodOutputModel(WodModel):
    pass


class WodCreateModel(WodBaseModel):
    pass


class WodUpdateModel(CustomBaseModel):
    wod_number: int | None = None
    wod_name: str | None = None
    wod_score_type: str | None = None
    wod_description: str | None = None
    event_short_name: str | None = None


class WodOutputModelDetail(WodOutputModel):
    scores: list[ScoreOutputModel]
