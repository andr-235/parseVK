#!/bin/bash
# strictly read-only script to query merge status of PR

set -e

PR_NUMBER=$1

if [ -z "$PR_NUMBER" ]; then
  echo "Attempting to detect Pull Request for current branch..."
  gh pr view --json number,state,isDraft,mergeable,statusCheckRollup
else
  echo "Checking status for Pull Request #$PR_NUMBER..."
  gh pr view "$PR_NUMBER" --json number,state,isDraft,mergeable,statusCheckRollup
fi
