from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class InvoiceCreate(BaseModel):
    quotation_id: UUID
    invoice_number: str = Field(min_length=1, max_length=50)
    amount: Decimal = Field(ge=0, decimal_places=2)
    advance_paid: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    due_date: date
    notes: str | None = None
    status: Literal["Pending", "Paid", "Overdue"] = "Pending"


class DeliveryItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    invoice_id: UUID
    name: str
    status: Literal["Pending", "In Progress", "Delivered"]
    due_date: date | None
    delivered_at: datetime | None
    created_at: datetime
    updated_at: datetime


class InvoiceRead(InvoiceCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    balance_due: Decimal
    deliveries: list[DeliveryItemRead] = Field(default_factory=list)


class InvoiceUpdate(BaseModel):
    advance_paid: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    due_date: date | None = None
    notes: str | None = None
    status: Literal["Pending", "Paid", "Overdue"] | None = None


class DeliveryUpdate(BaseModel):
    status: Literal["Pending", "In Progress", "Delivered"]
    due_date: date | None = None
