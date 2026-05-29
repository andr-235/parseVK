#!/usr/bin/env python3
"""
parseVK Service Architecture Validator.

Usage:
    python validate-service.py services/{service-name}

Checks that a service follows the parseVK FastAPI architecture standard:
- Correct directory structure
- Three-tier separation (Router -> Service -> Repository)
- pydantic-settings usage
- Standard patterns (create_app, require_internal_token, etc.)
"""

import ast
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class CheckResult:
    passed: int = 0
    failed: int = 0
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def ok(self, msg: str) -> None:
        self.passed += 1
        print(f"  [OK] {msg}")

    def fail(self, msg: str) -> None:
        self.failed += 1
        self.errors.append(msg)
        print(f"  [FAIL] {msg}")

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)
        print(f"  [WARN] {msg}")


def check_directory_structure(service_path: Path, result: CheckResult) -> None:
    """Check that the service has the required directory structure."""
    required_dirs = [
        "app",
        "app/core",
        "app/db",
        "app/modules",
    ]
    for d in required_dirs:
        if (service_path / d).is_dir():
            result.ok(f"Directory '{d}' exists")
        else:
            result.fail(f"Directory '{d}' is missing")

    optional_dirs = ["alembic", "alembic/versions", "tests"]
    for d in optional_dirs:
        if (service_path / d).is_dir():
            result.ok(f"Directory '{d}' exists (optional)")


def check_required_files(service_path: Path, result: CheckResult) -> None:
    """Check that the service has all required files."""
    required_files = [
        "app/__init__.py",
        "app/main.py",
        "app/core/__init__.py",
        "app/core/config.py",
        "app/db/__init__.py",
        "app/db/base.py",
        "app/db/session.py",
        "Dockerfile",
        "pyproject.toml",
    ]
    for f in required_files:
        if (service_path / f).is_file():
            result.ok(f"File '{f}' exists")
        else:
            result.fail(f"File '{f}' is missing")
            result.warn("skip further checks for missing file")

    # Check at least one module has router
    modules_dir = service_path / "app" / "modules"
    if modules_dir.is_dir():
        has_router = any(
            (modules_dir / m / "router.py").is_file()
            for m in os.listdir(modules_dir)
            if (modules_dir / m).is_dir()
        )
        if has_router:
            result.ok("At least one module has router.py")
        else:
            result.fail("No module with router.py found")


def check_create_app_pattern(service_path: Path, result: CheckResult) -> None:
    """Check that main.py uses create_app() factory."""
    main_py = service_path / "app" / "main.py"
    if not main_py.is_file():
        result.fail("app/main.py not found, skipping create_app check")
        return

    content = main_py.read_text(encoding="utf-8")

    if "def create_app()" in content:
        result.ok("app/main.py has create_app() factory")
    else:
        result.fail("app/main.py is missing create_app() factory")

    if "app = create_app()" in content:
        result.ok("app/main.py has app = create_app() at module level")
    else:
        result.warn("app/main.py is missing 'app = create_app()' — check uvicorn target")

    if "/health" in content and "/ready" in content:
        result.ok("app/main.py has /health and /ready endpoints")
    else:
        result.warn("app/main.py is missing /health or /ready endpoints")


def check_pydantic_settings(service_path: Path, result: CheckResult) -> None:
    """Check that config uses pydantic-settings."""
    config_py = service_path / "app" / "core" / "config.py"
    if not config_py.is_file():
        result.fail("app/core/config.py not found")
        return

    content = config_py.read_text(encoding="utf-8")

    if "from pydantic_settings import" in content:
        result.ok("config.py uses pydantic_settings")
    else:
        result.fail("config.py does not import pydantic_settings")

    if "BaseSettings" in content:
        result.ok("config.py has a class inheriting from BaseSettings")
    else:
        result.fail("config.py is missing BaseSettings subclass")

    if "env_prefix" in content:
        result.ok("config.py defines env_prefix")
    else:
        result.warn("config.py is missing env_prefix")

    if "extra=\"ignore\"" in content or "extra='ignore'" in content:
        result.ok("config.py has extra='ignore'")
    else:
        result.warn("config.py is missing extra='ignore' — may pick up unrelated env vars")


def check_no_os_environ(service_path: Path, result: CheckResult) -> None:
    """Check that services don't use os.environ outside config."""
    app_dir = service_path / "app"
    for py_file in app_dir.rglob("*.py"):
        if "core/config.py" in str(py_file):
            continue  # skip config itself
        try:
            tree = ast.parse(py_file.read_text(encoding="utf-8"))
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    func = node.func
                    if isinstance(func, ast.Attribute) and isinstance(func.value, ast.Name):
                        if func.value.id == "os" and func.attr == "getenv":
                            relative = py_file.relative_to(service_path)
                            result.warn(f"os.getenv() found in {relative} — use settings instead")
                        if func.value.id == "os" and func.attr == "environ":
                            relative = py_file.relative_to(service_path)
                            result.warn(f"os.environ used in {relative} — use settings instead")
        except SyntaxError:
            result.warn(f"Could not parse {py_file}")


def check_require_internal_token(service_path: Path, result: CheckResult) -> None:
    """Check that security module has require_internal_token."""
    security_py = service_path / "app" / "core" / "security.py"
    if not security_py.is_file():
        result.fail("app/core/security.py not found")
        return

    content = security_py.read_text(encoding="utf-8")

    if "require_internal_token" in content:
        result.ok("security.py has require_internal_token()")
    else:
        result.warn("security.py is missing require_internal_token()")

    if "X-Internal-Service-Token" in content:
        result.ok("security.py checks X-Internal-Service-Token header")
    else:
        result.warn("security.py is missing X-Internal-Service-Token header check")


def check_three_tier_separation(service_path: Path, result: CheckResult) -> None:
    """Check for common anti-patterns in three-tier separation."""
    modules_dir = service_path / "app" / "modules"
    if not modules_dir.is_dir():
        return

    for module_dir in modules_dir.iterdir():
        if not module_dir.is_dir() or module_dir.name.startswith("_"):
            continue

        router_py = module_dir / "router.py"
        service_py = module_dir / "service.py"
        repository_py = module_dir / "repository.py"

        module_name = module_dir.name

        # Check that service exists if repository exists
        if repository_py.is_file() and not service_py.is_file():
            result.warn(f"{module_name}: has repository.py but no service.py — business logic may be in wrong layer")

        # Check that router doesn't import db/session directly for SQL
        if router_py.is_file():
            content = router_py.read_text(encoding="utf-8")
            # Check for direct model imports (anti-pattern in router)
            if "from app.db.models import" in content:
                result.warn(f"{module_name}/router.py imports from app.db.models — should go through service")
            # Check for direct repository usage without service
            if "Repository" in content and "Service" not in content:
                # This might be router -> repository without service
                result.warn(f"{module_name}/router.py uses Repository directly without Service layer")
            if service_py.is_file() and "Depends(get_session)" in content and "Depends(get_" not in content:
                # Router might be bypassing service
                result.warn(f"{module_name}/router.py has get_session Depends but no service dependency injection")

        # Check repository for business logic
        if repository_py.is_file():
            content = repository_py.read_text(encoding="utf-8")
            suspicious = [
                "import httpx", "import aiohttp", "import requests",
                "from app.core.config import", "HTTPException",
            ]
            for s in suspicious:
                if s in content:
                    result.warn(f"{module_name}/repository.py imports {s.split()[1]} — should be in service")


def check_dockerfile_standard(service_path: Path, result: CheckResult) -> None:
    """Check Dockerfile follows the standard."""
    dockerfile = service_path / "Dockerfile"
    if not dockerfile.is_file():
        result.fail("Dockerfile not found")
        return

    content = dockerfile.read_text(encoding="utf-8")

    if "python:3.12" in content:
        result.ok("Dockerfile uses python:3.12 image")
    else:
        result.warn("Dockerfile uses non-standard base image")

    if "pip install" in content:
        result.ok("Dockerfile has pip install step")

    if "uvicorn" in content:
        result.ok("Dockerfile uses uvicorn as CMD")
    else:
        result.fail("Dockerfile CMD does not use uvicorn")


def check_database_session_pattern(service_path: Path, result: CheckResult) -> None:
    """Check that session.py follows the standard pattern."""
    session_py = service_path / "app" / "db" / "session.py"
    if not session_py.is_file():
        result.fail("app/db/session.py not found")
        return

    content = session_py.read_text(encoding="utf-8")

    if "pool_pre_ping=True" in content:
        result.ok("session.py uses pool_pre_ping=True")
    else:
        result.warn("session.py is missing pool_pre_ping=True")

    if "expire_on_commit=False" in content:
        result.ok("session.py uses expire_on_commit=False")
    else:
        result.warn("session.py is missing expire_on_commit=False")

    if "async def get_session" in content:
        result.ok("session.py has async get_session() dependency")
    else:
        result.fail("session.py is missing get_session() dependency")


def check_pyproject_dependencies(service_path: Path, result: CheckResult) -> None:
    """Check that pyproject.toml has expected dependencies."""
    pyproject = service_path / "pyproject.toml"
    if not pyproject.is_file():
        result.fail("pyproject.toml not found")
        return

    content = pyproject.read_text(encoding="utf-8")

    expected = ["fastapi", "uvicorn", "pydantic-settings"]
    for dep in expected:
        if dep in content:
            result.ok(f"pyproject.toml has {dep} dependency")
        else:
            result.fail(f"pyproject.toml is missing {dep} dependency")

    if "hatchling" in content:
        result.ok("pyproject.toml uses hatchling build system")
    else:
        result.warn("pyproject.toml uses non-standard build system")

    if "[tool.hatch.build.targets.wheel]" in content:
        if "packages = [\"app\"]" in content:
            result.ok("pyproject.toml has correct wheel packages config")


def check_alembic(service_path: Path, result: CheckResult) -> None:
    """Check alembic configuration."""
    alembic_ini = service_path / "alembic.ini"
    alembic_dir = service_path / "alembic"

    if alembic_ini.is_file() and alembic_dir.is_dir():
        result.ok("alembic is configured (alembic.ini + alembic/)")
        versions_dir = alembic_dir / "versions"
        if versions_dir.is_dir():
            migrations = list(versions_dir.glob("*.py"))
            if migrations:
                result.ok(f"alembic has {len(migrations)} migration(s)")
    elif not alembic_ini.is_file() and not alembic_dir.is_dir():
        result.warn("alembic not configured — no migrations directory")


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate-service.py <service-path>")
        print("Example: python validate-service.py services/identity-service")
        sys.exit(1)

    service_path = Path(sys.argv[1]).resolve()

    if not service_path.is_dir():
        print(f"Error: {service_path} is not a valid directory")
        sys.exit(1)

    service_name = service_path.name
    print(f"\n{'='*60}")
    print(f"  Validating service: {service_name}")
    print(f"  Path: {service_path}")
    print(f"{'='*60}\n")

    result = CheckResult()

    check_directory_structure(service_path, result)
    check_required_files(service_path, result)
    check_create_app_pattern(service_path, result)
    check_pydantic_settings(service_path, result)
    check_no_os_environ(service_path, result)
    check_require_internal_token(service_path, result)
    check_three_tier_separation(service_path, result)
    check_dockerfile_standard(service_path, result)
    check_database_session_pattern(service_path, result)
    check_pyproject_dependencies(service_path, result)
    check_alembic(service_path, result)

    print(f"\n{'='*60}")
    print(f"  Results: {result.passed} passed, {result.failed} failed, {len(result.warnings)} warnings")
    print(f"{'='*60}\n")

    if result.failed > 0:
        print("Failed checks:")
        for err in result.errors:
            print(f"  - {err}")
        print()

    if result.warnings:
        print("Warnings:")
        for w in result.warnings:
            print(f"  - {w}")
        print()

    return 0 if result.failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
