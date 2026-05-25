# parseVK PR Review Workflow

This workflow defines how Codex or ChatGPT should review parseVK Pull Requests.

## Core rule

Review happens in chat first. Do not submit an official GitHub PR review, approval, or request changes unless the user explicitly asks for that GitHub action.

## Review inputs

Collect:

- PR number or URL
- PR state and draft status
- base branch and head branch
- PR title and body
- linked issue and `Closes #...` reference
- changed files
- diff
- validation evidence
- check status

## Scope review

Compare the PR against the linked issue:

- Goal
- Scope
- Out of Scope
- Acceptance Criteria
- Validation
- Risk
- Required Handoff

Flag any changed file that is not explained by the issue. Application services, frontend, Docker, database, CI/CD, and GitHub Actions require explicit issue scope.

## Validation review

Separate evidence from claims:

- Passing GitHub checks are evidence.
- Local command output is evidence.
- PR body checkboxes are claims unless paired with output or check results.
- Missing validation must be called out.
- Failed or pending checks block merge unless explicitly explained and accepted.

## Risk review

Look for:

- secrets, tokens, keys, cookies, private config, or `.env` files
- authentication or authorization changes
- database migrations or schema changes
- deployment or CI/CD changes
- broad refactors
- generated files or lockfile changes outside scope
- unrelated service changes

## Findings

Use blockers for issues that should prevent merge:

- scope mismatch
- missing required validation
- failing checks
- likely bug or regression
- security or secret exposure
- unsafe merge state

Use notes for non-blocking observations:

- naming, clarity, small cleanup
- optional follow-up
- documentation polish
- test coverage suggestions when risk is low

## Final verdicts

Use exactly one:

- `Можно мержить` - no blockers, scope fits, validation is adequate.
- `Пока не мержить` - clear blocker prevents merge.
- `Нужны правки` - implementation changes are required before merge.
- `Нужно больше проверки` - no definite code blocker, but validation evidence is insufficient.

## Output template

```md
## Verdict
<one verdict>

## Blockers
- <none or list>

## Notes
- <none or list>

## Validation
- <checks reviewed and missing evidence>

## Scope check
- <whether changed files match issue scope>
```

## GitHub review actions

Only after explicit user request, convert the chat review into a GitHub PR review. Keep the GitHub review concise and do not change the verdict unless new evidence appears.
