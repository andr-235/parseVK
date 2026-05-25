#!/bin/bash
# strictly read-only script to print changed files in the current task branch

set -e

# get default branch name (usually main or master)
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@' 2>/dev/null || echo "main")

echo "=== Changed files compared to origin/$DEFAULT_BRANCH ==="
git diff --name-only "origin/$DEFAULT_BRANCH...HEAD"

echo ""
echo "=== Locally modified/unstaged files ==="
git status --porcelain
