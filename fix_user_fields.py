import sqlite3
import os

# Get the database path from environment or use the default
database_path = os.getenv("DATABASE_PATH", "app.db")

print(f"Checking database: {database_path}")

# Connect to the database
conn = sqlite3.connect(database_path)
cursor = conn.cursor()

# Check the columns in the users table
cursor.execute("PRAGMA table_info(users)")
columns = [column[1] for column in cursor.fetchall()]

# Check if we need to add is_active column
if "is_active" not in columns:
    print("Adding 'is_active' column to 'users' table...")
    try:
        # Add is_active column with default value True
        cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")
        conn.commit()
        print("Added 'is_active' column successfully.")
    except sqlite3.Error as e:
        print(f"Error adding 'is_active' column: {e}")
        conn.rollback()
else:
    print("The 'is_active' column already exists.")

# Check if there's a disabled column that needs to be reconciled
if "disabled" in columns:
    print("Found 'disabled' column. Reconciling with 'is_active'...")
    try:
        # Update is_active based on disabled value (is_active is the opposite of disabled)
        cursor.execute("UPDATE users SET is_active = NOT disabled")
        conn.commit()
        print("Reconciled 'disabled' and 'is_active' fields.")
    except sqlite3.Error as e:
        print(f"Error reconciling fields: {e}")
        conn.rollback()

# Close the connection
conn.close()
print("Database field check completed.") 