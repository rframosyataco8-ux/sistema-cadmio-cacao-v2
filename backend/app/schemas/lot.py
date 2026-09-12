from datetime import datetime, date
from pydantic import BaseModel


class LotOriginCreate(BaseModel):
    origin_id: int
    weight_kg: float | None = None
    percentage: float | None = None
    guia_codes: str | None = None


class LotOriginOut(BaseModel):
    id: int
    origin_id: int
    origin_name: str | None = None
    weight_kg: float | None
    percentage: float | None
    guia_codes: str | None

    class Config:
        from_attributes = True


class LotCreate(BaseModel):
    product_id: int
    lot_code: str
    production_date: date | None = None
    weight_kg: float | None = None
    notes: str | None = None
    origins: list[LotOriginCreate] = []


class LotOut(BaseModel):
    id: int
    product_id: int
    product_name: str | None = None
    lot_code: str
    production_date: date | None
    weight_kg: float | None
    notes: str | None
    created_at: datetime
    origins: list[LotOriginOut] = []

    class Config:
        from_attributes = True
