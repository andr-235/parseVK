package commands

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/branch"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/config"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/git"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/github"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/task"
)

type TaskStatusInput struct {
	IssueNumber int
	Config      config.Config
	Git         git.Adapter
	GitHub      github.Adapter
	JSON        bool
	Stdout      io.Writer
	Stderr      io.Writer
}

type StatusResult struct {
	Issue             IssueStatusResult        `json:"issue"`
	Project           ProjectStatusResult      `json:"project"`
	LinkedPullRequest *PullRequestStatusResult `json:"linkedPullRequest,omitempty"`
	Git               GitStatusResult          `json:"git"`
	LifecycleState    domain.TaskState         `json:"lifecycleState"`
	SuggestedCommand  string                   `json:"suggestedCommand"`
	Warnings          []StatusWarning          `json:"warnings,omitempty"`
}

type IssueStatusResult struct {
	Number int               `json:"number"`
	Title  string            `json:"title"`
	State  domain.IssueState `json:"state"`
	URL    string            `json:"url,omitempty"`
}

type ProjectStatusResult struct {
	Status    domain.ProjectStatus `json:"status"`
	Available bool                 `json:"available"`
	Message   string               `json:"message,omitempty"`
}

type PullRequestStatusResult struct {
	Number int                     `json:"number"`
	URL    string                  `json:"url,omitempty"`
	State  domain.PullRequestState `json:"state"`
	Draft  bool                    `json:"draft"`
	Base   string                  `json:"base,omitempty"`
	Head   string                  `json:"head,omitempty"`
}

type GitStatusResult struct {
	CurrentBranch  string   `json:"currentBranch"`
	ExpectedBranch string   `json:"expectedBranch"`
	WorkTreeClean  bool     `json:"workTreeClean"`
	ChangedFiles   []string `json:"changedFiles,omitempty"`
}

type StatusWarning struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func RunTaskStatus(ctx context.Context, input TaskStatusInput) int {
	result, err := BuildStatus(ctx, input)
	if err != nil {
		writeError(input.Stderr, err)
		return 1
	}

	if err := renderStatus(input.Stdout, result, input.JSON); err != nil {
		writeError(input.Stderr, err)
		return 1
	}

	return 0
}

func BuildStatus(ctx context.Context, input TaskStatusInput) (StatusResult, error) {
	if input.IssueNumber <= 0 {
		return StatusResult{}, fmt.Errorf("issue number must be a positive integer")
	}

	issue, err := input.GitHub.GetIssue(ctx, input.IssueNumber)
	if err != nil {
		return StatusResult{}, fmt.Errorf("get issue #%d: %w", input.IssueNumber, err)
	}

	prs, err := input.GitHub.ListPullRequests(ctx, github.PullRequestFilter{
		State:  "all",
		Search: strconv.Itoa(input.IssueNumber),
	})
	if err != nil {
		return StatusResult{}, fmt.Errorf("list pull requests for issue #%d: %w", input.IssueNumber, err)
	}

	project := ProjectStatusResult{Status: domain.ProjectStatusUnknown}
	var warnings []StatusWarning
	projectItem, err := input.GitHub.GetProjectItem(ctx, input.IssueNumber)
	if err != nil {
		project.Message = "project status unavailable"
		warnings = append(warnings, StatusWarning{
			Code:    "project_status_unavailable",
			Message: projectUnavailableMessage(err),
		})
	} else {
		project.Available = true
		project.Status = projectItem.Status
	}

	currentBranch, err := input.Git.CurrentBranch(ctx)
	if err != nil {
		return StatusResult{}, fmt.Errorf("read current branch: %w", err)
	}
	clean, changedFiles, err := input.Git.IsWorkTreeClean(ctx)
	if err != nil {
		return StatusResult{}, fmt.Errorf("read working tree status: %w", err)
	}

	expectedBranch, err := branch.NewTaskBranchName(issue)
	if err != nil {
		return StatusResult{}, fmt.Errorf("derive expected task branch: %w", err)
	}

	linkedPR := choosePullRequest(prs)
	snapshot := task.LifecycleSnapshot{
		IssueExists:        true,
		IssueState:         issue.State,
		ProjectStatus:      project.Status,
		LocalBranchExists:  isTaskBranchForIssue(currentBranch, input.IssueNumber, expectedBranch),
		RemoteBranchExists: linkedPR != nil && linkedPR.Head == expectedBranch,
	}
	if linkedPR != nil {
		snapshot.PullRequestState = linkedPR.State
		snapshot.PullRequestDraft = linkedPR.Draft
		snapshot.PullRequestMerged = linkedPR.Merged
	}

	lifecycleState := task.DeriveState(snapshot)
	result := StatusResult{
		Issue: IssueStatusResult{
			Number: int(issue.ID),
			Title:  issue.Title,
			State:  issue.State,
			URL:    issue.URL,
		},
		Project: project,
		Git: GitStatusResult{
			CurrentBranch:  currentBranch,
			ExpectedBranch: expectedBranch,
			WorkTreeClean:  clean,
			ChangedFiles:   changedFiles,
		},
		LifecycleState:   lifecycleState,
		SuggestedCommand: task.SuggestedNextCommand(lifecycleState),
		Warnings:         warnings,
	}
	if linkedPR != nil {
		result.LinkedPullRequest = &PullRequestStatusResult{
			Number: int(linkedPR.Number),
			URL:    linkedPR.URL,
			State:  linkedPR.State,
			Draft:  linkedPR.Draft,
			Base:   linkedPR.Base,
			Head:   linkedPR.Head,
		}
	}

	return result, nil
}

func renderStatus(w io.Writer, result StatusResult, jsonOutput bool) error {
	if w == nil {
		w = io.Discard
	}
	if jsonOutput {
		encoded, err := json.MarshalIndent(result, "", "  ")
		if err != nil {
			return err
		}
		fmt.Fprintln(w, string(encoded))
		return nil
	}

	fmt.Fprintf(w, "Task status #%d\n", result.Issue.Number)
	fmt.Fprintf(w, "Title: %s\n", result.Issue.Title)
	fmt.Fprintf(w, "Issue: %s\n", result.Issue.State)
	if result.Issue.URL != "" {
		fmt.Fprintf(w, "Issue URL: %s\n", result.Issue.URL)
	}
	if result.Project.Available {
		fmt.Fprintf(w, "Project: %s\n", result.Project.Status)
	} else {
		fmt.Fprintln(w, "Project: unavailable")
	}
	if result.LinkedPullRequest == nil {
		fmt.Fprintln(w, "Pull request: none")
	} else {
		pr := result.LinkedPullRequest
		fmt.Fprintf(w, "Pull request: #%d %s draft=%t base=%s head=%s\n", pr.Number, pr.State, pr.Draft, pr.Base, pr.Head)
		if pr.URL != "" {
			fmt.Fprintf(w, "Pull request URL: %s\n", pr.URL)
		}
	}
	fmt.Fprintf(w, "Current branch: %s\n", result.Git.CurrentBranch)
	fmt.Fprintf(w, "Expected branch: %s\n", result.Git.ExpectedBranch)
	if result.Git.WorkTreeClean {
		fmt.Fprintln(w, "Working tree: clean")
	} else {
		fmt.Fprintln(w, "Working tree: dirty")
	}
	fmt.Fprintf(w, "Lifecycle state: %s\n", result.LifecycleState)
	fmt.Fprintf(w, "Suggested next command: %s\n", result.SuggestedCommand)
	for _, warning := range result.Warnings {
		fmt.Fprintf(w, "Warning: %s\n", warning.Message)
	}

	return nil
}

func choosePullRequest(prs []domain.PullRequest) *domain.PullRequest {
	for i := range prs {
		if prs[i].State == domain.PullRequestStateOpen || prs[i].State == domain.PullRequestStateDraft {
			return &prs[i]
		}
	}
	for i := range prs {
		if prs[i].Merged || prs[i].State == domain.PullRequestStateMerged {
			return &prs[i]
		}
	}
	if len(prs) == 0 {
		return nil
	}
	return &prs[0]
}

func isTaskBranchForIssue(currentBranch string, issueNumber int, expectedBranch string) bool {
	if currentBranch == expectedBranch {
		return true
	}
	parsed, err := branch.ParseTaskBranchName(currentBranch)
	if err != nil {
		return false
	}
	return parsed.IssueNumber == issueNumber
}

func projectUnavailableMessage(err error) string {
	if errors.Is(err, github.ErrProjectNotImplemented) {
		return "project status unavailable: adapter does not implement project reads"
	}
	return "project status unavailable: " + err.Error()
}

func writeError(w io.Writer, err error) {
	if w == nil {
		return
	}
	fmt.Fprintln(w, "Error:", strings.TrimSpace(err.Error()))
}
