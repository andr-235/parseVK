from fastapi import FastAPI

from app.core.middleware import RequestIdMiddleware
from app.modules.auth.router import router as auth_router


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK API Gateway")
    app.add_middleware(RequestIdMiddleware)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    app.include_router(auth_router)

    return app


app = create_app()
