from fastapi import APIRouter, status
from sqlalchemy import select

from app.modules.auth.dependencies import CurrentUser, Database
from app.modules.clients.model import Client
from app.modules.clients.schemas import ClientCreate, ClientRead

router = APIRouter()


@router.get("", response_model=list[ClientRead])
async def list_clients(db: Database, current_user: CurrentUser) -> list[Client]:
    result = await db.scalars(
        select(Client)
        .where(Client.studio_id == current_user.studio_id)
        .order_by(Client.created_at.desc())
    )
    return list(result)


@router.post("", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
async def create_client(payload: ClientCreate, db: Database, current_user: CurrentUser) -> Client:
    client = Client(studio_id=current_user.studio_id, **payload.model_dump())
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client
