"""Métricas Prometheus para monitoreo de salud y rendimiento."""
from __future__ import annotations

import time
from typing import Callable

from prometheus_client import Counter, Histogram, Gauge, Info, generate_latest, CONTENT_TYPE_LATEST, REGISTRY
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

HTTP_REQUESTS = Counter(
    "cadmio_http_requests_total",
    "Total de peticiones HTTP",
    ["method", "path", "status"],
)
HTTP_LATENCY = Histogram(
    "cadmio_http_request_duration_seconds",
    "Latencia de peticiones HTTP",
    ["method", "path"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)
HTTP_IN_PROGRESS = Gauge(
    "cadmio_http_requests_in_progress",
    "Peticiones en curso",
)

APP_INFO = Info("cadmio_app", "Información de la aplicación")


def normalize_path(path: str) -> str:
    parts = path.strip("/").split("/")
    out = []
    for p in parts:
        if p.isdigit():
            out.append("{id}")
        else:
            out.append(p)
    return "/" + "/".join(out) if out else "/"


class PrometheusMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path or "/"
        if path in ("/metrics", "/health", "/favicon.ico"):
            return await call_next(request)

        method = request.method
        label_path = normalize_path(path)
        HTTP_IN_PROGRESS.inc()
        start = time.perf_counter()
        status = 500
        try:
            response = await call_next(request)
            status = response.status_code
            return response
        finally:
            elapsed = time.perf_counter() - start
            HTTP_IN_PROGRESS.dec()
            HTTP_REQUESTS.labels(method=method, path=label_path, status=str(status)).inc()
            HTTP_LATENCY.labels(method=method, path=label_path).observe(elapsed)


def metrics_response() -> Response:
    try:
        from app.core.cache import analytics_cache
        from app.core.config import settings

        snap = analytics_cache.stats.snapshot()
        APP_INFO.info(
            {
                "version": settings.VERSION,
                "cache_backend": analytics_cache.backend_name,
                "cache_hit_rate": str(snap.get("hit_rate", 0)),
            }
        )
    except Exception:
        pass
    data = generate_latest(REGISTRY)
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)
