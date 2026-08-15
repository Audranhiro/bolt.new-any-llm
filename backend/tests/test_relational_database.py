import pytest
from sqlalchemy import text

from backend.relational.database import RelationalDatabase


def test_relational_database_ping_and_transaction_commit():
    database = RelationalDatabase("sqlite+pysqlite:///:memory:")
    try:
        database.ping()
        with database.session() as session:
            session.execute(text("CREATE TABLE example (id INTEGER PRIMARY KEY)"))
            session.execute(text("INSERT INTO example (id) VALUES (1)"))
        with database.session() as session:
            count = session.execute(text("SELECT COUNT(*) FROM example")).scalar_one()
        assert count == 1
    finally:
        database.dispose()


def test_relational_database_rolls_back_failed_transaction():
    database = RelationalDatabase("sqlite+pysqlite:///:memory:")
    try:
        with database.session() as session:
            session.execute(text("CREATE TABLE example (id INTEGER PRIMARY KEY)"))
        with pytest.raises(Exception):
            with database.session() as session:
                session.execute(text("INSERT INTO example (id) VALUES (1)"))
                session.execute(text("INSERT INTO example (id) VALUES (1)"))
        with database.session() as session:
            count = session.execute(text("SELECT COUNT(*) FROM example")).scalar_one()
        assert count == 0
    finally:
        database.dispose()
