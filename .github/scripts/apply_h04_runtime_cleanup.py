from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one replacement, found {count}: {old[:80]!r}")
    write(path, content.replace(old, new, 1))


# SQLAlchemy model: source identity and plan live in plan_snapshot / VkSourceCollection.
path = "services/vk-service/app/infrastructure/db/models/executions.py"
replace_once(path, "from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID\n", "from sqlalchemy.dialects.postgresql import JSONB, UUID\n")
replace_once(
    path,
    "    scope: Mapped[str] = mapped_column(String(32), nullable=False)\n"
    "    mode: Mapped[str] = mapped_column(String(64), nullable=False)\n"
    "    group_ids: Mapped[list[int]] = mapped_column(ARRAY(BigInteger), nullable=False, default=list)\n",
    "",
)
replace_once(
    path,
    "    parent_execution_id: Mapped[PyUUID | None] = mapped_column(\n"
    "        UUID(as_uuid=True), ForeignKey(\"vk_executions.id\", ondelete=\"SET NULL\"), nullable=True\n"
    "    )\n",
    "",
)

# Domain execution no longer exposes synthetic task-shaped fields.
path = "services/vk-service/app/domain/entities/executions.py"
replace_once(
    path,
    "    scope: str\n    mode: str\n    group_ids: list[int]\n",
    "",
)
replace_once(path, "    parent_execution_id: UUID | None\n", "")
replace_once(
    path,
    "    @property\n    def scope(self) -> str:\n        return self.execution.scope\n\n"
    "    @property\n    def mode(self) -> str:\n        return self.execution.mode\n\n"
    "    @property\n    def group_ids(self) -> list[int]:\n        return self.execution.group_ids\n\n",
    "",
)

# Repository projection follows the canonical model.
path = "services/vk-service/app/infrastructure/db/repositories/executions.py"
content = read(path)
content = content.replace("import json\n", "", 1)
content, count = re.subn(
    r"\ndef _group_ids\(value\) -> list\[int\]:\n.*?\n\ndef _execution_entity",
    "\n\ndef _execution_entity",
    content,
    count=1,
    flags=re.DOTALL,
)
if count != 1:
    raise RuntimeError("executions.py: failed to remove _group_ids")
for old in (
    "        scope=model.scope,\n",
    "        mode=model.mode,\n",
    "        group_ids=_group_ids(model.group_ids),\n",
    "        parent_execution_id=model.parent_execution_id,\n",
):
    if content.count(old) != 1:
        raise RuntimeError(f"executions.py: expected one mapping line: {old!r}")
    content = content.replace(old, "", 1)
write(path, content)

# Canonical source attachment stops manufacturing fake task-level fields.
path = "services/vk-service/app/infrastructure/db/repositories/canonical_source_attachment.py"
replace_once(
    path,
    "            scope=\"selected\",\n"
    "            mode=\"recent_posts\",\n"
    "            group_ids=[int(source.external_id)],\n",
    "",
)

# Worker resolves the one physical source from the normalized plan.
path = "services/vk-service/app/services/ingestion/group_collector.py"
replace_once(path, "from app.infrastructure.tasks_client.client import TasksClient\n", "")
replace_once(
    path,
    "        tasks_client: TasksClient,\n",
    "",
)
replace_once(path, "        self.tasks_client = tasks_client\n", "")
replace_once(
    path,
    "    async def get_group_ids(self, task_run: Any) -> list[int]:\n"
    "        if task_run.scope == \"selected\":\n"
    "            return [int(item) for item in task_run.group_ids]\n"
    "        group_ids = await self.repository.get_active_group_ids()\n"
    "        if not group_ids:\n"
    "            raise RuntimeError(\"No active groups configured for scope=all\")\n"
    "        return group_ids\n",
    "    async def get_group_ids(self, task_run: Any) -> list[int]:\n"
    "        plan = task_run.plan_snapshot\n"
    "        source = plan.get(\"source\") if isinstance(plan, dict) else None\n"
    "        external_id = source.get(\"externalId\") if isinstance(source, dict) else None\n"
    "        try:\n"
    "            group_id = int(external_id)\n"
    "        except (TypeError, ValueError) as exc:\n"
    "            raise RuntimeError(\"Execution plan has no valid source externalId\") from exc\n"
    "        if group_id <= 0:\n"
    "            raise RuntimeError(\"Execution plan source externalId must be positive\")\n"
    "        return [group_id]\n",
)

path = "services/vk-service/app/services/ingestion/collector.py"
replace_once(path, "            tasks_client=tasks_client,\n", "")

# Existing ingestion fixture now represents the physical plan actually consumed.
path = "services/vk-service/tests/test_ingestion.py"
replace_once(
    path,
    "        scope=\"selected\",\n"
    "        mode=\"recent_posts\",\n"
    "        group_ids=[1],\n"
    "        post_limit=10,\n",
    "        post_limit=10,\n"
    "        plan_snapshot={\"source\": {\"externalId\": \"1\"}},\n",
)

# Documentation moves lineage to TaskRun and records destructive rollback semantics.
path = "services/vk-service/docs/vk-execution-attempts.md"
replace_once(
    path,
    "A terminal execution is immutable and cannot be reclaimed or resumed. A later TaskRun creates a new execution. When it follows a terminal execution for the same task, `parent_execution_id` records the relationship without mutating the previous execution.\n",
    "A terminal execution is immutable and cannot be reclaimed or resumed. A later TaskRun creates new physical work. Resume lineage belongs to `tasks-service.task_runs.resumed_from_task_run_id`; shared VK executions never encode TaskRun ancestry.\n\n"
    "Migration `p2h4_execution_plan_cleanup` removes `parent_execution_id`, `scope`, `mode` and `group_ids` from `vk_executions`. Source identity and collection options remain in `VkSourceCollection` and the normalized `plan_snapshot`. Downgrade can recreate the removed columns only as derived emergency placeholders; it cannot restore discarded task-level semantics. Production rollback therefore requires the previous application image together with a pre-migration database backup.\n",
)

write(
    "services/vk-service/alembic/versions/p2h4_execution_plan_cleanup.py",
    '''"""Remove task-shaped fields from canonical physical VK executions.

Revision ID: p2h4_execution_plan_cleanup
Revises: pr6b2_quarantine_legacy_outbox
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY, UUID

revision: str = "p2h4_execution_plan_cleanup"
down_revision: str | None = "pr6b2_quarantine_legacy_outbox"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("fk_vk_executions_parent", "vk_executions", type_="foreignkey")
    op.drop_column("vk_executions", "parent_execution_id")
    op.drop_column("vk_executions", "group_ids")
    op.drop_column("vk_executions", "mode")
    op.drop_column("vk_executions", "scope")


def downgrade() -> None:
    op.add_column("vk_executions", sa.Column("scope", sa.String(32), nullable=True))
    op.add_column("vk_executions", sa.Column("mode", sa.String(64), nullable=True))
    op.add_column("vk_executions", sa.Column("group_ids", ARRAY(sa.BigInteger()), nullable=True))
    op.add_column("vk_executions", sa.Column("parent_execution_id", UUID(as_uuid=True), nullable=True))
    op.execute(
        """
        UPDATE vk_executions
        SET scope = 'selected',
            mode = 'recent_posts',
            group_ids = CASE
                WHEN plan_snapshot #>> '{source,externalId}' ~ '^[0-9]+$'
                THEN ARRAY[(plan_snapshot #>> '{source,externalId}')::bigint]
                ELSE ARRAY[]::bigint[]
            END
        """
    )
    op.alter_column("vk_executions", "scope", nullable=False)
    op.alter_column("vk_executions", "mode", nullable=False)
    op.alter_column("vk_executions", "group_ids", nullable=False)
    op.create_foreign_key(
        "fk_vk_executions_parent",
        "vk_executions",
        "vk_executions",
        ["parent_execution_id"],
        ["id"],
        ondelete="SET NULL",
    )
''',
)

write(
    "services/vk-service/tests/test_physical_execution_plan.py",
    '''from types import SimpleNamespace

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
''',
)

# Application code must have no authoritative legacy execution fields left.
for token in ("model.scope", "model.mode", "model.group_ids", "model.parent_execution_id"):
    matches = [
        str(path.relative_to(ROOT))
        for path in (ROOT / "services/vk-service/app").rglob("*.py")
        if token in path.read_text(encoding="utf-8")
    ]
    if matches:
        raise RuntimeError(f"legacy token {token!r} remains in {matches}")
