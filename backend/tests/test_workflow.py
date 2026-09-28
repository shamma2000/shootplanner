from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.modules.invoices.model import Invoice
from app.modules.quotations.router import quotation_item
from app.modules.quotations.schemas import QuotationItemCreate, QuotationWorkflowCreate


def test_quotation_item_calculates_quantity_total() -> None:
    item = quotation_item(
        QuotationItemCreate(
            item_type="add_on",
            name="Wedding album",
            quantity=2,
            unit_price=Decimal("12500.00"),
        )
    )

    assert item.total == Decimal("25000.00")


def test_invoice_balance_never_becomes_negative() -> None:
    invoice = Invoice(amount=Decimal("100000.00"), advance_paid=Decimal("125000.00"))

    assert invoice.balance_due == Decimal("0")


def test_workflow_requires_at_least_one_priced_or_deliverable_item() -> None:
    with pytest.raises(ValidationError):
        QuotationWorkflowCreate.model_validate(
            {
                "client": {
                    "bride_name": "Asha",
                    "groom_name": "Nimal",
                    "primary_phone": "0771234567",
                },
                "events": [
                    {
                        "event_type": "Wedding",
                        "event_date": "2026-10-10",
                        "location": "Colombo",
                    }
                ],
                "items": [],
            }
        )
