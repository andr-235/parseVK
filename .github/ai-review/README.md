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

- `opened`, `reopened`, `ready_for_review`: проверяет commits, достижимые из HEAD, но не достижимые из актуального `base`;
- `synchronize`: проверяет только новые commits и исключает commits актуальной базовой ветки;
- force-push: заново строит актуальный список относительно `base`;
- каждый обычный commit анализируется как diff его первого родителя к самому commit;
- PR с более чем 50 собственными commits сохраняет `review-required` до сокращения истории.

Быстрый следующий push не отменяет уже начатое commit-review. Commit, удалённый force-push, не публикуется.

## Область анализа commit

Reviewer пропускает Markdown, README, `docs/**`, изображения, PDF, собственный workflow и служебные скрипты reviewer. Один commit делится максимум на четыре chunk, до 20 файлов и 2000 изменённых строк в каждом. Общий предел commit составляет 80 файлов и 8000 изменённых строк.

## Инструкции AGENTS.md

`AGENTS.md` является единственным источником репозиторных правил reviewer. Доверенный helper загружает применимые файлы только из `base`-коммита Pull Request:

- корневой файл действует на весь репозиторий;
- вложенный файл действует на своё поддерево;
- более глубокие инструкции имеют приоритет;
- версия из `head` PR не используется.

Формализуемые требования не оставляются на усмотрение модели. Trusted enforcer также извлекается из immutable base и выполняет детерминированные проверки.

Для правила размера файла enforcer:

- извлекает верхнюю границу непосредственно из текста применимого `AGENTS.md`;
- не содержит отдельного зашитого лимита;
- применяет вложенное переопределение для соответствующего поддерева;
- учитывает исключения, прямо перечисленные в правиле: конфиги, Alembic-миграции и автогенерацию;
- проверяет только исходные файлы, изменённые текущим commit;
- создаёт `major` finding с `confidence=1.0`, фактическим числом строк, лимитом и источником правила;
- привязывает finding к изменённой строке и блокирует batch;
- не создаёт выдуманный лимит, если распознаваемого правила нет;
- сохраняет все нарушения в пределах общего scope до 80 файлов, без среза первых двадцати.

Enforcer записывает отдельный `agents-findings.json`. Trusted installer сохраняет исходный `ai_review.py` как core и устанавливает wrapper на прежний путь. Wrapper сначала выполняет обычный `finalize` или `fallback`, затем всегда объединяет обязательные findings с результатом. Поэтому сбой установки модели, ненулевой exit code или malformed output не могут скрыть нарушение `AGENTS.md`.

Детерминированные findings используют тот же JSON-контракт и тот же publisher, что и findings модели. Prompt запрещает модели дублировать уже выполненную проверку размера файла.

Инструкции не могут расширить commit diff, включить запрещённые инструменты или изменить JSON-контракт reviewer.

## Проверка findings

Детерминированный Python-код проверяет JSON-схему, точный SHA commit, severity, confidence, принадлежность файла diff, привязку к изменённому hunk, допустимость file-level finding и безопасность текста.

Пороги:

- `blocker`: `confidence >= 0.90`, блокирует batch;
- `major`: `confidence >= 0.85`, блокирует batch;
- `minor`: `confidence >= 0.90`, check остаётся зелёным.

## Итог batch

Приоритет результатов: `changes-required`, `review-required`, `findings`, `unavailable`, `approved`.

Producer-workflow публикует одну реакцию для текущего HEAD:

- `approved`: `👍`;
- `findings`: `😕`;
- `changes-required`: `👎`;
- `review-required`: `😕`;
- `unavailable`: `😕`.

Status-job не меняет реакцию, если за время анализа HEAD уже обновился.

## Публикация review

Default-branch publisher работает идемпотентно по SHA каждого commit. Findings публикуются отдельным review с inline-комментариями. `review-required` создаёт summary review. `approved` и `unavailable` не создают пустой комментарий. Commit, которого больше нет в PR, пропускается.

## Безопасность

- reviewer запускается только для PR владельца репозитория;
- fork и Dependabot не получают secrets;
- model job не имеет прав записи;
- commit planner, AGENTS helper, enforcer, installer, wrapper и merger берутся из доверенного `base`;
- review publisher берётся из default branch;
- `GITHUB_TOKEN` не передаётся OpenCode;
- проектный `opencode.json` отключён;
- shell, edit, task, todo, LSP и внешний интернет модели запрещены;
- artifact actions закреплены по SHA и работают на Node.js 24;
- OpenCode installer закреплён на версии `1.17.7`.

## Тесты

```bash
PYTHONPATH=.github/scripts \
python -m unittest discover -s .github/scripts -p 'test_ai_review*.py' -v
```

Publisher, AGENTS runtime и batch helpers дополнительно проверяются Ruff. Runtime-тест исполняет wrapper с недоступным core и подтверждает блокирующее объединение обязательных findings.
