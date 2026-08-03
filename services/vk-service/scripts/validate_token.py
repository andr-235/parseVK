#!/usr/bin/env python3
# ruff: noqa: E402, I001
"""Validate VK provider credentials and inspect the active provider account.

Run via ``uv run python scripts/validate_token.py`` inside the container.
Candidate validation uses its own local scheduler and never consults the
provider account gate: it works while the active account is invalid.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import sys
from pathlib import Path

# The CLI may run before the service is configured: --file supplies the
# credential, so the legacy env-token boot check must not block imports.
os.environ.setdefault("VK_SERVICE_VK_TOKEN", "cli-placeholder")

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

from app.cli.validate_token import (  # noqa: E402
    CAPABILITIES,
    EXIT_AUTH_FAILURE,
    EXIT_INFRA_CONFIG,
    EXIT_OK,
    _failure,
    exit_code_for,
    read_account_status,
    validate_candidate,
)
from app.infrastructure.db.session import SessionLocal  # noqa: E402
from app.infrastructure.secrets.file_provider import FileSecretProvider  # noqa: E402

logger = logging.getLogger("validate_token")

__all__ = [
    "CAPABILITIES",
    "EXIT_AUTH_FAILURE",
    "EXIT_INFRA_CONFIG",
    "EXIT_OK",
    "exit_code_for",
    "read_account_status",
    "validate_candidate",
]


def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )


async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    validate = sub.add_parser("validate-token", help="probe a candidate credential file")
    validate.add_argument("--file", required=True, help="path to the candidate token file")

    sub.add_parser("account-status", help="print the system-vk account status")

    args = parser.parse_args()
    setup_logging()

    if args.command == "validate-token":
        try:
            credential = FileSecretProvider(args.file).load()
            logger.info("validating token display_version=%s", credential.display_version)
            payload = await validate_candidate(credential)
        except Exception as exc:  # noqa: BLE001 - unreadable file is a config error
            payload = _failure(None, exc)
    else:
        try:
            async with SessionLocal() as session:
                payload = await read_account_status(session)
        except Exception as exc:  # noqa: BLE001 - DB failure is infra/config
            payload = _failure(None, exc)
        logger.info("account status=%s", payload["status"])

    print(json.dumps(payload, ensure_ascii=False))
    return exit_code_for(payload)


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
