package planner

import (
	"encoding/json"
	"reflect"
	"testing"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
)

func TestNewStartTaskPlanOperationOrder(t *testing.T) {
	plan, err := NewStartTaskPlan(StartTaskInput{
		Issue: domain.Issue{
			ID:    111,
			Title: "Add planner",
		},
		DefaultBranch: "fastapi-microservices-rewrite",
		BranchName:    "feat/issue-111-planner",
		TargetStatus:  domain.ProjectStatusInProgress,
	})
	if err != nil {
		t.Fatalf("NewStartTaskPlan returned error: %v", err)
	}

	if plan.Command != "task start" {
		t.Fatalf("Command = %q, want %q", plan.Command, "task start")
	}
	if plan.Issue != 111 {
		t.Fatalf("Issue = %d, want 111", plan.Issue)
	}

	got := operationTypes(plan)
	want := []OperationType{
		OperationProjectSetStatus,
		OperationGitFetch,
		OperationGitSwitch,
		OperationGitPullFastForward,
		OperationGitCreateBranch,
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("operation types = %#v, want %#v", got, want)
	}

	wantIDs := []string{
		"project-set-status-in-progress",
		"git-fetch-default-branch",
		"git-switch-default-branch",
		"git-pull-fast-forward-default-branch",
		"git-create-task-branch",
	}
	if got := operationIDs(plan); !reflect.DeepEqual(got, wantIDs) {
		t.Fatalf("operation IDs = %#v, want %#v", got, wantIDs)
	}
}

func TestNewStartTaskPlanValidation(t *testing.T) {
	issue := domain.Issue{ID: 111}

	if _, err := NewStartTaskPlan(StartTaskInput{
		Issue:         issue,
		DefaultBranch: "",
		BranchName:    "feat/issue-111-planner",
		TargetStatus:  domain.ProjectStatusInProgress,
	}); err == nil {
		t.Fatal("NewStartTaskPlan with empty default branch returned nil error")
	}

	if _, err := NewStartTaskPlan(StartTaskInput{
		Issue:         issue,
		DefaultBranch: "fastapi-microservices-rewrite",
		BranchName:    "",
		TargetStatus:  domain.ProjectStatusInProgress,
	}); err == nil {
		t.Fatal("NewStartTaskPlan with empty branch returned nil error")
	}
}

func TestNewCreatePullRequestPlanOperationOrder(t *testing.T) {
	plan, err := NewCreatePullRequestPlan(CreatePullRequestInput{
		Issue: domain.Issue{
			ID:    111,
			Title: "Add planner",
		},
		BranchName:   "feat/issue-111-planner",
		BaseBranch:   "fastapi-microservices-rewrite",
		Title:        "Go rewrite: add planner executor",
		Body:         "Closes #111",
		TargetStatus: domain.ProjectStatusReview,
	})
	if err != nil {
		t.Fatalf("NewCreatePullRequestPlan returned error: %v", err)
	}

	got := operationTypes(plan)
	want := []OperationType{
		OperationGitPushBranch,
		OperationPullRequestCreate,
		OperationProjectSetStatus,
		OperationGitSwitch,
		OperationGitPullFastForward,
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("operation types = %#v, want %#v", got, want)
	}

	wantIDs := []string{
		"git-push-task-branch",
		"pull-request-create",
		"project-set-status-review",
		"git-switch-default-branch",
		"git-pull-fast-forward-default-branch",
	}
	if got := operationIDs(plan); !reflect.DeepEqual(got, wantIDs) {
		t.Fatalf("operation IDs = %#v, want %#v", got, wantIDs)
	}
}

func TestPlanJSONSerialization(t *testing.T) {
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

	data, err := json.Marshal(plan)
	if err != nil {
		t.Fatalf("json.Marshal returned error: %v", err)
	}

	var decoded Plan
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("json.Unmarshal returned error: %v", err)
	}

	if decoded.Command != plan.Command || decoded.Issue != plan.Issue {
		t.Fatalf("decoded plan = %#v, want command %q issue %d", decoded, plan.Command, plan.Issue)
	}
	if len(decoded.Operations) != len(plan.Operations) {
		t.Fatalf("decoded operations length = %d, want %d", len(decoded.Operations), len(plan.Operations))
	}
}

func TestRenderDryRunOutput(t *testing.T) {
	plan, err := NewStartTaskPlan(StartTaskInput{
		Issue:         domain.Issue{ID: 111},
		DefaultBranch: "fastapi-microservices-rewrite",
		BranchName:    "feat/issue-111-planner",
		TargetStatus:  domain.ProjectStatusInProgress,
	})
	if err != nil {
		t.Fatalf("NewStartTaskPlan returned error: %v", err)
	}

	got := RenderDryRun(plan)
	want := []string{
		"task start #111",
		"1. [Project.SetStatus] Set project status for issue #111 to In Progress",
		"2. [Git.Fetch] Fetch origin/fastapi-microservices-rewrite",
		"3. [Git.Switch] Switch to fastapi-microservices-rewrite",
		"4. [Git.PullFastForward] Pull fastapi-microservices-rewrite with --ff-only from origin",
		"5. [Git.CreateBranch] Create task branch feat/issue-111-planner",
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("RenderDryRun = %#v, want %#v", got, want)
	}
}

func operationTypes(plan Plan) []OperationType {
	types := make([]OperationType, len(plan.Operations))
	for i, operation := range plan.Operations {
		types[i] = operation.Type
	}
	return types
}

func operationIDs(plan Plan) []string {
	ids := make([]string, len(plan.Operations))
	for i, operation := range plan.Operations {
		ids[i] = operation.ID
	}
	return ids
}
