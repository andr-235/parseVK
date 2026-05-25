package domain

import (
	"errors"
	"strings"
)

type TaskID int

type BranchName string

type IssueState string

const (
	IssueStateUnknown IssueState = "Unknown"
	IssueStateOpen    IssueState = "Open"
	IssueStateClosed  IssueState = "Closed"
)

type Issue struct {
	ID     TaskID
	Title  string
	State  IssueState
	URL    string
	Branch BranchName
	Labels []string
}

type PullRequestState string

const (
	PullRequestStateNone   PullRequestState = "None"
	PullRequestStateOpen   PullRequestState = "Open"
	PullRequestStateClosed PullRequestState = "Closed"
	PullRequestStateMerged PullRequestState = "Merged"
	PullRequestStateDraft  PullRequestState = "Draft"
)

type PullRequest struct {
	Number TaskID
	Title  string
	State  PullRequestState
	Draft  bool
	Merged bool
	URL    string
	Base   string
	Head   string
}

type CheckState string

const (
	CheckStateSuccess CheckState = "success"
	CheckStatePending CheckState = "pending"
	CheckStateFailure CheckState = "failure"
	CheckStateSkipped CheckState = "skipped"
	CheckStateUnknown CheckState = "unknown"
)

type PullRequestChecks struct {
	PullRequestNumber int
	Total             int
	Successful        int
	Pending           int
	Failed            int
	Skipped           int
	Checks            []PullRequestCheck
}

type PullRequestCheck struct {
	Name   string
	State  CheckState
	Bucket CheckState
}

type ProjectStatus string

const (
	ProjectStatusUnknown    ProjectStatus = "Unknown"
	ProjectStatusTodo       ProjectStatus = "Todo"
	ProjectStatusInProgress ProjectStatus = "In Progress"
	ProjectStatusReview     ProjectStatus = "Review"
	ProjectStatusDone       ProjectStatus = "Done"
)

type ProjectItem struct {
	ID     string
	Status ProjectStatus
}

type TaskState string

const (
	TaskStateUntracked  TaskState = "Untracked"
	TaskStateTodo       TaskState = "Todo"
	TaskStateInProgress TaskState = "InProgress"
	TaskStateReview     TaskState = "Review"
	TaskStateMerged     TaskState = "Merged"
	TaskStateDone       TaskState = "Done"
	TaskStateBlocked    TaskState = "Blocked"
	TaskStateInvalid    TaskState = "Invalid"
)

type CommandResult struct {
	OK      bool
	Message string
}

type TaskSnapshot struct {
	HasIssue          bool
	IssueState        IssueState
	ProjectStatus     ProjectStatus
	PullRequestState  PullRequestState
	PullRequestDraft  bool
	PullRequestMerged bool
}

func ValidateTaskID(id TaskID) error {
	if id <= 0 {
		return errors.New("task ID must be a positive integer")
	}

	return nil
}

func ValidateBranchName(name BranchName) error {
	if strings.TrimSpace(string(name)) == "" {
		return errors.New("branch name must not be empty")
	}

	return nil
}

func NormalizeProjectStatus(value string) ProjectStatus {
	normalized := strings.ToLower(strings.Join(strings.Fields(value), " "))

	switch normalized {
	case "todo":
		return ProjectStatusTodo
	case "in progress":
		return ProjectStatusInProgress
	case "review":
		return ProjectStatusReview
	case "done":
		return ProjectStatusDone
	default:
		return ProjectStatusUnknown
	}
}

func DeriveTaskState(snapshot TaskSnapshot) TaskState {
	if !snapshot.HasIssue {
		return TaskStateUntracked
	}

	if snapshot.IssueState == IssueStateClosed {
		return TaskStateDone
	}

	if snapshot.PullRequestMerged || snapshot.PullRequestState == PullRequestStateMerged {
		return TaskStateMerged
	}

	if snapshot.PullRequestDraft || snapshot.PullRequestState == PullRequestStateDraft {
		return TaskStateReview
	}

	if snapshot.PullRequestState == PullRequestStateOpen {
		return TaskStateReview
	}

	switch snapshot.ProjectStatus {
	case ProjectStatusInProgress:
		return TaskStateInProgress
	case ProjectStatusReview:
		return TaskStateReview
	case ProjectStatusDone:
		return TaskStateDone
	case ProjectStatusTodo:
		return TaskStateTodo
	default:
		return TaskStateInvalid
	}
}
