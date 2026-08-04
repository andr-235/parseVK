from pathlib import Path


def test_collection_identity_has_no_aggregate_builder():
    root = Path(__file__).parents[1]
    content = (root / "app/services/collection_fingerprint.py").read_text()

    assert "group_ids" not in content
    assert "vk:groups:" not in content
    assert "identity_version" not in content
