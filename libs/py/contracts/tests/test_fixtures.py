"""Tests for the small canonical JSON example set."""

from __future__ import annotations

from copy import deepcopy

import jsonschema
import pytest
from pydantic import ValidationError

from parsevk_contracts.envelope import MessageEnvelope
from parsevk_contracts.generation.json_schema import generate_json_schema
from parsevk_contracts.sources.events import (
    SOURCE_ACCESS_GRANTED,
    SOURCE_ACCESS_REVOKED,
    SourceAccessGranted,
    SourceAccessRevoked,
)
from parsevk_contracts.vk.commands import VK_EXECUTION_REQUESTED, VkExecutionRequested
from tests.fixtures import load_fixture

SOURCE_CASES = {
    "sources.access.granted": (
        "valid-grant",
        SOURCE_ACCESS_GRANTED,
        SourceAccessGranted,
    ),
    "sources.access.revoked": (
        "valid-revoke",
        SOURCE_ACCESS_REVOKED,
        SourceAccessRevoked,
    ),
}


def validator(contract):
    return jsonschema.Draft202012Validator(
        generate_json_schema(contract),
        format_checker=jsonschema.FormatChecker(),
    )


class TestVkExamples:
    def test_single_and_multiple_demands(self) -> None:
        single = load_fixture("vk.execution.requested", "valid-single-demand")
        multiple = load_fixture("vk.execution.requested", "valid-multiple-demands")

        single_envelope = MessageEnvelope[VkExecutionRequested].model_validate(single)
        multiple_envelope = MessageEnvelope[VkExecutionRequested].model_validate(multiple)

        assert len(single_envelope.payload.demands) == 1
        assert len(multiple_envelope.payload.demands) == 2
        assert "schemaVersion" not in single
        assert "schemaVersion" not in multiple

    def test_examples_pass_generated_schema(self) -> None:
        check = validator(VK_EXECUTION_REQUESTED)
        check.validate(load_fixture("vk.execution.requested", "valid-single-demand"))
        check.validate(load_fixture("vk.execution.requested", "valid-multiple-demands"))

    @pytest.mark.parametrize(
        ("field", "value"),
        [
            ("ownerId", 123),
            ("snapshotSha256", "broken"),
        ],
    )
    def test_invalid_wire_values_fail_schema(self, field: str, value: object) -> None:
        data = deepcopy(
            load_fixture("vk.execution.requested", "valid-single-demand")
        )
        if field == "ownerId":
            data["payload"]["demands"][0]["source"][field] = value
        else:
            data["payload"][field] = value

        with pytest.raises(jsonschema.ValidationError):
            validator(VK_EXECUTION_REQUESTED).validate(data)

    def test_empty_demands_fail_schema(self) -> None:
        data = deepcopy(
            load_fixture("vk.execution.requested", "valid-single-demand")
        )
        data["payload"]["demands"] = []

        with pytest.raises(jsonschema.ValidationError):
            validator(VK_EXECUTION_REQUESTED).validate(data)

    def test_cross_field_identity_is_domain_validated(self) -> None:
        data = deepcopy(
            load_fixture("vk.execution.requested", "valid-single-demand")
        )
        data["payload"]["demands"][0]["source"]["ownerId"] = -999

        with pytest.raises(ValidationError, match="ownerId must equal"):
            MessageEnvelope[VkExecutionRequested].model_validate(data)

    def test_unknown_fields_are_ignored_only_on_consume(self) -> None:
        data = deepcopy(
            load_fixture("vk.execution.requested", "valid-single-demand")
        )
        data["futureField"] = "future"
        data["payload"]["futureField"] = "future"

        envelope = MessageEnvelope[VkExecutionRequested].model_validate(
            data,
            extra="ignore",
        )
        assert envelope.message_type == "vk.execution.requested"


class TestSourceAccessExamples:
    @pytest.mark.parametrize("message_type", sorted(SOURCE_CASES))
    def test_example_is_unversioned_and_valid(self, message_type: str) -> None:
        case, contract, payload_model = SOURCE_CASES[message_type]
        data = load_fixture(message_type, case)

        envelope = MessageEnvelope[payload_model].model_validate(data)
        validator(contract).validate(data)

        assert envelope.message_type == message_type
        assert "schemaVersion" not in data

    @pytest.mark.parametrize("message_type", sorted(SOURCE_CASES))
    def test_invalid_source_identity_is_rejected(self, message_type: str) -> None:
        case, _, payload_model = SOURCE_CASES[message_type]
        data = deepcopy(load_fixture(message_type, case))
        data["payload"]["ownerId"] = -999

        with pytest.raises(ValidationError, match="ownerId must equal"):
            MessageEnvelope[payload_model].model_validate(data)

    @pytest.mark.parametrize("message_type", sorted(SOURCE_CASES))
    def test_invalid_revision_fails_schema(self, message_type: str) -> None:
        case, contract, _ = SOURCE_CASES[message_type]
        data = deepcopy(load_fixture(message_type, case))
        data["payload"]["revision"] = 0

        with pytest.raises(jsonschema.ValidationError):
            validator(contract).validate(data)

    @pytest.mark.parametrize("message_type", sorted(SOURCE_CASES))
    def test_scope_and_creator_must_differ(self, message_type: str) -> None:
        case, _, payload_model = SOURCE_CASES[message_type]
        data = deepcopy(load_fixture(message_type, case))
        data["payload"]["createdByUserId"] = data["payload"]["accessScopeId"]

        with pytest.raises(ValidationError):
            MessageEnvelope[payload_model].model_validate(data)
