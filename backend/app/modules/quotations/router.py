from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.modules.auth.dependencies import CurrentUser, Database
from app.modules.clients.model import Client
from app.modules.events.model import Event
from app.modules.quotations.model import Quotation
from app.modules.quotations.schemas import QuotationCreate, QuotationRead

router = APIRouter()


@router.get("", response_model=list[QuotationRead])
async def list_quotations(db: Database, current_user: CurrentUser) -> list[Quotation]:
    result = await db.scalars(
        select(Quotation)
        .join(Event, Quotation.event_id == Event.id)
        .join(Client, Event.client_id == Client.id)
        .where(Client.studio_id == current_user.studio_id)
        .order_by(Quotation.created_at.desc())
    )
    return list(result)


@router.post("", response_model=QuotationRead, status_code=status.HTTP_201_CREATED)
async def create_quotation(
    payload: QuotationCreate, db: Database, current_user: CurrentUser
) -> Quotation:
    event = await db.scalar(
        select(Event)
        .join(Client, Event.client_id == Client.id)
        .where(Event.id == payload.event_id, Client.studio_id == current_user.studio_id)
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    quotation = Quotation(**payload.model_dump())
    db.add(quotation)
    await db.commit()
    await db.refresh(quotation)
    return quotation
