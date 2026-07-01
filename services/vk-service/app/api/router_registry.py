from fastapi import FastAPI

from app.api.routers.ok_friends import router as ok_friends_router
from app.api.routers.vk_friends import router as vk_friends_router
from app.api.routers.vk_groups import router as vk_groups_router
from app.api.routers.vk_posts import router as vk_posts_router
from app.api.routers.vk_users import token_router, users_router


def register_routers(app: FastAPI) -> None:
    app.include_router(vk_groups_router, prefix="/internal/vk")
    app.include_router(vk_posts_router, prefix="/internal/vk")
    app.include_router(users_router, prefix="/internal/vk")
    app.include_router(token_router, prefix="/internal/vk")
    app.include_router(vk_friends_router)
    app.include_router(ok_friends_router)
