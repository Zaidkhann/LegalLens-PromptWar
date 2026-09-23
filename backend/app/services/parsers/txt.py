from typing import List, Tuple, Dict, Any
from app.schemas.document import DocumentPageSchema


class TXTParsingError(Exception):
    pass


def extract_txt(file_path: str) -> Tuple[List[DocumentPageSchema], Dict[str, Any]]:
    """
    Safely reads text file using multi-encoding fallback.
    Chunks text into logical pages (~350 words or ~40 lines per page).
    Returns (list of DocumentPageSchema, metadata_dict).
    """
    content = None
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]

    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as f:
                content = f.read()
            break
        except (UnicodeDecodeError, Exception):
            continue

    if content is None:
        raise TXTParsingError("Unable to decode text file with standard encodings.")

    clean_content = content.strip()
    if not clean_content:
        raise TXTParsingError("Text file is empty.")

    # Split by form feed \f if explicit page breaks exist
    if "\f" in clean_content:
        raw_pages = clean_content.split("\f")
    else:
        # Split into paragraphs and group by ~350 words per logical page
        lines = clean_content.splitlines()
        raw_pages = []
        current_page_lines = []
        current_words = 0
        words_per_page = 350

        for line in lines:
            line_str = line.strip()
            word_count = len(line_str.split())

            if (current_words + word_count > words_per_page) and current_page_lines:
                raw_pages.append("\n".join(current_page_lines))
                current_page_lines = []
                current_words = 0

            current_page_lines.append(line)
            current_words += word_count

        if current_page_lines:
            raw_pages.append("\n".join(current_page_lines))

    pages: List[DocumentPageSchema] = []
    total_pages = max(1, len(raw_pages))

    for idx, page_raw in enumerate(raw_pages):
        page_num = idx + 1
        page_text = page_raw.strip()
        lines = [l.strip() for l in page_text.splitlines() if l.strip()]
        section_info = lines[0] if lines and (lines[0].isupper() or len(lines[0]) < 80) else None

        pages.append(
            DocumentPageSchema(
                page_number=page_num,
                text=page_text if page_text else "[Empty Page]",
                section_info=section_info,
            )
        )

    metadata = {
        "page_count": total_pages,
        "title": "",
        "author": "",
    }

    return pages, metadata
