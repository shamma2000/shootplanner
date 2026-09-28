from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.clients.schemas import ClientCreate

EventType = Literal["Wedding", "Engagement", "Homecoming", "Pre-shoot", "Other", "Custom Event"]
EventStatus = Literal["Draft", "Confirmed", "Postponed"]


class EventDetails(BaseModel):
    event_type: EventType
    event_date: date
    location: str = Field(min_length=1, max_length=255)
    hotel: str | None = Field(default=None, max_length=255)
    status: EventStatus = "Draft"


class EventCreate(EventDetails):
    client_id: UUID


class EventWithClientCreate(EventDetails):
    client: ClientCreate


class EventRead(EventCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    original_date: date | None = None
    tentative_date: date | None = None
    postpone_reason: str | None = None


class EventUpdate(BaseModel):
    event_date: date | None = None
    location: str | None = Field(default=None, min_length=1, max_length=255)
    hotel: str | None = Field(default=None, max_length=255)
    status: EventStatus | None = None
    tentative_date: date | None = None
    postpone_reason: str | None = None
