# Service Template

This directory contains file-level templates used by `scripts/scaffold-service.py`.

See the scaffolder script at `scripts/scaffold-service.py` for the actual template logic.

## Generated structure

```
services/{service-name}/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── session.py
│   │   └── models.py
│   └── modules/
│       ├── __init__.py
│       └── {module}/
│           ├── __init__.py
│           ├── router.py
│           ├── service.py
│           ├── schemas.py
│           └── repository.py
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── tests/
│   ├── __init__.py
│   ├── _service_path.py
│   └── test_{module}.py
├── alembic.ini
├── Dockerfile
├── pyproject.toml
└── .env.example
```
