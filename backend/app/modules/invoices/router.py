from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.invoices.model import Invoice
from app.modules.invoices.schemas import InvoiceCreate, InvoiceRead

router = APIRouter()
Database = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[InvoiceRead])
async def list_invoices(db: Database) -> list[Invoice]:
    result = await db.scalars(select(Invoice).order_by(Invoice.created_at.desc()))
    return list(result)


@router.post("", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def create_invoice(payload: InvoiceCreate, db: Database) -> Invoice:
    invoice = Invoice(**payload.model_dump())
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice
