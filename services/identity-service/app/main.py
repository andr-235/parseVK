from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.modules.auth.router import router as auth_router
from app.modules.users.admin_router import router as admin_router


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK Identity Service")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    @app.get("/ready")
    async def ready() -> dict[str, str]:
<<<<<<< HEAD
        from app.db.session import engine
        from sqlalchemy import text
        from fastapi import HTTPException
=======
        from fastapi import HTTPException
        from sqlalchemy import text

        from app.db.session import engine
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return {"status": "READY"}
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}")

    app.include_router(auth_router)
    app.include_router(admin_router)

    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
