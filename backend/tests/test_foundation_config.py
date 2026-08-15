import pytest

from backend.config import Settings

BASE_ENV = {
    "APP_ENV": "test",
    "JWT_SECRET": "test-secret",
    "MONGO_URL": "mongodb://localhost:27017",
    "DB_NAME": "apa_connect_test",
    "CORS_ALLOWED_ORIGINS": "http://localhost:3000",
}


def test_safe_defaults_disable_seeding():
    settings = Settings.from_env(BASE_ENV)

    assert settings.enable_admin_seed is False
    assert settings.enable_demo_seed is False
    assert settings.cookie_secure is False
    assert settings.cors_allowed_origins == ("http://localhost:3000",)
    assert settings.sql_backend_enabled is False
    assert settings.sql_database_url is None


def test_sql_backend_requires_database_url():
    env = {**BASE_ENV, "SQL_BACKEND_ENABLED": "true"}
    with pytest.raises(RuntimeError, match="SQL_DATABASE_URL"):
        Settings.from_env(env)


def test_production_sql_backend_requires_postgresql():
    env = {
        **BASE_ENV,
        "APP_ENV": "production",
        "JWT_SECRET": "x" * 32,
        "CORS_ALLOWED_ORIGINS": "https://apaconnect.fr",
        "SQL_BACKEND_ENABLED": "true",
        "SQL_DATABASE_URL": "sqlite:///apa-connect.db",
    }
    with pytest.raises(RuntimeError, match="PostgreSQL"):
        Settings.from_env(env)


def test_production_rejects_wildcard_cors():
    env = {
        **BASE_ENV,
        "APP_ENV": "production",
        "JWT_SECRET": "x" * 32,
        "CORS_ALLOWED_ORIGINS": "*",
    }

    with pytest.raises(RuntimeError, match="ne peut pas contenir"):
        Settings.from_env(env)


def test_production_rejects_demo_seed():
    env = {
        **BASE_ENV,
        "APP_ENV": "production",
        "JWT_SECRET": "x" * 32,
        "CORS_ALLOWED_ORIGINS": "https://apaconnect.fr",
        "ENABLE_DEMO_SEED": "true",
    }

    with pytest.raises(RuntimeError, match="base de production"):
        Settings.from_env(env)


def test_admin_seed_requires_explicit_strong_credentials():
    env = {**BASE_ENV, "ENABLE_ADMIN_SEED": "true"}
    with pytest.raises(RuntimeError, match="obligatoires"):
        Settings.from_env(env)

    weak = {
        **env,
        "ADMIN_EMAIL": "admin@example.test",
        "ADMIN_PASSWORD": "short",
    }
    with pytest.raises(RuntimeError, match="12 caractères"):
        Settings.from_env(weak)


def test_production_requires_long_jwt_secret():
    env = {
        **BASE_ENV,
        "APP_ENV": "production",
        "JWT_SECRET": "too-short",
        "CORS_ALLOWED_ORIGINS": "https://apaconnect.fr",
    }

    with pytest.raises(RuntimeError, match="32 caractères"):
        Settings.from_env(env)


def test_email_delivery_requires_smtp_configuration():
    env = {**BASE_ENV, "EMAIL_DELIVERY_ENABLED": "true"}
    with pytest.raises(RuntimeError, match="SMTP_HOST et SMTP_FROM_EMAIL"):
        Settings.from_env(env)


def test_password_reset_ttl_is_bounded():
    env = {**BASE_ENV, "PASSWORD_RESET_TTL_MINUTES": "2"}
    with pytest.raises(RuntimeError, match="compris entre 5 et 120"):
        Settings.from_env(env)


def test_production_frontend_url_requires_https():
    env = {
        **BASE_ENV,
        "APP_ENV": "production",
        "JWT_SECRET": "x" * 32,
        "CORS_ALLOWED_ORIGINS": "https://apaconnect.fr",
        "FRONTEND_URL": "http://apaconnect.fr",
    }
    with pytest.raises(RuntimeError, match="HTTPS"):
        Settings.from_env(env)
