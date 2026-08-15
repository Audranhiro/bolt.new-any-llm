from backend.relational.base import Base
from backend.relational import models  # noqa: F401


EXPECTED_TABLES = {
    "users", "roles", "user_roles", "organizations", "organization_members",
    "practitioners", "practitioner_attributes", "diplomas",
    "professional_documents", "availability_confirmations", "availability_slots",
    "professional_access_requests", "referrals", "referral_patient_invitations",
    "referral_contacts", "referral_assignments", "referral_status_history",
    "callback_requests", "structures", "classes", "class_bookings", "videos",
    "notifications", "pilot_accesses", "subscriptions", "audit_logs",
}


def test_expected_relational_tables_are_declared():
    assert EXPECTED_TABLES == set(Base.metadata.tables)


def test_tenant_owned_tables_require_organization_id():
    for table_name in (
        "organization_members", "referrals", "referral_status_history",
        "pilot_accesses", "subscriptions",
    ):
        assert Base.metadata.tables[table_name].c.organization_id.nullable is False


def test_patient_invitation_stores_hash_not_raw_token():
    columns = set(Base.metadata.tables["referral_patient_invitations"].c.keys())
    assert "token_hash" in columns
    assert "token" not in columns


def test_sensitive_contact_fields_are_not_plaintext_columns():
    for table_name in ("referral_contacts", "callback_requests", "class_bookings"):
        columns = set(Base.metadata.tables[table_name].c.keys())
        assert "phone" not in columns
        assert "email" not in columns
        assert "phone_encrypted" in columns
        assert "email_encrypted" in columns
