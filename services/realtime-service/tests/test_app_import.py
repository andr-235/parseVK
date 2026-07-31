def test_application_module_imports() -> None:
    """Production entrypoint must import with the installed FastAPI version."""
    from app.main import app

    assert app.title == "parseVK Realtime Service"
