package cli

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/commands"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/config"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/git"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/github"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/version"
)

type options struct {
	configPath             string
	jsonOutput             bool
	dryRun                 bool
	forceDeleteLocalBranch bool
}

func Run(args []string, stdout io.Writer, stderr io.Writer) int {
	opts, rest, err := parseGlobalOptions(args)
	if err != nil {
		fmt.Fprintln(stderr, "Error:", err)
		return 2
	}

	if len(rest) == 0 {
		printHelp(stdout)
		return 0
	}

	switch rest[0] {
	case "--help", "-h", "help":
		printHelp(stdout)
		return 0

	case "--version", "version":
		fmt.Fprintln(stdout, version.Version)
		return 0

	case "config":
		return runConfig(rest[1:], opts, stdout, stderr)

	case "doctor":
		return runDoctor(opts, stdout, stderr)

	case "labels":
		return runLabels(rest[1:], opts, stdout, stderr)

	case "task":
		return runTask(rest[1:], opts, stdout, stderr)

	default:
		fmt.Fprintf(stderr, "Error: unknown command %q\n\n", rest[0])
		printHelp(stderr)
		return 2
	}
}

func runLabels(args []string, opts options, stdout io.Writer, stderr io.Writer) int {
	if len(args) != 1 || args[0] != "bootstrap" {
		fmt.Fprintln(stderr, "Error: labels command requires bootstrap")
		fmt.Fprintln(stderr, "Usage: parsevkctl labels bootstrap [--dry-run] [--json]")
		return 2
	}
	cfg, ok := loadCommandConfig(opts, stderr)
	if !ok {
		return 1
	}
	return commands.RunLabelsBootstrap(context.Background(), commands.LabelsBootstrapRunInput{
		GitHub: github.NewShellAdapterWithConfig(cfg),
		DryRun: opts.dryRun,
		JSON:   opts.jsonOutput,
		Stdout: stdout,
		Stderr: stderr,
	})
}

func runDoctor(opts options, stdout io.Writer, stderr io.Writer) int {
	validation := config.ValidateFile(opts.configPath)
	cfg := config.Config{}
	if validation.Valid {
		loaded, err := config.Load(validation.Path)
		if err != nil {
			validation.Valid = false
			validation.Errors = []string{err.Error()}
		} else {
			cfg = loaded
		}
	}

	return commands.RunDoctorCommand(context.Background(), commands.DoctorRunInput{
		DoctorInput: commands.DoctorInput{
			ConfigValidation: validation,
			Config:           cfg,
			Git:              git.NewShellAdapter(),
			GitHub:           github.NewShellAdapterWithConfig(cfg),
		},
		JSON:   opts.jsonOutput,
		Stdout: stdout,
		Stderr: stderr,
	})
}

func runTask(args []string, opts options, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 {
		fmt.Fprintln(stderr, "Error: task command requires a subcommand")
		fmt.Fprintln(stderr, "Usage: parsevkctl task status <issue> [--json]")
		fmt.Fprintln(stderr, "       parsevkctl task sync <issue> [--json]")
		fmt.Fprintln(stderr, "       parsevkctl task review <issue> [--json]")
		fmt.Fprintln(stderr, "       parsevkctl task create \"Title\" [--body \"...\"] [--dry-run] [--json]")
		fmt.Fprintln(stderr, "       parsevkctl task start|pr|merge <issue> [--dry-run] [--json]")
		return 2
	}

	switch args[0] {
	case "create":
		title, body, ok := parseTaskCreateArgs(args[1:], stderr)
		if !ok {
			return 2
		}
		cfg, ok := loadCommandConfig(opts, stderr)
		if !ok {
			return 1
		}
		return commands.RunTaskCreate(context.Background(), commands.TaskCreateRunInput{
			TaskCreateInput: commands.TaskCreateInput{
				Title:  title,
				Body:   body,
				Config: cfg,
				GitHub: github.NewShellAdapterWithConfig(cfg),
			},
			DryRun: opts.dryRun,
			JSON:   opts.jsonOutput,
			Stdout: stdout,
			Stderr: stderr,
		})
	case "status":
		if len(args) != 2 {
			fmt.Fprintln(stderr, "Error: task status requires an issue number")
			return 2
		}
		issueNumber, err := strconv.Atoi(args[1])
		if err != nil || issueNumber <= 0 {
			fmt.Fprintln(stderr, "Error: issue number must be a positive integer")
			return 2
		}
		cfg, ok := loadCommandConfig(opts, stderr)
		if !ok {
			return 1
		}
		return commands.RunTaskStatus(context.Background(), commands.TaskStatusInput{
			IssueNumber: issueNumber,
			Config:      cfg,
			Git:         git.NewShellAdapter(),
			GitHub:      github.NewShellAdapterWithConfig(cfg),
			JSON:        opts.jsonOutput,
			Stdout:      stdout,
			Stderr:      stderr,
		})
	case "review":
		if len(args) != 2 {
			fmt.Fprintln(stderr, "Error: task review requires an issue number")
			return 2
		}
		issueNumber, err := strconv.Atoi(args[1])
		if err != nil || issueNumber <= 0 {
			fmt.Fprintln(stderr, "Error: issue number must be a positive integer")
			return 2
		}
		cfg, ok := loadCommandConfig(opts, stderr)
		if !ok {
			return 1
		}
		return commands.RunTaskReview(context.Background(), commands.TaskReviewRunInput{
			TaskIssueInput: commands.TaskIssueInput{
				IssueNumber: issueNumber,
				Config:      cfg,
				Git:         git.NewShellAdapter(),
				GitHub:      github.NewShellAdapterWithConfig(cfg),
			},
			JSON:   opts.jsonOutput,
			Stdout: stdout,
			Stderr: stderr,
		})
	case "start", "pr", "merge":
		if len(args) != 2 {
			fmt.Fprintf(stderr, "Error: task %s requires an issue number\n", args[0])
			return 2
		}
		issueNumber, err := strconv.Atoi(args[1])
		if err != nil || issueNumber <= 0 {
			fmt.Fprintln(stderr, "Error: issue number must be a positive integer")
			return 2
		}
		cfg, ok := loadCommandConfig(opts, stderr)
		if !ok {
			return 1
		}
		input := commands.TaskRunInput{
			TaskIssueInput: commands.TaskIssueInput{
				IssueNumber:            issueNumber,
				Config:                 cfg,
				Git:                    git.NewShellAdapter(),
				GitHub:                 github.NewShellAdapterWithConfig(cfg),
				DryRun:                 opts.dryRun,
				ForceDeleteLocalBranch: opts.forceDeleteLocalBranch,
			},
			DryRun: opts.dryRun,
			JSON:   opts.jsonOutput,
			Stdout: stdout,
			Stderr: stderr,
		}
		switch args[0] {
		case "start":
			return commands.RunTaskStart(context.Background(), input)
		case "pr":
			return commands.RunTaskPR(context.Background(), input)
		case "merge":
			return commands.RunTaskMerge(context.Background(), input)
		}
		return 2
	case "sync":
		if len(args) < 2 || len(args) > 3 {
			fmt.Fprintln(stderr, "Error: task sync requires an issue number")
			return 2
		}
		issueNumber, err := strconv.Atoi(args[1])
		if err != nil || issueNumber <= 0 {
			fmt.Fprintln(stderr, "Error: issue number must be a positive integer")
			return 2
		}
		apply := false
		if len(args) == 3 {
			if args[2] != "--apply" {
				fmt.Fprintf(stderr, "Error: unknown task sync flag %q\n", args[2])
				return 2
			}
			apply = true
		}
		if apply {
			return commands.RunTaskSync(context.Background(), commands.SyncRunInput{
				Apply:  true,
				Stdout: stdout,
				Stderr: stderr,
			})
		}
		cfg, ok := loadCommandConfig(opts, stderr)
		if !ok {
			return 1
		}
		return commands.RunTaskSync(context.Background(), commands.SyncRunInput{
			SyncInput: commands.SyncInput{
				IssueNumber: issueNumber,
				Config:      cfg,
				Git:         git.NewShellAdapter(),
				GitHub:      github.NewShellAdapterWithConfig(cfg),
			},
			Apply:  apply,
			JSON:   opts.jsonOutput,
			Stdout: stdout,
			Stderr: stderr,
		})
	default:
		fmt.Fprintf(stderr, "Error: unknown task subcommand %q\n", args[0])
		return 2
	}
}

func loadCommandConfig(opts options, stderr io.Writer) (config.Config, bool) {
	validation := config.ValidateFile(opts.configPath)
	if !validation.Valid {
		fmt.Fprintln(stderr, "Error: config is invalid")
		for _, err := range validation.Errors {
			fmt.Fprintln(stderr, "-", err)
		}
		return config.Config{}, false
	}

	cfg, err := config.Load(validation.Path)
	if err != nil {
		fmt.Fprintln(stderr, "Error: failed to load config:", err)
		return config.Config{}, false
	}
	return cfg, true
}

func parseGlobalOptions(args []string) (options, []string, error) {
	opts := options{}
	rest := make([]string, 0, len(args))

	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "--json":
			opts.jsonOutput = true
		case "--dry-run":
			opts.dryRun = true
		case "--force-delete-local-branch":
			opts.forceDeleteLocalBranch = true

		case "--config":
			if i+1 >= len(args) {
				return opts, nil, fmt.Errorf("--config requires a path")
			}
			opts.configPath = args[i+1]
			i++

		default:
			rest = append(rest, args[i])
		}
	}

	return opts, rest, nil
}

func parseTaskCreateArgs(args []string, stderr io.Writer) (string, string, bool) {
	if len(args) == 0 {
		fmt.Fprintln(stderr, "Error: task create requires a title")
		return "", "", false
	}

	title := ""
	body := ""
	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "--body":
			if i+1 >= len(args) {
				fmt.Fprintln(stderr, "Error: --body requires a value")
				return "", "", false
			}
			body = args[i+1]
			i++
		default:
			if strings.HasPrefix(args[i], "--") {
				fmt.Fprintf(stderr, "Error: unknown task create flag %q\n", args[i])
				return "", "", false
			}
			if title != "" {
				fmt.Fprintln(stderr, "Error: task create accepts one title")
				return "", "", false
			}
			title = args[i]
		}
	}
	if strings.TrimSpace(title) == "" {
		fmt.Fprintln(stderr, "Error: task create requires a title")
		return "", "", false
	}
	return title, body, true
}

func runConfig(args []string, opts options, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 {
		fmt.Fprintln(stderr, "Error: config command requires a subcommand")
		fmt.Fprintln(stderr, "Usage: parsevkctl config validate [--config <path>] [--json]")
		return 2
	}

	switch args[0] {
	case "validate":
		result := config.ValidateFile(opts.configPath)

		if opts.jsonOutput {
			encoded, err := json.MarshalIndent(result, "", "  ")
			if err != nil {
				fmt.Fprintln(stderr, "Error: failed to render JSON:", err)
				return 1
			}
			fmt.Fprintln(stdout, string(encoded))
		} else {
			printConfigValidation(stdout, result)
		}

		if !result.Valid {
			return 1
		}

		return 0

	default:
		fmt.Fprintf(stderr, "Error: unknown config subcommand %q\n", args[0])
		return 2
	}
}

func printConfigValidation(w io.Writer, result config.ValidationResult) {
	fmt.Fprintln(w, "parsevkctl config validate")
	fmt.Fprintln(w, "Path:", result.Path)

	if result.Valid {
		fmt.Fprintln(w, "Result: VALID")
		return
	}

	fmt.Fprintln(w, "Result: INVALID")
	for _, err := range result.Errors {
		fmt.Fprintln(w, "-", err)
	}
}

func printHelp(w io.Writer) {
	fmt.Fprintln(w, `parsevkctl

Usage:
  parsevkctl --help
  parsevkctl --version
  parsevkctl config validate [--config <path>] [--json]
  parsevkctl doctor [--config <path>] [--json]
  parsevkctl labels bootstrap [--config <path>] [--dry-run] [--json]
  parsevkctl task status <issue> [--config <path>] [--json]
  parsevkctl task sync <issue> [--config <path>] [--json]
  parsevkctl task review <issue> [--config <path>] [--json] (deprecated)
  parsevkctl task create "Title" [--body "..."] [--config <path>] [--dry-run] [--json]
  parsevkctl task start <issue> [--config <path>] [--dry-run] [--json]
  parsevkctl task pr <issue> [--config <path>] [--dry-run] [--json]
  parsevkctl task merge <issue> [--config <path>] [--dry-run] [--force-delete-local-branch] [--json]

Commands:
  config validate   Validate parsevkctl config without GitHub or git side effects
  doctor            Check local config, git and GitHub read access
  labels bootstrap  Create missing standard GitHub labels for parseVK workflow
  task status       Show read-only task state summary
  task sync         Preview task state drift and suggested fixes
  task review       (Deprecated) Use $parsevk-pr-review instead
  task create       Create a GitHub issue and optionally add it to the Project
  task start        Move an issue to In Progress and create a task branch
  task pr           Push the task branch and create a pull request
  task merge        Merge the linked pull request (mechanical merge checks only, use $parsevk-merge-gate first)

Global flags:
  --config <path>   Path to config.json
  --dry-run         Render the operation plan without executing write operations
  --force-delete-local-branch
                   Allow task merge to force-delete the local task branch
  --json            Render machine-readable JSON output`)
}
