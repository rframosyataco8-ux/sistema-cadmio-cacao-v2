from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.catalog import Product, Origin
from app.models.user import User, UserRole
from app.schemas.catalog import ProductCreate, ProductOut, OriginCreate, OriginOut
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
