from pathlib import Path

path = Path(".github/scripts/ai_review.py")
text = path.read_text(encoding="utf-8")
old = """9. Используй только severity blocker, major или minor.
10. Верни строго один JSON-объект без Markdown и текста до или после.
"""
new = """9. Используй только severity blocker, major или minor.
10. Прямое противоречие между изменённой реализацией и явным именем функции, docstring, invariant или return contract классифицируй как major correctness-дефект с confidence не ниже 0.95.
11. Верни строго один JSON-объект без Markdown и текста до или после.
"""
if text.count(old) != 1:
    raise RuntimeError(f"expected exactly one prompt rules block, found {text.count(old)}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
