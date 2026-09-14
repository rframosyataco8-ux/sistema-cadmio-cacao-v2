"""Caché Redis (prod) / memoria (fallback) con política de TTL y métricas."""
from __future__ import annotations

import json
import time
from threading import Lock
from typing import Any, Callable

from app.core.config import settings
from app.core.cache_policy import ttl_for_key, TTL_DEFAULT


class CacheStats:
    def __init__(self) -> None:
        self.hits = 0
        self.misses = 0
        self.sets = 0
        self.clears = 0
        self._lock = Lock()

    def hit(self) -> None:
        with self._lock:
            self.hits += 1

    def miss(self) -> None:
        with self._lock:
            self.misses += 1

    def set(self) -> None:
        with self._lock:
            self.sets += 1

    def clear(self) -> None:
        with self._lock:
            self.clears += 1

    def snapshot(self) -> dict:
        with self._lock:
            total = self.hits + self.misses
            rate = (self.hits / total) if total else 0.0
            return {
                "hits": self.hits,
                "misses": self.misses,
                "sets": self.sets,
                "clears": self.clears,
                "hit_rate": round(rate, 4),
            }


class MemoryTTLCache:
    def __init__(self, default_ttl: float = TTL_DEFAULT, max_items: int = 256):
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
        sec = float(ttl if ttl is not None else self.default_ttl)
        expires = time.monotonic() + max(1.0, sec)
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

    def size(self) -> int:
        with self._lock:
            return len(self._data)


class RedisTTLCache:
    def __init__(self, client, default_ttl: float = TTL_DEFAULT, prefix: str = "cadmio:"):
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

    def size(self) -> int:
        try:
            return sum(1 for _ in self.client.scan_iter(match=f"{self.prefix}*", count=200))
        except Exception:
            return 0


class AppCache:
    def __init__(self, default_ttl: float = TTL_DEFAULT):
        self.default_ttl = default_ttl
        self._backend: Any = MemoryTTLCache(default_ttl=default_ttl)
        self.backend_name = "memory"
        self.stats = CacheStats()
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
        val = self._backend.get(key)
        if val is not None:
            self.stats.hit()
            return val
        self.stats.miss()
        return None

    def set(self, key: str, value: Any, ttl: float | None = None) -> None:
        if ttl is None:
            ttl = float(ttl_for_key(key))
        self._backend.set(key, value, ttl)
        self.stats.set()

    def clear(self) -> None:
        self._backend.clear()
        self.stats.clear()

    def get_or_set(self, key: str, factory: Callable[[], Any], ttl: float | None = None) -> Any:
        hit = self.get(key)
        if hit is not None:
            return hit
        value = factory()
        if ttl is None:
            ttl = float(ttl_for_key(key))
        self.set(key, value, ttl)
        return value

    def info(self) -> dict:
        return {
            "backend": self.backend_name,
            "stats": self.stats.snapshot(),
            "entries": getattr(self._backend, "size", lambda: 0)(),
        }


analytics_cache = AppCache()
