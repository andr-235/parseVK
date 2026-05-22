package branch

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"unicode"

	"github.com/andr-235/parseVK/tools/parsevkctl-go/internal/domain"
)

const (
	defaultBranchType = "feat"
	fallbackSlug      = "task"
	maxSlugLength     = 48
)

var (
	branchNamePattern = regexp.MustCompile(`^([a-z]+)/issue-([0-9]+)-([a-z0-9-]+)$`)
	prefixPattern     = regexp.MustCompile(`^([A-Za-z]+):\s*`)
)

var supportedTypes = map[string]struct{}{
	"feat":     {},
	"fix":      {},
	"docs":     {},
	"refactor": {},
	"test":     {},
	"ci":       {},
	"chore":    {},
	"perf":     {},
	"build":    {},
	"hotfix":   {},
}

var cyrillicTransliteration = map[rune]string{
	'а': "a", 'б': "b", 'в': "v", 'г': "g", 'д': "d", 'е': "e", 'ё': "yo",
	'ж': "zh", 'з': "z", 'и': "i", 'й': "y", 'к': "k", 'л': "l", 'м': "m",
	'н': "n", 'о': "o", 'п': "p", 'р': "r", 'с': "s", 'т': "t", 'у': "u",
	'ф': "f", 'х': "kh", 'ц': "ts", 'ч': "ch", 'ш': "sh", 'щ': "shch",
	'ъ': "", 'ы': "y", 'ь': "", 'э': "e", 'ю': "yu", 'я': "ya",
}

type ParsedBranch struct {
	Type        string
	IssueNumber int
	Slug        string
}

func NewTaskBranchName(issue domain.Issue) (string, error) {
	issueNumber := int(issue.ID)
	if issueNumber <= 0 {
		return "", errors.New("issue number must be a positive integer")
	}

	branchType := ResolveBranchType(issue.Title, issue.Labels)
	slug := SlugifyTitle(issue.Title)
	name := fmt.Sprintf("%s/issue-%d-%s", branchType, issueNumber, slug)
	if err := ValidateTaskBranchName(name); err != nil {
		return "", err
	}

	return name, nil
}

func ParseTaskBranchName(name string) (ParsedBranch, error) {
	if err := ValidateTaskBranchName(name); err != nil {
		return ParsedBranch{}, err
	}

	matches := branchNamePattern.FindStringSubmatch(name)
	issueNumber, err := strconv.Atoi(matches[2])
	if err != nil {
		return ParsedBranch{}, fmt.Errorf("parse issue number: %w", err)
	}

	return ParsedBranch{
		Type:        matches[1],
		IssueNumber: issueNumber,
		Slug:        matches[3],
	}, nil
}

func ValidateTaskBranchName(name string) error {
	if strings.TrimSpace(name) == "" {
		return errors.New("branch name must not be empty")
	}

	matches := branchNamePattern.FindStringSubmatch(name)
	if matches == nil {
		return errors.New("branch name must match <type>/issue-<number>-<slug>")
	}

	if !isSupportedType(matches[1]) {
		return fmt.Errorf("unsupported branch type %q", matches[1])
	}

	issueNumber, err := strconv.Atoi(matches[2])
	if err != nil || issueNumber <= 0 {
		return errors.New("issue number must be a positive integer")
	}

	if err := validateSlug(matches[3]); err != nil {
		return err
	}

	return nil
}

func SlugifyTitle(title string) string {
	title = stripConventionalPrefix(title)

	var builder strings.Builder
	lastDash := false
	for _, r := range strings.ToLower(title) {
		switch {
		case r >= 'a' && r <= 'z':
			builder.WriteRune(r)
			lastDash = false
		case r >= '0' && r <= '9':
			builder.WriteRune(r)
			lastDash = false
		case r >= 'а' && r <= 'я' || r == 'ё':
			builder.WriteString(cyrillicTransliteration[r])
			lastDash = false
		case unicode.IsSpace(r) || r == '-' || r == '_':
			if builder.Len() > 0 && !lastDash {
				builder.WriteByte('-')
				lastDash = true
			}
		default:
			if builder.Len() > 0 && !lastDash {
				builder.WriteByte('-')
				lastDash = true
			}
		}
	}

	slug := strings.Trim(builder.String(), "-")
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}

	if len(slug) > maxSlugLength {
		slug = strings.TrimRight(slug[:maxSlugLength], "-")
		if lastDash := strings.LastIndex(slug, "-"); lastDash > 0 {
			slug = slug[:lastDash]
		}
	}
	if slug == "" {
		return fallbackSlug
	}

	return slug
}

func ResolveBranchType(title string, labels []string) string {
	for _, label := range labels {
		labelType, ok := strings.CutPrefix(strings.ToLower(strings.TrimSpace(label)), "type:")
		if !ok {
			continue
		}

		branchType := strings.TrimSpace(labelType)
		if isSupportedType(branchType) {
			return branchType
		}
	}

	matches := prefixPattern.FindStringSubmatch(strings.TrimSpace(title))
	if len(matches) == 2 {
		branchType := strings.ToLower(matches[1])
		if isSupportedType(branchType) {
			return branchType
		}
	}

	return defaultBranchType
}

func stripConventionalPrefix(title string) string {
	trimmed := strings.TrimSpace(title)
	matches := prefixPattern.FindStringSubmatch(trimmed)
	if len(matches) != 2 || !isSupportedType(strings.ToLower(matches[1])) {
		return trimmed
	}

	return prefixPattern.ReplaceAllString(trimmed, "")
}

func isSupportedType(branchType string) bool {
	_, ok := supportedTypes[branchType]
	return ok
}

func validateSlug(slug string) error {
	if slug == "" {
		return errors.New("slug must not be empty")
	}
	if len(slug) > maxSlugLength {
		return fmt.Errorf("slug must be at most %d characters", maxSlugLength)
	}
	if strings.HasPrefix(slug, "-") || strings.HasSuffix(slug, "-") {
		return errors.New("slug must not start or end with dash")
	}
	if strings.Contains(slug, "--") {
		return errors.New("slug must not contain duplicated dashes")
	}
	for _, r := range slug {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			continue
		}

		return fmt.Errorf("slug contains invalid character %q", r)
	}

	return nil
}
