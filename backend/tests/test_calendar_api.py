from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.main import app
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.model import User
from app.modules.clients.model import Client
from app.modules.events.model import Event


@pytest.fixture
def calendar_api():
    studio_id = uuid4()
    user = User(id=uuid4(), studio_id=studio_id)
    db = AsyncMock(spec=AsyncSession)
    records = []

    def add(record):
        record.id = uuid4()
        record.created_at = datetime.now(UTC)
        record.updated_at = datetime.now(UTC)
        records.append(record)

    db.add.side_effect = add
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: user
    try:
        with TestClient(app) as client:
            yield client, db, records, studio_id
    finally:
        app.dependency_overrides.clear()


def test_calendar_creates_client_and_custom_event_for_signed_in_studio(calendar_api):
    client, db, records, studio_id = calendar_api
    response = client.post(
        "/api/v1/events/with-client",
        json={
            "client": {
                "bride_name": "Asha",
                "groom_name": "Nimal",
                "primary_phone": "0771234567",
                "studio_id": str(uuid4()),
            },
            "event_type": "Custom Event",
            "event_date": "2026-09-29",
            "location": "Colombo",
            "status": "Confirmed",
        },
    )
    assert response.status_code == 201
    assert response.json()["event_type"] == "Custom Event"
    saved_client = next(record for record in records if isinstance(record, Client))
    saved_event = next(record for record in records if isinstance(record, Event))
    assert saved_client.studio_id == studio_id
    assert saved_event.client_id == saved_client.id
    db.commit.assert_awaited_once()


def test_invalid_calendar_payload_does_not_create_partial_client(calendar_api):
    client, db, records, _ = calendar_api
    response = client.post(
        "/api/v1/events/with-client",
        json={
            "client": {"bride_name": "Asha", "groom_name": "Nimal", "primary_phone": "0771234567"},
            "event_type": "Custom Event",
            "event_date": "not-a-date",
            "location": "Colombo",
        },
    )
    assert response.status_code == 422
    assert records == []
    db.commit.assert_not_awaited()


def test_calendar_rejects_client_outside_studio(calendar_api):
    client, db, records, _ = calendar_api
    db.scalar.return_value = None
    response = client.post(
        "/api/v1/events",
        json={
            "client_id": str(uuid4()),
            "event_type": "Custom Event",
            "event_date": "2026-09-29",
            "location": "Colombo",
        },
    )
    assert response.status_code == 404
    assert records == []
    db.commit.assert_not_awaited()
