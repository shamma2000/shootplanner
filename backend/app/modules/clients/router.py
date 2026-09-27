from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.clients.model import Client
from app.modules.clients.schemas import ClientCreate, ClientRead

router = APIRouter()
Database = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[ClientRead])
async def list_clients(db: Database) -> list[Client]:
    result = await db.scalars(select(Client).order_by(Client.created_at.desc()))
    return list(result)


@router.post("", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
async def create_client(payload: ClientCreate, db: Database) -> Client:
    client = Client(**payload.model_dump())
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client
