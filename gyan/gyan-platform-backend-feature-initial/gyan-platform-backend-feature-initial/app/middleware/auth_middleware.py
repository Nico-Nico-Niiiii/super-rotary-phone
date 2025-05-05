from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt
from ..core.config import settings

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        print(f"🛑 Checking route: {request.url.path}")  # Debugging

        public_routes = {"/auth/login", "/auth/register", "/docs", "/openapi.json"}
        
        if request.url.path in public_routes or request.url.path.startswith("/static"):
            print("✅ Public route, skipping auth check.")
            return await call_next(request)
        print("Request", request)
        token = request.cookies.get("token")
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove "Bearer " prefix

        print("🔐 Token:", token)
       
        if not token:
            print("❌ No token found!")
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication token is missing"}
            )

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            request.state.user = payload  # Store user info in request state
            print(f"✅ Token Verified: {payload}")
        except JWTError:
            print("❌ Invalid or expired token")
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"}
            )

        response = await call_next(request)
        return response
