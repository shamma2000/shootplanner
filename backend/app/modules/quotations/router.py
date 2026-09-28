from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.modules.auth.dependencies import CurrentUser, Database
from app.modules.clients.model import Client
from app.modules.events.model import Event
from app.modules.quotations.model import Quotation, QuotationItem
from app.modules.quotations.schemas import (
    QuotationCreate,
    QuotationItemCreate,
    QuotationRead,
    QuotationUpdate,
    QuotationWorkflowCreate,
)

router = APIRouter()


def quotation_item(payload: QuotationItemCreate) -> QuotationItem:
    return QuotationItem(
        **payload.model_dump(),
        total=payload.unit_price * payload.quantity,
    )


async def tenant_quotation(
    quotation_id: UUID, db: Database, current_user: CurrentUser
) -> Quotation | None:
    return await db.scalar(
        select(Quotation)
        .options(selectinload(Quotation.items))
        .join(Event, Quotation.event_id == Event.id)
        .join(Client, Event.client_id == Client.id)
        .where(Quotation.id == quotation_id, Client.studio_id == current_user.studio_id)
    )


@router.get("", response_model=list[QuotationRead])
async def list_quotations(db: Database, current_user: CurrentUser) -> list[Quotation]:
    result = await db.scalars(
        select(Quotation)
        .options(selectinload(Quotation.items))
        .join(Event, Quotation.event_id == Event.id)
        .join(Client, Event.client_id == Client.id)
        .where(Client.studio_id == current_user.studio_id)
        .order_by(Quotation.created_at.desc())
    )
    return list(result.unique())


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

    data = payload.model_dump(exclude={"items"})
    items = [quotation_item(item) for item in payload.items]
    if items:
        subtotal = sum((item.total for item in items), Decimal("0"))
        data["subtotal"] = subtotal
        data["total"] = max(Decimal("0"), subtotal - payload.discount)
    quotation = Quotation(**data, items=items)
    db.add(quotation)
    await db.commit()
    saved = await tenant_quotation(quotation.id, db, current_user)
    if not saved:
        raise HTTPException(status_code=500, detail="Unable to load saved quotation")
    return saved


@router.post("/workflow", response_model=QuotationRead, status_code=status.HTTP_201_CREATED)
async def create_quotation_workflow(
    payload: QuotationWorkflowCreate,
    db: Database,
    current_user: CurrentUser,
) -> Quotation:
    client = Client(studio_id=current_user.studio_id, **payload.client.model_dump())
    db.add(client)
    await db.flush()

    events = [
        Event(client_id=client.id, status="Draft", **event_payload.model_dump())
        for event_payload in payload.events
    ]
    db.add_all(events)
    await db.flush()

    items = [quotation_item(item) for item in payload.items]
    subtotal = sum((item.total for item in items), Decimal("0"))
    total = max(Decimal("0"), subtotal - payload.discount)
    first_package = next(
        (item.name for item in items if item.item_type in {"package", "custom"}),
        None,
    )
    quotation = Quotation(
        event_id=events[0].id,
        subtotal=subtotal,
        discount=payload.discount,
        total=total,
        package_name=first_package,
        service_type=payload.service_type,
        notes=payload.notes,
        status=payload.status,
        items=items,
    )
    db.add(quotation)
    await db.commit()
    saved = await tenant_quotation(quotation.id, db, current_user)
    if not saved:
        raise HTTPException(status_code=500, detail="Unable to load saved quotation")
    return saved


@router.patch("/{quotation_id}", response_model=QuotationRead)
async def update_quotation(
    quotation_id: UUID,
    payload: QuotationUpdate,
    db: Database,
    current_user: CurrentUser,
) -> Quotation:
    quotation = await tenant_quotation(quotation_id, db, current_user)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    quotation.status = payload.status
    await db.commit()
    saved = await tenant_quotation(quotation.id, db, current_user)
    if not saved:
        raise HTTPException(status_code=500, detail="Unable to load updated quotation")
    return saved
