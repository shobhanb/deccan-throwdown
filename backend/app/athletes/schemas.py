from uuid import UUID

from app.schemas import CustomBaseModel


class AthleteBaseModel(CustomBaseModel):
    name: str
    email: str | None = None
    waiver: bool
    gym: str | None = None
    city: str | None = None
    team_id: UUID


class AthleteModel(CustomBaseModel):
    id: UUID
    name: str
    email: str
    waiver: bool
    gym: str | None = None
    city: str | None = None
    team_id: UUID


class AthleteOutputModel(AthleteModel):
    pass


class AthleteCreateModel(CustomBaseModel):
    name: str
    email: str
    waiver: bool = False
    gym: str | None = None
    city: str | None = None
    team_id: UUID


class AthleteUpdateModel(CustomBaseModel):
    name: str | None = None
    email: str | None = None
    waiver: bool | None = None
    gym: str | None = None
    city: str | None = None
    team_id: UUID | None = None
