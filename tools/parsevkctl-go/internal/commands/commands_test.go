package commands

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/config"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/github"
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
	files         []string
	err           error
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
	return errors.New("write call")
}
func (f *fakeGit) Switch(context.Context, string) error {
	f.writeCalls = append(f.writeCalls, "Switch")
	return errors.New("write call")
}
func (f *fakeGit) PullFFOnly(context.Context, string, string) error {
	f.writeCalls = append(f.writeCalls, "PullFFOnly")
	return errors.New("write call")
}
func (f *fakeGit) CreateBranch(context.Context, string) error {
	f.writeCalls = append(f.writeCalls, "CreateBranch")
	return errors.New("write call")
}
func (f *fakeGit) DeleteLocalBranch(context.Context, string, bool) error {
	f.writeCalls = append(f.writeCalls, "DeleteLocalBranch")
	return errors.New("write call")
}
func (f *fakeGit) DeleteRemoteBranch(context.Context, string, string) error {
	f.writeCalls = append(f.writeCalls, "DeleteRemoteBranch")
	return errors.New("write call")
}
func (f *fakeGit) PushBranch(context.Context, string, string, bool) error {
	f.writeCalls = append(f.writeCalls, "PushBranch")
	return errors.New("write call")
}
func (f *fakeGit) HasCommitsAhead(context.Context, string, string) (bool, error) {
	return false, f.err
}

type fakeGitHub struct {
	issue      domain.Issue
	prs        []domain.PullRequest
	project    domain.ProjectItem
	projectErr error
	writeCalls []string
}

func (f *fakeGitHub) GetIssue(context.Context, int) (domain.Issue, error) {
	return f.issue, nil
}
func (f *fakeGitHub) CreateIssue(context.Context, github.CreateIssueInput) (domain.Issue, error) {
	f.writeCalls = append(f.writeCalls, "CreateIssue")
	return domain.Issue{}, errors.New("write call")
}
func (f *fakeGitHub) CloseIssue(context.Context, int, string) error {
	f.writeCalls = append(f.writeCalls, "CloseIssue")
	return errors.New("write call")
}
func (f *fakeGitHub) ListPullRequests(context.Context, github.PullRequestFilter) ([]domain.PullRequest, error) {
	return f.prs, nil
}
func (f *fakeGitHub) CreatePullRequest(context.Context, github.CreatePullRequestInput) (domain.PullRequest, error) {
	f.writeCalls = append(f.writeCalls, "CreatePullRequest")
	return domain.PullRequest{}, errors.New("write call")
}
func (f *fakeGitHub) MergePullRequest(context.Context, int, github.MergePullRequestInput) error {
	f.writeCalls = append(f.writeCalls, "MergePullRequest")
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
	return errors.New("write call")
}
func (f *fakeGitHub) SetProjectStatus(context.Context, int, domain.ProjectStatus) error {
	f.writeCalls = append(f.writeCalls, "SetProjectStatus")
	return errors.New("write call")
}
