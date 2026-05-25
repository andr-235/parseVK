package github

type Label struct {
	Name        string `json:"name"`
	Color       string `json:"color"`
	Description string `json:"description"`
}

func StandardLabels() []Label {
	return []Label{
		{Name: "type:feature", Color: "1f883d", Description: "Feature work"},
		{Name: "type:bug", Color: "d1242f", Description: "Bug fix"},
		{Name: "type:infra", Color: "8250df", Description: "Infrastructure or tooling work"},
		{Name: "type:docs", Color: "0969da", Description: "Documentation work"},
		{Name: "type:test", Color: "1a7f37", Description: "Test-only work"},
		{Name: "type:refactor", Color: "bf8700", Description: "Refactoring without behavior changes"},
		{Name: "type:migration", Color: "953800", Description: "Migration work"},

		{Name: "service:api-gateway", Color: "54aeff", Description: "API gateway service area"},
		{Name: "service:identity-service", Color: "54aeff", Description: "Identity service area"},
		{Name: "service:tasks-service", Color: "54aeff", Description: "Tasks service area"},
		{Name: "service:vk-service", Color: "54aeff", Description: "VK service area"},
		{Name: "service:telegram-service", Color: "54aeff", Description: "Telegram service area"},
		{Name: "service:content-service", Color: "54aeff", Description: "Content service area"},
		{Name: "service:frontend", Color: "54aeff", Description: "Frontend service area"},
		{Name: "service:parsevkctl", Color: "54aeff", Description: "parsevkctl CLI area"},

		{Name: "risk:low", Color: "2da44e", Description: "Low risk change"},
		{Name: "risk:medium", Color: "bf8700", Description: "Medium risk change"},
		{Name: "risk:high", Color: "bc4c00", Description: "High risk change"},
		{Name: "risk:critical", Color: "cf222e", Description: "Critical risk change"},

		{Name: "ai:ready", Color: "a2eeef", Description: "Ready for AI agent work"},
		{Name: "ai:in-progress", Color: "a2eeef", Description: "AI agent work in progress"},
		{Name: "ai:needs-review", Color: "a2eeef", Description: "AI output needs review"},
		{Name: "ai:handoff-required", Color: "a2eeef", Description: "AI agent handoff required"},
		{Name: "ai:bad-output", Color: "a2eeef", Description: "AI output rejected or unusable"},
		{Name: "ai:approved", Color: "a2eeef", Description: "AI output approved"},

		{Name: "review:passed", Color: "0e8a16", Description: "Review passed"},
		{Name: "review:failed", Color: "b60205", Description: "Review failed"},
		{Name: "review:changes-requested", Color: "d93f0b", Description: "Review requested changes"},
	}
}
