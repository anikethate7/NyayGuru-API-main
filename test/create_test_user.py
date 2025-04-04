from uuid import uuid4
from datetime import datetime
from passlib.context import CryptContext
from app.database import SessionLocal, User

# Create password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_test_user():
    # Create a database session
    db = SessionLocal()
    
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.username == "testuser").first()
        if existing_user:
            print("Test user already exists!")
            return
        
        # Create new test user
        hashed_password = get_password_hash("password123")
        
        # Create the user object
        new_user = User(
            id=str(uuid4()),
            username="testuser",
            email="test@example.com",
            full_name="Test User",
            hashed_password=hashed_password,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        # Add to database
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"Test user created successfully with id: {new_user.id}")
        print(f"Username: testuser, Email: test@example.com")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating test user: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user() 