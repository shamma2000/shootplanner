from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.modules.auth.dependencies import CurrentUser, Database
from app.modules.clients.model import Client
from app.modules.events.model import Event
from app.modules.events.schemas import EventCreate, EventRead, EventUpdate, EventWithClientCreate

router = APIRouter()


@router.get("", response_model=list[EventRead])
async def list_events(db: Database, current_user: CurrentUser) -> list[Event]:
    result = await db.scalars(
        select(Event)
        .join(Client, Event.client_id == Client.id)
        .where(Client.studio_id == current_user.studio_id)
        .order_by(Event.event_date)
    )
    return list(result)


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreate, db: Database, current_user: CurrentUser) -> Event:
    client = await db.scalar(
        select(Client).where(
            Client.id == payload.client_id,
            Client.studio_id == current_user.studio_id,
        )
    )
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    event = Event(**payload.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.post("/with-client", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event_with_client(
    payload: EventWithClientCreate, db: Database, current_user: CurrentUser
) -> Event:
    client = Client(studio_id=current_user.studio_id, **payload.client.model_dump())
    db.add(client)
    await db.flush()
    event = Event(client_id=client.id, **payload.model_dump(exclude={"client"}))
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.patch("/{event_id}", response_model=EventRead)
async def update_event(
    event_id: UUID,
    payload: EventUpdate,
    db: Database,
    current_user: CurrentUser,
) -> Event:
    event = await db.scalar(
        select(Event)
        .join(Client, Event.client_id == Client.id)
        .where(Event.id == event_id, Client.studio_id == current_user.studio_id)
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    changes = payload.model_dump(exclude_unset=True)
    next_status = changes.get("status")
    was_postponed = event.status == "Postponed"
    if next_status == "Postponed" and event.original_date is None:
        event.original_date = event.event_date
    for key, value in changes.items():
        setattr(event, key, value)
    if was_postponed and next_status and next_status != "Postponed":
        if "event_date" not in changes and event.tentative_date:
            event.event_date = event.tentative_date
        event.tentative_date = None
        event.postpone_reason = None

    await db.commit()
    await db.refresh(event)
    return event
