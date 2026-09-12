from datetime import datetime
from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    code: str | None = None
    description: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None


class ProductOut(BaseModel):
    id: int
    name: str
    code: str | None
    description: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OriginCreate(BaseModel):
    name: str
    region: str | None = None
    country: str = "Perú"
    notes: str | None = None


class OriginUpdate(BaseModel):
    name: str | None = None
    region: str | None = None
    country: str | None = None
    notes: str | None = None


class OriginOut(BaseModel):
    id: int
    name: str
    region: str | None
    country: str
    notes: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
