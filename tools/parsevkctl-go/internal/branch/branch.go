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
	aiBranchType  = "ai"
	fallbackSlug  = "task"
	maxSlugLength = 60
)

var (
	branchNamePattern = regexp.MustCompile(`^(ai)/mbp-([0-9]+)-([a-z0-9-]+)$`)
	mbpPrefixPattern  = regexp.MustCompile(`(?i)^MBP-([0-9]+):\s*`)
)

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

	slug := SlugifyTitle(issue.Title)
	name := fmt.Sprintf("%s/mbp-%d-%s", aiBranchType, issueNumber, slug)
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
		return errors.New("branch name must match ai/mbp-<number>-<slug>")
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
	title = stripMBPPrefix(title)

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

func stripMBPPrefix(title string) string {
	trimmed := strings.TrimSpace(title)
	matches := mbpPrefixPattern.FindStringSubmatch(trimmed)
	if len(matches) != 2 {
		return trimmed
	}

	return mbpPrefixPattern.ReplaceAllString(trimmed, "")
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
