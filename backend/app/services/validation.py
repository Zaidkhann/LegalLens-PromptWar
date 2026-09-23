import os
import re
from fastapi import HTTPException, status, UploadFile

# Maximum allowed file size in bytes (25 MB)
MAX_FILE_SIZE = 25 * 1024 * 1024

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/octet-stream",  # Sometimes transmitted by browsers for txt/docx
}


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks and unwanted characters.
    """
    if not filename:
        return "unnamed_document"
    
    # Take basename only
    base = os.path.basename(filename)
    # Remove null bytes and path traversal patterns
    base = base.replace("\0", "").replace("..", "")
    # Remove non-alphanumeric except hyphen, underscore, dot, and space
    base = re.sub(r"[^\w\s\.-]", "", base)
    # Strip leading/trailing spaces or dots
    base = base.strip(". ")
    
    if not base:
        return "unnamed_document"
    return base


def get_file_extension(filename: str) -> str:
    _, ext = os.path.splitext(filename)
    return ext.lower()


async def validate_upload_file(file: UploadFile) -> tuple[str, str, int]:
    """
    Validates uploaded file for extension, size, and non-empty content.
    Returns (sanitized_filename, file_type, file_size).
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided or filename is empty."
        )

    filename = sanitize_filename(file.filename)
    ext = get_file_extension(filename)

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Only PDF, DOCX, and TXT files are supported."
        )

    # Validate MIME type if available
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        # Extra check: if ext matches, we allow it even if browser sends octet-stream
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid MIME type '{file.content_type}'."
            )

    # Read content length / inspect size safely
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes)."
        )

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE // (1024 * 1024)}MB."
        )

    file_type = ext.lstrip(".")
    return filename, file_type, file_size
