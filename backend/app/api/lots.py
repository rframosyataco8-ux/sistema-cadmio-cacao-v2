from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.lot import Lot, LotOrigin
from app.models.catalog import Product, Origin
from app.models.user import User, UserRole
from app.schemas.lot import LotCreate, LotOut, LotOriginOut
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/lots", tags=["Lotes"])


@router.get("", response_model=list[LotOut])
def list_lots(
    product_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Lot).options(
        joinedload(Lot.product),
        joinedload(Lot.origins).joinedload(LotOrigin.origin),
    )
    if product_id:
        q = q.filter(Lot.product_id == product_id)
    lots = q.order_by(Lot.created_at.desc()).all()
    result = []
    for lot in lots:
        origins_out = [
            LotOriginOut(
                id=lo.id,
                origin_id=lo.origin_id,
                origin_name=lo.origin.name if lo.origin else None,
                weight_kg=lo.weight_kg,
                percentage=lo.percentage,
                guia_codes=lo.guia_codes,
            )
            for lo in lot.origins
        ]
        result.append(
            LotOut(
                id=lot.id,
                product_id=lot.product_id,
                product_name=lot.product.name if lot.product else None,
                lot_code=lot.lot_code,
                production_date=lot.production_date,
                weight_kg=lot.weight_kg,
                notes=lot.notes,
                created_at=lot.created_at,
                origins=origins_out,
            )
        )
    return result


@router.post("", response_model=LotOut)
def create_lot(
    payload: LotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ANALYST)),
):
    if not db.get(Product, payload.product_id):
        raise HTTPException(404, "Producto no encontrado")
    exists = db.query(Lot).filter(Lot.lot_code == payload.lot_code).first()
    if exists:
        raise HTTPException(400, "Ya existe un lote con ese código")
    lot = Lot(
        product_id=payload.product_id,
        lot_code=payload.lot_code,
        production_date=payload.production_date,
        weight_kg=payload.weight_kg,
        notes=payload.notes,
    )
    db.add(lot)
    db.flush()
    for o in payload.origins:
        if not db.get(Origin, o.origin_id):
            raise HTTPException(404, f"Origen {o.origin_id} no encontrado")
        db.add(LotOrigin(lot_id=lot.id, **o.model_dump()))
    db.commit()
    db.refresh(lot)
    return LotOut(
        id=lot.id,
        product_id=lot.product_id,
        product_name=None,
        lot_code=lot.lot_code,
        production_date=lot.production_date,
        weight_kg=lot.weight_kg,
        notes=lot.notes,
        created_at=lot.created_at,
        origins=[],
    )
