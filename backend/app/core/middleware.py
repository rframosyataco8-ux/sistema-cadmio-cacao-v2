"""Seguridad y estabilidad: rate limit, tamaño de body, cabeceras."""
from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Límite por IP:
    - general: RATE_LIMIT_REQUESTS por ventana
    - login: más estricto (evita fuerza bruta)
    """

    def __init__(
        self,
        app,
        requests_per_minute: int = 120,
        login_per_minute: int = 10,
    ):
        super().__init__(app)
        self.requests_per_minute = max(10, requests_per_minute)
        self.login_per_minute = max(3, login_per_minute)
        self._hits: dict[str, deque] = defaultdict(deque)
        self._lock = Lock()

    def _client_key(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client:
            return request.client.host or "unknown"
        return "unknown"

    def _allow(self, key: str, limit: int, window: float = 60.0) -> bool:
        now = time.monotonic()
        with self._lock:
            q = self._hits[key]
            while q and now - q[0] > window:
                q.popleft()
            if len(q) >= limit:
                return False
            q.append(now)
            return True

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path or ""
        if path in ("/health", "/", "/docs", "/redoc", "/openapi.json") or path.endswith("/openapi.json"):
            return await call_next(request)

        ip = self._client_key(request)
        is_login = path.endswith("/auth/login") and request.method == "POST"
        limit = self.login_per_minute if is_login else self.requests_per_minute
        bucket = f"{'login' if is_login else 'api'}:{ip}"

        if not self._allow(bucket, limit):
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Demasiadas peticiones. Espera un momento e inténtalo de nuevo.",
                    "code": "rate_limited",
                },
                headers={"Retry-After": "60"},
            )
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")
        if request.url.path.startswith("/api/"):
            response.headers.setdefault("Cache-Control", "no-store")
        return response


class LimitRequestSizeMiddleware(BaseHTTPMiddleware):
    """Rechaza cuerpos demasiado grandes (protege memoria del servidor)."""

    def __init__(self, app, max_body_bytes: int = 1_000_000):
        super().__init__(app)
        self.max_body_bytes = max_body_bytes

    async def dispatch(self, request: Request, call_next) -> Response:
        cl = request.headers.get("content-length")
        if cl:
            try:
                if int(cl) > self.max_body_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": "El cuerpo de la petición es demasiado grande.",
                            "code": "payload_too_large",
                        },
                    )
            except ValueError:
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Content-Length inválido.", "code": "bad_request"},
                )
        return await call_next(request)
