# parsevkctl

`parsevkctl` is the local task workflow helper for the `andr-235/parseVK` repository.
It keeps GitHub Issues, the GitHub Project board, git branches, and pull requests in
one predictable flow.

## Requirements

- GitHub CLI (`gh`) must be installed and authenticated.
- The working tree must be clean before starting a task that creates a branch.
- The local configuration in `tools/parsevkctl/config.json` must be valid.
- Run commands from the repository root:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 ...
```

## Configuration Validation

`parsevkctl` validates `tools/parsevkctl/config.json` before performing any task-related actions (e.g., creating issues, switching branches, creating PRs). This validation checks if all required fields are present and correctly formatted, preventing errors during remote network calls.

You can manually trigger validation at any time:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 config validate
```

Validation ensures:
- `repo` is in `owner/name` format.
- `projectNumber` is an integer.
- `statuses` and other fields are non-empty strings.
- `merge.requireChecks` and `merge.allowAutoMerge` are booleans.

## Environment Diagnostics (Doctor)

Before starting work or troubleshooting setup issues, you can run a preflight environment check to verify if the local machine and repository are fully ready for `parsevkctl`:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task doctor
```

This read-only command performs the following checks:
- GitHub CLI (`gh`) is installed.
- Git is installed.
- GitHub CLI is successfully authenticated (`gh auth status`).
- The command is executed inside a Git worktree.
- The `origin` remote exists.
- The local repository matches the repository configured in `config.json`.
- The `config.json` configuration file loads and is valid.
- The default branch exists locally or on remote origin.
- The GitHub Project is present and accessible.
- The Project has the `Status` field available.
- The required statuses (`Todo`, `In Progress`, `Review`, `Done`) exist in the project.
- Shows the current working tree clean/dirty status.

Diagnostics output uses human-readable `[OK]`, `[WARN]`, and `[FAIL]` status markers. The command returns:
- `Result: READY` (exit code 0) if all checks passed (warnings like a dirty working tree are non-critical).
- `Result: NOT READY` (exit code 1) if any critical check fails.

## Kanban flow

Tasks move through these statuses:

```text
Todo -> In Progress -> Review -> Done
```

- `Todo`: issue is created and added to the project.
- `In Progress`: task is started and a task branch is created.
- `Review`: pull request is open and ready for review.
- `Done`: pull request is merged and the issue is closed.

## Branch Naming Convention

When starting a task, a Git branch is created using the following enterprise-grade format:

```text
<type>/issue-<number>-<slug>
```

- **Allowed Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `chore`, `perf`, `build`, `hotfix`.
- **Type Resolution**:
  1. Uses the issue label if it has the format `type: <type>` (e.g., `type: feat`).
  2. Otherwise, uses the title prefix if it exists (e.g., `fix: fix bug`).
  3. Defaults to `feat` if no type is matched.
- **Slug Rules**: The issue title (excluding any matched prefix) is converted to lowercase kebab-case, Cyrillic characters are transliterated to Latin, all non-alphanumeric characters (except single dashes) are removed, and the slug is truncated to a maximum of 48 characters with no leading/trailing dashes.

## Common workflow

Start a new task, create the issue, add it to the project, assign it to yourself, and
create a branch:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task full "Task title" -Body "Task description" -AssignMe
```

Start an existing issue and create its branch:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task start 66
```

Create a pull request after committing changes:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task pr 66
```

Check task diagnostics without changing GitHub or local git state:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task status 66
```

The status command prints the issue number, title, state, URL, current Project
status, linked PR details when a PR is found, the current local branch, and the
clean/dirty state of the working tree. If the issue is not visible in the
Project, it prints a warning and continues. If no linked PR is found, it prints
`Linked PR: none`.

The PR command pushes the current branch, creates a pull request with a structured enterprise-grade body template, moves the project card to `Review`, switches back to the configured default branch, pulls it with `git pull --ff-only origin <defaultBranch>`, and deletes only the local feature branch. If the working tree is not clean after PR creation, the local branch is kept and a warning is printed.

### PR Body Template

The generated Pull Request uses a deterministic template containing the following sections:
- **Closing keyword**: `Closes #<issue-number>` at the top.
- **Summary**: Key highlights of the PR. Custom summary can be specified via `-Summary "..."`. If not provided, defaults to `- <summary or placeholder>`.
- **Test plan**: Interactive markdown checkboxes. Custom value can be passed via `-TestPlan` (recognized values: `manual` / `automated` / `none`). By default, all checkboxes are unchecked.
- **Risk**: Risk assessment level. Custom risk can be passed via `-Risk "..."`. Defaults to `Low`.
- **Notes**: General notes including the `Created via parsevkctl` mark.

Example usage with custom PR body metadata:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task pr 66 -Summary "Added csv export feature" -TestPlan "manual" -Risk "Low"
```

The remote feature branch is intentionally kept while the pull request is open. It is deleted only by `task merge` after the PR is merged.

After review approval, merge the task:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task merge 66
```

The merge command finds the PR linked with `Closes #66`, merges it, deletes the remote
feature branch, moves the project card to `Done`, closes the issue, and returns to the
default branch when needed.

## Useful variants

Create the issue and project card without creating a branch:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task full "Task title" -Body "Task description" -AssignMe -NoBranch
```

Move an existing issue to `In Progress` without creating a branch:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task start 66 -NoBranch
```

Move a task to review manually:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task review 66
```

Close a non-code task without a pull request only when that is intentional:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task done 66
```

Validate the configuration file manually:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 config validate
```

Check local environment configuration and tools readiness:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task doctor
```

## Dry-Run Mode

For task-modifying operations, you can append the `-DryRun` switch to preview the planned actions without making any actual changes on GitHub, GitHub Projects, or your local Git state.

Supported commands in Dry-Run mode:
- `task create`
- `task full`
- `task start`
- `task pr`
- `task merge`
- `task done`
- `task move`
- `task review`

Example:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task start 73 -DryRun
```

When run in Dry-Run mode:
- No branch is created.
- GitHub Project status is not changed.
- Local repository remains unaffected.
- Git commands, simulated pull request structures, and planned branch switches are printed to the console.
- Output always ends with the line: `No changes were made.`.

## Machine-Readable JSON Output

For CI/CD pipelines and scripting automation, `parsevkctl` supports a global `-Json` switch. When `-Json` is specified:
- All human-readable `Write-Host` logs are suppressed.
- The command outputs a single valid JSON payload on standard output (`stdout`).
- Any error or unhandled exception will print a JSON error payload and exit with code `1`.

### Supported Commands & JSON Payloads

#### 1. `task create`
```json
{
  "command": "task create",
  "issue": 123,
  "title": "Task title",
  "status": "Todo",
  "result": "created"
}
```

#### 2. `task start`
```json
{
  "command": "task start",
  "issue": 123,
  "status": "In Progress",
  "branch": "feat/issue-123-task-slug",
  "defaultBranch": "fastapi-microservices-rewrite",
  "result": "started"
}
```

#### 3. `task pr`
```json
{
  "command": "task pr",
  "issue": 123,
  "status": "Review",
  "prNumber": 12,
  "prUrl": "https://github.com/andr-235/parseVK/pull/12",
  "result": "pr_created"
}
```

#### 4. `task merge`
```json
{
  "command": "task merge",
  "issue": 123,
  "status": "Done",
  "prNumber": 12,
  "result": "merged"
}
```

#### 5. `task status`
```json
{
  "command": "task status",
  "issue": 123,
  "title": "Task Title",
  "state": "OPEN",
  "url": "https://github.com/andr-235/parseVK/issues/123",
  "projectStatus": "In Progress",
  "pr": {
    "number": 12,
    "title": "PR Title",
    "url": "https://github.com/andr-235/parseVK/pull/12",
    "state": "OPEN",
    "draft": "not draft"
  },
  "branch": "feat/issue-123-task-slug",
  "workingTree": "clean"
}
```

#### 6. `task doctor`
```json
{
  "command": "task doctor",
  "ready": true,
  "failures": 0,
  "warnings": 0,
  "checks": [
    {
      "name": "GitHub CLI (gh) installed",
      "status": "OK",
      "message": ""
    }
  ]
}
```

### Error Payload Format

If a command fails or invalid arguments are supplied, the script outputs the following schema on `stdout` and exits with code `1`:

```json
{
  "command": "task start",
  "error": "Working tree is not clean. Commit/stash changes first...",
  "result": "failed"
}
```

### Automation Example

You can parse the output directly in PowerShell using `ConvertFrom-Json`:

```powershell
$status = .\tools\parsevkctl\parsevkctl.ps1 task status 123 -Json | ConvertFrom-Json
Write-Host "Current branch: $($status.branch)"
```


