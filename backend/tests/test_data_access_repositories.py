import asyncio

from backend.data_access.mongo_repository import MongoAccountProfileRepository
from backend.data_access.records import PractitionerRecord, UserRecord
from backend.data_access.sql_repository import SqlAccountProfileRepository
from backend.relational.base import Base
from backend.relational.database import RelationalDatabase


class FakeCollection:
    def __init__(self):
        self.documents = {}

    async def find_one(self, query, projection=None):
        for document in self.documents.values():
            if all(document.get(key) == value for key, value in query.items()):
                return dict(document)
        return None

    async def update_one(self, query, update, upsert=False):
        document = await self.find_one(query)
        if document is None:
            assert upsert is True
            document = dict(query)
        document.update(update["$set"])
        self.documents[document["id"]] = document

    def find(self, query, projection=None):
        return FakeCursor(list(self.documents.values()))


class FakeCursor:
    def __init__(self, documents):
        self.documents = iter(documents)

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            return next(self.documents)
        except StopIteration as error:
            raise StopAsyncIteration from error


class FakeMongoDatabase:
    def __init__(self):
        self.users = FakeCollection()
        self.intervenants = FakeCollection()


def sample_user():
    return UserRecord(
        id="user-1",
        email="Pro@Example.test",
        password_hash="hash-only",
        role="intervenant",
    )


def sample_practitioner():
    return PractitionerRecord(
        id="practitioner-1",
        user_id="user-1",
        first_name="Ada",
        last_name="Martin",
        city="Rouen",
        zone="Rouen et alentours",
        diploma="Licence STAPS APA-S",
        diploma_verified=True,
        publication_status="published",
        attributes={
            "audience": ["Seniors"],
            "modality": ["domicile", "structure"],
        },
    )


def test_mongo_repository_round_trip_uses_canonical_records():
    async def scenario():
        repository = MongoAccountProfileRepository(FakeMongoDatabase())
        await repository.save_user(sample_user())
        await repository.save_practitioner(sample_practitioner())

        user = await repository.get_user_by_email("PRO@example.test")
        practitioner = await repository.get_practitioner_by_user_id("user-1")

        assert user == UserRecord(
            id="user-1",
            email="pro@example.test",
            password_hash="hash-only",
            role="intervenant",
        )
        assert practitioner == sample_practitioner()
        assert await repository.list_user_ids() == ["user-1"]
        assert await repository.list_practitioner_ids() == ["practitioner-1"]

    asyncio.run(scenario())


def test_sql_repository_round_trip_is_idempotent(tmp_path):
    database = RelationalDatabase(
        f"sqlite+pysqlite:///{(tmp_path / 'repository.db').as_posix()}"
    )
    Base.metadata.create_all(database.engine)

    async def scenario():
        repository = SqlAccountProfileRepository(database)
        await repository.save_user(sample_user())
        await repository.save_user(sample_user())
        await repository.save_practitioner(sample_practitioner())
        await repository.save_practitioner(sample_practitioner())

        user = await repository.get_user_by_id("user-1")
        practitioner = await repository.get_practitioner_by_id("practitioner-1")

        assert user is not None
        assert user.email == "pro@example.test"
        assert user.password_hash == "hash-only"
        assert practitioner == sample_practitioner()
        assert await repository.list_user_ids() == ["user-1"]
        assert await repository.list_practitioner_ids() == ["practitioner-1"]

    try:
        asyncio.run(scenario())
    finally:
        database.dispose()
