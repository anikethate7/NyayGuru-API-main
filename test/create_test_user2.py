import sqlite3
from uuid import uuid4
from datetime import datetime
from passlib.context import CryptContext

# Password utilities
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_test_user():
    # Connect to the database
    conn = sqlite3.connect('./new_app.db')
    cursor = conn.cursor()
    
    # Generate a password hash
    password = "password123"
    hashed_password = pwd_context.hash(password)
    print(f"Generated password hash: {hashed_password}")
    
    # Create a unique ID
    user_id = str(uuid4())
    
    # Current timestamp
    now = datetime.utcnow().isoformat()
    
    # Create the user
    cursor.execute(
        "INSERT INTO users (id, username, email, full_name, hashed_password, is_active, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (user_id, "admin", "admin@example.com", "Admin User", hashed_password, 1, now)
    )
    
    # Commit and close
    conn.commit()
    conn.close()
    
    print(f"Created test user 'admin' with password '{password}'")
    print(f"User ID: {user_id}")

if __name__ == "__main__":
    create_test_user() 