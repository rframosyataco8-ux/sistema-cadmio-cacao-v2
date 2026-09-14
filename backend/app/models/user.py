from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
import enum
import json
from app.db.session import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"
    LAB = "lab"


# Permisos por defecto (acceso completo excepto admin)
DEFAULT_PERMISSIONS = {
    "dashboard": True,
    "results": True,
    "behavior": True,
    "products_catalog": True,
    "can_create_samples": False,
    "lab_pending": False,
    "products": [],  # vacío = todos los productos
}

LAB_PERMISSIONS = {
    "dashboard": False,
    "results": False,
    "behavior": False,
    "products_catalog": False,
    "can_create_samples": False,
    "lab_pending": True,
    "products": [],
}


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    # VARCHAR (no enum PG): evita fallos ADMIN vs admin entre versiones
    role: Mapped[str] = mapped_column(String(20), default=UserRole.VIEWER.value, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar: Mapped[str | None] = mapped_column(Text, nullable=True)
    permissions: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def get_permissions(self) -> dict:
        role = str(self.role or "").lower()
        if role == UserRole.ADMIN.value:
            return {
                "dashboard": True,
                "results": True,
                "behavior": True,
                "products_catalog": True,
                "can_create_samples": True,
                "lab_pending": True,
                "products": [],
            }
        if role == UserRole.LAB.value:
            if self.permissions:
                try:
                    data = json.loads(self.permissions)
                    merged = dict(LAB_PERMISSIONS)
                    merged.update(data)
                    merged["lab_pending"] = True
                    return merged
                except Exception:
                    return dict(LAB_PERMISSIONS)
            return dict(LAB_PERMISSIONS)
        if self.permissions:
            try:
                data = json.loads(self.permissions)
                merged = dict(DEFAULT_PERMISSIONS)
                merged.update(data)
                return merged
            except Exception:
                pass
        return dict(DEFAULT_PERMISSIONS)

    def set_permissions(self, perms: dict) -> None:
        self.permissions = json.dumps(perms or {})
