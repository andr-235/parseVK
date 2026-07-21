import sys
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

_service_root = Path(__file__).resolve().parent.parent
if str(_service_root) not in sys.path:
    sys.path.insert(0, str(_service_root))


@pytest.fixture
def anyio_backend():
    return "asyncio"


class MockScalarResult:
    def __init__(self, data: list | None = None):
        self._data = data or []

    def all(self):
        return self._data

    def first(self):
        return self._data[0] if self._data else None


class MockResult:
    def __init__(self, scalar_one_return=None, scalar_one_or_none_return=None, rowcount: int = 0):
        self._scalar_one_return = scalar_one_return
        self._scalar_one_or_none_return = scalar_one_or_none_return
        self.rowcount = rowcount

    def scalar_one(self):
        return self._scalar_one_return

    def scalar_one_or_none(self):
        return self._scalar_one_or_none_return

    def scalar(self):
        return self._scalar_one_or_none_return


@pytest.fixture
def mock_db_session():
    session = AsyncMock()
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=None)

    session.scalars.return_value = MockScalarResult()
    session.scalar.return_value = None
    session.execute.return_value = MockResult(scalar_one_or_none_return=None, rowcount=0)

    return session
