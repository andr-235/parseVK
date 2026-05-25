package commands

import (
	"context"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/config"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/github"
)

const (
	ReviewVerdictCanMerge       = "Можно мержить"
	ReviewVerdictDoNotMerge     = "Пока не мержить"
	ReviewVerdictNeedsChanges   = "Нужны правки"
	ReviewVerdictNeedsMoreCheck = "Нужно больше проверки"
)

type TaskReviewRunInput struct {
	TaskIssueInput
	JSON   bool
	Stdout io.Writer
	Stderr io.Writer
}

type ReviewResult struct {
	Issue            IssueResult             `json:"issue"`
	PullRequest      ReviewPullRequestResult `json:"pullRequest"`
	ChangedFiles     []string                `json:"changedFiles"`
	Scope            []string                `json:"scope"`
	Checks           []string                `json:"checks"`
	Secrets          []string                `json:"secrets"`
	Blockers         []string                `json:"blockers"`
	NonBlockingNotes []string                `json:"nonBlockingNotes"`
	Verdict          string                  `json:"verdict"`
	Next             string                  `json:"next"`
}

type ReviewPullRequestResult struct {
	Number    int    `json:"number"`
	Title     string `json:"title"`
	Base      string `json:"baseBranch"`
	Head      string `json:"headBranch"`
	Draft     bool   `json:"draft"`
	Mergeable string `json:"mergeable"`
	URL       string `json:"url,omitempty"`
}

func RunTaskReview(ctx context.Context, input TaskReviewRunInput) int {
	result, err := BuildTaskReview(ctx, input.TaskIssueInput)
	if err != nil {
		writeError(input.Stderr, err)
		return 1
	}
	if input.JSON {
		return renderJSON(input.Stdout, result)
	}
	renderTaskReview(input.Stdout, result)
	if len(result.Blockers) > 0 {
		return 1
	}
	return 0
}

func BuildTaskReview(ctx context.Context, input TaskIssueInput) (ReviewResult, error) {
	if input.IssueNumber <= 0 {
		return ReviewResult{}, fmt.Errorf("issue number must be a positive integer")
	}
	issue, err := input.GitHub.GetIssue(ctx, input.IssueNumber)
	if err != nil {
		return ReviewResult{}, fmt.Errorf("get issue #%d: %w", input.IssueNumber, err)
	}
	prs, err := input.GitHub.ListPullRequests(ctx, github.PullRequestFilter{State: "all", Search: strconv.Itoa(input.IssueNumber)})
	if err != nil {
		return ReviewResult{}, fmt.Errorf("list pull requests for issue #%d: %w", input.IssueNumber, err)
	}
	linked, err := exactlyOneLinkedPR(input.IssueNumber, prs)
	if err != nil {
		return ReviewResult{}, err
	}
	details, err := input.GitHub.GetPullRequestDetails(ctx, int(linked.Number))
	if err != nil {
		return ReviewResult{}, fmt.Errorf("get pull request #%d details: %w", linked.Number, err)
	}
	pr := details.PullRequest
	checks, checkErr := input.GitHub.GetPullRequestChecks(ctx, int(pr.Number))
	diff, diffErr := input.GitHub.GetPullRequestDiff(ctx, int(pr.Number))

	result := ReviewResult{
		Issue: IssueResult{Number: int(issue.ID), Title: issue.Title},
		PullRequest: ReviewPullRequestResult{
			Number:    int(pr.Number),
			Title:     pr.Title,
			Base:      pr.Base,
			Head:      pr.Head,
			Draft:     pr.Draft,
			Mergeable: renderMergeable(details.Mergeable),
			URL:       pr.URL,
		},
		ChangedFiles: append([]string(nil), details.Files...),
		Scope:        reviewScope(details.Files),
		Secrets:      []string{"OK: no obvious secrets found"},
		Blockers:     []string{},
		NonBlockingNotes: []string{
			"no official GitHub approve was created",
		},
	}

	result.Blockers = append(result.Blockers, reviewIssueAndPRBlockers(input, issue, pr, details.Body, details.Mergeable)...)
	result.Blockers = append(result.Blockers, reviewChangedFilesBlockers(details.Files)...)
	result.Blockers = append(result.Blockers, reviewScopeBlockers(result.Scope)...)
	result.Checks, result.Blockers, result.NonBlockingNotes = reviewChecks(checks, checkErr, input.Config, result.Blockers, result.NonBlockingNotes)
	if diffErr != nil {
		result.NonBlockingNotes = append(result.NonBlockingNotes, fmt.Sprintf("could not read PR diff: %v", diffErr))
	} else if findings := scanDiffForSecrets(diff); len(findings) > 0 {
		result.Secrets = findings
		result.Blockers = append(result.Blockers, "potential secrets detected in PR diff")
	}
	result.Verdict = reviewVerdict(result.Blockers, result.NonBlockingNotes)
	if result.Verdict == ReviewVerdictCanMerge {
		result.Next = fmt.Sprintf("parsevkctl task merge %d", input.IssueNumber)
	} else {
		result.Next = fmt.Sprintf("fix blockers or inspect notes, then rerun parsevkctl task review %d", input.IssueNumber)
	}
	return result, nil
}

func reviewIssueAndPRBlockers(input TaskIssueInput, issue domain.Issue, pr domain.PullRequest, body string, mergeable github.MergeableState) []string {
	var blockers []string
	if issue.State == domain.IssueStateClosed && !pr.Merged {
		blockers = append(blockers, fmt.Sprintf("issue #%d is closed and the linked PR is not merged", input.IssueNumber))
	}
	if !hasLabel(issue.Labels, "ai:needs-review") {
		blockers = append(blockers, fmt.Sprintf("issue #%d does not have required label ai:needs-review", input.IssueNumber))
	}
	if pr.State != domain.PullRequestStateOpen {
		blockers = append(blockers, fmt.Sprintf("pull request #%d is not open", pr.Number))
	}
	if pr.Draft {
		blockers = append(blockers, fmt.Sprintf("pull request #%d is draft", pr.Number))
	}
	if pr.Base != input.Config.DefaultBranch {
		blockers = append(blockers, fmt.Sprintf("pull request #%d base branch %q does not match %q", pr.Number, pr.Base, input.Config.DefaultBranch))
	}
	if !strings.Contains(body, fmt.Sprintf("Closes #%d", input.IssueNumber)) {
		blockers = append(blockers, fmt.Sprintf("pull request #%d body does not contain Closes #%d", pr.Number, input.IssueNumber))
	}
	for _, section := range requiredPRBodySections() {
		if !hasMarkdownSection(body, section) {
			blockers = append(blockers, fmt.Sprintf("PR body is missing required section: %s", section))
		}
	}
	if mergeable == github.MergeableStateConflicting {
		blockers = append(blockers, fmt.Sprintf("pull request #%d has merge conflicts", pr.Number))
	} else if mergeable != github.MergeableStateMergeable {
		blockers = append(blockers, fmt.Sprintf("pull request #%d mergeable state is %q", pr.Number, mergeable))
	}
	return blockers
}

func requiredPRBodySections() []string {
	return []string{"Summary", "Issue", "Changed Files", "Validation", "Risks", "AI Handoff"}
}

func hasMarkdownSection(body string, section string) bool {
	pattern := regexp.MustCompile(`(?im)^#{1,6}\s+` + regexp.QuoteMeta(section) + `\s*$`)
	return pattern.MatchString(body)
}

func reviewChangedFilesBlockers(files []string) []string {
	if len(files) == 0 {
		return []string{"changed files are unavailable"}
	}
	return nil
}

func reviewScopeBlockers(scope []string) []string {
	for _, item := range scope {
		if strings.HasPrefix(item, "Needs check:") {
			return []string{item}
		}
	}
	return nil
}

func reviewChecks(checks domain.PullRequestChecks, err error, cfg config.Config, blockers []string, notes []string) ([]string, []string, []string) {
	if err != nil {
		notes = append(notes, fmt.Sprintf("could not read GitHub checks: %v", err))
		return []string{"Could not read GitHub checks"}, blockers, notes
	}
	if checks.Total == 0 || len(checks.Checks) == 0 {
		if requireChecks(cfg) {
			blockers = append(blockers, fmt.Sprintf("pull request #%d has no checks; merge.requireChecks=true requires at least one successful check", checks.PullRequestNumber))
		} else {
			notes = append(notes, "No GitHub checks found")
			notes = append(notes, "Missing checks allowed by configuration")
		}
		return []string{"No GitHub checks found", "Missing checks allowed by configuration"}, blockers, notes
	}
	if err := validatePullRequestChecks(checks); err != nil {
		blockers = append(blockers, err.Error())
	}
	lines := make([]string, 0, len(checks.Checks))
	for _, check := range checks.Checks {
		lines = append(lines, fmt.Sprintf("%s: %s", check.Name, checkBucketText(check.Bucket)))
	}
	return lines, blockers, notes
}

func reviewScope(files []string) []string {
	if len(files) == 0 {
		return []string{"Needs check: changed files are unavailable"}
	}
	for _, file := range files {
		if !isExpectedReviewScope(file) {
			return []string{"Needs check: changes include files outside parsevkctl and docs"}
		}
	}
	return []string{"OK: changes are limited to parsevkctl and docs"}
}

func isExpectedReviewScope(file string) bool {
	normalized := strings.ReplaceAll(file, "\\", "/")
	prefixes := []string{
		"tools/parsevkctl-go/",
		"tools/parsevkctl/",
		"cmd/parsevkctl/",
		"internal/",
		"docs/ai-workflow/",
		"services/",
		"front/",
	}
	for _, prefix := range prefixes {
		if strings.HasPrefix(normalized, prefix) {
			return true
		}
	}
	return normalized == "docs/COMMANDS.md" || normalized == "docs/PARSEVKCTL.md"
}

var secretPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)password\s*=`),
	regexp.MustCompile(`(?i)secret\s*=`),
	regexp.MustCompile(`(?i)token\s*=`),
	regexp.MustCompile(`(?i)api_key\s*=`),
	regexp.MustCompile(`(?i)apikey\s*=`),
	regexp.MustCompile(`(?i)access_token\s*=`),
	regexp.MustCompile(`(?i)refresh_token\s*=`),
	regexp.MustCompile(`(?i)PRIVATE KEY`),
	regexp.MustCompile(`(?i)BEGIN RSA PRIVATE KEY`),
	regexp.MustCompile(`(?i)BEGIN OPENSSH PRIVATE KEY`),
}

func scanDiffForSecrets(diff string) []string {
	seen := map[string]bool{}
	var findings []string
	currentFile := ""
	for _, line := range strings.Split(diff, "\n") {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "diff --git ") {
			currentFile = parseDiffFile(trimmed)
			continue
		}
		if !strings.HasPrefix(trimmed, "+") || strings.HasPrefix(trimmed, "+++") {
			continue
		}
		if currentFile == "tools/parsevkctl-go/internal/commands/review.go" && strings.Contains(trimmed, "regexp.MustCompile") {
			continue
		}
		for _, pattern := range secretPatterns {
			match := pattern.FindString(trimmed)
			if match == "" {
				continue
			}
			normalized := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(match), " ", " "))
			if seen[normalized] {
				continue
			}
			seen[normalized] = true
			findings = append(findings, "potential secret pattern detected: "+match)
		}
	}
	return findings
}

func parseDiffFile(line string) string {
	fields := strings.Fields(line)
	if len(fields) < 4 {
		return ""
	}
	return strings.TrimPrefix(fields[3], "b/")
}

func reviewVerdict(blockers []string, notes []string) string {
	if len(blockers) > 0 {
		return ReviewVerdictDoNotMerge
	}
	for _, note := range notes {
		if strings.Contains(note, "No GitHub checks found") || strings.Contains(note, "could not read") {
			return ReviewVerdictNeedsMoreCheck
		}
	}
	return ReviewVerdictCanMerge
}

func renderMergeable(state github.MergeableState) string {
	switch state {
	case github.MergeableStateMergeable:
		return "true"
	case github.MergeableStateConflicting:
		return "false"
	default:
		return "unknown"
	}
}

func checkBucketText(state domain.CheckState) string {
	switch state {
	case domain.CheckStateSuccess:
		return "passed"
	case domain.CheckStatePending:
		return "pending"
	case domain.CheckStateFailure:
		return "failed"
	case domain.CheckStateSkipped:
		return "skipped"
	default:
		return "unknown"
	}
}

func renderTaskReview(w io.Writer, result ReviewResult) {
	out := output(w)
	fmt.Fprintln(out, "PR Review Report")
	fmt.Fprintln(out)
	fmt.Fprintf(out, "Issue: #%d\n", result.Issue.Number)
	fmt.Fprintf(out, "Issue title: %s\n", result.Issue.Title)
	fmt.Fprintf(out, "PR: #%d\n", result.PullRequest.Number)
	fmt.Fprintf(out, "PR title: %s\n", result.PullRequest.Title)
	fmt.Fprintf(out, "Base branch: %s\n", result.PullRequest.Base)
	fmt.Fprintf(out, "Head branch: %s\n", result.PullRequest.Head)
	fmt.Fprintf(out, "Draft: %t\n", result.PullRequest.Draft)
	fmt.Fprintf(out, "Mergeable: %s\n", result.PullRequest.Mergeable)
	fmt.Fprintln(out)
	renderStringList(out, "Changed files:", result.ChangedFiles, "none")
	fmt.Fprintln(out)
	renderStringList(out, "Scope:", result.Scope, "Needs check: changed files are unavailable")
	fmt.Fprintln(out)
	renderStringList(out, "Checks:", result.Checks, "No GitHub checks found")
	fmt.Fprintln(out)
	renderStringList(out, "Secrets:", result.Secrets, "OK: no obvious secrets found")
	fmt.Fprintln(out)
	renderStringList(out, "Blockers:", result.Blockers, "none")
	fmt.Fprintln(out)
	renderStringList(out, "Non-blocking notes:", result.NonBlockingNotes, "none")
	fmt.Fprintln(out)
	fmt.Fprintln(out, "Verdict:")
	fmt.Fprintln(out, result.Verdict)
	fmt.Fprintln(out)
	fmt.Fprintln(out, "Next:")
	fmt.Fprintln(out, result.Next)
}

func renderStringList(w io.Writer, title string, values []string, empty string) {
	fmt.Fprintln(w, title)
	if len(values) == 0 {
		fmt.Fprintf(w, "- %s\n", empty)
		return
	}
	for _, value := range values {
		fmt.Fprintf(w, "- %s\n", value)
	}
}
