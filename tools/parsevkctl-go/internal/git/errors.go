package git

import (
	"fmt"
	"strings"
)

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
