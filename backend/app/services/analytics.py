from datetime import date
from typing import Optional
import pandas as pd
from sqlalchemy.orm import Session, joinedload
from app.models.sample import SampleLot, SampleGrain
from app.models.lot import Lot, LotOrigin


def _samples_lot_df(db: Session, product_id: Optional[int] = None) -> pd.DataFrame:
    q = db.query(SampleLot).options(
        joinedload(SampleLot.lot).joinedload(Lot.product),
        joinedload(SampleLot.lot).joinedload(Lot.origins).joinedload(LotOrigin.origin),
    ).filter(SampleLot.has_sample == True, SampleLot.cadmium_mg_kg.isnot(None))
    if product_id:
        q = q.join(Lot).filter(Lot.product_id == product_id)
    rows = []
    for s in q.all():
        origins = []
        if s.lot and s.lot.origins:
            origins = [lo.origin.name for lo in s.lot.origins if lo.origin]
        rows.append({
            "id": s.id,
            "lot_code": s.lot.lot_code if s.lot else None,
            "product": s.lot.product.name if s.lot and s.lot.product else None,
            "product_id": s.lot.product_id if s.lot else None,
            "cadmium": float(s.cadmium_mg_kg),
            "send_date": s.send_date,
            "origins": ", ".join(origins) if origins else None,
        })
    return pd.DataFrame(rows)


def _samples_grain_df(db: Session, origin_id: Optional[int] = None) -> pd.DataFrame:
    q = db.query(SampleGrain).options(joinedload(SampleGrain.origin)).filter(
        SampleGrain.has_sample == True, SampleGrain.cadmium_mg_kg.isnot(None)
    )
    if origin_id:
        q = q.filter(SampleGrain.origin_id == origin_id)
    rows = [{
        "id": s.id,
        "origin": s.origin.name if s.origin else None,
        "origin_id": s.origin_id,
        "guia_code": s.guia_code,
        "cadmium": float(s.cadmium_mg_kg),
        "send_date": s.send_date,
        "is_organic": s.is_organic,
    } for s in q.all()]
    return pd.DataFrame(rows)


def dashboard_kpis(db: Session) -> dict:
    df_lot = _samples_lot_df(db)
    df_grain = _samples_grain_df(db)

    def safe_stats(series: pd.Series) -> dict:
        if series.empty:
            return {"count": 0, "avg": None, "min": None, "max": None, "median": None}
        return {
            "count": int(series.count()),
            "avg": round(float(series.mean()), 3),
            "min": round(float(series.min()), 3),
            "max": round(float(series.max()), 3),
            "median": round(float(series.median()), 3),
        }

    return {
        "product_samples": safe_stats(df_lot["cadmium"] if not df_lot.empty else pd.Series(dtype=float)),
        "grain_samples": safe_stats(df_grain["cadmium"] if not df_grain.empty else pd.Series(dtype=float)),
        "products_count": int(df_lot["product"].nunique()) if not df_lot.empty else 0,
        "origins_count": int(df_grain["origin"].nunique()) if not df_grain.empty else 0,
        "lots_count": int(df_lot["lot_code"].nunique()) if not df_lot.empty else 0,
        "high_cadmium_lots": int((df_lot["cadmium"] > 1.0).sum()) if not df_lot.empty else 0,
    }


def chart_cadmium_by_product(db: Session) -> dict:
    df = _samples_lot_df(db)
    if df.empty:
        return {"labels": [], "avg": [], "count": [], "min": [], "max": []}
    grouped = df.groupby("product")["cadmium"].agg(["mean", "count", "min", "max"]).reset_index()
    grouped = grouped.sort_values("mean", ascending=False)
    return {
        "type": "bar",
        "labels": grouped["product"].tolist(),
        "avg": [round(v, 3) for v in grouped["mean"].tolist()],
        "count": grouped["count"].tolist(),
        "min": [round(v, 3) for v in grouped["min"].tolist()],
        "max": [round(v, 3) for v in grouped["max"].tolist()],
    }


def chart_cadmium_by_origin_grain(db: Session) -> dict:
    df = _samples_grain_df(db)
    if df.empty:
        return {"labels": [], "avg": [], "count": []}
    grouped = df.groupby("origin")["cadmium"].agg(["mean", "count"]).reset_index()
    grouped = grouped.sort_values("mean", ascending=False)
    return {
        "type": "bar",
        "labels": grouped["origin"].tolist(),
        "avg": [round(v, 3) for v in grouped["mean"].tolist()],
        "count": grouped["count"].tolist(),
    }


def chart_trend_over_time(db: Session, product_id: Optional[int] = None) -> dict:
    df = _samples_lot_df(db, product_id=product_id)
    if df.empty or df["send_date"].isna().all():
        return {"dates": [], "values": [], "lot_codes": [], "products": []}
    df = df.dropna(subset=["send_date"]).sort_values("send_date")
    return {
        "type": "scatter",
        "dates": [d.isoformat() if d else None for d in df["send_date"].tolist()],
        "values": [round(v, 3) for v in df["cadmium"].tolist()],
        "lot_codes": df["lot_code"].tolist(),
        "products": df["product"].tolist(),
    }


def chart_lot_detail(db: Session, product_id: Optional[int] = None) -> dict:
    df = _samples_lot_df(db, product_id=product_id)
    if df.empty:
        return {"labels": [], "values": [], "origins": [], "products": [], "dates": []}
    df = df.sort_values("cadmium", ascending=False)
    return {
        "type": "bar",
        "labels": df["lot_code"].tolist(),
        "values": [round(v, 3) for v in df["cadmium"].tolist()],
        "origins": df["origins"].tolist(),
        "products": df["product"].tolist(),
        "dates": [d.isoformat() if d else None for d in df["send_date"].tolist()],
    }


def chart_grain_trend_by_origin(db: Session, origin_id: Optional[int] = None) -> dict:
    df = _samples_grain_df(db, origin_id=origin_id)
    if df.empty or df["send_date"].isna().all():
        return {"dates": [], "values": [], "guias": [], "origins": []}
    df = df.dropna(subset=["send_date"]).sort_values("send_date")
    return {
        "type": "scatter",
        "dates": [d.isoformat() if d else None for d in df["send_date"].tolist()],
        "values": [round(v, 3) for v in df["cadmium"].tolist()],
        "guias": df["guia_code"].tolist(),
        "origins": df["origin"].tolist(),
    }
