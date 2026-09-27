"""Create initial ShootPlanner tables."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260927_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def timestamps() -> list[sa.Column]:
    return [
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "clients",
        *timestamps(),
        sa.Column("bride_name", sa.String(length=120), nullable=False),
        sa.Column("groom_name", sa.String(length=120), nullable=False),
        sa.Column("primary_phone", sa.String(length=30), nullable=False),
        sa.Column("optional_phone", sa.String(length=30), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_clients_email", "clients", ["email"])
    op.create_index("ix_clients_primary_phone", "clients", ["primary_phone"])

    op.create_table(
        "events",
        *timestamps(),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("event_type", sa.String(length=40), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("hotel", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_events_event_date", "events", ["event_date"])
    op.create_index("ix_events_event_type", "events", ["event_type"])
    op.create_index("ix_events_status", "events", ["status"])

    op.create_table(
        "quotations",
        *timestamps(),
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        sa.Column("discount", sa.Numeric(12, 2), nullable=False),
        sa.Column("total", sa.Numeric(12, 2), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_quotations_status", "quotations", ["status"])

    op.create_table(
        "invoices",
        *timestamps(),
        sa.Column("quotation_id", sa.Uuid(), nullable=False),
        sa.Column("invoice_number", sa.String(length=50), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.ForeignKeyConstraint(["quotation_id"], ["quotations.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("invoice_number"),
        sa.UniqueConstraint("quotation_id"),
    )
    op.create_index("ix_invoices_due_date", "invoices", ["due_date"])
    op.create_index("ix_invoices_invoice_number", "invoices", ["invoice_number"])
    op.create_index("ix_invoices_status", "invoices", ["status"])


def downgrade() -> None:
    op.drop_table("invoices")
    op.drop_table("quotations")
    op.drop_table("events")
    op.drop_table("clients")
