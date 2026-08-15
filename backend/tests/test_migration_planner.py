import asyncio
from dataclasses import replace

from backend.data_access.migration import (
    CONFLICT,
    INVALID,
    MATCHED,
    READY,
    AccountProfileMigrationPlanner,
)
from backend.data_access.records import PractitionerRecord, UserRecord


class MemoryRepository:
    def __init__(self, users=(), practitioners=()):
        self.users = {item.id: item for item in users}
        self.practitioners = {item.id: item for item in practitioners}

    async def list_user_ids(self):
        return sorted(self.users)

    async def list_practitioner_ids(self):
        return sorted(self.practitioners)

    async def get_user_by_id(self, user_id):
        return self.users.get(user_id)

    async def get_user_by_email(self, email):
        return next((item for item in self.users.values() if item.email == email), None)

    async def save_user(self, user):
        raise AssertionError("Le planificateur ne doit jamais ecrire")

    async def get_practitioner_by_id(self, practitioner_id):
        return self.practitioners.get(practitioner_id)

    async def get_practitioner_by_user_id(self, user_id):
        return next(
            (item for item in self.practitioners.values() if item.user_id == user_id),
            None,
        )

    async def save_practitioner(self, practitioner):
        raise AssertionError("Le planificateur ne doit jamais ecrire")


def test_planner_reports_safe_counts_without_personal_data():
    source_user = UserRecord(
        id="user-sensitive-id",
        email="private@example.test",
        password_hash="secret-hash-value",
    )
    matched_practitioner = PractitionerRecord(
        id="practitioner-matched",
        user_id=source_user.id,
        first_name="Ada",
        last_name="Martin",
    )
    ready_practitioner = replace(matched_practitioner, id="practitioner-ready")
    conflicting_user = replace(source_user, email="other@example.test")
    invalid_user = UserRecord(id="invalid-user", email="", password_hash="")

    source = MemoryRepository(
        users=[source_user, invalid_user],
        practitioners=[matched_practitioner, ready_practitioner],
    )
    destination = MemoryRepository(
        users=[conflicting_user], practitioners=[matched_practitioner]
    )

    report = asyncio.run(AccountProfileMigrationPlanner(source, destination).plan())

    assert report.totals == {
        READY: 1,
        MATCHED: 1,
        CONFLICT: 1,
        INVALID: 1,
    }
    serialized = repr(report)
    assert "private@example.test" not in serialized
    assert "other@example.test" not in serialized
    assert "secret-hash-value" not in serialized
    assert "user-sensitive-id" not in serialized
    conflict = next(item for item in report.items if item.status == CONFLICT)
    assert conflict.differing_fields == ("private_identity_or_credentials",)
    safe_payload = report.as_safe_dict()
    assert safe_payload["mode"] == "dry-run"
    assert safe_payload["totals"] == report.totals
