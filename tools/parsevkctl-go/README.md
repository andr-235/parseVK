# parsevkctl Go CLI

Canonical Go-only implementation of `parsevkctl`.

```powershell
go test ./...
go run ./cmd/parsevkctl config validate
go run ./cmd/parsevkctl doctor
```

Build a repository-local binary:

```powershell
go build -o bin/parsevkctl.exe ./cmd/parsevkctl
.\bin\parsevkctl.exe config validate
```

The default configuration path from the repository root is
`tools/parsevkctl-go/config.json`. When commands are run from this directory,
the CLI also discovers `config.json` directly.

## Domain model

`internal/domain` contains pure Go types for tasks, issues, pull requests,
project items and lifecycle state. It also owns validation helpers and task
state derivation logic, without dependencies on the CLI, Git, GitHub, Project
adapters or output rendering.

## Task lifecycle

`internal/task` contains pure lifecycle state derivation and transition
validation for task automation. Command handlers use this package to map issue,
project, pull request and branch snapshots into valid task lifecycle actions.

## Planner and executor

`internal/planner` builds side-effect-free operation plans for task lifecycle
commands. A plan describes the intended Git, GitHub and project operations in
stable order and can be serialized to JSON.

The planner does not call Git or GitHub directly. `Executor` applies a plan
serially through the typed `internal/git` and `internal/github` adapters,
stopping at the first failed operation with an operation-scoped error and
recovery hint.

`RenderDryRun` renders the same plan as deterministic human-readable lines
without executing anything.

## Git adapter

`internal/git` centralizes local Git operations. It exposes an adapter interface
for repository actions and currently implements it with a shell-based adapter
that calls `git` directly.

## GitHub adapter

`internal/github` centralizes GitHub operations. It exposes a typed adapter
boundary for issues, pull requests and project status operations, and currently
shells out to `gh` behind that boundary while returning `internal/domain`
types.

## Branch naming

Task branches use this format:

`<type>/issue-<number>-<slug>`

Supported branch types: `feat`, `fix`, `docs`, `refactor`, `test`, `ci`,
`chore`, `perf`, `build`, `hotfix`.

## Read-only commands

```powershell
go run ./cmd/parsevkctl doctor
go run ./cmd/parsevkctl task status 112
go run ./cmd/parsevkctl task sync 112
```

`parsevkctl doctor` checks local configuration, git readability, GitHub CLI read
access and Project status availability where the adapter supports it. Human
output uses `OK`, `WARN` and `FAIL` lines, and critical failures return a
non-zero exit code.

`parsevkctl task status <issue>` shows the issue, Project status, linked pull
request, current branch, expected task branch, working tree state, derived
lifecycle state and suggested next command.

`parsevkctl task sync <issue>` is preview-only. It shows current state, drift
items and suggested safe fixes, but does not update Project status, close
issues, create branches, create PRs or merge anything.

Machine-readable output is available through the global `--json` flag:

```powershell
go run ./cmd/parsevkctl --json doctor
go run ./cmd/parsevkctl --json task status 112
go run ./cmd/parsevkctl --json task sync 112
```

`task sync --apply` is intentionally not implemented yet and returns:

```text
task sync --apply is not implemented in Go yet; this command is preview-only
```

## Write commands

All write commands use `internal/planner` to build operation plans and
`planner.Executor` to apply them through typed Git and GitHub adapters. CLI
handlers do not call `git` or `gh` directly.

```powershell
go run ./cmd/parsevkctl task create "Title" --body "Optional body"
go run ./cmd/parsevkctl task start 113
go run ./cmd/parsevkctl task pr 113
go run ./cmd/parsevkctl task merge 113
```

`task create "Title" --body "..."` creates a GitHub issue, adds it to the
configured Project when supported by the adapter, sets status to `Todo`, and
prints the created issue number and URL. The title is required; the body is
optional. The command does not guess at duplicate issues.

`task start <issue>` loads the issue, validates that it is open, validates the
lifecycle transition to `InProgress`, derives the task branch through
`internal/branch`, sets Project status to `In Progress`, fetches the default
branch, switches to it, pulls with `--ff-only`, and creates the task branch.

`task pr <issue>` validates the current task branch, confirms the branch issue
number matches the requested issue, checks that the working tree is clean and
the branch is ahead of the default branch, pushes the branch, creates a PR with
`Closes #<issue>` in the body, sets Project status to `Review`, switches back
to the default branch and pulls it with `--ff-only`. It keeps the local task
branch after PR creation because that branch is not merged yet. If an open PR
already exists for the same branch/base, the command returns that PR instead of
creating a duplicate.

`task merge <issue>` finds the linked PR, requires exactly one PR, rejects draft
PRs and wrong base branches, respects `merge.requireChecks`, merges the PR,
sets Project status to `Done`, closes the issue if needed, switches to the
default branch when safe, and pulls with `--ff-only`. When
`merge.deleteBranch` is `true`, the merge operation asks GitHub to delete the
remote PR branch and the local task branch is deleted with `git branch -d` when
the command was run from that branch.

Use `--dry-run` with any write command to render the operation plan without
executing it:

```powershell
go run ./cmd/parsevkctl --dry-run task create "Title" --body "Body"
go run ./cmd/parsevkctl --dry-run task start 113
go run ./cmd/parsevkctl --dry-run task pr 113
go run ./cmd/parsevkctl --dry-run task merge 113
```

`--dry-run` must not mutate GitHub issues, Project items, pull requests,
branches, or local git state.

Use `--json` to render machine-readable output where the output layer supports
it:

```powershell
go run ./cmd/parsevkctl --json --dry-run task start 113
go run ./cmd/parsevkctl --json task pr 113
```
