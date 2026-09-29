from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.modules.auth.dependencies import CurrentUser, Database
from app.modules.auth.model import Studio
from app.modules.clients.model import Client
from app.modules.events.model import Event
from app.modules.invoices.model import DeliveryItem, Invoice
from app.modules.invoices.pdf import invoice_filename, render_invoice_pdf
from app.modules.invoices.schemas import (
    DeliveryItemRead,
    DeliveryUpdate,
    InvoiceCreate,
    InvoiceRead,
    InvoiceUpdate,
)
from app.modules.quotations.model import Quotation

router = APIRouter()


async def tenant_invoice(
    invoice_id: UUID, db: Database, current_user: CurrentUser
) -> Invoice | None:
    return await db.scalar(
        select(Invoice)
        .options(selectinload(Invoice.deliveries))
        .join(Quotation, Invoice.quotation_id == Quotation.id)
        .join(Event, Quotation.event_id == Event.id)
        .join(Client, Event.client_id == Client.id)
        .where(Invoice.id == invoice_id, Client.studio_id == current_user.studio_id)
    )


@router.get("", response_model=list[InvoiceRead])
async def list_invoices(db: Database, current_user: CurrentUser) -> list[Invoice]:
    result = await db.scalars(
        select(Invoice)
        .options(selectinload(Invoice.deliveries))
        .join(Quotation, Invoice.quotation_id == Quotation.id)
        .join(Event, Quotation.event_id == Event.id)
        .join(Client, Event.client_id == Client.id)
        .where(Client.studio_id == current_user.studio_id)
        .order_by(Invoice.created_at.desc())
    )
    return list(result.unique())


@router.get("/{invoice_id}/pdf", response_class=Response)
async def download_invoice_pdf(
    invoice_id: UUID, db: Database, current_user: CurrentUser
) -> Response:
    result = await db.execute(
        select(Invoice, Quotation, Event, Client, Studio)
        .join(Quotation, Invoice.quotation_id == Quotation.id)
        .join(Event, Quotation.event_id == Event.id)
        .join(Client, Event.client_id == Client.id)
        .join(Studio, Client.studio_id == Studio.id)
        .options(selectinload(Invoice.deliveries), selectinload(Quotation.items))
        .where(Invoice.id == invoice_id, Studio.id == current_user.studio_id)
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    content = await run_in_threadpool(render_invoice_pdf, *row)
    filename = invoice_filename(row[0].invoice_number)
    return Response(
        content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.post("", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    payload: InvoiceCreate, db: Database, current_user: CurrentUser
) -> Invoice:
    quotation = await db.scalar(
        select(Quotation)
        .join(Event, Quotation.event_id == Event.id)
        .join(Client, Event.client_id == Client.id)
        .where(
            Quotation.id == payload.quotation_id,
            Client.studio_id == current_user.studio_id,
        )
    )
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if payload.advance_paid > payload.amount:
        raise HTTPException(status_code=422, detail="Advance cannot exceed invoice amount")
    invoice = Invoice(**payload.model_dump())
    db.add(invoice)
    await db.commit()
    saved = await tenant_invoice(invoice.id, db, current_user)
    if not saved:
        raise HTTPException(status_code=500, detail="Unable to load saved invoice")
    return saved


@router.post(
    "/from-quotation/{quotation_id}",
    response_model=InvoiceRead,
    status_code=status.HTTP_201_CREATED,
)
async def convert_quotation_to_invoice(
    quotation_id: UUID,
    db: Database,
    current_user: CurrentUser,
) -> Invoice:
    quotation = await db.scalar(
        select(Quotation)
        .options(selectinload(Quotation.items))
        .join(Event, Quotation.event_id == Event.id)
        .join(Client, Event.client_id == Client.id)
        .where(Quotation.id == quotation_id, Client.studio_id == current_user.studio_id)
    )
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    existing = await db.scalar(select(Invoice.id).where(Invoice.quotation_id == quotation.id))
    if existing:
        raise HTTPException(status_code=409, detail="This quotation already has an invoice")

    invoice = Invoice(
        quotation_id=quotation.id,
        invoice_number=f"INV-{date.today().year}-{quotation.id.hex[:8].upper()}",
        amount=quotation.total,
        advance_paid=0,
        due_date=date.today() + timedelta(days=14),
        notes=quotation.notes,
        status="Pending",
        deliveries=[
            DeliveryItem(name=item.name, status="Pending")
            for item in quotation.items
            if item.item_type == "deliverable"
        ],
    )
    quotation.status = "Accepted"
    db.add(invoice)
    await db.commit()
    saved = await tenant_invoice(invoice.id, db, current_user)
    if not saved:
        raise HTTPException(status_code=500, detail="Unable to load converted invoice")
    return saved


@router.patch("/{invoice_id}", response_model=InvoiceRead)
async def update_invoice(
    invoice_id: UUID,
    payload: InvoiceUpdate,
    db: Database,
    current_user: CurrentUser,
) -> Invoice:
    invoice = await tenant_invoice(invoice_id, db, current_user)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    changes = payload.model_dump(exclude_unset=True)
    next_advance = changes.get("advance_paid", invoice.advance_paid)
    if next_advance > invoice.amount:
        raise HTTPException(status_code=422, detail="Advance cannot exceed invoice amount")
    for key, value in changes.items():
        setattr(invoice, key, value)
    if invoice.balance_due == 0:
        invoice.status = "Paid"
    await db.commit()
    saved = await tenant_invoice(invoice.id, db, current_user)
    if not saved:
        raise HTTPException(status_code=500, detail="Unable to load updated invoice")
    return saved


@router.patch("/deliveries/{delivery_id}", response_model=DeliveryItemRead)
async def update_delivery(
    delivery_id: UUID,
    payload: DeliveryUpdate,
    db: Database,
    current_user: CurrentUser,
) -> DeliveryItem:
    delivery = await db.scalar(
        select(DeliveryItem)
        .join(Invoice, DeliveryItem.invoice_id == Invoice.id)
        .join(Quotation, Invoice.quotation_id == Quotation.id)
        .join(Event, Quotation.event_id == Event.id)
        .join(Client, Event.client_id == Client.id)
        .where(DeliveryItem.id == delivery_id, Client.studio_id == current_user.studio_id)
    )
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery item not found")
    delivery.status = payload.status
    delivery.due_date = payload.due_date
    delivery.delivered_at = datetime.now(UTC) if payload.status == "Delivered" else None
    await db.commit()
    await db.refresh(delivery)
    return delivery
