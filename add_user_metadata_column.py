import sqlite3
import os

# Get the database path from environment or use the default
database_path = os.getenv("DATABASE_PATH", "app.db")

print(f"Updating database: {database_path}")

# Connect to the database
conn = sqlite3.connect(database_path)
cursor = conn.cursor()

# Check the columns in the users table
cursor.execute("PRAGMA table_info(users)")
columns = [column[1] for column in cursor.fetchall()]

# Check if we need to add user_metadata column
if "user_metadata" not in columns:
    print("Adding 'user_metadata' column to 'users' table...")
    try:
        # Add user_metadata column with default value NULL
        cursor.execute("ALTER TABLE users ADD COLUMN user_metadata TEXT")
        conn.commit()
        print("Added 'user_metadata' column successfully.")
    except sqlite3.Error as e:
        print(f"Error adding 'user_metadata' column: {e}")
        conn.rollback()
else:
    print("The 'user_metadata' column already exists.")

# Close the connection
conn.close()
print("Database update completed.") 