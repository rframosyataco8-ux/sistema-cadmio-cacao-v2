"""Seed de datos. Ejecutar: docker compose exec backend python -m app.db.seed"""
from datetime import date
from app.db.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.catalog import Product, Origin
from app.models.lot import Lot, LotOrigin
from app.models.sample import SampleLot, SampleGrain


def get_or_create_origin(db, name: str) -> Origin:
    name = name.strip().title()
    o = db.query(Origin).filter(Origin.name.ilike(name)).first()
    if not o:
        o = Origin(name=name, country="Perú")
        db.add(o)
        db.flush()
    return o


def get_or_create_product(db, name: str) -> Product:
    p = db.query(Product).filter(Product.name == name).first()
    if not p:
        p = Product(name=name)
        db.add(p)
        db.flush()
    return p


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

        for name in ["Torta de cacao", "Torta de cacao alcalino", "Torta trozada estándar",
                     "Grano de cacao", "Cacao alcalino reducido en grasa", "Cacao en polvo"]:
            get_or_create_product(db, name)

        for name in ["Jaen", "Ayacucho", "Neshuya", "Pangoa", "Sisa", "Quillabamba",
                     "Tingo María", "Tarapoto", "Bagua", "Juanjui", "Chanchamayo",
                     "Tocache", "Yurimaguas", "Campoverde"]:
            get_or_create_origin(db, name)

        db.commit()

        torta = get_or_create_product(db, "Torta de cacao")
        sample_lots = [
            ("23260205", 1.021, "2026-02-13", "Ayacucho, Jaen"),
            ("24260207", 1.212, "2026-02-13", "Tarapoto, Jaen"),
            ("31260216", 1.363, "2026-02-20", "Neshuya, Pangoa"),
            ("38260227", 0.938, "2026-03-04", "Sisa, Jaen"),
            ("61260409", 2.239, "2026-04-13", "Jaen, Bagua"),
            ("62260410", 1.785, "2026-04-13", "Bagua, Ayacucho"),
            ("79260429", 0.84, "2026-05-07", "Tarapoto, Chanchamayo"),
            ("90260516", 0.77, "2026-05-21", "Pangoa, Ayacucho"),
            ("103260522", 1.48, "2026-06-10", "Tingo María, Jaen"),
            ("114260615", 0.76, "2026-07-01", "Sisa, Quillabamba"),
            ("116260618", 0.65, "2026-07-01", "Ayacucho, Quillabamba"),
        ]

        for lot_code, cd, send_d, origins_str in sample_lots:
            if db.query(Lot).filter(Lot.lot_code == lot_code).first():
                continue
            lot = Lot(product_id=torta.id, lot_code=lot_code, weight_kg=10.0)
            db.add(lot)
            db.flush()
            for oname in [x.strip() for x in origins_str.split(",")]:
                o = get_or_create_origin(db, oname)
                db.add(LotOrigin(lot_id=lot.id, origin_id=o.id))
            db.add(SampleLot(
                lot_id=lot.id, cadmium_mg_kg=cd, has_sample=True,
                sample_weight_g=300.0, send_date=date.fromisoformat(send_d),
                producer_name="Exportadora Romex S.A",
            ))

        grain_samples = [
            ("Neshuya", "061-123", 0.45, "2026-04-30"),
            ("Ayacucho", "EG07-2977", 0.37, "2026-04-30"),
            ("Quillabamba", "EG07-3059", 0.21, "2026-05-21"),
            ("Yurimaguas", "EG07-3028", 0.85, "2026-06-03"),
            ("Quillabamba", "EG07-3089", 0.11, "2026-06-03"),
            ("Jaen", "EG07-3153", 0.56, "2026-06-04"),
            ("Bagua", "EG07-3193", 0.85, "2026-06-04"),
            ("Quillabamba", "EG07-3347", 0.14, "2026-07-01"),
            ("Jaen", "EG07-3371", 0.86, "2026-07-01"),
            ("Neshuya", "061-148", 0.76, "2026-07-01"),
        ]
        for oname, guia, cd, send_d in grain_samples:
            o = get_or_create_origin(db, oname)
            if db.query(SampleGrain).filter(SampleGrain.origin_id == o.id, SampleGrain.guia_code == guia).first():
                continue
            db.add(SampleGrain(
                origin_id=o.id, guia_code=guia, cadmium_mg_kg=cd,
                has_sample=True, sample_weight_g=350.0,
                send_date=date.fromisoformat(send_d),
            ))

        db.commit()
        print("Seed completado — login: admin@cadmio.com / admin123")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
