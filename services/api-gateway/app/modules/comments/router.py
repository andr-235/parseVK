from fastapi import APIRouter, Depends, Request

from app.core.security import require_auth
from app.modules.comments.service import CommentsGatewayService, get_comments_gateway_service

router = APIRouter(prefix="/api/v1/comments", tags=["comments"], dependencies=[Depends(require_auth)])


@router.get("")
async def list_comments(request: Request, service: CommentsGatewayService = Depends(get_comments_gateway_service)):
    return await service.get_comments(dict(request.query_params))


@router.get("/cursor")
async def list_comments_cursor(request: Request, service: CommentsGatewayService = Depends(get_comments_gateway_service)):
    return await service.get_comments_cursor(dict(request.query_params))


@router.patch("/{id}/read")
async def update_read_status(
    id: int,
    request: Request,
    service: CommentsGatewayService = Depends(get_comments_gateway_service),
):
    payload = await request.json()
    return await service.patch_read_status(id, payload)
