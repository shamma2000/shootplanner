from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class StudioUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    address: str | None = None
    brand_color_primary: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    brand_color_secondary: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    bank_name: str | None = Field(default=None, max_length=120)
    bank_account_holder: str | None = Field(default=None, max_length=120)
    bank_account_number: str | None = Field(default=None, max_length=80)
    bank_branch: str | None = Field(default=None, max_length=120)


class StudioRead(StudioUpdate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subdomain: str
    name: str
    created_at: datetime
    updated_at: datetime
