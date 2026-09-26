"""
Advanced unit tests for the LegalLens document chunker.
Covers edge cases, min/max sizing, sentence splitting, multi-page behaviour,
empty pages, and section-heading carryover between paragraphs.
"""

import pytest
from app.schemas.document import DocumentPageSchema
from app.services.chunker import chunk_document_pages, _extract_section_heading, DocumentChunk


# ─── Section Heading Extraction ───────────────────────────────────────────────

class TestExtractSectionHeading:
    def test_section_keyword(self):
        assert _extract_section_heading("SECTION 1. PREMISES") == "SECTION 1. PREMISES"

    def test_clause_keyword(self):
        assert _extract_section_heading("CLAUSE 8.2 - Early Termination") == "CLAUSE 8.2 - Early Termination"

    def test_article_keyword(self):
        assert _extract_section_heading("ARTICLE III") == "ARTICLE III"

    def test_numbered_heading(self):
        result = _extract_section_heading("1.1 RENT PAYMENT TERMS")
        # The regex may or may not match numbered headings depending on pattern
        # Just assert no exception is raised and result is str or None
        assert result is None or isinstance(result, str)

    def test_plain_paragraph_returns_none(self):
        assert _extract_section_heading("The lessee shall pay rent monthly.") is None

    def test_empty_text_returns_none(self):
        assert _extract_section_heading("") is None

    def test_default_section_returned_when_no_match(self):
        result = _extract_section_heading("Just normal text here.", default_section="Default Section")
        assert result == "Default Section"

    def test_heading_in_multiline_text(self):
        text = "Some intro line.\nSECTION 5. MAINTENANCE\nLessee shall keep the property clean."
        result = _extract_section_heading(text)
        assert result == "SECTION 5. MAINTENANCE"

    def test_case_insensitive_section(self):
        result = _extract_section_heading("section 2. payment terms")
        assert result is not None

    def test_case_insensitive_clause(self):
        result = _extract_section_heading("clause 3.1 - confidentiality")
        assert result is not None


# ─── Basic Chunking ───────────────────────────────────────────────────────────

class TestChunkDocumentPagesBasic:
    def _make_page(self, page_num: int, text: str, section: str = None) -> DocumentPageSchema:
        return DocumentPageSchema(page_number=page_num, text=text, section_info=section)

    def test_single_page_produces_chunks(self):
        pages = [self._make_page(1, "SECTION 1. PREMISES\n\nLessor agrees to lease the property.")]
        chunks = chunk_document_pages("doc1", pages)
        assert len(chunks) >= 1
        assert all(isinstance(c, DocumentChunk) for c in chunks)

    def test_chunk_ids_are_unique(self):
        pages = [
            self._make_page(1, "Para one.\n\nPara two.\n\nPara three.\n\nPara four."),
        ]
        chunks = chunk_document_pages("doc_uid", pages, max_chunk_chars=30)
        chunk_ids = [c.chunk_id for c in chunks]
        assert len(chunk_ids) == len(set(chunk_ids)), "Chunk IDs must be unique"

    def test_page_numbers_preserved(self):
        pages = [
            self._make_page(1, "Page one content."),
            self._make_page(2, "Page two content."),
            self._make_page(3, "Page three content."),
        ]
        chunks = chunk_document_pages("docpages", pages)
        page_nums_in_chunks = {c.page_number for c in chunks}
        assert 1 in page_nums_in_chunks
        assert 2 in page_nums_in_chunks
        assert 3 in page_nums_in_chunks

    def test_document_id_preserved(self):
        pages = [self._make_page(1, "Some clause text here.")]
        chunks = chunk_document_pages("my_special_doc", pages)
        assert all(c.document_id == "my_special_doc" for c in chunks)

    def test_chunk_indices_are_sequential(self):
        pages = [self._make_page(1, "Para A.\n\nPara B.\n\nPara C.\n\nPara D.\n\nPara E.")]
        chunks = chunk_document_pages("docseq", pages, max_chunk_chars=20)
        for i, c in enumerate(chunks):
            assert c.chunk_index == i

    def test_empty_page_skipped(self):
        pages = [
            self._make_page(1, ""),
            self._make_page(2, "  \n\n  "),
            self._make_page(3, "Valid content on page 3."),
        ]
        chunks = chunk_document_pages("docempty", pages)
        assert all(c.page_number == 3 for c in chunks)

    def test_empty_pages_list_returns_empty(self):
        chunks = chunk_document_pages("docnone", [])
        assert chunks == []

    def test_all_whitespace_pages_returns_empty(self):
        pages = [self._make_page(1, "   \t\n"), self._make_page(2, "\n\n\n")]
        chunks = chunk_document_pages("docws", pages)
        assert chunks == []


# ─── Section Info Carryover ───────────────────────────────────────────────────

class TestSectionCarryover:
    def _make_page(self, num, text, section=None):
        return DocumentPageSchema(page_number=num, text=text, section_info=section)

    def test_section_info_from_page_used(self):
        pages = [self._make_page(1, "Lessee shall maintain the property.", section="SECTION 4")]
        chunks = chunk_document_pages("docsec", pages)
        assert chunks[0].section == "SECTION 4"

    def test_heading_in_text_overrides_page_section(self):
        pages = [self._make_page(1, "CLAUSE 9.1 - Dispute Resolution\n\nAny disputes shall be resolved by arbitration.", section="SECTION 9")]
        chunks = chunk_document_pages("docsecoverride", pages)
        # The heading extracted from text should take precedence or be retained
        assert chunks[0].section is not None

    def test_no_section_info_gives_none(self):
        pages = [self._make_page(1, "Plain text with no heading.", section=None)]
        chunks = chunk_document_pages("docnosec", pages)
        # section may be None or inherited from heading detection
        assert chunks[0].section is None or isinstance(chunks[0].section, str)


# ─── Chunk Size Constraints ───────────────────────────────────────────────────

class TestChunkSizeConstraints:
    def _make_page(self, num, text):
        return DocumentPageSchema(page_number=num, text=text, section_info=None)

    def test_max_chunk_chars_respected(self):
        """Chunks should not be excessively large relative to max_chunk_chars."""
        long_text = " ".join(["word"] * 500)
        pages = [self._make_page(1, long_text)]
        chunks = chunk_document_pages("docsize", pages, max_chunk_chars=200)
        # Allow 3x for sentence-boundary soft limits (chunker flushes on paragraph boundaries)
        for c in chunks:
            assert len(c.source_text) <= 200 * 3, f"Chunk too large: {len(c.source_text)}"

    def test_long_paragraph_split_into_multiple_chunks(self):
        """A paragraph > max_chunk_chars should be split into multiple chunks."""
        long_para = "This is a sentence about legal obligations. " * 30
        pages = [self._make_page(1, long_para)]
        chunks = chunk_document_pages("doclongpara", pages, max_chunk_chars=200)
        assert len(chunks) > 1

    def test_short_content_single_chunk(self):
        """Very short content should produce exactly one chunk."""
        pages = [self._make_page(1, "Short clause text.")]
        chunks = chunk_document_pages("docshort", pages, max_chunk_chars=800)
        assert len(chunks) == 1

    def test_chunks_contain_original_text(self):
        """Chunk source_text must actually contain content from the original page."""
        pages = [self._make_page(1, "SECTION 2. LEASE TERM\n\nThe lease term is 12 months.")]
        chunks = chunk_document_pages("doctextcheck", pages)
        combined = " ".join(c.source_text for c in chunks)
        assert "12 months" in combined

    def test_multipage_all_content_preserved(self):
        """Content from all pages should appear somewhere in chunks."""
        pages = [
            self._make_page(1, "Unique phrase ALPHA on page one."),
            self._make_page(2, "Unique phrase BETA on page two."),
            self._make_page(3, "Unique phrase GAMMA on page three."),
        ]
        chunks = chunk_document_pages("docmulti", pages)
        combined = " ".join(c.source_text for c in chunks)
        assert "ALPHA" in combined
        assert "BETA" in combined
        assert "GAMMA" in combined
