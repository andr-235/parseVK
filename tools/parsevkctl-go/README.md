# parsevkctl Go CLI

New Go implementation of parsevkctl.

Build: go build ./cmd/parsevkctl
Test: go test ./...
Run: go run ./cmd/parsevkctl --help

## Domain model

`internal/domain` contains pure Go types for tasks, issues, pull requests, project items and lifecycle state. It also owns validation helpers and task state derivation logic, without dependencies on the CLI, Git, GitHub, Project adapters or output rendering.

## Task lifecycle

`internal/task` contains pure lifecycle state derivation and transition validation for task automation. Command handlers will use this package later to map issue, project, pull request and branch snapshots into valid task lifecycle actions.

## Git adapter

`internal/git` centralizes local Git operations for the Go rewrite. It exposes an adapter interface for repository actions and currently implements it with a shell-based adapter that calls `git` directly.

## GitHub adapter

`internal/github` centralizes GitHub operations for the Go rewrite. It exposes a typed adapter boundary for issues, pull requests and project status operations, and currently shells out to `gh` behind that boundary while returning `internal/domain` types.

## Branch naming

Task branches use this format:

`<type>/issue-<number>-<slug>`

Supported branch types: `feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `chore`, `perf`, `build`, `hotfix`.
