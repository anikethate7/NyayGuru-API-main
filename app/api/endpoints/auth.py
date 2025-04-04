from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from uuid import uuid4
import requests
import json

from app.config import settings
from app.models.schemas import Token, User, UserCreate
from app.services.auth import (
    create_user, 
    authenticate_user, 
    create_access_token, 
    get_current_active_user,
    check_rate_limit
)
from app.database import get_db, User as DBUser

router = APIRouter()

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    user_create: UserCreate, 
    db: Session = Depends(get_db)
):
    """Register a new user."""
    # Check rate limit
    client_ip = request.client.host
    if not check_rate_limit(client_ip, limit=10):  # Stricter limit for registrations
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later."
        )
    
    # Create user
    return create_user(db, user_create)

@router.post("/token", response_model=Token)
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """Authenticate a user and generate access token."""
    # Check rate limit
    client_ip = request.client.host
    if not check_rate_limit(client_ip, limit=10):  # Stricter limit for login attempts
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )
    
    # Log the input for debugging
    print(f"Login attempt with username: {form_data.username}")
    
    # Attempt to authenticate with direct database access
    try:
        # Get user directly from database
        user = db.query(DBUser).filter(DBUser.username == form_data.username).first()
        
        if not user:
            # Try email as fallback
            user = db.query(DBUser).filter(DBUser.email == form_data.username).first()
        
        if not user:
            print(f"No user found with username: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password directly
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_matched = pwd_context.verify(form_data.password, user.hashed_password)
        print(f"Password verification result: {password_matched}")
        
        if not password_matched:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            print(f"User is not active: {user.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Update last login time
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Generate access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username},
            expires_delta=access_token_expires
        )
        
        return Token(access_token=access_token, token_type="bearer")
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error and return generic error
        print(f"Error during authentication: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication",
        )

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get current user information."""
    # Get user from database to access user_metadata
    user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prepare the base response
    response_data = {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name or "",
        "is_active": current_user.is_active,
        "status": "active"
    }
    
    # Add custom fields from user_metadata if available
    if user.user_metadata:
        try:
            metadata = json.loads(user.user_metadata)
            for key, value in metadata.items():
                response_data[key] = value
        except Exception as e:
            print(f"Error parsing user metadata: {str(e)}")
    
    return response_data

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_active_user)):
    """Refresh the access token."""
    # Generate a new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.username},
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")

@router.get("/test", status_code=status.HTTP_200_OK)
async def test_endpoint():
    """Test endpoint to check if auth API is working."""
    return {"message": "Auth API is working!"}

@router.post("/login-test")
async def login_test(username: str, password: str, db: Session = Depends(get_db)):
    """Test endpoint for login debugging."""
    print(f"Test login with username: {username}, password: {password}")
    
    # Get user directly from database
    user = db.query(DBUser).filter(DBUser.username == username).first()
    
    if not user:
        print(f"No user found with username: {username}")
        return {"success": False, "message": "User not found"}
    
    # Get stored password hash
    stored_hash = user.hashed_password
    print(f"Found user with hash: {stored_hash}")
    
    # Try to verify password
    try:
        # Direct comparison for the test endpoint only
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        is_valid = pwd_context.verify(password, stored_hash)
        print(f"Password verification result: {is_valid}")
        
        if is_valid:
            # Generate a token on successful verification
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user.username},
                expires_delta=access_token_expires
            )
            return {
                "success": True,
                "access_token": access_token,
                "token_type": "bearer"
            }
        else:
            return {"success": False, "message": "Invalid password"}
    except Exception as e:
        print(f"Error verifying password: {str(e)}")
        return {"success": False, "message": f"Error: {str(e)}"}

@router.post("/google-login", response_model=Token)
async def google_login(
    request: Request,
    data: dict,
    db: Session = Depends(get_db)
):
    """Authenticate a user with Google OAuth token and generate access token."""
    # Check rate limit
    client_ip = request.client.host
    if not check_rate_limit(client_ip, limit=10):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )
    
    try:
        # Get the token from the request
        token = data.get("token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing token",
            )
        
        # Verify the token with Google
        google_response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        )
        
        if google_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Extract user info from Google response
        google_data = google_response.json()
        email = google_data.get("email")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in Google token",
            )
        
        # Check if user exists
        user = db.query(DBUser).filter(DBUser.email == email).first()
        
        if not user:
            # Create a new user
            name_parts = google_data.get("name", "Google User").split()
            first_name = name_parts[0] if name_parts else "Google"
            last_name = name_parts[-1] if len(name_parts) > 1 else "User"
            
            user_create = UserCreate(
                username=email.split('@')[0] + str(uuid4().hex)[:8],
                email=email,
                password=uuid4().hex,  # Random password since they'll use Google to login
                full_name=google_data.get("name", f"{first_name} {last_name}")
            )
            
            user = create_user(db, user_create)
        
        # Update last login time - safely handle this to avoid errors
        try:
            user.last_login = datetime.utcnow()
            db.commit()
        except Exception as e:
            print(f"Warning: Could not update last_login: {str(e)}")
            db.rollback()  # Roll back the failed transaction
        
        # Generate access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username},
            expires_delta=access_token_expires
        )
        
        # Map the is_active field to disabled for the response
        disabled = not getattr(user, "is_active", True)
        
        return Token(
            access_token=access_token, 
            token_type="bearer",
            user={
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name or "",
                "disabled": disabled,
                "status": "active"
            }
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error and return generic error
        print(f"Error during Google authentication: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during Google authentication: {str(e)}",
        )

@router.put("/profile", response_model=User)
async def update_user_profile(
    request: Request,
    profile_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user profile information."""
    try:
        # Get user from database
        user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # Update the fields that are provided
        if "full_name" in profile_data:
            user.full_name = profile_data["full_name"]
        
        if "email" in profile_data and profile_data["email"] != current_user.email:
            # Check if email already exists
            existing_email = db.query(DBUser).filter(
                DBUser.email == profile_data["email"], 
                DBUser.id != current_user.id
            ).first()
            
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )
            
            user.email = profile_data["email"]
        
        # Store additional custom fields as a JSON string in user_metadata
        custom_fields = {}
        for key, value in profile_data.items():
            if key not in ["full_name", "email", "username"]:
                custom_fields[key] = value
        
        # Update the user_metadata if custom fields exist
        if custom_fields:
            try:
                # If user_metadata already exists, update it
                if user.user_metadata:
                    existing_metadata = json.loads(user.user_metadata)
                    existing_metadata.update(custom_fields)
                    user.user_metadata = json.dumps(existing_metadata)
                else:
                    # Otherwise create new metadata
                    user.user_metadata = json.dumps(custom_fields)
            except Exception as e:
                print(f"Error updating user metadata: {str(e)}")
                # Continue even if metadata update fails
        
        # Save changes to database
        db.commit()
        db.refresh(user)
        
        # Prepare the response including custom fields
        response_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name or "",
            "is_active": user.is_active,
            "status": "active"
        }
        
        # Add custom fields to response if available
        if user.user_metadata:
            try:
                metadata = json.loads(user.user_metadata)
                for key, value in metadata.items():
                    response_data[key] = value
            except Exception as e:
                print(f"Error parsing user metadata: {str(e)}")
        
        return response_data
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Roll back on error
        db.rollback()
        print(f"Error updating profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}",
        )