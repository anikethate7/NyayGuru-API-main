import os
from app.database import engine, Base
from app.config import settings
import sqlite3

def recreate_database():
    # Get the database file path from the URL
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    
    # Check if database file exists and remove it
    if os.path.exists(db_path):
        print(f"Removing existing database: {db_path}")
        try:
            # Close any connections first
            conn = sqlite3.connect(db_path)
            conn.close()
            
            os.remove(db_path)
            print("Database file removed successfully")
        except Exception as e:
            print(f"Error removing database: {str(e)}")
    
    # Create new database with updated schema
    print("Creating new database with updated schema...")
    Base.metadata.create_all(bind=engine)
    print("Database recreated successfully!")

if __name__ == "__main__":
    recreate_database() 