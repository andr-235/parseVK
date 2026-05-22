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
	Number      int    `json:"number"`
	Title       string `json:"title"`
	State       string `json:"state"`
	HeadRefName string `json:"headRefName"`
}

type pullRequestJSON struct {
	Number   int     `json:"number"`
	Title    string  `json:"title"`
	State    string  `json:"state"`
	IsDraft  bool    `json:"isDraft"`
	MergedAt *string `json:"mergedAt"`
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

func issueFromJSON(raw issueJSON) domain.Issue {
	return domain.Issue{
		ID:     domain.TaskID(raw.Number),
		Title:  raw.Title,
		State:  normalizeIssueState(raw.State),
		Branch: domain.BranchName(raw.HeadRefName),
	}
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
