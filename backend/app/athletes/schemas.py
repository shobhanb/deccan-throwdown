from typing import Literal
from uuid import UUID

from app.schemas import CustomBaseModel


class AthleteBaseModel(CustomBaseModel):
    first_name: str
    last_name: str
    email: str | None = None
    sex: Literal["M", "F"]
    waiver: bool = False
    gym: str | None = None
    city: str | None = None
    team_id: UUID


class AthleteModel(AthleteBaseModel):
    id: UUID


class AthleteOutputModel(AthleteModel):
    pass


class AthleteCreateModel(AthleteBaseModel):
    pass


class AthleteUpdateModel(CustomBaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    sex: Literal["M", "F"] | None = None
    waiver: bool | None = None
    gym: str | None = None
    city: str | None = None
    team_id: UUID | None = None
