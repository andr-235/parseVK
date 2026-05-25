package github

import (
	"errors"
	"fmt"
	"strings"
)

var ErrProjectNotImplemented = errors.New("github project operations are not implemented")
var ErrLabelAlreadyExists = errors.New("github label already exists")

type CommandError struct {
	Operation string
	Args      []string
	ExitCode  int
	Stdout    string
	Stderr    string
	Err       error
}

func (err CommandError) Error() string {
	parts := []string{fmt.Sprintf("gh %s failed", err.Operation)}
	if len(err.Args) > 0 {
		parts = append(parts, "args: "+strings.Join(err.Args, " "))
	}
	if err.ExitCode >= 0 {
		parts = append(parts, fmt.Sprintf("exit code %d", err.ExitCode))
	}
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

type exitCoder interface {
	ExitCode() int
}

func exitCodeOf(err error) int {
	if err == nil {
		return -1
	}

	var exitErr exitCoder
	if errors.As(err, &exitErr) {
		return exitErr.ExitCode()
	}

	return -1
}
