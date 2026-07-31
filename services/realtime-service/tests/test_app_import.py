import importlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()


def test_application_module_imports() -> None:
    """The production ASGI module must import with installed dependencies."""
    module = importlib.import_module("app.main")

    assert module.app is not None
