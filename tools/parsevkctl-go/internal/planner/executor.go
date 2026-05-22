package planner

import (
	"context"
	"fmt"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/git"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/github"
)

type Executor struct {
	Git    git.Adapter
	GitHub github.Adapter
}

type OperationError struct {
	OperationID   string
	OperationType OperationType
	Message       string
	RecoveryHint  string
	Cause         error
}

func (e OperationError) Error() string {
	if e.Cause == nil {
		return fmt.Sprintf("%s (%s): %s", e.OperationID, e.OperationType, e.Message)
	}

	return fmt.Sprintf("%s (%s): %s: %v", e.OperationID, e.OperationType, e.Message, e.Cause)
}

func (e OperationError) Unwrap() error {
	return e.Cause
}

func (e Executor) Execute(ctx context.Context, plan Plan) error {
	for _, operation := range plan.Operations {
		if err := e.executeOperation(ctx, operation); err != nil {
			return OperationError{
				OperationID:   operation.ID,
				OperationType: operation.Type,
				Message:       "operation failed",
				RecoveryHint:  recoveryHint(operation),
				Cause:         err,
			}
		}
	}

	return nil
}

func (e Executor) executeOperation(ctx context.Context, operation Operation) error {
	switch operation.Type {
	case OperationIssueCreate:
		payload, err := payloadAs[IssueCreatePayload](operation.Payload)
		if err != nil {
			return err
		}
		_, err = e.GitHub.CreateIssue(ctx, github.CreateIssueInput{
			Title:  payload.Title,
			Body:   payload.Body,
			Labels: payload.Labels,
		})
		return err
	case OperationIssueClose:
		payload, err := payloadAs[IssueClosePayload](operation.Payload)
		if err != nil {
			return err
		}
		return e.GitHub.CloseIssue(ctx, payload.IssueNumber, payload.Comment)
	case OperationProjectAddItem:
		payload, err := payloadAs[ProjectIssuePayload](operation.Payload)
		if err != nil {
			return err
		}
		return e.GitHub.AddProjectItem(ctx, payload.IssueNumber)
	case OperationProjectSetStatus:
		payload, err := payloadAs[ProjectStatusPayload](operation.Payload)
		if err != nil {
			return err
		}
		return e.GitHub.SetProjectStatus(ctx, payload.IssueNumber, payload.Status)
	case OperationGitFetch:
		payload, err := payloadAs[GitRefPayload](operation.Payload)
		if err != nil {
			return err
		}
		return e.Git.Fetch(ctx, payload.Remote, payload.Branch)
	case OperationGitSwitch:
		payload, err := payloadAs[GitBranchPayload](operation.Payload)
		if err != nil {
			return err
		}
		return e.Git.Switch(ctx, payload.Branch)
	case OperationGitPullFastForward:
		payload, err := payloadAs[GitRefPayload](operation.Payload)
		if err != nil {
			return err
		}
		return e.Git.PullFFOnly(ctx, payload.Remote, payload.Branch)
	case OperationGitCreateBranch:
		payload, err := payloadAs[GitBranchPayload](operation.Payload)
		if err != nil {
			return err
		}
		return e.Git.CreateBranch(ctx, payload.Branch)
	case OperationGitPushBranch:
		payload, err := payloadAs[GitRefPayload](operation.Payload)
		if err != nil {
			return err
		}
		return e.Git.PushBranch(ctx, payload.Remote, payload.Branch, true)
	case OperationPullRequestCreate:
		payload, err := payloadAs[PullRequestPayload](operation.Payload)
		if err != nil {
			return err
		}
		_, err = e.GitHub.CreatePullRequest(ctx, github.CreatePullRequestInput{
			Title: payload.Title,
			Body:  payload.Body,
			Head:  payload.Head,
			Base:  payload.Base,
			Draft: payload.Draft,
		})
		return err
	case OperationPullRequestMerge:
		payload, err := payloadAs[MergePullRequestPayload](operation.Payload)
		if err != nil {
			return err
		}
		return e.GitHub.MergePullRequest(ctx, payload.Number, github.MergePullRequestInput{
			Method:       payload.Method,
			DeleteBranch: payload.DeleteBranch,
			Auto:         payload.Auto,
		})
	case OperationBranchDeleteLocal:
		payload, err := payloadAs[DeleteLocalBranchPayload](operation.Payload)
		if err != nil {
			return err
		}
		return e.Git.DeleteLocalBranch(ctx, payload.Branch, payload.Force)
	case OperationBranchDeleteRemote:
		payload, err := payloadAs[GitRefPayload](operation.Payload)
		if err != nil {
			return err
		}
		return e.Git.DeleteRemoteBranch(ctx, payload.Remote, payload.Branch)
	default:
		return fmt.Errorf("unsupported operation type %q", operation.Type)
	}
}

type IssueCreatePayload struct {
	Title  string   `json:"title"`
	Body   string   `json:"body"`
	Labels []string `json:"labels,omitempty"`
}

type IssueClosePayload struct {
	IssueNumber int    `json:"issueNumber"`
	Comment     string `json:"comment,omitempty"`
}

func payloadAs[T any](payload any) (T, error) {
	typed, ok := payload.(T)
	if !ok {
		var zero T
		return zero, fmt.Errorf("invalid payload type %T", payload)
	}

	return typed, nil
}

func recoveryHint(operation Operation) string {
	switch operation.Type {
	case OperationProjectAddItem, OperationProjectSetStatus:
		return "Check GitHub Project access and rerun the task operation when project state is available."
	case OperationGitFetch, OperationGitSwitch, OperationGitPullFastForward, OperationGitCreateBranch, OperationGitPushBranch, OperationBranchDeleteLocal, OperationBranchDeleteRemote:
		return "Check the local git state, resolve the reported git error, then rerun the task operation."
	case OperationPullRequestCreate, OperationPullRequestMerge:
		return "Check pull request state and GitHub permissions, then rerun the task operation."
	case OperationIssueCreate, OperationIssueClose:
		return "Check issue state and GitHub permissions, then rerun the task operation."
	default:
		return "Resolve the adapter error and rerun the task operation."
	}
}
