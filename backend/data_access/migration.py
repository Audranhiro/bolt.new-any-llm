import hashlib
from dataclasses import dataclass, field, fields
from backend.data_access.records import PractitionerRecord, UserRecord
from backend.data_access.repositories import AccountProfileRepository

READY = "ready"
MATCHED = "matched"
CONFLICT = "conflict"
INVALID = "invalid"


@dataclass(frozen=True)
class MigrationItem:
    kind: str
    reference: str
    status: str
    differing_fields: tuple[str, ...] = ()


@dataclass
class MigrationReport:
    items: list[MigrationItem] = field(default_factory=list)

    @property
    def totals(self) -> dict[str, int]:
        totals = {READY: 0, MATCHED: 0, CONFLICT: 0, INVALID: 0}
        for item in self.items:
            totals[item.status] += 1
        return totals

    def as_safe_dict(self) -> dict:
        return {
            "mode": "dry-run",
            "totals": self.totals,
            "items": [
                {
                    "kind": item.kind,
                    "reference": item.reference,
                    "status": item.status,
                    "differing_fields": list(item.differing_fields),
                }
                for item in self.items
            ],
        }


def safe_reference(identifier: str) -> str:
    """Reference stable et non reversible pour les rapports de migration."""
    return hashlib.sha256(identifier.encode("utf-8")).hexdigest()[:12]


def _safe_differences(source, destination) -> tuple[str, ...]:
    differences = []
    for record_field in fields(source):
        if getattr(source, record_field.name) == getattr(
            destination, record_field.name
        ):
            continue
        if record_field.name in {"email", "password_hash", "phone"}:
            differences.append("private_identity_or_credentials")
        else:
            differences.append(record_field.name)
    return tuple(sorted(set(differences)))


def _valid_user(user: UserRecord) -> bool:
    return bool(user.id and user.email and user.password_hash and user.role)


def _valid_practitioner(practitioner: PractitionerRecord) -> bool:
    return bool(
        practitioner.id
        and practitioner.user_id
        and practitioner.first_name
        and practitioner.last_name
    )


class AccountProfileMigrationPlanner:
    """Compare deux stockages sans effectuer aucune ecriture."""

    def __init__(
        self,
        source: AccountProfileRepository,
        destination: AccountProfileRepository,
    ) -> None:
        self.source = source
        self.destination = destination

    async def plan(self) -> MigrationReport:
        report = MigrationReport()
        for user_id in await self.source.list_user_ids():
            source_user = await self.source.get_user_by_id(user_id)
            destination_user = await self.destination.get_user_by_id(user_id)
            report.items.append(
                self._compare("user", user_id, source_user, destination_user)
            )
        for practitioner_id in await self.source.list_practitioner_ids():
            source_practitioner = await self.source.get_practitioner_by_id(
                practitioner_id
            )
            destination_practitioner = await self.destination.get_practitioner_by_id(
                practitioner_id
            )
            report.items.append(
                self._compare(
                    "practitioner",
                    practitioner_id,
                    source_practitioner,
                    destination_practitioner,
                )
            )
        return report

    @staticmethod
    def _compare(kind: str, identifier: str, source, destination) -> MigrationItem:
        reference = safe_reference(identifier)
        valid = _valid_user(source) if kind == "user" else _valid_practitioner(source)
        if not valid:
            return MigrationItem(kind, reference, INVALID)
        if destination is None:
            return MigrationItem(kind, reference, READY)
        differences = _safe_differences(source, destination)
        if not differences:
            return MigrationItem(kind, reference, MATCHED)
        return MigrationItem(kind, reference, CONFLICT, differences)
