import os
import sqlite3
import jwt
from datetime import datetime, timedelta
from uuid import uuid4
from passlib.context import CryptContext
import json

# Setup password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuration
SECRET_KEY = "mysecretkey"  # Should match app/config.py SECRET_KEY
ALGORITHM = "HS256"          # Should match app/config.py ALGORITHM
TOKEN_EXPIRE_MINUTES = 30    # Should match app/config.py ACCESS_TOKEN_EXPIRE_MINUTES
DB_PATH = "./new_app.db"     # Should match the path in app/config.py

# User model
class User:
    def __init__(self, id, username, email, full_name, is_active=True, created_at=None, last_login=None):
        self.id = id
        self.username = username
        self.email = email
        self.full_name = full_name
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow()
        self.last_login = last_login

# Password functions
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Token functions
def create_access_token(data, expires_delta=None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

# Database functions
def create_tables():
    """Create database tables if they don't exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        full_name TEXT,
        hashed_password TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        last_login TEXT
    )
    ''')
    
    conn.commit()
    conn.close()
    print("Database tables created.")

def create_user(username, email, password, full_name=None):
    """Create a new user in the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, email))
    if cursor.fetchone():
        conn.close()
        print("User already exists.")
        return None
    
    # Generate a new user ID and password hash
    user_id = str(uuid4())
    hashed_password = get_password_hash(password)
    created_at = datetime.utcnow().isoformat()
    
    # Insert user with is_active=1
    cursor.execute(
        "INSERT INTO users (id, username, email, full_name, hashed_password, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (user_id, username, email, full_name, hashed_password, 1, created_at)
    )
    
    conn.commit()
    conn.close()
    
    print(f"User '{username}' created successfully.")
    return user_id

def get_user(username):
    """Get a user by username."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user_data = cursor.fetchone()
    
    conn.close()
    
    if not user_data:
        return None
    
    return {
        "id": user_data[0],
        "username": user_data[1],
        "email": user_data[2],
        "full_name": user_data[3],
        "hashed_password": user_data[4],
        "is_active": bool(user_data[5]),
        "created_at": user_data[6],
        "last_login": user_data[7]
    }

def authenticate_user(username, password):
    """Authenticate a user."""
    user = get_user(username)
    
    if not user:
        print(f"No user found with username: {username}")
        return None
    
    if not verify_password(password, user["hashed_password"]):
        print("Password verification failed.")
        return None
    
    if not user["is_active"]:
        print("User is not active.")
        return None
    
    # Update last login
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET last_login = ? WHERE username = ?",
        (datetime.utcnow().isoformat(), username)
    )
    conn.commit()
    conn.close()
    
    print(f"User '{username}' authenticated successfully.")
    return user

def login_user(username, password):
    """Login a user and generate access token."""
    user = authenticate_user(username, password)
    
    if not user:
        return {"success": False, "detail": "Incorrect username or password"}
    
    # Generate access token
    access_token_expires = timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]},
        expires_delta=access_token_expires
    )
    
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"]
        }
    }

def register_user(username, email, password, full_name=None):
    """Register a new user."""
    user_id = create_user(username, email, password, full_name)
    
    if not user_id:
        return {"success": False, "detail": "User already exists"}
    
    return {
        "success": True,
        "message": "User registered successfully",
        "user": {
            "id": user_id,
            "username": username,
            "email": email,
            "full_name": full_name
        }
    }

def main():
    """Main function to test auth functionality."""
    import sys
    
    # Ensure database tables exist
    create_tables()
    
    if len(sys.argv) < 2:
        print("Usage: python auth_solution.py [register|login|test]")
        return
    
    command = sys.argv[1]
    
    if command == "register":
        if len(sys.argv) < 5:
            print("Usage: python auth_solution.py register [username] [email] [password] [full_name]")
            return
        
        username = sys.argv[2]
        email = sys.argv[3]
        password = sys.argv[4]
        full_name = sys.argv[5] if len(sys.argv) > 5 else None
        
        result = register_user(username, email, password, full_name)
        print(json.dumps(result, indent=2))
    
    elif command == "login":
        if len(sys.argv) < 4:
            print("Usage: python auth_solution.py login [username] [password]")
            return
        
        username = sys.argv[2]
        password = sys.argv[3]
        
        result = login_user(username, password)
        print(json.dumps(result, indent=2))
    
    elif command == "test":
        # Test user creation and authentication
        test_username = "testuser123"
        test_email = "test123@example.com"
        test_password = "password123"
        
        print("Creating test user...")
        register_result = register_user(test_username, test_email, test_password, "Test User")
        print(json.dumps(register_result, indent=2))
        
        print("\nLogging in test user...")
        login_result = login_user(test_username, test_password)
        print(json.dumps(login_result, indent=2))
    
    else:
        print("Unknown command. Use 'register', 'login', or 'test'.")

if __name__ == "__main__":
    main() 