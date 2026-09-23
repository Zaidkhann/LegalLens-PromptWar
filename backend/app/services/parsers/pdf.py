import pymupdf  # PyMuPDF
from typing import List, Tuple, Dict, Any
from app.schemas.document import DocumentPageSchema


class PDFParsingError(Exception):
    pass


def extract_pdf(file_path: str) -> Tuple[List[DocumentPageSchema], Dict[str, Any]]:
    """
    Extracts text page by page from a PDF file using PyMuPDF.
    Returns (list of DocumentPageSchema, metadata_dict).
    """
    try:
        doc = pymupdf.open(file_path)
    except Exception as e:
        raise PDFParsingError(f"Failed to open PDF file. File may be corrupted or invalid: {str(e)}")

    if doc.is_encrypted:
        # Attempt empty password authentication
        if not doc.authenticate(""):
            raise PDFParsingError("PDF is password protected and cannot be extracted.")

    page_count = len(doc)
    if page_count == 0:
        raise PDFParsingError("PDF document contains 0 pages.")

    metadata = doc.metadata or {}
    pdf_meta = {
        "page_count": page_count,
        "title": metadata.get("title") or "",
        "author": metadata.get("author") or "",
        "creation_date": metadata.get("creationDate") or "",
    }

    pages: List[DocumentPageSchema] = []

    for page_idx in range(page_count):
        page = doc.load_page(page_idx)
        page_num = page_idx + 1
        
        # Extract plain text
        raw_text = page.get_text("text") or ""
        clean_text = raw_text.strip()
        
        # Extract possible section header (first line if bold or uppercase)
        lines = [line.strip() for line in clean_text.splitlines() if line.strip()]
        section_info = lines[0] if lines and (lines[0].isupper() or len(lines[0]) < 80) else None

        pages.append(
            DocumentPageSchema(
                page_number=page_num,
                text=clean_text if clean_text else "[Empty Page or Non-Text Elements]",
                section_info=section_info,
            )
        )

    doc.close()
    return pages, pdf_meta
