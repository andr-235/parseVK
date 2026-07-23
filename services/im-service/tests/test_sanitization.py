from __future__ import annotations

import pytest

from app.modules.ingestion.sanitization import (
    SanitizationResult,
    sanitize_postgres_text,
    sanitize_source_payload,
    validate_external_identifier,
)


@pytest.mark.parametrize(
    ("field", "input_value", "expected_value"),
    [
        ("body", "hello\x00world", "helloworld"),
        ("caption", "cap\x00tion", "caption"),
        ("author", "auth\x00or", "author"),
        ("chat_name", "chat\x00name", "chatname"),
    ],
)
def test_sanitize_source_payload_replaces_nul_in_string_fields(field, input_value, expected_value):
    payload = {field: input_value}

    result = sanitize_source_payload(payload)

    assert result.value == {field: expected_value}
    assert result.replacements == 1


def test_sanitize_source_payload_replaces_nul_in_nested_dict():
    payload = {"outer": {"inn\x00er": "val\x00ue"}}

    result = sanitize_source_payload(payload)

    assert result.value == {"outer": {"inner": "value"}}
    assert result.replacements == 2


def test_sanitize_source_payload_replaces_nul_in_list():
    payload = ["a\x00b", "c\x00d"]

    result = sanitize_source_payload(payload)

    assert result.value == ["ab", "cd"]
    assert result.replacements == 2


def test_sanitize_source_payload_replaces_nul_in_tuple():
    payload = ("a\x00b", "c\x00d")

    result = sanitize_source_payload(payload)

    assert result.value == ("ab", "cd")
    assert result.replacements == 2


def test_sanitize_source_payload_counts_multiple_nuls():
    payload = {"body": "\x00a\x00b\x00"}

    result = sanitize_source_payload(payload)

    assert result.value == {"body": "ab"}
    assert result.replacements == 3


def test_sanitize_source_payload_returns_unchanged_when_no_nul():
    payload = {"body": "hello", "count": 42}

    result = sanitize_source_payload(payload)

    assert result.value == {"body": "hello", "count": 42}
    assert result.replacements == 0


def test_sanitize_source_payload_does_not_mutate_original_input():
    payload = {"body": "hello\x00world"}

    result = sanitize_source_payload(payload)

    assert payload == {"body": "hello\x00world"}
    assert result.value == {"body": "helloworld"}


@pytest.mark.parametrize("scalar", [42, 3.14, True, False, None])
def test_sanitize_source_payload_passes_scalar_types_unchanged(scalar):
    result = sanitize_source_payload(scalar)

    assert result.value is scalar
    assert result.replacements == 0


@pytest.mark.parametrize("payload", [{}, []])
def test_sanitize_source_payload_returns_empty_containers_unchanged(payload):
    result = sanitize_source_payload(payload)

    assert result.value == payload
    assert result.replacements == 0
    assert result.value is not payload


@pytest.mark.parametrize(
    ("input_value", "expected"),
    [
        ("hello\x00world", "helloworld"),
        ("\x00leading", "leading"),
        ("trailing\x00", "trailing"),
    ],
)
def test_sanitize_postgres_text_replaces_nul(input_value, expected, caplog):
    with caplog.at_level("WARNING"):
        result = sanitize_postgres_text(input_value)

    assert result == expected
    assert "sanitize_postgres_text: replaced NUL" in caplog.text


def test_sanitize_postgres_text_returns_none_for_none():
    result = sanitize_postgres_text(None)

    assert result is None


def test_sanitize_postgres_text_returns_clean_string_unchanged():
    result = sanitize_postgres_text("clean text")

    assert result == "clean text"


def test_sanitize_postgres_text_preserves_non_nul_characters():
    result = sanitize_postgres_text("before\x00after")

    assert result == "beforeafter"


@pytest.mark.parametrize(
    ("value", "field_name", "expected_message"),
    [
        (None, "chat_id", "value is None"),
        ("", "message_id", "value is empty or whitespace-only"),
        ("   ", "group_id", "value is empty or whitespace-only"),
        ("bad\x00id", "external_id", "value contains NUL character"),
    ],
)
def test_validate_external_identifier_rejects_invalid_values(value, field_name, expected_message, caplog):
    with caplog.at_level("WARNING"):
        with pytest.raises(ValueError, match=expected_message):
            validate_external_identifier(value, field_name)

    assert "validate_external_identifier: rejected invalid" in caplog.text
    assert field_name in caplog.text


def test_validate_external_identifier_rejects_long_value():
    long_value = "x" * 256

    with pytest.raises(ValueError, match="value exceeds 255 characters"):
        validate_external_identifier(long_value, "chat_id")


def test_validate_external_identifier_returns_trimmed_valid_string():
    result = validate_external_identifier("  valid-id  ", "chat_id")

    assert result == "valid-id"


def test_validate_external_identifier_converts_int_to_str():
    result = validate_external_identifier(12345, "message_id")

    assert result == "12345"


def test_sanitization_result_is_frozen():
    result = SanitizationResult(value="clean", replacements=0)

    with pytest.raises(AttributeError):
        result.value = "modified"
