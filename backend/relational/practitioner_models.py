from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from backend.relational.base import Base, TimestampMixin, new_id


class Practitioner(TimestampMixin, Base):
    __tablename__ = "practitioners"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    city: Mapped[str] = mapped_column(String(160), nullable=False, default="", index=True)
    postal_code: Mapped[str] = mapped_column(String(16), nullable=False, default="")
    zone: Mapped[str] = mapped_column(Text, nullable=False, default="")
    intervention_radius_km: Mapped[Optional[int]] = mapped_column(Integer)
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)
    bio: Mapped[str] = mapped_column(Text, nullable=False, default="")
    photo_url: Mapped[str] = mapped_column(Text, nullable=False, default="")
    experience_years: Mapped[Optional[int]] = mapped_column(Integer)
    indicative_rate: Mapped[str] = mapped_column(Text, nullable=False, default="")
    publication_status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")

    __table_args__ = (
        CheckConstraint(
            "publication_status IN ('draft','published','hidden','suspended')",
            name="publication_status_allowed",
        ),
        CheckConstraint(
            "intervention_radius_km IS NULL OR intervention_radius_km BETWEEN 0 AND 250",
            name="radius_range",
        ),
    )


class PractitionerAttribute(TimestampMixin, Base):
    __tablename__ = "practitioner_attributes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    practitioner_id: Mapped[str] = mapped_column(
        ForeignKey("practitioners.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attribute_type: Mapped[str] = mapped_column(String(64), nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)

    __table_args__ = (
        UniqueConstraint("practitioner_id", "attribute_type", "value"),
        CheckConstraint(
            "attribute_type IN ('audience','modality','experience_domain','accompaniment_type',"
            "'accompaniment_format','payment_method','habitual_slot')",
            name="attribute_type_allowed",
        ),
    )


class Diploma(TimestampMixin, Base):
    __tablename__ = "diplomas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    practitioner_id: Mapped[str] = mapped_column(
        ForeignKey("practitioners.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    institution: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    graduation_year: Mapped[Optional[int]] = mapped_column(Integer)
    verification_status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    verified_by_user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"))
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint(
            "verification_status IN ('pending','verified','rejected','expired')",
            name="verification_status_allowed",
        ),
    )


class ProfessionalDocument(TimestampMixin, Base):
    __tablename__ = "professional_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    practitioner_id: Mapped[str] = mapped_column(
        ForeignKey("practitioners.id", ondelete="CASCADE"), nullable=False, index=True
    )
    diploma_id: Mapped[Optional[str]] = mapped_column(ForeignKey("diplomas.id", ondelete="SET NULL"))
    document_type: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_key: Mapped[str] = mapped_column(Text, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")

    __table_args__ = (
        CheckConstraint("status IN ('pending','accepted','rejected','deleted')", name="status_allowed"),
    )


class AvailabilityConfirmation(TimestampMixin, Base):
    __tablename__ = "availability_confirmations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    practitioner_id: Mapped[str] = mapped_column(
        ForeignKey("practitioners.id", ondelete="CASCADE"), nullable=False, index=True
    )
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    estimated_wait_days: Mapped[Optional[int]] = mapped_column(Integer)
    individual_places: Mapped[Optional[int]] = mapped_column(Integer)
    collective_places: Mapped[Optional[int]] = mapped_column(Integer)
    confirmed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        UniqueConstraint("practitioner_id", "week_start"),
        CheckConstraint("status IN ('available','waitlist','unavailable')", name="status_allowed"),
    )


class AvailabilitySlot(TimestampMixin, Base):
    __tablename__ = "availability_slots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    confirmation_id: Mapped[str] = mapped_column(
        ForeignKey("availability_confirmations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    slot_date: Mapped[date] = mapped_column(Date, nullable=False)
    period: Mapped[str] = mapped_column(String(32), nullable=False)
    available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint("confirmation_id", "slot_date", "period"),
        CheckConstraint("period IN ('morning','afternoon','evening')", name="period_allowed"),
    )
