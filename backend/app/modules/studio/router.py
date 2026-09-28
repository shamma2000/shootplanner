from fastapi import APIRouter, HTTPException

from app.modules.auth.dependencies import CurrentUser, Database
from app.modules.auth.model import Studio
from app.modules.studio.schemas import StudioRead, StudioUpdate

router = APIRouter()


@router.get("", response_model=StudioRead)
async def get_studio(db: Database, current_user: CurrentUser) -> Studio:
    studio = await db.get(Studio, current_user.studio_id)
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    return studio


@router.patch("", response_model=StudioRead)
async def update_studio(
    payload: StudioUpdate, db: Database, current_user: CurrentUser
) -> Studio:
    studio = await db.get(Studio, current_user.studio_id)
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(studio, key, value)
    await db.commit()
    await db.refresh(studio)
    return studio
