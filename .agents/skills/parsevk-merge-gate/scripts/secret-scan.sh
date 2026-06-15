#!/bin/bash
# strictly read-only script to scan diff for potential credentials/secrets before merge

set -e

DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@' 2>/dev/null || echo "main")

echo "=== Pre-merge scan of git diff against origin/$DEFAULT_BRANCH for secrets ==="

git diff "origin/$DEFAULT_BRANCH...HEAD" | grep -E "^\+\s*(vk_token|token|password|secret|api_key|private_key|auth_key|cookie)\s*=" || echo "No obvious credentials in assignments."

echo ""
echo "=== Scanning for raw keys/certificates in diff ==="
git diff "origin/$DEFAULT_BRANCH...HEAD" | grep -E "BEGIN (RSA|EC|PRIVATE|OPENSSH) KEY" || echo "No raw keys or certificates found."
