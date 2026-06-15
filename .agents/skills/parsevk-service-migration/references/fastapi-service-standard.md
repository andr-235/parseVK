# Стандарт FastAPI-сервисов в parseVK

Любой новый или мигрированный микросервис на базе FastAPI должен соответствовать следующим стандартам архитектуры.

## 1. Структура каталога сервиса
```text
services/my-fastapi-service/
  app/
    __init__.py
    main.py             # Точка входа, инициализация FastAPI приложения
    config.py           # Конфигурация (Pydantic Settings)
    core/               # Бизнес-логика, не зависящая от веб-фреймворка
    api/                # Роуты и эндпоинты
      v1/
        endpoints.py
    schemas/            # Pydantic схемы (DTO) для API запросов и ответов
    models/             # SQLAlchemy или Tortoise ORM модели (БД)
  tests/                # Unit и интеграционные тесты (pytest)
  Dockerfile
  requirements.txt
```

## 2. Управление конфигурацией
- Используйте исключительно `pydantic-settings` для считывания переменных из `.env` файла и окружения.
- Запрещено напрямую вызывать `os.environ.get()` внутри бизнес-логики.
Пример:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    VK_API_VERSION: str = "5.131"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## 3. Обработка ошибок
- Все эндпоинты должны обрабатывать исключения и возвращать стандартные HTTP-ошибки через `HTTPException`.
- Логирование должно использовать стандартную конфигурацию логеров из `libs/`.
