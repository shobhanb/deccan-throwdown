from collections.abc import Sequence

from fastapi import APIRouter, status
from sqlalchemy.orm import selectinload

from app.database.dependencies import db_dependency
from app.exceptions import conflict_exception
from app.teams.models import Team
from app.wods.models import Wod

from .models import Event
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
) -> Sequence[Event]:
    if year:
        return await Event.find_all(async_session=db_session, year=year)
    return await Event.find_all(async_session=db_session)


@events_router.get(
    "/{event_short_name}",
    status_code=status.HTTP_200_OK,
    response_model=EventsModel,
)
async def get_event_info(
    db_session: db_dependency,
    event_short_name: str,
) -> Event:
    return await Event.find_or_raise(async_session=db_session, event_short_name=event_short_name)


@events_router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=EventsModel,
)
async def create_event(
    db_session: db_dependency,
    event: EventsCreateModel,
) -> Event:
    event_exists = await Event.find(async_session=db_session, event_short_name=event.event_short_name)
    if event_exists:
        raise conflict_exception()

    new_event = Event(**event.model_dump())
    db_session.add(new_event)
    await db_session.commit()
    await db_session.refresh(new_event)
    return new_event


@events_router.patch(
    "/{event_short_name}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=EventsModel,
)
async def update_event(
    db_session: db_dependency,
    event_short_name: str,
    update_data: EventsUpdateModel,
) -> Event:
    event = await Event.find_or_raise(async_session=db_session, event_short_name=event_short_name)

    if event.event_short_name != event_short_name:
        new_short_name_exists = await Event.find(
            async_session=db_session,
            event_short_name=update_data.event_short_name,
        )
        if new_short_name_exists:
            msg = "Updated event short name exists"
            raise conflict_exception(msg)

    # Update only the fields that are provided
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(event, field, value)

    db_session.add(event)
    await db_session.commit()
    await db_session.refresh(event)
    return event


@events_router.delete(
    "/{event_short_name}",
    status_code=status.HTTP_202_ACCEPTED,
)
async def delete_event(
    db_session: db_dependency,
    event_short_name: str,
) -> None:
    event = await Event.find_or_raise(async_session=db_session, event_short_name=event_short_name)
    await event.delete(async_session=db_session)


@events_router.get(
    "/team_data/{event_short_name}",
    status_code=status.HTTP_200_OK,
    response_model=EventsModelTeamDetail,
)
async def get_event_all_team_data(
    db_session: db_dependency,
    event_short_name: str,
) -> Event:
    return await Event.find_or_raise_with_nested_relationships(
        async_session=db_session,
        nested_relationships=[
            selectinload(Event.teams).selectinload(Team.athletes),
        ],
        event_short_name=event_short_name,
    )


@events_router.get(
    "/wod_data/{event_short_name}",
    status_code=status.HTTP_200_OK,
    response_model=EventsModelWodDetail,
)
async def get_event_all_wod_data(
    db_session: db_dependency,
    event_short_name: str,
) -> Event:
    return await Event.find_or_raise_with_nested_relationships(
        async_session=db_session,
        nested_relationships=[
            selectinload(Event.wods).selectinload(Wod.scores),
        ],
        event_short_name=event_short_name,
    )
