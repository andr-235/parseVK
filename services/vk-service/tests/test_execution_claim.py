import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path  # noqa: E402

use_service_path()

from app.domain.entities.executions import VkExecutionClaim  # noqa: E402


def test_claim_exposes_execution_plan_snapshot():
    plan = {
        "source": {
            "provider": "vk",
            "sourceType": "community",
            "externalId": "212709808",
            "ownerId": -212709808,
        }
    }
    claim = VkExecutionClaim(
        execution=SimpleNamespace(plan_snapshot=plan),
        attempt=object(),
    )

    assert claim.plan_snapshot is plan
