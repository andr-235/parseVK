package commands

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"reflect"
	"strings"
	"testing"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/config"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/github"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/planner"
)

func TestTaskStatusHumanNoPR(t *testing.T) {
	deps := okDeps()
	deps.GitHub.prs = nil
	deps.GitHub.projectErr = github.ErrProjectNotImplemented

	var out bytes.Buffer
	exit := RunTaskStatus(context.Background(), TaskStatusInput{
		IssueNumber: 112,
		Config:      deps.Config,
		Git:         deps.Git,
		GitHub:      deps.GitHub,
		JSON:        false,
		Stdout:      &out,
	})

	if exit != 0 {
		t.Fatalf("exit = %d, want 0", exit)
	}
	text := out.String()
	for _, want := range []string{
		"Task status #112",
		"Issue: Open",
		"Project: unavailable",
		"Pull request: none",
		"Current branch: feat/issue-112-read-only-commands",
		"Expected branch: feat/issue-112-add-read-only-task-commands",
		"Working tree: clean",
		"Lifecycle state: InProgress",
		"Suggested next command: parsevkctl task pr <issue>",
	} {
		if !strings.Contains(text, want) {
			t.Fatalf("output missing %q:\n%s", want, text)
		}
	}
	deps.assertNoWrites(t)
}

func TestTaskStatusJSONOpenPR(t *testing.T) {
	deps := okDeps()
	deps.GitHub.project = domain.ProjectItem{ID: "item-1", Status: domain.ProjectStatusReview}
	deps.GitHub.prs = []domain.PullRequest{{
		Number: 7,
		Title:  "PR",
		State:  domain.PullRequestStateOpen,
		URL:    "https://github.test/pr/7",
		Base:   "fastapi-microservices-rewrite",
		Head:   "feat/issue-112-add-read-only-task-commands",
	}}

	var out bytes.Buffer
	exit := RunTaskStatus(context.Background(), TaskStatusInput{
		IssueNumber: 112,
		Config:      deps.Config,
		Git:         deps.Git,
		GitHub:      deps.GitHub,
		JSON:        true,
		Stdout:      &out,
	})

	if exit != 0 {
		t.Fatalf("exit = %d, want 0", exit)
	}

	var got StatusResult
	if err := json.Unmarshal(out.Bytes(), &got); err != nil {
		t.Fatalf("invalid JSON: %v\n%s", err, out.String())
	}
	if got.Issue.Number != 112 || got.LinkedPullRequest == nil || got.LinkedPullRequest.Number != 7 {
		t.Fatalf("status result = %#v", got)
	}
	if got.Project.Status != domain.ProjectStatusReview {
		t.Fatalf("project status = %q, want Review", got.Project.Status)
	}
	if len(got.Warnings) != 0 {
		t.Fatalf("warnings = %#v, want none", got.Warnings)
	}
	deps.assertNoWrites(t)
}

func TestDoctorAllOK(t *testing.T) {
	deps := okDeps()
	deps.ConfigValidation = config.ValidationResult{Path: "config.json", Valid: true}

	result := RunDoctor(context.Background(), DoctorInput{
		ConfigValidation: deps.ConfigValidation,
		Config:           deps.Config,
		Git:              deps.Git,
		GitHub:           deps.GitHub,
	})

	if result.ExitCode != 0 {
		t.Fatalf("exit = %d, want 0; checks=%#v", result.ExitCode, result.Checks)
	}
	assertCheck(t, result.Checks, "config", CheckOK)
	assertCheck(t, result.Checks, "project-status", CheckOK)
	deps.assertNoWrites(t)
}

func TestDoctorWarnsWhenProjectUnavailable(t *testing.T) {
	deps := okDeps()
	deps.GitHub.projectErr = github.ErrProjectNotImplemented

	result := RunDoctor(context.Background(), DoctorInput{
		ConfigValidation: config.ValidationResult{Path: "config.json", Valid: true},
		Config:           deps.Config,
		Git:              deps.Git,
		GitHub:           deps.GitHub,
	})

	if result.ExitCode != 0 {
		t.Fatalf("exit = %d, want 0", result.ExitCode)
	}
	assertCheck(t, result.Checks, "project-status", CheckWarn)
	deps.assertNoWrites(t)
}

func TestDoctorFailsWhenConfigInvalid(t *testing.T) {
	deps := okDeps()

	result := RunDoctor(context.Background(), DoctorInput{
		ConfigValidation: config.ValidationResult{Path: "bad.json", Valid: false, Errors: []string{"missing field repo"}},
		Config:           deps.Config,
		Git:              deps.Git,
		GitHub:           deps.GitHub,
	})

	if result.ExitCode == 0 {
		t.Fatalf("exit = 0, want failure")
	}
	assertCheck(t, result.Checks, "config", CheckFail)
	deps.assertNoWrites(t)
}

func TestSyncPreviewOpenPRNotInReview(t *testing.T) {
	deps := okDeps()
	deps.GitHub.project = domain.ProjectItem{Status: domain.ProjectStatusInProgress}
	deps.GitHub.prs = []domain.PullRequest{{Number: 7, State: domain.PullRequestStateOpen}}

	result, err := BuildSyncPreview(context.Background(), SyncInput{
		IssueNumber: 112,
		Config:      deps.Config,
		Git:         deps.Git,
		GitHub:      deps.GitHub,
	})
	if err != nil {
		t.Fatalf("BuildSyncPreview returned error: %v", err)
	}
	if len(result.Drift) != 1 || result.Drift[0].SuggestedFix != "Project.SetStatus Review" {
		t.Fatalf("drift = %#v", result.Drift)
	}
	deps.assertNoWrites(t)
}

func TestSyncPreviewMergedPRNotDone(t *testing.T) {
	deps := okDeps()
	deps.GitHub.project = domain.ProjectItem{Status: domain.ProjectStatusReview}
	deps.GitHub.prs = []domain.PullRequest{{Number: 7, State: domain.PullRequestStateMerged, Merged: true}}

	result, err := BuildSyncPreview(context.Background(), SyncInput{
		IssueNumber: 112,
		Config:      deps.Config,
		Git:         deps.Git,
		GitHub:      deps.GitHub,
	})
	if err != nil {
		t.Fatalf("BuildSyncPreview returned error: %v", err)
	}
	if !hasSuggestedFix(result.Drift, "Project.SetStatus Done") {
		t.Fatalf("drift = %#v", result.Drift)
	}
	deps.assertNoWrites(t)
}

func TestSyncRejectsApply(t *testing.T) {
	var stderr bytes.Buffer
	exit := RunTaskSync(context.Background(), SyncRunInput{
		Apply:  true,
		Stderr: &stderr,
	})

	if exit != 2 {
		t.Fatalf("exit = %d, want 2", exit)
	}
	if !strings.Contains(stderr.String(), "task sync --apply is not implemented in Go yet; this command is preview-only") {
		t.Fatalf("stderr = %q", stderr.String())
	}
}

func TestTaskCreateDryRun(t *testing.T) {
	deps := okDeps()

	result, err := BuildTaskCreatePlan(context.Background(), TaskCreateInput{
		Title:  "Go rewrite: add write task commands",
		Body:   "Implement issue #113.",
		Config: deps.Config,
		GitHub: deps.GitHub,
	})
	if err != nil {
		t.Fatalf("BuildTaskCreatePlan returned error: %v", err)
	}

	if result.Plan.Command != "task create" {
		t.Fatalf("command = %q, want task create", result.Plan.Command)
	}
	got := planOperationTypes(result.Plan.Operations)
	want := []string{"Issue.Create", "Project.AddItem", "Project.SetStatus"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("operations = %#v, want %#v", got, want)
	}
	deps.assertNoWrites(t)
}

func TestTaskStartDryRunPlan(t *testing.T) {
	deps := okDeps()

	result, err := BuildTaskStartPlan(context.Background(), TaskIssueInput{
		IssueNumber: 112,
		Config:      deps.Config,
		Git:         deps.Git,
		GitHub:      deps.GitHub,
	})
	if err != nil {
		t.Fatalf("BuildTaskStartPlan returned error: %v", err)
	}

	got := planOperationTypes(result.Plan.Operations)
	want := []string{"Project.SetStatus", "Git.Fetch", "Git.Switch", "Git.PullFastForward", "Git.CreateBranch"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("operations = %#v, want %#v", got, want)
	}
	deps.assertNoWrites(t)
}

func TestTaskStartSuccessPath(t *testing.T) {
	deps := okDeps()
	deps.Git.allowWrites = true
	deps.GitHub.allowWrites = true

	var out bytes.Buffer
	exit := RunTaskStart(context.Background(), TaskRunInput{
		TaskIssueInput: TaskIssueInput{
			IssueNumber: 112,
			Config:      deps.Config,
			Git:         deps.Git,
			GitHub:      deps.GitHub,
		},
		Stdout: &out,
	})
	if exit != 0 {
		t.Fatalf("exit = %d, want 0", exit)
	}

	wantGit := []string{"Fetch", "Switch", "PullFFOnly", "CreateBranch"}
	if !reflect.DeepEqual(deps.Git.writeCalls, wantGit) {
		t.Fatalf("git writes = %#v, want %#v", deps.Git.writeCalls, wantGit)
	}
	wantGitHub := []string{"SetProjectStatus"}
	if !reflect.DeepEqual(deps.GitHub.writeCalls, wantGitHub) {
		t.Fatalf("github writes = %#v, want %#v", deps.GitHub.writeCalls, wantGitHub)
	}
	if !strings.Contains(out.String(), "Branch: feat/issue-112-add-read-only-task-commands") {
		t.Fatalf("stdout = %q", out.String())
	}
}

func TestTaskStartRejectsClosedIssue(t *testing.T) {
	deps := okDeps()
	deps.GitHub.issue.State = domain.IssueStateClosed

	_, err := BuildTaskStartPlan(context.Background(), TaskIssueInput{
		IssueNumber: 112,
		Config:      deps.Config,
		Git:         deps.Git,
		GitHub:      deps.GitHub,
	})
	if err == nil || !strings.Contains(err.Error(), "issue #112 is closed") {
		t.Fatalf("err = %v, want closed issue error", err)
	}
	deps.assertNoWrites(t)
}

func TestTaskPRRejectsDirtyWorkingTree(t *testing.T) {
	deps := okDeps()
	deps.Git.currentBranch = "feat/issue-112-add-read-only-task-commands"
	deps.Git.clean = false
	deps.Git.files = []string{" M internal/file.go"}

	_, err := BuildTaskPRPlan(context.Background(), TaskIssueInput{
		IssueNumber: 112,
		Config:      deps.Config,
		Git:         deps.Git,
		GitHub:      deps.GitHub,
	})
	if err == nil || !strings.Contains(err.Error(), "working tree is dirty") {
		t.Fatalf("err = %v, want dirty tree error", err)
	}
	deps.assertNoWrites(t)
}

func TestTaskPRRejectsWrongBranchIssueNumber(t *testing.T) {
	deps := okDeps()
	deps.Git.currentBranch = "feat/issue-999-other-task"

	_, err := BuildTaskPRPlan(context.Background(), TaskIssueInput{
		IssueNumber: 112,
		Config:      deps.Config,
		Git:         deps.Git,
		GitHub:      deps.GitHub,
	})
	if err == nil || !strings.Contains(err.Error(), "branch issue number 999 does not match requested issue #112") {
		t.Fatalf("err = %v, want wrong branch issue error", err)
	}
	deps.assertNoWrites(t)
}

func TestTaskPRDryRunPlan(t *testing.T) {
	deps := okDeps()
	deps.Git.currentBranch = "feat/issue-112-add-read-only-task-commands"
	deps.Git.ahead = true

	result, err := BuildTaskPRPlan(context.Background(), TaskIssueInput{
		IssueNumber: 112,
		Config:      deps.Config,
		Git:         deps.Git,
		GitHub:      deps.GitHub,
	})
	if err != nil {
		t.Fatalf("BuildTaskPRPlan returned error: %v", err)
	}

	got := planOperationTypes(result.Plan.Operations)
	want := []string{"Git.PushBranch", "PullRequest.Create", "Project.SetStatus"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("operations = %#v, want %#v", got, want)
	}
	if !strings.Contains(result.PullRequestBody, "Closes #112") {
		t.Fatalf("PR body = %q", result.PullRequestBody)
	}
	deps.assertNoWrites(t)
}

func TestTaskMergeRejectsDraftPR(t *testing.T) {
	deps := okDeps()
	deps.GitHub.prs = []domain.PullRequest{{
		Number: 9,
		State:  domain.PullRequestStateOpen,
		Draft:  true,
		Base:   "fastapi-microservices-rewrite",
		Head:   "feat/issue-112-add-read-only-task-commands",
	}}

	_, err := BuildTaskMergePlan(context.Background(), TaskIssueInput{
		IssueNumber: 112,
		Config:      deps.Config,
		Git:         deps.Git,
		GitHub:      deps.GitHub,
	})
	if err == nil || !strings.Contains(err.Error(), "pull request #9 is draft") {
		t.Fatalf("err = %v, want draft PR error", err)
	}
	deps.assertNoWrites(t)
}

func TestTaskMergeRejectsWrongBaseBranch(t *testing.T) {
	deps := okDeps()
	deps.GitHub.prs = []domain.PullRequest{{
		Number: 9,
		State:  domain.PullRequestStateOpen,
		Base:   "main",
		Head:   "feat/issue-112-add-read-only-task-commands",
	}}

	_, err := BuildTaskMergePlan(context.Background(), TaskIssueInput{
		IssueNumber: 112,
		Config:      deps.Config,
		Git:         deps.Git,
		GitHub:      deps.GitHub,
	})
	if err == nil || !strings.Contains(err.Error(), "base branch \"main\" does not match \"fastapi-microservices-rewrite\"") {
		t.Fatalf("err = %v, want wrong base error", err)
	}
	deps.assertNoWrites(t)
}

func TestTaskMergeDryRunPlan(t *testing.T) {
	deps := okDeps()
	deps.GitHub.prs = []domain.PullRequest{{
		Number: 9,
		State:  domain.PullRequestStateOpen,
		Base:   "fastapi-microservices-rewrite",
		Head:   "feat/issue-112-add-read-only-task-commands",
	}}

	result, err := BuildTaskMergePlan(context.Background(), TaskIssueInput{
		IssueNumber: 112,
		Config:      deps.Config,
		Git:         deps.Git,
		GitHub:      deps.GitHub,
	})
	if err != nil {
		t.Fatalf("BuildTaskMergePlan returned error: %v", err)
	}

	got := planOperationTypes(result.Plan.Operations)
	want := []string{"PullRequest.Merge", "Project.SetStatus", "Issue.Close", "Git.Switch", "Git.PullFastForward"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("operations = %#v, want %#v", got, want)
	}
	deps.assertNoWrites(t)
}

func assertCheck(t *testing.T, checks []DoctorCheck, name string, status CheckStatus) {
	t.Helper()
	for _, check := range checks {
		if check.Name == name {
			if check.Status != status {
				t.Fatalf("check %q status = %q, want %q", name, check.Status, status)
			}
			return
		}
	}
	t.Fatalf("check %q not found in %#v", name, checks)
}

func hasSuggestedFix(drift []DriftItem, fix string) bool {
	for _, item := range drift {
		if item.SuggestedFix == fix {
			return true
		}
	}
	return false
}

type commandDeps struct {
	ConfigValidation config.ValidationResult
	Config           config.Config
	Git              *fakeGit
	GitHub           *fakeGitHub
}

func okDeps() commandDeps {
	return commandDeps{
		Config: config.Config{
			Repo:          "andr-235/parseVK",
			DefaultBranch: "fastapi-microservices-rewrite",
			ProjectOwner:  "andr-235",
			ProjectNumber: 1,
			ProjectID:     "project-id",
			ProjectTitle:  "ParseVK",
			Statuses: config.Statuses{
				Todo:       "Todo",
				InProgress: "In Progress",
				Review:     "Review",
				Done:       "Done",
			},
		},
		Git: &fakeGit{
			currentBranch: "feat/issue-112-read-only-commands",
			clean:         true,
		},
		GitHub: &fakeGitHub{
			issue: domain.Issue{
				ID:    112,
				Title: "Add read-only task commands",
				State: domain.IssueStateOpen,
				URL:   "https://github.test/issues/112",
			},
			project: domain.ProjectItem{ID: "item-1", Status: domain.ProjectStatusInProgress},
		},
	}
}

func (d commandDeps) assertNoWrites(t *testing.T) {
	t.Helper()
	if len(d.Git.writeCalls) != 0 {
		t.Fatalf("git write calls = %#v", d.Git.writeCalls)
	}
	if len(d.GitHub.writeCalls) != 0 {
		t.Fatalf("github write calls = %#v", d.GitHub.writeCalls)
	}
}

type fakeGit struct {
	currentBranch string
	clean         bool
	ahead         bool
	files         []string
	err           error
	allowWrites   bool
	writeCalls    []string
}

func (f *fakeGit) CurrentBranch(context.Context) (string, error) {
	return f.currentBranch, f.err
}

func (f *fakeGit) IsWorkTreeClean(context.Context) (bool, []string, error) {
	return f.clean, f.files, f.err
}

func (f *fakeGit) Fetch(context.Context, string, string) error {
	f.writeCalls = append(f.writeCalls, "Fetch")
	if f.allowWrites {
		return nil
	}
	return errors.New("write call")
}
func (f *fakeGit) Switch(context.Context, string) error {
	f.writeCalls = append(f.writeCalls, "Switch")
	if f.allowWrites {
		return nil
	}
	return errors.New("write call")
}
func (f *fakeGit) PullFFOnly(context.Context, string, string) error {
	f.writeCalls = append(f.writeCalls, "PullFFOnly")
	if f.allowWrites {
		return nil
	}
	return errors.New("write call")
}
func (f *fakeGit) CreateBranch(context.Context, string) error {
	f.writeCalls = append(f.writeCalls, "CreateBranch")
	if f.allowWrites {
		return nil
	}
	return errors.New("write call")
}
func (f *fakeGit) DeleteLocalBranch(context.Context, string, bool) error {
	f.writeCalls = append(f.writeCalls, "DeleteLocalBranch")
	if f.allowWrites {
		return nil
	}
	return errors.New("write call")
}
func (f *fakeGit) DeleteRemoteBranch(context.Context, string, string) error {
	f.writeCalls = append(f.writeCalls, "DeleteRemoteBranch")
	if f.allowWrites {
		return nil
	}
	return errors.New("write call")
}
func (f *fakeGit) PushBranch(context.Context, string, string, bool) error {
	f.writeCalls = append(f.writeCalls, "PushBranch")
	if f.allowWrites {
		return nil
	}
	return errors.New("write call")
}
func (f *fakeGit) HasCommitsAhead(context.Context, string, string) (bool, error) {
	return f.ahead, f.err
}

type fakeGitHub struct {
	issue       domain.Issue
	prs         []domain.PullRequest
	project     domain.ProjectItem
	projectErr  error
	allowWrites bool
	writeCalls  []string
}

func (f *fakeGitHub) GetIssue(context.Context, int) (domain.Issue, error) {
	return f.issue, nil
}
func (f *fakeGitHub) CreateIssue(context.Context, github.CreateIssueInput) (domain.Issue, error) {
	f.writeCalls = append(f.writeCalls, "CreateIssue")
	if f.allowWrites {
		return f.issue, nil
	}
	return domain.Issue{}, errors.New("write call")
}
func (f *fakeGitHub) CloseIssue(context.Context, int, string) error {
	f.writeCalls = append(f.writeCalls, "CloseIssue")
	if f.allowWrites {
		return nil
	}
	return errors.New("write call")
}
func (f *fakeGitHub) ListPullRequests(context.Context, github.PullRequestFilter) ([]domain.PullRequest, error) {
	return f.prs, nil
}
func (f *fakeGitHub) CreatePullRequest(context.Context, github.CreatePullRequestInput) (domain.PullRequest, error) {
	f.writeCalls = append(f.writeCalls, "CreatePullRequest")
	if f.allowWrites {
		return domain.PullRequest{Number: 9, State: domain.PullRequestStateOpen}, nil
	}
	return domain.PullRequest{}, errors.New("write call")
}
func (f *fakeGitHub) MergePullRequest(context.Context, int, github.MergePullRequestInput) error {
	f.writeCalls = append(f.writeCalls, "MergePullRequest")
	if f.allowWrites {
		return nil
	}
	return errors.New("write call")
}
func (f *fakeGitHub) GetProjectItem(context.Context, int) (domain.ProjectItem, error) {
	if f.projectErr != nil {
		return domain.ProjectItem{}, f.projectErr
	}
	return f.project, nil
}
func (f *fakeGitHub) AddProjectItem(context.Context, int) error {
	f.writeCalls = append(f.writeCalls, "AddProjectItem")
	if f.allowWrites {
		return nil
	}
	return errors.New("write call")
}
func (f *fakeGitHub) SetProjectStatus(context.Context, int, domain.ProjectStatus) error {
	f.writeCalls = append(f.writeCalls, "SetProjectStatus")
	if f.allowWrites {
		return nil
	}
	return errors.New("write call")
}

func planOperationTypes(operations []planner.Operation) []string {
	types := make([]string, len(operations))
	for i, operation := range operations {
		types[i] = string(operation.Type)
	}
	return types
}
