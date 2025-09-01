from uuid import UUID

from app.athletes.schemas import AthleteOutputModel
from app.schemas import CustomBaseModel


class TeamsBaseModel(CustomBaseModel):
    category: str
    team_name: str
    paid: bool
    verified: bool
    event_id: UUID


class TeamsModel(CustomBaseModel):
    id: UUID
    category: str
    team_name: str
    paid: bool
    verified: bool
    event_id: UUID


class TeamsOutputModel(TeamsModel):
    athletes: list[AthleteOutputModel]


class TeamsCreateModel(CustomBaseModel):
    category: str
    team_name: str
    paid: bool = False
    verified: bool = False
    event_id: UUID


class TeamsUpdateModel(CustomBaseModel):
    category: str | None = None
    team_name: str | None = None
    paid: bool | None = None
    verified: bool | None = None
    event_id: UUID | None = None
