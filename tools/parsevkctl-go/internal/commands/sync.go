package commands

import (
	"context"
	"encoding/json"
	"fmt"
	"io"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/config"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/git"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/github"
)

type SyncInput struct {
	IssueNumber int
	Config      config.Config
	Git         git.Adapter
	GitHub      github.Adapter
}

type SyncRunInput struct {
	SyncInput
	Apply  bool
	JSON   bool
	Stdout io.Writer
	Stderr io.Writer
}

type SyncPreviewResult struct {
	Status         StatusResult `json:"status"`
	Drift          []DriftItem  `json:"drift"`
	SuggestedFixes []string     `json:"suggestedFixes"`
	PreviewOnly    bool         `json:"previewOnly"`
}

type DriftItem struct {
	Description  string `json:"description"`
	SuggestedFix string `json:"suggestedFix"`
}

func RunTaskSync(ctx context.Context, input SyncRunInput) int {
	if input.Apply {
		fmt.Fprintln(input.Stderr, "task sync --apply is not implemented in Go yet; this command is preview-only")
		return 2
	}

	result, err := BuildSyncPreview(ctx, input.SyncInput)
	if err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	if err := renderSync(input.Stdout, result, input.JSON); err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	return 0
}

func BuildSyncPreview(ctx context.Context, input SyncInput) (SyncPreviewResult, error) {
	status, err := BuildStatus(ctx, TaskStatusInput{
		IssueNumber: input.IssueNumber,
		Config:      input.Config,
		Git:         input.Git,
		GitHub:      input.GitHub,
	})
	if err != nil {
		return SyncPreviewResult{}, err
	}

	drift := deriveDrift(status)
	fixes := make([]string, 0, len(drift))
	for _, item := range drift {
		fixes = append(fixes, item.SuggestedFix)
	}

	return SyncPreviewResult{
		Status:         status,
		Drift:          drift,
		SuggestedFixes: fixes,
		PreviewOnly:    true,
	}, nil
}

func deriveDrift(status StatusResult) []DriftItem {
	var drift []DriftItem
	pr := status.LinkedPullRequest
	project := status.Project.Status

	if pr != nil && (pr.State == domain.PullRequestStateOpen || pr.State == domain.PullRequestStateDraft) && project != domain.ProjectStatusReview {
		drift = append(drift, DriftItem{
			Description:  "pull request is open but project status is not Review",
			SuggestedFix: "Project.SetStatus Review",
		})
	}
	if pr != nil && pr.State == domain.PullRequestStateMerged && project != domain.ProjectStatusDone {
		drift = append(drift, DriftItem{
			Description:  "pull request is merged but project status is not Done",
			SuggestedFix: "Project.SetStatus Done",
		})
	}
	if pr != nil && pr.State == domain.PullRequestStateMerged && status.Issue.State == domain.IssueStateOpen {
		drift = append(drift, DriftItem{
			Description:  "pull request is merged but issue is still open",
			SuggestedFix: "Issue.Close",
		})
	}
	if status.Issue.State == domain.IssueStateClosed && project != domain.ProjectStatusDone {
		drift = append(drift, DriftItem{
			Description:  "issue is closed but project status is not Done",
			SuggestedFix: "Project.SetStatus Done",
		})
	}
	if status.Issue.State == domain.IssueStateOpen && pr == nil && status.Git.CurrentBranch == status.Git.ExpectedBranch && project != domain.ProjectStatusInProgress {
		drift = append(drift, DriftItem{
			Description:  "issue is open with a local task branch but project status is not In Progress",
			SuggestedFix: "Project.SetStatus In Progress",
		})
	}

	return drift
}

func renderSync(w io.Writer, result SyncPreviewResult, jsonOutput bool) error {
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

	fmt.Fprintf(w, "Task sync preview #%d\n", result.Status.Issue.Number)
	fmt.Fprintf(w, "Lifecycle state: %s\n", result.Status.LifecycleState)
	if len(result.Drift) == 0 {
		fmt.Fprintln(w, "Drift: none")
	} else {
		fmt.Fprintln(w, "Drift:")
		for _, item := range result.Drift {
			fmt.Fprintf(w, "- %s; suggested fix: %s\n", item.Description, item.SuggestedFix)
		}
	}
	fmt.Fprintln(w, "Preview only: no changes applied")
	return nil
}
