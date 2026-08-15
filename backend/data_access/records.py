from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass(frozen=True)
class UserRecord:
    id: str
    email: str
    password_hash: str
    role: str = "intervenant"
    status: str = "active"


@dataclass(frozen=True)
class PractitionerRecord:
    id: str
    user_id: str
    first_name: str
    last_name: str
    phone: str = ""
    city: str = ""
    postal_code: str = ""
    zone: str = ""
    intervention_radius_km: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bio: str = ""
    photo_url: str = ""
    experience_years: Optional[int] = None
    indicative_rate: str = ""
    publication_status: str = "draft"
    diploma: str = ""
    diploma_verified: bool = False
    attributes: Dict[str, List[str]] = field(default_factory=dict)
