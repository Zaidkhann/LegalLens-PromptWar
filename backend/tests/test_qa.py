"""
Tests for Phase 4: Grounded Legal Document Q&A / RAG.
Covers chunking, vector storage isolation, schema validation, RAG pipeline, and API endpoints.
"""

import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.schemas.document import DocumentPageSchema
from app.schemas.qa import QARequest, QAResponse, LegalAnswer, SourceCitation
from app.services.chunker import chunk_document_pages, _extract_section_heading
from app.services.vector_store import VectorStore, ChunkMatch, cosine_similarity
from app.services.storage import init_db, save_file_to_disk, create_document, save_document_pages, update_document_status, ProcessingStatus

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")


# ─── 1. Chunker Unit Tests ───────────────────────────────────────────────────


def test_chunker_basic():
    """Verify document chunker preserves page numbers and splits cleanly."""
    pages = [
        DocumentPageSchema(
            page_number=1,
            text="SECTION 1. PREMISES\n\nLessor agrees to lease the premises to Lessee.\n\nCLAUSE 1.1 - TERM\nThe lease term is 12 months starting Oct 1, 2026.",
            section_info="SECTION I",
        ),
        DocumentPageSchema(
            page_number=2,
            text="CLAUSE 2.1 - RENT\n\nRent is $2,400 due on 1st of each month. Late fee is $100 after 5 days.",
            section_info="SECTION II",
        ),
    ]

    chunks = chunk_document_pages("doc_test_1", pages, max_chunk_chars=300)

    assert len(chunks) >= 2
    assert chunks[0].document_id == "doc_test_1"
    assert chunks[0].page_number == 1
    assert any(c.page_number == 2 for c in chunks)


def test_extract_section_heading():
    """Verify section heading extraction helper."""
    h1 = _extract_section_heading("SECTION 3. TERMINATION AND PENALTIES")
    assert h1 == "SECTION 3. TERMINATION AND PENALTIES"

    h2 = _extract_section_heading("CLAUSE 8.2 - Early Termination")
    assert h2 == "CLAUSE 8.2 - Early Termination"

    h3 = _extract_section_heading("Standard paragraph text without heading.")
    assert h3 is None


# ─── 2. Vector Store & Isolation Tests ───────────────────────────────────────


def test_cosine_similarity():
    """Verify vector cosine similarity calculation."""
    vec_a = [1.0, 0.0, 0.0]
    vec_b = [1.0, 0.0, 0.0]
    vec_c = [0.0, 1.0, 0.0]

    assert cosine_similarity(vec_a, vec_b) == 1.0
    assert cosine_similarity(vec_a, vec_c) == 0.0


def test_vector_store_strict_isolation(tmp_path):
    """
    CRITICAL SECURITY & ISOLATION TEST:
    Searching for Document A must NEVER return chunks from Document B.
    """
    db_file = os.path.join(tmp_path, "test_vector.sqlite3")

    with patch("app.services.vector_store.DB_PATH", db_file), patch("app.services.storage.DB_PATH", db_file):
        init_db()
        vs = VectorStore(db_path=db_file)

        mock_embedding_service = MagicMock()
        mock_embedding_service.get_embeddings.side_effect = lambda texts: [[0.5, 0.5, 0.5] for _ in texts]

        pages_doc_a = [
            DocumentPageSchema(page_number=1, text="Secret content of Document A about confidential merger.", section_info="Doc A")
        ]
        pages_doc_b = [
            DocumentPageSchema(page_number=1, text="Public content of Document B about residential lease.", section_info="Doc B")
        ]

        chunks_a = chunk_document_pages("doc_A", pages_doc_a)
        chunks_b = chunk_document_pages("doc_B", pages_doc_b)

        vs.index_document("doc_A", chunks_a, mock_embedding_service)
        vs.index_document("doc_B", chunks_b, mock_embedding_service)

        # Search query strictly scoped to doc_A
        query_emb = [0.5, 0.5, 0.5]
        results_a = vs.search("doc_A", query_emb, top_k=10)

        assert len(results_a) > 0
        for r in results_a:
            assert r.document_id == "doc_A"
            assert r.document_id != "doc_B"


# ─── 3. Schema & Validation Tests ───────────────────────────────────────────


def test_qa_request_validation():
    """Verify QARequest validates valid questions and rejects invalid ones."""
    valid_req = QARequest(question="  What is the rent payment due date?  ")
    assert valid_req.question == "What is the rent payment due date?"

    with pytest.raises(ValueError):
        QARequest(question="   ")

    with pytest.raises(ValueError):
        QARequest(question="a" * 1001)


def test_legal_answer_schema():
    """Verify LegalAnswer validation."""
    data = {
        "answer": "Rent is $2,400 per month due on the 1st.",
        "key_points": ["Rent is $2,400", "Due on the 1st"],
        "citations": [
            {
                "page_number": 2,
                "section": "Clause 2.1",
                "excerpt": "Rent is $2,400 per month payable on the 1st of each month.",
                "relevance": 0.95,
            }
        ],
        "confidence": "HIGH",
        "not_found": False,
    }

    ans = LegalAnswer.model_validate(data)
    assert ans.answer.startswith("Rent is $2,400")
    assert len(ans.citations) == 1
    assert ans.citations[0].page_number == 2


# ─── 4. API Endpoints Tests ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_chat_nonexistent_document():
    """Asking a question about a non-existent document returns 404."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/documents/nonexistent-id-999/chat", json={"question": "What is the penalty?"})
        assert res.status_code == 404
        assert "not found" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_chat_empty_question():
    """Sending an empty question returns 422 validation error."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/documents/some-id/chat", json={"question": "   "})
        assert res.status_code == 422


@pytest.mark.asyncio
async def test_chat_success_flow():
    """Full grounded Q&A integration test with a test document."""
    init_db()

    doc_id, storage_path = save_file_to_disk(b"Sample Lease Content text layer", "txt")
    create_document(
        doc_id=doc_id,
        original_filename="sample_lease.txt",
        title="Sample Lease Agreement",
        file_type="txt",
        file_size=100,
        storage_path=storage_path,
        status=ProcessingStatus.COMPLETED,
    )
    pages = [
        DocumentPageSchema(
            page_number=1,
            text="SECTION 3. PAYMENT TERMS\n\nRent is $2,400 per month due on the 1st of each month. A grace period of 5 days applies before a $100 late fee.",
            section_info="SECTION III",
        ),
        DocumentPageSchema(
            page_number=2,
            text="SECTION 8. TERMINATION\n\nTenant may terminate this agreement with 60 days prior written notice.",
            section_info="SECTION VIII",
        ),
    ]
    save_document_pages(doc_id, pages)
    update_document_status(doc_id, ProcessingStatus.COMPLETED, page_count=2)

    transport = ASGITransport(app=app)

    # Mock embedding & gemini answer for offline fast testing
    mock_emb = [0.1] * 3072

    fake_qa_resp = QAResponse(
        success=True,
        question="What is the rent payment grace period?",
        answer="According to Section 3 of the agreement, rent is due on the 1st with a 5-day grace period before a $100 late fee is charged.",
        key_points=["Rent is due on 1st of month", "5-day grace period applies", "$100 late fee after grace period"],
        citations=[
            SourceCitation(
                page_number=1,
                section="SECTION III",
                excerpt="Rent is $2,400 per month due on the 1st of each month. A grace period of 5 days applies...",
                relevance=0.92,
            )
        ],
        not_found=False,
    )

    with patch("app.services.rag_service.rag_service.answer_question", new_callable=AsyncMock) as mock_answer:
        mock_answer.return_value = fake_qa_resp

        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.post(f"/api/v1/documents/{doc_id}/chat", json={"question": "What is the rent payment grace period?"})
            assert res.status_code == 200
            data = res.json()
            assert data["success"] is True
            assert "5-day grace period" in data["answer"]
            assert len(data["citations"]) == 1
            assert data["citations"][0]["page_number"] == 1
