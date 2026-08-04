from app.domain.entities.source_collections import CommandAttachmentOutcome


def test_command_attachment_outcomes_are_explicit():
    assert set(CommandAttachmentOutcome.__args__) == {
        "created",
        "duplicate",
        "conflict",
    }
