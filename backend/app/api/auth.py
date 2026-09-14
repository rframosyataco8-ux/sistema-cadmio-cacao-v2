from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.config import settings
from app.models.user import User, UserRole, DEFAULT_PERMISSIONS
from app.schemas.user import (
    UserCreate,
    UserOut,
    Token,
    ProfileUpdate,
    PasswordChange,
    UserPermissionsUpdate,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario inactivo")
    token = create_access_token(
        subject=user.email,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=token, user=UserOut.from_user(user))


@router.post("/register", response_model=UserOut)
def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear usuarios")
    if payload.role == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Solo puede existir un administrador")
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    from app.models.user import LAB_PERMISSIONS
    if payload.role == UserRole.LAB:
        perms = payload.permissions.model_dump() if payload.permissions else dict(LAB_PERMISSIONS)
        perms["lab_pending"] = True
    else:
        perms = payload.permissions.model_dump() if payload.permissions else dict(DEFAULT_PERMISSIONS)
        if payload.role == UserRole.ANALYST:
            perms["can_create_samples"] = True

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
    )
    user.set_permissions(perms)
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.from_user(user)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.from_user(current_user)


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip() or current_user.full_name
    if payload.avatar is not None:
        if len(payload.avatar) > 2_000_000:
            raise HTTPException(status_code=400, detail="La foto es demasiado grande (máx ~1.5 MB)")
        current_user.avatar = payload.avatar if payload.avatar else None
    db.commit()
    db.refresh(current_user)
    return UserOut.from_user(current_user)


@router.post("/me/password")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"ok": True}


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores")
    return [UserOut.from_user(u) for u in db.query(User).order_by(User.id).all()]


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserPermissionsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="No se puede modificar al administrador")

    if payload.role is not None:
        if payload.role == UserRole.ADMIN:
            raise HTTPException(status_code=400, detail="No se puede promover a administrador")
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.permissions is not None:
        user.set_permissions(payload.permissions.model_dump())

    db.commit()
    db.refresh(user)
    return UserOut.from_user(user)


@router.patch("/users/{user_id}/active", response_model=UserOut)
def set_active(
    user_id: int,
    active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="No se puede desactivar al administrador")
    user.is_active = active
    db.commit()
    db.refresh(user)
    return UserOut.from_user(user)
