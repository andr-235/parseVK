---
name: parsevk-codex-implementation
description: Use when implementing a scoped parseVK GitHub Issue with Codex; follow the linked issue, preserve scope, run relevant validation, and produce a final handoff. Do not use for issue drafting, PR review, merge approval, or unrelated refactors.
---

# parseVK Codex Implementation

## When to use

Use this skill when Codex is implementing an existing parseVK GitHub Issue.

The GitHub Issue is the source of truth for the task. The PR is the implementation artifact.

## When not to use

Do not use this skill for creating the issue, reviewing another PR, deciding whether to merge, or making broad refactors outside the issue scope.

Do not use it when the current branch does not match the issue branch, the working tree contains unrelated changes that would be touched, or the task requires secrets or production access.

## Inputs

- Issue number and body
- Current branch and git status
- Acceptance criteria
- Out-of-scope section
- Relevant validation commands

## Procedure

1. Read the issue before editing.
2. Confirm the branch matches the task and is not a default branch.
3. Inspect the working tree and avoid user changes unrelated to the issue.
4. Implement only the requested scope.
5. Respect the out-of-scope section.
6. Avoid unrelated refactors, formatting churn, dependency changes, and service changes.
7. Keep `parsevkctl` deterministic and thin; do not add AI reasoning as CLI behavior.
8. Run relevant validation commands from project metadata such as `package.json`, `pyproject.toml`, `Makefile`, or task instructions.
9. Never claim tests or checks passed unless they actually ran and completed successfully.
10. Commit with a Conventional Commit subject in English and include issue links in the body when appropriate.
11. Create the PR through `parsevkctl task pr ISSUE_NUMBER` when implementation and validation are ready.

## Output format

Final handoff must include:

```md
## Summary
- ...

## Changed files
- ...

## Validation
- `command` - result

## Risks
- ...

## Not done
- ...

## Next
- ...
```

## Safety rules

- Do not modify application services unless the issue explicitly requires it.
- Do not modify frontend, Docker, database, CI/CD, or GitHub Actions unless explicitly in scope.
- Do not include `.env`, secrets, tokens, keys, cookies, or private config.
- Do not run destructive git commands.
- Do not mix unrelated tasks in one PR.

## Validation expectations

Prefer focused checks that match the changed files. If checks cannot run, state the exact command attempted, the failure reason, and the impact on confidence.
