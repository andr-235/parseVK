import asyncio
import json
import os
import subprocess
from pathlib import Path
from uuid import UUID, uuid4

import asyncpg
import pytest
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from aiokafka.admin import AIOKafkaAdminClient, NewTopic
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.core.container import DockerContainer
from testcontainers.kafka import KafkaContainer

from app.infrastructure.db.base import Base
from app.infrastructure.db.models.executions import (  # noqa: F401
    VkExecution,
    VkExecutionAttempt,
)
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.models.tasks import ProcessedEvent
from app.tasks.vk_commands_consumer import VkExecutionCommandsConsumer

pytestmark = pytest.mark.integration

TOPIC = "parsevk.vk.commands"
DLQ_TOPIC = "parsevk.vk.commands.dlq"


async def _wait_for_postgres(host: str, port: int) -> None:
    last_error = None
    for _ in range(100):
        try:
            connection = await asyncpg.connect(
                host=host,
                port=port,
                user="postgres",
                password="postgres",
                database="postgres",
            )
            await connection.close()
            return
        except (OSError, asyncpg.PostgresError) as exc:
            last_error = exc
            await asyncio.sleep(0.1)
    raise RuntimeError("PostgreSQL test container did not become ready") from last_error


async def _create_database(host: str, port: int, name: str) -> None:
    connection = await asyncpg.connect(
        host=host,
        port=port,
        user="postgres",
        password="postgres",
        database="postgres",
    )
    try:
        await connection.execute(f'CREATE DATABASE "{name}"')
    finally:
        await connection.close()


async def _prepare_kafka(bootstrap_servers: str) -> None:
    last_error = None
    for _ in range(100):
        admin = AIOKafkaAdminClient(bootstrap_servers=bootstrap_servers)
        try:
            await admin.start()
            await admin.create_topics(
                [
                    NewTopic(TOPIC, num_partitions=3, replication_factor=1),
                    NewTopic(DLQ_TOPIC, num_partitions=1, replication_factor=1),
                ]
            )
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            await asyncio.sleep(0.2)
        finally:
            await admin.close()
    raise RuntimeError("Kafka test container did not become ready") from last_error


def _publish_from_tasks(
    repo_root: Path,
    database_url: str,
    bootstrap_servers: str,
    metadata_path: Path,
) -> None:
    env = os.environ.copy()
    env.update(
        {
            "TASKS_E2E_DATABASE_URL": database_url,
            "TASKS_KAFKA_BOOTSTRAP_SERVERS": bootstrap_servers,
            "TASKS_KAFKA_TOPIC_VK_COMMANDS": TOPIC,
            "TASKS_KAFKA_TOPIC_VK_COMMANDS_DLQ": DLQ_TOPIC,
            "PYTHONPATH": os.pathsep.join(
                [
                    str(repo_root / "libs/py/common"),
                    str(repo_root / "libs/py/contracts"),
                ]
            ),
        }
    )
    result = subprocess.run(
        [
            "uv",
            "run",
            "--project",
            "services/tasks-service",
            "python",
            "services/tasks-service/tests/_publish_canonical_commands.py",
            str(metadata_path),
        ],
        cwd=repo_root,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr


@pytest.mark.asyncio
async def test_tasks_outbox_to_canonical_vk_runtime_e2e(tmp_path: Path):
    postgres = (
        DockerContainer("postgres:16-alpine")
        .with_env("POSTGRES_USER", "postgres")
        .with_env("POSTGRES_PASSWORD", "postgres")
        .with_env("POSTGRES_DB", "postgres")
        .with_exposed_ports(5432)
    )
    kafka = KafkaContainer(image="apache/kafka:4.1.0")
    postgres.start()
    kafka.start()
    engine = None
    consumer = None
    try:
        host = postgres.get_container_host_ip()
        port = int(postgres.get_exposed_port(5432))
        await _wait_for_postgres(host, port)
        await _create_database(host, port, "tasks_e2e")
        await _create_database(host, port, "vk_e2e")

        tasks_database_url = (
            f"postgresql+asyncpg://postgres:postgres@{host}:{port}/tasks_e2e"
        )
        vk_database_url = (
            f"postgresql+asyncpg://postgres:postgres@{host}:{port}/vk_e2e"
        )
        bootstrap_servers = kafka.get_bootstrap_server()
        await _prepare_kafka(bootstrap_servers)

        engine = create_async_engine(vk_database_url, pool_pre_ping=True)
        sessions = async_sessionmaker(engine, expire_on_commit=False)
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        consumer = AIOKafkaConsumer(
            TOPIC,
            bootstrap_servers=bootstrap_servers,
            group_id=f"p0-p2-e2e-{uuid4()}",
            auto_offset_reset="earliest",
            enable_auto_commit=False,
        )
        await consumer.start()
        repo_root = Path(__file__).resolve().parents[4]
        repeats = int(os.getenv("P0_P2_E2E_REPEATS", "1"))

        for iteration in range(repeats):
            metadata_path = tmp_path / f"command-{iteration}.json"
            await asyncio.to_thread(
                _publish_from_tasks,
                repo_root,
                tasks_database_url,
                bootstrap_servers,
                metadata_path,
            )
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            execution_id = UUID(metadata["executionId"])

            request_message = await consumer.getone(timeout_ms=30000)
            cancel_message = await consumer.getone(timeout_ms=30000)
            request_wire = json.loads(request_message.value)
            cancel_wire = json.loads(cancel_message.value)
            assert request_wire["messageType"] == "vk.execution.requested"
            assert cancel_wire["messageType"] == "vk.execution.cancel_requested"
            assert request_message.key == cancel_message.key == str(
                execution_id
            ).encode()

            producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
            await producer.start()
            try:
                await producer.send_and_wait(
                    TOPIC,
                    key=request_message.key,
                    value=request_message.value,
                    headers=request_message.headers,
                )
            finally:
                await producer.stop()
            duplicate_message = await consumer.getone(timeout_ms=30000)

            command_consumer = VkExecutionCommandsConsumer(
                session_factory=sessions
            )
            await command_consumer.handle_message(request_message.value)
            await command_consumer.handle_message(cancel_message.value)
            await command_consumer.handle_message(duplicate_message.value)

            async with sessions() as session:
                binding = await session.scalar(
                    select(VkTaskRunBinding).where(
                        VkTaskRunBinding.command_execution_id == execution_id
                    )
                )
                demand = await session.scalar(
                    select(VkCollectionDemand).where(
                        VkCollectionDemand.demand_id
                        == UUID(metadata["demandId"])
                    )
                )
                collection = await session.scalar(
                    select(VkSourceCollection).where(
                        VkSourceCollection.source_id
                        == UUID(metadata["sourceId"])
                    )
                )
                execution = await session.scalar(
                    select(VkExecution).where(
                        VkExecution.task_id == metadata["taskId"],
                        VkExecution.run_id == metadata["taskRunId"],
                    )
                )
                processed = await session.scalar(
                    select(func.count()).select_from(ProcessedEvent)
                )

                assert binding is not None and binding.status == "cancelled"
                assert demand is not None and demand.status == "cancelled"
                assert collection is not None and collection.status == "cancelled"
                assert execution is not None and execution.status == "cancelled"
                assert processed == (iteration + 1) * 2
    finally:
        if consumer is not None:
            await consumer.stop()
        if engine is not None:
            await engine.dispose()
        kafka.stop()
        postgres.stop()
