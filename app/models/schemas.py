from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, EmailStr
from uuid import UUID
from datetime import datetime


class Message(BaseModel):
    """Chat message model."""
    role: str
    content: str


class ChatRequest(BaseModel):
    """Chat request model."""
    query: str = Field(..., description="User's question")
    category: str = Field(..., description="Legal category")
    language: str = Field("English", description="Response language")
    session_id: str = Field(..., description="Unique session identifier")
    messages: Optional[List[Dict[str, Any]]] = Field(None, description="Previous messages in the conversation")


class ChatResponse(BaseModel):
    """Chat response model."""
    answer: str = Field(..., description="Answer to the user's question")
    sources: List[str] = Field([], description="Sources of information")
    conversation_id: Optional[str] = Field("unknown", description="Unique conversation identifier")
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp of the response")
    suggested_questions: List[str] = Field([], description="Suggested follow-up questions")
    message_type: str = Field("answer", description="Type of message (answer, greeting, error, suggestion)")


class CategoryResponse(BaseModel):
    """Category response model."""
    categories: List[str] = Field(..., description="Available legal categories")


class LanguageResponse(BaseModel):
    """Language response model."""
    languages: Dict[str, str] = Field(..., description="Available languages with their codes")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field("ok", description="API status")
    version: str = Field(..., description="API version")


# Authentication models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None


class TokenData(BaseModel):
    username: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserInDB(UserBase):
    hashed_password: str
    disabled: bool = False


class User(UserBase):
    id: str
    is_active: bool = True
    last_login: Optional[datetime] = None
    
    class Config:
        from_orm = True
        # Allow arbitrary additional fields from custom user metadata
        extra = "allow"


# Rate limiting model
class RateLimitData(BaseModel):
    count: int = 0
    last_reset: float = 0.0
    
# Document Analysis models
class DocumentAnalysisRequest(BaseModel):
    """Document analysis request model."""
    document_name: str = Field(..., description="Name of the uploaded document")
    document_type: str = Field(..., description="Type of legal document")
    language: str = Field("English", description="Document language")

class DocumentAnalysisResponse(BaseModel):
    """Document analysis response model."""
    summary: str = Field(..., description="Summary of the document")
    key_points: List[str] = Field(..., description="Key points extracted from the document")
    suggestions: List[str] = Field(..., description="Legal suggestions based on the document")
    document_name: str = Field(..., description="Name of the analyzed document")

# Conversation History models
class MessageResponse(BaseModel):
    """Message response model for history retrieval."""
    id: int
    role: str
    content: str
    timestamp: datetime
    
    class Config:
        orm_mode = True

class ConversationResponse(BaseModel):
    """Conversation response model."""
    id: str
    session_id: str
    title: str
    category: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class ConversationDetailResponse(ConversationResponse):
    """Conversation detail response model with messages."""
    messages: List[MessageResponse]
    
    class Config:
        orm_mode = True

class ConversationListResponse(BaseModel):
    """Response model for listing user conversations."""
    conversations: List[ConversationResponse]
    total: int
    
    class Config:
        orm_mode = True