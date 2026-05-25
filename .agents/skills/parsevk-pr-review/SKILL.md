---
name: parsevk-pr-review
description: Use when reviewing a parseVK Pull Request in chat before any GitHub review; inspect PR metadata, linked issue, changed files, validation evidence, and scope fit. Do not use to implement fixes, merge PRs, or submit an official GitHub review unless explicitly requested.
---

# parseVK PR Review

## When to use

Use this skill when the user asks Codex or ChatGPT to review a parseVK PR, inspect PR readiness, or provide merge guidance.

Review findings in chat first. Do not write a GitHub PR review unless the user explicitly asks for it.

For detailed workflow guidance, read `references/PR_REVIEW_WORKFLOW.md`.

## When not to use

Do not use this skill to implement requested fixes, merge the PR, create an official GitHub approval, or review unrelated branches without a PR.

Do not treat an approval from the same GitHub user as required for merge readiness.

## Inputs

- PR number or URL
- Linked GitHub Issue
- PR title and body
- Changed files and diff
- Validation evidence from the PR body, comments, checks, or local commands

## Procedure

1. Inspect PR metadata: state, draft status, base branch, head branch, title, body, and linked issue.
2. Inspect the linked issue and compare scope, out-of-scope rules, acceptance criteria, and labels.
3. Inspect changed files and diff.
4. Verify that changes match the issue scope.
5. Check validation evidence. Distinguish checks that ran from checks merely listed.
6. Look for secrets, risky config changes, CI/CD changes, auth/security changes, migrations, and broad refactors.
7. Separate blocking findings from non-blocking notes.
8. Give one final verdict:
   - Можно мержить
   - Пока не мержить
   - Нужны правки
   - Нужно больше проверки

## Output format

```md
## Verdict
...

## Blockers
- ...

## Notes
- ...

## Validation
- ...

## Scope check
- ...
```

If there are no blockers, say that clearly.

## Safety rules

- Chat-first review is mandatory.
- Do not submit a GitHub review without explicit user request.
- Do not require GitHub approve from the same user.
- Do not ignore out-of-scope file changes.
- Do not approve PRs with obvious secrets or unexplained failing checks.

## Validation expectations

Prefer direct evidence from PR checks, local validation output, and changed files. If evidence is missing, mark it as missing instead of assuming checks passed.
