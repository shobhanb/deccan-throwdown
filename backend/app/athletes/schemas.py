from uuid import UUID

from app.schemas import CustomBaseModel


class AthleteBaseModel(CustomBaseModel):
    first_name: str
    last_name: str
    email: str
    sex: str
    waiver: bool
    gym: str | None = None
    city: str | None = None
    team_id: UUID


class AthleteModel(CustomBaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str
    sex: str
    waiver: bool
    gym: str | None = None
    city: str | None = None
    team_id: UUID


class AthleteOutputModel(AthleteModel):
    pass


class AthleteCreateModel(CustomBaseModel):
    first_name: str
    last_name: str
    email: str
    sex: str
    waiver: bool = False
    gym: str | None = None
    city: str | None = None
    team_id: UUID


class AthleteUpdateModel(CustomBaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    sex: str | None = None
    waiver: bool | None = None
    gym: str | None = None
    city: str | None = None
    team_id: UUID | None = None
