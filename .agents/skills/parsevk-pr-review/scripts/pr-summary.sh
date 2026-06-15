#!/bin/bash
# strictly read-only script to collect PR metadata

set -e

PR_NUMBER=$1

if [ -z "$PR_NUMBER" ]; then
  echo "Attempting to detect Pull Request for current branch..."
  # gh pr view returns info about current branch PR if no number is specified
  gh pr view --json number,title,body,baseRefName,headRefName,isDraft,mergeable,state
else
  echo "Fetching Pull Request #$PR_NUMBER..."
  gh pr view "$PR_NUMBER" --json number,title,body,baseRefName,headRefName,isDraft,mergeable,state
fi
