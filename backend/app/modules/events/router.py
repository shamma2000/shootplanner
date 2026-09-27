from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.modules.auth.dependencies import CurrentUser, Database
from app.modules.clients.model import Client
from app.modules.events.model import Event
from app.modules.events.schemas import EventCreate, EventRead

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
