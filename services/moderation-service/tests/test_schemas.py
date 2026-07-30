import pytest
from pydantic import ValidationError

from app.modules.moderation.schemas import UpdateCommentStatus


def test_update_comment_status_rejects_null() -> None:
    with pytest.raises(ValidationError):
        UpdateCommentStatus.model_validate({"status": None})
