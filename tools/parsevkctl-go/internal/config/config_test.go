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

func TestResolvePathUsesGoOwnedConfigByDefault(t *testing.T) {
	dir := t.TempDir()
	configDir := filepath.Join(dir, "tools", "parsevkctl-go")
	if err := os.MkdirAll(configDir, 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(configDir, "config.json"), []byte(`{}`), 0o600); err != nil {
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

	path, err := ResolvePath("")
	if err != nil {
		t.Fatalf("ResolvePath returned error: %v", err)
	}

	want := filepath.Join("tools", "parsevkctl-go", "config.json")
	if path != want {
		t.Fatalf("path = %q, want %q", path, want)
	}
}

func TestResolvePathUsesLocalConfigWhenRunFromGoToolDirectory(t *testing.T) {
	dir := t.TempDir()
	configDir := filepath.Join(dir, "tools", "parsevkctl-go")
	if err := os.MkdirAll(configDir, 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(configDir, "config.json"), []byte(`{}`), 0o600); err != nil {
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
	if err := os.Chdir(configDir); err != nil {
		t.Fatal(err)
	}

	path, err := ResolvePath("")
	if err != nil {
		t.Fatalf("ResolvePath returned error: %v", err)
	}

	if path != "config.json" {
		t.Fatalf("path = %q, want config.json", path)
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

func TestValidateRejectsMissingRequiredFields(t *testing.T) {
	valid := Config{
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
		Merge: MergeSettings{
			RequireChecks:  boolPtr(false),
			AllowAutoMerge: boolPtr(false),
		},
	}

	tests := []struct {
		name          string
		mutate        func(*Config)
		expectedError string
	}{
		{
			name: "missing repo",
			mutate: func(cfg *Config) {
				cfg.Repo = ""
			},
			expectedError: "missing field repo",
		},
		{
			name: "missing defaultBranch",
			mutate: func(cfg *Config) {
				cfg.DefaultBranch = ""
			},
			expectedError: "missing field defaultBranch",
		},
		{
			name: "missing projectOwner",
			mutate: func(cfg *Config) {
				cfg.ProjectOwner = ""
			},
			expectedError: "missing field projectOwner",
		},
		{
			name: "missing projectId",
			mutate: func(cfg *Config) {
				cfg.ProjectID = ""
			},
			expectedError: "missing field projectId",
		},
		{
			name: "missing projectTitle",
			mutate: func(cfg *Config) {
				cfg.ProjectTitle = ""
			},
			expectedError: "missing field projectTitle",
		},
		{
			name: "missing projectNumber",
			mutate: func(cfg *Config) {
				cfg.ProjectNumber = 0
			},
			expectedError: "projectNumber must be a positive integer",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := valid
			tt.mutate(&cfg)

			errs := Validate(cfg)
			if !contains(errs, tt.expectedError) {
				t.Fatalf("expected %q, got: %v", tt.expectedError, errs)
			}
		})
	}
}

func TestValidateFileReturnsStructuredValidationErrors(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")

	raw := []byte(`{
"repo": "parseVK",
"defaultBranch": "main",
"projectOwner": "andr-235",
"projectNumber": 0,
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
	if len(result.ValidationErrors) == 0 {
		t.Fatalf("expected structured validation errors")
	}
}
