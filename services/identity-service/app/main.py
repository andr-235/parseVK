from fastapi import FastAPI

from app.modules.auth.router import router as auth_router
from app.modules.users.admin_router import router as admin_router


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK Identity Service")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    app.include_router(auth_router)
    app.include_router(admin_router)

    return app


app = create_app()
