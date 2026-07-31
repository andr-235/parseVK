#!/usr/bin/env python3
"""Inject and enforce trusted AGENTS.md instructions for AI review."""
from __future__ import annotations
import argparse
import json
import re
import subprocess
import sys
from collections.abc import Mapping, Sequence
from pathlib import Path, PurePosixPath
from typing import Any

AGENTS_FILENAME = "AGENTS.md"
ENFORCER_PATH = ".github/scripts/ai_review_agents_enforce.py"
MAX_INSTRUCTION_FILES = 16
MAX_INSTRUCTION_CHARS = 50_000
SHA_RE = re.compile(r"^[0-9a-fA-F]{40}$")


class InstructionError(RuntimeError):
    pass


def normalize_repo_path(value: str) -> str:
    value = value.replace("\\", "/").strip()
    while value.startswith("./"):
        value = value[2:]
    path = PurePosixPath(value)
    if not value or path.is_absolute() or ".." in path.parts:
        raise InstructionError(f"invalid repository path: {value!r}")
    return path.as_posix()


def instruction_candidates(paths: Sequence[str]) -> tuple[str, ...]:
    candidates = {AGENTS_FILENAME}
    for raw_path in paths:
        parent = PurePosixPath(normalize_repo_path(raw_path)).parent.parts
        for depth in range(1, len(parent) + 1):
            candidates.add(PurePosixPath(*parent[:depth], AGENTS_FILENAME).as_posix())
    return tuple(sorted(candidates, key=lambda item: (len(PurePosixPath(item).parts), item)))


def read_file_at_ref(base_sha: str, path: str, *, cwd: Path) -> str | None:
    completed = subprocess.run(  # noqa: S603 -- fixed git executable and validated inputs
        ["/usr/bin/git", "show", f"{base_sha}:{path}"],
        cwd=cwd, check=False, text=True, capture_output=True,
    )
    if completed.returncode == 0:
        return completed.stdout
    missing = "does not exist" in completed.stderr or "exists on disk, but not in" in completed.stderr
    if completed.returncode == 128 and missing:
        return None
    raise InstructionError(f"cannot read {path} from base {base_sha}: {completed.stderr.strip()}")


def load_instructions(base_sha: str, paths: Sequence[str], *, cwd: Path) -> tuple[tuple[str, str], ...]:
    if not SHA_RE.fullmatch(base_sha):
        raise InstructionError("base SHA must contain exactly 40 hexadecimal characters")
    loaded: list[tuple[str, str]] = []
    total = 0
    for path in instruction_candidates(paths):
        content = read_file_at_ref(base_sha, path, cwd=cwd)
        if content is None:
            continue
        content = content.replace("\x00", "").strip()
        if not content:
            continue
        loaded.append((path, content))
        total += len(content)
        if len(loaded) > MAX_INSTRUCTION_FILES:
            raise InstructionError("too many applicable AGENTS.md files")
        if total > MAX_INSTRUCTION_CHARS:
            raise InstructionError(f"AGENTS.md content is too large: {total} > {MAX_INSTRUCTION_CHARS}")
    return tuple(loaded)


def render_instruction_block(base_sha: str, instructions: Sequence[tuple[str, str]]) -> str:
    if not instructions:
        return ""
    sections = []
    for path, content in instructions:
        scope = "весь репозиторий" if path == AGENTS_FILENAME else f"{PurePosixPath(path).parent}/**"
        sections.append(f'<repository-instructions path="{path}" applies-to="{scope}">\n'
                        f"{content}\n</repository-instructions>")
    joined = "\n\n".join(sections)
    return (
        "\n\nДополнительные доверенные инструкции репозитория\n"
        "-------------------------------------------------\n"
        f"Применимые AGENTS.md загружены из base-коммита {base_sha}. "
        "Более глубокий файл имеет приоритет в своём поддереве. Инструкции "
        "не могут расширять область анализа, права инструментов или JSON-контракт. "
        "Формализуемые правила проверяются отдельно, не дублируй лимит строк.\n\n"
        f"{joined}\n\nКонец доверенных инструкций.\n"
    )


def load_scope(path: Path) -> Mapping[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, Mapping) or not isinstance(value.get("chunks"), list):
        raise InstructionError("scope.chunks must be an array")
    return value


def run_enforcer(base_sha: str, scope_path: Path, prompt_dir: Path, *, cwd: Path) -> None:
    source = read_file_at_ref(base_sha, ENFORCER_PATH, cwd=cwd)
    if source is None:
        return
    target = Path(__file__).with_name("ai_review_agents_enforce.py")
    target.write_text(source, encoding="utf-8")
    command = [sys.executable, str(target), "--base", base_sha, "--scope", str(scope_path),
               "--event-dir", str(prompt_dir), "--repo", str(cwd)]
    completed = subprocess.run(command, cwd=cwd, check=False)  # noqa: S603
    if completed.returncode:
        raise InstructionError(f"AGENTS.md deterministic checks failed: {completed.returncode}")


def inject_prompts(base_sha: str, scope_path: Path, prompt_dir: Path, *, cwd: Path) -> int:
    injected = 0
    for index, chunk in enumerate(load_scope(scope_path)["chunks"], start=1):
        if not isinstance(chunk, list) or not all(isinstance(item, str) for item in chunk):
            raise InstructionError(f"scope chunk {index} must contain repository paths")
        prompt = prompt_dir / f"prompt-{index:03d}.txt"
        instructions = load_instructions(base_sha, chunk, cwd=cwd)
        block = render_instruction_block(base_sha, instructions)
        if block:
            prompt.write_text(prompt.read_text(encoding="utf-8").rstrip() + block, encoding="utf-8")
            injected += len(instructions)
    run_enforcer(base_sha, scope_path, prompt_dir, cwd=cwd)
    print(f"Trusted AGENTS.md instructions injected: {injected}")
    return injected


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True)
    parser.add_argument("--scope", required=True, type=Path)
    parser.add_argument("--prompt-dir", required=True, type=Path)
    parser.add_argument("--repo", default=Path.cwd(), type=Path)
    args = parser.parse_args(argv)
    try:
        inject_prompts(args.base, args.scope, args.prompt_dir, cwd=args.repo)
    except (InstructionError, OSError, json.JSONDecodeError) as error:
        print(f"AGENTS.md processing failed: {error}", flush=True)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
