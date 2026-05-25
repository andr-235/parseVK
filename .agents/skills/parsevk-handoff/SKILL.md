---
name: parsevk-handoff
description: Use at the end of a parseVK implementation or PR review to produce the required AI handoff with summary, files, validation, risks, omissions, and next suggested issue. Do not use for planning, implementation, review analysis, or merge decisions by itself.
---

# parseVK Handoff

## When to use

Use this skill after implementation, after PR review, or when pausing work so the next person or AI session can continue from a clear state.

## When not to use

Do not use this skill instead of doing validation, review, or merge checks. It is a reporting format, not a substitute for evidence.

## Inputs

- Issue number
- Branch name
- PR URL if created
- Changed files
- Validation commands and results
- Known risks
- Work intentionally not done
- Suggested follow-up

## Procedure

1. Summarize what changed in user-facing terms.
2. List changed files or changed areas.
3. Report validation commands that actually ran and their results.
4. State skipped validation and why it was skipped.
5. Name risks or residual uncertainty.
6. State what was not done.
7. Suggest the next issue only when it follows from the completed work.

## Output format

```md
## Summary
- ...

## Changed files
- ...

## Validation
- `command` - passed/failed/skipped, with reason

## Risks
- ...

## Not done
- ...

## Next suggested issue
- ...
```

## Safety rules

- Do not claim tests passed unless they ran.
- Do not hide failed, skipped, or unavailable checks.
- Do not include secrets or sensitive local paths beyond repository file paths.
- Do not imply merge completion unless the merge command actually succeeded.

## Validation expectations

The handoff must let another maintainer understand what evidence exists, what remains uncertain, and what command or review step should happen next.
