package github

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strconv"
	"strings"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/config"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
)

const (
	issueJSONFields       = "number,title,state,url,labels"
	pullRequestJSONFields = "number,title,state,isDraft,mergedAt,url,baseRefName,headRefName"
)

type commandResult struct {
	stdout string
	stderr string
}

type commandRunner func(ctx context.Context, name string, args ...string) (commandResult, error)

type ShellAdapter struct {
	ghPath string
	runner commandRunner
	config config.Config
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

func NewShellAdapterWithConfig(cfg config.Config) *ShellAdapter {
	adapter := NewShellAdapter()
	adapter.config = cfg
	return adapter
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

func (adapter *ShellAdapter) GetProjectItem(ctx context.Context, issueNumber int) (domain.ProjectItem, error) {
	if err := validateNumber("issue number", issueNumber); err != nil {
		return domain.ProjectItem{}, err
	}
	if err := adapter.validateProjectConfig(); err != nil {
		return domain.ProjectItem{}, err
	}

	result, err := adapter.runGH(ctx, "list project items",
		"project", "item-list", strconv.Itoa(adapter.config.ProjectNumber),
		"--owner", adapter.config.ProjectOwner,
		"--limit", "200",
		"--format", "json",
	)
	if err != nil {
		return domain.ProjectItem{}, err
	}

	items, err := parseProjectItemsJSON([]byte(result.stdout))
	if err != nil {
		return domain.ProjectItem{}, err
	}
	for _, item := range items.Items {
		if item.Content.Number == issueNumber || strings.HasSuffix(item.Content.URL, "/issues/"+strconv.Itoa(issueNumber)) {
			return domain.ProjectItem{
				ID:     item.ID,
				Status: domain.NormalizeProjectStatus(item.Status),
			}, nil
		}
	}
	return domain.ProjectItem{}, fmt.Errorf("project item not found for issue #%d", issueNumber)
}

func (adapter *ShellAdapter) AddProjectItem(ctx context.Context, issueNumber int) error {
	if err := validateNumber("issue number", issueNumber); err != nil {
		return err
	}
	if err := adapter.validateProjectConfig(); err != nil {
		return err
	}

	_, err := adapter.runGH(ctx, "add issue to project",
		"issue", "edit", strconv.Itoa(issueNumber),
		"--repo", adapter.config.Repo,
		"--add-project", adapter.config.ProjectTitle,
	)
	return err
}

func (adapter *ShellAdapter) SetProjectStatus(ctx context.Context, issueNumber int, status domain.ProjectStatus) error {
	if err := validateNumber("issue number", issueNumber); err != nil {
		return err
	}
	if status == "" || status == domain.ProjectStatusUnknown {
		return fmt.Errorf("project status must not be empty or unknown")
	}
	if err := adapter.validateProjectConfig(); err != nil {
		return err
	}

	item, err := adapter.GetProjectItem(ctx, issueNumber)
	if err != nil {
		if addErr := adapter.AddProjectItem(ctx, issueNumber); addErr != nil {
			return fmt.Errorf("project item unavailable and add failed: %w", addErr)
		}
		item, err = adapter.GetProjectItem(ctx, issueNumber)
		if err != nil {
			return err
		}
	}

	field, err := adapter.getStatusField(ctx)
	if err != nil {
		return err
	}
	optionID := ""
	for _, option := range field.Options {
		if option.Name == string(status) {
			optionID = option.ID
			break
		}
	}
	if optionID == "" {
		return fmt.Errorf("status option not found: %s", status)
	}

	_, err = adapter.runGH(ctx, "edit project item status",
		"project", "item-edit",
		"--id", item.ID,
		"--project-id", adapter.config.ProjectID,
		"--field-id", field.ID,
		"--single-select-option-id", optionID,
	)
	return err
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

func (adapter *ShellAdapter) validateProjectConfig() error {
	if strings.TrimSpace(adapter.config.Repo) == "" ||
		strings.TrimSpace(adapter.config.ProjectOwner) == "" ||
		adapter.config.ProjectNumber <= 0 ||
		strings.TrimSpace(adapter.config.ProjectID) == "" ||
		strings.TrimSpace(adapter.config.ProjectTitle) == "" {
		return ErrProjectNotImplemented
	}
	return nil
}

func (adapter *ShellAdapter) getStatusField(ctx context.Context) (projectField, error) {
	result, err := adapter.runGH(ctx, "list project fields",
		"project", "field-list", strconv.Itoa(adapter.config.ProjectNumber),
		"--owner", adapter.config.ProjectOwner,
		"--limit", "100",
		"--format", "json",
	)
	if err != nil {
		return projectField{}, err
	}
	fields, err := parseProjectFieldsJSON([]byte(result.stdout))
	if err != nil {
		return projectField{}, err
	}
	for _, field := range fields.Fields {
		if field.Name == "Status" {
			return field, nil
		}
	}
	return projectField{}, fmt.Errorf("project field not found: Status")
}

type projectItemsJSON struct {
	Items []projectItemJSON `json:"items"`
}

type projectItemJSON struct {
	ID      string `json:"id"`
	Status  string `json:"status"`
	Content struct {
		Number int    `json:"number"`
		URL    string `json:"url"`
	} `json:"content"`
}

type projectFieldsJSON struct {
	Fields []projectField `json:"fields"`
}

type projectField struct {
	ID      string          `json:"id"`
	Name    string          `json:"name"`
	Options []projectOption `json:"options"`
}

type projectOption struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func parseProjectItemsJSON(data []byte) (projectItemsJSON, error) {
	var items projectItemsJSON
	if err := json.Unmarshal(data, &items); err != nil {
		return projectItemsJSON{}, fmt.Errorf("parse project items JSON: %w", err)
	}
	return items, nil
}

func parseProjectFieldsJSON(data []byte) (projectFieldsJSON, error) {
	var fields projectFieldsJSON
	if err := json.Unmarshal(data, &fields); err != nil {
		return projectFieldsJSON{}, fmt.Errorf("parse project fields JSON: %w", err)
	}
	return fields, nil
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
