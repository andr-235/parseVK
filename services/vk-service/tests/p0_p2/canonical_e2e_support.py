import asyncio
import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

import asyncpg
from aiokafka.admin import AIOKafkaAdminClient, NewTopic
from testcontainers.core.container import DockerContainer
from testcontainers.kafka import KafkaContainer

TOPIC = "parsevk.vk.commands"
DLQ_TOPIC = "parsevk.vk.commands.dlq"


async def _wait_for_postgres(host: str, port: int) -> None:
    last_error = None
    for _ in range(100):
        try:
            connection = await asyncpg.connect(
                host=host, port=port, user="postgres", password="postgres",
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
        host=host, port=port, user="postgres", password="postgres",
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
            existing = await admin.list_topics()
            missing = [
                NewTopic(name, num_partitions=count, replication_factor=1)
                for name, count in ((TOPIC, 3), (DLQ_TOPIC, 1))
                if name not in existing
            ]
            if missing:
                await admin.create_topics(missing)
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            await asyncio.sleep(0.2)
        finally:
            await admin.close()
    raise RuntimeError("Kafka test container did not become ready") from last_error


@dataclass(slots=True)
class CanonicalE2EInfra:
    postgres: DockerContainer
    kafka: KafkaContainer
    tasks_database_url: str
    vk_database_url: str
    bootstrap_servers: str

    @classmethod
    async def start(cls) -> "CanonicalE2EInfra":
        postgres = (
            DockerContainer("postgres:16-alpine")
            .with_env("POSTGRES_USER", "postgres")
            .with_env("POSTGRES_PASSWORD", "postgres")
            .with_env("POSTGRES_DB", "postgres")
            .with_exposed_ports(5432)
        )
        kafka = KafkaContainer(image="apache/kafka:4.1.0")
        postgres.start()
        kafka_started = False
        try:
            kafka.start()
            kafka_started = True
            host = postgres.get_container_host_ip()
            port = int(postgres.get_exposed_port(5432))
            await _wait_for_postgres(host, port)
            await _create_database(host, port, "tasks_e2e")
            await _create_database(host, port, "vk_e2e")
            bootstrap_servers = kafka.get_bootstrap_server()
            await _prepare_kafka(bootstrap_servers)
            prefix = f"postgresql+asyncpg://postgres:postgres@{host}:{port}"
            return cls(
                postgres=postgres,
                kafka=kafka,
                tasks_database_url=f"{prefix}/tasks_e2e",
                vk_database_url=f"{prefix}/vk_e2e",
                bootstrap_servers=bootstrap_servers,
            )
        except Exception:
            if kafka_started:
                kafka.stop()
            postgres.stop()
            raise

    def stop(self) -> None:
        self.kafka.stop()
        self.postgres.stop()


def publish_from_tasks(
    repo_root: Path,
    infra: CanonicalE2EInfra,
    metadata_path: Path,
    scenario: str,
) -> None:
    uv_binary = shutil.which("uv")
    if uv_binary is None:
        raise RuntimeError("uv executable is required for canonical E2E")
    env = os.environ.copy()
    env.update(
        {
            "TASKS_E2E_DATABASE_URL": infra.tasks_database_url,
            "TASKS_KAFKA_BOOTSTRAP_SERVERS": infra.bootstrap_servers,
            "TASKS_KAFKA_TOPIC_VK_COMMANDS": TOPIC,
            "TASKS_KAFKA_TOPIC_VK_COMMANDS_DLQ": DLQ_TOPIC,
            "PYTHONPATH": os.pathsep.join(
                [str(repo_root / "libs/py/common"), str(repo_root / "libs/py/contracts")]
            ),
        }
    )
    result = subprocess.run(  # noqa: S603 - fixed executable and arguments
        [
            uv_binary, "run", "--project", "services/tasks-service", "python",
            "services/tasks-service/tests/_publish_canonical_commands.py",
            str(metadata_path), scenario,
        ],
        cwd=repo_root,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr
