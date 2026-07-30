from __future__ import annotations

from .models import Finding


def quote_markdown(text: str) -> str:
    """Keep every model-provided line inside a GitHub alert block."""
    return "\n".join(f"> {line}" if line else ">" for line in text.splitlines())


def render_alert(kind: str, title: str, body: str) -> str:
    return "\n".join(
        (
            f"> [!{kind}]",
            f"> **{title}**",
            ">",
            quote_markdown(body),
        )
    )


def render_finding_sections(finding: Finding) -> tuple[str, str, str]:
    return (
        render_alert("NOTE", "Что не так", finding.scenario),
        render_alert("WARNING", "Последствия", finding.impact),
        render_alert("TIP", "Как исправить", finding.fix),
    )


def render_confidence(finding: Finding) -> str:
    confidence = round(finding.confidence * 100)
    return (
        f"<sub>📈 Уверенность: {confidence}% · 🧠 Big Pickle · "
        "🛡️ diff-фильтры parseVK</sub>"
    )
