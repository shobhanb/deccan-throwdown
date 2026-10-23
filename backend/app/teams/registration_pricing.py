from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.settings import registration_settings

from .models import RegistrationPricingState
from .schemas import RegistrationPricingModel


def registration_pricing_model(use_early_bird_fee: bool) -> RegistrationPricingModel:
    active_team_fee = (
        registration_settings.early_bird_team_fee
        if use_early_bird_fee
        else registration_settings.team_fee
    )
    return RegistrationPricingModel(
        use_early_bird_fee=use_early_bird_fee,
        team_fee=registration_settings.team_fee,
        early_bird_team_fee=registration_settings.early_bird_team_fee,
        active_team_fee=active_team_fee,
    )


async def get_use_early_bird_fee(db_session: AsyncSession) -> bool:
    state = await _get_or_create_state(db_session)
    return state.use_early_bird_fee


async def get_registration_pricing(
    db_session: AsyncSession,
) -> RegistrationPricingModel:
    use_early_bird_fee = await get_use_early_bird_fee(db_session)
    return registration_pricing_model(use_early_bird_fee)


async def set_use_early_bird_fee(
    db_session: AsyncSession,
    use_early_bird_fee: bool,
) -> RegistrationPricingModel:
    state = await _get_or_create_state(db_session)
    if state.use_early_bird_fee != use_early_bird_fee:
        state.use_early_bird_fee = use_early_bird_fee
        await db_session.commit()
    return registration_pricing_model(use_early_bird_fee)


async def _get_or_create_state(db_session: AsyncSession) -> RegistrationPricingState:
    state = await db_session.scalar(select(RegistrationPricingState).limit(1))
    if state is not None:
        return state

    state = RegistrationPricingState(
        use_early_bird_fee=registration_settings.use_early_bird_fee,
    )
    db_session.add(state)
    await db_session.commit()
    await db_session.refresh(state)
    return state
