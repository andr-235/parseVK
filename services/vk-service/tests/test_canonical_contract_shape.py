from parsevk_contracts.vk.commands import (
    CATALOG,
    VkExecutionCancelRequested,
    VkExecutionRequested,
)


def test_catalog_contains_one_requested_contract_and_one_cancel_contract():
    contracts = CATALOG.contracts
    requested = [c for c in contracts if c.message_type == "vk.execution.requested"]
    cancelled = [
        c for c in contracts if c.message_type == "vk.execution.cancel_requested"
    ]

    assert len(requested) == 1
    assert requested[0].payload_model is VkExecutionRequested
    assert len(cancelled) == 1
    assert cancelled[0].payload_model is VkExecutionCancelRequested
