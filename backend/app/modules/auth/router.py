from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.modules.auth.dependencies import CurrentUser, Database
from app.modules.auth.model import Studio, User
from app.modules.auth.schemas import LoginRequest, RegisterRequest, UserRead

router = APIRouter()


def set_session_cookie(response: Response, token: str, *, persistent: bool = True) -> None:
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.access_token_minutes * 60 if persistent else None,
        path="/",
    )


def user_response(user: User, studio: Studio) -> UserRead:
    return UserRead(
        id=user.id,
        studio_id=studio.id,
        studio_name=studio.name,
        subdomain=studio.subdomain,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
    )


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, response: Response, db: Database) -> UserRead:
    existing = await db.scalar(
        select(User.id)
        .join(Studio, User.studio_id == Studio.id)
        .where(or_(User.email == str(payload.email).lower(), Studio.subdomain == payload.subdomain))
    )
    if existing:
        raise HTTPException(status_code=409, detail="Email or subdomain is already registered")

    studio = Studio(name=payload.studio_name.strip(), subdomain=payload.subdomain)
    db.add(studio)
    await db.flush()
    user = User(
        studio_id=studio.id,
        name=payload.name.strip(),
        email=str(payload.email).lower(),
        phone=payload.phone.strip(),
        password_hash=hash_password(payload.password),
        role="owner",
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email or subdomain is already registered") from None
    await db.refresh(studio)
    await db.refresh(user)
    set_session_cookie(response, create_access_token(user.id))
    return user_response(user, studio)


@router.post("/login", response_model=UserRead)
async def login(payload: LoginRequest, response: Response, db: Database) -> UserRead:
    user = await db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user or not verify_password(payload.password, user.password_hash) or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    studio = await db.get(Studio, user.studio_id)
    if not studio:
        raise HTTPException(status_code=401, detail="Invalid account")
    set_session_cookie(response, create_access_token(user.id), persistent=payload.remember_me)
    return user_response(user, studio)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    response.delete_cookie(
        settings.auth_cookie_name,
        path="/",
        secure=settings.cookie_secure,
        httponly=True,
        samesite="lax",
    )


@router.get("/me", response_model=UserRead)
async def me(current_user: CurrentUser, db: Database) -> UserRead:
    studio = await db.get(Studio, current_user.studio_id)
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    return user_response(current_user, studio)
