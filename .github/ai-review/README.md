# AI Code Review

Reviewer анализирует Pull Request моделью `opencode/big-pickle`, но модель не имеет прав публиковать что-либо в GitHub.

## Архитектура

Контур разделён на шесть частей:

1. `prepare` удаляет прежнюю реакцию бота и ставит `👀`.
2. `review` имеет только `contents: read`, запускает OpenCode и сохраняет валидированный `review-result.json` как artifact.
3. `verdict` скачивает artifact внутри исходного workflow и формирует только красный или зелёный check. У job нет прав записи в Pull Request и Issue.
4. `status` сверяет текущий `head_sha` и заменяет `👀` на реакцию валидированного verdict: `👍`, `😕`, `👎` либо отсутствие реакции для `unavailable`.
5. `AI Review Inline Publisher` запускается через `workflow_run`, читает artifact и является единственным владельцем GitHub review и inline-комментариев.
6. `cleanup` при закрытии Pull Request удаляет служебные реакции и оставшийся legacy-вывод.

Сырой JSON модели не публикуется и не попадает в уведомления GitHub.

## Область анализа

Reviewer пропускает:

- Markdown, README и `docs/**`;
- изображения и PDF;
- `.github/workflows/ai-code-review.yml`;
- `.github/ai-review/**`;
- `.github/scripts/ai_review*`, которые проверяются unit-тестами.

Анализ делится максимум на четыре chunk. На один chunk допускается до 20 файлов и 2000 изменённых строк. Весь PR ограничен 80 файлами и 8000 изменённых строк. Более крупный PR получает verdict `review-required` и требует ручного ревью.

## Инструкции AGENTS.md

Перед запуском OpenCode доверенный helper загружает применимые `AGENTS.md` только из `base`-коммита:

- корневой файл действует на весь репозиторий;
- вложенный файл действует на своё поддерево;
- более глубокие инструкции имеют приоритет;
- версия из `head` PR не используется.

Инструкции не могут расширить diff, включить запрещённые инструменты или изменить JSON-контракт reviewer.

## Проверка findings

Детерминированный Python-код проверяет:

- JSON-схему и точный `head_sha`;
- severity и confidence;
- принадлежность файла текущему diff;
- привязку строки к изменённому hunk;
- допустимость file-level finding;
- длину и безопасность текста.

Пороги:

- `blocker`: `confidence >= 0.90`, блокирует PR;
- `major`: `confidence >= 0.85`, блокирует PR;
- `minor`: `confidence >= 0.90`, check остаётся зелёным.

## Статус и публикация

Producer-workflow публикует реакцию сразу после валидации результата:

- `approved`: `👍`, review не создаётся;
- `findings`: `😕`, check остаётся зелёным;
- `changes-required`: `👎`, source check красный;
- `review-required`: `😕`, source check красный;
- `unavailable`: служебный `👀` удаляется, финальная реакция не ставится, PR не блокируется.

Status-job работает только для текущего `head_sha`, удаляет предыдущие реакции `github-actions[bot]` и ставит не более одной итоговой реакции.

Default-branch publisher работает идемпотентно по `head_sha` и публикует только review-контент:

- для `findings` и `changes-required` создаёт структурированные inline-комментарии;
- для `review-required` создаёт summary review без выдуманных findings;
- для `approved` и `unavailable` review не создаёт.

Новые Issue по findings не создаются. Старые legacy-комментарии и связанные Issue закрываются во время миграционной очистки.

## Безопасность

- reviewer запускается только для PR владельца репозитория;
- fork и Dependabot не получают secrets;
- model job не имеет прав записи;
- verdict job имеет только `actions: read` и `contents: read`;
- status job имеет только `actions: read` и `pull-requests: write`, сверяет текущий HEAD и изменяет только реакции своего бота;
- review publisher берётся из default branch;
- `GITHUB_TOKEN` не передаётся OpenCode;
- проектный `opencode.json` отключён;
- shell, edit, task, todo, LSP и внешний интернет модели запрещены;
- OpenCode installer закреплён на версии `1.17.7`.

## Тесты

```bash
PYTHONPATH=.github/scripts \
python -m unittest discover -s .github/scripts -p 'test_ai_review*.py' -v
```

Inline publisher дополнительно проверяется Ruff и статическими contract-тестами обоих workflow.
