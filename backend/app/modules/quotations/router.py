from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.quotations.model import Quotation
from app.modules.quotations.schemas import QuotationCreate, QuotationRead

router = APIRouter()
Database = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[QuotationRead])
async def list_quotations(db: Database) -> list[Quotation]:
    result = await db.scalars(select(Quotation).order_by(Quotation.created_at.desc()))
    return list(result)


@router.post("", response_model=QuotationRead, status_code=status.HTTP_201_CREATED)
async def create_quotation(payload: QuotationCreate, db: Database) -> Quotation:
    quotation = Quotation(**payload.model_dump())
    db.add(quotation)
    await db.commit()
    await db.refresh(quotation)
    return quotation
