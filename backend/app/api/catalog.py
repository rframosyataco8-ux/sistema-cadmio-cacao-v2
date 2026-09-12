from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.catalog import Product, Origin
from app.models.user import User, UserRole
from app.schemas.catalog import (
    ProductCreate, ProductUpdate, ProductOut,
    OriginCreate, OriginUpdate, OriginOut,
)
from app.api.deps import get_current_user, require_roles

router = APIRouter(tags=["Catálogos"])


@router.get("/products", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Product).filter(Product.is_active == True).order_by(Product.name).all()


@router.post("/products", response_model=ProductOut)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ANALYST)),
):
    exists = db.query(Product).filter(Product.name == payload.name).first()
    if exists:
        raise HTTPException(400, "Ya existe un producto con ese nombre")
    p = Product(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ANALYST)),
):
    p = db.get(Product, product_id)
    if not p or not p.is_active:
        raise HTTPException(404, "Producto no encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        other = db.query(Product).filter(Product.name == data["name"], Product.id != product_id).first()
        if other:
            raise HTTPException(400, "Ya existe un producto con ese nombre")
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ANALYST)),
):
    p = db.get(Product, product_id)
    if not p or not p.is_active:
        raise HTTPException(404, "Producto no encontrado")
    p.is_active = False
    db.commit()
    return {"ok": True}


@router.get("/origins", response_model=list[OriginOut])
def list_origins(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Origin).filter(Origin.is_active == True).order_by(Origin.name).all()


@router.post("/origins", response_model=OriginOut)
def create_origin(
    payload: OriginCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ANALYST)),
):
    exists = db.query(Origin).filter(Origin.name == payload.name).first()
    if exists:
        raise HTTPException(400, "Ya existe un origen con ese nombre")
    o = Origin(**payload.model_dump())
    db.add(o)
    db.commit()
    db.refresh(o)
    return o


@router.patch("/origins/{origin_id}", response_model=OriginOut)
def update_origin(
    origin_id: int,
    payload: OriginUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ANALYST)),
):
    o = db.get(Origin, origin_id)
    if not o or not o.is_active:
        raise HTTPException(404, "Origen no encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        other = db.query(Origin).filter(Origin.name == data["name"], Origin.id != origin_id).first()
        if other:
            raise HTTPException(400, "Ya existe un origen con ese nombre")
    for k, v in data.items():
        setattr(o, k, v)
    db.commit()
    db.refresh(o)
    return o


@router.delete("/origins/{origin_id}")
def delete_origin(
    origin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ANALYST)),
):
    o = db.get(Origin, origin_id)
    if not o or not o.is_active:
        raise HTTPException(404, "Origen no encontrado")
    o.is_active = False
    db.commit()
    return {"ok": True}
