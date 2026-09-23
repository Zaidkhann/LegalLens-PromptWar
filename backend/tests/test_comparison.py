"""
Tests for Phase 5: AI Legal Document Comparison.
Covers section alignment, diff detection, schema validation, error handling, and end-to-end API flow.
"""

import os
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.schemas.document import DocumentPageSchema, ProcessingStatus
from app.schemas.comparison import (
    ChangeType,
    AttentionLevel,
    ComparisonChange,
    DocumentComparison,
    ComparisonRequest,
)
from app.services.comparator import parse_sections_from_pages, align_and_diff_documents
from app.services.storage import (
    init_db,
    save_file_to_disk,
    create_document,
    save_document_pages,
    update_document_status,
)


# ─── 1. Section Alignment & Diff Unit Tests ─────────────────────────────────


def test_section_parsing_and_alignment():
    """Verify section alignment correctly identifies MODIFIED, ADDED, REMOVED clauses."""
    pages_a = [
        DocumentPageSchema(
            page_number=1,
            text="SECTION 1. RENT AND FEES\n\nRent is $2,000 per month due on 1st.\n\nSECTION 2. NOTICE PERIOD\n\n30 days written notice required before non-renewal.",
            section_info="V1",
        )
    ]
    pages_b = [
        DocumentPageSchema(
            page_number=1,
            text="SECTION 1. RENT AND FEES\n\nRent is $2,500 per month due on 1st.\n\nSECTION 2. NOTICE PERIOD\n\n30 days written notice required before non-renewal.\n\nSECTION 3. PET FEE\n\nNon-refundable $500 pet fee required.",
            section_info="V2",
        )
    ]

    aligned = align_and_diff_documents(pages_a, pages_b)

    assert len(aligned) >= 3

    # Section 1 should be MODIFIED ($2000 -> $2500)
    sec1 = next((s for s in aligned if "RENT" in s.title.upper()), None)
    assert sec1 is not None
    assert sec1.change_type == ChangeType.MODIFIED

    # Section 2 should be UNCHANGED
    sec2 = next((s for s in aligned if "NOTICE" in s.title.upper()), None)
    assert sec2 is not None
    assert sec2.change_type == ChangeType.UNCHANGED

    # Section 3 should be ADDED
    sec3 = next((s for s in aligned if "PET" in s.title.upper()), None)
    assert sec3 is not None
    assert sec3.change_type == ChangeType.ADDED


# ─── 2. Validation & Schema Tests ───────────────────────────────────────────


def test_same_document_request_validation():
    """Requesting comparison of a document with itself must fail validation."""
    with pytest.raises(ValueError):
        ComparisonRequest(document_a_id="doc-123", document_b_id="doc-123")


def test_comparison_schema_serialization():
    """Verify DocumentComparison Pydantic schema validation."""
    comp = DocumentComparison(
        comparison_id="comp-1",
        document_a_id="doc-A",
        document_b_id="doc-B",
        document_a_title="Lease V1",
        document_b_title="Lease V2",
        summary="1 modified clause, 1 added clause.",
        total_changes=2,
        added_count=1,
        removed_count=0,
        modified_count=1,
        important_changes_count=1,
        important_changes=["Notice period extended"],
        changes=[
            ComparisonChange(
                id="1",
                section="Clause 8.1 Notice Period",
                change_type=ChangeType.MODIFIED,
                original_text="30 days notice required.",
                revised_text="90 days notice required.",
                explanation="Notice window extended by landlord.",
                attention_level=AttentionLevel.HIGH,
                page_original=1,
                page_revised=1,
                is_important=True,
            )
        ],
    )
    assert comp.total_changes == 2
    assert len(comp.changes) == 1
    assert comp.changes[0].change_type == ChangeType.MODIFIED


# ─── 3. API Endpoint Tests ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_compare_nonexistent_documents():
    """Comparing non-existent document IDs returns 400 error."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/documents/compare",
            json={"document_a_id": "nonexistent-a", "document_b_id": "nonexistent-b"},
        )
        assert res.status_code == 400
        assert "not found" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_compare_same_document_api():
    """Comparing identical document IDs returns 422 validation error."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/documents/compare",
            json={"document_a_id": "same-doc", "document_b_id": "same-doc"},
        )
        assert res.status_code == 422


@pytest.mark.asyncio
async def test_compare_success_flow():
    """End-to-end integration test for document comparison API."""
    init_db()

    # Create Document A (Original)
    doc_a_id, path_a = save_file_to_disk(b"Document A content", "txt")
    create_document(
        doc_id=doc_a_id,
        original_filename="lease_v1.txt",
        title="Lease Agreement V1",
        file_type="txt",
        file_size=100,
        storage_path=path_a,
        status=ProcessingStatus.COMPLETED,
    )
    pages_a = [
        DocumentPageSchema(
            page_number=1,
            text="SECTION 1. RENT\n\nRent is $2,000 per month due on the 1st of each month.",
            section_info="V1",
        )
    ]
    save_document_pages(doc_a_id, pages_a)
    update_document_status(doc_a_id, ProcessingStatus.COMPLETED, page_count=1)

    # Create Document B (Revised)
    doc_b_id, path_b = save_file_to_disk(b"Document B content", "txt")
    create_document(
        doc_id=doc_b_id,
        original_filename="lease_v2.txt",
        title="Lease Agreement V2",
        file_type="txt",
        file_size=120,
        storage_path=path_b,
        status=ProcessingStatus.COMPLETED,
    )
    pages_b = [
        DocumentPageSchema(
            page_number=1,
            text="SECTION 1. RENT\n\nRent is $2,400 per month due on the 1st of each month.",
            section_info="V2",
        )
    ]
    save_document_pages(doc_b_id, pages_b)
    update_document_status(doc_b_id, ProcessingStatus.COMPLETED, page_count=1)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/documents/compare",
            json={"document_a_id": doc_a_id, "document_b_id": doc_b_id},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        comp = data["comparison"]
        assert comp["document_a_id"] == doc_a_id
        assert comp["document_b_id"] == doc_b_id
        assert comp["total_changes"] >= 1
