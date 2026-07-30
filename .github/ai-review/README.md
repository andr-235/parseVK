# AI Code Review

Reviewer анализирует новые commits Pull Request моделью `opencode/big-pickle`. Модель не имеет прав публиковать что-либо в GitHub.

## Архитектура

Контур разделён на семь частей:

1. `prepare` удаляет прежнюю реакцию бота и ставит `👀`.
2. `plan` определяет commits текущего события и формирует matrix с парами `parent_sha → commit_sha`.
3. `review` запускается отдельно для каждого commit, строит только его diff и сохраняет валидированный JSON.
4. `verdict` агрегирует результаты commits текущего запуска и формирует красный или зелёный check.
5. `status` сверяет текущий HEAD и заменяет `👀` на итоговую реакцию batch: `👍`, `😕` или `👎`.
6. `AI Review Inline Publisher` запускается через `workflow_run` и публикует отдельный GitHub review для каждого проверенного commit.
7. `cleanup` при закрытии Pull Request удаляет служебные реакции и оставшийся legacy-вывод.

Сырой JSON модели не публикуется и не попадает в уведомления GitHub.

## Выбор commits

Reviewer не пересматривает весь накопленный PR при каждом push:

- `opened`, `reopened`, `ready_for_review`: проверяет текущую цепочку commits после merge-base с `base`;
- `synchronize`: если прежний HEAD является предком нового, проверяет только commits из диапазона `before..head`;
- force-push: игнорирует старую цепочку и заново строит актуальный список от текущего merge-base;
- каждый commit анализируется как diff его первого родителя к самому commit;
- один запуск ограничен 50 commits; более крупный batch получает `review-required`.

Быстрый следующий push не отменяет уже начатое commit-review. Старый batch может опубликовать результат, если проверенный commit по-прежнему входит в PR. Commit, удалённый force-push, не публикуется.

## Область анализа commit

Reviewer пропускает:

- Markdown, README и `docs/**`;
- изображения и PDF;
- `.github/workflows/ai-code-review.yml`;
- `.github/ai-review/**`;
- `.github/scripts/ai_review*`, которые проверяются unit-тестами.

Один commit делится максимум на четыре chunk. На chunk допускается до 20 файлов и 2000 изменённых строк. Один commit ограничен 80 файлами и 8000 изменённых строк. Превышение требует ручного ревью только этого commit.

До четырёх commit-review jobs выполняются параллельно. Каждый job получает отдельный scope, отдельный набор prompt-файлов и отдельный вызов модели.

## Инструкции AGENTS.md

Перед запуском OpenCode доверенный helper загружает применимые `AGENTS.md` только из `base`-коммита Pull Request:

- корневой файл действует на весь репозиторий;
- вложенный файл действует на своё поддерево;
- более глубокие инструкции имеют приоритет;
- версия из `head` PR не используется.

Инструкции не могут расширить commit diff, включить запрещённые инструменты или изменить JSON-контракт reviewer.

## Проверка findings

Детерминированный Python-код проверяет:

- JSON-схему и точный SHA проверяемого commit;
- severity и confidence;
- принадлежность файла diff этого commit;
- привязку строки к изменённому hunk;
- допустимость file-level finding;
- длину и безопасность текста.

Пороги:

- `blocker`: `confidence >= 0.90`, блокирует batch;
- `major`: `confidence >= 0.85`, блокирует batch;
- `minor`: `confidence >= 0.90`, check остаётся зелёным.

## Итог batch

Результаты commits агрегируются по приоритету:

1. `changes-required`;
2. `review-required`;
3. `findings`;
4. `unavailable`;
5. `approved`.

Producer-workflow публикует одну реакцию для текущего HEAD:

- `approved`: `👍`;
- `findings`: `😕`, check остаётся зелёным;
- `changes-required`: `👎`, check красный;
- `review-required`: `😕`, check красный;
- `unavailable`: `😕`, техническая недоступность не блокирует PR.

Status-job не меняет реакцию, если за время анализа HEAD уже обновился.

## Публикация review

Default-branch publisher работает идемпотентно по SHA каждого commit:

- `findings` и `changes-required`: отдельный review с inline-комментариями;
- `review-required`: отдельный summary review без выдуманных findings;
- `approved` и `unavailable`: review-комментарий не создаётся;
- тело review явно содержит `Проверен commit <sha>`;
- commit, которого больше нет в PR, безопасно пропускается;
- повторный workflow не создаёт второй review для того же SHA.

Новые Issue по findings не создаются. Старые legacy-комментарии и связанные Issue закрываются во время миграционной очистки.

## Безопасность

- reviewer запускается только для PR владельца репозитория;
- fork и Dependabot не получают secrets;
- model job не имеет прав записи;
- commit planner и aggregator берутся из доверенного `base`;
- verdict job имеет только `actions: read` и `contents: read`;
- status job изменяет только реакции `github-actions[bot]` и проверяет текущий HEAD;
- review publisher берётся из default branch;
- publisher перед публикацией получает полный пагинированный список commits PR;
- `GITHUB_TOKEN` не передаётся OpenCode;
- проектный `opencode.json` отключён;
- shell, edit, task, todo, LSP и внешний интернет модели запрещены;
- OpenCode installer закреплён на версии `1.17.7`.

## Тесты

```bash
PYTHONPATH=.github/scripts \
python -m unittest discover -s .github/scripts -p 'test_ai_review*.py' -v
```

Publisher и batch helpers дополнительно проверяются Ruff и статическими contract-тестами обоих workflow.
