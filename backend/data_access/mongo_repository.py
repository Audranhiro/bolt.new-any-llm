from typing import Any, Dict, Optional

from backend.data_access.records import PractitionerRecord, UserRecord

ATTRIBUTE_FIELDS = {
    "audience": "publics",
    "modality": "intervention_places",
    "experience_domain": "experience_domains",
    "accompaniment_type": "accompaniment_types",
    "accompaniment_format": "accompaniment_formats",
    "payment_method": "payment_methods",
    "habitual_slot": "habitual_slots",
}


class MongoAccountProfileRepository:
    """Adaptateur de lecture/ecriture pour les collections historiques."""

    def __init__(self, database: Any) -> None:
        self.database = database

    async def list_user_ids(self) -> list[str]:
        cursor = self.database.users.find({}, {"_id": 0, "id": 1})
        return [document["id"] async for document in cursor if document.get("id")]

    async def list_practitioner_ids(self) -> list[str]:
        cursor = self.database.intervenants.find({}, {"_id": 0, "id": 1})
        return [document["id"] async for document in cursor if document.get("id")]

    @staticmethod
    def _user(document: Optional[Dict[str, Any]]) -> Optional[UserRecord]:
        if not document:
            return None
        return UserRecord(
            id=document["id"],
            email=document["email"].strip().lower(),
            password_hash=document["password_hash"],
            role=document.get("role", "intervenant"),
            status=document.get("status", "active"),
        )

    @staticmethod
    def _practitioner(
        document: Optional[Dict[str, Any]],
    ) -> Optional[PractitionerRecord]:
        if not document:
            return None
        attributes = {
            attribute_type: list(document.get(field_name) or [])
            for attribute_type, field_name in ATTRIBUTE_FIELDS.items()
            if document.get(field_name)
        }
        return PractitionerRecord(
            id=document["id"],
            user_id=document["user_id"],
            first_name=document.get("first_name", ""),
            last_name=document.get("last_name", ""),
            phone=document.get("phone", ""),
            city=document.get("city", ""),
            postal_code=document.get("postal_code", ""),
            zone=document.get("zone", ""),
            intervention_radius_km=document.get("intervention_radius_km"),
            latitude=document.get("lat"),
            longitude=document.get("lng"),
            bio=document.get("bio", ""),
            photo_url=document.get("photo_url", ""),
            experience_years=document.get("experience_years"),
            indicative_rate=document.get("indicative_rate", ""),
            publication_status=(
                "hidden"
                if document.get("hidden")
                else document.get("publication_status", "published")
            ),
            diploma=document.get("diploma", ""),
            diploma_verified=bool(document.get("diploma_verified", False)),
            attributes=attributes,
        )

    async def get_user_by_id(self, user_id: str) -> Optional[UserRecord]:
        document = await self.database.users.find_one({"id": user_id}, {"_id": 0})
        return self._user(document)

    async def get_user_by_email(self, email: str) -> Optional[UserRecord]:
        document = await self.database.users.find_one(
            {"email": email.strip().lower()}, {"_id": 0}
        )
        return self._user(document)

    async def save_user(self, user: UserRecord) -> None:
        await self.database.users.update_one(
            {"id": user.id},
            {
                "$set": {
                    "email": user.email.strip().lower(),
                    "password_hash": user.password_hash,
                    "role": user.role,
                    "status": user.status,
                }
            },
            upsert=True,
        )

    async def get_practitioner_by_id(
        self, practitioner_id: str
    ) -> Optional[PractitionerRecord]:
        document = await self.database.intervenants.find_one(
            {"id": practitioner_id}, {"_id": 0}
        )
        return self._practitioner(document)

    async def get_practitioner_by_user_id(
        self, user_id: str
    ) -> Optional[PractitionerRecord]:
        document = await self.database.intervenants.find_one(
            {"user_id": user_id}, {"_id": 0}
        )
        return self._practitioner(document)

    async def save_practitioner(self, practitioner: PractitionerRecord) -> None:
        document: Dict[str, Any] = {
            "id": practitioner.id,
            "user_id": practitioner.user_id,
            "first_name": practitioner.first_name,
            "last_name": practitioner.last_name,
            "phone": practitioner.phone,
            "city": practitioner.city,
            "postal_code": practitioner.postal_code,
            "zone": practitioner.zone,
            "intervention_radius_km": practitioner.intervention_radius_km,
            "lat": practitioner.latitude,
            "lng": practitioner.longitude,
            "bio": practitioner.bio,
            "photo_url": practitioner.photo_url,
            "experience_years": practitioner.experience_years,
            "indicative_rate": practitioner.indicative_rate,
            "publication_status": practitioner.publication_status,
            "hidden": practitioner.publication_status == "hidden",
            "diploma": practitioner.diploma,
            "diploma_verified": practitioner.diploma_verified,
        }
        for attribute_type, field_name in ATTRIBUTE_FIELDS.items():
            document[field_name] = list(practitioner.attributes.get(attribute_type, []))
        await self.database.intervenants.update_one(
            {"id": practitioner.id}, {"$set": document}, upsert=True
        )
