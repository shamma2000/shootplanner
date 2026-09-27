from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ShootPlanner API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    frontend_origin: str = "http://localhost:3000"
    database_url: str = "postgresql+asyncpg://shootplanner:change-me@localhost:5432/shootplanner"
    database_echo: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
