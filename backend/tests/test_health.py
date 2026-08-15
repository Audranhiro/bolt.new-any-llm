import asyncio
import importlib
import sys

import pytest
from fastapi import HTTPException

BASE_ENV = {
    "APP_ENV": "test",
    "JWT_SECRET": "test-secret",
    "MONGO_URL": "mongodb://localhost:27017",
    "DB_NAME": "apa_connect_health_test",
    "CORS_ALLOWED_ORIGINS": "http://localhost:3000",
}


def load_server(monkeypatch, extra_env=None):
    for name, value in BASE_ENV.items():
        monkeypatch.setenv(name, value)
    monkeypatch.delenv("SQL_BACKEND_ENABLED", raising=False)
    monkeypatch.delenv("SQL_DATABASE_URL", raising=False)
    for name, value in (extra_env or {}).items():
        monkeypatch.setenv(name, value)
    sys.modules.pop("backend.server", None)
    return importlib.import_module("backend.server")


class HealthyDatabase:
    async def command(self, name):
        assert name == "ping"
        return {"ok": 1}


class UnavailableDatabase:
    async def command(self, name):
        raise RuntimeError("connection details must not be exposed")


class HealthyRelationalDatabase:
    def __init__(self):
        self.ping_called = False

    def ping(self):
        self.ping_called = True


class UnavailableRelationalDatabase:
    def ping(self):
        raise RuntimeError("sql connection details must not be exposed")


def test_health_reports_ready_without_internal_details(monkeypatch):
    server = load_server(monkeypatch)
    monkeypatch.setattr(server, "db", HealthyDatabase())

    result = asyncio.run(server.health())

    assert result == {"status": "ok", "database": "connected"}


def test_health_returns_generic_503_when_database_is_unavailable(monkeypatch):
    server = load_server(monkeypatch)
    monkeypatch.setattr(server, "db", UnavailableDatabase())

    with pytest.raises(HTTPException) as error:
        asyncio.run(server.health())

    assert error.value.status_code == 503
    assert error.value.detail == "Service temporairement indisponible"
    assert "connection details" not in error.value.detail


def test_health_checks_relational_database_when_enabled(monkeypatch):
    server = load_server(
        monkeypatch,
        {
            "SQL_BACKEND_ENABLED": "true",
            "SQL_DATABASE_URL": "sqlite+pysqlite:///:memory:",
        },
    )
    relational = HealthyRelationalDatabase()
    monkeypatch.setattr(server, "db", HealthyDatabase())
    monkeypatch.setattr(server, "sql_database", relational)

    result = asyncio.run(server.health())

    assert result == {"status": "ok", "database": "connected"}
    assert relational.ping_called is True


def test_health_hides_relational_database_failure_details(monkeypatch):
    server = load_server(
        monkeypatch,
        {
            "SQL_BACKEND_ENABLED": "true",
            "SQL_DATABASE_URL": "sqlite+pysqlite:///:memory:",
        },
    )
    monkeypatch.setattr(server, "db", HealthyDatabase())
    monkeypatch.setattr(server, "sql_database", UnavailableRelationalDatabase())

    with pytest.raises(HTTPException) as error:
        asyncio.run(server.health())

    assert error.value.status_code == 503
    assert error.value.detail == "Service temporairement indisponible"
    assert "sql connection details" not in error.value.detail
