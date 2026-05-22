package task

import (
	"strings"
	"testing"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
)

func TestDeriveState(t *testing.T) {
	tests := []struct {
		name     string
		snapshot LifecycleSnapshot
		expected domain.TaskState
	}{
		{
			name:     "returns Untracked when issue is missing",
			snapshot: LifecycleSnapshot{},
			expected: domain.TaskStateUntracked,
		},
		{
			name: "returns Done for closed issue",
			snapshot: LifecycleSnapshot{
				IssueExists: true,
				IssueState:  domain.IssueStateClosed,
			},
			expected: domain.TaskStateDone,
		},
		{
			name: "returns Merged for merged PR flag",
			snapshot: LifecycleSnapshot{
				IssueExists:       true,
				IssueState:        domain.IssueStateOpen,
				PullRequestMerged: true,
			},
			expected: domain.TaskStateMerged,
		},
		{
			name: "returns Merged for merged PR state",
			snapshot: LifecycleSnapshot{
				IssueExists:      true,
				IssueState:       domain.IssueStateOpen,
				PullRequestState: domain.PullRequestStateMerged,
			},
			expected: domain.TaskStateMerged,
		},
		{
			name: "returns Review for draft PR",
			snapshot: LifecycleSnapshot{
				IssueExists:      true,
				IssueState:       domain.IssueStateOpen,
				PullRequestDraft: true,
			},
			expected: domain.TaskStateReview,
		},
		{
			name: "returns Review for open PR",
			snapshot: LifecycleSnapshot{
				IssueExists:      true,
				IssueState:       domain.IssueStateOpen,
				PullRequestState: domain.PullRequestStateOpen,
			},
			expected: domain.TaskStateReview,
		},
		{
			name: "returns Review for project Review",
			snapshot: LifecycleSnapshot{
				IssueExists:   true,
				IssueState:    domain.IssueStateOpen,
				ProjectStatus: domain.ProjectStatusReview,
			},
			expected: domain.TaskStateReview,
		},
		{
			name: "returns InProgress for project In Progress",
			snapshot: LifecycleSnapshot{
				IssueExists:   true,
				IssueState:    domain.IssueStateOpen,
				ProjectStatus: domain.ProjectStatusInProgress,
			},
			expected: domain.TaskStateInProgress,
		},
		{
			name: "returns Todo for project Todo",
			snapshot: LifecycleSnapshot{
				IssueExists:   true,
				IssueState:    domain.IssueStateOpen,
				ProjectStatus: domain.ProjectStatusTodo,
			},
			expected: domain.TaskStateTodo,
		},
		{
			name: "returns Done for project Done",
			snapshot: LifecycleSnapshot{
				IssueExists:   true,
				IssueState:    domain.IssueStateOpen,
				ProjectStatus: domain.ProjectStatusDone,
			},
			expected: domain.TaskStateDone,
		},
		{
			name: "returns InProgress when local branch exists and issue exists",
			snapshot: LifecycleSnapshot{
				IssueExists:       true,
				IssueState:        domain.IssueStateOpen,
				LocalBranchExists: true,
			},
			expected: domain.TaskStateInProgress,
		},
		{
			name: "returns InProgress when remote branch exists and issue exists",
			snapshot: LifecycleSnapshot{
				IssueExists:        true,
				IssueState:         domain.IssueStateOpen,
				RemoteBranchExists: true,
			},
			expected: domain.TaskStateInProgress,
		},
		{
			name: "returns Invalid for unknown snapshot",
			snapshot: LifecycleSnapshot{
				IssueExists: true,
				IssueState:  domain.IssueStateOpen,
			},
			expected: domain.TaskStateInvalid,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := DeriveState(tt.snapshot)
			if got != tt.expected {
				t.Fatalf("expected %q, got %q", tt.expected, got)
			}
		})
	}
}

func TestValidateTransitionAllowsNormalFlow(t *testing.T) {
	tests := []struct {
		name    string
		current domain.TaskState
		target  domain.TaskState
	}{
		{name: "Untracked to Todo", current: domain.TaskStateUntracked, target: domain.TaskStateTodo},
		{name: "Todo to InProgress", current: domain.TaskStateTodo, target: domain.TaskStateInProgress},
		{name: "InProgress to Review", current: domain.TaskStateInProgress, target: domain.TaskStateReview},
		{name: "Review to Merged", current: domain.TaskStateReview, target: domain.TaskStateMerged},
		{name: "Merged to Done", current: domain.TaskStateMerged, target: domain.TaskStateDone},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := ValidateTransition(tt.current, tt.target, TransitionOptions{}); err != nil {
				t.Fatalf("expected transition to be allowed, got: %v", err)
			}
		})
	}
}

func TestValidateTransitionDeniesInvalidFlow(t *testing.T) {
	tests := []struct {
		name    string
		current domain.TaskState
		target  domain.TaskState
		opts    TransitionOptions
	}{
		{name: "Todo to Review", current: domain.TaskStateTodo, target: domain.TaskStateReview},
		{name: "Todo to Done without NonCode or Force", current: domain.TaskStateTodo, target: domain.TaskStateDone},
		{name: "InProgress to Done without NonCode or Force", current: domain.TaskStateInProgress, target: domain.TaskStateDone},
		{name: "Done to InProgress without Force", current: domain.TaskStateDone, target: domain.TaskStateInProgress},
		{name: "Invalid to Todo without Force", current: domain.TaskStateInvalid, target: domain.TaskStateTodo},
		{name: "Any to Invalid", current: domain.TaskStateTodo, target: domain.TaskStateInvalid},
		{name: "Any to Invalid with Force", current: domain.TaskStateTodo, target: domain.TaskStateInvalid, opts: TransitionOptions{Force: true}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateTransition(tt.current, tt.target, tt.opts)
			if err == nil {
				t.Fatal("expected transition to be rejected")
			}

			message := err.Error()
			for _, want := range []string{string(tt.current), string(tt.target), SuggestedNextCommand(tt.current)} {
				if !strings.Contains(message, want) {
					t.Fatalf("expected error %q to include %q", message, want)
				}
			}
		})
	}
}

func TestValidateTransitionAllowsSpecialFlow(t *testing.T) {
	tests := []struct {
		name    string
		current domain.TaskState
		target  domain.TaskState
		opts    TransitionOptions
	}{
		{
			name:    "Todo to Done with NonCode",
			current: domain.TaskStateTodo,
			target:  domain.TaskStateDone,
			opts:    TransitionOptions{NonCode: true},
		},
		{
			name:    "InProgress to Done with NonCode",
			current: domain.TaskStateInProgress,
			target:  domain.TaskStateDone,
			opts:    TransitionOptions{NonCode: true},
		},
		{
			name:    "Invalid to Todo with Force",
			current: domain.TaskStateInvalid,
			target:  domain.TaskStateTodo,
			opts:    TransitionOptions{Force: true},
		},
		{
			name:    "Done to InProgress with Force",
			current: domain.TaskStateDone,
			target:  domain.TaskStateInProgress,
			opts:    TransitionOptions{Force: true},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := ValidateTransition(tt.current, tt.target, tt.opts); err != nil {
				t.Fatalf("expected transition to be allowed, got: %v", err)
			}
		})
	}
}

func TestSuggestedNextCommand(t *testing.T) {
	tests := []struct {
		state    domain.TaskState
		expected string
	}{
		{state: domain.TaskStateUntracked, expected: "parsevkctl task create ..."},
		{state: domain.TaskStateTodo, expected: "parsevkctl task start <issue>"},
		{state: domain.TaskStateInProgress, expected: "parsevkctl task pr <issue>"},
		{state: domain.TaskStateReview, expected: "parsevkctl task merge <issue>"},
		{state: domain.TaskStateMerged, expected: "parsevkctl task sync <issue> --apply"},
		{state: domain.TaskStateDone, expected: "no action required"},
		{state: domain.TaskStateInvalid, expected: "parsevkctl task status <issue>"},
	}

	for _, tt := range tests {
		t.Run(string(tt.state), func(t *testing.T) {
			got := SuggestedNextCommand(tt.state)
			if got != tt.expected {
				t.Fatalf("expected %q, got %q", tt.expected, got)
			}
		})
	}
}
