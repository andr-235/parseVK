package git

import (
	"errors"
	"fmt"
	"strings"
)

var ErrLocalBranchNotFound = errors.New("local branch not found")

type CommandError struct {
	Operation string
	Stdout    string
	Stderr    string
	Err       error
}

func (err CommandError) Error() string {
	parts := []string{fmt.Sprintf("git %s failed", err.Operation)}
	if err.Err != nil {
		parts = append(parts, err.Err.Error())
	}
	if strings.TrimSpace(err.Stderr) != "" {
		parts = append(parts, "stderr: "+err.Stderr)
	}
	if strings.TrimSpace(err.Stdout) != "" {
		parts = append(parts, "stdout: "+err.Stdout)
	}

	return strings.Join(parts, ": ")
}

func (err CommandError) Unwrap() error {
	return err.Err
}

func isLocalBranchNotFound(err error, branch string) bool {
	var commandErr CommandError
	if !errors.As(err, &commandErr) {
		return false
	}

	branch = strings.TrimSpace(branch)
	output := strings.ToLower(commandErr.Stderr + "\n" + commandErr.Stdout)
	return strings.Contains(output, "branch '"+strings.ToLower(branch)+"' not found")
}
