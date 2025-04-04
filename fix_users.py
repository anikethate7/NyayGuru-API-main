import sqlite3

def fix_users():
    # Connect to the database
    conn = sqlite3.connect('./new_app.db')
    cursor = conn.cursor()
    
    # First, let's see all users
    cursor.execute("SELECT id, username, email, is_active FROM users")
    users = cursor.fetchall()
    
    print("Current users in database:")
    for user in users:
        print(f"ID: {user[0]}, Username: {user[1]}, Email: {user[2]}, Active: {user[3]}")
    
    # Update all users to be active
    cursor.execute("UPDATE users SET is_active = 1")
    
    # Verify the changes
    cursor.execute("SELECT id, username, email, is_active FROM users")
    users = cursor.fetchall()
    
    print("\nUsers after update:")
    for user in users:
        print(f"ID: {user[0]}, Username: {user[1]}, Email: {user[2]}, Active: {user[3]}")
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    
    print("\nUser records updated successfully.")

if __name__ == "__main__":
    fix_users() 