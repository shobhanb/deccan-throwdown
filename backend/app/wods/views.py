from collections.abc import Sequence
from uuid import UUID

from fastapi import APIRouter, status

from app.database.dependencies import db_dependency
from app.exceptions import conflict_exception

from .models import Wod
from .schemas import WodCreateModel, WodOutputModel, WodUpdateModel

wods_router = APIRouter(prefix="/wods", tags=["wods"])


@wods_router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=list[WodOutputModel],
)
async def get_wods(
    db_session: db_dependency,
    event_short_name: str,
    wod_number: int | None = None,
) -> Sequence[Wod]:
    filters = {}
    filters["event_short_name"] = event_short_name
    if wod_number:
        filters["wod_number"] = wod_number

    return await Wod.find_all(
        async_session=db_session,
        **filters,
    )


@wods_router.get(
    "/{wod_id}",
    status_code=status.HTTP_200_OK,
    response_model=WodOutputModel,
)
async def get_wod(
    db_session: db_dependency,
    wod_id: UUID,
) -> Wod:
    return await Wod.find_or_raise(async_session=db_session, id=wod_id)


@wods_router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=WodOutputModel,
)
async def create_wod(
    db_session: db_dependency,
    wod: WodCreateModel,
) -> Wod:
    wod_exists = await Wod.find(
        async_session=db_session,
        wod_number=wod.wod_number,
        event_short_name=wod.event_short_name,
    )
    if wod_exists:
        raise conflict_exception()

    new_wod = Wod(
        wod_number=wod.wod_number,
        wod_name=wod.wod_name,
        wod_score_type=wod.wod_score_type,
        wod_description=wod.wod_description,
        event_short_name=wod.event_short_name,
    )
    db_session.add(new_wod)
    await db_session.commit()
    await db_session.refresh(new_wod)
    return new_wod


@wods_router.patch(
    "/{wod_id}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=WodOutputModel,
)
async def update_wod(
    db_session: db_dependency,
    wod_id: UUID,
    update_data: WodUpdateModel,
) -> Wod:
    wod = await Wod.find_or_raise(async_session=db_session, id=wod_id)

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
    wod = await Wod.find_or_raise(async_session=db_session, id=wod_id)
    await wod.delete(async_session=db_session)
