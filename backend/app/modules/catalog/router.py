from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.modules.auth.dependencies import CurrentUser, Database
from app.modules.catalog.model import AddOn, ServicePackage
from app.modules.catalog.schemas import (
    AddOnCreate,
    AddOnRead,
    AddOnUpdate,
    PackageCreate,
    PackageRead,
    PackageUpdate,
)

router = APIRouter()


@router.get("/packages", response_model=list[PackageRead])
async def list_packages(db: Database, current_user: CurrentUser) -> list[ServicePackage]:
    result = await db.scalars(
        select(ServicePackage)
        .where(ServicePackage.studio_id == current_user.studio_id)
        .order_by(ServicePackage.created_at.desc())
    )
    return list(result)


@router.post("/packages", response_model=PackageRead, status_code=status.HTTP_201_CREATED)
async def create_package(
    payload: PackageCreate, db: Database, current_user: CurrentUser
) -> ServicePackage:
    package = ServicePackage(studio_id=current_user.studio_id, **payload.model_dump())
    db.add(package)
    await db.commit()
    await db.refresh(package)
    return package


@router.patch("/packages/{package_id}", response_model=PackageRead)
async def update_package(
    package_id: UUID,
    payload: PackageUpdate,
    db: Database,
    current_user: CurrentUser,
) -> ServicePackage:
    package = await db.scalar(
        select(ServicePackage).where(
            ServicePackage.id == package_id,
            ServicePackage.studio_id == current_user.studio_id,
        )
    )
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(package, key, value)
    await db.commit()
    await db.refresh(package)
    return package


@router.delete("/packages/{package_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_package(package_id: UUID, db: Database, current_user: CurrentUser) -> None:
    package = await db.scalar(
        select(ServicePackage).where(
            ServicePackage.id == package_id,
            ServicePackage.studio_id == current_user.studio_id,
        )
    )
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    await db.delete(package)
    await db.commit()


@router.get("/add-ons", response_model=list[AddOnRead])
async def list_add_ons(db: Database, current_user: CurrentUser) -> list[AddOn]:
    result = await db.scalars(
        select(AddOn)
        .where(AddOn.studio_id == current_user.studio_id)
        .order_by(AddOn.created_at.desc())
    )
    return list(result)


@router.post("/add-ons", response_model=AddOnRead, status_code=status.HTTP_201_CREATED)
async def create_add_on(payload: AddOnCreate, db: Database, current_user: CurrentUser) -> AddOn:
    add_on = AddOn(studio_id=current_user.studio_id, **payload.model_dump())
    db.add(add_on)
    await db.commit()
    await db.refresh(add_on)
    return add_on


@router.patch("/add-ons/{add_on_id}", response_model=AddOnRead)
async def update_add_on(
    add_on_id: UUID,
    payload: AddOnUpdate,
    db: Database,
    current_user: CurrentUser,
) -> AddOn:
    add_on = await db.scalar(
        select(AddOn).where(AddOn.id == add_on_id, AddOn.studio_id == current_user.studio_id)
    )
    if not add_on:
        raise HTTPException(status_code=404, detail="Add-on not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(add_on, key, value)
    await db.commit()
    await db.refresh(add_on)
    return add_on


@router.delete("/add-ons/{add_on_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_add_on(add_on_id: UUID, db: Database, current_user: CurrentUser) -> None:
    add_on = await db.scalar(
        select(AddOn).where(AddOn.id == add_on_id, AddOn.studio_id == current_user.studio_id)
    )
    if not add_on:
        raise HTTPException(status_code=404, detail="Add-on not found")
    await db.delete(add_on)
    await db.commit()
