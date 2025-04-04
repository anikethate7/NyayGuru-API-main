import os
from typing import Dict, List, Optional
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

from app.config import settings

def analyze_document(file_path: str, document_type: str, language: str, llm) -> Dict:
    """
    Analyze a legal document and extract key information.
    
    Args:
        file_path: Path to the uploaded document
        document_type: Type of legal document
        language: Document language
        llm: Language model instance
        
    Returns:
        Dictionary with analysis results
    """
    # Extract content from PDF
    loader = PyPDFLoader(file_path)
    pages = loader.load()
    
    # Combine pages into a single text
    document_text = "\n".join([page.page_content for page in pages])
    
    # If document is too long, split and summarize each part
    if len(document_text) > 15000:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=5000,
            chunk_overlap=500
        )
        chunks = text_splitter.split_text(document_text)
        document_text = summarize_long_document(chunks, llm)
    
    # Define the analysis prompt based on document type
    analysis_prompt_template = get_analysis_prompt(document_type)
    
    # Create analysis chain
    analysis_prompt = PromptTemplate(
        input_variables=["document_text", "document_type"],
        template=analysis_prompt_template
    )
    analysis_chain = LLMChain(llm=llm, prompt=analysis_prompt)
    
    # Generate analysis
    analysis_result = analysis_chain.run(
        document_text=document_text,
        document_type=document_type
    )
    
    # Parse the analysis results
    result = parse_analysis_result(analysis_result)
    
    # Add the document name
    document_name = os.path.basename(file_path)
    result["document_name"] = document_name
    
    return result

def summarize_long_document(chunks: List[str], llm) -> str:
    """
    Summarize a long document by summarizing each chunk and combining the results.
    
    Args:
        chunks: List of text chunks
        llm: Language model instance
        
    Returns:
        Condensed version of the document
    """
    summarization_prompt = PromptTemplate(
        input_variables=["text"],
        template="""
        Summarize the following text in a concise manner, preserving all key legal points and important details:
        
        {text}
        
        Summary:
        """
    )
    
    summary_chain = LLMChain(llm=llm, prompt=summarization_prompt)
    
    summaries = []
    for chunk in chunks:
        summary = summary_chain.run(text=chunk)
        summaries.append(summary)
    
    return "\n\n".join(summaries)

def get_analysis_prompt(document_type: str) -> str:
    """
    Get the appropriate analysis prompt based on document type.
    
    Args:
        document_type: Type of legal document
        
    Returns:
        Prompt template for document analysis
    """
    # Base prompt for any document type
    base_prompt = """
    You are a legal expert analyzing a {document_type}. Review the following document text carefully and provide a comprehensive analysis.
    
    Document text:
    {document_text}
    
    Provide your analysis in the following format:
    SUMMARY: A concise summary of the document
    KEY_POINTS: At least 5 key points from the document (one per line, start each with a dash)
    SUGGESTIONS: At least 3 legal suggestions based on the document (one per line, start each with a dash)
    """
    
    # Specific prompts for different document types
    document_prompts = {
        "contract": base_prompt + """
        For contracts, pay special attention to:
        - The contracting parties and their obligations
        - Payment terms and conditions
        - Termination clauses
        - Potential legal issues or ambiguities
        - Risk allocation between parties
        """,
        
        "will": base_prompt + """
        For wills, pay special attention to:
        - Beneficiaries and inheritance distributions
        - Executor designation
        - Guardianship provisions (if applicable)
        - Specific bequests
        - Potential legal challenges or ambiguities
        """,
        
        "lease": base_prompt + """
        For leases, pay special attention to:
        - Landlord and tenant obligations
        - Rent terms and payment schedules
        - Security deposit provisions
        - Maintenance responsibilities
        - Termination and renewal conditions
        """,
        
        "affidavit": base_prompt + """
        For affidavits, pay special attention to:
        - The declarant's identity and relationship to the matter
        - Key assertions or statements under oath
        - Legal purpose of the affidavit
        - Supporting evidence mentioned
        - Any potential contradictions or ambiguities
        """
    }
    
    return document_prompts.get(document_type.lower(), base_prompt)

def parse_analysis_result(analysis_text: str) -> Dict:
    """
    Parse the analysis text into structured components.
    
    Args:
        analysis_text: Raw analysis text from LLM
        
    Returns:
        Dictionary with structured analysis components
    """
    # Default values
    summary = ""
    key_points = []
    suggestions = []
    
    # Extract summary
    if "SUMMARY:" in analysis_text:
        summary_section = analysis_text.split("SUMMARY:")[1].split("KEY_POINTS:")[0].strip()
        summary = summary_section
        
    # Extract key points
    if "KEY_POINTS:" in analysis_text:
        if "SUGGESTIONS:" in analysis_text:
            key_points_section = analysis_text.split("KEY_POINTS:")[1].split("SUGGESTIONS:")[0].strip()
        else:
            key_points_section = analysis_text.split("KEY_POINTS:")[1].strip()
            
        key_points = [
            point.strip().lstrip("- ") 
            for point in key_points_section.split("\n") 
            if point.strip() and not point.isspace()
        ]
        
    # Extract suggestions
    if "SUGGESTIONS:" in analysis_text:
        suggestions_section = analysis_text.split("SUGGESTIONS:")[1].strip()
        suggestions = [
            suggestion.strip().lstrip("- ") 
            for suggestion in suggestions_section.split("\n") 
            if suggestion.strip() and not suggestion.isspace()
        ]
        
    return {
        "summary": summary,
        "key_points": key_points,
        "suggestions": suggestions
    } 