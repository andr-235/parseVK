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
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/planner"
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
	Checks            ChecksStatusResult       `json:"checks"`
	Git               GitStatusResult          `json:"git"`
	LifecycleState    domain.TaskState         `json:"lifecycleState"`
	WorkflowStage     string                   `json:"workflowStage"`
	Gate              StatusGateResult         `json:"gate"`
	SuggestedCommand  string                   `json:"suggestedCommand"`
	Warnings          []StatusWarning          `json:"warnings,omitempty"`
}

type IssueStatusResult struct {
	Number int               `json:"number"`
	Title  string            `json:"title"`
	State  domain.IssueState `json:"state"`
	Labels []string          `json:"labels"`
	URL    string            `json:"url,omitempty"`
}

type ProjectStatusResult struct {
	Status    domain.ProjectStatus `json:"status"`
	Available bool                 `json:"available"`
	Message   string               `json:"message,omitempty"`
}

type PullRequestStatusResult struct {
	Number       int                     `json:"number"`
	Title        string                  `json:"title"`
	URL          string                  `json:"url,omitempty"`
	State        domain.PullRequestState `json:"state"`
	Draft        bool                    `json:"draft"`
	Base         string                  `json:"base,omitempty"`
	Head         string                  `json:"head,omitempty"`
	Mergeable    string                  `json:"mergeable"`
	ClosesIssue  bool                    `json:"closesIssue"`
	ChangedFiles []string                `json:"changedFiles,omitempty"`
}

type GitStatusResult struct {
	DefaultBranch                string   `json:"defaultBranch"`
	CurrentBranch                string   `json:"currentBranch"`
	ExpectedBranch               string   `json:"expectedBranch"`
	WorkTreeClean                bool     `json:"workTreeClean"`
	ChangedFiles                 []string `json:"changedFiles,omitempty"`
	LocalBranchExists            bool     `json:"localBranchExists"`
	RemoteBranchExists           bool     `json:"remoteBranchExists"`
	HasCommitsAhead              *bool    `json:"hasCommitsAhead,omitempty"`
	CurrentBranchMatchesExpected bool     `json:"currentBranchMatchesExpected"`
}

type ChecksStatusResult struct {
	Available  bool     `json:"available"`
	Lines      []string `json:"lines,omitempty"`
	Total      int      `json:"total"`
	Successful int      `json:"successful"`
	Pending    int      `json:"pending"`
	Failed     int      `json:"failed"`
	Skipped    int      `json:"skipped"`
	Message    string   `json:"message,omitempty"`
}

type StatusGateResult struct {
	Blockers         []string `json:"blockers"`
	NonBlockingNotes []string `json:"nonBlockingNotes"`
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
	defaultBranch, err := input.Git.DefaultBranch(ctx)
	if err != nil {
		return StatusResult{}, fmt.Errorf("detect default branch: %w", err)
	}
	if strings.TrimSpace(defaultBranch) == "" {
		return StatusResult{}, fmt.Errorf("default branch cannot be detected")
	}
	clean, changedFiles, err := input.Git.IsWorkTreeClean(ctx)
	if err != nil {
		return StatusResult{}, fmt.Errorf("read working tree status: %w", err)
	}

	expectedBranch, err := branch.NewTaskBranchName(issue)
	if err != nil {
		return StatusResult{}, fmt.Errorf("derive expected task branch: %w", err)
	}
	localBranchExists, err := input.Git.LocalBranchExists(ctx, expectedBranch)
	if err != nil {
		return StatusResult{}, fmt.Errorf("check local branch %q: %w", expectedBranch, err)
	}
	remoteBranchExists, err := input.Git.RemoteBranchExists(ctx, "origin", expectedBranch)
	if err != nil {
		return StatusResult{}, fmt.Errorf("check remote branch %q: %w", expectedBranch, err)
	}
	var hasAhead *bool
	if localBranchExists {
		ahead, aheadErr := input.Git.HasCommitsAhead(ctx, defaultBranch, expectedBranch)
		if aheadErr != nil {
			warnings = append(warnings, StatusWarning{
				Code:    "commits_ahead_unavailable",
				Message: "could not check commits ahead: " + aheadErr.Error(),
			})
		} else {
			hasAhead = &ahead
		}
	}

	linkedPR := choosePullRequest(prs)
	var linkedDetails github.PullRequestDetails
	var linkedBody string
	var mergeable github.MergeableState
	var checksResult ChecksStatusResult
	if linkedPR != nil {
		linkedDetails, err = input.GitHub.GetPullRequestDetails(ctx, int(linkedPR.Number))
		if err != nil {
			return StatusResult{}, fmt.Errorf("get pull request #%d details: %w", linkedPR.Number, err)
		}
		pr := linkedDetails.PullRequest
		linkedPR = &pr
		linkedBody = linkedDetails.Body
		mergeable = linkedDetails.Mergeable
		checks, checkErr := input.GitHub.GetPullRequestChecks(ctx, int(linkedPR.Number))
		checksResult = buildChecksStatus(checks, checkErr)
	}
	gate := buildStatusGate(input.IssueNumber, issue, expectedBranch, currentBranch, clean, linkedPR, linkedBody, mergeable, checksResult)
	stage := inferWorkflowStage(issue, linkedPR, localBranchExists, remoteBranchExists, hasAhead, gate)
	snapshot := task.LifecycleSnapshot{
		IssueExists:        true,
		IssueState:         issue.State,
		ProjectStatus:      project.Status,
		LocalBranchExists:  localBranchExists,
		RemoteBranchExists: remoteBranchExists,
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
			Labels: append([]string(nil), issue.Labels...),
			URL:    issue.URL,
		},
		Project: project,
		Checks:  checksResult,
		Git: GitStatusResult{
			DefaultBranch:                defaultBranch,
			CurrentBranch:                currentBranch,
			ExpectedBranch:               expectedBranch,
			WorkTreeClean:                clean,
			ChangedFiles:                 changedFiles,
			LocalBranchExists:            localBranchExists,
			RemoteBranchExists:           remoteBranchExists,
			HasCommitsAhead:              hasAhead,
			CurrentBranchMatchesExpected: currentBranch == expectedBranch,
		},
		LifecycleState:   lifecycleState,
		WorkflowStage:    stage,
		Gate:             gate,
		SuggestedCommand: suggestedStatusCommand(stage, input.IssueNumber),
		Warnings:         warnings,
	}
	if linkedPR != nil {
		result.LinkedPullRequest = &PullRequestStatusResult{
			Number:       int(linkedPR.Number),
			Title:        linkedPR.Title,
			URL:          linkedPR.URL,
			State:        linkedPR.State,
			Draft:        linkedPR.Draft,
			Base:         linkedPR.Base,
			Head:         linkedPR.Head,
			Mergeable:    renderMergeable(mergeable),
			ClosesIssue:  closesIssue(linkedBody, input.IssueNumber),
			ChangedFiles: append([]string(nil), linkedDetails.Files...),
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

	fmt.Fprintln(w, "Task Status")
	fmt.Fprintln(w)
	fmt.Fprintln(w, "Issue:")
	fmt.Fprintf(w, "- Number: #%d\n", result.Issue.Number)
	fmt.Fprintf(w, "- Title: %s\n", result.Issue.Title)
	fmt.Fprintf(w, "- State: %s\n", strings.ToUpper(string(result.Issue.State)))
	fmt.Fprintf(w, "- Labels: %s\n", renderCSV(result.Issue.Labels, "none"))
	fmt.Fprintln(w)
	fmt.Fprintln(w, "Workflow:")
	fmt.Fprintf(w, "- Stage: %s\n", result.WorkflowStage)
	fmt.Fprintf(w, "- Expected branch: %s\n", result.Git.ExpectedBranch)
	fmt.Fprintln(w)
	fmt.Fprintln(w, "Git:")
	fmt.Fprintf(w, "- Default branch: %s\n", result.Git.DefaultBranch)
	fmt.Fprintf(w, "- Current branch: %s\n", result.Git.CurrentBranch)
	fmt.Fprintf(w, "- Worktree clean: %t\n", result.Git.WorkTreeClean)
	fmt.Fprintf(w, "- Local branch exists: %t\n", result.Git.LocalBranchExists)
	fmt.Fprintf(w, "- Remote branch exists: %t\n", result.Git.RemoteBranchExists)
	if result.Git.HasCommitsAhead != nil {
		fmt.Fprintf(w, "- Has commits ahead: %t\n", *result.Git.HasCommitsAhead)
	}
	fmt.Fprintln(w)
	fmt.Fprintln(w, "Pull Request:")
	if result.LinkedPullRequest == nil {
		fmt.Fprintln(w, "- None")
	} else {
		pr := result.LinkedPullRequest
		fmt.Fprintf(w, "- Number: #%d\n", pr.Number)
		fmt.Fprintf(w, "- Title: %s\n", pr.Title)
		fmt.Fprintf(w, "- State: %s\n", strings.ToUpper(string(pr.State)))
		fmt.Fprintf(w, "- Draft: %t\n", pr.Draft)
		fmt.Fprintf(w, "- Base: %s\n", pr.Base)
		fmt.Fprintf(w, "- Head: %s\n", pr.Head)
		fmt.Fprintf(w, "- Mergeable: %s\n", pr.Mergeable)
		fmt.Fprintf(w, "- Closes issue: %t\n", pr.ClosesIssue)
	}
	fmt.Fprintln(w)
	renderStatusChecks(w, result.Checks)
	fmt.Fprintln(w)
	fmt.Fprintln(w, "Gate:")
	renderStatusList(w, "- Blockers:", result.Gate.Blockers, "none")
	renderStatusList(w, "- Non-blocking notes:", result.Gate.NonBlockingNotes, "none")
	for _, warning := range result.Warnings {
		fmt.Fprintf(w, "- Warning: %s\n", warning.Message)
	}
	fmt.Fprintln(w)
	fmt.Fprintln(w, "Next:")
	fmt.Fprintln(w, result.SuggestedCommand)

	return nil
}

func buildChecksStatus(checks domain.PullRequestChecks, err error) ChecksStatusResult {
	if err != nil {
		return ChecksStatusResult{Message: "Could not read GitHub checks: " + err.Error()}
	}
	result := ChecksStatusResult{
		Available:  true,
		Total:      checks.Total,
		Successful: checks.Successful,
		Pending:    checks.Pending,
		Failed:     checks.Failed,
		Skipped:    checks.Skipped,
	}
	for _, check := range checks.Checks {
		result.Lines = append(result.Lines, fmt.Sprintf("%s: %s", check.Name, checkBucketText(check.Bucket)))
	}
	if checks.Total == 0 || len(checks.Checks) == 0 {
		result.Message = "No GitHub checks found"
	}
	return result
}

func buildStatusGate(issueNumber int, issue domain.Issue, expectedBranch string, currentBranch string, clean bool, pr *domain.PullRequest, body string, mergeable github.MergeableState, checks ChecksStatusResult) StatusGateResult {
	var blockers []string
	var notes []string
	if countAILifecycleLabels(issue.Labels) > 1 {
		blockers = append(blockers, "issue has multiple ai lifecycle labels")
	}
	if hasLabel(issue.Labels, "review:failed") || hasLabel(issue.Labels, "review:changes-requested") {
		blockers = append(blockers, "issue has blocking review label")
	}
	if !clean {
		blockers = append(blockers, "local worktree is dirty")
	}
	if currentBranch != expectedBranch {
		notes = append(notes, fmt.Sprintf("current branch %q does not match expected branch %q", currentBranch, expectedBranch))
	}
	if hasLabel(issue.Labels, "ai:needs-review") && pr == nil {
		blockers = append(blockers, "issue has ai:needs-review but no linked PR was found")
	}
	if pr != nil {
		if pr.Head != expectedBranch {
			blockers = append(blockers, fmt.Sprintf("pull request head %q does not match expected branch %q", pr.Head, expectedBranch))
		}
		if !closesIssue(body, issueNumber) {
			blockers = append(blockers, fmt.Sprintf("pull request #%d body does not contain Closes #%d", pr.Number, issueNumber))
		}
		if pr.Draft {
			blockers = append(blockers, fmt.Sprintf("pull request #%d is draft", pr.Number))
		}
		if pr.State != domain.PullRequestStateOpen && !pr.Merged {
			blockers = append(blockers, fmt.Sprintf("pull request #%d is not open", pr.Number))
		}
		if mergeable == github.MergeableStateConflicting {
			blockers = append(blockers, fmt.Sprintf("pull request #%d has merge conflicts", pr.Number))
		} else if mergeable != github.MergeableStateMergeable {
			notes = append(notes, fmt.Sprintf("pull request #%d mergeability is %q", pr.Number, mergeable))
		}
	}
	if checks.Message != "" {
		notes = append(notes, checks.Message)
	}
	if checks.Failed > 0 {
		blockers = append(blockers, "pull request has failed checks")
	}
	if checks.Pending > 0 {
		blockers = append(blockers, "pull request has pending checks")
	}
	return StatusGateResult{Blockers: blockers, NonBlockingNotes: notes}
}

func inferWorkflowStage(issue domain.Issue, pr *domain.PullRequest, localBranchExists bool, remoteBranchExists bool, hasAhead *bool, gate StatusGateResult) string {
	if hasLabel(issue.Labels, "review:failed") || hasLabel(issue.Labels, "review:changes-requested") {
		return "Blocked"
	}
	if countAILifecycleLabels(issue.Labels) > 1 {
		return "Unknown"
	}
	if issue.State == domain.IssueStateClosed && pr != nil && pr.Merged {
		return "Done"
	}
	if issue.State == domain.IssueStateOpen && hasLabel(issue.Labels, "ai:ready") && !localBranchExists && !remoteBranchExists && pr == nil {
		return "Ready for AI"
	}
	if issue.State == domain.IssueStateOpen && hasLabel(issue.Labels, "ai:in-progress") && (localBranchExists || remoteBranchExists) && pr == nil {
		if hasAhead != nil && *hasAhead {
			return "Needs PR"
		}
		return "In Progress"
	}
	if issue.State == domain.IssueStateOpen && hasLabel(issue.Labels, "ai:needs-review") && pr != nil && pr.State == domain.PullRequestStateOpen {
		if len(gate.Blockers) == 0 {
			return "Ready to Merge"
		}
		return "Needs Review"
	}
	if issue.State == domain.IssueStateClosed {
		return "Done"
	}
	if len(gate.Blockers) > 0 {
		return "Blocked"
	}
	return "Unknown"
}

func suggestedStatusCommand(stage string, issueNumber int) string {
	switch stage {
	case "Ready for AI":
		return fmt.Sprintf("parsevkctl task start %d", issueNumber)
	case "In Progress", "Needs PR":
		return fmt.Sprintf("parsevkctl task pr %d", issueNumber)
	case "Needs Review":
		return fmt.Sprintf("parsevkctl task review %d", issueNumber)
	case "Ready to Merge":
		return fmt.Sprintf("parsevkctl task merge %d", issueNumber)
	case "Done":
		return "No action needed."
	default:
		return "Inspect labels and PR linkage manually."
	}
}

func countAILifecycleLabels(labels []string) int {
	count := 0
	for _, label := range []string{"ai:ready", "ai:in-progress", "ai:needs-review"} {
		if hasLabel(labels, label) {
			count++
		}
	}
	return count
}

func closesIssue(body string, issueNumber int) bool {
	return strings.Contains(body, fmt.Sprintf("Closes #%d", issueNumber))
}

func renderCSV(values []string, empty string) string {
	if len(values) == 0 {
		return empty
	}
	return strings.Join(values, ", ")
}

func renderStatusChecks(w io.Writer, checks ChecksStatusResult) {
	fmt.Fprintln(w, "Checks:")
	if checks.Message != "" && len(checks.Lines) == 0 {
		fmt.Fprintf(w, "- %s\n", checks.Message)
		return
	}
	if len(checks.Lines) == 0 {
		fmt.Fprintln(w, "- No GitHub checks found")
		return
	}
	for _, line := range checks.Lines {
		fmt.Fprintf(w, "- %s\n", line)
	}
}

func renderStatusList(w io.Writer, title string, values []string, empty string) {
	if len(values) == 0 {
		fmt.Fprintf(w, "%s %s\n", title, empty)
		return
	}
	fmt.Fprintln(w, title)
	for _, value := range values {
		fmt.Fprintf(w, "  - %s\n", value)
	}
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
	var operationErr planner.OperationError
	if errors.As(err, &operationErr) && strings.TrimSpace(operationErr.RecoveryHint) != "" {
		fmt.Fprintln(w, "Recovery:", strings.TrimSpace(operationErr.RecoveryHint))
	}
}
