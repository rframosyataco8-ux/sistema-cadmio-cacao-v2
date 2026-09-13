from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator


class SampleLotCreate(BaseModel):
    lot_id: int = Field(..., gt=0)
    cadmium_mg_kg: float | None = Field(None, ge=0, le=1000)
    has_sample: bool = True
    sample_weight_g: float | None = Field(None, ge=0, le=1_000_000)
    pesticides: str | None = Field(None, max_length=2000)
    observation: str | None = Field(None, max_length=2000)
    analysis_date: date | None = None
    send_date: date | None = None
    lab_name: str | None = Field(None, max_length=200)
    producer_code: str | None = Field(None, max_length=100)
    producer_name: str | None = Field(None, max_length=200)

    @field_validator("pesticides", "observation", "lab_name", "producer_code", "producer_name")
    @classmethod
    def strip_text(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v or None
        return v


class SampleLotUpdate(BaseModel):
    cadmium_mg_kg: float | None = Field(None, ge=0, le=1000)
    has_sample: bool | None = None
    sample_weight_g: float | None = Field(None, ge=0, le=1_000_000)
    pesticides: str | None = Field(None, max_length=2000)
    observation: str | None = Field(None, max_length=2000)
    analysis_date: date | None = None
    send_date: date | None = None
    lab_name: str | None = Field(None, max_length=200)
    producer_code: str | None = Field(None, max_length=100)
    producer_name: str | None = Field(None, max_length=200)

    @field_validator("pesticides", "observation", "lab_name", "producer_code", "producer_name")
    @classmethod
    def strip_text(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v or None
        return v


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


class SampleGrainUpdate(BaseModel):
    origin_id: int | None = Field(None, gt=0)
    guia_code: str | None = Field(None, max_length=100)
    cadmium_mg_kg: float | None = Field(None, ge=0, le=1000)
    has_sample: bool | None = None
    sample_weight_g: float | None = Field(None, ge=0, le=1_000_000)
    observation: str | None = Field(None, max_length=2000)
    analysis_date: date | None = None
    send_date: date | None = None
    is_organic: bool | None = None

    @field_validator("guia_code", "observation")
    @classmethod
    def strip_text(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v or None
        return v


class SampleGrainCreate(BaseModel):
    origin_id: int = Field(..., gt=0)
    guia_code: str = Field(..., min_length=1, max_length=100)
    cadmium_mg_kg: float | None = Field(None, ge=0, le=1000)
    has_sample: bool = True
    sample_weight_g: float | None = Field(None, ge=0, le=1_000_000)
    observation: str | None = Field(None, max_length=2000)
    analysis_date: date | None = None
    send_date: date | None = None
    is_organic: bool = False

    @field_validator("guia_code", "observation")
    @classmethod
    def strip_text(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


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
