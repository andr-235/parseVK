# AI Code Review

Reviewer анализирует Pull Request моделью `opencode/big-pickle`, но модель не имеет прав публиковать что-либо в GitHub.

## Архитектура

Контур разделён на шесть частей:

1. `prepare` удаляет прежнюю реакцию бота и ставит `👀`.
2. `review` имеет только `contents: read`, запускает OpenCode и сохраняет валидированный `review-result.json` как artifact.
3. `verdict` скачивает artifact внутри исходного workflow и формирует только красный или зелёный check. У job нет прав записи в Pull Request и Issue.
4. `finalize_progress` после завершения producer-run сверяет текущий `head_sha` и удаляет только временную реакцию `👀`. Финальный verdict этот job не публикует.
5. `AI Review Inline Publisher` запускается через `workflow_run`, читает artifact и является единственным владельцем финальных реакций и GitHub review.
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

## Публикация

Финальный publisher работает идемпотентно по `head_sha`:

- `approved`: ставит `👍`, review и Issue не создаются;
- `findings`: ставит `😕` и публикует структурированный inline review, check остаётся зелёным;
- `changes-required`: ставит `👎`, публикует inline review, source check красный;
- `review-required`: ставит `😕`, публикует summary review, source check красный;
- `unavailable`: финальная реакция и ложный verdict не публикуются, PR не блокируется.

Временная реакция `👀` снимается producer-run независимо от результата artifact и publisher. Если run уже устарел относительно текущего HEAD, он не изменяет реакцию более нового запуска.

Новые Issue по findings не создаются. Старые legacy-комментарии и связанные Issue закрываются во время миграционной очистки.

## Безопасность

- reviewer запускается только для PR владельца репозитория;
- fork и Dependabot не получают secrets;
- model job не имеет прав записи;
- verdict job имеет только `actions: read` и `contents: read`;
- progress-cleanup имеет только `pull-requests: write`, сверяет текущий HEAD и удаляет исключительно `👀` своего бота;
- финальный publisher берётся из default branch;
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
