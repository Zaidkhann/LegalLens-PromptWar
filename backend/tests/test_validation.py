import os
import pytest
from fastapi import HTTPException
from fastapi.datastructures import UploadFile
from io import BytesIO
from app.services.validation import validate_upload_file, sanitize_filename
from app.services.parsers.pdf import extract_pdf, PDFParsingError


def test_filename_sanitization():
    assert sanitize_filename("../../etc/passwd.pdf") == "passwd.pdf"
    assert sanitize_filename("my_document<script>.docx") == "my_documentscript.docx"
    assert sanitize_filename("   normal_file.txt  ") == "normal_file.txt"


@pytest.mark.asyncio
async def test_invalid_file_extension():
    file_obj = BytesIO(b"print('hello')")
    upload_file = UploadFile(filename="script.exe", file=file_obj)
    
    with pytest.raises(HTTPException) as exc_info:
        await validate_upload_file(upload_file)
    assert exc_info.value.status_code == 400
    assert "Unsupported file extension" in exc_info.value.detail


@pytest.mark.asyncio
async def test_empty_file_validation():
    file_obj = BytesIO(b"")
    upload_file = UploadFile(filename="empty.pdf", file=file_obj)
    
    with pytest.raises(HTTPException) as exc_info:
        await validate_upload_file(upload_file)
    assert exc_info.value.status_code == 400
    assert "empty" in exc_info.value.detail.lower()


def test_corrupt_pdf_extraction(tmp_path):
    corrupt_file = tmp_path / "corrupt.pdf"
    corrupt_file.write_bytes(b"This is not a real PDF file header.")
    
    with pytest.raises(PDFParsingError) as exc_info:
        extract_pdf(str(corrupt_file))
    assert "Failed to open PDF" in str(exc_info.value)
