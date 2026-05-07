from fastapi import FastAPI

from app.modules.automation.router import router as automation_router
from app.modules.tasks.router import router as tasks_router


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK Tasks Service")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    app.include_router(automation_router)
    app.include_router(tasks_router)
    return app


app = create_app()
