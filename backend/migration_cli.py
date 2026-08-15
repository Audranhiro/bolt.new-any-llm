"""Commande manuelle et strictement read-only de comparaison Mongo/PostgreSQL."""

import asyncio
import json
import os

from motor.motor_asyncio import AsyncIOMotorClient

from backend.data_access.migration import AccountProfileMigrationPlanner
from backend.data_access.mongo_repository import MongoAccountProfileRepository
from backend.data_access.sql_repository import SqlAccountProfileRepository
from backend.relational.database import RelationalDatabase


def required_environment(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"La variable {name} est obligatoire.")
    return value


async def build_report() -> dict:
    mongo_client = AsyncIOMotorClient(required_environment("MONGO_URL"))
    sql_database = RelationalDatabase(required_environment("SQL_DATABASE_URL"))
    try:
        source = MongoAccountProfileRepository(
            mongo_client[required_environment("DB_NAME")]
        )
        destination = SqlAccountProfileRepository(sql_database)
        report = await AccountProfileMigrationPlanner(source, destination).plan()
        return report.as_safe_dict()
    finally:
        mongo_client.close()
        sql_database.dispose()


def main() -> None:
    print(json.dumps(asyncio.run(build_report()), ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
