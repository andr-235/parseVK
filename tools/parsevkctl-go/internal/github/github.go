package github

import (
	"context"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
)

type Adapter interface {
	GetIssue(ctx context.Context, number int) (domain.Issue, error)
	CreateIssue(ctx context.Context, input CreateIssueInput) (domain.Issue, error)
	CloseIssue(ctx context.Context, number int, comment string) error

	ListPullRequests(ctx context.Context, filter PullRequestFilter) ([]domain.PullRequest, error)
	CreatePullRequest(ctx context.Context, input CreatePullRequestInput) (domain.PullRequest, error)
	MergePullRequest(ctx context.Context, number int, input MergePullRequestInput) error

	GetProjectItem(ctx context.Context, issueNumber int) (domain.ProjectItem, error)
	AddProjectItem(ctx context.Context, issueNumber int) error
	SetProjectStatus(ctx context.Context, issueNumber int, status domain.ProjectStatus) error
}

type CreateIssueInput struct {
	Title  string
	Body   string
	Labels []string
}

type PullRequestFilter struct {
	State  string
	Head   string
	Base   string
	Search string
}

type CreatePullRequestInput struct {
	Title string
	Body  string
	Head  string
	Base  string
	Draft bool
}

type MergePullRequestInput struct {
	Method       string
	DeleteBranch bool
	Auto         bool
}
