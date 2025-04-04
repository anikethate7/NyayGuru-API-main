from fastapi import APIRouter

from app.api.endpoints import chat, categories, auth
from app.api.endpoints import auth_direct, documents
from app.config import settings

# Create main API router
api_router = APIRouter()

# Include authentication routers
# Use auth_direct for the standard auth endpoints
api_router.include_router(auth_direct.router, prefix="/auth", tags=["Authentication"])

# Use auth for the Google login endpoint only
# We'll prefix it with /auth-google so it doesn't conflict with auth_direct
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Include specific endpoint routers
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])

# Dynamically create category-specific routes
category_router = APIRouter()
for category in settings.LEGAL_CATEGORIES:
    # Create a route for each category
    normalized_category = category.lower().replace(" ", "-")
    api_router.include_router(
        chat.router,
        prefix=f"/{normalized_category}",
        tags=[f"{category}"]
    )