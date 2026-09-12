from datetime import datetime, timezone, date
from sqlalchemy import String, Text, DateTime, Date, Float, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class SampleLot(Base):
    __tablename__ = "samples_lot"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lot_id: Mapped[int] = mapped_column(ForeignKey("lots.id"), nullable=False, index=True)
    cadmium_mg_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    has_sample: Mapped[bool] = mapped_column(Boolean, default=True)
    sample_weight_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    pesticides: Mapped[str | None] = mapped_column(Text, nullable=True)
    observation: Mapped[str | None] = mapped_column(Text, nullable=True)
    analysis_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    send_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    lab_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    producer_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    producer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    lot = relationship("Lot", back_populates="samples")


class SampleGrain(Base):
    __tablename__ = "samples_grain"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    origin_id: Mapped[int] = mapped_column(ForeignKey("origins.id"), nullable=False, index=True)
    guia_code: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    cadmium_mg_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    has_sample: Mapped[bool] = mapped_column(Boolean, default=True)
    sample_weight_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    observation: Mapped[str | None] = mapped_column(Text, nullable=True)
    analysis_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    send_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_organic: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    origin = relationship("Origin", back_populates="samples_grain")
