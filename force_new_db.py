import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from uuid import uuid4
from passlib.context import CryptContext

# Create new database path
DB_PATH = "./new_app.db"

# Create new engine with the new database path
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define User model
from sqlalchemy import Column, String, Boolean, DateTime
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

# Password utilities
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_database_and_user():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print(f"Created new database at {DB_PATH}")
    
    # Create a database session
    db = SessionLocal()
    
    try:
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
        print(f"Password: password123")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating test user: {str(e)}")
    finally:
        db.close()

    print("\nPlease update app/config.py to use this new database path:")
    print(f'DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///{DB_PATH}")')

if __name__ == "__main__":
    create_database_and_user() 