import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()


# scenario: 14 - Two realtime replicas
@pytest.mark.skip(reason="requires two running realtime-service instances")
@pytest.mark.anyio
async def test_two_replicas_both_see_all_events():
    """
    Procedure:
    1. Start two realtime-service instances connected to the same PostgreSQL and Kafka cluster.
    2. Publish a sequence of content.comments_projected and task.state_changed events.
    3. Assert that both instances insert the same events into realtime_events
       (ON CONFLICT DO NOTHING handles duplicates).
    4. Open SSE streams to both instances and verify each client receives every event
       in the same order, with matching sequence_id values.
    """
