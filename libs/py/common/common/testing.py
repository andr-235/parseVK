import logging
from typing import AsyncIterator

import pytest
from testcontainers.kafka import KafkaContainer as _KafkaContainer

logger = logging.getLogger(__name__)


class KafkaContainer(_KafkaContainer):
    def get_bootstrap_server(self) -> str:
        return f"{self.get_container_host_ip()}:{self.get_exposed_port(9093)}"


@pytest.fixture(scope="session")
def kafka_bootstrap() -> AsyncIterator[str]:
    with KafkaContainer(image="apache/kafka:4.1.0") as kafka:
        yield kafka.get_bootstrap_server()
