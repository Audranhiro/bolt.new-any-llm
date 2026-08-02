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


def load_server(monkeypatch):
    for name, value in BASE_ENV.items():
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
