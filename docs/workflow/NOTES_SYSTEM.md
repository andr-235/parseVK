# parseVK Notes and Task Workflow

## Purpose

This workflow separates raw thinking from executable project work.

## Sources of truth

| Layer | Tool/location | Purpose |
|---|---|---|
| Raw notes | private `parsevk-notes-vault` | Ideas, drafts, analysis |
| Executable task | GitHub Issue | Work that should be implemented |
| Status | GitHub Project | Backlog and execution state |
| Implementation | Pull Request | Code changes |
| Final architecture | `docs/adr/` | Accepted decisions |

## State flow

```text
raw note → shaped note → GitHub issue → PR → review → merge → docs/ADR if needed
```

## Rules

1. Do not put raw personal notes in the main repository.
2. Convert only clear, scoped notes into GitHub Issues.
3. Every implementation PR should link an issue.
4. PR review happens in chat first, unless an explicit GitHub review is requested.
5. Final architectural decisions belong in `docs/adr/`.

## GitHub Project statuses

- Inbox
- Ready
- In Progress
- Review
- Done
- Blocked

## Note conversion checklist

Before creating a GitHub Issue from a note:

- [ ] The problem is clear.
- [ ] The desired result is clear.
- [ ] Scope is explicit.
- [ ] Acceptance criteria exist.
- [ ] Safety requirements exist.
- [ ] It is not just a vague idea.
