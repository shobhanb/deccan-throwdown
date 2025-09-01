from collections.abc import Sequence
from uuid import UUID

from fastapi import APIRouter, status
from sqlalchemy.orm import selectinload

from app.database.dependencies import db_dependency
from app.exceptions import conflict_exception
from app.teams.models import Teams
from app.wods.models import Wods

from .models import Events
from .schemas import (
    EventsCreateModel,
    EventsModel,
    EventsModelTeamDetail,
    EventsModelWodDetail,
    EventsUpdateModel,
)

events_router = APIRouter(prefix="/events", tags=["events"])


@events_router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=list[EventsModel],
)
async def get_events(
    db_session: db_dependency,
    year: int | None = None,
) -> Sequence[Events]:
    if year:
        return await Events.find_all(async_session=db_session, year=year)
    return await Events.find_all(async_session=db_session)


@events_router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=EventsModel,
)
async def create_event(
    db_session: db_dependency,
    event: EventsCreateModel,
) -> Events:
    event_exists = await Events.find(async_session=db_session, year=event.year, event_name=event.event_name)
    if event_exists:
        raise conflict_exception()

    new_event = Events(
        year=event.year,
        event_name=event.event_name,
        organization_name=event.organization_name,
        city=event.city,
        country=event.country,
        start_date=event.start_date,
        end_date=event.end_date,
    )
    db_session.add(new_event)
    await db_session.commit()
    await db_session.refresh(new_event)
    return new_event


@events_router.patch(
    "/{event_id}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=EventsModel,
)
async def update_event(
    db_session: db_dependency,
    event_id: UUID,
    update_data: EventsUpdateModel,
) -> Events:
    event = await Events.find_or_raise(async_session=db_session, id=event_id)

    # Update only the fields that are provided
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(event, field, value)

    db_session.add(event)
    await db_session.commit()
    await db_session.refresh(event)
    return event


@events_router.delete(
    "/{event_id}",
    status_code=status.HTTP_202_ACCEPTED,
)
async def delete_event(
    db_session: db_dependency,
    event_id: UUID,
) -> None:
    event = await Events.find_or_raise(async_session=db_session, id=event_id)
    await event.delete(async_session=db_session)


@events_router.get(
    "/team_data/{event_id}",
    status_code=status.HTTP_200_OK,
    response_model=EventsModelTeamDetail,
)
async def get_event_all_team_data(
    db_session: db_dependency,
    event_id: UUID,
) -> Events:
    return await Events.find_or_raise_with_nested_relationships(
        async_session=db_session,
        nested_relationships=[
            selectinload(Events.teams).selectinload(Teams.athletes),
        ],
        id=event_id,
    )


@events_router.get(
    "/wod_data/{event_id}",
    status_code=status.HTTP_200_OK,
    response_model=EventsModelWodDetail,
)
async def get_event_all_wod_data(
    db_session: db_dependency,
    event_id: UUID,
) -> Events:
    return await Events.find_or_raise_with_nested_relationships(
        async_session=db_session,
        nested_relationships=[
            selectinload(Events.wods).selectinload(Wods.scores),
        ],
        id=event_id,
    )
