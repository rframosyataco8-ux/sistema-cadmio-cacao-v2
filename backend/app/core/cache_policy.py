"""Política de expiración de caché por tipo de dato."""
from __future__ import annotations

TTL_KPI = 60
TTL_CHART = 45
TTL_CATALOG = 120
TTL_LIST = 20
TTL_DEFAULT = 30

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


def ttl_for_key(key: str) -> int:
    k = (key or "").lower()
    for prefix, ttl in PREFIX_TTL.items():
        if k == prefix or k.startswith(prefix + ":") or k.startswith(prefix + "-"):
            return ttl
    return TTL_DEFAULT
