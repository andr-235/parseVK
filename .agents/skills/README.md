# parseVK Repo-Scoped Codex Skills

These are Codex repository-scoped skills for the parseVK AI-assisted development workflow.

Codex repository skills belong under:

```text
.agents/skills/
```

Each skill is a directory with a required `SKILL.md` file. Optional supporting files may live under `references/`, `scripts/`, `assets/`, or `agents/` inside that skill directory.

Do not place Codex skills under `docs/ai-skills/`. The `docs/` directory remains for human-facing project documentation and long-term architecture notes.

The workflow architecture is:

```text
GitHub Issue = task source of truth
GitHub PR = implementation artifact
Codex Skill = reusable reasoning/process guide
parsevkctl = deterministic helper CLI
docs/ = long-term human/project documentation
.agents/skills = repo-scoped AI workflow skills
```

`parsevkctl` should remain a thin deterministic CLI for task lifecycle operations. Complex AI reasoning workflows belong in skills. GitHub Issues and Pull Requests remain the source of truth for task scope, implementation state, review, and merge decisions.
