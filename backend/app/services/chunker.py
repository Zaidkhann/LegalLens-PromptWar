"""
Legal document chunker module.
Splits document pages into section-, clause-, and paragraph-aware chunks
while preserving page numbers and section headings.
"""

import re
import uuid
from typing import List, Optional
from pydantic import BaseModel

from app.schemas.document import DocumentPageSchema


class DocumentChunk(BaseModel):
    chunk_id: str
    document_id: str
    chunk_index: int
    page_number: int
    section: Optional[str] = None
    source_text: str


def _extract_section_heading(text: str, default_section: Optional[str] = None) -> Optional[str]:
    """
    Attempts to identify a section or clause heading from text line matching standard formats.
    e.g., 'SECTION 1. PREMISES', 'CLAUSE 2.1 - RENT', 'ARTICLE III'.
    """
    patterns = [
        r'(?i)^(SECTION\s+[^\n]+)',
        r'(?i)^(CLAUSE\s+[^\n]+)',
        r'(?i)^(ARTICLE\s+[^\n]+)',
        r'^(?:[0-9]{1,2}\.[0-9]{0,2}\s+[A-Z\s]{4,30})',
    ]
    for line in text.splitlines():
        line_clean = line.strip()
        if not line_clean:
            continue
        for p in patterns:
            match = re.search(p, line_clean)
            if match:
                return match.group(0).strip()
    return default_section


def chunk_document_pages(
    document_id: str,
    pages: List[DocumentPageSchema],
    max_chunk_chars: int = 800,
    min_chunk_chars: int = 150,
) -> List[DocumentChunk]:
    """
    Chunks extracted document pages into page-aware and section-aware segments.
    """
    chunks: List[DocumentChunk] = []
    chunk_index = 0

    for page in pages:
        page_num = page.page_number
        page_text = page.text.strip()
        if not page_text:
            continue

        page_section = page.section_info.strip() if page.section_info else None

        # Split text by double newlines or clause boundaries
        raw_paragraphs = [p.strip() for p in re.split(r'\n\s*\n', page_text) if p.strip()]

        current_buffer = ""
        current_section = page_section

        for para in raw_paragraphs:
            # Check if this paragraph introduces a section heading
            heading = _extract_section_heading(para, default_section=current_section)
            if heading and heading != current_section:
                current_section = heading

            # If combining current buffer + paragraph exceeds max length, flush current buffer first
            if current_buffer and (len(current_buffer) + len(para) > max_chunk_chars):
                chunk_id = f"{document_id}_c{chunk_index}"
                chunks.append(
                    DocumentChunk(
                        chunk_id=chunk_id,
                        document_id=document_id,
                        chunk_index=chunk_index,
                        page_number=page_num,
                        section=current_section or page_section,
                        source_text=current_buffer,
                    )
                )
                chunk_index += 1
                current_buffer = ""

            # If single paragraph is larger than max_chunk_chars, split by sentences
            if len(para) > max_chunk_chars:
                sentences = re.split(r'(?<=[.!?])\s+', para)
                sent_buffer = ""
                for sent in sentences:
                    # If a single sentence itself exceeds max_chunk_chars, hard-split by word boundaries
                    if len(sent) > max_chunk_chars:
                        words = sent.split(" ")
                        word_buf = ""
                        for w in words:
                            if word_buf and (len(word_buf) + len(w) + 1 > max_chunk_chars):
                                chunk_id = f"{document_id}_c{chunk_index}"
                                chunks.append(
                                    DocumentChunk(
                                        chunk_id=chunk_id,
                                        document_id=document_id,
                                        chunk_index=chunk_index,
                                        page_number=page_num,
                                        section=current_section or page_section,
                                        source_text=word_buf,
                                    )
                                )
                                chunk_index += 1
                                word_buf = ""
                            word_buf = f"{word_buf} {w}".strip() if word_buf else w
                        if word_buf:
                            sent = word_buf

                    if sent_buffer and (len(sent_buffer) + len(sent) > max_chunk_chars):
                        chunk_id = f"{document_id}_c{chunk_index}"
                        chunks.append(
                            DocumentChunk(
                                chunk_id=chunk_id,
                                document_id=document_id,
                                chunk_index=chunk_index,
                                page_number=page_num,
                                section=current_section or page_section,
                                source_text=sent_buffer,
                            )
                        )
                        chunk_index += 1
                        sent_buffer = ""
                    sent_buffer = f"{sent_buffer} {sent}".strip() if sent_buffer else sent.strip()

                if sent_buffer:
                    current_buffer = sent_buffer
            else:
                current_buffer = f"{current_buffer}\n\n{para}".strip() if current_buffer else para

        # Flush any remaining text on the page
        if current_buffer:
            chunk_id = f"{document_id}_c{chunk_index}"
            chunks.append(
                DocumentChunk(
                    chunk_id=chunk_id,
                    document_id=document_id,
                    chunk_index=chunk_index,
                    page_number=page_num,
                    section=current_section or page_section,
                    source_text=current_buffer,
                )
            )
            chunk_index += 1

    return chunks
