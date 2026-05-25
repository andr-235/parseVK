---
name: parsevk-merge-gate
description: Use when deciding whether a parseVK PR is ready to merge; verify open non-draft PR state, correct base, linked issue, scope, checks, secrets, and review blockers. Do not use for implementation, issue drafting, or official GitHub approval.
---

# parseVK Merge Gate

## When to use

Use this skill when deciding whether a parseVK PR can be merged or when checking merge readiness after review.

## When not to use

Do not use this skill to implement fixes, draft issues, create PRs, or submit GitHub approvals.

Do not use it to bypass branch protection, failing checks, unresolved blockers, or missing issue linkage.

## Inputs

- Issue number
- PR number
- PR state and draft status
- base branch
- linked issue reference
- changed files
- checks
- review findings

## Procedure

1. Confirm the PR is open.
2. Confirm the PR is not draft.
3. Confirm the base branch is correct for the task.
4. Confirm the PR links or closes the intended issue.
5. Confirm changed files match the issue scope.
6. Confirm checks are passing or any missing/failing checks are explicitly explained.
7. Scan changed paths and diff for obvious secrets or private config.
8. Confirm there are no blocking review findings.
9. Do not require GitHub approve from the same user.
10. If ready, use `parsevkctl task merge ISSUE_NUMBER` for the lifecycle merge.

## Output format

```md
## Merge gate
- PR open: yes/no
- Draft: yes/no
- Base branch: ok/not ok
- Linked issue: ok/not ok
- Scope: ok/not ok
- Checks: ok/not ok
- Secrets: ok/not ok
- Blockers: none/list

## Decision
Можно мержить / Пока не мержить / Нужно больше проверки
```

## Safety rules

- Never merge from the default branch as a task branch.
- Never merge with unresolved conflicts.
- Never merge obvious secrets, `.env`, private keys, tokens, cookies, or passwords.
- Stop before merge for security/auth changes, deployment changes, migrations, CI/CD changes, or large refactors unless review explicitly clears them.

## Validation expectations

Use actual PR and check data where available. If GitHub checks are unavailable, state that and identify the local validation that supports or limits the decision.
