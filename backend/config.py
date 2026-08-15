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
    origins = tuple(
        value.strip().rstrip("/") for value in raw.split(",") if value.strip()
    )
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
    sql_backend_enabled: bool
    sql_database_url: Optional[str]
    email_delivery_enabled: bool
    smtp_host: Optional[str]
    smtp_port: int
    smtp_username: Optional[str]
    smtp_password: Optional[str]
    smtp_from_email: Optional[str]
    smtp_use_tls: bool
    frontend_url: str
    password_reset_ttl_minutes: int

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
            raise RuntimeError(
                "JWT_SECRET doit contenir au moins 32 caractères en production."
            )

        cookie_samesite = (
            values.get("COOKIE_SAMESITE", "none" if production else "lax")
            .strip()
            .lower()
        )
        if cookie_samesite not in {"lax", "strict", "none"}:
            raise RuntimeError("COOKIE_SAMESITE doit valoir lax, strict ou none.")
        cookie_secure = _boolean(values, "COOKIE_SECURE", production)
        if cookie_samesite == "none" and not cookie_secure:
            raise RuntimeError(
                "COOKIE_SECURE doit être activé avec COOKIE_SAMESITE=none."
            )

        enable_admin_seed = _boolean(values, "ENABLE_ADMIN_SEED", False)
        admin_email = values.get("ADMIN_EMAIL", "").strip() or None
        admin_password = values.get("ADMIN_PASSWORD", "").strip() or None
        if enable_admin_seed:
            if not admin_email or not admin_password:
                raise RuntimeError(
                    "ADMIN_EMAIL et ADMIN_PASSWORD sont obligatoires avec ENABLE_ADMIN_SEED=true."
                )
            if len(admin_password) < 12:
                raise RuntimeError(
                    "ADMIN_PASSWORD doit contenir au moins 12 caractères."
                )

        enable_demo_seed = _boolean(values, "ENABLE_DEMO_SEED", False)
        if production and enable_demo_seed:
            raise RuntimeError(
                "ENABLE_DEMO_SEED ne peut pas être activé dans la base de production."
            )

        sql_backend_enabled = _boolean(values, "SQL_BACKEND_ENABLED", False)
        sql_database_url = values.get("SQL_DATABASE_URL", "").strip() or None
        if sql_backend_enabled and not sql_database_url:
            raise RuntimeError(
                "SQL_DATABASE_URL est obligatoire avec SQL_BACKEND_ENABLED=true."
            )
        if (
            production
            and sql_database_url
            and not sql_database_url.startswith(
                ("postgresql://", "postgresql+psycopg://")
            )
        ):
            raise RuntimeError(
                "SQL_DATABASE_URL doit utiliser PostgreSQL en production."
            )

        email_delivery_enabled = _boolean(values, "EMAIL_DELIVERY_ENABLED", False)
        smtp_host = values.get("SMTP_HOST", "").strip() or None
        smtp_username = values.get("SMTP_USERNAME", "").strip() or None
        smtp_password = values.get("SMTP_PASSWORD", "").strip() or None
        smtp_from_email = values.get("SMTP_FROM_EMAIL", "").strip() or None
        try:
            smtp_port = int(values.get("SMTP_PORT", "587"))
            password_reset_ttl_minutes = int(
                values.get("PASSWORD_RESET_TTL_MINUTES", "30")
            )
        except ValueError as error:
            raise RuntimeError(
                "SMTP_PORT et PASSWORD_RESET_TTL_MINUTES doivent etre des entiers."
            ) from error
        if not 1 <= smtp_port <= 65535:
            raise RuntimeError("SMTP_PORT doit etre compris entre 1 et 65535.")
        if not 5 <= password_reset_ttl_minutes <= 120:
            raise RuntimeError(
                "PASSWORD_RESET_TTL_MINUTES doit etre compris entre 5 et 120."
            )
        if bool(smtp_username) != bool(smtp_password):
            raise RuntimeError(
                "SMTP_USERNAME et SMTP_PASSWORD doivent etre definis ensemble."
            )
        if email_delivery_enabled and (not smtp_host or not smtp_from_email):
            raise RuntimeError(
                "SMTP_HOST et SMTP_FROM_EMAIL sont obligatoires avec "
                "EMAIL_DELIVERY_ENABLED=true."
            )
        default_frontend_url = (
            "https://apaconnect.fr" if production else "http://localhost:3000"
        )
        frontend_url = values.get("FRONTEND_URL", default_frontend_url).strip()
        if not frontend_url.startswith(("http://", "https://")):
            raise RuntimeError("FRONTEND_URL doit etre une URL HTTP ou HTTPS.")
        if production and not frontend_url.startswith("https://"):
            raise RuntimeError("FRONTEND_URL doit utiliser HTTPS en production.")

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
            sql_backend_enabled=sql_backend_enabled,
            sql_database_url=sql_database_url,
            email_delivery_enabled=email_delivery_enabled,
            smtp_host=smtp_host,
            smtp_port=smtp_port,
            smtp_username=smtp_username,
            smtp_password=smtp_password,
            smtp_from_email=smtp_from_email,
            smtp_use_tls=_boolean(values, "SMTP_USE_TLS", True),
            frontend_url=frontend_url.rstrip("/"),
            password_reset_ttl_minutes=password_reset_ttl_minutes,
        )
