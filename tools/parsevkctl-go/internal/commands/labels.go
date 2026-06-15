package commands

import (
	"context"
	"errors"
	"fmt"
	"io"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/github"
)

type LabelsBootstrapRunInput struct {
	GitHub github.Adapter
	DryRun bool
	JSON   bool
	Stdout io.Writer
	Stderr io.Writer
}

type LabelsBootstrapResult struct {
	DryRun      bool                  `json:"dryRun"`
	Created     []github.Label        `json:"created"`
	Existing    []github.Label        `json:"existing"`
	WouldCreate []github.Label        `json:"wouldCreate,omitempty"`
	Failed      []LabelBootstrapError `json:"failed"`
}

type LabelBootstrapError struct {
	Label string `json:"label"`
	Error string `json:"error"`
}

func RunLabelsBootstrap(ctx context.Context, input LabelsBootstrapRunInput) int {
	result, err := BootstrapLabels(ctx, input.GitHub, input.DryRun)
	if err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	if input.JSON {
		return renderJSON(input.Stdout, result)
	}
	renderLabelsBootstrap(input.Stdout, result)
	if len(result.Failed) > 0 {
		return 1
	}
	return 0
}

func BootstrapLabels(ctx context.Context, gh github.Adapter, dryRun bool) (LabelsBootstrapResult, error) {
	existing, err := gh.ListLabels(ctx)
	if err != nil {
		return LabelsBootstrapResult{}, fmt.Errorf("list labels: %w", err)
	}

	existingByName := map[string]github.Label{}
	for _, label := range existing {
		existingByName[label.Name] = label
	}

	result := LabelsBootstrapResult{DryRun: dryRun}
	for _, label := range github.StandardLabels() {
		if existingLabel, ok := existingByName[label.Name]; ok {
			result.Existing = append(result.Existing, existingLabel)
			continue
		}
		if dryRun {
			result.WouldCreate = append(result.WouldCreate, label)
			continue
		}
		if err := gh.CreateLabel(ctx, label); err != nil {
			if errors.Is(err, github.ErrLabelAlreadyExists) {
				result.Existing = append(result.Existing, label)
				continue
			}
			result.Failed = append(result.Failed, LabelBootstrapError{
				Label: label.Name,
				Error: err.Error(),
			})
			continue
		}
		result.Created = append(result.Created, label)
	}

	return result, nil
}

func renderLabelsBootstrap(w io.Writer, result LabelsBootstrapResult) {
	out := output(w)
	fmt.Fprintln(out, "parsevkctl labels bootstrap")
	if result.DryRun {
		fmt.Fprintln(out, "Mode: dry-run")
	}
	printLabelGroup(out, "Created labels:", labelNames(result.Created))
	printLabelGroup(out, "Would create labels:", labelNames(result.WouldCreate))
	printLabelGroup(out, "Existing labels:", labelNames(result.Existing))
	if len(result.Failed) == 0 {
		fmt.Fprintln(out, "Failed labels: none")
		return
	}
	fmt.Fprintln(out, "Failed labels:")
	for _, failed := range result.Failed {
		fmt.Fprintf(out, "- %s: %s\n", failed.Label, failed.Error)
	}
}

func printLabelGroup(w io.Writer, title string, names []string) {
	if len(names) == 0 {
		return
	}
	fmt.Fprintln(w, title)
	for _, name := range names {
		fmt.Fprintln(w, "-", name)
	}
}

func labelNames(labels []github.Label) []string {
	names := make([]string, len(labels))
	for i, label := range labels {
		names[i] = label.Name
	}
	return names
}
