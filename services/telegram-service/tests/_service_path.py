from __future__ import annotations

import sys
from inspect import stack
from pathlib import Path

_service_path_applied: bool = False
_service_path_root: str = ""


def use_service_path() -> None:
    global _service_path_applied, _service_path_root

    service_root = str(Path(stack()[1].filename).resolve().parents[1])

    if _service_path_applied:
        if service_root == _service_path_root:
            return
        raise RuntimeError(
            f"use_service_path() already initialized for {_service_path_root}, "
            f"cannot re-initialize for {service_root}. "
            "Run each service test suite in isolation."
        )

    sys.path.insert(0, service_root)
    libs_common = str(Path(service_root).parent.parent / "libs" / "py" / "common")
    if libs_common not in sys.path:
        sys.path.insert(0, libs_common)
    for module_name in list(sys.modules):
        if module_name == "app" or module_name.startswith("app."):
            del sys.modules[module_name]

    _service_path_root = service_root
    _service_path_applied = True
