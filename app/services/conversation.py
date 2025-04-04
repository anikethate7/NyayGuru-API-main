from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import uuid4
from sqlalchemy.orm import Session

from app.database import Conversation, Message, User


def create_conversation(
    db: Session,
    user_id: str,
    session_id: str,
    category: str,
    title: Optional[str] = None
) -> Conversation:
    """
    Create a new conversation in the database.
    
    Args:
        db: Database session
        user_id: User ID
        session_id: Session ID
        category: Legal category 
        title: Optional conversation title
        
    Returns:
        Created conversation
    """
    conversation = Conversation(
        id=str(uuid4()),
        user_id=user_id,
        session_id=session_id,
        category=category,
        title=title or f"Conversation about {category}",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    return conversation


def get_conversation_by_session_id(
    db: Session,
    session_id: str
) -> Optional[Conversation]:
    """
    Get a conversation by session ID.
    
    Args:
        db: Database session
        session_id: Session ID
        
    Returns:
        Conversation or None if not found
    """
    return db.query(Conversation).filter(Conversation.session_id == session_id).first()


def add_message(
    db: Session,
    conversation_id: str,
    role: str,
    content: str
) -> Message:
    """
    Add a message to a conversation.
    
    Args:
        db: Database session
        conversation_id: Conversation ID
        role: Message role ("user" or "assistant")
        content: Message content
        
    Returns:
        Created message
    """
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        timestamp=datetime.utcnow()
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # Update conversation's updated_at timestamp
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        conversation.updated_at = datetime.utcnow()
        db.commit()
    
    return message


def get_conversation_messages(
    db: Session,
    conversation_id: str
) -> List[Message]:
    """
    Get all messages for a conversation.
    
    Args:
        db: Database session
        conversation_id: Conversation ID
        
    Returns:
        List of messages
    """
    return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.timestamp).all()


def get_user_conversations(
    db: Session,
    user_id: str,
    skip: int = 0,
    limit: int = 100
) -> List[Conversation]:
    """
    Get all conversations for a user.
    
    Args:
        db: Database session
        user_id: User ID
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        
    Returns:
        List of conversations
    """
    return db.query(Conversation)\
        .filter(Conversation.user_id == user_id)\
        .order_by(Conversation.updated_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()


def delete_conversation(
    db: Session,
    conversation_id: str
) -> bool:
    """
    Delete a conversation.
    
    Args:
        db: Database session
        conversation_id: Conversation ID
        
    Returns:
        True if deleted, False if not found
    """
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        db.delete(conversation)
        db.commit()
        return True
    return False 