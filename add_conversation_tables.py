import sqlite3
from datetime import datetime
from uuid import uuid4

# Define the database file path
DB_PATH = "app.db"

def run_migration():
    """
    Run migration to add conversation and message tables.
    """
    print(f"Starting migration on database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # First check what tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"Existing tables: {', '.join([t[0] for t in tables]) if tables else 'None'}")
        
        # Check if database is empty
        if not tables:
            print("Database appears to be empty. Creating users table first...")
            # Create a minimal users table if it doesn't exist
            cursor.execute('''
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                full_name TEXT,
                hashed_password TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                user_metadata TEXT
            )
            ''')
            print("Users table created.")
            
        # Check if the conversations table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("Creating conversations table...")
            # Create conversations table
            cursor.execute('''
            CREATE TABLE conversations (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                session_id TEXT UNIQUE NOT NULL,
                title TEXT,
                category TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
            ''')
            
            # Create index on user_id for faster queries
            cursor.execute('''
            CREATE INDEX idx_conversations_user_id ON conversations (user_id)
            ''')
            
            # Create index on session_id for faster queries
            cursor.execute('''
            CREATE INDEX idx_conversations_session_id ON conversations (session_id)
            ''')
            
            print("Conversations table created successfully!")
        else:
            print("Conversations table already exists, skipping...")
            
        # Check if the messages table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("Creating messages table...")
            # Create messages table
            cursor.execute('''
            CREATE TABLE messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
            )
            ''')
            
            # Create index on conversation_id for faster queries
            cursor.execute('''
            CREATE INDEX idx_messages_conversation_id ON messages (conversation_id)
            ''')
            
            print("Messages table created successfully!")
        else:
            print("Messages table already exists, skipping...")
        
        # Create a test conversation if there are users
        cursor.execute("SELECT id FROM users LIMIT 1")
        user = cursor.fetchone()
        if user:
            user_id = user[0]
            print(f"Creating a test conversation for user: {user_id}")
            
            # Create a test conversation
            conv_id = str(uuid4())
            session_id = str(uuid4())
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute('''
            INSERT INTO conversations (id, user_id, session_id, title, category, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (conv_id, user_id, session_id, "Test Conversation", "Criminal Law", now, now))
            
            # Add test messages
            cursor.execute('''
            INSERT INTO messages (conversation_id, role, content, timestamp)
            VALUES (?, ?, ?, ?)
            ''', (conv_id, "user", "What is the punishment for theft?", now))
            
            cursor.execute('''
            INSERT INTO messages (conversation_id, role, content, timestamp)
            VALUES (?, ?, ?, ?)
            ''', (conv_id, "assistant", "The punishment for theft in India depends on the value of the stolen property and other factors. Under Section 379 of the Indian Penal Code, theft is generally punishable with imprisonment up to 3 years, or fine, or both.", now))
            
            print("Test conversation and messages created successfully!")
            
        conn.commit()
        print("Migration completed successfully!")
        
        # Verify tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"Tables after migration: {', '.join([t[0] for t in tables])}")
        
    except Exception as e:
        conn.rollback()
        print(f"Error during migration: {str(e)}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration() 