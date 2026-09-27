from typing import Annotated

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.modules.auth.model import User

Database = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: Database,
    session_token: Annotated[str | None, Cookie(alias=settings.auth_cookie_name)] = None,
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
    )
    if not session_token:
        raise credentials_error

    try:
        user_id = decode_access_token(session_token)
    except (jwt.PyJWTError, ValueError, KeyError):
        raise credentials_error from None

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise credentials_error
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
