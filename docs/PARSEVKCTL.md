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

## Kanban flow

Tasks move through these statuses:

```text
Todo -> In Progress -> Review -> Done
```

- `Todo`: issue is created and added to the project.
- `In Progress`: task is started and a task branch is created.
- `Review`: pull request is open and ready for review.
- `Done`: pull request is merged and the issue is closed.

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

The PR command pushes the current branch, creates a pull request with `Closes #66`,
moves the project card to `Review`, switches back to the configured default branch,
pulls it with `git pull --ff-only origin <defaultBranch>`, and deletes only the local
feature branch. If the working tree is not clean after PR creation, the local branch
is kept and a warning is printed.

The remote feature branch is intentionally kept while the pull request is open. It is
deleted only by `task merge` after the PR is merged.

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
