from typing import Literal
from uuid import UUID

from app.athletes.schemas import AthleteOutputModel, AthleteRegistrationModel
from app.schemas import CustomBaseModel
from app.scores.schemas import ScoreOutputModel


class TeamsBaseModel(CustomBaseModel):
    category: str
    team_name: str
    paid: bool
    verified: bool
    event_short_name: str


class TeamsModel(CustomBaseModel):
    id: UUID
    category: str
    team_name: str
    paid: bool
    verified: bool
    event_short_name: str


class TeamsOutputModel(TeamsModel):
    overall_rank: int | None = None


class TeamsCreateModel(CustomBaseModel):
    category: str
    team_name: str
    paid: bool = False
    verified: bool = False
    event_short_name: str


class TeamsUpdateModel(CustomBaseModel):
    category: str | None = None
    team_name: str | None = None
    paid: bool | None = None
    verified: bool | None = None
    event_short_name: str | None = None


class TeamsOutputDetailModel(TeamsOutputModel):
    athletes: list[AthleteOutputModel]
    scores: list[ScoreOutputModel]


class TeamRegistrationModel(CustomBaseModel):
    team_name: str
    category: str
    athletes: list[AthleteRegistrationModel]
    event_short_name: str


class WaiverLinkModel(CustomBaseModel):
    athlete_name: str
    waiver_link: str


class TeamRegistrationResponseModel(CustomBaseModel):
    payment_link: str
    waiver_links: list[WaiverLinkModel] | None = None


class SentEmailDeliveryModel(CustomBaseModel):
    id: str
    to: list[str]
    sender: str
    subject: str
    created_at: str
    last_event: str
    status: Literal["delivered", "undelivered", "pending"]


class SentEmailDeliveryListModel(CustomBaseModel):
    emails: list[SentEmailDeliveryModel]
    has_more: bool


class RegistrationPricingModel(CustomBaseModel):
    use_early_bird_fee: bool
    team_fee: int
    early_bird_team_fee: int
    active_team_fee: int


class RegistrationPricingUpdateModel(CustomBaseModel):
    use_early_bird_fee: bool


class TeamPaymentLinkModel(CustomBaseModel):
    payment_link: str
    use_early_bird_fee: bool
    active_team_fee: int
