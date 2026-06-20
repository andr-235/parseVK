import os
import subprocess
import sys
from pathlib import Path

import pytest
from sqlalchemy.engine import make_url

SERVICE_ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="session")
def postgres_url() -> str:
    value = os.getenv("CONTENT_TEST_DATABASE_URL")
    if not value:
        pytest.skip("CONTENT_TEST_DATABASE_URL is not configured")
    database = make_url(value).database or ""
    if "test" not in database.lower():
        pytest.fail("CONTENT_TEST_DATABASE_URL must point to a database containing 'test'")
    return value


@pytest.fixture(scope="session")
def alembic_env(postgres_url: str) -> dict[str, str]:
    env = os.environ.copy()
    env["CONTENT_DATABASE_URL"] = postgres_url
    return env


@pytest.fixture(scope="session")
def run_alembic(alembic_env):
    def run(*arguments: str, check: bool = True):
        return subprocess.run(  # noqa: S603
            [sys.executable, "-m", "alembic", *arguments],
            cwd=SERVICE_ROOT,
            env=alembic_env,
            check=check,
            capture_output=True,
            text=True,
        )

    return run


@pytest.fixture(scope="session")
def migrated_postgres(run_alembic) -> None:
    run_alembic("downgrade", "base")
    run_alembic("upgrade", "head")
