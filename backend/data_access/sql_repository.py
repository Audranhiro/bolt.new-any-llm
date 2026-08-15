import asyncio
from typing import Dict, List, Optional

from sqlalchemy import delete, select

from backend.data_access.records import PractitionerRecord, UserRecord
from backend.relational.database import RelationalDatabase
from backend.relational.identity_models import Role, User, UserRole
from backend.relational.practitioner_models import (
    Diploma,
    Practitioner,
    PractitionerAttribute,
)


class SqlAccountProfileRepository:
    """Adaptateur PostgreSQL idempotent, non utilise par les routes publiques."""

    def __init__(self, database: RelationalDatabase) -> None:
        self.database = database

    async def list_user_ids(self) -> list[str]:
        return await asyncio.to_thread(self._list_ids, User)

    async def list_practitioner_ids(self) -> list[str]:
        return await asyncio.to_thread(self._list_ids, Practitioner)

    def _list_ids(self, model) -> list[str]:
        with self.database.session() as session:
            return list(session.scalars(select(model.id).order_by(model.id)))

    async def get_user_by_id(self, user_id: str) -> Optional[UserRecord]:
        return await asyncio.to_thread(self._get_user, "id", user_id)

    async def get_user_by_email(self, email: str) -> Optional[UserRecord]:
        return await asyncio.to_thread(self._get_user, "email", email.strip().lower())

    def _get_user(self, field_name: str, value: str) -> Optional[UserRecord]:
        with self.database.session() as session:
            field = getattr(User, field_name)
            user = session.scalar(select(User).where(field == value))
            if user is None:
                return None
            role = session.scalar(
                select(Role.code)
                .join(UserRole, UserRole.role_id == Role.id)
                .where(UserRole.user_id == user.id)
            )
            return UserRecord(
                id=user.id,
                email=user.email,
                password_hash=user.password_hash,
                role=role or "intervenant",
                status=user.status,
            )

    async def save_user(self, user: UserRecord) -> None:
        await asyncio.to_thread(self._save_user, user)

    def _save_user(self, record: UserRecord) -> None:
        with self.database.session() as session:
            user = session.get(User, record.id)
            if user is None:
                user = User(id=record.id)
                session.add(user)
            user.email = record.email.strip().lower()
            user.password_hash = record.password_hash
            user.status = record.status

            role = session.scalar(select(Role).where(Role.code == record.role))
            if role is None:
                role = Role(code=record.role, label=record.role)
                session.add(role)
                session.flush()
            existing_role = session.scalar(
                select(UserRole).where(
                    UserRole.user_id == record.id,
                    UserRole.role_id == role.id,
                    UserRole.organization_id.is_(None),
                )
            )
            if existing_role is None:
                session.add(UserRole(user_id=record.id, role_id=role.id))

    async def get_practitioner_by_id(
        self, practitioner_id: str
    ) -> Optional[PractitionerRecord]:
        return await asyncio.to_thread(self._get_practitioner, "id", practitioner_id)

    async def get_practitioner_by_user_id(
        self, user_id: str
    ) -> Optional[PractitionerRecord]:
        return await asyncio.to_thread(self._get_practitioner, "user_id", user_id)

    def _get_practitioner(
        self, field_name: str, value: str
    ) -> Optional[PractitionerRecord]:
        with self.database.session() as session:
            field = getattr(Practitioner, field_name)
            practitioner = session.scalar(select(Practitioner).where(field == value))
            if practitioner is None:
                return None
            attributes: Dict[str, List[str]] = {}
            rows = session.scalars(
                select(PractitionerAttribute).where(
                    PractitionerAttribute.practitioner_id == practitioner.id
                )
            )
            for row in rows:
                attributes.setdefault(row.attribute_type, []).append(row.value)
            diploma = session.scalar(
                select(Diploma)
                .where(Diploma.practitioner_id == practitioner.id)
                .order_by(Diploma.created_at.desc())
            )
            return PractitionerRecord(
                id=practitioner.id,
                user_id=practitioner.user_id,
                first_name=practitioner.first_name,
                last_name=practitioner.last_name,
                phone=practitioner.phone,
                city=practitioner.city,
                postal_code=practitioner.postal_code,
                zone=practitioner.zone,
                intervention_radius_km=practitioner.intervention_radius_km,
                latitude=practitioner.latitude,
                longitude=practitioner.longitude,
                bio=practitioner.bio,
                photo_url=practitioner.photo_url,
                experience_years=practitioner.experience_years,
                indicative_rate=practitioner.indicative_rate,
                publication_status=practitioner.publication_status,
                diploma=diploma.title if diploma else "",
                diploma_verified=(
                    diploma.verification_status == "verified" if diploma else False
                ),
                attributes=attributes,
            )

    async def save_practitioner(self, practitioner: PractitionerRecord) -> None:
        await asyncio.to_thread(self._save_practitioner, practitioner)

    def _save_practitioner(self, record: PractitionerRecord) -> None:
        with self.database.session() as session:
            practitioner = session.get(Practitioner, record.id)
            if practitioner is None:
                practitioner = Practitioner(id=record.id, user_id=record.user_id)
                session.add(practitioner)
            practitioner.user_id = record.user_id
            practitioner.first_name = record.first_name
            practitioner.last_name = record.last_name
            practitioner.phone = record.phone
            practitioner.city = record.city
            practitioner.postal_code = record.postal_code
            practitioner.zone = record.zone
            practitioner.intervention_radius_km = record.intervention_radius_km
            practitioner.latitude = record.latitude
            practitioner.longitude = record.longitude
            practitioner.bio = record.bio
            practitioner.photo_url = record.photo_url
            practitioner.experience_years = record.experience_years
            practitioner.indicative_rate = record.indicative_rate
            practitioner.publication_status = record.publication_status

            session.execute(
                delete(PractitionerAttribute).where(
                    PractitionerAttribute.practitioner_id == record.id
                )
            )
            for attribute_type, values in record.attributes.items():
                for value in dict.fromkeys(values):
                    session.add(
                        PractitionerAttribute(
                            practitioner_id=record.id,
                            attribute_type=attribute_type,
                            value=value,
                        )
                    )

            diploma = session.scalar(
                select(Diploma).where(Diploma.practitioner_id == record.id)
            )
            if record.diploma:
                if diploma is None:
                    diploma = Diploma(practitioner_id=record.id)
                    session.add(diploma)
                diploma.title = record.diploma
                diploma.institution = diploma.institution or ""
                diploma.verification_status = (
                    "verified" if record.diploma_verified else "pending"
                )
