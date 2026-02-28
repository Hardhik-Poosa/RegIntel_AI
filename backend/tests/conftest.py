"""
Shared fixtures for all tests.

Uses an in-memory SQLite database (via aiosqlite) so tests never touch
the real PostgreSQL instance.  StaticPool keeps the same underlying
connection alive for the entire session, which is required for SQLite
in-memory databases.

Because endpoints call session.commit() (making data permanent in the
shared in-memory DB), each test that needs a user gets a *unique* email
via uuid4 so fixtures never collide across test functions.
"""

import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import get_db
from app.models.base import Base

# --------------------------------------------------------------------------- #
# Engine (session-scoped – one DB for the whole test run)
# --------------------------------------------------------------------------- #
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="session")
async def engine():
    """Create tables once; tear them down after all tests."""
    _engine = create_async_engine(
        TEST_DB_URL,
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield _engine

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


# --------------------------------------------------------------------------- #
# DB Session (function-scoped)
# --------------------------------------------------------------------------- #
@pytest_asyncio.fixture()
async def db_session(engine):
    """Function-scoped async session shared within one test."""
    factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with factory() as session:
        yield session


# --------------------------------------------------------------------------- #
# HTTP client (function-scoped)
# --------------------------------------------------------------------------- #
@pytest_asyncio.fixture()
async def client(db_session):
    """AsyncClient wired to the FastAPI app with the test DB injected."""

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# --------------------------------------------------------------------------- #
# Convenience fixtures – unique email per test to avoid duplicate collisions
# --------------------------------------------------------------------------- #
TEST_PASSWORD = "TestPass123!"


def _unique_payload() -> dict:
    """Return a register payload with a guaranteed-unique email."""
    return {
        "email": f"user-{uuid.uuid4().hex[:8]}@test.com",
        "password": TEST_PASSWORD,
        "organization": {"name": "ACME Corp", "industry": "Finance"},
    }


@pytest_asyncio.fixture()
async def registered_user(client):
    """Register a fresh user (unique email) and return the response JSON."""
    payload = _unique_payload()
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 200, resp.text
    # Attach the payload so auth_headers can read the credentials
    result = resp.json()
    result["_credentials"] = payload
    return result


@pytest_asyncio.fixture()
async def auth_headers(client, registered_user):
    """Return Bearer headers for the registered test user."""
    creds = registered_user["_credentials"]
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": creds["email"], "password": creds["password"]},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
