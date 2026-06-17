from contextlib import asynccontextmanager

from app.core.config import settings
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    @app.get("/ready")
    async def ready() -> dict[str, str]:
        from app.db.session import engine
        from fastapi import HTTPException
        from sqlalchemy import text
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return {"status": "READY"}
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}") from e

    from app.modules.listings.router import router as listings_router
    app.include_router(listings_router)

    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
