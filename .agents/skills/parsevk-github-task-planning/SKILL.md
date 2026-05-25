---
name: parsevk-github-task-planning
description: Use when planning or drafting parseVK GitHub Issues for AI-assisted development; create one small AI-safe task with clear scope, labels, risk, validation, and handoff. Do not use for implementation, PR review, merge decisions, or broad roadmap planning.
---

# parseVK GitHub Task Planning

## When to use

Use this skill when creating or refining a GitHub Issue that will be implemented by Codex or another AI agent in the parseVK repository.

The issue must be the unit of AI work: one issue, one bounded task, one expected PR.

## When not to use

Do not use this skill to implement code, review a PR, decide whether to merge, or plan a multi-issue roadmap without splitting it into small tasks.

Do not use it for tasks that require production access, secrets, protected branch changes, or undefined ownership.

## Inputs

- User request or project need
- Relevant service area
- Known constraints and out-of-scope boundaries
- Expected validation commands
- Risk level

## Procedure

1. Define a narrow goal that can be completed in one focused AI session.
2. Write the issue title in a concise task format.
3. Fill the issue body with:
   - Goal
   - Background
   - Scope
   - Out of Scope
   - Acceptance Criteria
   - Validation
   - Risk
   - AI Session Budget
   - Required Handoff
4. Add labels for type, service area, risk, and AI readiness.
5. Keep `parsevkctl` as the deterministic lifecycle helper. Do not move complex reasoning into new CLI behavior.
6. Ensure the task can be reviewed from the issue and PR without private context.

## Output format

Return:

```md
## Title

...

## Labels

- type:...
- service:...
- risk:...
- ai:ready

## Body

...
```

## Safety rules

- One issue equals one AI-safe task.
- Scope must be explicit and small.
- Out-of-scope work must be named clearly.
- Do not include secrets, credentials, tokens, cookies, or private config.
- Do not ask AI agents to modify unrelated services.
- Do not create tasks that require force push, destructive git commands, or protected-branch changes.

## Validation expectations

Every issue must name concrete validation steps. If no automated validation is available, state the manual validation and why automated checks do not apply.
