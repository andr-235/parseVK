# parsevkctl

`parsevkctl` is the local task workflow helper for the `andr-235/parseVK`
repository. The Go CLI in `tools/parsevkctl-go` is the canonical
implementation for task lifecycle commands.

The historical PowerShell entrypoint remains temporarily for compatibility:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task start 123
```

That script is now only a thin legacy wrapper. It resolves a Go binary, forwards
all arguments unchanged, and returns the Go process exit code. It does not
contain task workflow business logic and does not fall back to the old
PowerShell implementation.

## Build the Local Binary

Build the repository-local binary used by the legacy wrapper:

```powershell
.\tools\parsevkctl\build.ps1
```

Equivalent manual command:

```powershell
cd tools/parsevkctl-go
go build -o ../parsevkctl/bin/parsevkctl.exe ./cmd/parsevkctl
```

The wrapper resolves the Go binary in this order:

1. `tools/parsevkctl/bin/parsevkctl.exe`
2. `tools/parsevkctl-go/bin/parsevkctl.exe`
3. `tools/parsevkctl-go/parsevkctl.exe`
4. `parsevkctl` from `PATH`

If no binary is found, the wrapper prints a build command and exits with code
`1`.

## Direct Go Invocation

During development you can run the Go CLI directly:

```powershell
cd tools/parsevkctl-go
go run ./cmd/parsevkctl --help
go run ./cmd/parsevkctl --version
go run ./cmd/parsevkctl config validate
```

After building the local binary, direct invocation from the repository root is
also available:

```powershell
.\tools\parsevkctl\bin\parsevkctl.exe --help
.\tools\parsevkctl\bin\parsevkctl.exe --version
.\tools\parsevkctl\bin\parsevkctl.exe config validate
```

## Legacy PowerShell Invocation

Existing calls continue to work while callers migrate:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 --help
.\tools\parsevkctl\parsevkctl.ps1 --version
.\tools\parsevkctl\parsevkctl.ps1 config validate
.\tools\parsevkctl\parsevkctl.ps1 task start 123
```

The output comes from the Go CLI, not from PowerShell workflow code.

## Requirements

- Go is required to build the local binary.
- GitHub CLI (`gh`) must be installed and authenticated for GitHub operations.
- Git must be installed for branch and repository operations.
- The local configuration in `tools/parsevkctl/config.json` must be valid.
- The working tree must be clean before starting task commands that create or
  update branches.

## Common Commands

Validate configuration:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 config validate
```

Check local environment:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 doctor
```

Start an existing issue and create its branch:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task start 123
```

Create a pull request after committing changes:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task pr 123
```

Merge the linked pull request and finish the issue:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task merge 123
```

Create a new task issue:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task create "Title" --body "Optional body"
```

Show task state or preview drift without writes:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task status 123
.\tools\parsevkctl\parsevkctl.ps1 task sync 123
```

Preview write operations without mutating GitHub or local git state:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 --dry-run task start 123
```

Machine-readable output is available with `--json`:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 --json task status 123
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

Protected branches such as `main`, `master`, and
`fastapi-microservices-rewrite` are never deleted by the Git adapter.

## Migration Status

The Go rewrite is canonical for the documented workflow:

```text
config validate
doctor
task create -> task start -> task status/task sync -> task pr -> task merge
--json output
legacy wrapper delegation
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

Recommended local validation for wrapper migration changes:

```powershell
cd tools/parsevkctl-go
go test ./...
go build ./cmd/parsevkctl

cd ../..
.\tools\parsevkctl\build.ps1
.\tools\parsevkctl\parsevkctl.ps1 --help
.\tools\parsevkctl\parsevkctl.ps1 --version
.\tools\parsevkctl\parsevkctl.ps1 config validate
```
