# Design Doc: Keywords Domain Migration (FASTAPI-MIG-005)

## Overview

Домен ключевых слов (keywords) отвечает за:
- Управление списком ключевых слов и фраз (CRUD);
- Автоматический морфологический анализ русских слов для генерации словоформ;
- Управление ручными словоформами и исключениями для каждого ключевого слова;
- Анализ текстов комментариев и постов из VK на совпадение с ключевыми словами/словоформами;
- Обновление поля `matched_keywords` в комментариях для фильтрации в модераторском интерфейсе.

Данный документ фиксирует перенос домена из legacy NestJS на FastAPI.

---

## 1. Service Boundary & Ownership

В качестве целевой архитектуры выбрано размещение домена `keywords` внутри **`moderation-service`**.

### Rationale
1. **Тесная связь данных**: Таблица `moderation_comments` с полем `matched_keywords` хранится в базе данных `moderation-db` микросервиса `moderation-service`. Пересчет совпадений (recalculation) и фильтрация комментариев происходят непосредственно на этих данных. Размещение keywords in `moderation-service` позволяет выполнять пересчет через локальные транзакции БД без необходимости гонять мегабайты текстов комментариев по сети.
2. **Снижение сложности**: Нам не требуется создавать отдельный микросервис `keywords-service`, что упрощает деплой, CI/CD и снижает накладные расходы на инфраструктуру.

### Endpoints Map & Paths
- **Public API Gateway**: Принимает запросы на `/api/v1/keywords/*`, выполняет проверку авторизации (`require_auth`) и проксирует их во внутреннюю сеть на `moderation-service`.
  - Маршрут пересчета совпадений: `POST /api/v1/keywords/recalculate-matches`
- **Internal API**: `moderation-service` предоставляет эндпоинты `/internal/moderation/keywords/*`, защищенные внутренним токеном безопасности (`require_internal_token`).
  - Внутренний запуск пересчета: `POST /internal/moderation/keywords/recalculate-matches`
  - Статус пересчета: `GET /internal/moderation/keywords/recalculation-jobs/{id}`

---

## 2. Data Ownership & Schema

Все данные домена keywords переносятся в базу данных `moderation-db`. 

### SQLAlchemy Models & DDL

```python
class Keyword(Base):
    __tablename__ = "keywords"

    id = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    word = mapped_column(String(255), nullable=False, unique=True, index=True)
    category = mapped_column(String(255), nullable=True)
    is_phrase = mapped_column(Boolean, nullable=False, default=False)
    created_at = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


class KeywordForm(Base):
    __tablename__ = "keyword_forms"
    __table_args__ = (
        UniqueConstraint("keyword_id", "form", "source", name="uq_keyword_forms_keyword_form_source"),
    )

    id = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    keyword_id = mapped_column(BigInteger, ForeignKey("keywords.id", ondelete="CASCADE"), nullable=False)
    form = mapped_column(String(255), nullable=False, index=True)
    source = mapped_column(String(32), nullable=False)  # "generated" | "manual"
    created_at = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class KeywordFormExclusion(Base):
    __tablename__ = "keyword_form_exclusions"
    __table_args__ = (
        UniqueConstraint("keyword_id", "form", name="uq_keyword_form_exclusions_keyword_form"),
    )

    id = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    keyword_id = mapped_column(BigInteger, ForeignKey("keywords.id", ondelete="CASCADE"), nullable=False)
    form = mapped_column(String(255), nullable=False, index=True)
    created_at = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class KeywordRecalculationJob(Base):
    __tablename__ = "keyword_recalculation_jobs"

    id = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    status = mapped_column(String(32), nullable=False, default="pending")  # "pending" | "running" | "succeeded" | "failed"
    started_at = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at = mapped_column(DateTime(timezone=True), nullable=True)
    error = mapped_column(Text, nullable=True)
    requested_by = mapped_column(String(255), nullable=True)
    created_at = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
```

---

## 3. Read/Write Model & Recalculation

### Write Path
1. Пользователь добавляет/изменяет ключевое слово или управляет его формами.
2. Сервис обновляет записи в `keywords`, `keyword_forms` и `keyword_form_exclusions`.
3. Для измененного ключевого слова автоматически запускается **синхронизация форм** (генерация новых форм через `pymorphy3` за вычетом исключений).
4. Запускается локальный пересчет совпадений для конкретного измененного слова через фоновую задачу.

### Persistent Recalculation Job Model & Resiliency
Для предотвращения блокировки HTTP-запросов и обеспечения надежности пересчет совпадений ключевых слов (как глобальный, так и для отдельного слова) является персистентным фоновым процессом:
- Эндпоинт `POST /keywords/recalculate-matches` не блокирует API и мгновенно возвращает статус/ID задачи в БД.
- **Защита от параллельного запуска (Single Active Job Constraint)**: Перед стартом проверяется наличие активной задачи (`pending` или `running`). Если активная задача существует, новая не создается, а возвращается текущая активная задача.
- **Восстановление зависших задач (Stale Jobs Recovery)**: При старте `moderation-service` (или перед созданием новой задачи) автоматически детектируются зависшие задачи в статусе `running` (выполняющиеся дольше таймаута, например, 15 минут). Такие задачи переводятся в статус `failed` с текстом ошибки: `"Job timed out or process crashed"`.
- Пересчет выполняется асинхронно в фоне с использованием блокировки на уровне базы данных (DB Lock), гарантируя идемпотентность и исключая race conditions.
- Алгоритм пересчета:
  1. Задача переводится в статус `running`, фиксируется `started_at`.
  2. Выбираются все активные ключевые слова и их формы, строится структура кандидатов (с учетом фраз и одиночных слов).
  3. Батчами по 1000 записей вычитываются все комментарии из `moderation_comments`.
  4. Тексты комментариев нормализуются (приведение к нижнему регистру, замена `ё` -> `е`, очистка от лишних символов).
  5. С помощью скомпилированных регулярных выражений проверяются совпадения (с учетом границ слов `\b` / `(?<!...)` для фраз и слов).
  6. Поле `matched_keywords` обновляется в базе данных для каждого комментария, где изменился набор совпадений.
  7. При успешном окончании задача переходит в статус `succeeded`, фиксируется `finished_at`. При ошибке записывается статус `failed` и текст ошибки в поле `error`.

---

## 4. Frontend & Comments Integration (Projection & keywordSource)

### DTO Compatibility
Существующий фронтенд ожидает список совпавших ключевых слов в комментариях в виде объектов:
```typescript
interface IMatchedKeyword {
  id: number;
  word: string;
  category: string;
}
```
Однако в базе данных `moderation-service` комментарии хранят плоский JSONB-массив строк `matched_keywords: ["слово1", "слово2"]`.
Чтобы полностью сохранить обратную совместимость, API Gateway в своем маппере комментариев преобразует плоский массив строк в формат, ожидаемый фронтендом:
```python
"matchedKeywords": [
    {"id": 0, "word": w, "category": "auto"}
    for w in item.get("matched_keywords", [])
]
```

### keywordSource compatibility
Поскольку в базе данных `moderation_comments.matched_keywords` остается плоским JSONB-списком строк, фильтр `keywordSource` остается документированным no-op совместимости.

---

## 5. Fallback & Rollback Plan

1. **Обратная совместимость БД**: Перенос домена не удаляет старые таблицы из NestJS (Prisma) базы данных сразу. Они остаются нетронутыми.
2. **Переключение роутинга**: Переключение на новый бэкенд осуществляется за счет подключения роутов `/api/v1/keywords` в API Gateway.
3. **Откат**: В случае непредвиденных проблем на продакшене роуты `/api/v1/keywords` в API Gateway могут быть временно перенаправлены на старый NestJS бэкенд (fallback proxy) изменением одной строки конфигурации роутера.
