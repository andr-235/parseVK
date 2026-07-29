from pathlib import Path

path = Path('.github/workflows/ai-code-review.yml')
text = path.read_text(encoding='utf-8')

old = '''                  ((.body | contains($marker)) or
                   (.body | contains("<!-- ai-review-result:")))
'''
new = '''                  ((.body | contains($marker)) or
                   (.body | contains("<!-- ai-review-result:")) or
                   (.body | contains("[github run](")))
'''

count = text.count(old)
if count != 1:
    raise SystemExit(f'Expected one cleanup filter, got {count}')

path.write_text(text.replace(old, new), encoding='utf-8')
