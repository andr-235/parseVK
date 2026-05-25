from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: str | None = None


class ErrorEnvelope(BaseModel):
    error: ErrorDetail
    request_id: str | None = None


def build_error(code: str, message: str, request_id: str | None = None) -> ErrorEnvelope:
    return ErrorEnvelope(error=ErrorDetail(code=code, message=message), request_id=request_id)
