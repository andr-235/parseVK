import asyncio
import sys
from pathlib import Path
<<<<<<< HEAD
=======

>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path
<<<<<<< HEAD
=======

>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
use_service_path()


@pytest.fixture(scope="session")
def event_loop():
    """Create a session-scoped event loop to share across all tests."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()
