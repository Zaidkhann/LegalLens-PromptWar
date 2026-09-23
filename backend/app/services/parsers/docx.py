import docx
from typing import List, Tuple, Dict, Any
from app.schemas.document import DocumentPageSchema


class DOCXParsingError(Exception):
    pass


def extract_docx(file_path: str) -> Tuple[List[DocumentPageSchema], Dict[str, Any]]:
    """
    Extracts text paragraphs from a DOCX file using python-docx.
    Groups content into structured logical pages (~400 words per page or page breaks).
    Returns (list of DocumentPageSchema, metadata_dict).
    """
    try:
        doc = docx.Document(file_path)
    except Exception as e:
        raise DOCXParsingError(f"Failed to open DOCX file. File may be corrupted or invalid: {str(e)}")

    paragraphs = doc.paragraphs
    tables = doc.tables

    if not paragraphs and not tables:
        raise DOCXParsingError("DOCX document contains no readable content.")

    page_chunks: List[List[str]] = [[]]
    page_sections: List[str] = [None]
    current_word_count = 0
    words_per_page = 400

    for p in paragraphs:
        text = p.text.strip()
        if not text:
            continue

        # Detect heading style or bold line for section info
        is_heading = p.style.name.startswith("Heading") or (len(text) < 80 and text.isupper())
        if is_heading and not page_sections[-1]:
            page_sections[-1] = text

        # Check for manual page break element in XML
        has_page_break = "w:br" in p._element.xml and 'type="page"' in p._element.xml

        word_count = len(text.split())

        if has_page_break or (current_word_count + word_count > words_per_page and page_chunks[-1]):
            page_chunks.append([])
            page_sections.append(text if is_heading else None)
            current_word_count = 0

        page_chunks[-1].append(text)
        current_word_count += word_count

    # Extract tables content if present
    for table in tables:
        table_rows = []
        for row in table.rows:
            cell_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if cell_texts:
                table_rows.append(" | ".join(cell_texts))
        if table_rows:
            table_str = "\n".join(table_rows)
            if not page_chunks or (current_word_count + len(table_str.split()) > words_per_page):
                page_chunks.append([])
                page_sections.append(None)
                current_word_count = 0
            page_chunks[-1].append(f"[Table Data]\n{table_str}")
            current_word_count += len(table_str.split())

    pages: List[DocumentPageSchema] = []
    total_pages = max(1, len(page_chunks))

    for idx, chunk in enumerate(page_chunks):
        page_num = idx + 1
        page_text = "\n\n".join(chunk).strip()
        sec_info = page_sections[idx]

        pages.append(
            DocumentPageSchema(
                page_number=page_num,
                text=page_text if page_text else "[Empty Page]",
                section_info=sec_info,
            )
        )

    metadata = {
        "page_count": total_pages,
        "title": doc.core_properties.title or "",
        "author": doc.core_properties.author or "",
    }

    return pages, metadata
