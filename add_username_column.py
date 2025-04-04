import sqlite3
import os

# Get the database path from environment or use the default
database_path = os.getenv("DATABASE_PATH", "app.db")

print(f"Migrating database: {database_path}")

# Connect to the database
conn = sqlite3.connect(database_path)
cursor = conn.cursor()

# Check if the username column already exists
cursor.execute("PRAGMA table_info(users)")
columns = [column[1] for column in cursor.fetchall()]

if "username" not in columns:
    print("Adding 'username' column to 'users' table...")
    
    # Add the username column, using email as the default value for existing users
    try:
        # First try adding the column
        cursor.execute("ALTER TABLE users ADD COLUMN username TEXT")
        
        # Then update existing rows to set username = email for backward compatibility
        cursor.execute("UPDATE users SET username = email")
        
        # Commit the changes
        conn.commit()
        print("Migration successful!")
    except sqlite3.Error as e:
        print(f"Error during migration: {e}")
        conn.rollback()
else:
    print("The 'username' column already exists in the 'users' table.")

# Close the connection
conn.close() 