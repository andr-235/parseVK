from types import SimpleNamespace

import pytest

from app.domain.entities.executions import VkExecution
from app.infrastructure.db.models.executions import VkExecution as VkExecutionModel
from app.services.ingestion.group_collector import GroupCollector


class Stub:
    pass


def collector() -> GroupCollector:
    return GroupCollector(adapter=Stub(), repository=Stub())


@pytest.mark.anyio
async def test_group_id_comes_from_normalized_source_plan():
    execution = SimpleNamespace(
        plan_snapshot={"source": {"externalId": "12345"}}
    )

    assert await collector().get_group_ids(execution) == [12345]


@pytest.mark.anyio
@pytest.mark.parametrize(
    "plan",
    [{}, {"source": {}}, {"source": {"externalId": "bad"}}, {"source": {"externalId": 0}}],
)
async def test_invalid_source_plan_is_rejected(plan):
    with pytest.raises(RuntimeError, match="source externalId"):
        await collector().get_group_ids(SimpleNamespace(plan_snapshot=plan))


def test_execution_models_do_not_expose_legacy_task_fields():
    for field in ("scope", "mode", "group_ids", "parent_execution_id"):
        assert field not in VkExecution.__dataclass_fields__
        assert not hasattr(VkExecutionModel, field)
