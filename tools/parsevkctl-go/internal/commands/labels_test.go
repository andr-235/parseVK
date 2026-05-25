package commands

import (
	"bytes"
	"context"
	"errors"
	"reflect"
	"strings"
	"testing"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/github"
)

func TestLabelsBootstrapDryRunDoesNotWriteAndReportsWouldCreate(t *testing.T) {
	deps := okDeps()
	deps.GitHub.labels = []github.Label{{Name: "type:feature"}}

	var out bytes.Buffer
	exit := RunLabelsBootstrap(context.Background(), LabelsBootstrapRunInput{
		GitHub: deps.GitHub,
		DryRun: true,
		Stdout: &out,
	})

	if exit != 0 {
		t.Fatalf("exit = %d, want 0", exit)
	}
	if len(deps.GitHub.writeCalls) != 0 {
		t.Fatalf("github writes = %#v, want none", deps.GitHub.writeCalls)
	}
	text := out.String()
	for _, want := range []string{
		"parsevkctl labels bootstrap",
		"Mode: dry-run",
		"Existing labels:",
		"- type:feature",
		"Would create labels:",
		"- service:parsevkctl",
	} {
		if !strings.Contains(text, want) {
			t.Fatalf("output missing %q:\n%s", want, text)
		}
	}
}

func TestLabelsBootstrapCreatesMissingAndSkipsExisting(t *testing.T) {
	deps := okDeps()
	deps.GitHub.allowWrites = true
	deps.GitHub.labels = []github.Label{{Name: "type:feature"}, {Name: "risk:low"}}

	var out bytes.Buffer
	exit := RunLabelsBootstrap(context.Background(), LabelsBootstrapRunInput{
		GitHub: deps.GitHub,
		Stdout: &out,
	})

	if exit != 0 {
		t.Fatalf("exit = %d, want 0; output=%s", exit, out.String())
	}
	if calls := countCalls(deps.GitHub.writeCalls, "CreateLabel"); calls != 26 {
		t.Fatalf("CreateLabel calls = %d, want 26; calls=%#v", calls, deps.GitHub.writeCalls)
	}
	for _, created := range deps.GitHub.createdLabels {
		if created.Name == "type:feature" || created.Name == "risk:low" {
			t.Fatalf("created existing label: %#v", created)
		}
	}
	text := out.String()
	for _, want := range []string{
		"Created labels:",
		"- service:parsevkctl",
		"Existing labels:",
		"- type:feature",
		"- risk:low",
		"Failed labels: none",
	} {
		if !strings.Contains(text, want) {
			t.Fatalf("output missing %q:\n%s", want, text)
		}
	}
}

func TestLabelsBootstrapReturnsFailureWhenCreateFails(t *testing.T) {
	deps := okDeps()
	deps.GitHub.allowWrites = true
	deps.GitHub.createLabelErr = errors.New("permission denied")

	var out bytes.Buffer
	exit := RunLabelsBootstrap(context.Background(), LabelsBootstrapRunInput{
		GitHub: deps.GitHub,
		Stdout: &out,
	})

	if exit == 0 {
		t.Fatalf("exit = 0, want failure")
	}
	if !strings.Contains(out.String(), "Failed labels:") || !strings.Contains(out.String(), "permission denied") {
		t.Fatalf("output missing failed label summary:\n%s", out.String())
	}
}

func TestLabelsBootstrapTreatsCreateAlreadyExistsAsExisting(t *testing.T) {
	deps := okDeps()
	deps.GitHub.allowWrites = true
	deps.GitHub.createLabelErr = github.ErrLabelAlreadyExists

	var out bytes.Buffer
	exit := RunLabelsBootstrap(context.Background(), LabelsBootstrapRunInput{
		GitHub: deps.GitHub,
		Stdout: &out,
	})

	if exit != 0 {
		t.Fatalf("exit = %d, want 0; output=%s", exit, out.String())
	}
	if !strings.Contains(out.String(), "Existing labels:") || !strings.Contains(out.String(), "Failed labels: none") {
		t.Fatalf("unexpected output:\n%s", out.String())
	}
}

func TestLabelsBootstrapJSONDryRun(t *testing.T) {
	deps := okDeps()
	deps.GitHub.labels = []github.Label{{Name: "type:feature"}}

	var out bytes.Buffer
	exit := RunLabelsBootstrap(context.Background(), LabelsBootstrapRunInput{
		GitHub: deps.GitHub,
		DryRun: true,
		JSON:   true,
		Stdout: &out,
	})

	if exit != 0 {
		t.Fatalf("exit = %d, want 0", exit)
	}
	if !strings.Contains(out.String(), `"dryRun": true`) || !strings.Contains(out.String(), `"wouldCreate"`) {
		t.Fatalf("unexpected JSON output:\n%s", out.String())
	}
}

func TestLabelNamesPreserveStandardOrder(t *testing.T) {
	got := labelNames(github.StandardLabels()[:3])
	want := []string{"type:feature", "type:bug", "type:infra"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("names = %#v, want %#v", got, want)
	}
}

func countCalls(calls []string, name string) int {
	count := 0
	for _, call := range calls {
		if call == name {
			count++
		}
	}
	return count
}
