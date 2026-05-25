# AI Pull Request Review Workflow

This workflow separates local ChatGPT review from GitHub review actions. It
keeps repository review state intentional and avoids accidental approvals or
change requests.

## Review Order

Start with ChatGPT review in the local Codex session.

The AI reviewer should inspect the diff, check the issue scope, and report
findings in the chat first. Do not submit a GitHub PR review until the user
explicitly asks for it.

Recommended local checks:

```powershell
git diff --name-only
git diff
```

Run any validation commands required by the issue or PR body before making a
merge recommendation.

## GitHub Review Requires Explicit Command

Only submit a GitHub review after the user gives an explicit instruction such
as:

```text
approve this PR on GitHub
request changes on GitHub
leave a GitHub review comment
```

General review requests, such as "review this PR", mean review in chat only.

## Review Outcomes

Use GitHub review states carefully:

- Approve only when the PR matches the issue scope, validation is sufficient,
  risks are acceptable, and no blocking findings remain.
- Request changes when there is a blocking correctness, security, scope, or
  validation issue that must be fixed before merge.
- Comment only when feedback is non-blocking, informational, or needs human
  judgment.

When in doubt, comment in chat first and ask the user before changing GitHub
review state.

## Merge Recommendation Rules

Recommend merge only when:

- the PR includes `Closes #ISSUE_NUMBER`
- the PR is not a draft
- changed files match the issue scope
- local validation was run or skipped with a clear reason
- GitHub checks passed, if checks exist
- no secrets, local environment files, or private configuration were added
- no application code was changed for documentation-only tasks
- no blocking review findings remain

Do not recommend merge when the PR changes GitHub Actions workflows,
deployment configuration, authentication or security logic, secrets,
environment configuration, database migrations, or a large refactor unless the
user explicitly confirms that review and merge should proceed.

## Review Handoff

Every review summary should include:

- blocking findings, if any
- non-blocking notes, if useful
- validation reviewed
- risk assessment
- clear recommendation: approve, request changes, comment only, or hold

Keep the recommendation tied to the issue scope and validation evidence.
