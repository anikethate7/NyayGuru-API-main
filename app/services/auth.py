from datetime import datetime, timedelta
from uuid import uuid4
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
import time
import redis

from app.config import settings
from app.models.schemas import TokenData, User, UserCreate, UserInDB, RateLimitData
from app.database import get_db, User as DBUser

# Setup password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Setup OAuth2 with Password flow
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

# Setup Redis for rate limiting (if configured)
redis_client = None
if settings.REDIS_URL:
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
    except:
        pass

# Create an optional OAuth2 scheme that doesn't require authentication
class OAuth2PasswordBearerOptional(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> Optional[str]:
        try:
            return await super().__call__(request)
        except HTTPException:
            return None

# Create the optional scheme
oauth2_scheme_optional = OAuth2PasswordBearerOptional(tokenUrl="api/auth/token")

# Password functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    try:
        print(f"Verifying password: plain length={len(plain_password)}, hash length={len(hashed_password)}")
        result = pwd_context.verify(plain_password, hashed_password)
        print(f"Password verification result: {result}")
        return result
    except Exception as e:
        print(f"Error in password verification: {str(e)}")
        return False

def get_password_hash(password: str) -> str:
    """Generate a password hash."""
    return pwd_context.hash(password)

# Token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a new JWT access token."""
    to_encode = data.copy()
    
    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt

# Database operations
def get_user_by_username(db: Session, username: str) -> Optional[DBUser]:
    """Get a user by username."""
    return db.query(DBUser).filter(DBUser.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[DBUser]:
    """Get a user by email."""
    return db.query(DBUser).filter(DBUser.email == email).first()

def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user."""
    try:
        # Check if user already exists
        existing_user = get_user_by_email(db, email=user.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if username already exists
        existing_username = get_user_by_username(db, username=user.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = DBUser(
            id=str(uuid4()),
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            hashed_password=hashed_password,
            created_at=datetime.utcnow()
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Convert to response model
        return User(
            id=db_user.id,
            username=db_user.username,
            email=db_user.email,
            full_name=db_user.full_name,
            is_active=db_user.is_active
        )
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

def authenticate_user(db: Session, username: str, password: str) -> Optional[DBUser]:
    """Authenticate a user."""
    try:
        # First try to get user by username
        print(f"Attempting to authenticate user: {username}")
        user = get_user_by_username(db, username=username)
        print(f"User found by username: {user is not None}")
        
        # If not found, try by email (allowing login with either username or email)
        if not user:
            print(f"Trying to find user by email: {username}")
            user = get_user_by_email(db, email=username)
            print(f"User found by email: {user is not None}")
            
        if not user:
            print("No user found")
            return None
            
        print(f"Verifying password")
        if not verify_password(password, user.hashed_password):
            print("Password verification failed")
            return None
            
        if not user.is_active:
            print("User is not active")
            return None
        
        print("Authentication successful, updating last login time")
        # Update last login time
        user.last_login = datetime.utcnow()
        db.commit()
        
        return user
    except Exception as e:
        db.rollback()
        print(f"Error authenticating user: {str(e)}")
        return None

# Dependency functions
async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    
    return User(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active
    )

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Add a new function for optional authentication
async def get_current_user_optional(token: str = Depends(oauth2_scheme_optional)):
    if token is None:
        # Return None if no token provided - this will allow public access
        return None
    
    try:
        return await get_current_user(token)
    except:
        # If token is invalid, return None instead of raising an exception
        return None

# Rate limiting
def check_rate_limit(client_id: str, limit: int = settings.RATE_LIMIT_PER_MINUTE) -> bool:
    """
    Check if a client has exceeded their rate limit.
    Returns True if limit not exceeded, False otherwise.
    """
    if not redis_client:
        return True  # If Redis not available, skip rate limiting
    
    # Get current time
    current_time = time.time()
    minute_window = int(current_time / 60)
    
    # Get rate limit data
    rate_key = f"rate:{client_id}:{minute_window}"
    current_count = redis_client.get(rate_key)
    
    # If no data or expired window, reset
    if current_count is None:
        redis_client.set(rate_key, 1, ex=90)  # 90 seconds expiration (1.5 minutes)
        return True
    
    # Check if limit exceeded
    if int(current_count) >= limit:
        return False
    
    # Increment count and return
    redis_client.incr(rate_key)
    return True