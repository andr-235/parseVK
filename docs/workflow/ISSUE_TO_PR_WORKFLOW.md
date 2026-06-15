# Issue to PR Workflow

## 1. Create or select an issue

The issue must include:

- Context
- Problem or goal
- Scope
- Acceptance criteria
- Safety requirements
- Verification expectations

## 2. Implement on a task branch

Branch naming examples:

```text
task/<issue-number>-short-name
fix/<issue-number>-short-name
docs/<issue-number>-short-name
```

## 3. Open PR

The PR should include:

- Linked issue using `Closes #<issue-number>`
- Summary
- Changed files
- Test/manual verification
- Known risks

## 4. Review

Review in chat first.

Official GitHub review actions are used only after explicit instruction:

- APPROVE
- REQUEST_CHANGES
- COMMENT

## 5. Merge

Merge only when:

- PR is not draft.
- PR links the correct issue.
- Scope matches the issue.
- No blocking findings remain.
- Tests/checks/manual verification are clear.
- No secrets are present.

Example:

```powershell
cd tools/parsevkctl-go
go run ./cmd/parsevkctl task merge <issue-number>
```
