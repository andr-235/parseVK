import asyncio
import json
import os
import sys
from pathlib import Path
from uuid import uuid4

import pytest
from aiokafka import AIOKafkaConsumer
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

TEST_DIR = Path(__file__).resolve().parent
REPO_ROOT = TEST_DIR.parents[3]
sys.path.insert(0, str(TEST_DIR))
from canonical_e2e_flows import run_cancel_flow, run_recovery_flow
from canonical_e2e_support import (
    TOPIC,
    CanonicalE2EInfra,
    publish_from_tasks,
)

from app.infrastructure.db.base import Base

pytestmark = pytest.mark.integration


async def _publish_scenario(
    repo_root: Path,
    infra,
    metadata_path: Path,
    scenario: str,
):
    await asyncio.to_thread(
        publish_from_tasks,
        repo_root,
        infra,
        metadata_path,
        scenario,
    )
    raw_metadata = await asyncio.to_thread(
        metadata_path.read_text,
        encoding="utf-8",
    )
    return json.loads(raw_metadata)


@pytest.mark.asyncio
async def test_tasks_outbox_to_canonical_vk_runtime_e2e(tmp_path: Path):
    infra = await CanonicalE2EInfra.start()
    engine = create_async_engine(infra.vk_database_url, pool_pre_ping=True)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=infra.bootstrap_servers,
        group_id=f"p0-p2-e2e-{uuid4()}",
        auto_offset_reset="earliest",
        enable_auto_commit=False,
    )
    consumer_started = False
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        await consumer.start()
        consumer_started = True
        repeats = int(os.getenv("P0_P2_E2E_REPEATS", "1"))

        for iteration in range(repeats):
            cancel_metadata = await _publish_scenario(
                REPO_ROOT,
                infra,
                tmp_path / f"cancel-{iteration}.json",
                "cancel",
            )
            await run_cancel_flow(
                consumer,
                infra,
                sessions,
                cancel_metadata,
            )

            recovery_metadata = await _publish_scenario(
                REPO_ROOT,
                infra,
                tmp_path / f"recovery-{iteration}.json",
                "recovery",
            )
            await run_recovery_flow(
                consumer,
                infra,
                sessions,
                recovery_metadata,
            )
    finally:
        if consumer_started:
            await consumer.stop()
        await engine.dispose()
        infra.stop()
