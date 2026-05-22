package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestValidateAcceptsValidConfig(t *testing.T) {
	cfg := Config{
		Repo:          "andr-235/parseVK",
		DefaultBranch: "fastapi-microservices-rewrite",
		ProjectOwner:  "andr-235",
		ProjectNumber: 1,
		ProjectID:     "PVT_kw_TEST",
		ProjectTitle:  "parseVK",
		Statuses: Statuses{
			Todo:       "Todo",
			InProgress: "In Progress",
			Review:     "Review",
			Done:       "Done",
		},
		Merge: MergeSettings{
			RequireChecks:  boolPtr(false),
			AllowAutoMerge: boolPtr(false),
		},
	}

	errs := Validate(cfg)
	if len(errs) != 0 {
		t.Fatalf("expected valid config, got errors: %v", errs)
	}
}

func TestValidateRejectsBadRepoFormat(t *testing.T) {
	cfg := Config{
		Repo:          "parseVK",
		DefaultBranch: "main",
		ProjectOwner:  "andr-235",
		ProjectNumber: 1,
		ProjectID:     "PVT_kw_TEST",
		ProjectTitle:  "parseVK",
		Statuses: Statuses{
			Todo:       "Todo",
			InProgress: "In Progress",
			Review:     "Review",
			Done:       "Done",
		},
	}

	errs := Validate(cfg)

	if !contains(errs, "repo must use owner/name format") {
		t.Fatalf("expected repo format error, got: %v", errs)
	}
}

func TestValidateRejectsMissingStatus(t *testing.T) {
	cfg := Config{
		Repo:          "andr-235/parseVK",
		DefaultBranch: "main",
		ProjectOwner:  "andr-235",
		ProjectNumber: 1,
		ProjectID:     "PVT_kw_TEST",
		ProjectTitle:  "parseVK",
		Statuses: Statuses{
			Todo:       "Todo",
			InProgress: "In Progress",
			Done:       "Done",
		},
	}

	errs := Validate(cfg)

	if !contains(errs, "missing field statuses.review") {
		t.Fatalf("expected missing review status error, got: %v", errs)
	}
}

func contains(values []string, expected string) bool {
	for _, value := range values {
		if value == expected {
			return true
		}
	}

	return false
}

func boolPtr(value bool) *bool { return &value }

func TestValidateRejectsMissingMergeFlags(t *testing.T) {
	cfg := Config{
		Repo:          "andr-235/parseVK",
		DefaultBranch: "main",
		ProjectOwner:  "andr-235",
		ProjectNumber: 1,
		ProjectID:     "PVT_kw_TEST",
		ProjectTitle:  "parseVK",
		Statuses: Statuses{
			Todo:       "Todo",
			InProgress: "In Progress",
			Review:     "Review",
			Done:       "Done",
		},
	}

	errs := Validate(cfg)

	if !contains(errs, "missing field merge.requireChecks") {
		t.Fatalf("expected missing requireChecks error, got: %v", errs)
	}
	if !contains(errs, "missing field merge.allowAutoMerge") {
		t.Fatalf("expected missing allowAutoMerge error, got: %v", errs)
	}
}

func TestValidateFileAcceptsValidJSON(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")

	raw := []byte(`{
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
}`)

	if err := os.WriteFile(path, raw, 0o600); err != nil {
		t.Fatal(err)
	}

	result := ValidateFile(path)
	if !result.Valid {
		t.Fatalf("expected valid config file, got: %v", result.Errors)
	}
}

func TestValidateFileRejectsInvalidProjectNumberType(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")

	raw := []byte(`{
"repo": "andr-235/parseVK",
"defaultBranch": "main",
"projectOwner": "andr-235",
"projectNumber": "one",
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
}`)

	if err := os.WriteFile(path, raw, 0o600); err != nil {
		t.Fatal(err)
	}

	result := ValidateFile(path)
	if result.Valid {
		t.Fatalf("expected invalid config")
	}
	if len(result.Errors) == 0 {
		t.Fatalf("expected validation errors")
	}
}

func TestValidateFileRejectsMissingMergeFlags(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")

	raw := []byte(`{
"repo": "andr-235/parseVK",
"defaultBranch": "main",
"projectOwner": "andr-235",
"projectNumber": 1,
"projectId": "PVT_kw_TEST",
"projectTitle": "parseVK",
"statuses": {
"todo": "Todo",
"inProgress": "In Progress",
"review": "Review",
"done": "Done"
}
}`)

	if err := os.WriteFile(path, raw, 0o600); err != nil {
		t.Fatal(err)
	}

	result := ValidateFile(path)
	if result.Valid {
		t.Fatalf("expected invalid config")
	}
	if !contains(result.Errors, "missing field merge.requireChecks") {
		t.Fatalf("expected missing requireChecks error, got: %v", result.Errors)
	}
	if !contains(result.Errors, "missing field merge.allowAutoMerge") {
		t.Fatalf("expected missing allowAutoMerge error, got: %v", result.Errors)
	}
}

func TestValidateFileRejectsMissingExplicitPath(t *testing.T) {
	path := filepath.Join(t.TempDir(), "missing.json")

	result := ValidateFile(path)
	if result.Valid {
		t.Fatalf("expected invalid config")
	}
	if len(result.Errors) == 0 {
		t.Fatalf("expected missing path error")
	}
}
