from collections.abc import Sequence
from uuid import UUID

from fastapi import APIRouter, status

from app.database.dependencies import db_dependency
from app.exceptions import conflict_exception

from .models import Wods
from .schemas import WodsCreateModel, WodsOutputModel, WodsUpdateModel

wods_router = APIRouter(prefix="/wods", tags=["wods"])


@wods_router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=list[WodsOutputModel],
)
async def get_wods(
    db_session: db_dependency,
    event_id: UUID,
    wod_number: int | None = None,
) -> Sequence[Wods]:
    filters = {}
    filters["event_id"] = event_id
    if wod_number:
        filters["wod_number"] = wod_number

    return await Wods.find_all(
        async_session=db_session,
        **filters,
    )


@wods_router.get(
    "/{wod_id}",
    status_code=status.HTTP_200_OK,
    response_model=WodsOutputModel,
)
async def get_wod(
    db_session: db_dependency,
    wod_id: UUID,
) -> Wods:
    return await Wods.find_or_raise(async_session=db_session, id=wod_id)


@wods_router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=WodsOutputModel,
)
async def create_wod(
    db_session: db_dependency,
    wod: WodsCreateModel,
) -> Wods:
    wod_exists = await Wods.find(
        async_session=db_session,
        wod_number=wod.wod_number,
        event_id=wod.event_id,
    )
    if wod_exists:
        raise conflict_exception()

    new_wod = Wods(
        wod_number=wod.wod_number,
        wod_name=wod.wod_name,
        wod_score_type=wod.wod_score_type,
        wod_description=wod.wod_description,
        event_id=wod.event_id,
    )
    db_session.add(new_wod)
    await db_session.commit()
    await db_session.refresh(new_wod)
    return new_wod


@wods_router.patch(
    "/{wod_id}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=WodsOutputModel,
)
async def update_wod(
    db_session: db_dependency,
    wod_id: UUID,
    update_data: WodsUpdateModel,
) -> Wods:
    wod = await Wods.find_or_raise(async_session=db_session, id=wod_id)

    # Update only the fields that are provided
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(wod, field, value)

    db_session.add(wod)
    await db_session.commit()
    await db_session.refresh(wod)
    return wod


@wods_router.delete(
    "/{wod_id}",
    status_code=status.HTTP_202_ACCEPTED,
)
async def delete_wod(
    db_session: db_dependency,
    wod_id: UUID,
) -> None:
    wod = await Wods.find_or_raise(async_session=db_session, id=wod_id)
    await wod.delete(async_session=db_session)
