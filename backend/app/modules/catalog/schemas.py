from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ServiceType = Literal["Photography", "Videography", "Both", "Other"]
AddOnType = Literal["Album", "Enlargement", "General"]


class PackageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    service_type: ServiceType
    base_price: Decimal = Field(ge=0, decimal_places=2)
    description: str | None = None
    deliverables: list[str] = Field(default_factory=list)
    is_active: bool = True


class PackageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    service_type: ServiceType | None = None
    base_price: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    description: str | None = None
    deliverables: list[str] | None = None
    is_active: bool | None = None


class PackageRead(PackageCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class AddOnCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    add_on_type: AddOnType
    default_price: Decimal = Field(ge=0, decimal_places=2)
    is_active: bool = True


class AddOnUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    add_on_type: AddOnType | None = None
    default_price: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    is_active: bool | None = None


class AddOnRead(AddOnCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
