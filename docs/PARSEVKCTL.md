# parsevkctl

`parsevkctl` is the local task workflow helper for the `andr-235/parseVK` repository.
It keeps GitHub Issues, the GitHub Project board, git branches, and pull requests in
one predictable flow.

## Requirements

- GitHub CLI (`gh`) must be installed and authenticated.
- The working tree must be clean before starting a task that creates a branch.
- Run commands from the repository root:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 ...
```

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

The PR command pushes the current branch, creates a pull request with `Closes #66`,
and moves the project card to `Review`.

After review approval, merge the task:

```powershell
.\tools\parsevkctl\parsevkctl.ps1 task merge 66
```

The merge command finds the PR linked with `Closes #66`, merges it, moves the project
card to `Done`, closes the issue, and returns to the default branch when needed.

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
