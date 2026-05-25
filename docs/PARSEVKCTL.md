# parsevkctl

`parsevkctl` is the local task workflow helper for the `andr-235/parseVK`
repository. The CLI is Go-only and lives under `tools/parsevkctl-go`.

The legacy PowerShell wrapper has been removed. Use `go run` during
development or build the local binary under `tools/parsevkctl-go/bin`.

## Configuration

The default configuration file is:

```text
tools/parsevkctl-go/config.json
```

When commands are run from `tools/parsevkctl-go`, the CLI also discovers the
local `config.json` in that directory. You can override discovery with
`--config <path>`.

Merge check enforcement is controlled by:

```json
"merge": {
  "requireChecks": true
}
```

When `merge.requireChecks` is `true`, `task merge` loads the linked pull
request checks through GitHub CLI and allows merge only when at least one check
exists and all checks are successful, skipped, or neutral. Missing checks,
pending checks, failed checks, and unknown check states block the merge with an
actionable error that names the affected checks. When `merge.requireChecks` is
`false`, `task merge` does not enforce PR checks.

## Direct Go Invocation

```powershell
cd tools/parsevkctl-go
go run ./cmd/parsevkctl config validate
go run ./cmd/parsevkctl doctor
go run ./cmd/parsevkctl task start 123
go run ./cmd/parsevkctl task pr 123
go run ./cmd/parsevkctl task merge 123
```

## Build the Local Binary

```powershell
cd tools/parsevkctl-go
go build -o bin/parsevkctl.exe ./cmd/parsevkctl
.\bin\parsevkctl.exe config validate
```

From the repository root, run the built binary as:

```powershell
.\tools\parsevkctl-go\bin\parsevkctl.exe doctor
.\tools\parsevkctl-go\bin\parsevkctl.exe task status 123
```

## Requirements

- Go is required to run or build the CLI.
- GitHub CLI (`gh`) must be installed and authenticated for GitHub operations.
- Git must be installed for branch and repository operations.
- The local configuration in `tools/parsevkctl-go/config.json` must be valid.
- The working tree must be clean before task commands that create or update
  branches.

## Common Commands

Create a new task issue:

```powershell
go run ./cmd/parsevkctl task create "Title" --body "Optional body"
```

Start an existing issue and create its branch:

```powershell
go run ./cmd/parsevkctl task start 123
```

`task start` requires an open issue with `ai:ready`, a clean worktree, and no
existing local or remote target branch. It creates
`ai/mbp-<issue-number>-<slug>` and replaces `ai:ready` with
`ai:in-progress`.

Create a pull request after committing changes:

```powershell
go run ./cmd/parsevkctl task pr 123
```

Merge the linked pull request and finish the issue:

```powershell
go run ./cmd/parsevkctl task merge 123
```

Show task state or preview drift without writes:

```powershell
go run ./cmd/parsevkctl task status 123
go run ./cmd/parsevkctl task sync 123
```

Preview write operations without mutating GitHub or local git state:

```powershell
go run ./cmd/parsevkctl --dry-run task start 123
```

Machine-readable output is available with `--json`:

```powershell
go run ./cmd/parsevkctl --json task status 123
```

## Kanban Flow

Tasks move through these statuses:

```text
Todo -> In Progress -> Review -> Done
```

- `Todo`: issue is created and added to the project.
- `In Progress`: task is started and a task branch is created.
- `Review`: pull request is open and ready for review.
- `Done`: pull request is merged and the issue is closed.

## Post-PR and Post-Merge Cleanup

`task pr <issue>` creates the PR, moves the Project item to `Review`, then
switches back to the configured default branch and pulls it with `--ff-only`.
It does not delete the local task branch at PR time because the branch is not
merged yet.

`task merge <issue>` merges the linked PR and passes `--delete-branch` to
GitHub CLI when `merge.deleteBranch` is `true`. If the command is run from the
PR head branch, it switches back to the configured default branch, pulls with
`--ff-only`, and deletes the local task branch with `git branch -d`.

If `merge.requireChecks` is `true`, `task merge` checks the linked PR before
building the merge plan. It blocks PRs with no checks, pending checks, failed
checks, or unknown check states. Successful, skipped, and neutral checks are
accepted. The project config currently keeps `merge.requireChecks` set to
`false`; enabling it should be a separate rollout after CI is stable.

Protected branches such as `main`, `master`, and
`fastapi-microservices-rewrite` are never deleted by the Git adapter.

## Migration Status

The Go CLI is canonical for the documented workflow:

```text
config validate
doctor
task create -> task start -> task status/task sync -> task pr -> task merge
--json output
```

The remaining known limitation is intentional: `task sync <issue>` is
preview/read-only. `task sync <issue> --apply` is not part of the completed
migration surface and exits with a preview-only error.

## Branch Naming

Task branches use this format:

```text
<type>/issue-<number>-<slug>
```

Supported branch types: `feat`, `fix`, `docs`, `refactor`, `test`, `ci`,
`chore`, `perf`, `build`, `hotfix`.

## Validation

Recommended local validation:

```powershell
cd tools/parsevkctl-go
go test ./...
go build -o bin/parsevkctl.exe ./cmd/parsevkctl
.\bin\parsevkctl.exe config validate
.\bin\parsevkctl.exe doctor
```

## CI

The `parsevkctl` Go CLI is validated by
`.github/workflows/parsevkctl.yml`. The workflow runs Go tests, builds
`bin/parsevkctl.exe`, validates config discovery, and blocks stale references
to the removed PowerShell wrapper. `doctor` remains a manual/local validation
command because it depends on local git state, authenticated GitHub CLI access,
and GitHub Project permissions.
