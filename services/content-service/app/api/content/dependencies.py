from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.bootstrap import ContentContainer
from app.infrastructure.db.session import get_session
from app.services.content.author_commands import AuthorCommandService
from app.services.content.authors import AuthorQueryService
from app.services.content.groups import GroupService
from app.services.content.posts import PostService

SessionDep = Annotated[AsyncSession, Depends(get_session)]


def get_container(request: Request) -> ContentContainer:
    return request.app.state.container


def get_author_query(
    session: SessionDep,
    container: Annotated[ContentContainer, Depends(get_container)],
) -> AuthorQueryService:
    return container.author_query(session)


def get_author_commands(
    session: SessionDep,
    container: Annotated[ContentContainer, Depends(get_container)],
) -> AuthorCommandService:
    return container.author_commands(session)


def get_group_service(
    session: SessionDep,
    container: Annotated[ContentContainer, Depends(get_container)],
) -> GroupService:
    return container.groups(session)


def get_post_service(
    session: SessionDep,
    container: Annotated[ContentContainer, Depends(get_container)],
) -> PostService:
    return container.posts(session)
