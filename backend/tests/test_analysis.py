"""
Tests for Phase 3: GenAI Legal Document Analysis.
Covers schema validation, analysis status transitions, and API endpoints.
"""

import os
import json
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.analysis import (
    LegalAnalysis,
    DocumentOverview,
    ImportantClause,
    AttentionSignal,
    Obligation,
    ImportantDate,
    ActionItem,
    LawyerQuestion,
    PlainLanguageExplanation,
    AnalysisStatus,
    FullAnalysisResponse,
)
from app.services.storage import (
    init_db,
    update_analysis_status,
    get_analysis_status,
    save_analysis,
    get_analysis,
)

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")


# ─── Schema Validation Tests ──────────────────────────────────────────────────


def test_legal_analysis_schema_full():
    """A fully populated LegalAnalysis should validate."""
    data = {
        "overview": {
            "document_type": "Lease Agreement",
            "purpose": "Residential lease for an apartment",
            "parties": ["Landlord LLC", "John Doe"],
            "key_dates": ["October 1, 2026"],
            "financial_terms": ["$2,500/month rent"],
            "duration": "12 months",
            "important_obligations": ["Pay rent on time"],
            "summary": "A standard residential lease agreement.",
        },
        "plain_language": {
            "summary": "This document is a lease agreement.",
            "key_takeaways": ["You pay rent monthly.", "Lease lasts 12 months."],
        },
        "important_clauses": [
            {
                "category": "Payment",
                "title": "Rent Payment",
                "original_text": "Lessee shall pay $2,500 per month.",
                "plain_explanation": "You pay $2,500 each month.",
                "page_number": 1,
                "source_reference": "Clause 2.1",
            }
        ],
        "attention_signals": [
            {
                "title": "Early Termination Penalty",
                "category": "Termination",
                "severity": "HIGH",
                "what_it_says": "Forfeit security deposit on early termination.",
                "why_it_matters": "May deserve clarification as penalty is significant.",
                "clarification_needed": "Ask if penalty can be negotiated.",
                "page_number": 2,
                "source_reference": "Clause 8.2",
            }
        ],
        "obligations": [
            {
                "party": "Lessee",
                "obligation": "Pay rent on the 1st of each month",
                "deadline": "1st of each month",
                "condition": None,
                "page_number": 1,
            }
        ],
        "important_dates": [
            {
                "date": "October 1, 2026",
                "description": "Lease commencement date",
                "related_clause": "Clause 1.1",
                "page_number": 1,
            }
        ],
        "action_items": [
            {
                "task": "Review early termination clause",
                "category": "REVIEW",
                "priority": "HIGH",
                "reason": "Significant financial penalty applies",
                "page_number": 2,
            }
        ],
        "lawyer_questions": [
            {
                "question": "Can the early termination penalty be reduced?",
                "context": "Clause 8.2 requires forfeiture of entire deposit.",
                "page_number": 2,
            }
        ],
    }
    analysis = LegalAnalysis.model_validate(data)
    assert analysis.overview.document_type == "Lease Agreement"
    assert len(analysis.important_clauses) == 1
    assert analysis.important_clauses[0].page_number == 1
    assert len(analysis.attention_signals) == 1
    assert analysis.attention_signals[0].severity == "HIGH"
    assert len(analysis.obligations) == 1
    assert len(analysis.action_items) == 1
    assert len(analysis.lawyer_questions) == 1


def test_legal_analysis_schema_empty():
    """A LegalAnalysis with all empty/null fields should still validate."""
    data = {
        "overview": None,
        "plain_language": None,
        "important_clauses": [],
        "attention_signals": [],
        "obligations": [],
        "important_dates": [],
        "action_items": [],
        "lawyer_questions": [],
    }
    analysis = LegalAnalysis.model_validate(data)
    assert analysis.overview is None
    assert analysis.important_clauses == []


def test_legal_analysis_schema_missing_page_numbers():
    """Clauses with null page numbers should be accepted."""
    data = {
        "important_clauses": [
            {
                "category": "Payment",
                "title": "Monthly rent",
                "original_text": "Pay rent.",
                "plain_explanation": "You pay rent.",
                "page_number": None,
                "source_reference": None,
            }
        ],
    }
    analysis = LegalAnalysis.model_validate(data)
    assert analysis.important_clauses[0].page_number is None


def test_full_analysis_response_includes_disclaimer():
    """FullAnalysisResponse should always include the disclaimer."""
    resp = FullAnalysisResponse(
        document_id="test-123",
        analysis_status=AnalysisStatus.COMPLETED,
        analysis=None,
    )
    assert "does not provide legal advice" in resp.disclaimer


# ─── Storage / Status Transition Tests ────────────────────────────────────────


@pytest.mark.asyncio
async def test_analysis_status_transitions():
    """Upload a document and verify analysis status transitions."""
    transport = ASGITransport(app=app)
    pdf_path = os.path.join(SAMPLES_DIR, "sample_contract.pdf")

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        with open(pdf_path, "rb") as f:
            res = await ac.post("/api/v1/documents/upload", files={"file": ("sample.pdf", f, "application/pdf")})
        assert res.status_code == 201
        doc_id = res.json()["document_id"]

        # Check initial analysis status via GET analysis
        analysis_res = await ac.get(f"/api/v1/documents/{doc_id}/analysis")
        assert analysis_res.status_code == 200
        assert analysis_res.json()["analysis_status"] == "not_started"
        assert analysis_res.json()["analysis"] is None
        assert "does not provide legal advice" in analysis_res.json()["disclaimer"]


@pytest.mark.asyncio
async def test_analyze_nonexistent_document():
    """Analyzing a non-existent document should return 404."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/documents/nonexistent-id/analyze")
        assert res.status_code == 404


@pytest.mark.asyncio
async def test_get_analysis_nonexistent_document():
    """Getting analysis of a non-existent document should return 404."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/documents/nonexistent-id/analysis")
        assert res.status_code == 404


def test_save_and_retrieve_analysis():
    """Directly test save_analysis and get_analysis storage functions."""
    init_db()
    # We need a document to exist first — use the previous test infrastructure
    from app.services.storage import save_file_to_disk, create_document

    doc_id, _ = save_file_to_disk(b"dummy content for analysis test", "txt")
    create_document(
        doc_id=doc_id,
        original_filename="test_analysis.txt",
        title="Test Analysis Document",
        file_type="txt",
        file_size=30,
        storage_path="/dummy/path",
    )

    analysis_data = {
        "overview": {"document_type": "Test", "summary": "A test document"},
        "important_clauses": [],
        "attention_signals": [],
        "obligations": [],
        "important_dates": [],
        "action_items": [],
        "lawyer_questions": [],
    }

    save_analysis(doc_id, analysis_data)
    retrieved = get_analysis(doc_id)
    assert retrieved is not None
    assert retrieved["overview"]["document_type"] == "Test"

    # Verify status updates
    update_analysis_status(doc_id, AnalysisStatus.COMPLETED)
    status = get_analysis_status(doc_id)
    assert status == "completed"
