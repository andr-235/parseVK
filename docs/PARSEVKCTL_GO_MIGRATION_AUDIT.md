# parsevkctl Go Migration Audit

Audit date: 2026-05-23.

## Scope

Issue #126 audited the final Go rewrite migration surface for `parsevkctl`.
The Go CLI is the canonical implementation; the PowerShell entrypoint at
`tools/parsevkctl/parsevkctl.ps1` is a legacy wrapper that delegates to the Go
binary and preserves its exit code.

## Command Parity

Verified workflow surface:

- `parsevkctl config validate`
- `parsevkctl doctor`
- `parsevkctl task create "Title" --body "..."`
- `parsevkctl task start <issue>`
- `parsevkctl task status <issue>`
- `parsevkctl task sync <issue>` as preview/read-only
- `parsevkctl task pr <issue>`
- `parsevkctl task merge <issue>`
- `parsevkctl --json ...`
- `tools/parsevkctl/parsevkctl.ps1 ...`

`task sync --apply` remains intentionally unsupported. It is not required for
the completed migration because `task sync` is documented as preview/read-only.

## Architecture Audit

- Direct `git` shell calls are limited to `internal/git`.
- Direct `gh` shell calls are limited to `internal/github`.
- `internal/planner` remains side-effect free and only returns operation plans.
- Write operations are applied by `planner.Executor` through typed adapters.
- Project operations are implemented through GitHub CLI project commands and
are exercised by `doctor`, `task status`, `task start`, `task pr`, and
`task merge`.

## Fixed Gaps

- `task pr` now switches back to the configured default branch after PR
  creation and pulls it with `--ff-only`.
- `task pr` now leaves the local task branch in place because deleting an
  unmerged PR branch is not safe.
- `task merge` deletes the local task branch when run from the PR head branch
  and `merge.deleteBranch` is enabled.
- `doctor` now checks Project Status field availability directly instead of
  probing a hard-coded issue item.

## Remaining Gaps

No blocking migration gaps were found for the documented core workflow:

```text
create -> start -> pr -> merge
```

Known limitations:

- `task sync --apply` is intentionally preview-only and should remain a
  separate future feature if write-based drift repair is needed.
- `merge.requireChecks=true` still requires a check-status adapter before fully
  automated merges can enforce CI status from Go. Current project config has
  `merge.requireChecks=false`, so this does not block the current workflow.
