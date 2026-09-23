"""
Deterministic Section Alignment & Diff Detection Service for LegalLens Document Comparison.
Aligns corresponding sections/clauses between two legal documents and computes structural diffs.
"""

import re
import difflib
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.schemas.document import DocumentPageSchema
from app.schemas.comparison import ChangeType


class SectionBlock(BaseModel):
    key: str
    title: str
    text: str
    page_number: int


class AlignedSection(BaseModel):
    key: str
    title: str
    doc_a_text: str = ""
    doc_b_text: str = ""
    page_a: Optional[int] = None
    page_b: Optional[int] = None
    change_type: ChangeType


def normalize_title(title: str) -> str:
    """Normalizes title string for alignment matching."""
    cleaned = re.sub(r'[^a-zA-Z0-9]', '', title).lower()
    return cleaned


def parse_sections_from_pages(pages: List[DocumentPageSchema]) -> List[SectionBlock]:
    """
    Parses pages into logical section blocks based on headings, numbered clauses, or paragraphs.
    """
    sections: List[SectionBlock] = []

    heading_pattern = re.compile(
        r'(?i)^(SECTION\s+[^\n]+|CLAUSE\s+[^\n]+|ARTICLE\s+[^\n]+|[0-9]{1,2}\.[0-9]{0,2}\s+[A-Z\s]{3,40})'
    )

    current_title = "Preamble & General Terms"
    current_key = "section_0"
    current_text_lines = []
    current_page = 1
    section_count = 0

    for page in pages:
        p_num = page.page_number
        lines = page.text.splitlines()

        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue

            match = heading_pattern.search(line_clean)
            if match:
                # Flush existing section if it has text
                if current_text_lines:
                    text_block = "\n".join(current_text_lines).strip()
                    if text_block:
                        sections.append(
                            SectionBlock(
                                key=current_key,
                                title=current_title,
                                text=text_block,
                                page_number=current_page,
                            )
                        )
                section_count += 1
                current_title = match.group(1).strip()
                current_key = f"sec_{normalize_title(current_title)}"
                current_page = p_num
                current_text_lines = [line_clean]
            else:
                current_text_lines.append(line_clean)

    # Flush final section
    if current_text_lines:
        text_block = "\n".join(current_text_lines).strip()
        if text_block:
            sections.append(
                SectionBlock(
                    key=current_key,
                    title=current_title,
                    text=text_block,
                    page_number=current_page,
                )
            )

    # Fallback if no explicit headings were found: chunk by paragraphs/pages
    if len(sections) <= 1 and pages:
        sections = []
        for p in pages:
            paras = [p.strip() for p in p.text.split("\n\n") if p.strip()]
            for idx, para in enumerate(paras, 1):
                first_line = para.splitlines()[0][:50]
                title = f"Page {p.page_number} - Section {idx}: {first_line}"
                key = f"page_{p.page_number}_para_{idx}"
                sections.append(
                    SectionBlock(
                        key=key,
                        title=title,
                        text=para,
                        page_number=p.page_number,
                    )
                )

    return sections


def align_and_diff_documents(
    pages_a: List[DocumentPageSchema],
    pages_b: List[DocumentPageSchema],
) -> List[AlignedSection]:
    """
    Aligns section blocks from Document A and Document B and categorizes each as
    ADDED, REMOVED, MODIFIED, or UNCHANGED.
    """
    sections_a = parse_sections_from_pages(pages_a)
    sections_b = parse_sections_from_pages(pages_b)

    aligned_results: List[AlignedSection] = []

    # Map sections by normalized title / key
    map_a = {s.key: s for s in sections_a}
    map_b = {s.key: s for s in sections_b}

    visited_keys_b = set()

    for sec_a in sections_a:
        key = sec_a.key
        match_b = map_b.get(key)

        # Fuzzy title matching if exact key match is missing
        if not match_b:
            for kb, sb in map_b.items():
                if kb not in visited_keys_b:
                    sim = difflib.SequenceMatcher(None, sec_a.title.lower(), sb.title.lower()).ratio()
                    if sim > 0.8:
                        match_b = sb
                        key = kb
                        break

        if match_b:
            visited_keys_b.add(match_b.key)
            # Compare texts
            norm_text_a = re.sub(r'\s+', ' ', sec_a.text.strip())
            norm_text_b = re.sub(r'\s+', ' ', match_b.text.strip())

            if norm_text_a == norm_text_b:
                change_type = ChangeType.UNCHANGED
            else:
                change_type = ChangeType.MODIFIED

            aligned_results.append(
                AlignedSection(
                    key=key,
                    title=sec_a.title,
                    doc_a_text=sec_a.text,
                    doc_b_text=match_b.text,
                    page_a=sec_a.page_number,
                    page_b=match_b.page_number,
                    change_type=change_type,
                )
            )
        else:
            # Section in A but removed from B
            aligned_results.append(
                AlignedSection(
                    key=key,
                    title=sec_a.title,
                    doc_a_text=sec_a.text,
                    doc_b_text="",
                    page_a=sec_a.page_number,
                    page_b=None,
                    change_type=ChangeType.REMOVED,
                )
            )

    # Any section in B not matched with A is ADDED
    for sec_b in sections_b:
        if sec_b.key not in visited_keys_b:
            # Double check it wasn't processed
            if not any(r.key == sec_b.key for r in aligned_results):
                aligned_results.append(
                    AlignedSection(
                        key=sec_b.key,
                        title=sec_b.title,
                        doc_a_text="",
                        doc_b_text=sec_b.text,
                        page_a=None,
                        page_b=sec_b.page_number,
                        change_type=ChangeType.ADDED,
                    )
                )

    return aligned_results
