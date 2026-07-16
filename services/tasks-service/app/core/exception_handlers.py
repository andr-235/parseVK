"""Global exception handlers for tasks-service.

Maps domain task exceptions and unhandled errors to JSON responses.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.modules.tasks.exceptions import TaskConflictError, TaskError, TaskNotFoundError

logger = logging.getLogger(__name__)


def _task_error_handler(request: Request, exc: TaskError) -> JSONResponse:
    """Map task domain exceptions to HTTP status codes.

    Args:
        request: The incoming FastAPI request.
        exc: A domain exception raised from the tasks module.

    Returns:
        JSON response with the appropriate HTTP status code.
    """
    logger.warning("Domain exception: %s", exc, exc_info=True)
    if isinstance(exc, TaskNotFoundError):
        return JSONResponse(status_code=404, content={"detail": str(exc)})
    if isinstance(exc, TaskConflictError):
        return JSONResponse(status_code=409, content={"detail": str(exc)})
    return JSONResponse(status_code=500, content={"detail": "Internal task error"})


def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return a generic 500 response for unhandled exceptions.

    Args:
        request: The incoming FastAPI request.
        exc: The unhandled exception that was raised.

    Returns:
        JSON response with status 500 and the exception type.
    """
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register task domain and fallback exception handlers on the app.

    Args:
        app: The FastAPI application instance.
    """
    app.add_exception_handler(TaskError, _task_error_handler)
    app.add_exception_handler(Exception, _unhandled_exception_handler)
