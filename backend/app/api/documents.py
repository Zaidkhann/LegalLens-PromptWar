from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import Dict, Any

from app.schemas.document import (
    ProcessingStatus,
    DocumentMetaData,
    DocumentContentResponse,
    UploadResponse,
)
from app.services.validation import validate_upload_file
from app.services.storage import (
    save_file_to_disk,
    create_document,
    update_document_status,
    save_document_pages,
    get_document_by_id,
    get_document_content,
)
from app.services.parsers import (
    parse_document,
    UnsupportedDocumentError,
    PDFParsingError,
    DOCXParsingError,
    TXTParsingError,
)

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
