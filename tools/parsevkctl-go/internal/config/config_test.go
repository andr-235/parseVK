package config

import "testing"

func TestValidateAcceptsValidConfig(t *testing.T) {
	cfg := Config{
		Repo:          "andr-235/parseVK",
		DefaultBranch: "fastapi-microservices-rewrite",
		ProjectOwner:  "andr-235",
		ProjectNumber: float64(1),
		ProjectID:     "PVT_kw_TEST",
		ProjectTitle:  "parseVK",
		Statuses: Statuses{
			Todo:       "Todo",
			InProgress: "In Progress",
			Review:     "Review",
			Done:       "Done",
		},
		Merge: MergeSettings{
			RequireChecks:  false,
			AllowAutoMerge: false,
		},
	}

	errs := Validate(cfg)
	if len(errs) != 0 {
		t.Fatalf("expected valid config, got errors: %v", errs)
	}
}

func TestValidateRejectsBadRepoFormat(t *testing.T) {
	cfg := Config{
		Repo:          "parseVK",
		DefaultBranch: "main",
		ProjectOwner:  "andr-235",
		ProjectNumber: float64(1),
		ProjectID:     "PVT_kw_TEST",
		ProjectTitle:  "parseVK",
		Statuses: Statuses{
			Todo:       "Todo",
			InProgress: "In Progress",
			Review:     "Review",
			Done:       "Done",
		},
	}

	errs := Validate(cfg)

	if !contains(errs, "repo must use owner/name format") {
		t.Fatalf("expected repo format error, got: %v", errs)
	}
}

func TestValidateRejectsMissingStatus(t *testing.T) {
	cfg := Config{
		Repo:          "andr-235/parseVK",
		DefaultBranch: "main",
		ProjectOwner:  "andr-235",
		ProjectNumber: float64(1),
		ProjectID:     "PVT_kw_TEST",
		ProjectTitle:  "parseVK",
		Statuses: Statuses{
			Todo:       "Todo",
			InProgress: "In Progress",
			Done:       "Done",
		},
	}

	errs := Validate(cfg)

	if !contains(errs, "missing field statuses.review") {
		t.Fatalf("expected missing review status error, got: %v", errs)
	}
}

func contains(values []string, expected string) bool {
	for _, value := range values {
		if value == expected {
			return true
		}
	}

	return false
}
