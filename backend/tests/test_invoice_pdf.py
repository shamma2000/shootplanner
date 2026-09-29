from datetime import UTC, date, datetime
from decimal import Decimal
from io import BytesIO
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfReader
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.model import Studio, User
from app.modules.clients.model import Client
from app.modules.events.model import Event
from app.modules.invoices.model import DeliveryItem, Invoice
from app.modules.invoices.pdf import invoice_filename, render_invoice_pdf
from app.modules.quotations.model import Quotation, QuotationItem


def invoice_records():
    stamp = datetime(2026, 9, 29, 10, tzinfo=UTC)

    def record(model, **values):
        return model(id=uuid4(), created_at=stamp, updated_at=stamp, **values)

    studio = record(
        Studio,
        name="Example Studio",
        subdomain="example",
        phone="0771234567",
        email="studio@example.test",
        address="12 Flower Road, Colombo",
        brand_color_primary="#14b8a6",
        brand_color_secondary="#253143",
        bank_name="Example Bank",
        bank_account_holder="Example Studio Pvt Ltd",
        bank_account_number="001234567890",
        bank_branch="Colombo Main",
    )
    client = record(
        Client,
        studio_id=studio.id,
        bride_name="Asha",
        groom_name="Nimal",
        primary_phone="0772222222",
        optional_phone="0773333333",
        email="client@example.test",
        address="42 Lake Road, Kandy",
    )
    event = record(
        Event,
        client_id=client.id,
        event_type="Wedding",
        event_date=date(2026, 12, 20),
        location="Kandy",
        hotel="Lake Hotel",
        status="Confirmed",
    )
    quotation = record(
        Quotation,
        event_id=event.id,
        package_name="Signature Collection",
        service_type="Both",
        subtotal=Decimal("165000.50"),
        discount=Decimal("5000.00"),
        total=Decimal("160000.50"),
        status="Accepted",
        notes="Outdoor portraits at sunset.",
        items=[
            record(
                QuotationItem,
                item_type="package",
                name="Signature Collection",
                category="Photography",
                quantity=1,
                unit_price=Decimal("150000"),
                total=Decimal("150000"),
            ),
            record(
                QuotationItem,
                item_type="add_on",
                name="Parent album",
                category="Album",
                quantity=2,
                unit_price=Decimal("7500.25"),
                total=Decimal("15000.50"),
            ),
        ],
    )
    invoice = record(
        Invoice,
        quotation_id=quotation.id,
        invoice_number="INV-2026-001",
        amount=quotation.total,
        advance_paid=Decimal("50000.25"),
        due_date=date(2026, 12, 10),
        status="Pending",
        notes="Please use the invoice reference.",
        deliveries=[
            record(
                DeliveryItem,
                name="Wedding album",
                status="In Progress",
                due_date=date(2027, 1, 20),
                delivered_at=None,
            )
        ],
    )
    return invoice, quotation, event, client, studio


def pdf_text(content):
    reader = PdfReader(BytesIO(content))
    return reader, "\n".join(page.extract_text() for page in reader.pages)


def test_pdf_contains_customer_details_payments_bank_and_theme():
    content = render_invoice_pdf(*invoice_records())
    reader, text = pdf_text(content)
    assert content.startswith(b"%PDF-")
    for expected in (
        "Example Studio",
        "INV-2026-001",
        "Asha & Nimal",
        "client@example.test",
        "0773333333",
        "42 Lake Road, Kandy",
        "20 Dec 2026",
        "10 Dec 2026",
        "Lake Hotel",
        "Signature Collection",
        "Parent album",
        "LKR 7,500.25",
        "LKR 15,000.50",
        "LKR 165,000.50",
        "LKR -5,000.00",
        "LKR 160,000.50",
        "LKR 50,000.25",
        "LKR 110,000.25",
        "Example Bank",
        "Example Studio Pvt Ltd",
        "001234567890",
        "Colombo Main",
        "Payment reference",
        "Wedding album",
        "In Progress",
        "20 Jan 2027",
        "Please use the invoice reference.",
        "Outdoor portraits at sunset.",
    ):
        assert expected in text
    operations = reader.pages[0].get_contents().operations
    fills = [
        tuple(float(value) for value in operands) for operands, op in operations if op == b"rg"
    ]
    assert any(
        color == pytest.approx((20 / 255, 184 / 255, 166 / 255), abs=1e-5) for color in fills
    )
    assert any(color == pytest.approx((37 / 255, 49 / 255, 67 / 255), abs=1e-5) for color in fills)


def test_pdf_handles_multipage_items_long_notes_and_escapes_markup():
    invoice, quotation, event, client, studio = invoice_records()
    quotation.items = [
        QuotationItem(
            id=uuid4(),
            created_at=invoice.created_at,
            item_type="custom",
            quantity=1,
            name=f"Additional item {index:03} - " + "Detailed service " * 7,
            unit_price=Decimal("10"),
            total=Decimal("10"),
        )
        for index in range(80)
    ]
    quotation.subtotal = Decimal("800")
    quotation.discount = Decimal("0")
    invoice.amount = Decimal("800")
    invoice.advance_paid = Decimal("800")
    invoice.notes = '<img src="https://invalid.test/private"/> & <b>Literal note</b>\n' * 50
    invoice.notes += "FINAL NOTE MARKER"
    studio.name = "Long studio name " * 7
    client.address = "Long address " * 35
    reader, text = pdf_text(render_invoice_pdf(invoice, quotation, event, client, studio))
    assert len(reader.pages) > 3
    assert "Additional item 079" in text
    assert "FINAL NOTE MARKER" in text
    assert "<b>Literal note</b>" in text
    assert "Paid in full" in text
    assert "LKR 0.00" in text
    for index, page in enumerate(reader.pages, 1):
        assert f"Page {index}" in page.extract_text()


def test_pdf_missing_optional_details_and_manual_amount_reconcile():
    invoice, quotation, event, client, studio = invoice_records()
    studio.bank_name = studio.bank_account_holder = studio.bank_account_number = None
    studio.bank_branch = studio.brand_color_primary = studio.brand_color_secondary = None
    invoice.amount += Decimal("1000")
    invoice.notes = quotation.notes = None
    invoice.deliveries = []
    quotation.items = []
    _, text = pdf_text(render_invoice_pdf(invoice, quotation, event, client, studio))
    assert "Invoice adjustment" in text
    assert "LKR 1,000.00" in text
    assert "LKR 111,000.25" in text
    assert "Bank transfer details" not in text
    assert "None" not in text
    assert invoice_filename('../../INV/123\r\n"') == "INV-123.pdf"


def test_large_amounts_stay_on_one_line_and_light_themes_remain_readable():
    invoice, quotation, event, client, studio = invoice_records()
    invoice.amount = quotation.subtotal = quotation.total = Decimal("9999999999.99")
    invoice.advance_paid = quotation.discount = Decimal("0")
    quotation.items = quotation.items[:1]
    quotation.items[0].unit_price = quotation.items[0].total = invoice.amount
    studio.brand_color_primary = studio.brand_color_secondary = "#ffffff"
    reader, text = pdf_text(render_invoice_pdf(invoice, quotation, event, client, studio))
    assert text.count("LKR 9,999,999,999.99") == 5
    operations = reader.pages[0].get_contents().operations
    assert any(list(operands) == [0, 0, 0] for operands, op in operations if op == b"rg")


@pytest.fixture
def invoice_api():
    engine = create_engine(
        "sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    with Session(engine, expire_on_commit=False) as session:
        records = invoice_records()
        session.add_all(records)
        session.commit()
        user = User(id=uuid4(), studio_id=records[-1].id)
        db = AsyncMock(spec=AsyncSession)
        db.execute.side_effect = session.execute
        app.dependency_overrides[get_db] = lambda: db
        app.dependency_overrides[get_current_user] = lambda: user
        try:
            with TestClient(app) as client:
                yield client, session, records, user
        finally:
            app.dependency_overrides.clear()
    engine.dispose()


def test_download_endpoint_returns_latest_saved_details(invoice_api):
    client, session, records, _ = invoice_api
    invoice, _, _, _, studio = records
    invoice.advance_paid = Decimal("75000.50")
    studio.bank_account_number = "009999999999"
    session.commit()
    response = client.get(f"/api/v1/invoices/{invoice.id}/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["content-disposition"] == 'attachment; filename="INV-2026-001.pdf"'
    assert response.headers["cache-control"] == "private, no-store"
    _, text = pdf_text(response.content)
    assert "LKR 85,000.00" in text
    assert "009999999999" in text


def test_download_rejects_other_studio_and_unknown_invoice(invoice_api):
    client, _, records, user = invoice_api
    assert client.get(f"/api/v1/invoices/{uuid4()}/pdf").status_code == 404
    user.studio_id = uuid4()
    response = client.get(f"/api/v1/invoices/{records[0].id}/pdf")
    assert response.status_code == 404
    assert "application/pdf" not in response.headers["content-type"]


def test_download_requires_login(invoice_api):
    client, _, records, _ = invoice_api
    app.dependency_overrides.pop(get_current_user)
    assert client.get(f"/api/v1/invoices/{records[0].id}/pdf").status_code == 401
