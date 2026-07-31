#!/usr/bin/env python3
"""Apply the release-gate checkout isolation repair on a temporary branch."""

from __future__ import annotations

import json
from pathlib import Path

CHECKOUT_BEFORE = '''          sparse-checkout-cone-mode: false
          persist-credentials: false

      - name: Stage trusted release resolver
        shell: bash
        run: cp .github/scripts/latest_release.py "$RUNNER_TEMP/latest_release.py"
'''
CHECKOUT_AFTER = '''          sparse-checkout-cone-mode: false
          persist-credentials: false
          path: trusted-release-resolver

      - name: Stage trusted release resolver
        shell: bash
        run: cp trusted-release-resolver/.github/scripts/latest_release.py "$RUNNER_TEMP/latest_release.py"
'''

EXPECTED_BLOCKS = {
    Path(".github/workflows/ci.yml"): 1,
    Path(".github/workflows/security.yml"): 1,
    Path(".github/workflows/publish-release-images.yml"): 2,
}

TEST_MARKER = "Release resolver checkout isolation and non-product release scopes are valid"
TEST_INSERTION = r'''

require_pattern "$CI" 'path: trusted-release-resolver' \
  "Full Release CI trusted resolver checkout is not isolated"
require_pattern "$CI" 'cp trusted-release-resolver/\.github/scripts/latest_release\.py' \
  "Full Release CI stages resolver from the isolated checkout"
require_pattern "$SECURITY" 'path: trusted-release-resolver' \
  "Security trusted resolver checkout is not isolated"
require_pattern "$SECURITY" 'cp trusted-release-resolver/\.github/scripts/latest_release\.py' \
  "Security stages resolver from the isolated checkout"

publish_resolver_paths="$(grep -c 'path: trusted-release-resolver' "$PUBLISH")"
publish_resolver_stages="$(grep -c 'cp trusted-release-resolver/\.github/scripts/latest_release\.py' "$PUBLISH")"
[[ "$publish_resolver_paths" -eq 2 ]] || {
  echo "Publisher must isolate both trusted resolver checkouts"; exit 1;
}
[[ "$publish_resolver_stages" -eq 2 ]] || {
  echo "Publisher must stage both resolvers from isolated checkouts"; exit 1;
}

python3 - "$RELEASE_CONFIG" <<'PY_RELEASE_RULES'
import json
import sys

config = json.load(open(sys.argv[1], encoding="utf-8"))
analyzer = next(
    plugin for plugin in config["plugins"]
    if isinstance(plugin, list) and plugin[0] == "@semantic-release/commit-analyzer"
)
rules = {
    rule.get("scope"): rule.get("release")
    for rule in analyzer[1].get("releaseRules", [])
}
expected = {"ai-review": False, "ci": False, "deploy": False}
if any(rules.get(scope) is not release for scope, release in expected.items()):
    raise SystemExit(f"Missing non-product release rules: expected={expected}, actual={rules}")
PY_RELEASE_RULES

echo "Release resolver checkout isolation and non-product release scopes are valid"
'''


def isolate_checkouts() -> None:
    for path, expected_count in EXPECTED_BLOCKS.items():
        text = path.read_text(encoding="utf-8")
        actual_count = text.count(CHECKOUT_BEFORE)
        if actual_count != expected_count:
            raise RuntimeError(
                f"{path}: expected {expected_count} vulnerable checkout blocks, "
                f"found {actual_count}"
            )
        path.write_text(
            text.replace(CHECKOUT_BEFORE, CHECKOUT_AFTER),
            encoding="utf-8",
        )


def configure_release_rules() -> None:
    path = Path(".releaserc.json")
    config = json.loads(path.read_text(encoding="utf-8"))
    plugins = config["plugins"]
    try:
        index = plugins.index("@semantic-release/commit-analyzer")
    except ValueError as error:
        raise RuntimeError("plain commit-analyzer plugin entry not found") from error
    plugins[index] = [
        "@semantic-release/commit-analyzer",
        {
            "releaseRules": [
                {"scope": "ai-review", "release": False},
                {"scope": "ci", "release": False},
                {"scope": "deploy", "release": False},
            ]
        },
    ]
    path.write_text(
        json.dumps(config, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def extend_contracts() -> None:
    path = Path("scripts/test-release-workflow.sh")
    text = path.read_text(encoding="utf-8")
    if TEST_MARKER in text:
        return
    final_echo = (
        'echo "Incremental CI, confirmed exact full release gates and immutable '
        'publication contracts are valid"\n'
    )
    if final_echo not in text:
        raise RuntimeError("release workflow test final marker not found")
    path.write_text(
        text.replace(final_echo, TEST_INSERTION + "\n" + final_echo),
        encoding="utf-8",
    )


def main() -> None:
    isolate_checkouts()
    configure_release_rules()
    extend_contracts()


if __name__ == "__main__":
    main()
