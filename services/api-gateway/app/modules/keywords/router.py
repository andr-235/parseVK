from app.modules.keywords.crud_router import crud_router
from app.modules.keywords.forms_router import forms_router
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/keywords", tags=["keywords"])
router.include_router(crud_router)
router.include_router(forms_router)
