<<<<<<< HEAD
from fastapi import APIRouter, Depends, Request, Response

from app.modules.tasks.service import TasksGatewayService, get_tasks_gateway_service
=======
from app.modules.tasks.service import TasksGatewayService, get_tasks_gateway_service
from fastapi import APIRouter, Depends, Request, Response
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.get("/automation/settings")
async def get_automation_settings(
    request: Request,
    service: TasksGatewayService = Depends(get_tasks_gateway_service),
):
    return await service.forward(request, "GET", "/internal/tasks/automation/settings")


@router.post("/automation/settings")
async def update_automation_settings(
    payload: dict,
    request: Request,
    service: TasksGatewayService = Depends(get_tasks_gateway_service),
):
    return await service.forward(request, "POST", "/internal/tasks/automation/settings", json=payload)


@router.post("/automation/run")
async def run_automation(
    request: Request,
    service: TasksGatewayService = Depends(get_tasks_gateway_service),
):
    return await service.forward(request, "POST", "/internal/tasks/automation/run")


@router.post("/parse")
async def create_parse_task(
    payload: dict,
    request: Request,
    service: TasksGatewayService = Depends(get_tasks_gateway_service),
):
    return await service.forward(request, "POST", "/internal/tasks/parse", json=payload)


@router.get("")
async def list_tasks(
    request: Request,
    service: TasksGatewayService = Depends(get_tasks_gateway_service),
):
    return await service.forward(request, "GET", "/internal/tasks", params=dict(request.query_params))


@router.get("/{task_id}")
async def get_task(
    task_id: int,
    request: Request,
    service: TasksGatewayService = Depends(get_tasks_gateway_service),
):
    return await service.forward(request, "GET", f"/internal/tasks/{task_id}")


@router.get("/{task_id}/audit-log")
async def get_audit_log(
    task_id: int,
    request: Request,
    service: TasksGatewayService = Depends(get_tasks_gateway_service),
):
    return await service.forward(request, "GET", f"/internal/tasks/{task_id}/audit-log")


@router.post("/{task_id}/resume")
async def resume_task(
    task_id: int,
    request: Request,
    service: TasksGatewayService = Depends(get_tasks_gateway_service),
):
    return await service.forward(request, "POST", f"/internal/tasks/{task_id}/resume")


@router.post("/{task_id}/check")
async def check_task(
    task_id: int,
    request: Request,
    service: TasksGatewayService = Depends(get_tasks_gateway_service),
):
    return await service.forward(request, "POST", f"/internal/tasks/{task_id}/check")


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: int,
    request: Request,
    service: TasksGatewayService = Depends(get_tasks_gateway_service),
):
    await service.forward(request, "DELETE", f"/internal/tasks/{task_id}")
    return Response(status_code=204)
