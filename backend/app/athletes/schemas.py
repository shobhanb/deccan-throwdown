from typing import Literal
from uuid import UUID

from pydantic import EmailStr

from app.schemas import CustomBaseModel


class AthleteBaseModel(CustomBaseModel):
    first_name: str
    last_name: str
    email: EmailStr | None = None
    phone_number: str | None = None
    sex: Literal["M", "F"]
    waiver: bool = False
    gym: str | None = None
    city: str | None = None


class AthleteModel(AthleteBaseModel):
    id: UUID
    team_id: UUID


class AthleteOutputModel(AthleteModel):
    team_id: UUID


class AthleteCreateModel(AthleteBaseModel):
    team_id: UUID


class AthleteUpdateModel(CustomBaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone_number: str | None = None
    sex: Literal["M", "F"] | None = None
    waiver: bool | None = None
    gym: str | None = None
    city: str | None = None
    team_id: UUID | None = None


class AthleteRegistrationModel(AthleteBaseModel):
    pass
