package github

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strconv"
	"strings"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
)

const (
	issueJSONFields       = "number,title,state,headRefName"
	pullRequestJSONFields = "number,title,state,isDraft,mergedAt"
)

type commandResult struct {
	stdout string
	stderr string
}

type commandRunner func(ctx context.Context, name string, args ...string) (commandResult, error)

type ShellAdapter struct {
	ghPath string
	runner commandRunner
}

func NewShellAdapter() *ShellAdapter {
	return newShellAdapterWithRunner(runCommand)
}

func newShellAdapterWithRunner(runner commandRunner) *ShellAdapter {
	return &ShellAdapter{
		ghPath: "gh",
		runner: runner,
	}
}

func (adapter *ShellAdapter) GetIssue(ctx context.Context, number int) (domain.Issue, error) {
	if err := validateNumber("issue number", number); err != nil {
		return domain.Issue{}, err
	}

	result, err := adapter.runGH(ctx, "get issue", "issue", "view", strconv.Itoa(number), "--json", issueJSONFields)
	if err != nil {
		return domain.Issue{}, err
	}

	return parseIssueJSON([]byte(result.stdout))
}

func (adapter *ShellAdapter) CreateIssue(ctx context.Context, input CreateIssueInput) (domain.Issue, error) {
	if strings.TrimSpace(input.Title) == "" {
		return domain.Issue{}, fmt.Errorf("issue title must not be empty")
	}

	args := []string{"issue", "create", "--title", input.Title}
	if strings.TrimSpace(input.Body) != "" {
		args = append(args, "--body", input.Body)
	}
	for _, label := range input.Labels {
		if strings.TrimSpace(label) != "" {
			args = append(args, "--label", label)
		}
	}

	result, err := adapter.runGH(ctx, "create issue", args...)
	if err != nil {
		return domain.Issue{}, err
	}

	number, err := parseNumberFromURL(result.stdout, "issues")
	if err != nil {
		return domain.Issue{}, err
	}

	return adapter.GetIssue(ctx, number)
}

func (adapter *ShellAdapter) CloseIssue(ctx context.Context, number int, comment string) error {
	if err := validateNumber("issue number", number); err != nil {
		return err
	}

	args := []string{"issue", "close", strconv.Itoa(number)}
	if strings.TrimSpace(comment) != "" {
		args = append(args, "--comment", comment)
	}

	_, err := adapter.runGH(ctx, "close issue", args...)
	return err
}

func (adapter *ShellAdapter) ListPullRequests(ctx context.Context, filter PullRequestFilter) ([]domain.PullRequest, error) {
	args := []string{"pr", "list"}
	if strings.TrimSpace(filter.State) != "" {
		args = append(args, "--state", filter.State)
	}
	if strings.TrimSpace(filter.Head) != "" {
		args = append(args, "--head", filter.Head)
	}
	if strings.TrimSpace(filter.Base) != "" {
		args = append(args, "--base", filter.Base)
	}
	if strings.TrimSpace(filter.Search) != "" {
		args = append(args, "--search", filter.Search)
	}
	args = append(args, "--json", pullRequestJSONFields)

	result, err := adapter.runGH(ctx, "list pull requests", args...)
	if err != nil {
		return nil, err
	}

	return parsePullRequestsJSON([]byte(result.stdout))
}

func (adapter *ShellAdapter) CreatePullRequest(ctx context.Context, input CreatePullRequestInput) (domain.PullRequest, error) {
	if strings.TrimSpace(input.Title) == "" {
		return domain.PullRequest{}, fmt.Errorf("pull request title must not be empty")
	}

	args := []string{"pr", "create", "--title", input.Title}
	if strings.TrimSpace(input.Body) != "" {
		args = append(args, "--body", input.Body)
	}
	if strings.TrimSpace(input.Head) != "" {
		args = append(args, "--head", input.Head)
	}
	if strings.TrimSpace(input.Base) != "" {
		args = append(args, "--base", input.Base)
	}
	if input.Draft {
		args = append(args, "--draft")
	}

	result, err := adapter.runGH(ctx, "create pull request", args...)
	if err != nil {
		return domain.PullRequest{}, err
	}

	number, err := parseNumberFromURL(result.stdout, "pull")
	if err != nil {
		return domain.PullRequest{}, err
	}

	return adapter.getPullRequest(ctx, number)
}

func (adapter *ShellAdapter) MergePullRequest(ctx context.Context, number int, input MergePullRequestInput) error {
	if err := validateNumber("pull request number", number); err != nil {
		return err
	}

	args := []string{"pr", "merge", strconv.Itoa(number)}
	switch strings.ToLower(strings.TrimSpace(input.Method)) {
	case "", "merge":
		args = append(args, "--merge")
	case "squash":
		args = append(args, "--squash")
	case "rebase":
		args = append(args, "--rebase")
	default:
		return fmt.Errorf("unsupported pull request merge method %q", input.Method)
	}
	if input.DeleteBranch {
		args = append(args, "--delete-branch")
	}
	if input.Auto {
		args = append(args, "--auto")
	}

	_, err := adapter.runGH(ctx, "merge pull request", args...)
	return err
}

func (adapter *ShellAdapter) GetProjectItem(context.Context, int) (domain.ProjectItem, error) {
	return domain.ProjectItem{}, ErrProjectNotImplemented
}

func (adapter *ShellAdapter) SetProjectStatus(context.Context, int, domain.ProjectStatus) error {
	return ErrProjectNotImplemented
}

func (adapter *ShellAdapter) getPullRequest(ctx context.Context, number int) (domain.PullRequest, error) {
	if err := validateNumber("pull request number", number); err != nil {
		return domain.PullRequest{}, err
	}

	result, err := adapter.runGH(ctx, "get pull request", "pr", "view", strconv.Itoa(number), "--json", pullRequestJSONFields)
	if err != nil {
		return domain.PullRequest{}, err
	}

	return parsePullRequestJSON([]byte(result.stdout))
}

func (adapter *ShellAdapter) runGH(ctx context.Context, operation string, args ...string) (commandResult, error) {
	result, err := adapter.runner(ctx, adapter.ghPath, args...)
	if err != nil {
		return result, CommandError{
			Operation: operation,
			Args:      append([]string(nil), args...),
			ExitCode:  exitCodeOf(err),
			Stdout:    result.stdout,
			Stderr:    result.stderr,
			Err:       err,
		}
	}

	return result, nil
}

func runCommand(ctx context.Context, name string, args ...string) (commandResult, error) {
	cmd := exec.CommandContext(ctx, name, args...)

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	return commandResult{
		stdout: strings.TrimSpace(stdout.String()),
		stderr: strings.TrimSpace(stderr.String()),
	}, err
}

func validateNumber(name string, number int) error {
	if number <= 0 {
		return fmt.Errorf("%s must be a positive integer", name)
	}

	return nil
}
