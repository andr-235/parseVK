from parsevk_contracts.vk.commands import CATALOG, VkExecutionRequested


def test_only_one_execution_requested_contract_is_registered():
    contracts = [
        contract
        for contract in CATALOG
        if contract.message_type == "vk.execution.requested"
    ]

    assert len(contracts) == 1
    assert contracts[0].schema_version == 1
    assert contracts[0].payload_model is VkExecutionRequested
