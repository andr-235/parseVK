#!/usr/bin/env python3
"""Validate Alembic migration graph has exactly one head.

Exit codes:
    0 — single head detected (healthy).
    1 — zero or multiple heads detected (broken graph).
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def main() -> None:
    # Resolve alembic.ini relative to this script so the script works
    # when executed from any working directory.
    service_root = Path(__file__).resolve().parent.parent
    alembic_cfg = Config(str(service_root / "alembic.ini"))

    script = ScriptDirectory.from_config(alembic_cfg)
    heads = script.get_heads()

    head_count = len(heads)

    if head_count == 1:
        logger.info(
            "Alembic graph validation PASSED: exactly 1 head — %s",
            heads[0],
        )
        sys.exit(0)

    if head_count == 0:
        logger.error("Alembic graph validation FAILED: no heads found (empty graph?).")
        sys.exit(1)

    # head_count > 1
    logger.error(
        "Alembic graph validation FAILED: %d heads detected — %s",
        head_count,
        ", ".join(heads),
    )
    sys.exit(1)


if __name__ == "__main__":
    main()
