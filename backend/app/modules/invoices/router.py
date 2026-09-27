from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.modules.auth.dependencies import CurrentUser, Database
from app.modules.clients.model import Client
from app.modules.events.model import Event
from app.modules.invoices.model import Invoice
from app.modules.invoices.schemas import InvoiceCreate, InvoiceRead
from app.modules.quotations.model import Quotation

router = APIRouter()


@router.get("", response_model=list[InvoiceRead])
async def list_invoices(db: Database, current_user: CurrentUser) -> list[Invoice]:
    result = await db.scalars(
        select(Invoice)
        .join(Quotation, Invoice.quotation_id == Quotation.id)
        .join(Event, Quotation.event_id == Event.id)
        .join(Client, Event.client_id == Client.id)
        .where(Client.studio_id == current_user.studio_id)
        .order_by(Invoice.created_at.desc())
    )
    return list(result)


@router.post("", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def create_invoice(payload: InvoiceCreate, db: Database, current_user: CurrentUser) -> Invoice:
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
    invoice = Invoice(**payload.model_dump())
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice
