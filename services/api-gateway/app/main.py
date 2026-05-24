from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.middleware import RequestIdMiddleware
from app.core.config import settings
from app.modules.auth.router import router as auth_router
from app.modules.content.router import router as content_router
from app.modules.tasks.router import router as tasks_router
from app.modules.admin_users.router import router as admin_users_router


from app.modules.comments.router import router as comments_router

def create_app() -> FastAPI:
    app = FastAPI(title="parseVK API Gateway")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestIdMiddleware)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    app.include_router(auth_router)
    app.include_router(content_router)
    app.include_router(tasks_router)
    app.include_router(admin_users_router)
    app.include_router(comments_router)

    return app


app = create_app()
