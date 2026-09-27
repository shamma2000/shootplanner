from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.events.model import Event
from app.modules.events.schemas import EventCreate, EventRead

router = APIRouter()
Database = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[EventRead])
async def list_events(db: Database) -> list[Event]:
    result = await db.scalars(select(Event).order_by(Event.event_date))
    return list(result)


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreate, db: Database) -> Event:
    event = Event(**payload.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event
