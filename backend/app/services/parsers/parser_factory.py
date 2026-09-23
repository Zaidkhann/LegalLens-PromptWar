from typing import List, Tuple, Dict, Any
from app.schemas.document import DocumentPageSchema
from app.services.parsers.pdf import extract_pdf, PDFParsingError
from app.services.parsers.docx import extract_docx, DOCXParsingError
from app.services.parsers.txt import extract_txt, TXTParsingError


class UnsupportedDocumentError(Exception):
    pass


def parse_document(file_path: str, file_type: str) -> Tuple[List[DocumentPageSchema], Dict[str, Any]]:
    """
    Parses document at file_path based on file_type ('pdf', 'docx', 'txt').
    Returns (pages, metadata).
    Raises exception on extraction or parsing failure.
    """
    ext = file_type.lower().lstrip(".")
    
    if ext == "pdf":
        return extract_pdf(file_path)
    elif ext == "docx":
        return extract_docx(file_path)
    elif ext == "txt":
        return extract_txt(file_path)
    else:
        raise UnsupportedDocumentError(f"Unsupported document file type '{file_type}'.")
