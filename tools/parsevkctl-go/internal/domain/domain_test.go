package domain

import "testing"

func TestValidateTaskIDAcceptsPositiveID(t *testing.T) {
	if err := ValidateTaskID(TaskID(106)); err != nil {
		t.Fatalf("expected valid task ID, got: %v", err)
	}
}

func TestValidateTaskIDRejectsZeroAndNegativeIDs(t *testing.T) {
	tests := []TaskID{0, -1}

	for _, id := range tests {
		if err := ValidateTaskID(id); err == nil {
			t.Fatalf("expected invalid task ID %d", id)
		}
	}
}

func TestValidateBranchNameRejectsEmptyBranch(t *testing.T) {
	tests := []BranchName{"", "   "}

	for _, name := range tests {
		if err := ValidateBranchName(name); err == nil {
			t.Fatalf("expected invalid branch name %q", name)
		}
	}
}

func TestNormalizeProjectStatus(t *testing.T) {
	tests := []struct {
		name     string
		value    string
		expected ProjectStatus
	}{
		{name: "todo", value: " todo ", expected: ProjectStatusTodo},
		{name: "in progress", value: "in   progress", expected: ProjectStatusInProgress},
		{name: "review", value: "REVIEW", expected: ProjectStatusReview},
		{name: "done", value: "Done", expected: ProjectStatusDone},
		{name: "unknown", value: "Backlog", expected: ProjectStatusUnknown},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NormalizeProjectStatus(tt.value)
			if got != tt.expected {
				t.Fatalf("expected %q, got %q", tt.expected, got)
			}
		})
	}
}

func TestDeriveTaskStateFromTodoProjectStatus(t *testing.T) {
	got := DeriveTaskState(TaskSnapshot{
		HasIssue:      true,
		IssueState:    IssueStateOpen,
		ProjectStatus: ProjectStatusTodo,
	})

	if got != TaskStateTodo {
		t.Fatalf("expected %q, got %q", TaskStateTodo, got)
	}
}

func TestDeriveTaskStateFromInProgressProjectStatus(t *testing.T) {
	got := DeriveTaskState(TaskSnapshot{
		HasIssue:      true,
		IssueState:    IssueStateOpen,
		ProjectStatus: ProjectStatusInProgress,
	})

	if got != TaskStateInProgress {
		t.Fatalf("expected %q, got %q", TaskStateInProgress, got)
	}
}

func TestDeriveTaskStateFromOpenPullRequest(t *testing.T) {
	got := DeriveTaskState(TaskSnapshot{
		HasIssue:         true,
		IssueState:       IssueStateOpen,
		PullRequestState: PullRequestStateOpen,
		ProjectStatus:    ProjectStatusTodo,
	})

	if got != TaskStateReview {
		t.Fatalf("expected %q, got %q", TaskStateReview, got)
	}
}

func TestDeriveTaskStateFromMergedPullRequest(t *testing.T) {
	got := DeriveTaskState(TaskSnapshot{
		HasIssue:          true,
		IssueState:        IssueStateOpen,
		PullRequestState:  PullRequestStateMerged,
		PullRequestMerged: true,
		ProjectStatus:     ProjectStatusReview,
	})

	if got != TaskStateMerged {
		t.Fatalf("expected %q, got %q", TaskStateMerged, got)
	}
}

func TestDeriveTaskStateFromClosedIssue(t *testing.T) {
	got := DeriveTaskState(TaskSnapshot{
		HasIssue:      true,
		IssueState:    IssueStateClosed,
		ProjectStatus: ProjectStatusReview,
	})

	if got != TaskStateDone {
		t.Fatalf("expected %q, got %q", TaskStateDone, got)
	}
}

func TestDeriveTaskStateFallsBackToInvalidForUnknownState(t *testing.T) {
	got := DeriveTaskState(TaskSnapshot{
		HasIssue:      true,
		IssueState:    IssueStateOpen,
		ProjectStatus: ProjectStatusUnknown,
	})

	if got != TaskStateInvalid {
		t.Fatalf("expected %q, got %q", TaskStateInvalid, got)
	}
}
