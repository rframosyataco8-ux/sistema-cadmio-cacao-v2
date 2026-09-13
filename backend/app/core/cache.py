"""Caché con Redis (producción) y fallback en memoria (dev / Redis caído)."""
from __future__ import annotations

import json
import time
from threading import Lock
from typing import Any, Callable

from app.core.config import settings


class MemoryTTLCache:
    def __init__(self, default_ttl: float = 30.0, max_items: int = 256):
        self.default_ttl = default_ttl
        self.max_items = max_items
        self._data: dict[str, tuple[float, Any]] = {}
        self._lock = Lock()

    def get(self, key: str) -> Any | None:
        now = time.monotonic()
        with self._lock:
            item = self._data.get(key)
            if not item:
                return None
            expires, value = item
            if now > expires:
                del self._data[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: float | None = None) -> None:
        expires = time.monotonic() + (ttl if ttl is not None else self.default_ttl)
        with self._lock:
            if len(self._data) >= self.max_items:
                now = time.monotonic()
                for k in [k for k, (e, _) in self._data.items() if e < now]:
                    del self._data[k]
                if len(self._data) >= self.max_items:
                    oldest = min(self._data.items(), key=lambda x: x[1][0])[0]
                    del self._data[oldest]
            self._data[key] = (expires, value)

    def clear(self) -> None:
        with self._lock:
            self._data.clear()


class RedisTTLCache:
    def __init__(self, client, default_ttl: float = 30.0, prefix: str = "cadmio:"):
        self.client = client
        self.default_ttl = default_ttl
        self.prefix = prefix

    def _k(self, key: str) -> str:
        return f"{self.prefix}{key}"

    def get(self, key: str) -> Any | None:
        try:
            raw = self.client.get(self._k(key))
            if raw is None:
                return None
            return json.loads(raw)
        except Exception:
            return None

    def set(self, key: str, value: Any, ttl: float | None = None) -> None:
        try:
            sec = int(ttl if ttl is not None else self.default_ttl)
            self.client.setex(self._k(key), max(1, sec), json.dumps(value, default=str))
        except Exception:
            pass

    def clear(self) -> None:
        try:
            keys = list(self.client.scan_iter(match=f"{self.prefix}*", count=200))
            if keys:
                self.client.delete(*keys)
        except Exception:
            pass


class AppCache:
    """API unificada: Redis si está disponible, si no memoria."""

    def __init__(self, default_ttl: float = 45.0):
        self.default_ttl = default_ttl
        self._backend: Any = MemoryTTLCache(default_ttl=default_ttl)
        self.backend_name = "memory"
        self._init_redis()

    def _init_redis(self) -> None:
        url = (settings.REDIS_URL or "").strip()
        if not url:
            return
        try:
            import redis

            client = redis.from_url(
                url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
                health_check_interval=30,
            )
            client.ping()
            self._backend = RedisTTLCache(client, default_ttl=self.default_ttl)
            self.backend_name = "redis"
            print(f"[cache] Redis activo: {url}")
        except Exception as e:
            self._backend = MemoryTTLCache(default_ttl=self.default_ttl)
            self.backend_name = "memory"
            print(f"[cache] Redis no disponible ({e}); usando memoria")

    def get(self, key: str) -> Any | None:
        return self._backend.get(key)

    def set(self, key: str, value: Any, ttl: float | None = None) -> None:
        self._backend.set(key, value, ttl)

    def clear(self) -> None:
        self._backend.clear()

    def get_or_set(self, key: str, factory: Callable[[], Any], ttl: float | None = None) -> Any:
        hit = self.get(key)
        if hit is not None:
            return hit
        value = factory()
        self.set(key, value, ttl)
        return value


analytics_cache = AppCache(default_ttl=45.0)
