from pathlib import Path

path = Path(__file__).with_name("ai_review.py")
text = path.read_text(encoding="utf-8")

replacements = {
    "from pathlib import Path, PurePosixPath\nfrom typing import Any, Iterable, Mapping, Sequence\n": (
        "from collections.abc import Iterable, Mapping, Sequence\n"
        "from pathlib import Path, PurePosixPath\n"
        "from typing import Any\n"
    ),
    'def from_mapping(cls, value: Mapping[str, Any]) -> "Finding":': (
        "def from_mapping(cls, value: Mapping[str, Any]) -> Finding:"
    ),
    'def from_file(cls, path: Path) -> "Scope":': "def from_file(cls, path: Path) -> Scope:",
    'def from_file(cls, path: Path) -> "FinalResult":': (
        "def from_file(cls, path: Path) -> FinalResult:"
    ),
    '''    completed = subprocess.run(
        ["git", *args],
        cwd=cwd,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
''': '''    completed = subprocess.run(  # noqa: S603 -- fixed executable with validated internal arguments
        ["/usr/bin/git", *args],
        cwd=cwd,
        check=True,
        text=True,
        capture_output=True,
    )
''',
}

for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"expected one match, found {count}: {old[:80]!r}")
    text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
