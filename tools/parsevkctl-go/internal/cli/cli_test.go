package cli

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestConfigValidateUsesGoOwnedDefaultConfig(t *testing.T) {
	dir := t.TempDir()
	configDir := filepath.Join(dir, "tools", "parsevkctl-go")
	if err := os.MkdirAll(configDir, 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(configDir, "config.json"), []byte(`{
"repo": "andr-235/parseVK",
"defaultBranch": "fastapi-microservices-rewrite",
"projectOwner": "andr-235",
"projectNumber": 1,
"projectId": "PVT_kw_TEST",
"projectTitle": "parseVK",
"statuses": {
"todo": "Todo",
"inProgress": "In Progress",
"review": "Review",
"done": "Done"
},
"merge": {
"requireChecks": false,
"allowAutoMerge": false
}
}`), 0o600); err != nil {
		t.Fatal(err)
	}

	previousDir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := os.Chdir(previousDir); err != nil {
			t.Fatalf("restore working directory: %v", err)
		}
	})
	if err := os.Chdir(dir); err != nil {
		t.Fatal(err)
	}

	var stdout, stderr bytes.Buffer
	exit := Run([]string{"config", "validate"}, &stdout, &stderr)

	if exit != 0 {
		t.Fatalf("exit = %d, want 0; stderr=%q stdout=%q", exit, stderr.String(), stdout.String())
	}
	if !strings.Contains(stdout.String(), "Path: tools") || !strings.Contains(stdout.String(), "parsevkctl-go") {
		t.Fatalf("stdout does not include Go-owned config path: %q", stdout.String())
	}
	if !strings.Contains(stdout.String(), "Result: VALID") {
		t.Fatalf("stdout does not include valid result: %q", stdout.String())
	}
}

func TestHelpIncludesTaskReview(t *testing.T) {
	var stdout, stderr bytes.Buffer

	exit := Run([]string{"--help"}, &stdout, &stderr)

	if exit != 0 {
		t.Fatalf("exit = %d, want 0; stderr=%q", exit, stderr.String())
	}
	if !strings.Contains(stdout.String(), "parsevkctl task review <issue>") {
		t.Fatalf("help does not include task review:\n%s", stdout.String())
	}
}
