import os
from dataclasses import dataclass
from typing import Mapping, Optional, Tuple


TRUE_VALUES = {"1", "true", "yes", "on"}
FALSE_VALUES = {"0", "false", "no", "off"}


def _required(env: Mapping[str, str], name: str) -> str:
    value = env.get(name, "").strip()
    if not value:
        raise RuntimeError(f"La variable {name} est obligatoire.")
    return value


def _boolean(env: Mapping[str, str], name: str, default: bool) -> bool:
    raw = env.get(name)
    if raw is None or not raw.strip():
        return default
    value = raw.strip().lower()
    if value in TRUE_VALUES:
        return True
    if value in FALSE_VALUES:
        return False
    raise RuntimeError(f"La variable {name} doit être un booléen.")


def _origins(env: Mapping[str, str], production: bool) -> Tuple[str, ...]:
    raw = env.get("CORS_ALLOWED_ORIGINS", "").strip()
    if not raw and not production:
        raw = "http://localhost:3000,http://127.0.0.1:3000"
    origins = tuple(value.strip().rstrip("/") for value in raw.split(",") if value.strip())
    if not origins:
        raise RuntimeError("CORS_ALLOWED_ORIGINS doit contenir au moins une origine.")
    if "*" in origins:
        raise RuntimeError("CORS_ALLOWED_ORIGINS ne peut pas contenir '*'.")
    return origins


@dataclass(frozen=True)
class Settings:
    environment: str
    jwt_secret: str
    mongo_url: str
    db_name: str
    cors_allowed_origins: Tuple[str, ...]
    cookie_secure: bool
    cookie_samesite: str
    enable_admin_seed: bool
    admin_email: Optional[str]
    admin_password: Optional[str]
    enable_demo_seed: bool

    @property
    def production(self) -> bool:
        return self.environment == "production"

    @classmethod
    def from_env(cls, env: Optional[Mapping[str, str]] = None) -> "Settings":
        values = os.environ if env is None else env
        environment = values.get("APP_ENV", "development").strip().lower()
        if environment not in {"development", "test", "production"}:
            raise RuntimeError("APP_ENV doit valoir development, test ou production.")
        production = environment == "production"

        jwt_secret = _required(values, "JWT_SECRET")
        if production and len(jwt_secret) < 32:
            raise RuntimeError("JWT_SECRET doit contenir au moins 32 caractères en production.")

        cookie_samesite = values.get(
            "COOKIE_SAMESITE", "none" if production else "lax"
        ).strip().lower()
        if cookie_samesite not in {"lax", "strict", "none"}:
            raise RuntimeError("COOKIE_SAMESITE doit valoir lax, strict ou none.")
        cookie_secure = _boolean(values, "COOKIE_SECURE", production)
        if cookie_samesite == "none" and not cookie_secure:
            raise RuntimeError("COOKIE_SECURE doit être activé avec COOKIE_SAMESITE=none.")

        enable_admin_seed = _boolean(values, "ENABLE_ADMIN_SEED", False)
        admin_email = values.get("ADMIN_EMAIL", "").strip() or None
        admin_password = values.get("ADMIN_PASSWORD", "").strip() or None
        if enable_admin_seed:
            if not admin_email or not admin_password:
                raise RuntimeError(
                    "ADMIN_EMAIL et ADMIN_PASSWORD sont obligatoires avec ENABLE_ADMIN_SEED=true."
                )
            if len(admin_password) < 12:
                raise RuntimeError("ADMIN_PASSWORD doit contenir au moins 12 caractères.")

        enable_demo_seed = _boolean(values, "ENABLE_DEMO_SEED", False)
        if production and enable_demo_seed:
            raise RuntimeError(
                "ENABLE_DEMO_SEED ne peut pas être activé dans la base de production."
            )

        return cls(
            environment=environment,
            jwt_secret=jwt_secret,
            mongo_url=_required(values, "MONGO_URL"),
            db_name=_required(values, "DB_NAME"),
            cors_allowed_origins=_origins(values, production),
            cookie_secure=cookie_secure,
            cookie_samesite=cookie_samesite,
            enable_admin_seed=enable_admin_seed,
            admin_email=admin_email,
            admin_password=admin_password,
            enable_demo_seed=enable_demo_seed,
        )
