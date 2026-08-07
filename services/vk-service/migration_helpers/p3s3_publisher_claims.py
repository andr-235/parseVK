from migration_helpers.p3s3_batch_lifecycle import (
    downgrade_batch_states,
    upgrade_batch_states,
)
from migration_helpers.p3s3_reference_claims import (
    add_reference_claims,
    drop_reference_claims,
)


def add_publication_claims() -> None:
    upgrade_batch_states()
    add_reference_claims()


def drop_publication_claims() -> None:
    drop_reference_claims()
    downgrade_batch_states()
