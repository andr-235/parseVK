package cli

import (
	"encoding/json"
	"fmt"
	"io"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/config"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/version"
)

type options struct {
	configPath string
	jsonOutput bool
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

	default:
		fmt.Fprintf(stderr, "Error: unknown command %q\n\n", rest[0])
		printHelp(stderr)
		return 2
	}
}

func parseGlobalOptions(args []string) (options, []string, error) {
	opts := options{}
	rest := make([]string, 0, len(args))

	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "--json":
			opts.jsonOutput = true

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

Commands:
  config validate   Validate parsevkctl config without GitHub or git side effects

Global flags:
  --config <path>   Path to config.json
  --json            Render machine-readable JSON output`)
}
