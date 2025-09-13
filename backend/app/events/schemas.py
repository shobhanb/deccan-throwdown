import datetime as dt
from uuid import UUID

from app.schemas import CustomBaseModel
from app.teams.schemas import TeamsOutputDetailModel
from app.wods.schemas import WodOutputModelDetail


# Base model with all fields, using Optional for nullable fields
class EventsBaseModel(CustomBaseModel):
    year: int
    event_name: str
    event_short_name: str
    athletes_per_team: int
    organization_name: str | None = None
    city: str | None = None
    country: str | None = None
    start_date: dt.date | None = None
    end_date: dt.date | None = None


class EventsModel(EventsBaseModel):
    id: UUID


class EventsCreateModel(EventsBaseModel):
    pass


class EventsUpdateModel(CustomBaseModel):
    year: int | None = None
    event_name: str | None = None
    event_short_name: str | None = None
    athletes_per_team: int | None = None
    organization_name: str | None = None
    city: str | None = None
    country: str | None = None
    start_date: dt.date | None = None
    end_date: dt.date | None = None


class EventsModelTeamDetail(EventsModel):
    teams: list[TeamsOutputDetailModel]


class EventsModelWodDetail(EventsModel):
    wods: list[WodOutputModelDetail]
