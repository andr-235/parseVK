package git

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strconv"
	"strings"
)

var protectedBranches = map[string]struct{}{
	"main":                          {},
	"master":                        {},
	"fastapi-microservices-rewrite": {},
}

type commandResult struct {
	stdout string
	stderr string
}

type commandRunner func(ctx context.Context, name string, args ...string) (commandResult, error)

type ShellAdapter struct {
	gitPath string
	runner  commandRunner
}

func NewShellAdapter() *ShellAdapter {
	return newShellAdapterWithRunner(runCommand)
}

func newShellAdapterWithRunner(runner commandRunner) *ShellAdapter {
	return &ShellAdapter{
		gitPath: "git",
		runner:  runner,
	}
}

func (adapter *ShellAdapter) CurrentBranch(ctx context.Context) (string, error) {
	result, err := adapter.runGit(ctx, "current branch", "branch", "--show-current")
	if err != nil {
		return "", err
	}

	return result.stdout, nil
}

func (adapter *ShellAdapter) IsWorkTreeClean(ctx context.Context) (bool, []string, error) {
	result, err := adapter.runGit(ctx, "status", "status", "--short")
	if err != nil {
		return false, nil, err
	}

	clean, files := parseStatusOutput(result.stdout)
	return clean, files, nil
}

func (adapter *ShellAdapter) Fetch(ctx context.Context, remote string, branch string) error {
	if err := validateRemoteAndBranch(remote, branch); err != nil {
		return err
	}

	_, err := adapter.runGit(ctx, "fetch", "fetch", remote, branch)
	return err
}

func (adapter *ShellAdapter) Switch(ctx context.Context, branch string) error {
	if err := validateBranch(branch); err != nil {
		return err
	}

	_, err := adapter.runGit(ctx, "switch", "switch", branch)
	return err
}

func (adapter *ShellAdapter) PullFFOnly(ctx context.Context, remote string, branch string) error {
	if err := validateRemoteAndBranch(remote, branch); err != nil {
		return err
	}

	_, err := adapter.runGit(ctx, "pull --ff-only", "pull", "--ff-only", remote, branch)
	return err
}

func (adapter *ShellAdapter) CreateBranch(ctx context.Context, branch string) error {
	if err := validateBranch(branch); err != nil {
		return err
	}

	_, err := adapter.runGit(ctx, "create branch", "switch", "-c", branch)
	return err
}

func (adapter *ShellAdapter) DeleteLocalBranch(ctx context.Context, branch string, force bool) error {
	if err := validateBranch(branch); err != nil {
		return err
	}
	if isProtectedBranch(branch) {
		return fmt.Errorf("refusing to delete protected branch %q", strings.TrimSpace(branch))
	}

	deleteFlag := "-d"
	if force {
		deleteFlag = "-D"
	}

	_, err := adapter.runGit(ctx, "delete local branch", "branch", deleteFlag, branch)
	return err
}

func (adapter *ShellAdapter) DeleteRemoteBranch(ctx context.Context, remote string, branch string) error {
	if err := validateRemoteAndBranch(remote, branch); err != nil {
		return err
	}
	if isProtectedBranch(branch) {
		return fmt.Errorf("refusing to delete protected branch %q", strings.TrimSpace(branch))
	}

	_, err := adapter.runGit(ctx, "delete remote branch", "push", remote, "--delete", branch)
	return err
}

func (adapter *ShellAdapter) PushBranch(ctx context.Context, remote string, branch string, setUpstream bool) error {
	if err := validateRemoteAndBranch(remote, branch); err != nil {
		return err
	}

	args := []string{"push"}
	if setUpstream {
		args = append(args, "-u")
	}
	args = append(args, remote, branch)

	_, err := adapter.runGit(ctx, "push branch", args...)
	return err
}

func (adapter *ShellAdapter) HasCommitsAhead(ctx context.Context, base string, head string) (bool, error) {
	if strings.TrimSpace(base) == "" {
		return false, fmt.Errorf("base ref must not be empty")
	}
	if strings.TrimSpace(head) == "" {
		return false, fmt.Errorf("head ref must not be empty")
	}

	result, err := adapter.runGit(ctx, "rev-list count", "rev-list", "--count", base+".."+head)
	if err != nil {
		return false, err
	}

	return parseAheadCount(result.stdout)
}

func (adapter *ShellAdapter) runGit(ctx context.Context, operation string, args ...string) (commandResult, error) {
	result, err := adapter.runner(ctx, adapter.gitPath, args...)
	if err != nil {
		return result, CommandError{
			Operation: operation,
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

func parseStatusOutput(output string) (bool, []string) {
	if strings.TrimSpace(output) == "" {
		return true, nil
	}

	trimmed := strings.TrimRight(output, "\r\n")
	lines := strings.Split(trimmed, "\n")
	for i := range lines {
		lines[i] = strings.TrimRight(lines[i], "\r")
	}

	return false, lines
}

func parseAheadCount(output string) (bool, error) {
	count, err := strconv.Atoi(strings.TrimSpace(output))
	if err != nil {
		return false, fmt.Errorf("invalid git rev-list count %q: %w", output, err)
	}

	return count > 0, nil
}

func validateRemoteAndBranch(remote string, branch string) error {
	if strings.TrimSpace(remote) == "" {
		return fmt.Errorf("remote must not be empty")
	}

	return validateBranch(branch)
}

func validateBranch(branch string) error {
	if strings.TrimSpace(branch) == "" {
		return fmt.Errorf("branch name must not be empty")
	}

	return nil
}

func isProtectedBranch(branch string) bool {
	_, ok := protectedBranches[strings.TrimSpace(branch)]
	return ok
}
