# AI Code Review

Автоматическое ревью Pull Request через официальный OpenCode GitHub Action.

## Как работает

1. Workflow запускается при открытии PR и каждом новом commit.
2. На PR ставится реакция `eyes`.
3. Workflow создаёт или переиспользует одно Issue вида `[AI Review] PR #N: ...`.
4. `anomalyco/opencode/github@v1.17.7` анализирует PR моделью `opencode/big-pickle`.
5. OpenCode читает `rules.md`, обновляет существующий Issue и выставляет один итоговый label.
6. Отдельный детерминированный шаг проверяет label:
   - `ai-review:changes-required` завершает job ошибкой;
   - `ai-review:approved` завершает job успешно и закрывает Issue;
   - отсутствие однозначного результата переводит Issue в `ai-review:manual-review` и завершает job ошибкой.

## Секрет

В Actions secrets репозитория должен быть задан:

```text
OPENCODE_API_KEY
```

## Модель

Для OpenCode Zen модель задаётся в формате `provider/model`:

```text
opencode/big-pickle
```

## Правила ревью

Проектные требования находятся в `rules.md`. Дополнительно агент читает `docs/architecture.md`.

## Ограничения

- Draft PR не анализируются.
- PR из внешних fork не анализируются, потому что repository secrets им не передаются.
- OpenCode имеет `contents: read`, поэтому reviewer не может менять код или создавать commits.
- Сессия OpenCode не публикуется (`share: false`).

После стабилизации workflow `AI Code Review` следует добавить в обязательные status checks ветки `main`.
