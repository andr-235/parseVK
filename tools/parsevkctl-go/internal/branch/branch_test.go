package branch

import (
	"testing"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
)

func TestNewTaskBranchNameDefaultsToFeatFromEnglishTitle(t *testing.T) {
	issue := domain.Issue{
		ID:    73,
		Title: "Enterprise branch naming",
	}

	got, err := NewTaskBranchName(issue)
	if err != nil {
		t.Fatalf("expected branch name, got error: %v", err)
	}

	assertEqual(t, got, "feat/issue-73-enterprise-branch-naming")
}

func TestNewTaskBranchNameUsesTypeLabelBeforeTitlePrefix(t *testing.T) {
	issue := domain.Issue{
		ID:     72,
		Title:  "fix: handle gh retry failure",
		Labels: []string{"type: docs"},
	}

	got, err := NewTaskBranchName(issue)
	if err != nil {
		t.Fatalf("expected branch name, got error: %v", err)
	}

	assertEqual(t, got, "docs/issue-72-handle-gh-retry-failure")
}

func TestNewTaskBranchNameUsesTitlePrefixWithoutTypeLabel(t *testing.T) {
	issue := domain.Issue{
		ID:    66,
		Title: "docs: document parsevkctl workflow",
	}

	got, err := NewTaskBranchName(issue)
	if err != nil {
		t.Fatalf("expected branch name, got error: %v", err)
	}

	assertEqual(t, got, "docs/issue-66-document-parsevkctl-workflow")
}

func TestNewTaskBranchNameTransliteratesRussianTitle(t *testing.T) {
	issue := domain.Issue{
		ID:    123,
		Title: "docs: Документировать parsevkctl",
	}

	got, err := NewTaskBranchName(issue)
	if err != nil {
		t.Fatalf("expected branch name, got error: %v", err)
	}

	assertEqual(t, got, "docs/issue-123-dokumentirovat-parsevkctl")
}

func TestSlugifyTitleCleansDuplicatedDashes(t *testing.T) {
	got := SlugifyTitle("fix: handle --- gh___retry   failure")

	assertEqual(t, got, "handle-gh-retry-failure")
}

func TestSlugifyTitleLimitsSlugLength(t *testing.T) {
	got := SlugifyTitle("add a very long branch naming implementation with many extra words")

	if len(got) > 48 {
		t.Fatalf("expected max slug length 48, got %d for %q", len(got), got)
	}
	assertEqual(t, got, "add-a-very-long-branch-naming-implementation")
}

func TestSlugifyTitleFallsBackToTaskForEmptySlug(t *testing.T) {
	got := SlugifyTitle("!!!")

	assertEqual(t, got, "task")
}

func TestParseTaskBranchNameExtractsParts(t *testing.T) {
	got, err := ParseTaskBranchName("feat/issue-73-enterprise-branch-naming")
	if err != nil {
		t.Fatalf("expected parsed branch, got error: %v", err)
	}

	assertEqual(t, got.Type, "feat")
	assertEqual(t, got.IssueNumber, 73)
	assertEqual(t, got.Slug, "enterprise-branch-naming")
}

func TestValidateTaskBranchNameAcceptsValidBranch(t *testing.T) {
	if err := ValidateTaskBranchName("fix/issue-72-handle-gh-retry-failure"); err != nil {
		t.Fatalf("expected valid branch, got error: %v", err)
	}
}

func TestValidateTaskBranchNameRejectsInvalidBranches(t *testing.T) {
	tests := []struct {
		name   string
		branch string
	}{
		{name: "empty", branch: ""},
		{name: "unknown type", branch: "feature/issue-1-task"},
		{name: "missing issue number", branch: "feat/issue-task"},
		{name: "zero issue number", branch: "feat/issue-0-task"},
		{name: "spaces", branch: "feat/issue-1-some task"},
		{name: "underscores", branch: "feat/issue-1-some_task"},
		{name: "cyrillic", branch: "feat/issue-1-задача"},
		{name: "double dashes", branch: "feat/issue-1-some--task"},
		{name: "leading slug dash", branch: "feat/issue-1--task"},
		{name: "trailing slug dash", branch: "feat/issue-1-task-"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := ValidateTaskBranchName(tt.branch); err == nil {
				t.Fatalf("expected invalid branch %q", tt.branch)
			}
		})
	}
}

func assertEqual[T comparable](t *testing.T, got T, expected T) {
	t.Helper()

	if got != expected {
		t.Fatalf("expected %v, got %v", expected, got)
	}
}
