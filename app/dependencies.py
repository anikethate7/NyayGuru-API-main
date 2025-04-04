import os
from typing import Generator
from functools import lru_cache

from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from langchain.memory import ConversationBufferWindowMemory

from app.config import settings

# Set environment variables
os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY

# Create a custom memory class that extends the base memory class
class SessionMemory(ConversationBufferWindowMemory):
    """Custom memory class that can store session_id as a property"""
    def __init__(self, session_id: str, **kwargs):
        super().__init__(**kwargs)
        self._session_id = session_id
    
    @property
    def session_id(self) -> str:
        return self._session_id
        
    def clear(self):
        """Clear the chat memory"""
        self.chat_memory.clear()

@lru_cache
def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    """Get Google Generative AI embeddings with caching."""
    return GoogleGenerativeAIEmbeddings(model=settings.EMBEDDING_MODEL)

@lru_cache
def get_vector_store() -> FAISS:
    """Load vector store from disk with caching."""
    embeddings = get_embeddings()
    return FAISS.load_local(
        settings.VECTOR_STORE_PATH, 
        embeddings, 
        allow_dangerous_deserialization=True
    )

def get_retriever():
    """Get vector store retriever."""
    vector_store = get_vector_store()
    return vector_store.as_retriever(
        search_type="similarity", 
        search_kwargs={"k": settings.RETRIEVAL_K}
    )

def get_llm():
    """Get LLM model."""
    return ChatGroq(
        groq_api_key=settings.GROQ_API_KEY, 
        model_name=settings.LLM_MODEL
    )

def get_conversation_memory(session_id: str) -> SessionMemory:
    """Get conversation memory for a session."""
    # Create memory object using our custom class
    memory = SessionMemory(
        session_id=session_id,
        k=2, 
        memory_key="chat_history", 
        return_messages=True,
        output_key="answer"
    )
    
    return memory