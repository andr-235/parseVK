from abc import ABC

from app.domain.repositories.authors import AuthorRepository
from app.domain.repositories.comments import CommentRepository
from app.domain.repositories.groups import GroupRepository
from app.domain.repositories.posts import PostRepository


class IngestionRepository(GroupRepository, AuthorRepository, PostRepository, CommentRepository, ABC):
    """Unified interface composing all ingestion sub-repositories."""
