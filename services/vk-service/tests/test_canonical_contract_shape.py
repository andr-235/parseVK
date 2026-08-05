from parsevk_contracts.vk.commands import CATALOG, VkExecutionRequested


def test_execution_requested_has_one_unversioned_contract():
    contracts = [
        contract
        for contract in CATALOG.contracts
        if contract.message_type == "vk.execution.requested"
    ]

    assert len(contracts) == 1
    assert contracts[0].payload_model is VkExecutionRequested
    assert not hasattr(contracts[0], "schema_version")
    assert not hasattr(contracts[0], "compatibility")
