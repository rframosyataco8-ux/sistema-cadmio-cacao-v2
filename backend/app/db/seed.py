"""
Seed: datos REALES del Excel → PostgreSQL.
- Torta trozada estándar: solo plaguicidas
- Torta de cacao: cadmio + plaguicidas
Ejecutar: docker compose exec backend python -m app.db.seed
"""
from __future__ import annotations
import json
from datetime import date
from pathlib import Path
from app.db.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.catalog import Product, Origin
from app.models.lot import Lot, LotOrigin
from app.models.sample import SampleLot, SampleGrain


def load_real_data():
    base = Path(__file__).resolve().parent / "data"
    # 1) Datos embebidos del Excel Lima Cadmio (preferido)
    try:
        from app.db.data.embedded_lima import load_embedded_data
        data = load_embedded_data()
        if data.get("lots"):
            print(f"Datos embebidos: {len(data['lots'])} lotes, {len(data.get('grain') or [])} grano")
            return data
    except Exception as e:
        print(f"Nota embedded_lima: {e}")

    grain_path = base / "real_grain.json"
    parts = sorted(base.glob("real_lots_part*.json"))
    if parts:
        lots = []
        for part in parts:
            lots.extend(json.loads(part.read_text(encoding="utf-8")))
    elif (base / "real_lots.json").exists():
        lots = json.loads((base / "real_lots.json").read_text(encoding="utf-8"))
    elif (base / "real_lots_a.json").exists() and (base / "real_lots_b.json").exists():
        lots = (
            json.loads((base / "real_lots_a.json").read_text(encoding="utf-8"))
            + json.loads((base / "real_lots_b.json").read_text(encoding="utf-8"))
        )
    elif (base / "real_lots_trozada.json").exists():
        lots = json.loads((base / "real_lots_trozada.json").read_text(encoding="utf-8"))
    else:
        raise FileNotFoundError("Faltan archivos de lotes en app/db/data")
    grain = []
    if grain_path.exists():
        try:
            grain = json.loads(grain_path.read_text(encoding="utf-8"))
            if not isinstance(grain, list):
                grain = []
        except Exception:
            grain = []
    if not grain and (base / "real_grain_samples.json").exists():
        grain = json.loads((base / "real_grain_samples.json").read_text(encoding="utf-8"))
    return {"lots": lots, "grain": grain}


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
    try:
        from sqlalchemy import text as sa_text
        with engine.begin() as conn:
            conn.execute(sa_text(
                "DO $$ BEGIN "
                "IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN "
                "  IF NOT EXISTS (SELECT 1 FROM pg_enum e "
                "    JOIN pg_type t ON e.enumtypid = t.oid "
                "    WHERE t.typname = 'userrole' AND e.enumlabel = 'lab') THEN "
                "    ALTER TYPE userrole ADD VALUE 'lab'; "
                "  END IF; "
                "END IF; END $$;"
            ))
    except Exception as enum_err:
        print(f"Nota enum LAB: {enum_err}")
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
                role=getattr(UserRole.ADMIN, "value", UserRole.ADMIN),
            ))
        elif admin.email == "admin@cadmio.local":
            admin.email = "admin@cadmio.com"

        lab = db.query(User).filter(User.email == "lab@cadmio.com").first()
        if not lab:
            from app.models.user import LAB_PERMISSIONS
            lab_user = User(
                email="lab@cadmio.com",
                full_name="Personal de Laboratorio",
                hashed_password=get_password_hash("lab123"),
                role=getattr(UserRole.LAB, "value", UserRole.LAB),
            )
            lab_user.set_permissions(LAB_PERMISSIONS)
            db.add(lab_user)
        db.commit()

        from sqlalchemy import text
        try:
            db.execute(text("ALTER TABLE lots DROP CONSTRAINT IF EXISTS lots_lot_code_key"))
            db.execute(text("ALTER TABLE lots DROP CONSTRAINT IF EXISTS ix_lots_lot_code"))
            db.execute(text("DROP INDEX IF EXISTS lots_lot_code_key"))
            db.execute(text("DROP INDEX IF EXISTS ix_lots_lot_code"))
            db.execute(text("DROP INDEX IF EXISTS lots_lot_code_idx"))
            db.execute(text(
                "DO $$ BEGIN "
                "IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_lot_product_code') THEN "
                "ALTER TABLE lots ADD CONSTRAINT uq_lot_product_code UNIQUE (product_id, lot_code); "
                "END IF; END $$;"
            ))
            db.commit()
            print("Migración lot_code: OK (único por producto)")
        except Exception as mig_err:
            db.rollback()
            print(f"Nota migración lot_code: {mig_err}")

        get_or_create_product(db, "Torta trozada estándar")
        db.commit()

        data = load_real_data()
        lot_rows = data["lots"]
        grain_rows = data["grain"]

        n_lots = n_samples_new = n_samples_upd = 0
        for row in lot_rows:
            product = get_or_create_product(db, row["product"])
            lot = (
                db.query(Lot)
                .filter(Lot.product_id == product.id, Lot.lot_code == row["lot_code"])
                .first()
            )
            if not lot:
                lot = Lot(product_id=product.id, lot_code=row["lot_code"])
                db.add(lot)
                db.flush()
                n_lots += 1

            for oname in parse_origins(row.get("origins")):
                o = get_or_create_origin(db, oname)
                if not db.query(LotOrigin).filter(
                    LotOrigin.lot_id == lot.id, LotOrigin.origin_id == o.id
                ).first():
                    db.add(LotOrigin(lot_id=lot.id, origin_id=o.id))

            send_d = None
            if row.get("date"):
                try:
                    send_d = date.fromisoformat(str(row["date"])[:10])
                except Exception:
                    pass

            sample = db.query(SampleLot).filter(SampleLot.lot_id == lot.id).first()
            if sample:
                changed = False
                pest = row.get("pesticides")
                if pest is not None and sample.pesticides != pest:
                    sample.pesticides = pest
                    changed = True
                if row.get("cd") is not None and sample.cadmium_mg_kg is None:
                    sample.cadmium_mg_kg = row["cd"]
                    sample.has_sample = bool(row.get("has_sample", True))
                    changed = True
                if row.get("obs") and not sample.observation:
                    sample.observation = row["obs"]
                    changed = True
                if send_d and not sample.send_date:
                    sample.send_date = send_d
                    changed = True
                if row.get("weight_g") and not sample.sample_weight_g:
                    sample.sample_weight_g = row["weight_g"]
                    changed = True
                if changed:
                    n_samples_upd += 1
            else:
                db.add(SampleLot(
                    lot_id=lot.id,
                    cadmium_mg_kg=row.get("cd"),
                    has_sample=bool(row.get("has_sample", True)),
                    sample_weight_g=row.get("weight_g"),
                    pesticides=row.get("pesticides"),
                    observation=row.get("obs"),
                    send_date=send_d,
                    producer_code=row.get("producer_code"),
                    producer_name=row.get("producer_name"),
                ))
                n_samples_new += 1

        n_grain = 0
        for row in grain_rows:
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
                    pass
            db.add(SampleGrain(
                origin_id=o.id,
                guia_code=guia,
                cadmium_mg_kg=row.get("cd"),
                has_sample=bool(row.get("has_sample", True)),
                sample_weight_g=row.get("weight_g"),
                observation=row.get("obs"),
                send_date=send_d,
                is_organic=bool(row.get("is_organic", False)),
            ))
            n_grain += 1

        db.commit()
        print(
            f"Seed OK: {n_lots} lotes nuevos, {n_samples_new} muestras nuevas, "
            f"{n_samples_upd} actualizadas, {n_grain} grano"
        )
        print("Login: admin@cadmio.com / admin123")
        print("Lab:   lab@cadmio.com / lab123")
    except Exception as e:
        db.rollback()
        print(f"Error seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
