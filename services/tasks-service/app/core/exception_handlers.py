import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.modules.tasks.exceptions import TaskConflictError, TaskError, TaskNotFoundError

logger = logging.getLogger(__name__)


def _task_error_handler(request: Request, exc: TaskError) -> JSONResponse:
    logger.warning("Domain exception: %s", exc, exc_info=True)
    if isinstance(exc, TaskNotFoundError):
        return JSONResponse(status_code=404, content={"detail": str(exc)})
    if isinstance(exc, TaskConflictError):
        return JSONResponse(status_code=409, content={"detail": str(exc)})
    return JSONResponse(status_code=500, content={"detail": "Internal task error"})


def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(TaskError, _task_error_handler)
    app.add_exception_handler(Exception, _unhandled_exception_handler)
