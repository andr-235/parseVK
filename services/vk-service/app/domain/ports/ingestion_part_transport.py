from typing import Protocol


class IngestionPartTransport(Protocol):
    async def send_and_wait(
        self,
        topic: str,
        *,
        value: bytes,
        key: bytes,
        headers: list[tuple[str, bytes]],
    ) -> object: ...
