import os
from dotenv import load_dotenv
from app.services.embedding import embed_and_save_documents

# Load environment variables
load_dotenv()
os.environ['GOOGLE_API_KEY'] = os.getenv("GOOGLE_API_KEY")

def main():
    """Entry point for document ingestion."""
    print("Starting document ingestion...")
    num_chunks = embed_and_save_documents()
    print(f"Document ingestion complete. Created {num_chunks} document chunks.")

if __name__ == "__main__":
    main()