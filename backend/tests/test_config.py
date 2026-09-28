from app.core.config import Settings


def test_database_urls_use_asyncpg_driver() -> None:
    settings = Settings(
        database_url="postgresql://user:password@localhost:5432/app",
        direct_url="postgres://user:password@localhost:5432/app",
        _env_file=None,
    )

    assert settings.database_url.startswith("postgresql+asyncpg://")
    assert settings.direct_url is not None
    assert settings.direct_url.startswith("postgresql+asyncpg://")
