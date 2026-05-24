package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	Repo          string        `json:"repo"`
	DefaultBranch string        `json:"defaultBranch"`
	ProjectOwner  string        `json:"projectOwner"`
	ProjectNumber int           `json:"projectNumber"`
	ProjectID     string        `json:"projectId"`
	ProjectTitle  string        `json:"projectTitle"`
	Statuses      Statuses      `json:"statuses"`
	Merge         MergeSettings `json:"merge"`
}

type Statuses struct {
	Todo       string `json:"todo"`
	InProgress string `json:"inProgress"`
	Review     string `json:"review"`
	Done       string `json:"done"`
}

type MergeSettings struct {
	Strategy       string `json:"strategy"`
	DeleteBranch   *bool  `json:"deleteBranch"`
	RequireChecks  *bool  `json:"requireChecks"`
	AllowAutoMerge *bool  `json:"allowAutoMerge"`
}

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type ValidationResult struct {
	Path             string            `json:"path"`
	Valid            bool              `json:"valid"`
	Errors           []string          `json:"errors,omitempty"`
	ValidationErrors []ValidationError `json:"validationErrors,omitempty"`
}

func DefaultPaths() []string {
	return []string{
		filepath.Join("tools", "parsevkctl-go", "config.json"),
		"config.json",
		filepath.Join(".tools", "parsevkctl", "config.json"),
	}
}

func ResolvePath(explicitPath string) (string, error) {
	if strings.TrimSpace(explicitPath) != "" {
		if _, err := os.Stat(explicitPath); err != nil {
			return explicitPath, err
		}
		return explicitPath, nil
	}

	for _, candidate := range DefaultPaths() {
		if _, err := os.Stat(candidate); err == nil {
			return candidate, nil
		}
	}

	return "", errors.New("config not found; pass --config <path> or create tools/parsevkctl-go/config.json")
}

func Load(path string) (Config, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return Config{}, err
	}

	var cfg Config
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return Config{}, fmt.Errorf("invalid JSON: %w", err)
	}

	return cfg, nil
}

func Validate(cfg Config) []string {
	var errs []string

	require := func(name string, value string) {
		if strings.TrimSpace(value) == "" {
			errs = append(errs, "missing field "+name)
		}
	}

	require("repo", cfg.Repo)
	require("defaultBranch", cfg.DefaultBranch)
	require("projectOwner", cfg.ProjectOwner)
	require("projectId", cfg.ProjectID)
	require("projectTitle", cfg.ProjectTitle)

	if cfg.ProjectNumber <= 0 {
		errs = append(errs, "projectNumber must be a positive integer")
	}

	if strings.TrimSpace(cfg.Repo) != "" {
		parts := strings.Split(cfg.Repo, "/")
		if len(parts) != 2 || strings.TrimSpace(parts[0]) == "" || strings.TrimSpace(parts[1]) == "" {
			errs = append(errs, "repo must use owner/name format")
		}
	}

	require("statuses.todo", cfg.Statuses.Todo)
	require("statuses.inProgress", cfg.Statuses.InProgress)
	require("statuses.review", cfg.Statuses.Review)
	require("statuses.done", cfg.Statuses.Done)

	if cfg.Merge.RequireChecks == nil {
		errs = append(errs, "missing field merge.requireChecks")
	}
	if cfg.Merge.AllowAutoMerge == nil {
		errs = append(errs, "missing field merge.allowAutoMerge")
	}

	return errs
}

func ValidateFile(explicitPath string) ValidationResult {
	path, err := ResolvePath(explicitPath)
	if err != nil {
		return ValidationResult{
			Path:   explicitPath,
			Valid:  false,
			Errors: []string{err.Error()},
		}
	}

	cfg, err := Load(path)
	if err != nil {
		return ValidationResult{
			Path:   path,
			Valid:  false,
			Errors: []string{err.Error()},
		}
	}

	errs := Validate(cfg)

	return ValidationResult{
		Path:             path,
		Valid:            len(errs) == 0,
		Errors:           errs,
		ValidationErrors: toValidationErrors(errs),
	}
}

func toValidationErrors(errors []string) []ValidationError {
	result := make([]ValidationError, 0, len(errors))

	for _, message := range errors {
		field := ""
		if after, ok := strings.CutPrefix(message, "missing field "); ok {
			field = after
		} else if strings.HasPrefix(message, "projectNumber ") {
			field = "projectNumber"
		} else if strings.HasPrefix(message, "repo ") {
			field = "repo"
		}

		result = append(result, ValidationError{
			Field:   field,
			Message: message,
		})
	}

	return result
}
