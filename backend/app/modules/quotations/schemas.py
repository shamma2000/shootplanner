from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class QuotationCreate(BaseModel):
    event_id: UUID
    subtotal: Decimal = Field(ge=0, decimal_places=2)
    discount: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    total: Decimal = Field(ge=0, decimal_places=2)
    status: Literal["Draft", "Sent", "Accepted"] = "Draft"


class QuotationRead(QuotationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
