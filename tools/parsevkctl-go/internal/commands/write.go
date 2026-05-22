package commands

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/branch"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/config"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/git"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/github"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/planner"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/task"
)

type TaskCreateInput struct {
	Title  string
	Body   string
	Config config.Config
	GitHub github.Adapter
}

type TaskIssueInput struct {
	IssueNumber int
	Config      config.Config
	Git         git.Adapter
	GitHub      github.Adapter
}

type TaskRunInput struct {
	TaskIssueInput
	DryRun bool
	JSON   bool
	Stdout io.Writer
	Stderr io.Writer
}

type TaskCreateRunInput struct {
	TaskCreateInput
	DryRun bool
	JSON   bool
	Stdout io.Writer
	Stderr io.Writer
}

type TaskPlanResult struct {
	Plan planner.Plan `json:"plan"`
}

type TaskStartPlanResult struct {
	Plan       planner.Plan `json:"plan"`
	BranchName string       `json:"branchName"`
	Status     string       `json:"status"`
}

type TaskPRPlanResult struct {
	Plan            planner.Plan `json:"plan"`
	BranchName      string       `json:"branchName"`
	PullRequestBody string       `json:"pullRequestBody"`
	ExistingPR      *PRResult    `json:"existingPullRequest,omitempty"`
}

type TaskMergePlanResult struct {
	Plan        planner.Plan `json:"plan"`
	PullRequest PRResult     `json:"pullRequest"`
}

type PRResult struct {
	Number int    `json:"number"`
	URL    string `json:"url,omitempty"`
}

func RunTaskCreate(ctx context.Context, input TaskCreateRunInput) int {
	result, err := BuildTaskCreatePlan(ctx, input.TaskCreateInput)
	if err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	if input.DryRun {
		return renderPlan(input.Stdout, result.Plan, input.JSON)
	}

	executor := planner.Executor{GitHub: input.GitHub}
	execution, err := executor.ExecuteWithResult(ctx, result.Plan)
	if err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	if input.JSON {
		return renderJSON(input.Stdout, execution)
	}
	if execution.CreatedIssue != nil {
		fmt.Fprintf(output(input.Stdout), "Issue: #%d\nURL: %s\n", execution.CreatedIssue.ID, execution.CreatedIssue.URL)
		return 0
	}
	fmt.Fprintln(output(input.Stdout), "Task created.")
	return 0
}

func RunTaskStart(ctx context.Context, input TaskRunInput) int {
	result, err := BuildTaskStartPlan(ctx, input.TaskIssueInput)
	if err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	if input.DryRun {
		return renderPlan(input.Stdout, result.Plan, input.JSON)
	}

	executor := planner.Executor{Git: input.Git, GitHub: input.GitHub}
	if err := executor.Execute(ctx, result.Plan); err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	if input.JSON {
		return renderJSON(input.Stdout, result)
	}
	fmt.Fprintf(output(input.Stdout), "Task started.\nBranch: %s\nStatus: %s\n", result.BranchName, result.Status)
	return 0
}

func RunTaskPR(ctx context.Context, input TaskRunInput) int {
	result, err := BuildTaskPRPlan(ctx, input.TaskIssueInput)
	if err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	if result.ExistingPR != nil {
		if input.JSON {
			return renderJSON(input.Stdout, result)
		}
		fmt.Fprintf(output(input.Stdout), "Pull request already exists: #%d %s\n", result.ExistingPR.Number, result.ExistingPR.URL)
		return 0
	}
	if input.DryRun {
		return renderPlan(input.Stdout, result.Plan, input.JSON)
	}

	executor := planner.Executor{Git: input.Git, GitHub: input.GitHub}
	execution, err := executor.ExecuteWithResult(ctx, result.Plan)
	if err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	if input.JSON {
		return renderJSON(input.Stdout, execution)
	}
	if execution.CreatedPullRequest != nil {
		fmt.Fprintf(output(input.Stdout), "Pull request: #%d %s\n", execution.CreatedPullRequest.Number, execution.CreatedPullRequest.URL)
		return 0
	}
	fmt.Fprintf(output(input.Stdout), "Pull request created for issue #%d.\n", input.IssueNumber)
	return 0
}

func RunTaskMerge(ctx context.Context, input TaskRunInput) int {
	result, err := BuildTaskMergePlan(ctx, input.TaskIssueInput)
	if err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	if input.DryRun {
		return renderPlan(input.Stdout, result.Plan, input.JSON)
	}

	executor := planner.Executor{Git: input.Git, GitHub: input.GitHub}
	if err := executor.Execute(ctx, result.Plan); err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	if input.JSON {
		return renderJSON(input.Stdout, result)
	}
	fmt.Fprintf(output(input.Stdout), "Task merged via PR #%d.\n", result.PullRequest.Number)
	return 0
}

func BuildTaskCreatePlan(_ context.Context, input TaskCreateInput) (TaskPlanResult, error) {
	title := strings.TrimSpace(input.Title)
	if title == "" {
		return TaskPlanResult{}, fmt.Errorf("title is required")
	}
	if err := task.ValidateTransition(domain.TaskStateUntracked, domain.TaskStateTodo, task.TransitionOptions{}); err != nil {
		return TaskPlanResult{}, err
	}

	plan, err := planner.NewCreateTaskPlan(planner.CreateTaskInput{
		Title:          title,
		Body:           input.Body,
		AddProjectItem: projectConfigured(input.Config),
		TargetStatus:   domain.ProjectStatusTodo,
	})
	if err != nil {
		return TaskPlanResult{}, err
	}
	return TaskPlanResult{Plan: plan}, nil
}

func BuildTaskStartPlan(ctx context.Context, input TaskIssueInput) (TaskStartPlanResult, error) {
	issue, projectStatus, prs, err := loadIssueContext(ctx, input)
	if err != nil {
		return TaskStartPlanResult{}, err
	}
	if issue.State == domain.IssueStateClosed {
		return TaskStartPlanResult{}, fmt.Errorf("issue #%d is closed; suggested next command: parsevkctl task status %d", input.IssueNumber, input.IssueNumber)
	}

	branchName, err := branch.NewTaskBranchName(issue)
	if err != nil {
		return TaskStartPlanResult{}, fmt.Errorf("derive branch name: %w", err)
	}

	currentState := task.DeriveState(task.LifecycleSnapshot{
		IssueExists:      true,
		IssueState:       issue.State,
		ProjectStatus:    projectStatus,
		PullRequestState: chooseLifecyclePRState(prs),
	})
	if err := task.ValidateTransition(currentState, domain.TaskStateInProgress, task.TransitionOptions{}); err != nil {
		return TaskStartPlanResult{}, err
	}

	plan, err := planner.NewStartTaskPlan(planner.StartTaskInput{
		Issue:         issue,
		DefaultBranch: input.Config.DefaultBranch,
		BranchName:    branchName,
		TargetStatus:  domain.ProjectStatusInProgress,
	})
	if err != nil {
		return TaskStartPlanResult{}, err
	}
	return TaskStartPlanResult{Plan: plan, BranchName: branchName, Status: string(domain.ProjectStatusInProgress)}, nil
}

func BuildTaskPRPlan(ctx context.Context, input TaskIssueInput) (TaskPRPlanResult, error) {
	issue, projectStatus, prs, err := loadIssueContext(ctx, input)
	if err != nil {
		return TaskPRPlanResult{}, err
	}
	if issue.State != domain.IssueStateOpen {
		return TaskPRPlanResult{}, fmt.Errorf("issue #%d is not open", input.IssueNumber)
	}

	currentBranch, err := input.Git.CurrentBranch(ctx)
	if err != nil {
		return TaskPRPlanResult{}, fmt.Errorf("read current branch: %w", err)
	}
	parsedBranch, err := branch.ParseTaskBranchName(currentBranch)
	if err != nil {
		return TaskPRPlanResult{}, fmt.Errorf("current branch %q is not a valid task branch: %w", currentBranch, err)
	}
	if parsedBranch.IssueNumber != input.IssueNumber {
		return TaskPRPlanResult{}, fmt.Errorf("branch issue number %d does not match requested issue #%d; suggested next command: parsevkctl task status %d", parsedBranch.IssueNumber, input.IssueNumber, input.IssueNumber)
	}

	if existing := existingOpenPR(prs, currentBranch, input.Config.DefaultBranch); existing != nil {
		return TaskPRPlanResult{ExistingPR: &PRResult{Number: int(existing.Number), URL: existing.URL}, BranchName: currentBranch}, nil
	}

	clean, files, err := input.Git.IsWorkTreeClean(ctx)
	if err != nil {
		return TaskPRPlanResult{}, fmt.Errorf("read working tree status: %w", err)
	}
	if !clean {
		return TaskPRPlanResult{}, fmt.Errorf("working tree is dirty (%s); commit or stash changes, then run: parsevkctl task pr %d", strings.Join(files, ", "), input.IssueNumber)
	}

	hasAhead, err := input.Git.HasCommitsAhead(ctx, input.Config.DefaultBranch, currentBranch)
	if err != nil {
		return TaskPRPlanResult{}, fmt.Errorf("check commits ahead of %s: %w", input.Config.DefaultBranch, err)
	}
	if !hasAhead {
		return TaskPRPlanResult{}, fmt.Errorf("branch %q has no commits ahead of %s; commit changes, then run: parsevkctl task pr %d", currentBranch, input.Config.DefaultBranch, input.IssueNumber)
	}

	currentState := task.DeriveState(task.LifecycleSnapshot{
		IssueExists:       true,
		IssueState:        issue.State,
		ProjectStatus:     projectStatus,
		LocalBranchExists: true,
		PullRequestState:  chooseLifecyclePRState(prs),
		PullRequestDraft:  chooseLifecyclePRDraft(prs),
		PullRequestMerged: chooseLifecyclePRMerged(prs),
	})
	if err := task.ValidateTransition(currentState, domain.TaskStateReview, task.TransitionOptions{}); err != nil {
		return TaskPRPlanResult{}, err
	}

	body := pullRequestBody(input.IssueNumber)
	plan, err := planner.NewCreatePullRequestPlan(planner.CreatePullRequestInput{
		Issue:        issue,
		BranchName:   currentBranch,
		BaseBranch:   input.Config.DefaultBranch,
		Title:        issue.Title,
		Body:         body,
		TargetStatus: domain.ProjectStatusReview,
	})
	if err != nil {
		return TaskPRPlanResult{}, err
	}
	return TaskPRPlanResult{Plan: plan, BranchName: currentBranch, PullRequestBody: body}, nil
}

func BuildTaskMergePlan(ctx context.Context, input TaskIssueInput) (TaskMergePlanResult, error) {
	issue, projectStatus, prs, err := loadIssueContext(ctx, input)
	if err != nil {
		return TaskMergePlanResult{}, err
	}
	linked, err := exactlyOneLinkedPR(input.IssueNumber, prs)
	if err != nil {
		return TaskMergePlanResult{}, err
	}
	if linked.Draft {
		return TaskMergePlanResult{}, fmt.Errorf("pull request #%d is draft; mark it ready for review before merge", linked.Number)
	}
	if linked.Base != input.Config.DefaultBranch {
		return TaskMergePlanResult{}, fmt.Errorf("pull request #%d base branch %q does not match %q", linked.Number, linked.Base, input.Config.DefaultBranch)
	}
	if requireChecks(input.Config) {
		return TaskMergePlanResult{}, fmt.Errorf("merge.requireChecks=true but check status adapter is not implemented; verify checks manually or disable requireChecks in config")
	}

	currentState := task.DeriveState(task.LifecycleSnapshot{
		IssueExists:       true,
		IssueState:        issue.State,
		ProjectStatus:     projectStatus,
		PullRequestState:  linked.State,
		PullRequestDraft:  linked.Draft,
		PullRequestMerged: linked.Merged,
	})
	if err := task.ValidateTransition(currentState, domain.TaskStateMerged, task.TransitionOptions{}); err != nil {
		return TaskMergePlanResult{}, err
	}

	currentBranch, err := input.Git.CurrentBranch(ctx)
	if err != nil {
		return TaskMergePlanResult{}, fmt.Errorf("read current branch: %w", err)
	}
	plan, err := planner.NewMergeTaskPlan(planner.MergeTaskInput{
		Issue:              issue,
		PullRequest:        *linked,
		DefaultBranch:      input.Config.DefaultBranch,
		TargetStatus:       domain.ProjectStatusDone,
		MergeMethod:        mergeStrategy(input.Config),
		DeleteRemoteBranch: mergeDeletesBranch(input.Config),
		CloseIssue:         true,
		SyncDefaultBranch:  currentBranch != input.Config.DefaultBranch,
	})
	if err != nil {
		return TaskMergePlanResult{}, err
	}
	return TaskMergePlanResult{Plan: plan, PullRequest: PRResult{Number: int(linked.Number), URL: linked.URL}}, nil
}

func loadIssueContext(ctx context.Context, input TaskIssueInput) (domain.Issue, domain.ProjectStatus, []domain.PullRequest, error) {
	if input.IssueNumber <= 0 {
		return domain.Issue{}, domain.ProjectStatusUnknown, nil, fmt.Errorf("issue number must be a positive integer")
	}
	issue, err := input.GitHub.GetIssue(ctx, input.IssueNumber)
	if err != nil {
		return domain.Issue{}, domain.ProjectStatusUnknown, nil, fmt.Errorf("get issue #%d: %w", input.IssueNumber, err)
	}
	prs, err := input.GitHub.ListPullRequests(ctx, github.PullRequestFilter{State: "all", Search: strconv.Itoa(input.IssueNumber)})
	if err != nil {
		return domain.Issue{}, domain.ProjectStatusUnknown, nil, fmt.Errorf("list pull requests for issue #%d: %w", input.IssueNumber, err)
	}
	projectStatus := domain.ProjectStatusTodo
	if projectConfigured(input.Config) {
		if project, err := input.GitHub.GetProjectItem(ctx, input.IssueNumber); err == nil && project.Status != domain.ProjectStatusUnknown {
			projectStatus = project.Status
		}
	}
	return issue, projectStatus, prs, nil
}

func projectConfigured(cfg config.Config) bool {
	return strings.TrimSpace(cfg.ProjectOwner) != "" && cfg.ProjectNumber > 0 && strings.TrimSpace(cfg.ProjectID) != ""
}

func chooseLifecyclePRState(prs []domain.PullRequest) domain.PullRequestState {
	if pr := choosePullRequest(prs); pr != nil {
		return pr.State
	}
	return domain.PullRequestStateNone
}

func chooseLifecyclePRDraft(prs []domain.PullRequest) bool {
	if pr := choosePullRequest(prs); pr != nil {
		return pr.Draft
	}
	return false
}

func chooseLifecyclePRMerged(prs []domain.PullRequest) bool {
	if pr := choosePullRequest(prs); pr != nil {
		return pr.Merged
	}
	return false
}

func existingOpenPR(prs []domain.PullRequest, head string, base string) *domain.PullRequest {
	for i := range prs {
		if prs[i].Head == head && prs[i].Base == base && (prs[i].State == domain.PullRequestStateOpen || prs[i].State == domain.PullRequestStateDraft) {
			return &prs[i]
		}
	}
	return nil
}

func exactlyOneLinkedPR(issueNumber int, prs []domain.PullRequest) (*domain.PullRequest, error) {
	if len(prs) == 0 {
		return nil, fmt.Errorf("no linked pull request found for issue #%d; suggested next command: parsevkctl task pr %d", issueNumber, issueNumber)
	}
	if len(prs) > 1 {
		return nil, fmt.Errorf("multiple linked pull requests found for issue #%d; resolve ambiguity manually", issueNumber)
	}
	return &prs[0], nil
}

func pullRequestBody(issueNumber int) string {
	return fmt.Sprintf(`Closes #%d

## Summary
- ...

## Test plan
- [ ] Not run
- [ ] Manual test
- [ ] Automated tests

## Risk
- Low

## Notes
Created via parsevkctl.
`, issueNumber)
}

func requireChecks(cfg config.Config) bool {
	return cfg.Merge.RequireChecks != nil && *cfg.Merge.RequireChecks
}

func mergeStrategy(cfg config.Config) string {
	if strings.TrimSpace(cfg.Merge.Strategy) != "" {
		return cfg.Merge.Strategy
	}
	return "merge"
}

func mergeDeletesBranch(cfg config.Config) bool {
	if cfg.Merge.DeleteBranch == nil {
		return false
	}
	return *cfg.Merge.DeleteBranch
}

func renderPlan(w io.Writer, plan planner.Plan, jsonOutput bool) int {
	if jsonOutput {
		return renderJSON(w, plan)
	}
	for _, line := range planner.RenderDryRun(plan) {
		fmt.Fprintln(output(w), line)
	}
	return 0
}

func renderJSON(w io.Writer, value any) int {
	encoded, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return 1
	}
	fmt.Fprintln(output(w), string(encoded))
	return 0
}

func output(w io.Writer) io.Writer {
	if w == nil {
		return io.Discard
	}
	return w
}
