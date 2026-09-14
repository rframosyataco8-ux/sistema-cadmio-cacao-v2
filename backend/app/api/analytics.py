from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services import analytics as an
from app.core.cache import analytics_cache
from app.core.cache_policy import base_ttl_for_key

router = APIRouter(prefix="/analytics", tags=["Analytics / Gráficos"])


def _cached(key: str, factory):
    return analytics_cache.get_or_set(key, factory, ttl=None)


def _ttl_header(key: str) -> str:
    return str(base_ttl_for_key(key))


@router.get("/kpis")
def get_kpis(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response.headers["Cache-Control"] = f"private, max-age={_ttl_header('kpis')}"
    response.headers["X-Cache-TTL"] = _ttl_header("kpis")
    return _cached("kpis", lambda: an.dashboard_kpis(db))


@router.get("/charts/by-product")
def chart_by_product(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response.headers["Cache-Control"] = f"private, max-age={_ttl_header('by-product')}"
    response.headers["X-Cache-TTL"] = _ttl_header("by-product")
    return _cached("by-product", lambda: an.chart_cadmium_by_product(db))


@router.get("/charts/by-origin-grain")
def chart_by_origin(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response.headers["Cache-Control"] = f"private, max-age={_ttl_header('by-origin')}"
    response.headers["X-Cache-TTL"] = _ttl_header("by-origin")
    return _cached("by-origin-grain", lambda: an.chart_cadmium_by_origin_grain(db))


@router.get("/charts/trend")
def chart_trend(
    response: Response,
    product_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    key = f"trend:{product_id or 'all'}"
    response.headers["Cache-Control"] = f"private, max-age={_ttl_header(key)}"
    response.headers["X-Cache-TTL"] = _ttl_header(key)
    return _cached(key, lambda: an.chart_trend_over_time(db, product_id=product_id))


@router.get("/charts/lots")
def chart_lots(
    response: Response,
    product_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    key = f"lots:{product_id or 'all'}"
    response.headers["Cache-Control"] = f"private, max-age={_ttl_header(key)}"
    response.headers["X-Cache-TTL"] = _ttl_header(key)
    return _cached(key, lambda: an.chart_lot_detail(db, product_id=product_id))


@router.get("/charts/grain-trend")
def chart_grain_trend(
    response: Response,
    origin_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    key = f"grain-trend:{origin_id or 'all'}"
    response.headers["Cache-Control"] = f"private, max-age={_ttl_header(key)}"
    response.headers["X-Cache-TTL"] = _ttl_header(key)
    return _cached(key, lambda: an.chart_grain_trend_by_origin(db, origin_id=origin_id))
