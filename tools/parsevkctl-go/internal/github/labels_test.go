package github

import "testing"

func TestStandardLabelsAreUniqueAndComplete(t *testing.T) {
	t.Parallel()

	labels := StandardLabels()
	if len(labels) != 28 {
		t.Fatalf("label count = %d, want 28", len(labels))
	}

	seen := map[string]bool{}
	for _, label := range labels {
		if label.Name == "" || label.Color == "" || label.Description == "" {
			t.Fatalf("label must include name, color and description: %#v", label)
		}
		if seen[label.Name] {
			t.Fatalf("duplicate label %q", label.Name)
		}
		seen[label.Name] = true
	}

	for _, name := range []string{
		"type:feature",
		"service:parsevkctl",
		"risk:critical",
		"ai:needs-review",
		"review:changes-requested",
	} {
		if !seen[name] {
			t.Fatalf("missing standard label %q", name)
		}
	}
}
