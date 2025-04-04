import sqlite3
from datetime import datetime

# Define the database file path
DB_PATH = "app.db"

def check_conversations():
    """Check the conversation data in the database."""
    conn = sqlite3.connect(DB_PATH)
    # Enable row factory to get results as dictionaries
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Get all conversations
        print("Conversations:")
        cursor.execute("""
        SELECT c.id, c.user_id, c.session_id, c.title, c.category, c.created_at, c.updated_at, u.username
        FROM conversations c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.updated_at DESC
        """)
        
        conversations = cursor.fetchall()
        for conv in conversations:
            print(f"\nConversation ID: {conv['id']}")
            print(f"Title: {conv['title']}")
            print(f"Category: {conv['category']}")
            print(f"User: {conv['username']} (ID: {conv['user_id']})")
            print(f"Session ID: {conv['session_id']}")
            print(f"Created: {conv['created_at']}")
            print(f"Updated: {conv['updated_at']}")
            
            # Get messages for this conversation
            cursor.execute("""
            SELECT id, role, content, timestamp
            FROM messages
            WHERE conversation_id = ?
            ORDER BY timestamp
            """, (conv['id'],))
            
            messages = cursor.fetchall()
            print(f"Messages ({len(messages)}):")
            for msg in messages:
                print(f"  [{msg['role']}] {msg['content'][:50]}..." if len(msg['content']) > 50 else f"  [{msg['role']}] {msg['content']}")
                
        if not conversations:
            print("No conversations found.")
                
    except Exception as e:
        print(f"Error checking conversations: {str(e)}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_conversations() 