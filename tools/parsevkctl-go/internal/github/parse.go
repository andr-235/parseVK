package github

import (
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
)

type issueJSON struct {
	Number int    `json:"number"`
	Title  string `json:"title"`
	State  string `json:"state"`
	URL    string `json:"url"`
	Labels []struct {
		Name string `json:"name"`
	} `json:"labels"`
}

type pullRequestJSON struct {
	Number    int     `json:"number"`
	Title     string  `json:"title"`
	State     string  `json:"state"`
	IsDraft   bool    `json:"isDraft"`
	MergedAt  *string `json:"mergedAt"`
	URL       string  `json:"url"`
	Base      string  `json:"baseRefName"`
	Head      string  `json:"headRefName"`
	Body      string  `json:"body"`
	Mergeable string  `json:"mergeable"`
	Files     []struct {
		Path string `json:"path"`
	} `json:"files"`
}

type pullRequestCheckJSON struct {
	Name     string `json:"name"`
	State    string `json:"state"`
	Bucket   string `json:"bucket"`
	Workflow string `json:"workflow"`
}

func parseIssueJSON(data []byte) (domain.Issue, error) {
	var raw issueJSON
	if err := json.Unmarshal(data, &raw); err != nil {
		return domain.Issue{}, fmt.Errorf("parse issue JSON: %w", err)
	}

	return issueFromJSON(raw), nil
}

func parsePullRequestJSON(data []byte) (domain.PullRequest, error) {
	var raw pullRequestJSON
	if err := json.Unmarshal(data, &raw); err != nil {
		return domain.PullRequest{}, fmt.Errorf("parse pull request JSON: %w", err)
	}

	return pullRequestFromJSON(raw), nil
}

func parsePullRequestDetailsJSON(data []byte) (PullRequestDetails, error) {
	var raw pullRequestJSON
	if err := json.Unmarshal(data, &raw); err != nil {
		return PullRequestDetails{}, fmt.Errorf("parse pull request details JSON: %w", err)
	}

	files := make([]string, 0, len(raw.Files))
	for _, file := range raw.Files {
		if strings.TrimSpace(file.Path) != "" {
			files = append(files, file.Path)
		}
	}
	return PullRequestDetails{
		PullRequest: pullRequestFromJSON(raw),
		Body:        raw.Body,
		Mergeable:   normalizeMergeableState(raw.Mergeable),
		Files:       files,
	}, nil
}

func parsePullRequestsJSON(data []byte) ([]domain.PullRequest, error) {
	var raw []pullRequestJSON
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("parse pull request list JSON: %w", err)
	}

	prs := make([]domain.PullRequest, 0, len(raw))
	for _, item := range raw {
		prs = append(prs, pullRequestFromJSON(item))
	}

	return prs, nil
}

func parsePullRequestChecksJSON(prNumber int, data []byte) (domain.PullRequestChecks, error) {
	var raw []pullRequestCheckJSON
	if err := json.Unmarshal(data, &raw); err != nil {
		return domain.PullRequestChecks{}, fmt.Errorf("parse pull request checks JSON: %w", err)
	}

	checks := make([]domain.PullRequestCheck, 0, len(raw))
	for _, item := range raw {
		checks = append(checks, pullRequestCheckFromParts(item.Workflow, item.Name, item.State, item.Bucket))
	}
	return summarizePullRequestChecks(prNumber, checks), nil
}

func parsePullRequestChecksText(prNumber int, output string) (domain.PullRequestChecks, error) {
	lines := strings.Split(output, "\n")
	checks := make([]domain.PullRequestCheck, 0, len(lines))
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		if strings.Contains(line, "\t") {
			columns := strings.Split(line, "\t")
			name := strings.TrimSpace(columns[0])
			state := ""
			if len(columns) > 1 {
				state = strings.TrimSpace(columns[1])
			}
			checks = append(checks, pullRequestCheckFromParts("", name, state, ""))
			continue
		}

		fields := strings.Fields(trimmed)
		if len(fields) < 2 {
			checks = append(checks, pullRequestCheckFromParts("", trimmed, "", ""))
			continue
		}

		stateIndex := len(fields) - 1
		name := strings.Join(fields[:stateIndex], " ")
		if strings.TrimSpace(name) == "" {
			name = trimmed
		}
		checks = append(checks, pullRequestCheckFromParts("", name, fields[stateIndex], ""))
	}

	return summarizePullRequestChecks(prNumber, checks), nil
}

func issueFromJSON(raw issueJSON) domain.Issue {
	return domain.Issue{
		ID:     domain.TaskID(raw.Number),
		Title:  raw.Title,
		State:  normalizeIssueState(raw.State),
		URL:    raw.URL,
		Labels: issueLabelsFromJSON(raw.Labels),
	}
}

func issueLabelsFromJSON(rawLabels []struct {
	Name string `json:"name"`
}) []string {
	labels := make([]string, 0, len(rawLabels))
	for _, label := range rawLabels {
		if strings.TrimSpace(label.Name) == "" {
			continue
		}

		labels = append(labels, label.Name)
	}

	return labels
}

func pullRequestCheckFromParts(workflow string, name string, state string, bucketValue string) domain.PullRequestCheck {
	checkName := strings.TrimSpace(name)
	workflowName := strings.TrimSpace(workflow)
	if workflowName != "" && checkName != "" && !strings.EqualFold(workflowName, checkName) {
		checkName = workflowName + " / " + checkName
	}
	if checkName == "" {
		checkName = "(unnamed check)"
	}

	normalized := classifyCheckState(state)
	bucket := classifyCheckState(bucketValue)
	if bucket == domain.CheckStateUnknown {
		bucket = normalized
	}
	if bucket == domain.CheckStateSkipped {
		bucket = domain.CheckStateSuccess
	}

	return domain.PullRequestCheck{
		Name:   checkName,
		State:  normalized,
		Bucket: bucket,
	}
}

func classifyCheckState(state string) domain.CheckState {
	normalized := strings.ToUpper(strings.TrimSpace(state))
	normalized = strings.TrimSuffix(normalized, ":")

	switch normalized {
	case "SUCCESS", "PASSED", "PASS", "COMPLETED":
		return domain.CheckStateSuccess
	case "SKIPPED", "SKIPPING", "NEUTRAL":
		return domain.CheckStateSkipped
	case "PENDING", "QUEUED", "IN_PROGRESS", "WAITING", "REQUESTED":
		return domain.CheckStatePending
	case "FAILURE", "FAILED", "FAIL", "ERROR", "CANCELLED", "CANCEL", "TIMED_OUT", "ACTION_REQUIRED":
		return domain.CheckStateFailure
	default:
		return domain.CheckStateUnknown
	}
}

func summarizePullRequestChecks(prNumber int, checks []domain.PullRequestCheck) domain.PullRequestChecks {
	summary := domain.PullRequestChecks{
		PullRequestNumber: prNumber,
		Total:             len(checks),
		Checks:            checks,
	}
	for _, check := range checks {
		switch check.Bucket {
		case domain.CheckStateSuccess:
			summary.Successful++
		case domain.CheckStatePending:
			summary.Pending++
		case domain.CheckStateFailure:
			summary.Failed++
		}
		if check.State == domain.CheckStateSkipped {
			summary.Skipped++
		}
	}
	return summary
}

func pullRequestFromJSON(raw pullRequestJSON) domain.PullRequest {
	merged := raw.MergedAt != nil || strings.EqualFold(raw.State, "MERGED")
	state := normalizePullRequestState(raw.State, raw.IsDraft, merged)

	return domain.PullRequest{
		Number: domain.TaskID(raw.Number),
		Title:  raw.Title,
		State:  state,
		Draft:  raw.IsDraft,
		Merged: merged,
		URL:    raw.URL,
		Base:   raw.Base,
		Head:   raw.Head,
	}
}

func normalizeIssueState(state string) domain.IssueState {
	switch strings.ToUpper(strings.TrimSpace(state)) {
	case "OPEN":
		return domain.IssueStateOpen
	case "CLOSED":
		return domain.IssueStateClosed
	default:
		return domain.IssueStateUnknown
	}
}

func normalizePullRequestState(state string, draft bool, merged bool) domain.PullRequestState {
	if merged {
		return domain.PullRequestStateMerged
	}
	if draft {
		return domain.PullRequestStateDraft
	}

	switch strings.ToUpper(strings.TrimSpace(state)) {
	case "OPEN":
		return domain.PullRequestStateOpen
	case "CLOSED":
		return domain.PullRequestStateClosed
	case "MERGED":
		return domain.PullRequestStateMerged
	default:
		return domain.PullRequestStateNone
	}
}

func normalizeMergeableState(state string) MergeableState {
	switch strings.ToUpper(strings.TrimSpace(state)) {
	case "MERGEABLE":
		return MergeableStateMergeable
	case "CONFLICTING":
		return MergeableStateConflicting
	default:
		return MergeableStateUnknown
	}
}

func parseNumberFromURL(output string, kind string) (int, error) {
	trimmed := strings.TrimSpace(output)
	parsed, err := url.Parse(trimmed)
	if err != nil {
		return 0, fmt.Errorf("parse %s URL %q: %w", kind, trimmed, err)
	}

	parts := strings.Split(strings.Trim(parsed.Path, "/"), "/")
	for i := 0; i < len(parts)-1; i++ {
		if parts[i] != kind {
			continue
		}

		number, err := strconv.Atoi(parts[i+1])
		if err != nil {
			return 0, fmt.Errorf("parse %s number from URL %q: %w", kind, trimmed, err)
		}
		return number, nil
	}

	return 0, fmt.Errorf("could not find %s number in URL %q", kind, trimmed)
}
