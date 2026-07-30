from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AI_REVIEW = ROOT / ".github/scripts/ai_review.py"
TESTS = ROOT / ".github/scripts/test_ai_review.py"
WORKFLOW = ROOT / ".github/workflows/ai-code-review.yml"


def replace_once(text: str, old: str, new: str, *, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def patch_ai_review() -> None:
    text = AI_REVIEW.read_text(encoding="utf-8")

    text = replace_once(
        text,
        "MAX_REVIEW_FILES = 25\nMAX_CHANGED_LINES = 1500\n",
        "MAX_CHUNK_FILES = 20\n"
        "MAX_CHUNK_CHANGED_LINES = 2000\n"
        "MAX_REVIEW_CHUNKS = 4\n"
        "MAX_REVIEW_FILES = MAX_CHUNK_FILES * MAX_REVIEW_CHUNKS\n"
        "MAX_CHANGED_LINES = MAX_CHUNK_CHANGED_LINES * MAX_REVIEW_CHUNKS\n",
        label="review limits",
    )

    text = replace_once(
        text,
        "    line_map: Mapping[str, tuple[int, ...]]\n\n    @property\n",
        "    line_map: Mapping[str, tuple[int, ...]]\n"
        "    chunks: tuple[tuple[str, ...], ...] = ()\n\n"
        "    @property\n",
        label="Scope chunks field",
    )

    text = replace_once(
        text,
        '            "line_map": {key: list(value) for key, value in self.line_map.items()},\n',
        '            "line_map": {key: list(value) for key, value in self.line_map.items()},\n'
        '            "chunks": [list(chunk) for chunk in self.chunks],\n',
        label="Scope chunks serialization",
    )

    text = replace_once(
        text,
        '            line_map={str(key): tuple(int(line) for line in lines) for key, lines in value["line_map"].items()},\n'
        "        )\n",
        '            line_map={str(key): tuple(int(line) for line in lines) for key, lines in value["line_map"].items()},\n'
        '            chunks=tuple(tuple(str(path) for path in chunk) for chunk in value.get("chunks", [])),\n'
        "        )\n",
        label="Scope chunks deserialization",
    )

    changed_line_block = '''def changed_line_count(base_sha: str, head_sha: str, paths: Sequence[str], *, cwd: Path) -> int:
    if not paths:
        return 0
    output = run_git(["diff", "--numstat", base_sha, head_sha, "--", *paths], cwd=cwd)
    total = 0
    for row in output.splitlines():
        if not row.strip():
            continue
        added, deleted, *_ = row.split("\\t")
        if added == "-" or deleted == "-":
            return MAX_CHANGED_LINES + 1
        total += int(added) + int(deleted)
    return total
'''
    chunk_helpers = changed_line_block + '''

def partition_by_limits(
    paths: Sequence[str], line_counts: Mapping[str, int]
) -> tuple[tuple[str, ...], ...]:
    chunks: list[tuple[str, ...]] = []
    current: list[str] = []
    current_lines = 0

    for path in paths:
        path_lines = max(0, int(line_counts.get(path, 0)))
        if current and (
            len(current) >= MAX_CHUNK_FILES
            or current_lines + path_lines > MAX_CHUNK_CHANGED_LINES
        ):
            chunks.append(tuple(current))
            current = []
            current_lines = 0
        current.append(path)
        current_lines += path_lines

    if current:
        chunks.append(tuple(current))
    return tuple(chunks)


def partition_review_files(
    base_sha: str, head_sha: str, paths: Sequence[str], *, cwd: Path
) -> tuple[tuple[str, ...], ...]:
    line_counts = {
        path: changed_line_count(base_sha, head_sha, [path], cwd=cwd)
        for path in paths
    }
    return partition_by_limits(paths, line_counts)
'''
    text = replace_once(text, changed_line_block, chunk_helpers, label="chunk helpers")

    old_scope = '''def build_scope(base_sha: str, head_sha: str, *, cwd: Path, output_dir: Path) -> Scope:
    output_dir.mkdir(parents=True, exist_ok=True)
    all_files = changed_files(base_sha, head_sha, cwd=cwd)
    reviewable = [path for path in all_files if is_reviewable_path(path)]
    count = changed_line_count(base_sha, head_sha, reviewable, cwd=cwd)

    if not reviewable:
        status = "skipped"
        reason = "no-reviewable-files"
        diff_text = ""
        line_map: dict[str, tuple[int, ...]] = {}
    elif len(reviewable) > MAX_REVIEW_FILES or count > MAX_CHANGED_LINES:
        status = "unavailable"
        reason = "pr-too-large"
        diff_text = ""
        line_map = {}
    else:
        status = "review"
        reason = "review-required"
        diff_text = run_git(["diff", "--unified=3", base_sha, head_sha, "--", *reviewable], cwd=cwd)
        zero_context = run_git(["diff", "--unified=0", base_sha, head_sha, "--", *reviewable], cwd=cwd)
        line_map = parse_changed_lines(zero_context)

    (output_dir / "review.diff").write_text(diff_text, encoding="utf-8")
    (output_dir / "prompt.txt").write_text(render_prompt(head_sha, reviewable), encoding="utf-8")

    scope = Scope(
        schema_version=SCHEMA_VERSION,
        base_sha=base_sha,
        head_sha=head_sha,
        status=status,
        reason=reason,
        reviewable_files=tuple(reviewable),
        changed_lines=count,
        line_map=line_map,
    )
    write_json(output_dir / "scope.json", scope.to_dict())
    return scope
'''
    new_scope = '''def build_scope(base_sha: str, head_sha: str, *, cwd: Path, output_dir: Path) -> Scope:
    output_dir.mkdir(parents=True, exist_ok=True)
    for pattern in ("review-*.diff", "prompt-*.txt", "opencode-events-*.jsonl", "opencode-*.stderr"):
        for stale in output_dir.glob(pattern):
            stale.unlink(missing_ok=True)

    all_files = changed_files(base_sha, head_sha, cwd=cwd)
    reviewable = [path for path in all_files if is_reviewable_path(path)]
    count = changed_line_count(base_sha, head_sha, reviewable, cwd=cwd)
    chunks: tuple[tuple[str, ...], ...] = ()

    if not reviewable:
        status = "skipped"
        reason = "no-reviewable-files"
        line_map: dict[str, tuple[int, ...]] = {}
    elif len(reviewable) > MAX_REVIEW_FILES or count > MAX_CHANGED_LINES:
        status = "oversized"
        reason = "pr-too-large"
        line_map = {}
    else:
        chunks = partition_review_files(base_sha, head_sha, reviewable, cwd=cwd)
        if len(chunks) > MAX_REVIEW_CHUNKS:
            status = "oversized"
            reason = "too-many-review-chunks"
            line_map = {}
            chunks = ()
        else:
            status = "review"
            reason = "review-required"
            zero_context = run_git(["diff", "--unified=0", base_sha, head_sha, "--", *reviewable], cwd=cwd)
            line_map = parse_changed_lines(zero_context)
            for index, chunk in enumerate(chunks, start=1):
                suffix = f"{index:03d}"
                diff_text = run_git(["diff", "--unified=3", base_sha, head_sha, "--", *chunk], cwd=cwd)
                (output_dir / f"review-{suffix}.diff").write_text(diff_text, encoding="utf-8")
                (output_dir / f"prompt-{suffix}.txt").write_text(
                    render_prompt(head_sha, chunk), encoding="utf-8"
                )

    scope = Scope(
        schema_version=SCHEMA_VERSION,
        base_sha=base_sha,
        head_sha=head_sha,
        status=status,
        reason=reason,
        reviewable_files=tuple(reviewable),
        changed_lines=count,
        line_map=line_map,
        chunks=chunks,
    )
    write_json(output_dir / "scope.json", scope.to_dict())
    return scope
'''
    text = replace_once(text, old_scope, new_scope, label="build_scope")

    text = replace_once(
        text,
        '        reaction="confused",\n        blocking_count=0,\n    )\n\n\ndef skipped_result',
        '        reaction="",\n        blocking_count=0,\n    )\n\n\n'
        'def oversized_result(scope: Scope) -> FinalResult:\n'
        '    return FinalResult(\n'
        '        schema_version=SCHEMA_VERSION,\n'
        '        status="blocked",\n'
        '        reason=scope.reason,\n'
        '        head_sha=scope.head_sha,\n'
        '        summary=sanitize(\n'
        '            f"AI-ревью не выполнено: PR превышает предел {MAX_REVIEW_FILES} файлов "\n'
        '            f"или {MAX_CHANGED_LINES} изменённых строк "\n'
        '            f"({len(scope.reviewable_files)} файлов, {scope.changed_lines} строк).",\n'
        '            600,\n'
        '        ),\n'
        '        findings=(),\n'
        '        dropped_findings=0,\n'
        '        verdict="review-required",\n'
        '        reaction="",\n'
        '        blocking_count=0,\n'
        '    )\n\n\n'
        'def skipped_result',
        label="unavailable and oversized results",
    )

    old_finalize = '''def finalize_result(scope: Scope, events_path: Path | None, exit_code: int) -> FinalResult:
    if scope.status == "skipped":
        return skipped_result(scope)
    if scope.status == "unavailable":
        return unavailable_result(
            scope.head_sha,
            scope.reason,
            f"PR превышает лимит reviewer: {len(scope.reviewable_files)} файлов, {scope.changed_lines} изменённых строк.",
        )
    if exit_code != 0:
        return unavailable_result(scope.head_sha, "opencode-failed", f"OpenCode завершился с кодом {exit_code}.")
    if events_path is None or not events_path.exists():
        return unavailable_result(scope.head_sha, "missing-events", "Файл событий OpenCode отсутствует.")

    try:
        text = extract_text_events(events_path)
        raw = extract_json_object(text)
        status, summary, findings = validate_model_result(raw, scope.head_sha)
        if status == "technical-error":
            return unavailable_result(scope.head_sha, "model-technical-error", summary)
        accepted, dropped = filter_findings(findings, scope)
    except ReviewError as error:
        return unavailable_result(scope.head_sha, "invalid-model-result", str(error))

    blocking = sum(1 for finding in accepted if finding.severity in BLOCKING_SEVERITIES)
    if blocking:
        verdict, reaction = "changes-required", "-1"
    elif accepted:
        verdict, reaction = "findings", "confused"
    else:
        verdict, reaction = "approved", "+1"

    return FinalResult(
        schema_version=SCHEMA_VERSION,
        status="completed",
        reason="review-completed",
        head_sha=scope.head_sha,
        summary=sanitize(summary, 600),
        findings=accepted,
        dropped_findings=dropped,
        verdict=verdict,
        reaction=reaction,
        blocking_count=blocking,
    )
'''
    new_finalize = '''def event_paths(events_path: Path | None) -> tuple[Path, ...]:
    if events_path is None or not events_path.exists():
        return ()
    if events_path.is_file():
        return (events_path,)
    return tuple(sorted(events_path.glob("opencode-events-*.jsonl")))


def finalize_result(scope: Scope, events_path: Path | None, exit_code: int) -> FinalResult:
    if scope.status == "skipped":
        return skipped_result(scope)
    if scope.status == "oversized":
        return oversized_result(scope)
    if exit_code != 0:
        return unavailable_result(scope.head_sha, "opencode-failed", f"OpenCode завершился с кодом {exit_code}.")

    paths = event_paths(events_path)
    if not paths:
        return unavailable_result(scope.head_sha, "missing-events", "Файлы событий OpenCode отсутствуют.")

    try:
        summaries: list[str] = []
        model_findings: list[Finding] = []
        for path in paths:
            text = extract_text_events(path)
            raw = extract_json_object(text)
            status, summary, findings = validate_model_result(raw, scope.head_sha)
            if status == "technical-error":
                return unavailable_result(scope.head_sha, "model-technical-error", summary)
            summaries.append(summary)
            model_findings.extend(findings)

        unique: dict[tuple[Any, ...], Finding] = {}
        for finding in model_findings:
            key = (
                finding.severity,
                finding.file,
                finding.line,
                finding.scenario,
                finding.impact,
                finding.fix,
            )
            unique.setdefault(key, finding)
        accepted, dropped = filter_findings(tuple(unique.values()), scope)
        dropped += len(model_findings) - len(unique)
        summary = " | ".join(summaries)
    except ReviewError as error:
        return unavailable_result(scope.head_sha, "invalid-model-result", str(error))

    blocking = sum(1 for finding in accepted if finding.severity in BLOCKING_SEVERITIES)
    if blocking:
        verdict, reaction = "changes-required", "-1"
    elif accepted:
        verdict, reaction = "findings", "confused"
    else:
        verdict, reaction = "approved", "+1"

    return FinalResult(
        schema_version=SCHEMA_VERSION,
        status="completed",
        reason="review-completed",
        head_sha=scope.head_sha,
        summary=sanitize(summary, 600),
        findings=accepted,
        dropped_findings=dropped,
        verdict=verdict,
        reaction=reaction,
        blocking_count=blocking,
    )
'''
    text = replace_once(text, old_finalize, new_finalize, label="chunk result aggregation")

    old_publish = '''    if result.verdict == "unavailable":
        api.set_reaction(pr_number, "confused")
        print(f"::warning::{result.summary}")
        return 0

    if result.verdict == "approved":
'''
    new_publish = '''    if result.verdict == "unavailable":
        api.remove_reactions(pr_number)
        print(f"::warning::{result.summary}")
        return 0

    if result.verdict == "review-required":
        api.remove_reactions(pr_number)
        api.create_comment(
            pr_number,
            "<!-- ai-review:canonical -->\\n## AI Code Review не выполнено\\n\\n"
            f"{result.summary}\\n\\n"
            "Разделите Pull Request на меньшие части или выполните отдельное ручное ревью.",
        )
        print(f"::error::{result.summary}")
        return 1

    if result.verdict == "approved":
'''
    text = replace_once(text, old_publish, new_publish, label="publish unavailable and oversized")

    AI_REVIEW.write_text(text, encoding="utf-8")


def patch_tests() -> None:
    text = TESTS.read_text(encoding="utf-8")

    text = replace_once(
        text,
        "\n\nclass ResultTests(unittest.TestCase):\n",
        '''

class ChunkingTests(unittest.TestCase):
    def test_partitions_medium_review_by_file_limit(self) -> None:
        paths = tuple(f"src/file_{index}.py" for index in range(21))
        counts = {path: 90 for path in paths}
        chunks = ai_review.partition_by_limits(paths, counts)
        self.assertEqual(tuple(len(chunk) for chunk in chunks), (20, 1))

    def test_partitions_by_changed_line_limit(self) -> None:
        paths = ("a.py", "b.py", "c.py")
        chunks = ai_review.partition_by_limits(paths, {"a.py": 1200, "b.py": 900, "c.py": 100})
        self.assertEqual(chunks, (("a.py",), ("b.py", "c.py")))


class ResultTests(unittest.TestCase):
''',
        label="chunking tests",
    )

    text = replace_once(
        text,
        '        result = ai_review.finalize_result(self.scope(), events, 0)\n        self.assertEqual(result.verdict, "unavailable")\n\n    def test_finding_outside_changed_hunk_is_dropped',
        '        result = ai_review.finalize_result(self.scope(), events, 0)\n'
        '        self.assertEqual(result.verdict, "unavailable")\n'
        '        self.assertEqual(result.reaction, "")\n\n'
        '    def test_oversized_review_blocks_without_emoji(self) -> None:\n'
        '        scope = ai_review.Scope(\n'
        '            schema_version=1,\n'
        '            base_sha="a" * 40,\n'
        '            head_sha="b" * 40,\n'
        '            status="oversized",\n'
        '            reason="pr-too-large",\n'
        '            reviewable_files=tuple(f"src/{index}.py" for index in range(81)),\n'
        '            changed_lines=9000,\n'
        '            line_map={},\n'
        '        )\n'
        '        result = ai_review.finalize_result(scope, None, 0)\n'
        '        self.assertEqual(result.verdict, "review-required")\n'
        '        self.assertEqual(result.status, "blocked")\n'
        '        self.assertEqual(result.reaction, "")\n\n'
        '    def test_directory_events_are_combined(self) -> None:\n'
        '        with tempfile.TemporaryDirectory() as directory:\n'
        '            root = Path(directory)\n'
        '            payloads = [\n'
        '                {"status": "completed", "head_sha": "b" * 40, "summary": "chunk 1", "findings": []},\n'
        '                {\n'
        '                    "status": "completed",\n'
        '                    "head_sha": "b" * 40,\n'
        '                    "summary": "chunk 2",\n'
        '                    "findings": [\n'
        '                        {\n'
        '                            "severity": "minor",\n'
        '                            "file": "src/app.py",\n'
        '                            "line": 10,\n'
        '                            "scenario": "scenario",\n'
        '                            "impact": "impact",\n'
        '                            "fix": "fix",\n'
        '                            "confidence": 0.95,\n'
        '                        }\n'
        '                    ],\n'
        '                },\n'
        '            ]\n'
        '            for index, payload in enumerate(payloads, start=1):\n'
        '                event = {"type": "text", "part": {"text": json.dumps(payload, ensure_ascii=False)}}\n'
        '                (root / f"opencode-events-{index:03d}.jsonl").write_text(\n'
        '                    json.dumps(event, ensure_ascii=False) + "\\n", encoding="utf-8"\n'
        '                )\n'
        '            result = ai_review.finalize_result(self.scope(), root, 0)\n'
        '        self.assertEqual(result.verdict, "findings")\n'
        '        self.assertEqual(len(result.findings), 1)\n'
        '        self.assertIn("chunk 1", result.summary)\n'
        '        self.assertIn("chunk 2", result.summary)\n\n'
        '    def test_finding_outside_changed_hunk_is_dropped',
        label="result stability tests",
    )

    TESTS.write_text(text, encoding="utf-8")


def patch_workflow() -> None:
    text = WORKFLOW.read_text(encoding="utf-8")
    text = replace_once(text, "    timeout-minutes: 30\n", "    timeout-minutes: 45\n", label="review timeout")

    old_run = '''        run: |
          set +e
          opencode run \\
            --format json \\
            --model opencode/big-pickle \\
            --agent plan \\
            --no-share \\
            --file "$AI_REVIEW_DIR/review.diff" \\
            < "$AI_REVIEW_DIR/prompt.txt" \\
            > "$AI_REVIEW_DIR/opencode-events.jsonl" \\
            2> "$AI_REVIEW_DIR/opencode.stderr"
          exit_code=$?
          set -e
          echo "exit_code=$exit_code" >> "$GITHUB_OUTPUT"
          if (( exit_code != 0 )); then
            echo "::warning::OpenCode exited with code ${exit_code}."
          fi
'''
    new_run = '''        run: |
          set +e
          exit_code=0
          shopt -s nullglob
          prompts=("$AI_REVIEW_DIR"/prompt-*.txt)
          if (( ${#prompts[@]} == 0 )); then
            echo "::error::Reviewer scope did not produce any prompt chunks."
            exit_code=2
          else
            for prompt in "${prompts[@]}"; do
              suffix="${prompt##*/prompt-}"
              suffix="${suffix%.txt}"
              diff="$AI_REVIEW_DIR/review-${suffix}.diff"
              events="$AI_REVIEW_DIR/opencode-events-${suffix}.jsonl"
              stderr="$AI_REVIEW_DIR/opencode-${suffix}.stderr"
              echo "Running AI review chunk ${suffix} of ${#prompts[@]}."
              opencode run \\
                --format json \\
                --model opencode/big-pickle \\
                --agent plan \\
                --no-share \\
                --file "$diff" \\
                < "$prompt" \\
                > "$events" \\
                2> "$stderr"
              chunk_exit=$?
              if (( chunk_exit != 0 )); then
                exit_code=$chunk_exit
                break
              fi
            done
          fi
          set -e
          echo "exit_code=$exit_code" >> "$GITHUB_OUTPUT"
          if (( exit_code != 0 )); then
            echo "::warning::OpenCode exited with code ${exit_code}."
          fi
'''
    text = replace_once(text, old_run, new_run, label="chunked OpenCode loop")
    text = replace_once(
        text,
        '              --events "$AI_REVIEW_DIR/opencode-events.jsonl" \\\n',
        '              --events "$AI_REVIEW_DIR" \\\n',
        label="events directory",
    )
    WORKFLOW.write_text(text, encoding="utf-8")


def main() -> None:
    patch_ai_review()
    patch_tests()
    patch_workflow()
    print("AI reviewer stability patch applied")


if __name__ == "__main__":
    main()
