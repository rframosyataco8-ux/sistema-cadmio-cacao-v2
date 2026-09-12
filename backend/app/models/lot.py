from datetime import datetime, timezone, date
from sqlalchemy import String, Text, DateTime, Date, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Lot(Base):
    __tablename__ = "lots"
    __table_args__ = (
        UniqueConstraint("product_id", "lot_code", name="uq_lot_product_code"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    lot_code: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    production_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    product = relationship("Product", back_populates="lots")
    origins = relationship("LotOrigin", back_populates="lot", cascade="all, delete-orphan")
    samples = relationship("SampleLot", back_populates="lot", cascade="all, delete-orphan")


class LotOrigin(Base):
    __tablename__ = "lot_origins"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lot_id: Mapped[int] = mapped_column(ForeignKey("lots.id"), nullable=False, index=True)
    origin_id: Mapped[int] = mapped_column(ForeignKey("origins.id"), nullable=False, index=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    guia_codes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    lot = relationship("Lot", back_populates="origins")
    origin = relationship("Origin", back_populates="lot_origins")
