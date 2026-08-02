from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
try:
    from backend.config import Settings
except ModuleNotFoundError:
    # Compatibilité avec les environnements existants lancés depuis backend/.
    from config import Settings

# ---------- Config ----------
JWT_ALGORITHM = "HS256"
settings = Settings.from_env()
JWT_SECRET = settings.jwt_secret

client = AsyncIOMotorClient(settings.mongo_url)
db = client[settings.db_name]

app = FastAPI(title="APA Connect API")
api_router = APIRouter(prefix="/api")

logger = logging.getLogger("apa")
logging.basicConfig(level=logging.INFO)

# ---------- Helpers ----------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": now_utc() + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def monday_of_week(d: Optional[datetime] = None) -> str:
    d = d or now_utc()
    monday = d.date() - timedelta(days=d.weekday())
    return monday.isoformat()

def today_iso() -> str:
    return now_utc().date().isoformat()

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    return user

async def require_intervenant(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "intervenant":
        raise HTTPException(status_code=403, detail="Accès réservé à l'intervenant")
    return user

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token", value=token, httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=604800,
        path="/",
    )

# ---------- Models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class IntervenantProfileIn(BaseModel):
    first_name: str
    last_name: str
    city: str
    zone: str = ""
    diploma: str = ""
    publics: List[str] = []
    intervention_places: List[str] = []  # e.g. "domicile", "cabinet", "exterieur", "salle"
    phone: Optional[str] = ""
    bio: Optional[str] = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    photo_url: Optional[str] = ""
    intervention_radius_km: Optional[int] = Field(default=None, ge=0, le=250)
    experience_years: Optional[int] = Field(default=None, ge=0, le=70)
    experience_domains: List[str] = Field(default_factory=list)
    accompaniment_types: List[str] = Field(default_factory=list)
    accompaniment_formats: List[str] = Field(default_factory=list)
    indicative_rate: Optional[str] = ""
    payment_methods: List[str] = Field(default_factory=list)
    estimated_wait_days: Optional[int] = Field(default=None, ge=0, le=365)
    habitual_slots: List[str] = Field(default_factory=list)
    individual_places_available: Optional[int] = Field(default=None, ge=0, le=10000)
    collective_places_available: Optional[int] = Field(default=None, ge=0, le=10000)
    availability_status: Optional[str] = None

class AvailabilityIn(BaseModel):
    # dict: date(YYYY-MM-DD) -> {"morning": bool, "afternoon": bool}
    availability: Dict[str, Dict[str, bool]]
    availability_status: str = "available"
    estimated_wait_days: Optional[int] = Field(default=None, ge=0, le=365)
    individual_places_available: Optional[int] = Field(default=None, ge=0, le=10000)
    collective_places_available: Optional[int] = Field(default=None, ge=0, le=10000)

AVAILABILITY_STATUSES = {"available", "waitlist", "unavailable"}

class CallbackIn(BaseModel):
    intervenant_id: str
    first_name: str
    contact: str = ""  # backward compat
    phone: Optional[str] = ""
    email: Optional[str] = ""
    city: str
    need: str
    message: Optional[str] = ""

class CallbackStatusIn(BaseModel):
    status: str  # "new" | "contacted" | "closed"

# ---------- Auth endpoints ----------
@api_router.post("/auth/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(data.password),
        "role": "intervenant",
        "created_at": now_utc().isoformat(),
    }
    await db.users.insert_one(user_doc)

    # create empty intervenant profile
    profile = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "first_name": data.first_name,
        "last_name": data.last_name,
        "city": "",
        "zone": "",
        "diploma": "",
        "diploma_verified": False,
        "publics": [],
        "intervention_places": [],
        "availability": {},
        "availability_week": "",
        "availability_confirmed_at": None,
        "last_availability_update": None,
        "hidden": False,
        "phone": "",
        "bio": "",
        "lat": None,
        "lng": None,
        "created_at": now_utc().isoformat(),
    }
    await db.intervenants.insert_one(profile)

    token = create_access_token(user_id, "intervenant")
    set_auth_cookie(response, token)
    return {"id": user_id, "email": email, "role": "intervenant", "token": token}

@api_router.post("/auth/login")
async def login(data: LoginIn, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = create_access_token(user["id"], user["role"])
    set_auth_cookie(response, token)
    return {"id": user["id"], "email": user["email"], "role": user["role"], "token": token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

# ---------- Intervenant (self) endpoints ----------
@api_router.get("/intervenants/me")
async def get_my_profile(user: dict = Depends(require_intervenant)):
    profile = await db.intervenants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")
    return profile

@api_router.put("/intervenants/me")
async def update_my_profile(data: IntervenantProfileIn, user: dict = Depends(require_intervenant)):
    update = data.model_dump(exclude_none=True)
    if update.get("availability_status") and update["availability_status"] not in AVAILABILITY_STATUSES:
        raise HTTPException(status_code=400, detail="Statut de disponibilité invalide")
    update["updated_at"] = now_utc().isoformat()
    await db.intervenants.update_one({"user_id": user["id"]}, {"$set": update})
    profile = await db.intervenants.find_one({"user_id": user["id"]}, {"_id": 0})
    return profile

@api_router.post("/intervenants/me/availability")
async def set_availability(data: AvailabilityIn, user: dict = Depends(require_intervenant)):
    """Confirm availability for this week."""
    if data.availability_status not in AVAILABILITY_STATUSES:
        raise HTTPException(status_code=400, detail="Statut de disponibilité invalide")
    if data.availability_status == "available" and not data.availability:
        raise HTTPException(status_code=400, detail="Sélectionnez au moins un créneau disponible")
    week = monday_of_week()
    await db.intervenants.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "availability": data.availability,
            "availability_week": week,
            "availability_confirmed_at": now_utc().isoformat(),
            "last_availability_update": now_utc().isoformat(),
            "availability_status": data.availability_status,
            "estimated_wait_days": data.estimated_wait_days,
            "individual_places_available": data.individual_places_available,
            "collective_places_available": data.collective_places_available,
        }}
    )
    profile = await db.intervenants.find_one({"user_id": user["id"]}, {"_id": 0})
    return profile

@api_router.post("/intervenants/me/keep-availability")
async def keep_availability(user: dict = Depends(require_intervenant)):
    """Re-confirm existing availability for this week."""
    week = monday_of_week()
    profile = await db.intervenants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")

    # Shift availability dates to this week using previous pattern (weekday based)
    prev_av = profile.get("availability") or {}
    new_av: Dict[str, Dict[str, bool]] = {}
    base = datetime.fromisoformat(week).date()
    # Map weekday -> slots (first occurrence wins)
    weekday_map: Dict[int, Dict[str, bool]] = {}
    for date_str, slots in prev_av.items():
        try:
            d = datetime.fromisoformat(date_str).date()
            weekday_map.setdefault(d.weekday(), slots)
        except Exception:
            continue
    for i in range(7):
        d = base + timedelta(days=i)
        if i in weekday_map:
            new_av[d.isoformat()] = weekday_map[i]

    await db.intervenants.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "availability": new_av,
            "availability_week": week,
            "availability_confirmed_at": now_utc().isoformat(),
            "last_availability_update": now_utc().isoformat(),
            "availability_status": "available" if new_av else "unavailable",
        }}
    )
    profile = await db.intervenants.find_one({"user_id": user["id"]}, {"_id": 0})
    return profile

@api_router.post("/intervenants/me/unavailable")
async def mark_unavailable(user: dict = Depends(require_intervenant)):
    """Mark as unavailable this week."""
    await db.intervenants.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "availability": {},
            "availability_week": monday_of_week(),
            "availability_confirmed_at": now_utc().isoformat(),
            "last_availability_update": now_utc().isoformat(),
            "availability_status": "unavailable",
        }}
    )
    profile = await db.intervenants.find_one({"user_id": user["id"]}, {"_id": 0})
    return profile

# ---------- Public endpoints ----------
def is_available_this_week(profile: dict) -> bool:
    return (
        profile.get("availability_status", "available") == "available"
        and profile.get("availability_week") == monday_of_week()
        and bool(profile.get("availability"))
    )

def availability_is_recent(profile: dict, max_days: int = 8) -> bool:
    raw = profile.get("availability_confirmed_at")
    if not raw:
        return False
    try:
        confirmed_at = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if confirmed_at.tzinfo is None:
            confirmed_at = confirmed_at.replace(tzinfo=timezone.utc)
        return now_utc() - confirmed_at <= timedelta(days=max_days)
    except (TypeError, ValueError):
        return False

def is_available_today(profile: dict) -> bool:
    if not is_available_this_week(profile):
        return False
    slots = (profile.get("availability") or {}).get(today_iso())
    if not slots:
        return False
    return bool(slots.get("morning") or slots.get("afternoon"))

def public_intervenant(profile: dict) -> dict:
    return {
        "id": profile["id"],
        "first_name": profile.get("first_name", ""),
        "last_name": profile.get("last_name", ""),
        "city": profile.get("city", ""),
        "zone": profile.get("zone", ""),
        "diploma": profile.get("diploma", ""),
        "diploma_verified": profile.get("diploma_verified", False),
        "publics": profile.get("publics", []),
        "intervention_places": profile.get("intervention_places", []),
        "availability": profile.get("availability", {}) if is_available_this_week(profile) else {},
        "availability_week": profile.get("availability_week", ""),
        "availability_confirmed_at": profile.get("availability_confirmed_at"),
        "last_availability_update": profile.get("last_availability_update"),
        "available_this_week": is_available_this_week(profile),
        "available_today": is_available_today(profile),
        "lat": profile.get("lat"),
        "lng": profile.get("lng"),
        "bio": profile.get("bio", ""),
        "photo_url": profile.get("photo_url", ""),
        "intervention_radius_km": profile.get("intervention_radius_km"),
        "experience_years": profile.get("experience_years"),
        "experience_domains": profile.get("experience_domains", []),
        "accompaniment_types": profile.get("accompaniment_types", []),
        "accompaniment_formats": profile.get("accompaniment_formats", []),
        "indicative_rate": profile.get("indicative_rate", ""),
        "payment_methods": profile.get("payment_methods", []),
        "estimated_wait_days": profile.get("estimated_wait_days"),
        "habitual_slots": profile.get("habitual_slots", []),
        "individual_places_available": profile.get("individual_places_available"),
        "collective_places_available": profile.get("collective_places_available"),
        "availability_status": profile.get("availability_status", "available" if is_available_this_week(profile) else "unavailable"),
        "availability_recent": availability_is_recent(profile),
    }

@api_router.get("/intervenants")
async def list_intervenants(
    city: Optional[str] = None,
    available_today: bool = False,
    available_week: bool = False,
    home: bool = False,
    verified: bool = False,
):
    query = {"hidden": {"$ne": True}}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if home:
        query["intervention_places"] = {"$in": ["domicile"]}
    if verified:
        query["diploma_verified"] = True

    cursor = db.intervenants.find(query, {"_id": 0})
    results = []
    async for p in cursor:
        pub = public_intervenant(p)
        if available_today and not pub["available_today"]:
            continue
        if available_week and not pub["available_this_week"]:
            continue
        results.append(pub)
    return results

@api_router.get("/intervenants/{intervenant_id}")
async def get_intervenant(intervenant_id: str):
    p = await db.intervenants.find_one({"id": intervenant_id, "hidden": {"$ne": True}}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Intervenant introuvable")
    return public_intervenant(p)

# ---------- Callbacks ----------
ALLOWED_STATUSES = {"new", "contacted", "closed"}

@api_router.post("/callbacks")
async def create_callback(data: CallbackIn):
    p = await db.intervenants.find_one({"id": data.intervenant_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Intervenant introuvable")
    phone = (data.phone or "").strip()
    email = (data.email or "").strip()
    contact = (data.contact or "").strip()
    # backward compat: if only "contact" provided, infer email/phone
    if not phone and not email and contact:
        if "@" in contact:
            email = contact
        else:
            phone = contact
    if not phone and not email:
        raise HTTPException(status_code=400, detail="Téléphone ou email obligatoire")
    doc = {
        "id": str(uuid.uuid4()),
        "intervenant_id": data.intervenant_id,
        "intervenant_name": f"{p.get('first_name','')} {p.get('last_name','')}".strip(),
        "first_name": data.first_name,
        "phone": phone,
        "email": email,
        "contact": contact or (phone or email),
        "city": data.city,
        "need": data.need,
        "message": data.message or "",
        "status": "new",
        "created_at": now_utc().isoformat(),
    }
    await db.callbacks.insert_one(doc)
    return {"id": doc["id"], "ok": True}

@api_router.get("/intervenants/me/callbacks")
async def my_callbacks(user: dict = Depends(require_intervenant)):
    profile = await db.intervenants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")
    cursor = db.callbacks.find({"intervenant_id": profile["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(1000)

@api_router.patch("/intervenants/me/callbacks/{callback_id}/status")
async def update_my_callback_status(callback_id: str, data: CallbackStatusIn, user: dict = Depends(require_intervenant)):
    if data.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail="Statut invalide")
    profile = await db.intervenants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")
    res = await db.callbacks.update_one(
        {"id": callback_id, "intervenant_id": profile["id"]},
        {"$set": {"status": data.status, "status_updated_at": now_utc().isoformat()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    return {"ok": True, "status": data.status}

# ---------- Admin ----------
@api_router.get("/admin/intervenants")
async def admin_list_intervenants(_: dict = Depends(require_admin)):
    cursor = db.intervenants.find({}, {"_id": 0})
    out = []
    async for p in cursor:
        out.append({
            **p,
            "available_this_week": is_available_this_week(p),
            "available_today": is_available_today(p),
        })
    return out

@api_router.post("/admin/intervenants/{intervenant_id}/validate-diploma")
async def admin_validate_diploma(intervenant_id: str, _: dict = Depends(require_admin)):
    res = await db.intervenants.update_one({"id": intervenant_id}, {"$set": {"diploma_verified": True}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Intervenant introuvable")
    return {"ok": True}

@api_router.post("/admin/intervenants/{intervenant_id}/unvalidate-diploma")
async def admin_unvalidate_diploma(intervenant_id: str, _: dict = Depends(require_admin)):
    res = await db.intervenants.update_one({"id": intervenant_id}, {"$set": {"diploma_verified": False}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Intervenant introuvable")
    return {"ok": True}

@api_router.post("/admin/intervenants/{intervenant_id}/toggle-hidden")
async def admin_toggle_hidden(intervenant_id: str, _: dict = Depends(require_admin)):
    p = await db.intervenants.find_one({"id": intervenant_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Intervenant introuvable")
    await db.intervenants.update_one({"id": intervenant_id}, {"$set": {"hidden": not p.get("hidden", False)}})
    return {"ok": True, "hidden": not p.get("hidden", False)}

@api_router.get("/admin/callbacks")
async def admin_list_callbacks(_: dict = Depends(require_admin)):
    cursor = db.callbacks.find({}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(1000)

# =============================================================================
# MODULE 1: Cours collectifs APA (priorité cours sur chaise)
# =============================================================================
CLASS_CATEGORIES = {"cours_sur_chaise", "mobilite_douce", "prevention_chutes",
                    "renforcement_doux", "respiration_relaxation", "equilibre", "autre"}
CLASS_PUBLICS = {"seniors", "debutants", "personnes_deconditionnees",
                 "douleurs_chroniques", "retour_activite", "autre"}
BOOKING_STATUSES = {"reserved", "cancelled", "attended", "no_show"}

class ClassIn(BaseModel):
    title: str
    description: str = ""
    category: str = "cours_sur_chaise"
    class_type: str = ""  # libre: ex "individuel", "groupe", "duo"
    adapted_chair_class: bool = True
    target_public: List[str] = []
    city: str
    address: str = ""
    date: str  # ISO YYYY-MM-DD
    start_time: str = ""  # HH:MM
    duration_minutes: int = 60
    price: float = 0.0
    capacity: int = 8
    structure_id: Optional[str] = None
    structure_name: Optional[str] = ""

class ClassUpdateIn(ClassIn):
    pass

class StatusToggleIn(BaseModel):
    status: str  # "active" | "inactive"

class BookingIn(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""

class BookingStatusIn(BaseModel):
    status: str  # reserved/cancelled/attended/no_show

async def _get_my_intervenant(user: dict) -> dict:
    profile = await db.intervenants.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profil intervenant introuvable")
    return profile

async def _count_active_bookings(class_id: str) -> int:
    return await db.bookings.count_documents({"class_id": class_id, "status": "reserved"})

def _public_class(c: dict, intervenant_name: str = "", booked: int = 0) -> dict:
    cap = int(c.get("capacity") or 0)
    return {
        "id": c["id"],
        "title": c.get("title", ""),
        "description": c.get("description", ""),
        "category": c.get("category", ""),
        "class_type": c.get("class_type", ""),
        "adapted_chair_class": bool(c.get("adapted_chair_class", False)),
        "target_public": c.get("target_public", []) or [],
        "city": c.get("city", ""),
        "address": c.get("address", ""),
        "date": c.get("date", ""),
        "start_time": c.get("start_time", ""),
        "duration_minutes": c.get("duration_minutes", 60),
        "price": c.get("price", 0.0),
        "capacity": cap,
        "booked": booked,
        "places_left": max(0, cap - booked),
        "intervenant_id": c.get("intervenant_id", ""),
        "intervenant_name": intervenant_name,
        "structure_id": c.get("structure_id") or None,
        "structure_name": c.get("structure_name") or "",
        "status": c.get("status", "active"),
        "created_at": c.get("created_at", ""),
    }

@api_router.post("/intervenants/me/classes")
async def create_class(data: ClassIn, user: dict = Depends(require_intervenant)):
    if data.category not in CLASS_CATEGORIES:
        raise HTTPException(status_code=400, detail="Catégorie invalide")
    profile = await _get_my_intervenant(user)
    payload = data.model_dump()
    if payload.get("structure_id"):
        s = await db.structures.find_one({"id": payload["structure_id"]}, {"_id": 0, "name": 1})
        payload["structure_name"] = (s or {}).get("name", payload.get("structure_name") or "")
    doc = {
        "id": str(uuid.uuid4()),
        "intervenant_id": profile["id"],
        **payload,
        "status": "active",
        "created_at": now_utc().isoformat(),
    }
    await db.classes.insert_one(doc)
    return _public_class(doc, f"{profile.get('first_name','')} {profile.get('last_name','')}".strip(), 0)

@api_router.get("/intervenants/me/classes")
async def list_my_classes(user: dict = Depends(require_intervenant)):
    profile = await _get_my_intervenant(user)
    cursor = db.classes.find({"intervenant_id": profile["id"]}, {"_id": 0}).sort("date", 1)
    out = []
    name = f"{profile.get('first_name','')} {profile.get('last_name','')}".strip()
    async for c in cursor:
        booked = await _count_active_bookings(c["id"])
        out.append(_public_class(c, name, booked))
    return out

@api_router.put("/intervenants/me/classes/{class_id}")
async def update_my_class(class_id: str, data: ClassUpdateIn, user: dict = Depends(require_intervenant)):
    profile = await _get_my_intervenant(user)
    if data.category not in CLASS_CATEGORIES:
        raise HTTPException(status_code=400, detail="Catégorie invalide")
    payload = data.model_dump()
    if payload.get("structure_id"):
        s = await db.structures.find_one({"id": payload["structure_id"]}, {"_id": 0, "name": 1})
        payload["structure_name"] = (s or {}).get("name", payload.get("structure_name") or "")
    res = await db.classes.update_one(
        {"id": class_id, "intervenant_id": profile["id"]},
        {"$set": {**payload, "updated_at": now_utc().isoformat()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cours introuvable")
    c = await db.classes.find_one({"id": class_id}, {"_id": 0})
    booked = await _count_active_bookings(class_id)
    return _public_class(c, f"{profile.get('first_name','')} {profile.get('last_name','')}".strip(), booked)

@api_router.patch("/intervenants/me/classes/{class_id}/status")
async def toggle_my_class_status(class_id: str, data: StatusToggleIn, user: dict = Depends(require_intervenant)):
    if data.status not in {"active", "inactive"}:
        raise HTTPException(status_code=400, detail="Statut invalide")
    profile = await _get_my_intervenant(user)
    res = await db.classes.update_one(
        {"id": class_id, "intervenant_id": profile["id"]},
        {"$set": {"status": data.status}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cours introuvable")
    return {"ok": True, "status": data.status}

@api_router.get("/intervenants/me/classes/{class_id}/bookings")
async def list_my_class_bookings(class_id: str, user: dict = Depends(require_intervenant)):
    profile = await _get_my_intervenant(user)
    c = await db.classes.find_one({"id": class_id, "intervenant_id": profile["id"]}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Cours introuvable")
    cursor = db.bookings.find({"class_id": class_id}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(1000)

@api_router.patch("/intervenants/me/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, data: BookingStatusIn, user: dict = Depends(require_intervenant)):
    if data.status not in BOOKING_STATUSES:
        raise HTTPException(status_code=400, detail="Statut invalide")
    profile = await _get_my_intervenant(user)
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    c = await db.classes.find_one({"id": booking["class_id"], "intervenant_id": profile["id"]}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=403, detail="Non autorisé")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": data.status, "status_updated_at": now_utc().isoformat()}})
    return {"ok": True, "status": data.status}

@api_router.get("/classes")
async def list_classes(
    chair: bool = False,
    city: Optional[str] = None,
    category: Optional[str] = None,
):
    query: Dict[str, Any] = {"status": "active"}
    if chair:
        query["adapted_chair_class"] = True
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if category and category in CLASS_CATEGORIES:
        query["category"] = category
    cursor = db.classes.find(query, {"_id": 0}).sort([("adapted_chair_class", -1), ("date", 1)])
    out = []
    intervenant_cache: Dict[str, str] = {}
    async for c in cursor:
        # only show future or today
        if c.get("date") and c["date"] < today_iso():
            continue
        iid = c.get("intervenant_id", "")
        if iid not in intervenant_cache:
            p = await db.intervenants.find_one({"id": iid}, {"_id": 0, "first_name": 1, "last_name": 1})
            intervenant_cache[iid] = (f"{p.get('first_name','')} {p.get('last_name','')}".strip()
                                       if p else "")
        booked = await _count_active_bookings(c["id"])
        out.append(_public_class(c, intervenant_cache[iid], booked))
    return out

@api_router.get("/classes/{class_id}")
async def get_class(class_id: str):
    c = await db.classes.find_one({"id": class_id, "status": "active"}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Cours introuvable")
    p = await db.intervenants.find_one({"id": c.get("intervenant_id", "")}, {"_id": 0})
    name = f"{p.get('first_name','')} {p.get('last_name','')}".strip() if p else ""
    booked = await _count_active_bookings(class_id)
    return _public_class(c, name, booked)

@api_router.post("/classes/{class_id}/book")
async def book_class(class_id: str, data: BookingIn):
    c = await db.classes.find_one({"id": class_id, "status": "active"}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Cours introuvable")
    if not (data.email or data.phone):
        raise HTTPException(status_code=400, detail="Téléphone ou email requis")
    booked = await _count_active_bookings(class_id)
    if booked >= int(c.get("capacity", 0)):
        raise HTTPException(status_code=400, detail="Cours complet")
    doc = {
        "id": str(uuid.uuid4()),
        "class_id": class_id,
        "user_id": None,
        "name": data.name,
        "email": (data.email or "").strip(),
        "phone": (data.phone or "").strip(),
        "status": "reserved",
        "payment_status": "free",
        "created_at": now_utc().isoformat(),
    }
    await db.bookings.insert_one(doc)
    return {"id": doc["id"], "status": "reserved", "class_id": class_id}

@api_router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str):
    res = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": "cancelled", "cancelled_at": now_utc().isoformat()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    return {"ok": True}

# =============================================================================
# MODULE 2: Bibliothèque vidéos APA (priorité vidéos sur chaise)
# =============================================================================
VIDEO_CATEGORIES = {"exercices_sur_chaise", "mobilite", "renforcement_doux",
                    "respiration", "equilibre", "relaxation", "autre"}
VIDEO_LEVELS = {"debutant", "intermediaire", "avance"}
VIDEO_ACCESS = {"free", "premium", "private"}

class VideoIn(BaseModel):
    title: str
    description: str = ""
    video_url: str
    category: str = "exercices_sur_chaise"
    video_type: str = ""  # libre: ex "exercice", "demo", "cours"
    adapted_chair_video: bool = True
    level: str = "debutant"
    target_public: List[str] = []
    duration_minutes: int = 10
    access_level: str = "free"

def _public_video(v: dict, intervenant_name: str = "") -> dict:
    return {
        "id": v["id"],
        "title": v.get("title", ""),
        "description": v.get("description", ""),
        "video_url": v.get("video_url", ""),
        "category": v.get("category", ""),
        "video_type": v.get("video_type", ""),
        "adapted_chair_video": bool(v.get("adapted_chair_video", False)),
        "level": v.get("level", "debutant"),
        "target_public": v.get("target_public", []) or [],
        "duration_minutes": v.get("duration_minutes", 0),
        "access_level": v.get("access_level", "free"),
        "intervenant_id": v.get("intervenant_id", ""),
        "intervenant_name": intervenant_name,
        "status": v.get("status", "active"),
        "created_at": v.get("created_at", ""),
    }

@api_router.post("/intervenants/me/videos")
async def create_video(data: VideoIn, user: dict = Depends(require_intervenant)):
    if data.category not in VIDEO_CATEGORIES:
        raise HTTPException(status_code=400, detail="Catégorie invalide")
    if data.level not in VIDEO_LEVELS:
        raise HTTPException(status_code=400, detail="Niveau invalide")
    if data.access_level not in VIDEO_ACCESS:
        raise HTTPException(status_code=400, detail="Accès invalide")
    profile = await _get_my_intervenant(user)
    doc = {
        "id": str(uuid.uuid4()),
        "intervenant_id": profile["id"],
        **data.model_dump(),
        "status": "active",
        "created_at": now_utc().isoformat(),
    }
    await db.videos.insert_one(doc)
    return _public_video(doc, f"{profile.get('first_name','')} {profile.get('last_name','')}".strip())

@api_router.get("/intervenants/me/videos")
async def list_my_videos(user: dict = Depends(require_intervenant)):
    profile = await _get_my_intervenant(user)
    cursor = db.videos.find({"intervenant_id": profile["id"]}, {"_id": 0}).sort("created_at", -1)
    name = f"{profile.get('first_name','')} {profile.get('last_name','')}".strip()
    return [_public_video(v, name) async for v in cursor]

@api_router.put("/intervenants/me/videos/{video_id}")
async def update_my_video(video_id: str, data: VideoIn, user: dict = Depends(require_intervenant)):
    profile = await _get_my_intervenant(user)
    if data.category not in VIDEO_CATEGORIES:
        raise HTTPException(status_code=400, detail="Catégorie invalide")
    res = await db.videos.update_one(
        {"id": video_id, "intervenant_id": profile["id"]},
        {"$set": {**data.model_dump(), "updated_at": now_utc().isoformat()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vidéo introuvable")
    v = await db.videos.find_one({"id": video_id}, {"_id": 0})
    return _public_video(v, f"{profile.get('first_name','')} {profile.get('last_name','')}".strip())

@api_router.patch("/intervenants/me/videos/{video_id}/status")
async def toggle_my_video_status(video_id: str, data: StatusToggleIn, user: dict = Depends(require_intervenant)):
    if data.status not in {"active", "inactive"}:
        raise HTTPException(status_code=400, detail="Statut invalide")
    profile = await _get_my_intervenant(user)
    res = await db.videos.update_one(
        {"id": video_id, "intervenant_id": profile["id"]},
        {"$set": {"status": data.status}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vidéo introuvable")
    return {"ok": True, "status": data.status}

@api_router.get("/videos")
async def list_videos(
    chair: bool = False,
    category: Optional[str] = None,
    level: Optional[str] = None,
):
    query: Dict[str, Any] = {"status": "active", "access_level": {"$in": ["free", "premium"]}}
    if chair:
        query["adapted_chair_video"] = True
    if category and category in VIDEO_CATEGORIES:
        query["category"] = category
    if level and level in VIDEO_LEVELS:
        query["level"] = level
    cursor = db.videos.find(query, {"_id": 0}).sort([("adapted_chair_video", -1), ("created_at", -1)])
    out = []
    intervenant_cache: Dict[str, str] = {}
    async for v in cursor:
        iid = v.get("intervenant_id", "")
        if iid not in intervenant_cache:
            p = await db.intervenants.find_one({"id": iid}, {"_id": 0, "first_name": 1, "last_name": 1})
            intervenant_cache[iid] = (f"{p.get('first_name','')} {p.get('last_name','')}".strip()
                                       if p else "")
        out.append(_public_video(v, intervenant_cache[iid]))
    return out

# =============================================================================
# MODULE 3: Structures locales (associations, MSS, résidences seniors, …)
# =============================================================================
STRUCTURE_TYPES = {"association", "maison_sport_sante", "residence_senior",
                   "mairie", "club", "centre_social", "autre"}

class StructureIn(BaseModel):
    name: str
    type: str = "association"
    city: str
    address: str = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    website: Optional[str] = ""
    description: str = ""
    accessibility_info: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None

def _public_structure(s: dict) -> dict:
    return {
        "id": s["id"],
        "name": s.get("name", ""),
        "type": s.get("type", "association"),
        "city": s.get("city", ""),
        "address": s.get("address", ""),
        "phone": s.get("phone", "") or "",
        "email": s.get("email", "") or "",
        "website": s.get("website", "") or "",
        "description": s.get("description", "") or "",
        "accessibility_info": s.get("accessibility_info", "") or "",
        "lat": s.get("lat"),
        "lng": s.get("lng"),
        "status": s.get("status", "active"),
        "created_at": s.get("created_at", ""),
    }

@api_router.post("/admin/structures")
async def admin_create_structure(data: StructureIn, _: dict = Depends(require_admin)):
    if data.type not in STRUCTURE_TYPES:
        raise HTTPException(status_code=400, detail="Type invalide")
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "active",
        "created_at": now_utc().isoformat(),
    }
    await db.structures.insert_one(doc)
    return _public_structure(doc)

@api_router.put("/admin/structures/{structure_id}")
async def admin_update_structure(structure_id: str, data: StructureIn, _: dict = Depends(require_admin)):
    if data.type not in STRUCTURE_TYPES:
        raise HTTPException(status_code=400, detail="Type invalide")
    res = await db.structures.update_one(
        {"id": structure_id},
        {"$set": {**data.model_dump(), "updated_at": now_utc().isoformat()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Structure introuvable")
    s = await db.structures.find_one({"id": structure_id}, {"_id": 0})
    # propage le nouveau nom aux cours liés
    await db.classes.update_many({"structure_id": structure_id}, {"$set": {"structure_name": s.get("name", "")}})
    return _public_structure(s)

@api_router.patch("/admin/structures/{structure_id}/status")
async def admin_toggle_structure_status(structure_id: str, data: StatusToggleIn, _: dict = Depends(require_admin)):
    if data.status not in {"active", "inactive"}:
        raise HTTPException(status_code=400, detail="Statut invalide")
    res = await db.structures.update_one({"id": structure_id}, {"$set": {"status": data.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Structure introuvable")
    return {"ok": True, "status": data.status}

@api_router.get("/admin/structures")
async def admin_list_structures(_: dict = Depends(require_admin)):
    cursor = db.structures.find({}, {"_id": 0}).sort([("city", 1), ("name", 1)])
    return [_public_structure(s) async for s in cursor]

@api_router.get("/structures")
async def list_structures(city: Optional[str] = None, type: Optional[str] = None):
    query: Dict[str, Any] = {"status": "active"}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if type and type in STRUCTURE_TYPES:
        query["type"] = type
    cursor = db.structures.find(query, {"_id": 0}).sort([("city", 1), ("name", 1)])
    return [_public_structure(s) async for s in cursor]

@api_router.get("/structures/{structure_id}")
async def get_structure(structure_id: str):
    s = await db.structures.find_one({"id": structure_id, "status": "active"}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Structure introuvable")
    return _public_structure(s)

@api_router.get("/structures/{structure_id}/classes")
async def list_structure_classes(structure_id: str):
    cursor = db.classes.find({"structure_id": structure_id, "status": "active"}, {"_id": 0}).sort(
        [("adapted_chair_class", -1), ("date", 1)]
    )
    out = []
    intervenant_cache: Dict[str, str] = {}
    async for c in cursor:
        if c.get("date") and c["date"] < today_iso():
            continue
        iid = c.get("intervenant_id", "")
        if iid not in intervenant_cache:
            p = await db.intervenants.find_one({"id": iid}, {"_id": 0, "first_name": 1, "last_name": 1})
            intervenant_cache[iid] = (f"{p.get('first_name','')} {p.get('last_name','')}".strip()
                                       if p else "")
        booked = await _count_active_bookings(c["id"])
        out.append(_public_class(c, intervenant_cache[iid], booked))
    return out

@api_router.get("/")
async def root():
    return {"app": "APA Connect", "ok": True}


@api_router.get("/health", tags=["operations"])
async def health():
    """Readiness check used by the hosting platform.

    The response deliberately exposes no database address, credentials or
    internal exception details.
    """
    try:
        await db.command("ping")
    except Exception:
        logger.warning("Database health check failed")
        raise HTTPException(status_code=503, detail="Service temporairement indisponible")
    return {"status": "ok", "database": "connected"}

# ---------- Seed ----------
async def seed_admin():
    if not settings.enable_admin_seed:
        return
    email = settings.admin_email
    password = settings.admin_password
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password(password),
            "role": "admin",
            "created_at": now_utc().isoformat(),
        })
        logger.info(f"Admin seeded: {email}")
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})
        logger.info("Admin password updated")

async def seed_fake_intervenants():
    if not settings.enable_demo_seed:
        return
    if await db.intervenants.count_documents({"seed": True}) > 0:
        return
    rouen_base = [
        ("Sophie", "Martin", "Rouen", 49.4432, 1.0993,
         "Licence STAPS APA-S", True, ["Seniors", "Maladies chroniques"],
         ["domicile", "cabinet"], "Rouen Centre + 10km",
         "Spécialiste APA pour seniors et prévention des chutes."),
        ("Lucas", "Bernard", "Bois-Guillaume", 49.4697, 1.1161,
         "Master APA", True, ["Seniors", "Réhabilitation cardiaque"],
         ["domicile", "exterieur"], "Agglo Rouen Nord",
         "Coach APA passionné par la réhabilitation cardiaque."),
        ("Camille", "Dubois", "Sotteville-lès-Rouen", 49.4090, 1.0942,
         "Licence STAPS APA-S", False, ["Seniors", "Oncologie"],
         ["domicile", "salle"], "Sud de Rouen",
         "Accompagnement APA post-oncologie et mobilité douce."),
        ("Julien", "Petit", "Mont-Saint-Aignan", 49.4650, 1.0820,
         "Master APA-S", True, ["Adultes", "Diabète", "Obésité"],
         ["cabinet", "salle"], "Mont-Saint-Aignan et environs",
         "Reprise d'activité physique adaptée aux pathologies métaboliques."),
        ("Emma", "Leroy", "Grand-Quevilly", 49.4037, 1.0584,
         "Licence APA-S", True, ["Seniors", "Parkinson", "Alzheimer"],
         ["domicile"], "Rouen Sud et Ouest",
         "Interventions à domicile pour publics fragiles."),
    ]
    # availability for this week
    week = monday_of_week()
    base = datetime.fromisoformat(week).date()
    def av_for(i: int) -> Dict[str, Dict[str, bool]]:
        """Different patterns per intervenant index."""
        patterns = [
            {0: (True, True), 1: (True, False), 2: (False, True), 4: (True, True)},       # Sophie
            {0: (True, False), 2: (True, True), 3: (True, False), 4: (False, True)},      # Lucas
            {1: (True, True), 3: (True, True)},                                           # Camille
            {0: (False, True), 1: (True, True), 2: (True, False), 3: (True, True)},       # Julien
            {0: (True, True), 1: (False, True), 2: (True, True), 3: (False, True), 4: (True, False)},  # Emma
        ]
        pat = patterns[i]
        out = {}
        for day_idx, (m, a) in pat.items():
            d = (base + timedelta(days=day_idx)).isoformat()
            out[d] = {"morning": m, "afternoon": a}
        return out

    # ensure at least one intervenant is available TODAY
    today_wd = now_utc().weekday()
    for i, (fn, ln, city, lat, lng, dip, verified, pubs, places, zone, bio) in enumerate(rouen_base):
        av = av_for(i)
        if i == 0:  # force today availability for Sophie
            av[today_iso()] = {"morning": True, "afternoon": True}
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": None,
            "first_name": fn,
            "last_name": ln,
            "city": city,
            "zone": zone,
            "diploma": dip,
            "diploma_verified": verified,
            "publics": pubs,
            "intervention_places": places,
            "availability": av,
            "availability_week": week,
            "availability_confirmed_at": now_utc().isoformat(),
            "last_availability_update": now_utc().isoformat(),
            "hidden": False,
            "phone": "",
            "bio": bio,
            "lat": lat,
            "lng": lng,
            "created_at": now_utc().isoformat(),
            "seed": True,
            "data_scope": "demo",
        }
        await db.intervenants.insert_one(doc)
    logger.info("Seeded 5 fake intervenants around Rouen")

@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.intervenants.create_index("city")
    await db.intervenants.create_index("id", unique=True)
    await db.callbacks.create_index("created_at")
    await db.classes.create_index("intervenant_id")
    await db.classes.create_index("date")
    await db.classes.create_index("structure_id")
    await db.bookings.create_index("class_id")
    await db.videos.create_index("intervenant_id")
    await db.structures.create_index("city")
    await seed_admin()
    await seed_fake_intervenants()

@app.on_event("shutdown")
async def on_shutdown():
    client.close()

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=list(settings.cors_allowed_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)
