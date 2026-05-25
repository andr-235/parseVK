# AI Issue Workflow

This workflow keeps parseVK AI-assisted development tasks scoped, reviewable,
and traceable from GitHub Issue to merged pull request.

## Issue Creation

Create AI-ready tasks with the repository issue template:

```text
.github/ISSUE_TEMPLATE/ai-task.yml
```

Each issue must define:

- goal
- service or repository area
- scope
- out of scope
- acceptance criteria
- validation commands
- risk level
- expected AI sessions
- required handoff

The issue body is the source of truth for the AI agent. Keep it specific enough
that the agent can implement the task without expanding scope.

## Labels

Use labels to make triage and automation predictable:

- `ai:ready` marks work that is ready for an AI session.
- `type:*` labels describe the kind of change, such as `type:docs`,
  `type:infra`, `type:fix`, or `type:feature`.
- `service:*` labels identify the affected service, tool, or repository area.
- `risk:*` labels describe expected review and merge risk.

Prefer one clear service label and one clear risk label per task.

## Starting Work

Use the local workflow helper from `tools/parsevkctl-go`:

```powershell
cd tools/parsevkctl-go
go run ./cmd/parsevkctl task create "Task title" --body "Task body"
go run ./cmd/parsevkctl task start ISSUE_NUMBER
```

For an existing issue:

```powershell
cd tools/parsevkctl-go
go run ./cmd/parsevkctl task start ISSUE_NUMBER
```

`task start` moves the Project item to `In Progress`, updates the configured
default branch, and creates the task branch.

## Branch Naming

Task branches should follow the repository branch naming convention:

```text
<type>/issue-<number>-<short-kebab-summary>
```

Examples:

```text
docs/issue-185-add-github-ai-workflow-templates
fix/issue-130-parsevkctl-branch-cleanup
feat/issue-127-moderation-service
```

The branch type should match the primary change type.

## AI Session Expectations

Each AI session should:

- follow the issue scope strictly
- avoid unrelated refactors
- avoid application code changes unless the issue explicitly allows them
- preserve user changes already present in the working tree
- run the validation commands listed in the issue
- stop and ask for direction if the task requires work outside scope

Low-risk documentation or template tasks should usually fit in one AI session.
Higher-risk tasks should define smaller follow-up issues instead of growing the
current branch.

## Handoff Requirements

Before a PR is ready for review, the AI agent should provide:

- summary
- changed files
- validation commands run
- risks
- next suggested issue

The handoff should also mention skipped validation and why it was skipped.

## Pull Request Creation

After implementation, validation, and commit:

```powershell
cd tools/parsevkctl-go
go run ./cmd/parsevkctl task pr ISSUE_NUMBER
```

The PR body must include `Closes #ISSUE_NUMBER` so the issue can close when the
PR is merged.
