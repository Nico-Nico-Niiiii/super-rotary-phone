from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Cookie, Header
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from ..core.config import settings
from ..core.utils import get_route
from typing import Optional

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=get_route("auth", "login"))

def create_access_token_longterm(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=365)  # ⬅️ 1 year expiry
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

# async def get_current_user(token: str = Cookie(None)):
#     """
#     Dependency for protected routes that validates JWT token from cookie
#     """
#     if not token:
#         raise HTTPException(
#             status_code=401,
#             detail="Not authenticated",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
    
#     payload = verify_token(token)
#     if not payload:
#         raise HTTPException(
#             status_code=401,
#             detail="Invalid token or expired token",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
    
#     return payload


async def get_current_user(
    token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """
    Dependency for protected routes that validates JWT token
    from either a cookie or an Authorization header.
    """
    if not token:
        # Try to extract from Authorization header
        if authorization and authorization.startswith("Bearer "):
            token = authorization[7:]  # Remove 'Bearer ' prefix

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload

def create_refresh_token(data: dict):
    """
    Create a refresh token with longer expiry
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "refresh": True})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def set_auth_cookies(response, access_token: str, refresh_token: str = None):
    """
    Helper function to set authentication cookies
    """
    response.set_cookie(
        key="token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="Strict",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="Strict",
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )

def clear_auth_cookies(response):
    """
    Helper function to clear authentication cookies
    """
    response.delete_cookie("token")
    response.delete_cookie("refresh_token")