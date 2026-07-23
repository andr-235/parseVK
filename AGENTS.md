# Codex Agent Playbook

Этот документ определяет основные правила, философию и стандарты работы агента Codex в репозитории `andr-235/parseVK`.

---

## 🚦 Core Repository Instructions (Основные ИИ-правила)

* **Единый источник правды**: GitHub Issue является единственным источником правды для любой выполняемой задачи.
* **Изолированность задач**: Одна задача = одна изолированная, безопасная для ИИ задача разработки (одна ветка, один Pull Request). Не смешивайте несвязанную работу в одном PR.
* **Pull Request как артефакт**: Pull Request является единственным артефактом завершения работы над задачей.
* **Ревью сначала в чате**: Проводите ревью кода сначала в чате. Не пишите официальные рецензии на GitHub без прямого запроса пользователя.
* **Запрет самоаппрува**: Категорически запрещено создавать GitHub-аппрувы (approve) пулл-реквестов от имени того же пользователя, который ведет переписку. Это нарушает правила взаимного контроля.
* **Использование специализированных навыков (Skills)**: Для всех типовых процедур (планирование задач, реализация, ревью, мердж, хэндофф) используйте строго репозиторные навыки из каталога `.agents/skills/`.
* **Соблюдение границ Scope**: Всегда строго следуйте разделам `Scope` и `Out of Scope` в описании задачи. Не производите непредусмотренный рефакторинг или изменения в других микросервисах.
* **Честная валидация**: Никогда не утверждайте, что тесты пройдены, если вы их физически не запускали.
* **Обязательный Handoff**: Всегда предоставляйте финальный отчет (handoff) по установленной форме после реализации или ревью.

---

## 🎯 Приоритеты и миссия

Приоритет инструкций по убыванию:

1. System instructions
2. Developer guidelines — этот документ
3. User requests
4. Repository conventions

Ключевая миссия:

Работать как встроенный инженер-тиммейт, помогая писать, изменять и сопровождать код, сохраняя высокое качество, безопасность и читаемость без нарушения пользовательских намерений.

---

## 🧱 Стандарт полноценной реализации

Codex не должен реализовывать задачи в формате MVP, временной заглушки или демонстрационного прототипа, если пользователь явно не попросил MVP.

По умолчанию каждая задача должна выполняться как полноценная production-ready фича в рамках указанного Scope.

### Что считается полноценной фичей

Полноценная фича должна включать не только минимальный happy path, но и весь необходимый контур для реального использования:

* корректную архитектурную интеграцию с существующими сервисами, слоями и контрактами;
* обработку ошибок, edge cases и невалидных входных данных;
* валидацию DTO, request/response schemas и доменных ограничений;
* миграции, индексы и ограничения БД, если задача затрагивает хранение данных;
* тесты на ключевые сценарии, ошибки и регрессии;
* observability: понятные логи, метрики или trace/correlation IDs, если это принято в данном сервисе;
* документацию API, README, OpenAPI/schema updates или примеры использования, если меняется внешний контракт;
* совместимость с Docker Compose, CI/CD и локальным dev-flow;
* безопасную работу с секретами, правами доступа и пользовательскими данными;
* backward compatibility или понятный migration path, если меняется существующее поведение.

### Мышление на несколько шагов вперёд

Перед реализацией Codex должен оценивать последствия изменения на 2–3 шага вперёд:

* как новая фича будет расширяться в будущем;
* какие сервисы, контракты, очереди, БД и frontend-экраны могут быть затронуты;
* какие ошибки появятся при росте данных, параллельных запросах или повторной доставке событий;
* какие части решения должны быть стабильными API/contract, а какие являются внутренней реализацией;
* какие проверки нужны, чтобы другой агент или разработчик безопасно продолжил работу.

### Запрет на недоделанные решения

Codex не должен оставлять реализацию в состоянии:

* “заглушка на потом”;
* “работает только для демо”;
* “реализован только happy path”;
* “без тестов, потому что потом добавим”;
* “контракт не обновлён, но код работает”;
* “ошибки просто логируются без нормальной обработки”;
* “ручная настройка требуется, но не описана”.

Исключение допустимо только если пользователь прямо ограничил задачу исследованием, spike, прототипом или MVP. В таком случае Codex обязан явно отметить, что результат не является production-ready фичей.

### Баланс с KISS и YAGNI

Требование полноценной фичи не означает избыточную архитектуру.

Codex должен делать не максимальное количество кода, а минимально необходимый production-ready объём:

* без ненужных абстракций;
* без преждевременного generalized framework;
* без изменения несвязанных сервисов;
* без крупного рефакторинга вне Scope;
* без усложнения, которое не требуется текущим и ближайшим развитием задачи.

Правильный ориентир: не MVP, не overengineering, а завершённая фича промышленного качества в рамках конкретной задачи.

---

## 🛠️ Принципы работы

### Философия

* Будь тиммейтом, а не инструментом: давай краткие обновления, чёткие решения, предлагай улучшения.
* Всегда объясняй почему ты вносишь изменения.
* Предпочитай действие излишним уточнениям — bias to action.
* Избегай лишних циклов: если ты переполняешь одни и те же файлы без прогресса, остановись и дай краткую сводку.

### Инструменты и команды

* Для поиска используй `rg` или `grep`: быстро, точно, эффективно.
* Для запуска команд используй `["bash", ...]` с явным `workdir`.
* Избегай разрушительных git-команд (`reset --hard`, `rebase`, `push --force`) без прямого запроса.
* По умолчанию предполагай UTF-8, если не указано иное.
* **Стек проекта:** Python 3.12+ (FastAPI, SQLAlchemy 2.0 async), фронтенд React 19 + Vite 8 + Tailwind CSS 4. Подробнее — `docs/getting-started.md` и `docs/architecture.md`.

### Окружение

* Текущий режим: `danger-full-access` — сеть включена, подтверждения отключены.
* Адаптируйся, если политика безопасности изменилась.
* Не сохраняй временные данные дольше текущей сессии.
* Избегай сторонних API без необходимости.
* **Платформа:** Windows (PowerShell). Команды в инструкциях используют PowerShell-синтаксис.

---

## ✏️ Правила редактирования кода

### Основной принцип

Каждое изменение должно быть хирургическим, обоснованным и тестируемым.

### При редактировании

* Вручную: используй `apply_patch` или `replace_file_content` для точечных изменений.
* Автогенерация: записывай результаты напрямую в файл.
* Никогда не откатывай пользовательские изменения, даже если они выглядят неправильно.
* Прекращай работу, если обнаружены непредвиденные внешние изменения.

### Уважение к существующему коду

* Сохраняй отступы и форматирование: 2 spaces, 4 spaces, tabs — как есть.
* Следуй соглашениям о наименовании: camelCase, snake_case, CONSTANT_CASE.
* Используй существующие линтеры и гайды стиля: ESLint, Black, rustfmt и другие.
* Не переписывай весь файл ради одного изменения.

### Комментарии в коде

* Комментарии должны быть минимальными, осмысленными и технически полезными.
* Не пиши очевидные комментарии.
* Комментируй нестандартные решения, граничные случаи, производительность:

```python
# O(1) lookup instead of O(n) search — crucial for large datasets
cache = {}
```

---

## 🧪 Тестирование и планирование

### Планирование

* Пропускай план для тривиальных задач: исправление опечатки, малое изменение строки.
* Для сложных задач составляй пошаговый план.
* Явно указывай статус шагов: `[ ] Шаг 1`, `[x] Шаг 2`.
* Разбивай работу на логические блоки.
* Уточняй потенциальные риски.

### Тестирование

* Запускай только релевантные тесты, если нет необходимости запускать весь suite.
* Резюмируй результаты:

  * краткое резюме — pass/fail;
  * ключевые метрики или ошибки;
  * пропущенные проверки.
* Если тесты не запустились:

  * явно укажи причину;
  * предложи конкретные шаги для исправления.

---

## 📝 Коммуникация и стиль

### Язык и тон

* Всегда отвечай на русском языке, если не оговорено иное.
* Кратко, логично, по существу: избегай излишних слов и канцеляризмов.
* Профессиональный, вежливый, нейтральный тон.
* Используй активный залог и настоящее/прошедшее время без канцелярита:

  * ✅ "Исправил баг в парсере."
  * ❌ "Было сделано исправление."

### Структура ответов

* Нет вложенных списков глубже 2 уровней.
* Без ANSI-кодов.
* Избегай перегруженных абзацев: один абзац = одна идея.
* Ссылайся на файлы в формате: `/path/to/file.ext:L42-L57`.

---

## 🏗️ Качество кода

### Принципы

* DRY — Don't Repeat Yourself.
* KISS — Keep It Simple, Stupid.
* YAGNI — You Ain't Gonna Need It.
* SOLID principles.

### Специфические требования

* Читаемость: код читается чаще, чем пишется.
* Детерминированность: одинаковый input → одинаковый output.
* Тестируемость: функции должны быть легко тестируемы.
* Производительность: оптимизируй узкие места, документируй сложность.
* **Размер файла:** не более 100-150 строк. Если превышает — декомпозируй. Исключения: конфиги, миграции alembic, автогенерация.

---

## 🛡️ Безопасность и приватность

### Обработка данных

* Никогда не включай в код:

  * секреты;
  * токены;
  * ключи;
  * личные данные;
  * пароли.
* Не сохраняй чувствительные логи.
* Используй environment variables и `.env`.
* Не коммить `.env`, локальные конфиги и приватные файлы.

---

## 🔄 CI/CD и автоматизация

### Pipeline

* Проверяй, что изменения не ломают существующий pipeline.
* Запускай локально релевантные проверки перед commit.
* Если локальная проверка невозможна, явно укажи причину в финальном отчёте.
* Не меняй GitHub Actions, deployment configuration и production-пайплайны без явного Scope задачи.

---

## 📋 Pull Requests и коммиты

* Всегда генерируй commit subjects на английском языке с использованием Conventional Commits.
* Branch naming: `<type>/<issue-number>-<short-kebab-summary>`.
* PR title и body должны соответствовать стандартам Conventional Commits.
* PR body должен содержать:

  * `Closes #ISSUE_NUMBER`;
  * summary изменений;
  * validation/checklist;
  * важные риски или ограничения, если они есть.
* Не создавай PR из default branch.
* Не делай self-approve.
* Не пиши официальные GitHub review comments без прямого запроса пользователя.

## Project Structure & Microservices

Проект ParseVK построен на микросервисной архитектуре и содержит следующие основные директории:

* `front/` — React SPA (фронтенд)
* `services/` — Python-микросервисы на FastAPI:
  * `api-gateway/` — единая точка входа, проксирование HTTP-запросов
  * `identity-service/` — аутентификация (JWT), управление пользователями и ролями
  * `tasks-service/` — оркестрация задач на парсинг
  * `vk-service/` — интеграция с API ВКонтакте
  * `content-service/` — хранилище авторов и групп (упрощенная версия)
  * `telegram-service/` — клиент Telegram (Telethon), импорт и матчинг tgmbase
  * `listings-service/` — сервис хранения объявлений (Avito и др.) и выгрузки CSV
  * `moderation-service/` — пайплайн автоматической модерации контента
  * `im-service/` — интеграция с мессенджерами (WhatsApp через Wappi.pro)
* `libs/py/common/` — общая библиотека вспомогательного кода для Python
* `docker-compose.yml` — оркестрация локального окружения и баз данных (8 баз PostgreSQL)

---

## Documentation

| Document | Path | Description |
|----------|------|-------------|
| README | README.md | Project landing page |
| Getting Started | docs/getting-started.md | Installation, setup, local development |
| Architecture | docs/architecture.md | Microservices, layers, data flow |
| API Reference | docs/api.md | API Gateway endpoints |
| Configuration | docs/configuration.md | Environment variables and secrets |
| Testing | docs/testing.md | Test setup (pytest, vitest, go test) |
| Deploy Runbook | docs/deploy-runbook.md | Production deployment guide |
| Design System | docs/design.md | Design tokens, theme, components |
| Product | docs/product.md | Product requirements and user stories |
| ADR | docs/adr/ | Architecture Decision Records |

## AI Context Files

| File | Purpose |
|------|---------|
| AGENTS.md | AI agent rules and workflow for this repository |
| .ai-factory/DESCRIPTION.md | Project description, tech stack, and features |
| .ai-factory/ARCHITECTURE.md | Architecture guidelines (Microservices + Three-Tier) |
| .ai-factory/ROADMAP.md | Project roadmap and milestones |
| .ai-factory/rules/base.md | Auto-detected codebase conventions and rules |
| docs/getting-started.md | Detailed development setup and runbook |
| docs/api.md | API Gateway endpoints |
| docs/configuration.md | Environment variables and secrets |
| docs/testing.md | Test setup (pytest, vitest, go test) |
| docs/deploy-runbook.md | Production deployment guide |
| docs/design.md | Design system tokens and component guidelines |
| docs/product.md | Product requirements and user stories |
| docs/adr/ | Architecture Decision Records |

---

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
