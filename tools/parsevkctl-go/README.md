# parsevkctl Go CLI

New Go implementation of parsevkctl.

Build: go build ./cmd/parsevkctl
Test: go test ./...
Run: go run ./cmd/parsevkctl --help

## Domain model

`internal/domain` contains pure Go types for tasks, issues, pull requests, project items and lifecycle state. It also owns validation helpers and task state derivation logic, without dependencies on the CLI, Git, GitHub, Project adapters or output rendering.

## Git adapter

`internal/git` centralizes local Git operations for the Go rewrite. It exposes an adapter interface for repository actions and currently implements it with a shell-based adapter that calls `git` directly.
