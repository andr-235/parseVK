package git

import (
	"context"
	"errors"
	"reflect"
	"strings"
	"testing"
)

func TestParseStatusOutput(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		input string
		clean bool
		files []string
	}{
		{
			name:  "clean status",
			input: "\n",
			clean: true,
			files: nil,
		},
		{
			name:  "dirty status",
			input: " M README.md\n?? internal/git/git.go\n",
			clean: false,
			files: []string{" M README.md", "?? internal/git/git.go"},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			clean, files := parseStatusOutput(tt.input)

			if clean != tt.clean {
				t.Fatalf("clean = %v, want %v", clean, tt.clean)
			}
			if !reflect.DeepEqual(files, tt.files) {
				t.Fatalf("files = %#v, want %#v", files, tt.files)
			}
		})
	}
}

func TestDeleteLocalBranchRejectsProtectedBranches(t *testing.T) {
	t.Parallel()

	protected := []string{"main", "master", "fastapi-microservices-rewrite"}
	for _, branch := range protected {
		branch := branch
		t.Run(branch, func(t *testing.T) {
			t.Parallel()

			adapter := newShellAdapterWithRunner(func(context.Context, string, ...string) (commandResult, error) {
				t.Fatalf("runner must not be called for protected branch %q", branch)
				return commandResult{}, nil
			})

			err := adapter.DeleteLocalBranch(context.Background(), branch, false)
			if err == nil {
				t.Fatalf("expected protected branch error")
			}
			if !strings.Contains(err.Error(), "protected") {
				t.Fatalf("error = %q, want protected branch message", err)
			}
		})
	}
}

func TestDeleteLocalBranchClassifiesMissingBranch(t *testing.T) {
	t.Parallel()

	var got [][]string
	adapter := newShellAdapterWithRunner(func(_ context.Context, _ string, args ...string) (commandResult, error) {
		got = append(got, append([]string(nil), args...))
		if len(args) >= 2 && args[0] == "branch" {
			return commandResult{stderr: "error: branch 'feature' not found."}, errors.New("exit status 1")
		}
		return commandResult{}, fakeExitError{code: 1}
	})

	err := adapter.DeleteLocalBranch(context.Background(), "feature", false)
	if !errors.Is(err, ErrLocalBranchNotFound) {
		t.Fatalf("error = %v, want ErrLocalBranchNotFound", err)
	}

	want := [][]string{
		{"branch", "-d", "feature"},
		{"show-ref", "--verify", "--quiet", "refs/heads/feature"},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("args = %#v, want %#v", got, want)
	}
}

func TestDeleteLocalBranchClassifiesLocalizedMissingBranch(t *testing.T) {
	t.Parallel()

	adapter := newShellAdapterWithRunner(func(_ context.Context, _ string, args ...string) (commandResult, error) {
		if len(args) >= 2 && args[0] == "branch" {
			return commandResult{stderr: "ошибка: ветка не найдена"}, errors.New("exit status 1")
		}
		return commandResult{}, fakeExitError{code: 1}
	})

	err := adapter.DeleteLocalBranch(context.Background(), "feature", false)
	if !errors.Is(err, ErrLocalBranchNotFound) {
		t.Fatalf("error = %v, want ErrLocalBranchNotFound", err)
	}
}

func TestDeleteLocalBranchKeepsFailuresStrictWhenBranchStillExists(t *testing.T) {
	t.Parallel()

	adapter := newShellAdapterWithRunner(func(_ context.Context, _ string, args ...string) (commandResult, error) {
		if len(args) >= 2 && args[0] == "branch" {
			return commandResult{stderr: "permission denied"}, errors.New("exit status 1")
		}
		return commandResult{}, nil
	})

	err := adapter.DeleteLocalBranch(context.Background(), "feature", false)
	if err == nil {
		t.Fatalf("expected delete failure")
	}
	if errors.Is(err, ErrLocalBranchNotFound) {
		t.Fatalf("error = %v, must not be ErrLocalBranchNotFound", err)
	}
}

func TestEmptyBranchValidation(t *testing.T) {
	t.Parallel()

	adapter := newShellAdapterWithRunner(func(context.Context, string, ...string) (commandResult, error) {
		t.Fatal("runner must not be called when validation fails")
		return commandResult{}, nil
	})

	tests := []struct {
		name string
		run  func() error
	}{
		{name: "switch", run: func() error { return adapter.Switch(context.Background(), " ") }},
		{name: "create branch", run: func() error { return adapter.CreateBranch(context.Background(), "") }},
		{name: "delete branch", run: func() error { return adapter.DeleteLocalBranch(context.Background(), "", false) }},
		{name: "push branch", run: func() error { return adapter.PushBranch(context.Background(), "origin", "\t", false) }},
		{name: "fetch remote", run: func() error { return adapter.Fetch(context.Background(), "", "feature") }},
		{name: "fetch branch", run: func() error { return adapter.Fetch(context.Background(), "origin", "") }},
		{name: "pull remote", run: func() error { return adapter.PullFFOnly(context.Background(), " ", "feature") }},
		{name: "pull branch", run: func() error { return adapter.PullFFOnly(context.Background(), "origin", " ") }},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			err := tt.run()
			if err == nil {
				t.Fatalf("expected validation error")
			}
		})
	}
}

func TestParseAheadCount(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		input string
		ahead bool
	}{
		{name: "zero", input: "0\n", ahead: false},
		{name: "positive", input: "12", ahead: true},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			ahead, err := parseAheadCount(tt.input)
			if err != nil {
				t.Fatalf("parseAheadCount returned error: %v", err)
			}
			if ahead != tt.ahead {
				t.Fatalf("ahead = %v, want %v", ahead, tt.ahead)
			}
		})
	}
}

func TestParseAheadCountRejectsInvalidOutput(t *testing.T) {
	t.Parallel()

	_, err := parseAheadCount("not-a-number")
	if err == nil {
		t.Fatalf("expected parse error")
	}
}

func TestCommandArguments(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		run  func(*ShellAdapter) error
		args []string
	}{
		{
			name: "fetch",
			run:  func(adapter *ShellAdapter) error { return adapter.Fetch(context.Background(), "origin", "main") },
			args: []string{"fetch", "origin", "main"},
		},
		{
			name: "switch",
			run:  func(adapter *ShellAdapter) error { return adapter.Switch(context.Background(), "feature") },
			args: []string{"switch", "feature"},
		},
		{
			name: "pull ff only",
			run:  func(adapter *ShellAdapter) error { return adapter.PullFFOnly(context.Background(), "origin", "main") },
			args: []string{"pull", "--ff-only", "origin", "main"},
		},
		{
			name: "create branch",
			run:  func(adapter *ShellAdapter) error { return adapter.CreateBranch(context.Background(), "feature") },
			args: []string{"switch", "-c", "feature"},
		},
		{
			name: "delete branch",
			run: func(adapter *ShellAdapter) error {
				return adapter.DeleteLocalBranch(context.Background(), "feature", false)
			},
			args: []string{"branch", "-d", "feature"},
		},
		{
			name: "force delete branch",
			run: func(adapter *ShellAdapter) error {
				return adapter.DeleteLocalBranch(context.Background(), "feature", true)
			},
			args: []string{"branch", "-D", "feature"},
		},
		{
			name: "push branch",
			run: func(adapter *ShellAdapter) error {
				return adapter.PushBranch(context.Background(), "origin", "feature", false)
			},
			args: []string{"push", "origin", "feature"},
		},
		{
			name: "push branch with upstream",
			run: func(adapter *ShellAdapter) error {
				return adapter.PushBranch(context.Background(), "origin", "feature", true)
			},
			args: []string{"push", "-u", "origin", "feature"},
		},
		{
			name: "has commits ahead",
			run: func(adapter *ShellAdapter) error {
				_, err := adapter.HasCommitsAhead(context.Background(), "origin/main", "HEAD")
				return err
			},
			args: []string{"rev-list", "--count", "origin/main..HEAD"},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			var got []string
			adapter := newShellAdapterWithRunner(func(_ context.Context, _ string, args ...string) (commandResult, error) {
				got = append([]string(nil), args...)
				return commandResult{stdout: "1"}, nil
			})

			err := tt.run(adapter)
			if err != nil {
				t.Fatalf("run returned error: %v", err)
			}
			if !reflect.DeepEqual(got, tt.args) {
				t.Fatalf("args = %#v, want %#v", got, tt.args)
			}
		})
	}
}

func TestCommandErrorsIncludeOperationAndOutput(t *testing.T) {
	t.Parallel()

	adapter := newShellAdapterWithRunner(func(context.Context, string, ...string) (commandResult, error) {
		return commandResult{stdout: "stdout text", stderr: "stderr text"}, errors.New("exit status 1")
	})

	err := adapter.Fetch(context.Background(), "origin", "main")
	if err == nil {
		t.Fatalf("expected command error")
	}

	message := err.Error()
	for _, want := range []string{"fetch", "stdout text", "stderr text"} {
		if !strings.Contains(message, want) {
			t.Fatalf("error = %q, want it to contain %q", message, want)
		}
	}
}

type fakeExitError struct {
	code int
}

func (err fakeExitError) Error() string {
	return "exit status"
}

func (err fakeExitError) ExitCode() int {
	return err.code
}
