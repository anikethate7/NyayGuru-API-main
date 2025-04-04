from fastapi import APIRouter, Depends, HTTPException, Path, Request
from uuid import uuid4
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func

from app.models.schemas import (
    ChatRequest, ChatResponse, User, 
    ConversationResponse, ConversationDetailResponse, 
    ConversationListResponse
)
from app.services.chatbot import get_chat_response
from app.dependencies import get_retriever, get_llm, get_conversation_memory
from app.services.auth import get_current_active_user, check_rate_limit, get_current_user_optional
from app.services.conversation import (
    create_conversation, get_conversation_by_session_id, 
    add_message, get_conversation_messages, get_user_conversations,
    delete_conversation
)
from app.database import get_db, Conversation
from app.config import settings

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat(
    request: Request,
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    retriever = Depends(get_retriever),
    llm = Depends(get_llm),
    db: Session = Depends(get_db)
):
    """
    Process a chat request and return a response.
    
    - **query**: User's question
    - **category**: Legal category
    - **language**: Response language (default: English)
    - **session_id**: Unique session identifier
    - **messages**: Previous messages in the conversation (optional)
    """
    # Apply rate limiting
    client_id = f"user:{current_user.id}"
    if not check_rate_limit(client_id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
        
    try:
        # Get or create conversation memory for this session
        memory = get_conversation_memory(chat_request.session_id)
        
        # If message history is provided, populate the memory with it
        if chat_request.messages:
            # Clear existing memory to avoid duplicates
            memory.clear()
            
            # Add all messages to the memory
            for msg in chat_request.messages:
                if msg['role'] == 'user':
                    memory.chat_memory.add_user_message(msg['content'])
                elif msg['role'] == 'assistant':
                    memory.chat_memory.add_ai_message(msg['content'])
        
        # Get or create conversation in the database
        conversation = get_conversation_by_session_id(db, chat_request.session_id)
        if not conversation:
            conversation = create_conversation(
                db, 
                user_id=current_user.id, 
                session_id=chat_request.session_id,
                category=chat_request.category
            )
        
        # Store user's message in the database
        add_message(db, conversation.id, "user", chat_request.query)
            
        # Get response from chatbot service
        response = get_chat_response(
            query=chat_request.query,
            category=chat_request.category,
            language=chat_request.language,
            retriever=retriever,
            llm=llm,
            memory=memory
        )
        
        # Store assistant's response in the database
        add_message(db, conversation.id, "assistant", response["answer"])
        
        # Set the conversation_id in the response
        response["conversation_id"] = conversation.id
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")


@router.post("/category/{category}", response_model=ChatResponse)
async def category_chat(
    request: Request,
    chat_request: ChatRequest,
    category: str = Path(..., description="Legal category"),
    current_user: User = Depends(get_current_active_user),
    retriever = Depends(get_retriever),
    llm = Depends(get_llm),
    db: Session = Depends(get_db)
):
    """
    Process a category-specific chat request and return a response.
    
    - **category**: Legal category (from path)
    - **query**: User's question
    - **language**: Response language (default: English)
    - **session_id**: Unique session identifier
    - **messages**: Previous messages in the conversation (optional)
    """
    # Apply rate limiting
    client_id = f"user:{current_user.id}"
    if not check_rate_limit(client_id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
    
    # Validate category
    if category not in settings.LEGAL_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {', '.join(settings.LEGAL_CATEGORIES)}")
    
    # If category is valid, update the request category field
    chat_request.category = category
    
    try:
        # Get or create conversation memory for this session
        memory = get_conversation_memory(chat_request.session_id)
        
        # If message history is provided, populate the memory with it
        if chat_request.messages:
            # Clear existing memory to avoid duplicates
            memory.clear()
            
            # Add all messages to the memory
            for msg in chat_request.messages:
                if msg['role'] == 'user':
                    memory.chat_memory.add_user_message(msg['content'])
                elif msg['role'] == 'assistant':
                    memory.chat_memory.add_ai_message(msg['content'])
        
        # Get or create conversation in the database
        conversation = get_conversation_by_session_id(db, chat_request.session_id)
        if not conversation:
            conversation = create_conversation(
                db, 
                user_id=current_user.id, 
                session_id=chat_request.session_id,
                category=category
            )
        
        # Store user's message in the database
        add_message(db, conversation.id, "user", chat_request.query)
        
        # Get response from chatbot service with strict category relevance check
        response = get_chat_response(
            query=chat_request.query,
            category=category,
            language=chat_request.language,
            retriever=retriever,
            llm=llm,
            memory=memory,
            strict_category_check=True  # Enforce strict category relevance
        )
        
        # Store assistant's response in the database
        add_message(db, conversation.id, "assistant", response["answer"])
        
        # Set the conversation_id in the response
        response["conversation_id"] = conversation.id
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")


# Add a new public endpoint that doesn't require authentication
@router.post("/public/{category}", response_model=ChatResponse)
async def public_chat(
    request: Request,
    chat_request: ChatRequest,
    category: str = Path(..., description="Legal category"),
    current_user: User = Depends(get_current_user_optional),
    retriever = Depends(get_retriever),
    llm = Depends(get_llm),
    db: Session = Depends(get_db)
):
    """
    Public chat endpoint that doesn't require authentication.
    
    - **category**: Legal category (from path)
    - **query**: User's question
    - **language**: Response language (default: English)
    - **session_id**: Unique session identifier
    - **messages**: Previous messages in the conversation (optional)
    """
    # Apply basic rate limiting based on IP address
    client_ip = request.client.host
    client_id = f"ip:{client_ip}"
    if not check_rate_limit(client_id, limit=10):  # Lower limit for non-auth users
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later or login for higher limits."
        )
    
    try:
        # Log the request
        print(f"Public chat request: category={category}, query={chat_request.query[:50]}...")
        
        # Try different formats for category matching
        # 1. Direct matching
        if category in settings.LEGAL_CATEGORIES:
            category_normalized = category
        else:
            # 2. Convert kebab-case to proper case
            category_normalized = " ".join(word.capitalize() for word in category.split("-"))
            
            # 3. Try more flexible matching if direct match fails
            if category_normalized not in settings.LEGAL_CATEGORIES:
                # Case-insensitive matching
                category_matched = next((c for c in settings.LEGAL_CATEGORIES 
                                    if c.lower() == category_normalized.lower() 
                                    or c.lower().replace(" ", "-") == category.lower()
                                    or c.lower().replace(" ", "") == category.lower().replace("-", "")), None)
                
                if category_matched:
                    category_normalized = category_matched
                else:
                    # If we still can't find a match, try a special case for 'know-your-rights'
                    if category.lower() == 'know-your-rights':
                        category_matched = next((c for c in settings.LEGAL_CATEGORIES 
                                        if c.lower() == 'know your rights'), None)
                        if category_matched:
                            category_normalized = category_matched
                        else:
                            raise HTTPException(
                                status_code=400, 
                                detail=f"Invalid category '{category}'. Available categories are: {', '.join(settings.LEGAL_CATEGORIES)}"
                            )
                    else:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Invalid category '{category}'. Available categories are: {', '.join(settings.LEGAL_CATEGORIES)}"
                        )
        
        # If category is valid, update the request category field
        chat_request.category = category_normalized
        print(f"Matched category: {category_normalized}")
        
        # Get or create conversation memory for this session
        memory = get_conversation_memory(chat_request.session_id)
        
        # If message history is provided, populate the memory with it
        if chat_request.messages:
            # Clear existing memory to avoid duplicates
            memory.clear()
            
            # Add all messages to the memory
            for msg in chat_request.messages:
                if msg['role'] == 'user':
                    memory.chat_memory.add_user_message(msg['content'])
                elif msg['role'] == 'assistant':
                    memory.chat_memory.add_ai_message(msg['content'])
        
        # For public chats without authentication, we might not store conversations
        # unless the user is authenticated
        conversation_id = "public-" + str(uuid4())
        if current_user:
            # Store conversation if user is authenticated
            conversation = get_conversation_by_session_id(db, chat_request.session_id)
            if not conversation:
                conversation = create_conversation(
                    db, 
                    user_id=current_user.id, 
                    session_id=chat_request.session_id,
                    category=category_normalized
                )
            
            # Store user's message in the database
            add_message(db, conversation.id, "user", chat_request.query)
            conversation_id = conversation.id
        
        # Get response from chatbot service with strict category relevance check
        response = get_chat_response(
            query=chat_request.query,
            category=category_normalized,
            language=chat_request.language,
            retriever=retriever,
            llm=llm,
            memory=memory,
            strict_category_check=True  # Enforce strict category relevance
        )
        
        # Store assistant's response if user is authenticated
        if current_user:
            conversation = get_conversation_by_session_id(db, chat_request.session_id)
            if conversation:
                add_message(db, conversation.id, "assistant", response["answer"])
        
        # Set the conversation_id in the response
        response["conversation_id"] = conversation_id
        
        return response
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        print(f"Error in public_chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")


@router.post("/session")
async def create_session():
    """Create a new chat session and return a session ID."""
    session_id = str(uuid4())
    # Return a dummy user_id 
    return {"session_id": session_id, "user_id": "anonymous"}


@router.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify API connectivity."""
    return {"status": "ok", "message": "Chat API is working"}


@router.post("/test-cat/{category}")
async def test_category(category: str):
    """Test endpoint to check category normalization."""
    # Try different formats for category matching
    if category in settings.LEGAL_CATEGORIES:
        return {"status": "ok", "normalized": category}
    
    # 2. Convert kebab-case to proper case
    category_normalized = " ".join(word.capitalize() for word in category.split("-"))
    
    # 3. Try more flexible matching if direct match fails
    if category_normalized not in settings.LEGAL_CATEGORIES:
        # Case-insensitive matching
        category_matched = next((c for c in settings.LEGAL_CATEGORIES 
                                if c.lower() == category_normalized.lower() 
                                or c.lower().replace(" ", "-") == category.lower()
                                or c.lower().replace(" ", "") == category.lower().replace("-", "")), None)
        
        if category_matched:
            return {"status": "ok", "normalized": category_matched}
        else:
            # If we still can't find a match, try a special case for 'know-your-rights'
            if category.lower() == 'know-your-rights':
                category_matched = next((c for c in settings.LEGAL_CATEGORIES 
                                if c.lower() == 'know your rights'), None)
                if category_matched:
                    return {"status": "ok", "normalized": category_matched}
                
    if category_normalized in settings.LEGAL_CATEGORIES:
        return {"status": "ok", "normalized": category_normalized}
        
    return {"status": "error", "message": f"Invalid category. Must be one of: {', '.join(settings.LEGAL_CATEGORIES)}"}


# Conversation history endpoints
@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all conversations for the current user.
    
    - **skip**: Number of records to skip for pagination
    - **limit**: Maximum number of records to return
    """
    conversations = get_user_conversations(db, current_user.id, skip, limit)
    total = db.query(sql_func.count('*')).select_from(Conversation).filter(Conversation.user_id == current_user.id).scalar()
    
    return {
        "conversations": conversations,
        "total": total
    }


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a conversation by ID with all messages.
    
    - **conversation_id**: Conversation ID
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )
    
    # Get all messages for this conversation
    messages = get_conversation_messages(db, conversation_id)
    
    # Include messages in the response
    return {
        **conversation.__dict__,
        "messages": messages
    }


@router.delete("/conversations/{conversation_id}")
async def remove_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a conversation.
    
    - **conversation_id**: Conversation ID
    """
    # First check if the conversation belongs to the user
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )
    
    # Delete the conversation
    deleted = delete_conversation(db, conversation_id)
    
    if deleted:
        return {"status": "ok", "message": "Conversation deleted"}
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete conversation"
        )