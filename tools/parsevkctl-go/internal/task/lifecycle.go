package task

import (
	"fmt"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
)

type LifecycleSnapshot struct {
	IssueExists        bool
	IssueState         domain.IssueState
	ProjectStatus      domain.ProjectStatus
	PullRequestState   domain.PullRequestState
	PullRequestDraft   bool
	PullRequestMerged  bool
	LocalBranchExists  bool
	RemoteBranchExists bool
}

type TransitionOptions struct {
	Force   bool
	NonCode bool
}

func DeriveState(snapshot LifecycleSnapshot) domain.TaskState {
	if !snapshot.IssueExists {
		return domain.TaskStateUntracked
	}

	if snapshot.IssueState == domain.IssueStateClosed {
		return domain.TaskStateDone
	}

	if snapshot.PullRequestMerged || snapshot.PullRequestState == domain.PullRequestStateMerged {
		return domain.TaskStateMerged
	}

	if snapshot.PullRequestDraft {
		return domain.TaskStateReview
	}

	if snapshot.PullRequestState == domain.PullRequestStateOpen {
		return domain.TaskStateReview
	}

	switch snapshot.ProjectStatus {
	case domain.ProjectStatusReview:
		return domain.TaskStateReview
	case domain.ProjectStatusInProgress:
		return domain.TaskStateInProgress
	case domain.ProjectStatusTodo:
		return domain.TaskStateTodo
	case domain.ProjectStatusDone:
		return domain.TaskStateDone
	}

	if snapshot.LocalBranchExists || snapshot.RemoteBranchExists {
		return domain.TaskStateInProgress
	}

	return domain.TaskStateInvalid
}

func ValidateTransition(current domain.TaskState, target domain.TaskState, opts TransitionOptions) error {
	if transitionAllowed(current, target, opts) {
		return nil
	}

	return fmt.Errorf(
		"invalid task transition from %q to %q; suggested next command: %s",
		current,
		target,
		SuggestedNextCommand(current),
	)
}

func SuggestedNextCommand(state domain.TaskState) string {
	switch state {
	case domain.TaskStateUntracked:
		return "parsevkctl task create ..."
	case domain.TaskStateTodo:
		return "parsevkctl task start <issue>"
	case domain.TaskStateInProgress:
		return "parsevkctl task pr <issue>"
	case domain.TaskStateReview:
		return "parsevkctl task merge <issue>"
	case domain.TaskStateMerged:
		return "parsevkctl task sync <issue> --apply"
	case domain.TaskStateDone:
		return "no action required"
	case domain.TaskStateInvalid:
		return "parsevkctl task status <issue>"
	default:
		return "parsevkctl task status <issue>"
	}
}

func transitionAllowed(current domain.TaskState, target domain.TaskState, opts TransitionOptions) bool {
	if target == domain.TaskStateInvalid {
		return false
	}

	if current == target {
		return true
	}

	if current == domain.TaskStateInvalid {
		return opts.Force
	}

	if current == domain.TaskStateDone && target != domain.TaskStateDone {
		return opts.Force
	}

	if isNormalTransition(current, target) {
		return true
	}

	if isNonCodeDoneTransition(current, target) {
		return opts.NonCode || opts.Force
	}

	return opts.Force
}

func isNormalTransition(current domain.TaskState, target domain.TaskState) bool {
	switch current {
	case domain.TaskStateUntracked:
		return target == domain.TaskStateTodo
	case domain.TaskStateTodo:
		return target == domain.TaskStateInProgress
	case domain.TaskStateInProgress:
		return target == domain.TaskStateReview
	case domain.TaskStateReview:
		return target == domain.TaskStateMerged
	case domain.TaskStateMerged:
		return target == domain.TaskStateDone
	default:
		return false
	}
}

func isNonCodeDoneTransition(current domain.TaskState, target domain.TaskState) bool {
	if target != domain.TaskStateDone {
		return false
	}

	return current == domain.TaskStateTodo || current == domain.TaskStateInProgress
}
