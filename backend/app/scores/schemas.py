from uuid import UUID

from app.schemas import CustomBaseModel


# Base model with all fields, using correct types and defaults
class ScoreBaseModel(CustomBaseModel):
    reps: int = 0
    time_s: int | None = None
    tiebreak_s: int | None = None
    score_detail: str | None = None
    team_id: UUID
    wod_id: UUID


class ScoreModel(ScoreBaseModel):
    id: UUID


class ScoreOutputModel(ScoreModel):
    pass


class ScoreCreateModel(ScoreBaseModel):
    pass


class ScoreUpdateModel(CustomBaseModel):
    reps: int | None = None
    time_s: int | None = None
    tiebreak_s: int | None = None
    score_detail: str | None = None
