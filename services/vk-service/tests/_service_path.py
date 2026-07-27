import sys
from inspect import stack
from pathlib import Path

_initialized = False


def use_service_path() -> None:
    global _initialized
    caller_file = Path(stack()[1].filename).resolve()
    service_root = caller_file.parent
    while service_root.name != "":
        if (service_root / "app").is_dir() or (service_root / "pyproject.toml").is_file():
            break
        service_root = service_root.parent
    if str(service_root) not in sys.path:
        sys.path.insert(0, str(service_root))

    libs_common = str(service_root.parent.parent / "libs" / "py" / "common")
    if libs_common not in sys.path:
        sys.path.insert(0, libs_common)

    # Only clear sys.modules on the very first initialization (before tests start running)
    # to prevent breaking module identity and unittest.mock patches across test files.
    if not _initialized:
        for module_name in list(sys.modules):
            if module_name == "app" or module_name.startswith("app."):
                del sys.modules[module_name]
        _initialized = True
