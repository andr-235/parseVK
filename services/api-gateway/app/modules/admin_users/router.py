from fastapi import APIRouter, Depends, Request, Response

from app.modules.admin_users.service import AdminUsersGatewayService, get_admin_users_gateway_service

router = APIRouter(prefix="/api/v1/admin/users", tags=["admin-users"])


@router.post("")
async def create_user(
    payload: dict,
    request: Request,
    service: AdminUsersGatewayService = Depends(get_admin_users_gateway_service),
):
    return await service.forward(request, "POST", "/internal/admin/users", json=payload)


@router.get("")
async def list_users(
    request: Request,
    service: AdminUsersGatewayService = Depends(get_admin_users_gateway_service),
):
    return await service.forward(request, "GET", "/internal/admin/users")


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    request: Request,
    service: AdminUsersGatewayService = Depends(get_admin_users_gateway_service),
):
    await service.forward(request, "DELETE", f"/internal/admin/users/{user_id}")
    return Response(status_code=204)


@router.post("/{user_id}/set-temporary-password")
async def set_temporary_password(
    user_id: str,
    request: Request,
    service: AdminUsersGatewayService = Depends(get_admin_users_gateway_service),
):
    return await service.forward(request, "POST", f"/internal/admin/users/{user_id}/set-temporary-password")


@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: str,
    request: Request,
    service: AdminUsersGatewayService = Depends(get_admin_users_gateway_service),
):
    return await service.forward(request, "POST", f"/internal/admin/users/{user_id}/reset-password")
