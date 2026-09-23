from fastapi import APIRouter, UploadFile, File, HTTPException, status, BackgroundTasks
from typing import Dict, Any
import logging

from app.schemas.document import (
    ProcessingStatus,
    DocumentMetaData,
    DocumentContentResponse,
    UploadResponse,
)
from app.schemas.analysis import (
    AnalysisStatus,
    AnalysisMetaResponse,
    FullAnalysisResponse,
    LegalAnalysis,
)
from app.services.validation import validate_upload_file
from app.services.storage import (
    save_file_to_disk,
    create_document,
    update_document_status,
    save_document_pages,
    get_document_by_id,
    get_document_content,
    update_analysis_status,
    get_analysis_status,
    save_analysis,
    get_analysis,
)
from app.services.parsers import (
    parse_document,
    UnsupportedDocumentError,
    PDFParsingError,
    DOCXParsingError,
    TXTParsingError,
)
from app.services.gemini_service import analyze_document

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    """
    1. Validate file type & size.
    2. Save original file safely.
    3. Generate document metadata record with status UPLOADED.
    4. Update status to PROCESSING.
    5. Extract text page-by-page.
    6. Store extracted content & update status to COMPLETED (or FAILED).
    7. Return processing summary.
    """
    # 1. Validate file
    filename, file_type, file_size = await validate_upload_file(file)

    # Title defaults to original filename without extension
    title = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ")

    # Read bytes for saving and extraction
    file_bytes = await file.read()

    # 2. Save original file safely to disk
    try:
        doc_id, storage_path = save_file_to_disk(file_bytes, file_type)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store file to disk: {str(e)}"
        )

    # 3. Create document record
    doc_meta = create_document(
        doc_id=doc_id,
        original_filename=filename,
        title=title,
        file_type=file_type,
        file_size=file_size,
        storage_path=storage_path,
        status=ProcessingStatus.UPLOADED,
    )

    # 4. Update status to PROCESSING
    update_document_status(doc_id, ProcessingStatus.PROCESSING)

    # 5. Extract text
    try:
        pages, parse_meta = parse_document(storage_path, file_type)
        if parse_meta.get("title") and parse_meta["title"].strip():
            title = parse_meta["title"].strip()
    except (PDFParsingError, DOCXParsingError, TXTParsingError, UnsupportedDocumentError) as e:
        error_msg = str(e)
        update_document_status(doc_id, ProcessingStatus.FAILED, error_message=error_msg)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document parsing error: {error_msg}"
        )
    except Exception as e:
        error_msg = f"Unexpected error during extraction: {str(e)}"
        update_document_status(doc_id, ProcessingStatus.FAILED, error_message=error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

    # 6. Store extracted content & update status to COMPLETED
    page_count = len(pages)
    save_document_pages(doc_id, pages)
    update_document_status(doc_id, ProcessingStatus.COMPLETED, page_count=page_count)

    return UploadResponse(
        document_id=doc_id,
        title=title,
        file_type=file_type,
        file_size=file_size,
        page_count=page_count,
        processing_status=ProcessingStatus.COMPLETED,
        message="Document uploaded and text extracted successfully."
    )


@router.get("/{document_id}", response_model=DocumentMetaData)
async def get_document(document_id: str):
    """
    Retrieve document metadata by document ID.
    """
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found."
        )
    return doc


@router.get("/{document_id}/content", response_model=DocumentContentResponse)
async def get_document_content_endpoint(document_id: str):
    """
    Retrieve full extracted content including all pages for document ID.
    """
    content = get_document_content(document_id)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document content for ID '{document_id}' not found."
        )
    return content


# ─── Phase 3: GenAI Analysis Endpoints ────────────────────────────────────────


@router.post("/{document_id}/analyze", response_model=AnalysisMetaResponse)
async def analyze_document_endpoint(document_id: str):
    """
    Triggers Gemini AI legal analysis on an uploaded document.
    1. Verify document exists and text was extracted.
    2. Set analysis_status to ANALYZING.
    3. Send extracted content to Gemini.
    4. Validate structured output.
    5. Store analysis.
    6. Update analysis_status to COMPLETED (or FAILED).
    7. Return analysis metadata.
    """
    # 1. Verify document exists
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found."
        )

    if doc.processing_status != ProcessingStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document text extraction has not completed. Cannot analyze."
        )

    # Retrieve extracted content
    content = get_document_content(document_id)
    if not content or not content.pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No extracted text content found for this document."
        )

    # 2. Set analysis_status to ANALYZING
    update_analysis_status(document_id, AnalysisStatus.ANALYZING)

    # 3-6. Run Gemini analysis
    try:
        analysis = await analyze_document(content.pages)
        analysis_dict = analysis.model_dump()
        save_analysis(document_id, analysis_dict)
        update_analysis_status(document_id, AnalysisStatus.COMPLETED)

        return AnalysisMetaResponse(
            document_id=document_id,
            analysis_status=AnalysisStatus.COMPLETED,
            message="AI legal analysis completed successfully."
        )

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Gemini analysis failed for document {document_id}: {error_msg}")
        update_analysis_status(document_id, AnalysisStatus.FAILED)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {error_msg}"
        )


@router.get("/{document_id}/analysis", response_model=FullAnalysisResponse)
async def get_analysis_endpoint(document_id: str):
    """
    Retrieve complete structured legal analysis for a document.
    """
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found."
        )

    status_val = get_analysis_status(document_id)
    analysis_status = AnalysisStatus(status_val) if status_val else AnalysisStatus.NOT_STARTED

    analysis_dict = get_analysis(document_id)
    analysis_obj = None
    if analysis_dict:
        try:
            analysis_obj = LegalAnalysis.model_validate(analysis_dict)
        except Exception:
            analysis_obj = None

    return FullAnalysisResponse(
        document_id=document_id,
        analysis_status=analysis_status,
        analysis=analysis_obj,
    )

