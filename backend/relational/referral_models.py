from datetime import datetime
from typing import Optional

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.relational.base import Base, TimestampMixin, new_id


class Referral(TimestampMixin, Base):
    __tablename__ = "referrals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    public_reference: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    created_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    assigned_practitioner_id: Mapped[Optional[str]] = mapped_column(ForeignKey("practitioners.id"))
    status: Mapped[str] = mapped_column(String(48), nullable=False, default="created")
    city: Mapped[str] = mapped_column(String(160), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(16), nullable=False, default="")
    acceptable_radius_km: Mapped[Optional[int]] = mapped_column(Integer)
    general_goal: Mapped[str] = mapped_column(String(120), nullable=False)
    preferred_modality: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    preferred_contact: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint(
            "status IN ('created','patient_invited','information_completed','request_sent',"
            "'practitioner_assigned','patient_contacted','appointment_scheduled',"
            "'support_started','unsuccessful','cancelled')",
            name="status_allowed",
        ),
        Index("ix_referrals_org_status_created", "organization_id", "status", "created_at"),
    )


class ReferralPatientInvitation(TimestampMixin, Base):
    __tablename__ = "referral_patient_invitations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    referral_id: Mapped[str] = mapped_column(
        ForeignKey("referrals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class ReferralContact(TimestampMixin, Base):
    __tablename__ = "referral_contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    referral_id: Mapped[str] = mapped_column(
        ForeignKey("referrals.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone_encrypted: Mapped[str] = mapped_column(Text, nullable=False, default="")
    email_encrypted: Mapped[str] = mapped_column(Text, nullable=False, default="")
    privacy_notice_version: Mapped[str] = mapped_column(String(40), nullable=False)
    consent_recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ReferralAssignment(TimestampMixin, Base):
    __tablename__ = "referral_assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    referral_id: Mapped[str] = mapped_column(
        ForeignKey("referrals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    practitioner_id: Mapped[str] = mapped_column(ForeignKey("practitioners.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="proposed")
    refusal_reason: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("referral_id", "practitioner_id"),
        CheckConstraint("status IN ('proposed','accepted','refused','expired')", name="status_allowed"),
    )


class ReferralStatusHistory(Base):
    __tablename__ = "referral_status_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    referral_id: Mapped[str] = mapped_column(
        ForeignKey("referrals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    actor_user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"))
    previous_status: Mapped[str] = mapped_column(String(48), nullable=False, default="")
    new_status: Mapped[str] = mapped_column(String(48), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False, default="")
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_history_org_occurred", "organization_id", "occurred_at"),
    )
