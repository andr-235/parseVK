from app.infrastructure.db.models import (
    ContentAuthor,
    ContentComment,
    ContentGroup,
    ContentPost,
    ImMessage,
    MonitoringGroup,
    ProcessedEvent,
)


def test_split_models_preserve_table_contracts():
    assert ContentGroup.__tablename__ == "content_groups"
    assert ContentAuthor.__tablename__ == "content_authors"
    assert ContentPost.__tablename__ == "content_posts"
    assert ContentComment.__tablename__ == "content_comments"
    assert ProcessedEvent.__tablename__ == "processed_events"
    assert ImMessage.__tablename__ == "im_messages"
    assert MonitoringGroup.__tablename__ == "monitoring_groups"
    constraints = {item.name for item in ImMessage.__table__.constraints}
    assert "uq_im_messages_identity" in constraints
