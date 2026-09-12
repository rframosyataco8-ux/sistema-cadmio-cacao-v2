"""
Seed con datos REALES ya extraídos del Excel.
Se insertan UNA VEZ en PostgreSQL. El sistema NO usa el Excel en runtime.

Ejecutar: docker compose exec backend python -m app.db.seed
"""
from __future__ import annotations
from datetime import date
from app.db.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.catalog import Product, Origin
from app.models.lot import Lot, LotOrigin
from app.models.sample import SampleLot, SampleGrain
from app.db.data.real_lots import LOT_SAMPLES
from app.db.data.real_grains import GRAIN_SAMPLES


def get_or_create_origin(db, name: str) -> Origin:
    if not name:
        name = "SIN ORIGEN"
    name = " ".join(str(name).strip().split())
    o = db.query(Origin).filter(Origin.name.ilike(name)).first()
    if not o:
        o = Origin(name=name, country="Perú")
        db.add(o)
        db.flush()
    return o


def get_or_create_product(db, name: str) -> Product:
    name = str(name).strip()
    p = db.query(Product).filter(Product.name.ilike(name)).first()
    if not p:
        p = Product(name=name)
        db.add(p)
        db.flush()
    return p


def parse_origins(text) -> list[str]:
    if not text:
        return []
    parts = []
    for chunk in str(text).replace("/", ",").split(","):
        n = chunk.strip()
        if n and n.lower() not in ("0", "no pta *", "no pta"):
            parts.append(n)
    return parts


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(User).filter(
            (User.email == "admin@cadmio.com") | (User.email == "admin@cadmio.local")
        ).first()
        if not admin:
            db.add(User(
                email="admin@cadmio.com",
                full_name="Administrador",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
            ))
        elif admin.email == "admin@cadmio.local":
            admin.email = "admin@cadmio.com"
        db.commit()

        n_lots = 0
        n_samples = 0
        for row in LOT_SAMPLES:
            product = get_or_create_product(db, row["product"])
            lot_code = str(row["lot_code"]).strip()
            lot = db.query(Lot).filter(Lot.lot_code == lot_code).first()
            if not lot:
                lot = Lot(product_id=product.id, lot_code=lot_code, weight_kg=None)
                db.add(lot)
                db.flush()
                n_lots += 1
                for oname in parse_origins(row.get("origins")):
                    o = get_or_create_origin(db, oname)
                    if not db.query(LotOrigin).filter(
                        LotOrigin.lot_id == lot.id, LotOrigin.origin_id == o.id
                    ).first():
                        db.add(LotOrigin(lot_id=lot.id, origin_id=o.id))

            if db.query(SampleLot).filter(SampleLot.lot_id == lot.id).first():
                continue

            send_d = None
            if row.get("date"):
                try:
                    send_d = date.fromisoformat(str(row["date"])[:10])
                except Exception:
                    send_d = None

            db.add(SampleLot(
                lot_id=lot.id,
                cadmium_mg_kg=row.get("cd"),
                has_sample=bool(row.get("has_sample")),
                sample_weight_g=row.get("weight_g"),
                pesticides=row.get("pesticides"),
                observation=row.get("obs"),
                send_date=send_d,
                producer_code=row.get("producer_code"),
                producer_name=row.get("producer_name"),
            ))
            n_samples += 1

        n_grain = 0
        for row in GRAIN_SAMPLES:
            o = get_or_create_origin(db, row.get("origin") or "SIN ORIGEN")
            guia = str(row.get("guia_code") or "").strip()
            if not guia:
                continue
            if db.query(SampleGrain).filter(
                SampleGrain.origin_id == o.id, SampleGrain.guia_code == guia
            ).first():
                continue
            send_d = None
            if row.get("date"):
                try:
                    send_d = date.fromisoformat(str(row["date"])[:10])
                except Exception:
                    send_d = None
            db.add(SampleGrain(
                origin_id=o.id,
                guia_code=guia,
                cadmium_mg_kg=row.get("cd"),
                has_sample=bool(row.get("has_sample")),
                sample_weight_g=row.get("weight_g"),
                observation=row.get("obs"),
                send_date=send_d,
            ))
            n_grain += 1

        db.commit()
        print(f"Seed REAL en PostgreSQL: {n_lots} lotes, {n_samples} muestras producto, {n_grain} muestras grano")
        print("Login: admin@cadmio.com / admin123")
        print("(El Excel ya no se usa; todo queda en la base de datos)")
    except Exception as e:
        db.rollback()
        print(f"Error seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
