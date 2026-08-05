"""One-time repository patch for the VK hard cutover."""

from pathlib import Path


def replace_required(text: str, old: str, new: str, name: str) -> str:
    if old not in text:
        raise RuntimeError(f"{name} marker not found")
    return text.replace(old, new, 1)


def patch_compose() -> bool:
    path = Path("docker-compose.yml")
    text = path.read_text(encoding="utf-8")
    original = text
    for line in (
        "      VK_SERVICE_VK_TOKEN: ${VK_SERVICE_VK_TOKEN:-${VK_TOKEN:-dev-vk-token}}\n",
        "      VK_SERVICE_DEFAULT_GROUP_IDS: '${VK_SERVICE_DEFAULT_GROUP_IDS:-[1]}'\n",
        "      VK_SERVICE_VK_TOKEN: ${VK_SERVICE_VK_TOKEN:-${VK_TOKEN:-}}\n",
        "      # Preferred secret path: mount the token file and point VK_SERVICE_TOKEN_FILE at it.\n",
        "      # Example with a top-level secrets section:\n",
        "      #   secrets:\n",
        "      #     vk_token_file:\n",
        "      #       file: ./secrets/vk_token\n",
        "      # then add `secrets: [vk_token_file]` to this service and set\n",
        "      # VK_SERVICE_TOKEN_FILE: /run/secrets/vk_token\n",
    ):
        text = text.replace(line, "")
    text = text.replace(
        "      VK_SERVICE_TOKEN_FILE: ${VK_SERVICE_TOKEN_FILE:-}\n",
        "      VK_SERVICE_TOKEN_FILE: /run/secrets/vk_token\n",
    )

    migrate_marker = (
        "      VK_SERVICE_DATABASE_URL: ${VK_SERVICE_DATABASE_URL:-"
        "postgresql+asyncpg://vk:vk_dev_password_change_me@vk-db:5432/vk}\n"
        "      UV_CACHE_DIR: /tmp/uv-cache\n"
        "    command: [\"uv\", \"run\", \"alembic\", \"upgrade\", \"head\"]\n"
    )
    if "VK_SERVICE_TOKEN_FILE: /run/secrets/vk_token\n      UV_CACHE_DIR" not in text:
        text = replace_required(
            text,
            migrate_marker,
            migrate_marker.replace(
                "      UV_CACHE_DIR",
                "      VK_SERVICE_TOKEN_FILE: /run/secrets/vk_token\n"
                "      UV_CACHE_DIR",
            ).replace(
                "    command:",
                "    secrets:\n      - vk_token\n    command:",
            ),
            "vk-migrate",
        )

    service_marker = (
        "      VK_SERVICE_OK_APPLICATION_SECRET_KEY: ${VK_SERVICE_OK_APPLICATION_SECRET_KEY:-}\n"
        "      OTEL_EXPORTER_OTLP_ENDPOINT: http://jaeger:4318\n"
        "    healthcheck:\n"
    )
    if "    secrets:\n      - vk_token\n    healthcheck:" not in text:
        text = replace_required(
            text,
            service_marker,
            service_marker.replace(
                "    healthcheck:",
                "    secrets:\n      - vk_token\n    healthcheck:",
            ),
            "vk-service",
        )

    topic_marker = (
        "      /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 "
        "--create --if-not-exists --topic parsevk.vk.events --partitions 3 "
        "--replication-factor 1;\n"
    )
    if "--topic parsevk.vk.commands " not in text:
        text = replace_required(
            text,
            topic_marker,
            topic_marker
            + "      /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 "
            "--create --if-not-exists --topic parsevk.vk.commands --partitions 3 "
            "--replication-factor 1;\n",
            "canonical VK topic",
        )

    dlq_marker = (
        "      /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 "
        "--create --if-not-exists --topic parsevk.vk.dlq --partitions 3 "
        "--replication-factor 1;\n"
    )
    if "--topic parsevk.vk.commands.dlq " not in text:
        text = replace_required(
            text,
            dlq_marker,
            dlq_marker
            + "      /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 "
            "--create --if-not-exists --topic parsevk.vk.commands.dlq --partitions 3 "
            "--replication-factor 1;\n",
            "canonical VK DLQ",
        )

    if "\nsecrets:\n  vk_token:\n" not in text:
        text = replace_required(
            text,
            "\nnetworks:\n",
            "\nsecrets:\n"
            "  vk_token:\n"
            "    file: ${VK_TOKEN_FILE:-./secrets/vk_token}\n"
            "\nnetworks:\n",
            "top-level networks",
        )

    for forbidden in (
        "VK_SERVICE_VK_TOKEN",
        "VK_SERVICE_DEFAULT_GROUP_IDS",
        "${VK_TOKEN:",
    ):
        if forbidden in text:
            raise RuntimeError(f"legacy Compose setting remains: {forbidden}")
    path.write_text(text, encoding="utf-8")
    return text != original


def patch_security_workflow() -> bool:
    path = Path(".github/workflows/security.yml")
    text = path.read_text(encoding="utf-8")
    if "\nconcurrency:\n" in text:
        return False
    updated = text.replace(
        "name: Security Scanning\n",
        "name: Security Scanning\n\n"
        "concurrency:\n"
        "  group: security-${{ github.workflow }}-${{ github.ref }}\n"
        "  cancel-in-progress: true\n",
        1,
    )
    path.write_text(updated, encoding="utf-8")
    return True


if __name__ == "__main__":
    changed = patch_compose() | patch_security_workflow()
    print("hard cutover patch applied" if changed else "already canonical")
