from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole, DEFAULT_PERMISSIONS


class PermissionsOut(BaseModel):
    dashboard: bool = True
    results: bool = True
    behavior: bool = True
    products_catalog: bool = True
    can_create_samples: bool = False
    products: list[str] = Field(default_factory=list)  # keys; vacío = todos


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(min_length=6)
    role: UserRole = UserRole.VIEWER
    permissions: PermissionsOut | None = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    avatar: str | None = None
    permissions: PermissionsOut | None = None
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_user(cls, user):
        return cls(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            avatar=user.avatar,
            permissions=PermissionsOut(**user.get_permissions()),
            created_at=user.created_at,
        )


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    avatar: str | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class UserPermissionsUpdate(BaseModel):
    role: UserRole | None = None
    permissions: PermissionsOut | None = None
    is_active: bool | None = None
