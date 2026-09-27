from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

EventType = Literal["Wedding", "Engagement", "Homecoming", "Pre-shoot", "Other"]
EventStatus = Literal["Draft", "Confirmed", "Postponed"]


class EventCreate(BaseModel):
    client_id: UUID
    event_type: EventType
    event_date: date
    location: str = Field(min_length=1, max_length=255)
    hotel: str | None = Field(default=None, max_length=255)
    status: EventStatus = "Draft"


class EventRead(EventCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
