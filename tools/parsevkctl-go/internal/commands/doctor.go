package commands

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/config"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/git"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/github"
)

type CheckStatus string

const (
	CheckOK   CheckStatus = "ok"
	CheckWarn CheckStatus = "warn"
	CheckFail CheckStatus = "fail"
)

type DoctorInput struct {
	ConfigValidation config.ValidationResult
	Config           config.Config
	Git              git.Adapter
	GitHub           github.Adapter
}

type DoctorRunInput struct {
	DoctorInput
	JSON   bool
	Stdout io.Writer
	Stderr io.Writer
}

type DoctorResult struct {
	Checks   []DoctorCheck `json:"checks"`
	ExitCode int           `json:"-"`
}

type DoctorCheck struct {
	Name    string      `json:"name"`
	Status  CheckStatus `json:"status"`
	Message string      `json:"message"`
}

type projectStatusFieldChecker interface {
	CheckProjectStatusField(ctx context.Context) error
}

func RunDoctorCommand(ctx context.Context, input DoctorRunInput) int {
	result := RunDoctor(ctx, input.DoctorInput)
	if err := renderDoctor(input.Stdout, result, input.JSON); err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	return result.ExitCode
}

func RunDoctor(ctx context.Context, input DoctorInput) DoctorResult {
	checks := make([]DoctorCheck, 0, 8)

	if input.ConfigValidation.Valid {
		checks = append(checks, DoctorCheck{Name: "config", Status: CheckOK, Message: "config validates"})
	} else {
		message := "config is invalid"
		if len(input.ConfigValidation.Errors) > 0 {
			message = strings.Join(input.ConfigValidation.Errors, "; ")
		}
		checks = append(checks, DoctorCheck{Name: "config", Status: CheckFail, Message: message})
	}

	if branch, err := input.Git.CurrentBranch(ctx); err != nil {
		checks = append(checks,
			DoctorCheck{Name: "git", Status: CheckFail, Message: "git command failed: " + err.Error()},
			DoctorCheck{Name: "git-worktree", Status: CheckFail, Message: "current directory is not a readable git worktree"},
			DoctorCheck{Name: "current-branch", Status: CheckFail, Message: "current branch cannot be read"},
		)
	} else {
		checks = append(checks,
			DoctorCheck{Name: "git", Status: CheckOK, Message: "git adapter responded"},
			DoctorCheck{Name: "git-worktree", Status: CheckOK, Message: "current directory is a git worktree"},
			DoctorCheck{Name: "current-branch", Status: CheckOK, Message: "current branch is " + branch},
		)
	}

	if _, _, err := input.Git.IsWorkTreeClean(ctx); err != nil {
		checks = append(checks, DoctorCheck{Name: "working-tree-status", Status: CheckFail, Message: "working tree status cannot be read: " + err.Error()})
	} else {
		checks = append(checks, DoctorCheck{Name: "working-tree-status", Status: CheckOK, Message: "working tree status can be read"})
	}

	if _, err := input.GitHub.ListPullRequests(ctx, github.PullRequestFilter{State: "open"}); err != nil {
		checks = append(checks, DoctorCheck{Name: "github-auth", Status: CheckWarn, Message: "GitHub adapter check failed: " + err.Error()})
	} else {
		checks = append(checks, DoctorCheck{Name: "github-auth", Status: CheckOK, Message: "GitHub adapter can list pull requests"})
	}

	if strings.TrimSpace(input.Config.Repo) == "" {
		checks = append(checks, DoctorCheck{Name: "repo-config", Status: CheckWarn, Message: "repo match cannot be checked without valid config repo"})
	} else {
		checks = append(checks, DoctorCheck{Name: "repo-config", Status: CheckOK, Message: "configured repo is " + input.Config.Repo})
	}

	if strings.TrimSpace(input.Config.DefaultBranch) == "" {
		checks = append(checks, DoctorCheck{Name: "default-branch", Status: CheckWarn, Message: "default branch cannot be checked without config"})
	} else if _, err := input.Git.HasCommitsAhead(ctx, "origin/"+input.Config.DefaultBranch, "HEAD"); err != nil {
		checks = append(checks, DoctorCheck{Name: "default-branch", Status: CheckWarn, Message: "default branch reference could not be checked: " + err.Error()})
	} else {
		checks = append(checks, DoctorCheck{Name: "default-branch", Status: CheckOK, Message: "default branch reference is readable"})
	}

	if checker, ok := input.GitHub.(projectStatusFieldChecker); ok {
		if err := checker.CheckProjectStatusField(ctx); err != nil {
			status := CheckWarn
			message := projectUnavailableMessage(err)
			if !errors.Is(err, github.ErrProjectNotImplemented) {
				message = "project status check failed: " + err.Error()
			}
			checks = append(checks, DoctorCheck{Name: "project-status", Status: status, Message: message})
		} else {
			checks = append(checks, DoctorCheck{Name: "project-status", Status: CheckOK, Message: "project status field is available"})
		}
	} else if _, err := input.GitHub.GetProjectItem(ctx, 1); err != nil {
		status := CheckWarn
		message := projectUnavailableMessage(err)
		if !errors.Is(err, github.ErrProjectNotImplemented) {
			message = "project status check failed: " + err.Error()
		}
		checks = append(checks, DoctorCheck{Name: "project-status", Status: status, Message: message})
	} else {
		checks = append(checks, DoctorCheck{Name: "project-status", Status: CheckOK, Message: "project status is available"})
	}

	result := DoctorResult{Checks: checks}
	for _, check := range checks {
		if check.Status == CheckFail {
			result.ExitCode = 1
			break
		}
	}
	return result
}

func renderDoctor(w io.Writer, result DoctorResult, jsonOutput bool) error {
	if w == nil {
		w = io.Discard
	}
	if jsonOutput {
		encoded, err := json.MarshalIndent(result, "", "  ")
		if err != nil {
			return err
		}
		fmt.Fprintln(w, string(encoded))
		return nil
	}

	for _, check := range result.Checks {
		fmt.Fprintf(w, "%s %s: %s\n", strings.ToUpper(string(check.Status)), check.Name, check.Message)
	}
	return nil
}
