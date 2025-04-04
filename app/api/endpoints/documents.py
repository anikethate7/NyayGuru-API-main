from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
import os
import shutil
from datetime import datetime
from typing import List
import uuid

from app.models.schemas import DocumentAnalysisResponse, User
from app.services.auth import get_current_active_user, check_rate_limit
from app.dependencies import get_llm
from app.services.document_analysis import analyze_document
from app.config import settings

router = APIRouter()

@router.post("/upload", response_model=DocumentAnalysisResponse)
async def upload_document(
    request: Request,
    document: UploadFile = File(...),
    document_type: str = Form(...),
    language: str = Form("English"),
    current_user: User = Depends(get_current_active_user),
    llm = Depends(get_llm)
):
    """
    Upload and analyze a legal document.
    
    - **document**: PDF file to analyze
    - **document_type**: Type of legal document (contract, will, lease, etc.)
    - **language**: Document language (default: English)
    """
    # Apply rate limiting
    client_id = f"user:{current_user.id}"
    if not check_rate_limit(client_id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
    
    # Validate file extension
    if not document.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF documents are supported."
        )
    
    try:
        # Create user-specific directory for uploaded files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        user_upload_dir = f"./LEGAL-DATA/user_uploads/{current_user.id}"
        os.makedirs(user_upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_id = uuid.uuid4().hex[:8]
        filename = f"{timestamp}_{file_id}_{document.filename}"
        file_path = os.path.join(user_upload_dir, filename)
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(document.file, buffer)
        
        # Analyze the document
        analysis_result = analyze_document(
            file_path=file_path, 
            document_type=document_type, 
            language=language,
            llm=llm
        )
        
        return analysis_result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        ) 