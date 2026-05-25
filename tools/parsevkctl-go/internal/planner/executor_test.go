package planner

import (
	"context"
	"errors"
	"reflect"
	"strconv"
	"testing"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/git"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/github"
)

func TestExecutorStopsOnFirstFailedOperation(t *testing.T) {
	fakeGit := &fakeGitAdapter{failOn: "PullFFOnly", failErr: errors.New("pull failed")}
	fakeGitHub := &fakeGitHubAdapter{}
	executor := Executor{Git: fakeGit, GitHub: fakeGitHub}

	plan, err := NewStartTaskPlan(StartTaskInput{
		Issue:         domain.Issue{ID: 111},
		DefaultBranch: "fastapi-microservices-rewrite",
		BranchName:    "feat/issue-111-planner",
		TargetStatus:  domain.ProjectStatusInProgress,
	})
	if err != nil {
		t.Fatalf("NewStartTaskPlan returned error: %v", err)
	}

	err = executor.Execute(context.Background(), plan)
	if err == nil {
		t.Fatal("Execute returned nil error")
	}

	var operationErr OperationError
	if !errors.As(err, &operationErr) {
		t.Fatalf("Execute error type = %T, want OperationError", err)
	}
	if operationErr.OperationID != "git-pull-fast-forward-default-branch" {
		t.Fatalf("OperationID = %q, want git-pull-fast-forward-default-branch", operationErr.OperationID)
	}
	if operationErr.OperationType != OperationGitPullFastForward {
		t.Fatalf("OperationType = %q, want %q", operationErr.OperationType, OperationGitPullFastForward)
	}
	if !errors.Is(operationErr.Cause, fakeGit.failErr) {
		t.Fatalf("Cause = %v, want %v", operationErr.Cause, fakeGit.failErr)
	}

	wantGitCalls := []string{
		"Fetch:origin:fastapi-microservices-rewrite",
		"Switch:fastapi-microservices-rewrite",
		"PullFFOnly:origin:fastapi-microservices-rewrite",
	}
	if !reflect.DeepEqual(fakeGit.calls, wantGitCalls) {
		t.Fatalf("git calls = %#v, want %#v", fakeGit.calls, wantGitCalls)
	}
	if len(fakeGitHub.calls) != 1 || fakeGitHub.calls[0] != "SetProjectStatus:111:In Progress" {
		t.Fatalf("github calls = %#v, want SetProjectStatus only", fakeGitHub.calls)
	}
}

func TestExecutorCallsAdaptersInExpectedOrder(t *testing.T) {
	recorder := &callRecorder{}
	fakeGit := &fakeGitAdapter{recorder: recorder}
	fakeGitHub := &fakeGitHubAdapter{recorder: recorder}
	executor := Executor{Git: fakeGit, GitHub: fakeGitHub}

	plan, err := NewCreatePullRequestPlan(CreatePullRequestInput{
		Issue:        domain.Issue{ID: 111},
		BranchName:   "feat/issue-111-planner",
		BaseBranch:   "fastapi-microservices-rewrite",
		Title:        "Go rewrite: add planner executor",
		Body:         "Closes #111",
		TargetStatus: domain.ProjectStatusReview,
	})
	if err != nil {
		t.Fatalf("NewCreatePullRequestPlan returned error: %v", err)
	}

	if err := executor.Execute(context.Background(), plan); err != nil {
		t.Fatalf("Execute returned error: %v", err)
	}

	want := []string{
		"git.PushBranch:origin:feat/issue-111-planner:true",
		"github.CreatePullRequest:Go rewrite: add planner executor:feat/issue-111-planner:fastapi-microservices-rewrite",
		"github.SetProjectStatus:111:Review",
	}
	if !reflect.DeepEqual(recorder.calls, want) {
		t.Fatalf("calls = %#v, want %#v", recorder.calls, want)
	}
}

func TestExecutorTreatsMissingLocalBranchCleanupAsNoop(t *testing.T) {
	fakeGit := &fakeGitAdapter{failOn: "DeleteLocalBranch", failErr: git.ErrLocalBranchNotFound}
	executor := Executor{Git: fakeGit, GitHub: &fakeGitHubAdapter{}}
	plan := Plan{
		Command: "task merge",
		Issue:   129,
		Operations: []Operation{
			{
				ID:      "branch-delete-local-task-branch",
				Type:    OperationBranchDeleteLocal,
				Payload: DeleteLocalBranchPayload{Branch: "feat/issue-129-cleanup"},
			},
		},
	}

	if err := executor.Execute(context.Background(), plan); err != nil {
		t.Fatalf("Execute returned error: %v", err)
	}

	wantGitCalls := []string{"DeleteLocalBranch:feat/issue-129-cleanup"}
	if !reflect.DeepEqual(fakeGit.calls, wantGitCalls) {
		t.Fatalf("git calls = %#v, want %#v", fakeGit.calls, wantGitCalls)
	}
}

func TestExecutorKeepsDeleteLocalBranchFailuresStrict(t *testing.T) {
	failErr := errors.New("permission denied")
	fakeGit := &fakeGitAdapter{failOn: "DeleteLocalBranch", failErr: failErr}
	executor := Executor{Git: fakeGit, GitHub: &fakeGitHubAdapter{}}
	plan := Plan{
		Command: "task merge",
		Issue:   129,
		Operations: []Operation{
			{
				ID:      "branch-delete-local-task-branch",
				Type:    OperationBranchDeleteLocal,
				Payload: DeleteLocalBranchPayload{Branch: "feat/issue-129-cleanup"},
			},
		},
	}

	err := executor.Execute(context.Background(), plan)
	if err == nil {
		t.Fatal("Execute returned nil error")
	}
	if !errors.Is(err, failErr) {
		t.Fatalf("Execute error = %v, want %v", err, failErr)
	}
}

type callRecorder struct {
	calls []string
}

func (r *callRecorder) add(call string) {
	if r != nil {
		r.calls = append(r.calls, call)
	}
}

type fakeGitAdapter struct {
	calls    []string
	failOn   string
	failErr  error
	recorder *callRecorder
}

func (f *fakeGitAdapter) CurrentBranch(context.Context) (string, error) { return "", nil }

func (f *fakeGitAdapter) IsWorkTreeClean(context.Context) (bool, []string, error) {
	return true, nil, nil
}

func (f *fakeGitAdapter) Fetch(_ context.Context, remote string, branch string) error {
	return f.record("Fetch", remote+":"+branch)
}

func (f *fakeGitAdapter) Switch(_ context.Context, branch string) error {
	return f.record("Switch", branch)
}

func (f *fakeGitAdapter) PullFFOnly(_ context.Context, remote string, branch string) error {
	return f.record("PullFFOnly", remote+":"+branch)
}

func (f *fakeGitAdapter) CreateBranch(_ context.Context, branch string) error {
	return f.record("CreateBranch", branch)
}

func (f *fakeGitAdapter) DeleteLocalBranch(_ context.Context, branch string, force bool) error {
	return f.record("DeleteLocalBranch", branch)
}

func (f *fakeGitAdapter) DeleteRemoteBranch(_ context.Context, remote string, branch string) error {
	return f.record("DeleteRemoteBranch", remote+":"+branch)
}

func (f *fakeGitAdapter) PushBranch(_ context.Context, remote string, branch string, setUpstream bool) error {
	f.recorder.add("git.PushBranch:" + remote + ":" + branch + ":" + strconv.FormatBool(setUpstream))
	return f.record("PushBranch", remote+":"+branch)
}

func (f *fakeGitAdapter) HasCommitsAhead(context.Context, string, string) (bool, error) {
	return false, nil
}

func (f *fakeGitAdapter) record(method string, detail string) error {
	f.calls = append(f.calls, method+":"+detail)
	if f.failOn == method {
		return f.failErr
	}
	return nil
}

type fakeGitHubAdapter struct {
	calls    []string
	recorder *callRecorder
}

func (f *fakeGitHubAdapter) GetIssue(context.Context, int) (domain.Issue, error) {
	return domain.Issue{}, nil
}

func (f *fakeGitHubAdapter) CreateIssue(context.Context, github.CreateIssueInput) (domain.Issue, error) {
	return domain.Issue{}, nil
}

func (f *fakeGitHubAdapter) CloseIssue(context.Context, int, string) error { return nil }

func (f *fakeGitHubAdapter) ListLabels(context.Context) ([]github.Label, error) { return nil, nil }

func (f *fakeGitHubAdapter) CreateLabel(context.Context, github.Label) error { return nil }

func (f *fakeGitHubAdapter) ListPullRequests(context.Context, github.PullRequestFilter) ([]domain.PullRequest, error) {
	return nil, nil
}

func (f *fakeGitHubAdapter) CreatePullRequest(_ context.Context, input github.CreatePullRequestInput) (domain.PullRequest, error) {
	f.calls = append(f.calls, "CreatePullRequest:"+input.Head+":"+input.Base)
	f.recorder.add("github.CreatePullRequest:" + input.Title + ":" + input.Head + ":" + input.Base)
	return domain.PullRequest{Number: 10, Title: input.Title, State: domain.PullRequestStateOpen}, nil
}

func (f *fakeGitHubAdapter) MergePullRequest(context.Context, int, github.MergePullRequestInput) error {
	return nil
}

func (f *fakeGitHubAdapter) GetPullRequestChecks(context.Context, int) (domain.PullRequestChecks, error) {
	return domain.PullRequestChecks{}, nil
}

func (f *fakeGitHubAdapter) GetProjectItem(context.Context, int) (domain.ProjectItem, error) {
	return domain.ProjectItem{}, nil
}

func (f *fakeGitHubAdapter) AddProjectItem(_ context.Context, issueNumber int) error {
	f.calls = append(f.calls, "AddProjectItem:"+strconv.Itoa(issueNumber))
	return nil
}

func (f *fakeGitHubAdapter) SetProjectStatus(_ context.Context, issueNumber int, status domain.ProjectStatus) error {
	call := "SetProjectStatus:" + strconv.Itoa(issueNumber) + ":" + string(status)
	f.calls = append(f.calls, call)
	f.recorder.add("github." + call)
	return nil
}
