from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ShootPlanner API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    frontend_origin: str = "http://localhost:3000"
    database_url: str = "postgresql+asyncpg://shootplanner:change-me@localhost:5432/shootplanner"
    database_echo: bool = False
    auth_secret_key: str = "development-only-change-this-secret"
    access_token_minutes: int = 480
    auth_cookie_name: str = "shootplanner_session"

    @property
    def cookie_secure(self) -> bool:
        return self.environment != "development"

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.environment != "development" and len(self.auth_secret_key) < 32:
            raise ValueError("AUTH_SECRET_KEY must contain at least 32 characters")
        return self

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
