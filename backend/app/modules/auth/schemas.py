from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    studio_name: str = Field(min_length=2, max_length=120)
    subdomain: str = Field(pattern=r"^[a-z0-9-]{3,30}$")
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    remember_me: bool = False


class UserRead(BaseModel):
    id: UUID
    studio_id: UUID
    studio_name: str
    subdomain: str
    name: str
    email: EmailStr
    phone: str
    role: str
