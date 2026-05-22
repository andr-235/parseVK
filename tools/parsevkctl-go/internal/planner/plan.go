package planner

import (
	"fmt"
	"strings"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
)

type OperationType string

const (
	OperationIssueCreate        OperationType = "Issue.Create"
	OperationIssueClose         OperationType = "Issue.Close"
	OperationProjectAddItem     OperationType = "Project.AddItem"
	OperationProjectSetStatus   OperationType = "Project.SetStatus"
	OperationGitFetch           OperationType = "Git.Fetch"
	OperationGitSwitch          OperationType = "Git.Switch"
	OperationGitPullFastForward OperationType = "Git.PullFastForward"
	OperationGitCreateBranch    OperationType = "Git.CreateBranch"
	OperationGitPushBranch      OperationType = "Git.PushBranch"
	OperationPullRequestCreate  OperationType = "PullRequest.Create"
	OperationPullRequestMerge   OperationType = "PullRequest.Merge"
	OperationBranchDeleteLocal  OperationType = "Branch.DeleteLocal"
	OperationBranchDeleteRemote OperationType = "Branch.DeleteRemote"
)

const originRemote = "origin"

type Operation struct {
	ID          string        `json:"id"`
	Type        OperationType `json:"type"`
	Description string        `json:"description"`
	SafeToRetry bool          `json:"safeToRetry"`
	Payload     any           `json:"payload,omitempty"`
}

type Plan struct {
	Command    string      `json:"command"`
	Issue      int         `json:"issue,omitempty"`
	Operations []Operation `json:"operations"`
}

type StartTaskInput struct {
	Issue         domain.Issue
	DefaultBranch string
	BranchName    string
	TargetStatus  domain.ProjectStatus
}

type CreateTaskInput struct {
	Title              string
	Body               string
	Labels             []string
	AddProjectItem     bool
	ProjectIssueNumber int
	TargetStatus       domain.ProjectStatus
}

type CreatePullRequestInput struct {
	Issue             domain.Issue
	BranchName        string
	BaseBranch        string
	Title             string
	Body              string
	TargetStatus      domain.ProjectStatus
	DeleteLocalBranch bool
}

type MergeTaskInput struct {
	Issue              domain.Issue
	PullRequest        domain.PullRequest
	DefaultBranch      string
	TargetStatus       domain.ProjectStatus
	MergeMethod        string
	DeleteRemoteBranch bool
	CloseIssue         bool
	SyncDefaultBranch  bool
}

type ProjectStatusPayload struct {
	IssueNumber int                  `json:"issueNumber"`
	Status      domain.ProjectStatus `json:"status"`
}

type ProjectIssuePayload struct {
	IssueNumber int `json:"issueNumber"`
}

type GitRefPayload struct {
	Remote string `json:"remote"`
	Branch string `json:"branch"`
}

type GitBranchPayload struct {
	Branch string `json:"branch"`
}

type DeleteLocalBranchPayload struct {
	Branch string `json:"branch"`
	Force  bool   `json:"force"`
}

type PullRequestPayload struct {
	Title string `json:"title"`
	Body  string `json:"body"`
	Head  string `json:"head"`
	Base  string `json:"base"`
	Draft bool   `json:"draft"`
}

type MergePullRequestPayload struct {
	Number       int    `json:"number"`
	Method       string `json:"method"`
	DeleteBranch bool   `json:"deleteBranch"`
	Auto         bool   `json:"auto"`
}

func NewStartTaskPlan(input StartTaskInput) (Plan, error) {
	issueNumber, err := validateIssue(input.Issue)
	if err != nil {
		return Plan{}, err
	}
	defaultBranch, err := validateNonEmpty("default branch", input.DefaultBranch)
	if err != nil {
		return Plan{}, err
	}
	branchName, err := validateNonEmpty("branch name", input.BranchName)
	if err != nil {
		return Plan{}, err
	}
	targetStatus, err := validateProjectStatus(input.TargetStatus)
	if err != nil {
		return Plan{}, err
	}

	return Plan{
		Command: "task start",
		Issue:   issueNumber,
		Operations: []Operation{
			{
				ID:          "project-set-status-" + statusID(targetStatus),
				Type:        OperationProjectSetStatus,
				Description: fmt.Sprintf("Set project status for issue #%d to %s", issueNumber, targetStatus),
				SafeToRetry: true,
				Payload:     ProjectStatusPayload{IssueNumber: issueNumber, Status: targetStatus},
			},
			{
				ID:          "git-fetch-default-branch",
				Type:        OperationGitFetch,
				Description: fmt.Sprintf("Fetch origin/%s", defaultBranch),
				SafeToRetry: true,
				Payload:     GitRefPayload{Remote: originRemote, Branch: defaultBranch},
			},
			{
				ID:          "git-switch-default-branch",
				Type:        OperationGitSwitch,
				Description: fmt.Sprintf("Switch to %s", defaultBranch),
				SafeToRetry: true,
				Payload:     GitBranchPayload{Branch: defaultBranch},
			},
			{
				ID:          "git-pull-fast-forward-default-branch",
				Type:        OperationGitPullFastForward,
				Description: fmt.Sprintf("Pull %s with --ff-only from origin", defaultBranch),
				SafeToRetry: true,
				Payload:     GitRefPayload{Remote: originRemote, Branch: defaultBranch},
			},
			{
				ID:          "git-create-task-branch",
				Type:        OperationGitCreateBranch,
				Description: fmt.Sprintf("Create task branch %s", branchName),
				SafeToRetry: false,
				Payload:     GitBranchPayload{Branch: branchName},
			},
		},
	}, nil
}

func NewCreateTaskPlan(input CreateTaskInput) (Plan, error) {
	title, err := validateNonEmpty("issue title", input.Title)
	if err != nil {
		return Plan{}, err
	}

	operations := []Operation{
		{
			ID:          "issue-create",
			Type:        OperationIssueCreate,
			Description: fmt.Sprintf("Create GitHub issue %q", title),
			SafeToRetry: false,
			Payload: IssueCreatePayload{
				Title:  title,
				Body:   input.Body,
				Labels: input.Labels,
			},
		},
	}

	if input.AddProjectItem {
		targetStatus, err := validateProjectStatus(input.TargetStatus)
		if err != nil {
			return Plan{}, err
		}
		issueDescription := "created issue"
		if input.ProjectIssueNumber > 0 {
			issueDescription = fmt.Sprintf("issue #%d", input.ProjectIssueNumber)
		}
		operations = append(operations,
			Operation{
				ID:          "project-add-item",
				Type:        OperationProjectAddItem,
				Description: fmt.Sprintf("Add %s to GitHub Project", issueDescription),
				SafeToRetry: true,
				Payload:     ProjectIssuePayload{IssueNumber: input.ProjectIssueNumber},
			},
			Operation{
				ID:          "project-set-status-" + statusID(targetStatus),
				Type:        OperationProjectSetStatus,
				Description: fmt.Sprintf("Set project status for %s to %s", issueDescription, targetStatus),
				SafeToRetry: true,
				Payload:     ProjectStatusPayload{IssueNumber: input.ProjectIssueNumber, Status: targetStatus},
			},
		)
	}

	return Plan{
		Command:    "task create",
		Operations: operations,
	}, nil
}

func NewCreatePullRequestPlan(input CreatePullRequestInput) (Plan, error) {
	issueNumber, err := validateIssue(input.Issue)
	if err != nil {
		return Plan{}, err
	}
	branchName, err := validateNonEmpty("branch name", input.BranchName)
	if err != nil {
		return Plan{}, err
	}
	baseBranch, err := validateNonEmpty("base branch", input.BaseBranch)
	if err != nil {
		return Plan{}, err
	}
	title, err := validateNonEmpty("pull request title", input.Title)
	if err != nil {
		return Plan{}, err
	}
	targetStatus, err := validateProjectStatus(input.TargetStatus)
	if err != nil {
		return Plan{}, err
	}

	operations := []Operation{
		{
			ID:          "git-push-task-branch",
			Type:        OperationGitPushBranch,
			Description: fmt.Sprintf("Push task branch %s to origin", branchName),
			SafeToRetry: true,
			Payload:     GitRefPayload{Remote: originRemote, Branch: branchName},
		},
		{
			ID:          "pull-request-create",
			Type:        OperationPullRequestCreate,
			Description: fmt.Sprintf("Create pull request %q from %s to %s", title, branchName, baseBranch),
			SafeToRetry: false,
			Payload: PullRequestPayload{
				Title: title,
				Body:  input.Body,
				Head:  branchName,
				Base:  baseBranch,
			},
		},
		{
			ID:          "project-set-status-" + statusID(targetStatus),
			Type:        OperationProjectSetStatus,
			Description: fmt.Sprintf("Set project status for issue #%d to %s", issueNumber, targetStatus),
			SafeToRetry: true,
			Payload:     ProjectStatusPayload{IssueNumber: issueNumber, Status: targetStatus},
		},
	}

	if input.DeleteLocalBranch {
		operations = append(operations, Operation{
			ID:          "branch-delete-local-task-branch",
			Type:        OperationBranchDeleteLocal,
			Description: fmt.Sprintf("Delete local task branch %s", branchName),
			SafeToRetry: true,
			Payload:     DeleteLocalBranchPayload{Branch: branchName},
		})
	}

	return Plan{
		Command:    "task pr",
		Issue:      issueNumber,
		Operations: operations,
	}, nil
}

func NewMergeTaskPlan(input MergeTaskInput) (Plan, error) {
	issueNumber, err := validateIssue(input.Issue)
	if err != nil {
		return Plan{}, err
	}
	defaultBranch, err := validateNonEmpty("default branch", input.DefaultBranch)
	if err != nil {
		return Plan{}, err
	}
	if input.PullRequest.Number <= 0 {
		return Plan{}, fmt.Errorf("pull request number must be a positive integer")
	}
	targetStatus, err := validateProjectStatus(input.TargetStatus)
	if err != nil {
		return Plan{}, err
	}

	method := strings.TrimSpace(input.MergeMethod)
	if method == "" {
		method = "merge"
	}

	operations := []Operation{}
	if !input.PullRequest.Merged && input.PullRequest.State != domain.PullRequestStateMerged {
		operations = append(operations, Operation{
			ID:          "pull-request-merge",
			Type:        OperationPullRequestMerge,
			Description: fmt.Sprintf("Merge pull request #%d", input.PullRequest.Number),
			SafeToRetry: false,
			Payload: MergePullRequestPayload{
				Number:       int(input.PullRequest.Number),
				Method:       method,
				DeleteBranch: input.DeleteRemoteBranch,
			},
		})
	}

	operations = append(operations, Operation{
		ID:          "project-set-status-" + statusID(targetStatus),
		Type:        OperationProjectSetStatus,
		Description: fmt.Sprintf("Set project status for issue #%d to %s", issueNumber, targetStatus),
		SafeToRetry: true,
		Payload:     ProjectStatusPayload{IssueNumber: issueNumber, Status: targetStatus},
	})

	if input.CloseIssue && input.Issue.State != domain.IssueStateClosed {
		operations = append(operations, Operation{
			ID:          "issue-close",
			Type:        OperationIssueClose,
			Description: fmt.Sprintf("Close issue #%d", issueNumber),
			SafeToRetry: true,
			Payload:     IssueClosePayload{IssueNumber: issueNumber},
		})
	}

	if input.SyncDefaultBranch {
		operations = append(operations,
			Operation{
				ID:          "git-switch-default-branch",
				Type:        OperationGitSwitch,
				Description: fmt.Sprintf("Switch to %s", defaultBranch),
				SafeToRetry: true,
				Payload:     GitBranchPayload{Branch: defaultBranch},
			},
			Operation{
				ID:          "git-pull-fast-forward-default-branch",
				Type:        OperationGitPullFastForward,
				Description: fmt.Sprintf("Pull %s with --ff-only from origin", defaultBranch),
				SafeToRetry: true,
				Payload:     GitRefPayload{Remote: originRemote, Branch: defaultBranch},
			},
		)
	}

	return Plan{
		Command:    "task merge",
		Issue:      issueNumber,
		Operations: operations,
	}, nil
}

func RenderDryRun(plan Plan) []string {
	lines := make([]string, 0, len(plan.Operations)+1)
	header := plan.Command
	if plan.Issue > 0 {
		header = fmt.Sprintf("%s #%d", plan.Command, plan.Issue)
	}
	lines = append(lines, header)

	for i, operation := range plan.Operations {
		lines = append(lines, fmt.Sprintf("%d. [%s] %s", i+1, operation.Type, operation.Description))
	}

	return lines
}

func validateIssue(issue domain.Issue) (int, error) {
	if err := domain.ValidateTaskID(issue.ID); err != nil {
		return 0, err
	}

	return int(issue.ID), nil
}

func validateNonEmpty(name string, value string) (string, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "", fmt.Errorf("%s must not be empty", name)
	}

	return trimmed, nil
}

func validateProjectStatus(status domain.ProjectStatus) (domain.ProjectStatus, error) {
	if status == "" || status == domain.ProjectStatusUnknown {
		return "", fmt.Errorf("project status must not be empty or unknown")
	}

	return status, nil
}

func statusID(status domain.ProjectStatus) string {
	return strings.ReplaceAll(strings.ToLower(string(status)), " ", "-")
}
