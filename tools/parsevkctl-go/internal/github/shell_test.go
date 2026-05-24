package github

import (
	"context"
	"errors"
	"reflect"
	"strings"
	"testing"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/config"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
)

func TestParseIssueJSON(t *testing.T) {
	t.Parallel()

	issue, err := parseIssueJSON([]byte(`{"number":108,"title":"Add adapter","state":"OPEN","url":"https://github.test/issues/108","labels":[{"name":"type: docs"},{"name":"go"}]}`))
	if err != nil {
		t.Fatalf("parseIssueJSON returned error: %v", err)
	}

	want := domain.Issue{
		ID:     domain.TaskID(108),
		Title:  "Add adapter",
		State:  domain.IssueStateOpen,
		URL:    "https://github.test/issues/108",
		Labels: []string{"type: docs", "go"},
	}
	if !reflect.DeepEqual(issue, want) {
		t.Fatalf("issue = %#v, want %#v", issue, want)
	}
}

func TestParsePullRequestsJSON(t *testing.T) {
	t.Parallel()

	prs, err := parsePullRequestsJSON([]byte(`[
		{"number":7,"title":"Open PR","state":"OPEN","isDraft":true,"mergedAt":null,"url":"https://github.test/pull/7","baseRefName":"main","headRefName":"feature"},
		{"number":8,"title":"Merged PR","state":"MERGED","isDraft":false,"mergedAt":"2026-05-22T00:00:00Z","url":"https://github.test/pull/8","baseRefName":"main","headRefName":"feature-2"}
	]`))
	if err != nil {
		t.Fatalf("parsePullRequestsJSON returned error: %v", err)
	}

	want := []domain.PullRequest{
		{
			Number: domain.TaskID(7),
			Title:  "Open PR",
			State:  domain.PullRequestStateDraft,
			Draft:  true,
			Merged: false,
			URL:    "https://github.test/pull/7",
			Base:   "main",
			Head:   "feature",
		},
		{
			Number: domain.TaskID(8),
			Title:  "Merged PR",
			State:  domain.PullRequestStateMerged,
			Draft:  false,
			Merged: true,
			URL:    "https://github.test/pull/8",
			Base:   "main",
			Head:   "feature-2",
		},
	}
	if !reflect.DeepEqual(prs, want) {
		t.Fatalf("prs = %#v, want %#v", prs, want)
	}
}

func TestParsePullRequestChecksJSONBucketsStates(t *testing.T) {
	t.Parallel()

	checks, err := parsePullRequestChecksJSON(17, []byte(`[
		{"name":"test","state":"SUCCESS","workflow":"parsevkctl"},
		{"name":"typecheck","state":"IN_PROGRESS","workflow":"frontend"},
		{"name":"lint","state":"FAILED","workflow":"backend"},
		{"name":"optional","state":"NEUTRAL","workflow":"docs"},
		{"name":"mystery","state":"STALE","workflow":"ci"}
	]`))
	if err != nil {
		t.Fatalf("parsePullRequestChecksJSON returned error: %v", err)
	}

	if checks.PullRequestNumber != 17 {
		t.Fatalf("pull request number = %d, want 17", checks.PullRequestNumber)
	}
	if checks.Total != 5 || checks.Successful != 2 || checks.Pending != 1 || checks.Failed != 1 || checks.Skipped != 1 {
		t.Fatalf("unexpected totals: %#v", checks)
	}
	want := []domain.PullRequestCheck{
		{Name: "parsevkctl / test", State: domain.CheckStateSuccess, Bucket: domain.CheckStateSuccess},
		{Name: "frontend / typecheck", State: domain.CheckStatePending, Bucket: domain.CheckStatePending},
		{Name: "backend / lint", State: domain.CheckStateFailure, Bucket: domain.CheckStateFailure},
		{Name: "docs / optional", State: domain.CheckStateSkipped, Bucket: domain.CheckStateSuccess},
		{Name: "ci / mystery", State: domain.CheckStateUnknown, Bucket: domain.CheckStateUnknown},
	}
	if !reflect.DeepEqual(checks.Checks, want) {
		t.Fatalf("checks = %#v, want %#v", checks.Checks, want)
	}
}

func TestParsePullRequestChecksTextBucketsStates(t *testing.T) {
	t.Parallel()

	checks, err := parsePullRequestChecksText(17, `parsevkctl / test	pass	1m	https://github.test/checks/1
frontend / typecheck	pending	0s	https://github.test/checks/2
backend / lint	fail	10s	https://github.test/checks/3
docs / optional	skipping	0s	https://github.test/checks/4`)
	if err != nil {
		t.Fatalf("parsePullRequestChecksText returned error: %v", err)
	}

	if checks.Total != 4 || checks.Successful != 2 || checks.Pending != 1 || checks.Failed != 1 || checks.Skipped != 1 {
		t.Fatalf("unexpected totals: %#v", checks)
	}
}

func TestParsePullRequestChecksTextPrefersTabSeparatedStateColumn(t *testing.T) {
	t.Parallel()

	checks, err := parsePullRequestChecksText(17, "pending migrations / test\tpass\t1m\thttps://github.test/checks/1\nfail-safe check\tpass\t1m\thttps://github.test/checks/2")
	if err != nil {
		t.Fatalf("parsePullRequestChecksText returned error: %v", err)
	}

	if checks.Total != 2 || checks.Successful != 2 || checks.Pending != 0 || checks.Failed != 0 {
		t.Fatalf("unexpected totals: %#v", checks)
	}
	want := []domain.PullRequestCheck{
		{Name: "pending migrations / test", State: domain.CheckStateSuccess, Bucket: domain.CheckStateSuccess},
		{Name: "fail-safe check", State: domain.CheckStateSuccess, Bucket: domain.CheckStateSuccess},
	}
	if !reflect.DeepEqual(checks.Checks, want) {
		t.Fatalf("checks = %#v, want %#v", checks.Checks, want)
	}
}

func TestCommandArguments(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		run  func(*ShellAdapter) error
		args []string
	}{
		{
			name: "get issue",
			run: func(adapter *ShellAdapter) error {
				_, err := adapter.GetIssue(context.Background(), 108)
				return err
			},
			args: []string{"issue", "view", "108", "--json", "number,title,state,url,labels"},
		},
		{
			name: "close issue with comment",
			run: func(adapter *ShellAdapter) error {
				return adapter.CloseIssue(context.Background(), 108, "Done")
			},
			args: []string{"issue", "close", "108", "--comment", "Done"},
		},
		{
			name: "list pull requests",
			run: func(adapter *ShellAdapter) error {
				_, err := adapter.ListPullRequests(context.Background(), PullRequestFilter{
					State:  "open",
					Head:   "feature",
					Base:   "main",
					Search: "issue 108",
				})
				return err
			},
			args: []string{"pr", "list", "--state", "open", "--head", "feature", "--base", "main", "--search", "issue 108", "--json", "number,title,state,isDraft,mergedAt,url,baseRefName,headRefName"},
		},
		{
			name: "get pull request checks",
			run: func(adapter *ShellAdapter) error {
				_, err := adapter.GetPullRequestChecks(context.Background(), 7)
				return err
			},
			args: []string{"pr", "checks", "7", "--json", "name,state,bucket,workflow,startedAt,completedAt,link"},
		},
		{
			name: "merge pull request",
			run: func(adapter *ShellAdapter) error {
				return adapter.MergePullRequest(context.Background(), 7, MergePullRequestInput{
					Method:       "squash",
					DeleteBranch: true,
					Auto:         true,
				})
			},
			args: []string{"pr", "merge", "7", "--squash", "--delete-branch", "--auto"},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			var got []string
			adapter := newShellAdapterWithRunner(func(_ context.Context, _ string, args ...string) (commandResult, error) {
				got = append([]string(nil), args...)
				return commandResult{stdout: commandOutputFor(args)}, nil
			})

			if err := tt.run(adapter); err != nil {
				t.Fatalf("run returned error: %v", err)
			}
			if !reflect.DeepEqual(got, tt.args) {
				t.Fatalf("args = %#v, want %#v", got, tt.args)
			}
		})
	}
}

func TestGetPullRequestChecksParsesJSONStdoutWhenGHReturnsNonZero(t *testing.T) {
	t.Parallel()

	adapter := newShellAdapterWithRunner(func(context.Context, string, ...string) (commandResult, error) {
		return commandResult{stdout: `[{"name":"typecheck","state":"COMPLETED","bucket":"fail","workflow":"frontend"}]`}, fakeExitError{code: 1}
	})

	checks, err := adapter.GetPullRequestChecks(context.Background(), 7)
	if err != nil {
		t.Fatalf("GetPullRequestChecks returned error: %v", err)
	}
	if checks.Failed != 1 {
		t.Fatalf("failed checks = %d, want 1; checks=%#v", checks.Failed, checks)
	}
}

func TestCreateIssueRunsCreateThenView(t *testing.T) {
	t.Parallel()

	var got [][]string
	adapter := newShellAdapterWithRunner(func(_ context.Context, _ string, args ...string) (commandResult, error) {
		got = append(got, append([]string(nil), args...))
		if len(args) >= 2 && args[0] == "issue" && args[1] == "create" {
			return commandResult{stdout: "https://github.com/andr-235/parseVK/issues/108"}, nil
		}

		return commandResult{stdout: `{"number":108,"title":"Issue","state":"OPEN"}`}, nil
	})

	issue, err := adapter.CreateIssue(context.Background(), CreateIssueInput{
		Title:  "Title",
		Body:   "Body",
		Labels: []string{"go", "cli"},
	})
	if err != nil {
		t.Fatalf("CreateIssue returned error: %v", err)
	}
	if issue.ID != domain.TaskID(108) {
		t.Fatalf("issue ID = %d, want 108", issue.ID)
	}

	want := [][]string{
		{"issue", "create", "--title", "Title", "--body", "Body", "--label", "go", "--label", "cli"},
		{"issue", "view", "108", "--json", "number,title,state,url,labels"},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("args = %#v, want %#v", got, want)
	}
}

func TestCreatePullRequestRunsCreateThenView(t *testing.T) {
	t.Parallel()

	var got [][]string
	adapter := newShellAdapterWithRunner(func(_ context.Context, _ string, args ...string) (commandResult, error) {
		got = append(got, append([]string(nil), args...))
		if len(args) >= 2 && args[0] == "pr" && args[1] == "create" {
			return commandResult{stdout: "https://github.com/andr-235/parseVK/pull/7"}, nil
		}

		return commandResult{stdout: `{"number":7,"title":"PR","state":"OPEN","isDraft":true,"mergedAt":null}`}, nil
	})

	pr, err := adapter.CreatePullRequest(context.Background(), CreatePullRequestInput{
		Title: "Title",
		Body:  "Body",
		Head:  "feature",
		Base:  "main",
		Draft: true,
	})
	if err != nil {
		t.Fatalf("CreatePullRequest returned error: %v", err)
	}
	if pr.Number != domain.TaskID(7) {
		t.Fatalf("PR number = %d, want 7", pr.Number)
	}

	want := [][]string{
		{"pr", "create", "--title", "Title", "--body", "Body", "--head", "feature", "--base", "main", "--draft"},
		{"pr", "view", "7", "--json", "number,title,state,isDraft,mergedAt,url,baseRefName,headRefName"},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("args = %#v, want %#v", got, want)
	}
}

func TestCommandErrorsIncludeOperationArgsExitCodeAndOutput(t *testing.T) {
	t.Parallel()

	adapter := newShellAdapterWithRunner(func(context.Context, string, ...string) (commandResult, error) {
		return commandResult{stdout: "stdout text", stderr: "stderr text"}, fakeExitError{code: 2}
	})

	_, err := adapter.GetIssue(context.Background(), 108)
	if err == nil {
		t.Fatalf("expected command error")
	}

	message := err.Error()
	for _, want := range []string{"get issue", "issue view 108", "exit code 2", "stdout text", "stderr text"} {
		if !strings.Contains(message, want) {
			t.Fatalf("error = %q, want it to contain %q", message, want)
		}
	}
}

func TestProjectMethodsReturnNotImplemented(t *testing.T) {
	t.Parallel()

	adapter := newShellAdapterWithRunner(func(context.Context, string, ...string) (commandResult, error) {
		t.Fatal("runner must not be called by project stubs")
		return commandResult{}, nil
	})

	if _, err := adapter.GetProjectItem(context.Background(), 108); !errors.Is(err, ErrProjectNotImplemented) {
		t.Fatalf("GetProjectItem error = %v, want ErrProjectNotImplemented", err)
	}
	if err := adapter.SetProjectStatus(context.Background(), 108, domain.ProjectStatusReview); !errors.Is(err, ErrProjectNotImplemented) {
		t.Fatalf("SetProjectStatus error = %v, want ErrProjectNotImplemented", err)
	}
	if err := adapter.CheckProjectStatusField(context.Background()); !errors.Is(err, ErrProjectNotImplemented) {
		t.Fatalf("CheckProjectStatusField error = %v, want ErrProjectNotImplemented", err)
	}
}

func TestCheckProjectStatusFieldUsesConfiguredProject(t *testing.T) {
	t.Parallel()

	var got [][]string
	adapter := newShellAdapterWithRunner(func(_ context.Context, _ string, args ...string) (commandResult, error) {
		got = append(got, append([]string(nil), args...))
		if len(args) >= 2 && args[0] == "api" && args[1] == "user" {
			return commandResult{stdout: "andr-235"}, nil
		}
		return commandResult{stdout: projectFieldsOutput()}, nil
	})
	adapter.config = config.Config{
		Repo:          "andr-235/parseVK",
		ProjectOwner:  "andr-235",
		ProjectNumber: 2,
		ProjectID:     "project-id",
		ProjectTitle:  "parsevk development",
	}

	if err := adapter.CheckProjectStatusField(context.Background()); err != nil {
		t.Fatalf("CheckProjectStatusField returned error: %v", err)
	}

	want := [][]string{
		{"api", "user", "--jq", ".login"},
		{"project", "field-list", "2", "--owner", "@me", "--limit", "100", "--format", "json"},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("args = %#v, want %#v", got, want)
	}
}

func TestCheckProjectStatusFieldKeepsOrganizationOwner(t *testing.T) {
	t.Parallel()

	var got [][]string
	adapter := newShellAdapterWithRunner(func(_ context.Context, _ string, args ...string) (commandResult, error) {
		got = append(got, append([]string(nil), args...))
		if len(args) >= 2 && args[0] == "api" && args[1] == "user" {
			return commandResult{stdout: "andr-235"}, nil
		}
		return commandResult{stdout: projectFieldsOutput()}, nil
	})
	adapter.config = config.Config{
		Repo:          "parsevk-org/parseVK",
		ProjectOwner:  "parsevk-org",
		ProjectNumber: 2,
		ProjectID:     "project-id",
		ProjectTitle:  "parsevk development",
	}

	if err := adapter.CheckProjectStatusField(context.Background()); err != nil {
		t.Fatalf("CheckProjectStatusField returned error: %v", err)
	}

	want := [][]string{
		{"api", "user", "--jq", ".login"},
		{"project", "field-list", "2", "--owner", "parsevk-org", "--limit", "100", "--format", "json"},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("args = %#v, want %#v", got, want)
	}
}

type fakeExitError struct {
	code int
}

func (err fakeExitError) Error() string {
	return "exit status"
}

func (err fakeExitError) ExitCode() int {
	return err.code
}

func commandOutputFor(args []string) string {
	if len(args) >= 3 && args[0] == "pr" && args[1] == "checks" {
		return `[{"name":"test","state":"SUCCESS","workflow":"parsevkctl"}]`
	}
	if len(args) >= 2 && args[0] == "pr" && (args[1] == "list" || args[1] == "create") {
		if args[1] == "list" {
			return `[{"number":7,"title":"PR","state":"OPEN","isDraft":false,"mergedAt":null}]`
		}
		return `{"number":7,"title":"PR","state":"OPEN","isDraft":false,"mergedAt":null}`
	}

	return `{"number":108,"title":"Issue","state":"OPEN"}`
}

func projectFieldsOutput() string {
	return `{"fields":[{"id":"field-id","name":"Status","options":[{"id":"todo","name":"Todo"},{"id":"in-progress","name":"In Progress"},{"id":"review","name":"Review"},{"id":"done","name":"Done"}]}]}`
}
