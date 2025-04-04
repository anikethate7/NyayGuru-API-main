import sqlite3

# Define the database file path
DB_PATH = "app.db"

def check_tables():
    """Check the database tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        print("Database tables:")
        for table in tables:
            print(f"- {table[0]}")
            
        # Check conversations table structure if it exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'")
        if cursor.fetchone():
            print("\nConversations table columns:")
            cursor.execute("PRAGMA table_info(conversations)")
            columns = cursor.fetchall()
            for col in columns:
                print(f"- {col[1]} ({col[2]})")
                
        # Check messages table structure if it exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'")
        if cursor.fetchone():
            print("\nMessages table columns:")
            cursor.execute("PRAGMA table_info(messages)")
            columns = cursor.fetchall()
            for col in columns:
                print(f"- {col[1]} ({col[2]})")
                
    except Exception as e:
        print(f"Error checking tables: {str(e)}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_tables() 