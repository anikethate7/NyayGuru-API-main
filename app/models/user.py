from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserBase(BaseModel):
    """Base user model with common attributes."""
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """User creation model with password."""
    password: str = Field(..., min_length=8)


class UserInDB(UserBase):
    """User model as stored in the database."""
    id: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    last_login: Optional[datetime] = None


class User(UserBase):
    """User model returned to clients (without sensitive data)."""
    id: str
    is_active: bool = True
    created_at: datetime


class UserLogin(BaseModel):
    """User login model."""
    email: EmailStr
    password: str