"""Tests for alembic migration graph linearization.

Verifies the migration revision chain has exactly one head and no
forks/branches.  All operations are static (file metadata only) —
no database connection is required.
"""

from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory

# This file: tests/test_migrations.py → project root is two levels up.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_ALEMBIC_CFG_PATH = _PROJECT_ROOT / "alembic.ini"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_script() -> ScriptDirectory:
    """Build an Alembic *ScriptDirectory* from the project's ``alembic.ini``."""
    alembic_cfg = Config(str(_ALEMBIC_CFG_PATH))
    return ScriptDirectory.from_config(alembic_cfg)


def _walk_chain(script: ScriptDirectory, head: str) -> list[str]:
    """Walk from *head* backwards through *down_revision* to the root."""
    chain: list[str] = []
    rev_id: str | None = head
    while rev_id is not None:
        chain.append(rev_id)
        rev = script.get_revision(rev_id)
        rev_id = rev.down_revision
    return chain


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_single_head() -> None:
    """The migration graph must have exactly one head."""
    script = _get_script()
    heads = script.get_heads()

    assert len(heads) == 1, (
        f"Expected exactly 1 migration head, got {len(heads)}: {heads}. "
        "This usually indicates a fork in the revision chain."
    )


def test_linear_chain() -> None:
    """Walk from the head to root and verify every revision is visited.

    If the chain length matches the total number of revisions the graph
    is a simple linear chain.  A shorter chain means some revisions are
    on a side branch that does not lead to the single head.
    """
    script = _get_script()
    heads = script.get_heads()

    # Chain length for a linear graph without branches.
    chain = _walk_chain(script, heads[0])
    chain_len = len(chain)

    # Total distinct revisions in the graph.
    all_revisions = list(script.walk_revisions())
    total = len(all_revisions)

    assert chain_len == total, (
        f"Chain length ({chain_len}) does not match total revisions ({total}). "
        "The migration graph contains a fork or orphan revision. "
        f"Chain: {' → '.join(chain)}"
    )


def test_20260720_0001_down_revision_is_pr5() -> None:
    """Verify ``20260720_0001`` directly depends on ``pr5_unify_consumer_name_im``.

    Before the linearization fix this revision pointed to ``20260626_0004``,
            which created a fork.
    """
    script = _get_script()
    rev = script.get_revision("20260720_0001")

    assert rev is not None, "Revision 20260720_0001 not found in the migration graph."
    assert rev.down_revision == "pr5_unify_consumer_name_im", (
        f"Expected down_revision='pr5_unify_consumer_name_im', "
        f"got {rev.down_revision!r}. "
        "If the value is '20260626_0004' the old fork has been reintroduced."
    )


def test_all_revisions_listed() -> None:
    """Sanity check: every known migration is present in the graph.

    This test explicitly lists every migration file in the expected chain
            and fails if anything is missing or out of order.
    """
    expected_chain = [
        "20260608_0001",
        "20260623_0001",
        "20260626_0001",
        "20260626_0002",
        "20260626_0003",
        "20260626_0004",
        "pr5_unify_consumer_name_im",
        "20260720_0001",
        "20260720_0002",
        "20260720_0003",
    ]

    script = _get_script()
    heads = script.get_heads()
    actual_chain = _walk_chain(script, heads[0])

    # _walk_chain goes head → root; reverse for root → head.
    actual_chain.reverse()

    assert actual_chain == expected_chain, (
        f"Migration chain mismatch.\n"
        f"  Expected: {expected_chain}\n"
        f"  Actual:   {actual_chain}"
    )
