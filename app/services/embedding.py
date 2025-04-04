import os
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.config import settings

def embed_and_save_documents(data_dir="./LEGAL-DATA"):
    """
    Load PDF documents, split them into chunks, embed them, and save to disk.
    
    Args:
        data_dir: Directory containing PDF files
    
    Returns:
        Number of chunks created
    """
    # Check if directory exists
    if not os.path.exists(data_dir):
        print(f"Creating directory {data_dir}")
        os.makedirs(data_dir, exist_ok=True)
        print(f"No documents found in {data_dir}. Please add PDF files to this directory.")
        return 0
    
    # Check if directory contains PDF files
    pdf_files = [f for f in os.listdir(data_dir) if f.lower().endswith('.pdf')]
    if not pdf_files:
        print(f"No PDF files found in {data_dir}. Please add PDF files to this directory.")
        return 0
    
    print(f"Found {len(pdf_files)} PDF files: {', '.join(pdf_files)}")
    
    # Initialize embeddings
    embeddings = GoogleGenerativeAIEmbeddings(model=settings.EMBEDDING_MODEL)
    
    # Load documents
    loader = PyPDFDirectoryLoader(data_dir)
    print("Loader initialized")
    docs = loader.load()
    print(f"Loaded {len(docs)} documents")
    
    if not docs:
        print(f"No content could be extracted from the PDF files in {data_dir}.")
        print("Please ensure the PDF files are valid and contain text content.")
        return 0
    
    # Split documents
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE, 
        chunk_overlap=settings.CHUNK_OVERLAP
    )
    final_documents = text_splitter.split_documents(docs)
    print(f"Split into {len(final_documents)} chunks")
    
    if not final_documents:
        print("No document chunks were created. The PDFs might be empty or contain only images.")
        return 0
    
    # Ensure metadata includes the source file name
    for doc in final_documents:
        if 'source' in doc.metadata:
            source_file = doc.metadata['source']
            doc.metadata['source'] = os.path.basename(source_file)
        else:
            # If source metadata is not present, add it
            doc.metadata['source'] = os.path.basename(data_dir)
    
    # Batch documents to avoid payload size limits
    batch_size = 100
    batched_documents = [
        final_documents[i:i + batch_size] 
        for i in range(0, len(final_documents), batch_size)
    ]
    
    # Create vector stores for each batch
    print(f"Processing {len(batched_documents)} batches")
    vector_stores = []
    for i, batch in enumerate(batched_documents):
        print(f"Processing batch {i+1}/{len(batched_documents)}")
        vector_store = FAISS.from_documents(batch, embeddings)
        vector_stores.append(vector_store)
    
    # Merge vector stores only if there are any
    if vector_stores:
        vectors = vector_stores[0]
        for vector_store in vector_stores[1:]:
            vectors.merge_from(vector_store)
        print("Merged vector stores")
        
        # Save to disk
        vectors.save_local(settings.VECTOR_STORE_PATH)
        print(f"Saved vector store to {settings.VECTOR_STORE_PATH}")
    else:
        print("No vector stores were created.")
    
    return len(final_documents)