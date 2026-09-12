from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services import analytics as an

router = APIRouter(prefix="/analytics", tags=["Analytics / Gráficos"])


@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return an.dashboard_kpis(db)


@router.get("/charts/by-product")
def chart_by_product(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return an.chart_cadmium_by_product(db)


@router.get("/charts/by-origin-grain")
def chart_by_origin(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return an.chart_cadmium_by_origin_grain(db)


@router.get("/charts/trend")
def chart_trend(
    product_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return an.chart_trend_over_time(db, product_id=product_id)


@router.get("/charts/lots")
def chart_lots(
    product_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return an.chart_lot_detail(db, product_id=product_id)


@router.get("/charts/grain-trend")
def chart_grain_trend(
    origin_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return an.chart_grain_trend_by_origin(db, origin_id=origin_id)
