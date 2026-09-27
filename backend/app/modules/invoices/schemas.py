from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class InvoiceCreate(BaseModel):
    quotation_id: UUID
    invoice_number: str = Field(min_length=1, max_length=50)
    amount: Decimal = Field(ge=0, decimal_places=2)
    due_date: date
    status: Literal["Pending", "Paid", "Overdue"] = "Pending"


class InvoiceRead(InvoiceCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
