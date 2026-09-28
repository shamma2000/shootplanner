from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.clients.schemas import ClientCreate


class QuotationCreate(BaseModel):
    event_id: UUID
    subtotal: Decimal = Field(ge=0, decimal_places=2)
    discount: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    total: Decimal = Field(ge=0, decimal_places=2)
    package_name: str | None = Field(default=None, max_length=120)
    service_type: str | None = Field(default=None, max_length=30)
    notes: str | None = None
    status: Literal["Draft", "Sent", "Accepted"] = "Draft"
    items: list["QuotationItemCreate"] = Field(default_factory=list)


class QuotationItemCreate(BaseModel):
    item_type: Literal["package", "add_on", "custom", "transport", "deliverable"]
    name: str = Field(min_length=1, max_length=160)
    category: str | None = Field(default=None, max_length=40)
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)


class QuotationItemRead(QuotationItemCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    total: Decimal
    created_at: datetime
    updated_at: datetime


class QuotationRead(QuotationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    items: list[QuotationItemRead] = Field(default_factory=list)


class ScheduledEventCreate(BaseModel):
    event_type: Literal["Wedding", "Engagement", "Homecoming", "Pre-shoot", "Other"]
    event_date: date
    location: str = Field(min_length=1, max_length=255)
    hotel: str | None = Field(default=None, max_length=255)


class QuotationWorkflowCreate(BaseModel):
    client: ClientCreate
    events: list[ScheduledEventCreate] = Field(min_length=1)
    items: list[QuotationItemCreate] = Field(min_length=1)
    discount: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    service_type: str | None = Field(default=None, max_length=30)
    notes: str | None = None
    status: Literal["Draft", "Sent", "Accepted"] = "Draft"


class QuotationUpdate(BaseModel):
    status: Literal["Draft", "Sent", "Accepted"]
