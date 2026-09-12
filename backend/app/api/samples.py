from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import date
from app.db.session import get_db
from app.models.sample import SampleLot, SampleGrain
from app.models.lot import Lot, LotOrigin
from app.models.catalog import Origin
from app.models.user import User, UserRole
from app.schemas.sample import SampleLotCreate, SampleLotOut, SampleGrainCreate, SampleGrainOut
from app.api.deps import get_current_user, require_roles

router = APIRouter(tags=["Muestras / Análisis"])


@router.get("/samples/lot", response_model=list[SampleLotOut])
def list_samples_lot(
    product_id: int | None = None,
    lot_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(SampleLot).options(
        joinedload(SampleLot.lot).joinedload(Lot.product),
        joinedload(SampleLot.lot).joinedload(Lot.origins).joinedload(LotOrigin.origin),
    )
    if lot_id:
        q = q.filter(SampleLot.lot_id == lot_id)
    if product_id:
        q = q.join(Lot).filter(Lot.product_id == product_id)
    if date_from:
        q = q.filter(SampleLot.send_date >= date_from)
    if date_to:
        q = q.filter(SampleLot.send_date <= date_to)
    samples = q.order_by(SampleLot.send_date.desc().nullslast(), SampleLot.id.desc()).all()
    result = []
    for s in samples:
        origins_text = None
        if s.lot and s.lot.origins:
            origins_text = ", ".join(lo.origin.name for lo in s.lot.origins if lo.origin)
        result.append(
            SampleLotOut(
                id=s.id, lot_id=s.lot_id,
                lot_code=s.lot.lot_code if s.lot else None,
                product_name=s.lot.product.name if s.lot and s.lot.product else None,
                cadmium_mg_kg=s.cadmium_mg_kg, has_sample=s.has_sample,
                sample_weight_g=s.sample_weight_g, pesticides=s.pesticides,
                observation=s.observation, analysis_date=s.analysis_date,
                send_date=s.send_date, lab_name=s.lab_name,
                producer_code=s.producer_code, producer_name=s.producer_name,
                origins_text=origins_text, created_at=s.created_at,
            )
        )
    return result


@router.post("/samples/lot", response_model=SampleLotOut)
def create_sample_lot(
    payload: SampleLotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ANALYST)),
):
    lot = db.query(Lot).options(
        joinedload(Lot.product),
        joinedload(Lot.origins).joinedload(LotOrigin.origin),
    ).filter(Lot.id == payload.lot_id).first()
    if not lot:
        raise HTTPException(404, "Lote no encontrado")
    s = SampleLot(**payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    origins_text = ", ".join(lo.origin.name for lo in lot.origins if lo.origin) if lot.origins else None
    return SampleLotOut(
        id=s.id, lot_id=s.lot_id, lot_code=lot.lot_code,
        product_name=lot.product.name if lot.product else None,
        cadmium_mg_kg=s.cadmium_mg_kg, has_sample=s.has_sample,
        sample_weight_g=s.sample_weight_g, pesticides=s.pesticides,
        observation=s.observation, analysis_date=s.analysis_date,
        send_date=s.send_date, lab_name=s.lab_name,
        producer_code=s.producer_code, producer_name=s.producer_name,
        origins_text=origins_text, created_at=s.created_at,
    )


@router.get("/samples/grain", response_model=list[SampleGrainOut])
def list_samples_grain(
    origin_id: int | None = None,
    guia_code: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(SampleGrain).options(joinedload(SampleGrain.origin))
    if origin_id:
        q = q.filter(SampleGrain.origin_id == origin_id)
    if guia_code:
        q = q.filter(SampleGrain.guia_code.ilike(f"%{guia_code}%"))
    if date_from:
        q = q.filter(SampleGrain.send_date >= date_from)
    if date_to:
        q = q.filter(SampleGrain.send_date <= date_to)
    samples = q.order_by(SampleGrain.send_date.desc().nullslast(), SampleGrain.id.desc()).all()
    return [
        SampleGrainOut(
            id=s.id, origin_id=s.origin_id,
            origin_name=s.origin.name if s.origin else None,
            guia_code=s.guia_code, cadmium_mg_kg=s.cadmium_mg_kg,
            has_sample=s.has_sample, sample_weight_g=s.sample_weight_g,
            observation=s.observation, analysis_date=s.analysis_date,
            send_date=s.send_date, is_organic=s.is_organic, created_at=s.created_at,
        )
        for s in samples
    ]


@router.post("/samples/grain", response_model=SampleGrainOut)
def create_sample_grain(
    payload: SampleGrainCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ANALYST)),
):
    origin = db.get(Origin, payload.origin_id)
    if not origin:
        raise HTTPException(404, "Origen no encontrado")
    s = SampleGrain(**payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return SampleGrainOut(
        id=s.id, origin_id=s.origin_id, origin_name=origin.name,
        guia_code=s.guia_code, cadmium_mg_kg=s.cadmium_mg_kg,
        has_sample=s.has_sample, sample_weight_g=s.sample_weight_g,
        observation=s.observation, analysis_date=s.analysis_date,
        send_date=s.send_date, is_organic=s.is_organic, created_at=s.created_at,
    )
