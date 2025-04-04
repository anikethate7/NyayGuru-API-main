from fastapi import APIRouter

from app.models.schemas import CategoryResponse, LanguageResponse
from app.config import settings

router = APIRouter()

@router.get("/", response_model=CategoryResponse)
async def get_categories():
    """Get all available legal categories."""
    return {"categories": settings.LEGAL_CATEGORIES}

@router.get("/languages", response_model=LanguageResponse)
async def get_languages():
    """Get all supported languages."""
    return {"languages": settings.SUPPORTED_LANGUAGES}