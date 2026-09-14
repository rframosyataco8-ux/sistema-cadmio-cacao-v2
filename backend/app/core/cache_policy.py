"""Política de expiración de caché por tipo de dato + jitter anti-avalancha."""
from __future__ import annotations

import hashlib
import random

TTL_KPI = 60
TTL_CHART = 45
TTL_CATALOG = 180
TTL_LIST = 25
TTL_DEFAULT = 30

JITTER_RATIO = 0.12

PREFIX_TTL: dict[str, int] = {
    "kpis": TTL_KPI,
    "by-product": TTL_CHART,
    "by-origin": TTL_CHART,
    "trend": TTL_CHART,
    "lots": TTL_CHART,
    "grain-trend": TTL_CHART,
    "catalog": TTL_CATALOG,
    "list": TTL_LIST,
}


def base_ttl_for_key(key: str) -> int:
    k = (key or "").lower()
    for prefix, ttl in PREFIX_TTL.items():
        if k == prefix or k.startswith(prefix + ":") or k.startswith(prefix + "-"):
            return ttl
    return TTL_DEFAULT


def ttl_for_key(key: str) -> int:
    """TTL final con jitter determinista por clave (anti thundering herd)."""
    base = base_ttl_for_key(key)
    h = int(hashlib.md5(key.encode("utf-8")).hexdigest()[:8], 16)
    span = max(1, int(base * JITTER_RATIO))
    offset = (h % (2 * span + 1)) - span
    return max(5, base + offset)


def ttl_with_random_jitter(key: str) -> int:
    base = base_ttl_for_key(key)
    span = max(1, int(base * JITTER_RATIO))
    return max(5, base + random.randint(-span, span))
