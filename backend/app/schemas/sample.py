from datetime import datetime, date
from pydantic import BaseModel


class SampleLotCreate(BaseModel):
    lot_id: int
    cadmium_mg_kg: float | None = None
    has_sample: bool = True
    sample_weight_g: float | None = None
    pesticides: str | None = None
    observation: str | None = None
    analysis_date: date | None = None
    send_date: date | None = None
    lab_name: str | None = None
    producer_code: str | None = None
    producer_name: str | None = None


class SampleLotUpdate(BaseModel):
    cadmium_mg_kg: float | None = None
    has_sample: bool | None = None
    sample_weight_g: float | None = None
    pesticides: str | None = None
    observation: str | None = None
    analysis_date: date | None = None
    send_date: date | None = None
    lab_name: str | None = None
    producer_code: str | None = None
    producer_name: str | None = None


class SampleLotOut(BaseModel):
    id: int
    lot_id: int
    lot_code: str | None = None
    product_name: str | None = None
    cadmium_mg_kg: float | None
    has_sample: bool
    sample_weight_g: float | None
    pesticides: str | None
    observation: str | None
    analysis_date: date | None
    send_date: date | None
    lab_name: str | None
    producer_code: str | None
    producer_name: str | None
    origins_text: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class SampleGrainCreate(BaseModel):
    origin_id: int
    guia_code: str
    cadmium_mg_kg: float | None = None
    has_sample: bool = True
    sample_weight_g: float | None = None
    observation: str | None = None
    analysis_date: date | None = None
    send_date: date | None = None
    is_organic: bool = False


class SampleGrainOut(BaseModel):
    id: int
    origin_id: int
    origin_name: str | None = None
    guia_code: str
    cadmium_mg_kg: float | None
    has_sample: bool
    sample_weight_g: float | None
    observation: str | None
    analysis_date: date | None
    send_date: date | None
    is_organic: bool
    created_at: datetime

    class Config:
        from_attributes = True
