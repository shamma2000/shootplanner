from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ClientCreate(BaseModel):
    bride_name: str = Field(min_length=1, max_length=120)
    groom_name: str = Field(min_length=1, max_length=120)
    primary_phone: str = Field(min_length=7, max_length=30)
    optional_phone: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=500)


class ClientRead(ClientCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
