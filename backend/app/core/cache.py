"""Caché en memoria con TTL — reduce carga de BD en lecturas repetidas."""
from __future__ import annotations

import time
from threading import Lock
from typing import Any, Callable


class TTLCache:
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
                expired = [k for k, (e, _) in self._data.items() if e < now]
                for k in expired:
                    del self._data[k]
                if len(self._data) >= self.max_items:
                    oldest = min(self._data.items(), key=lambda x: x[1][0])[0]
                    del self._data[oldest]
            self._data[key] = (expires, value)

    def clear(self) -> None:
        with self._lock:
            self._data.clear()

    def get_or_set(self, key: str, factory: Callable[[], Any], ttl: float | None = None) -> Any:
        hit = self.get(key)
        if hit is not None:
            return hit
        value = factory()
        self.set(key, value, ttl)
        return value


analytics_cache = TTLCache(default_ttl=45.0, max_items=64)
