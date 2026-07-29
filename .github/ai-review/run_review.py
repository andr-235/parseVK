#!/usr/bin/env python3
"""Run the AI reviewer with stable Zen headers and response diagnostics."""

from __future__ import annotations

import importlib.util
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from types import ModuleType
from typing import Any

HERE = Path(__file__).resolve().parent
USER_AGENT = "parseVK-ai-reviewer/1.0"


def load_reviewer() -> ModuleType:
    spec = importlib.util.spec_from_file_location("ai_review", HERE / "review.py")
    if spec is None or spec.loader is None:
        raise RuntimeError("Не удалось загрузить review.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def extract_content(message: dict[str, Any]) -> str:
    content = message.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict):
                value = part.get("text") or part.get("content")
                if isinstance(value, str):
                    parts.append(value)
        return "\n".join(parts)
    return ""


def post_zen(endpoint: str, key: str, payload: dict[str, Any]) -> dict[str, Any]:
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            body = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode(errors="replace")[:3000]
        raise RuntimeError(f"Zen API HTTP {exc.code}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Zen API network error: {exc}") from exc

    try:
        value = json.loads(body)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Zen API вернул не JSON: {body[:3000]!r}") from exc
    if not isinstance(value, dict):
        raise RuntimeError(f"Zen API вернул неожиданный ответ: {body[:3000]!r}")
    return value


def install_call_model(reviewer: ModuleType) -> None:
    def call_model(config: dict[str, Any], key: str, prompt: str) -> str:
        base_payload: dict[str, Any] = {
            "model": config["model"],
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Верни только один валидный JSON-объект. "
                        "Не используй markdown, пояснения или XML-теги."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.0,
            "max_tokens": 8000,
        }

        errors: list[str] = []
        for use_json_mode in (True, False):
            payload = dict(base_payload)
            if use_json_mode:
                payload["response_format"] = {"type": "json_object"}

            for attempt in range(2):
                try:
                    data = post_zen(config["endpoint"], key, payload)
                    choices = data.get("choices")
                    if not isinstance(choices, list) or not choices:
                        raise RuntimeError(
                            "Zen API не вернул choices: "
                            + json.dumps(data, ensure_ascii=False)[:3000]
                        )
                    choice = choices[0]
                    if not isinstance(choice, dict):
                        raise RuntimeError(f"Некорректный choice: {choice!r}")
                    message = choice.get("message")
                    if not isinstance(message, dict):
                        raise RuntimeError(f"Zen API не вернул message: {choice!r}")

                    content = extract_content(message).strip()
                    finish_reason = choice.get("finish_reason")
                    reasoning = message.get("reasoning_content")
                    reasoning_preview = (
                        reasoning[:1500] if isinstance(reasoning, str) else repr(reasoning)[:1500]
                    )

                    print(
                        "::notice::Zen response: "
                        f"finish_reason={finish_reason!r}, content_chars={len(content)}, "
                        f"json_mode={use_json_mode}"
                    )

                    if "{" in content and "}" in content:
                        return content

                    diagnostic = (
                        "Модель не вернула JSON. "
                        f"finish_reason={finish_reason!r}; "
                        f"message_keys={sorted(message.keys())}; "
                        f"content={content[:3000]!r}; "
                        f"reasoning_content={reasoning_preview!r}"
                    )
                    errors.append(diagnostic)
                    break
                except RuntimeError as exc:
                    text = str(exc)
                    errors.append(text)
                    unsupported_json_mode = use_json_mode and (
                        "response_format" in text.lower()
                        or "json_object" in text.lower()
                        or "HTTP 400" in text
                        or "HTTP 422" in text
                    )
                    if unsupported_json_mode:
                        print("::warning::Zen JSON mode недоступен, повтор без response_format")
                        break
                    if attempt == 0 and any(code in text for code in ("HTTP 429", "HTTP 500", "HTTP 502", "HTTP 503", "HTTP 504", "network error")):
                        time.sleep(2)
                        continue
                    break

        raise reviewer.ReviewError("Zen не вернул пригодный JSON:\n- " + "\n- ".join(errors[-4:]))

    reviewer.call_model = call_model


def main() -> int:
    reviewer = load_reviewer()
    install_call_model(reviewer)
    return int(reviewer.main())


if __name__ == "__main__":
    sys.exit(main())
