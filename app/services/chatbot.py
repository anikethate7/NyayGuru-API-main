from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferWindowMemory

from app.services.translation import translate_text
from app.config import settings


def get_chat_response(
    query: str,
    category: str,
    language: str,
    retriever,
    llm,
    memory: ConversationBufferWindowMemory,
    strict_category_check: bool = False
):
    """
    Process a user query and return a response using RAG architecture.
    
    Args:
        query: User's question
        category: Legal category
        language: Response language
        retriever: Vector store retriever
        llm: Language model
        memory: Conversation memory
        strict_category_check: Whether to enforce strict category relevance
        
    Returns:
        Dictionary with answer and sources
    """
    try:
        # Add category context to the query
        enhanced_query = f"[Category: {category}] {query}"
        
        # Extract conversation ID from memory if available
        try:
            # Use getattr instead of direct attribute access
            conversation_id = getattr(memory, "session_id", "unknown")
        except Exception:
            # Fallback if session_id is not available
            conversation_id = "unknown"
        
        # If strict category check is enabled, first verify query relevance
        if strict_category_check:
            relevance_check = check_category_relevance(query, category, llm)
            if not relevance_check["is_relevant"]:
                return {
                    "answer": relevance_check["message"],
                    "sources": [],
                    "conversation_id": conversation_id,
                    "suggested_questions": generate_suggested_questions(category, llm),
                    "message_type": "error"
                }
        
        # Setup QA chain
        qa = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            memory=memory,
            return_source_documents=True
        )
        
        # Get response
        result = qa({"question": enhanced_query})
        
        # Extract answer and sources
        english_response = result["answer"]
        source_documents = result.get("source_documents", [])
        
        # Extract source filenames
        sources = []
        for doc in source_documents:
            if hasattr(doc, "metadata") and "source" in doc.metadata:
                source = doc.metadata["source"]
                if source not in sources:
                    sources.append(source)
        
        # Determine message type
        message_type = determine_message_type(query)
        
        # First format the response to be conversational with some structure
        formatted_response = make_response_conversational(english_response, query, message_type, llm)
        
        # Then translate response if needed
        final_response = formatted_response
        if language != "English" and settings.ENABLE_TRANSLATION:
            final_response = translate_text(
                text=formatted_response, 
                source_lang="English", 
                target_lang=language,
                llm=llm
            )
        
        # Generate relevant follow-up questions based on the context and category
        suggested_questions = generate_follow_up_questions(query, final_response, category, llm)
        
        return {
            "answer": final_response,
            "sources": sources,
            "conversation_id": conversation_id,
            "suggested_questions": suggested_questions,
            "message_type": message_type
        }
    except Exception as e:
        # Fallback response in case of any exceptions
        print(f"Error in get_chat_response: {str(e)}")
        return {
            "answer": f"I'm sorry, I encountered an error while processing your question. Please try again or ask a different question about {category}.",
            "sources": [],
            "conversation_id": getattr(memory, "session_id", "unknown") if memory else "unknown",
            "suggested_questions": [
                f"What is {category}?",
                f"Can you explain the basics of {category}?",
                f"What are important concepts in {category}?"
            ],
            "message_type": "error"
        }


def check_category_relevance(query: str, category: str, llm):
    """
    Check if a query is relevant to the specified legal category.
    
    Args:
        query: User's question
        category: Legal category
        llm: Language model
        
    Returns:
        Dictionary with relevance check result
    """
    prompt = f"""
    You are a legal expert responsible for routing questions to the appropriate department.
    
    Task:
    Determine if the following question is directly related to the legal category: "{category}".
    
    Question: "{query}"
    
    Guidelines:
    - Only respond with "YES" if the question is clearly and directly related to {category}.
    - Otherwise respond with "NO".
    - Do not provide any explanation or additional context.
    - Respond with only a single word: "YES" or "NO".
    """
    
    response = llm.invoke(prompt)
    is_relevant = response.content.strip().upper() == "YES"
    
    if is_relevant:
        return {
            "is_relevant": True,
            "message": ""
        }
    else:
        return {
            "is_relevant": False,
            "message": f"I'm sorry, but your question doesn't appear to be related to the '{category}' category. Please ask a question specifically about {category} or select a different legal category."
        }

def generate_follow_up_questions(user_query, response, category, llm):
    """
    Generate relevant follow-up questions based on the context and category.
    
    Args:
        user_query: Original user question
        response: Bot's response
        category: Legal category
        llm: Language model
        
    Returns:
        List of suggested follow-up questions
    """
    try:
        # Keep prompt and response shorter to avoid token limitations
        # Truncate them if they're too long
        max_query_length = 100
        max_response_length = 500
        
        truncated_query = user_query[:max_query_length] + ("..." if len(user_query) > max_query_length else "")
        truncated_response = response[:max_response_length] + ("..." if len(response) > max_response_length else "")
        
        prompt = f"""
        Based on this user question and response about {category} law, generate 3 relevant follow-up questions:
        
        User Question: "{truncated_query}"
        Response: "{truncated_response}"
        
        Generate 3 short, specific follow-up questions related to {category}.
        Each question should be directly relevant to the topic.
        
        Format: Simple list, one question per line, no numbers or bullets.
        """
        
        try:
            result = llm.invoke(prompt)
            questions = [q.strip() for q in result.content.strip().split('\n') if q.strip()]
            
            # Validate the questions - they should be actual questions (ending with ?)
            valid_questions = [q for q in questions if q.endswith('?')]
            
            # If we don't have at least 1 valid question, generate some defaults
            if not valid_questions:
                return [
                    f"What are the key legal principles in {category}?",
                    f"How does {category} law affect everyday situations?",
                    f"What recent changes have occurred in {category} law?"
                ]
            
            # Return at most 3 questions
            return valid_questions[:3]
        except Exception as llm_error:
            print(f"LLM error in generate_follow_up_questions: {str(llm_error)}")
            # Back-off to simpler prompt on failure
            try:
                simple_prompt = f"Generate 3 common questions about {category} law. Format as a simple list."
                result = llm.invoke(simple_prompt)
                questions = [q.strip() for q in result.content.strip().split('\n') if q.strip()]
                return questions[:3]
            except:
                # If even the simpler prompt fails, return defaults
                raise
    except Exception as e:
        # In case of any error, return default questions
        print(f"Error generating follow-up questions: {str(e)}")
        return [
            f"Can you explain more about {category}?",
            f"What are the common issues in {category} law?",
            f"How can I learn more about {category}?"
        ]

def determine_message_type(query):
    """
    Determine the type of message based on the query.
    
    Args:
        query: User's query
        
    Returns:
        Message type as string
    """
    query_lower = query.lower()
    
    if any(greeting in query_lower for greeting in ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening"]):
        return "greeting"
    elif any(word in query_lower for word in ["thanks", "thank you", "appreciate"]):
        return "acknowledgment"
    elif any(word in query_lower for word in ["help", "assist", "what can you do", "capabilities"]):
        return "help"
    else:
        return "answer"

def generate_suggested_questions(category, llm):
    """
    Generate suggested questions for a category when user's query is not relevant.
    
    Args:
        category: Legal category
        llm: Language model
        
    Returns:
        List of suggested questions
    """
    try:
        prompt = f"""
        Generate 3 common legal questions related to the category: {category}.
        
        These questions should be:
        1. Clear and specific
        2. Relevant to {category} law
        3. Questions that a non-expert might ask
        
        Format your response as a simple list with each question on a new line, without numbers or bullets.
        """
        
        result = llm.invoke(prompt)
        questions = [q.strip() for q in result.content.strip().split('\n') if q.strip()]
        
        # Return at most 3 questions
        return questions[:3]
    except Exception as e:
        # In case of any error, return default questions
        print(f"Error generating suggested questions: {str(e)}")
        return [
            f"What are the basics of {category}?",
            f"What rights do I have under {category} law?",
            f"What recent developments have occurred in {category} law?"
        ]

def make_response_conversational(response, query, message_type, llm):
    """
    Make the response more conversational based on the message type.
    
    Args:
        response: Original response
        query: User's query
        message_type: Type of message
        llm: Language model
        
    Returns:
        Conversational response
    """
    try:
        if message_type == "greeting":
            prompt = f"""
            The user has greeted me with: "{query}"
            
            I want to respond in a friendly, conversational way that acknowledges their greeting and invites them to ask a legal question.
            Include that I'm a legal assistant that can help with legal questions and issues.
            Keep it brief but warm.
            
            Original response: "{response}"
            """
            
            result = llm.invoke(prompt)
            return result.content.strip()
            
        elif message_type == "acknowledgment":
            return "You're welcome! I'm happy to help with any other legal questions you might have."
            
        elif message_type == "help":
            return "I'm your legal assistant, designed to help answer questions about various legal topics. I can provide information on legal categories like Criminal Law, Civil Law, Family Law, and more. Just ask your legal question, and I'll do my best to assist you with accurate information and resources."
        
        else:
            # For regular answers, make them conversational with some bullet points for clarity
            prompt = f"""
            Rewrite the following response to make it more conversational and easier to understand:
            
            Original Response: "{response}"
            
            Guidelines:
            - Keep the friendly, conversational tone
            - Maintain most of the original flow and structure
            - Use bullet points only for lists or when it helps clarify multiple points
            - Use simple language where possible while keeping legal terms when necessary
            - Break up very long paragraphs but don't change the style dramatically
            - Ensure it flows naturally as part of a conversation
            - Do not add disclaimers or unnecessary statements
            """
            
            try:
                result = llm.invoke(prompt)
                return result.content.strip()
            except Exception as inner_e:
                print(f"Error in LLM invocation: {str(inner_e)}")
                # If the formatting fails, return the original response
                return response
    except Exception as e:
        # In case of any error, return the original response
        print(f"Error making response conversational: {str(e)}")
        return response