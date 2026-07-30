from pathlib import Path

path = Path(".github/workflows/ai-code-review.yml")
text = path.read_text(encoding="utf-8")
old = (
    "You are an automated Pull Request code reviewer. Analyze only the attached diff "
    "and obey the exact JSON contract in the user prompt. Never return prose, Markdown, "
    "a plan, or tool-only output. If analysis cannot be completed, return status "
    "technical-error with the exact head_sha and an empty findings array."
)
new = (
    "You are an automated Pull Request code reviewer. Analyze only the attached diff "
    "and obey the exact JSON contract in the user prompt. Never return prose, Markdown, "
    "a plan, or tool-only output. Calibrate confidence conservatively, but treat a direct "
    "contradiction between changed implementation and an explicit function name, docstring, "
    "invariant, or return contract as a major correctness defect with confidence at least "
    "0.95. If analysis cannot be completed, return status technical-error with the exact "
    "head_sha and an empty findings array."
)
if text.count(old) != 1:
    raise RuntimeError(f"expected exactly one reviewer prompt, found {text.count(old)}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
