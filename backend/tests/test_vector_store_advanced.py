"""
Advanced unit tests for VectorStore and cosine similarity.
Covers search ranking, re-indexing idempotency, zero-vector edge cases,
multi-document isolation, top_k boundary conditions, and min_score filtering.
"""

import os
import pytest
from unittest.mock import MagicMock, patch

from app.schemas.document import DocumentPageSchema
from app.services.chunker import chunk_document_pages
from app.services.vector_store import VectorStore, ChunkMatch, cosine_similarity
from app.services.storage import init_db


# ─── Cosine Similarity Unit Tests ─────────────────────────────────────────────

class TestCosineSimilarity:
    def test_identical_vectors_score_one(self):
        v = [0.5, 0.3, 0.8, 0.1]
        assert cosine_similarity(v, v) == pytest.approx(1.0, abs=1e-6)

    def test_orthogonal_vectors_score_zero(self):
        a = [1.0, 0.0]
        b = [0.0, 1.0]
        assert cosine_similarity(a, b) == pytest.approx(0.0, abs=1e-6)

    def test_opposite_vectors_score_minus_one(self):
        a = [1.0, 0.0]
        b = [-1.0, 0.0]
        assert cosine_similarity(a, b) == pytest.approx(-1.0, abs=1e-6)

    def test_zero_vector_a_returns_zero(self):
        assert cosine_similarity([0.0, 0.0], [1.0, 0.5]) == 0.0

    def test_zero_vector_b_returns_zero(self):
        assert cosine_similarity([1.0, 0.5], [0.0, 0.0]) == 0.0

    def test_both_zero_vectors_returns_zero(self):
        assert cosine_similarity([0.0, 0.0], [0.0, 0.0]) == 0.0

    def test_empty_vectors_returns_zero(self):
        assert cosine_similarity([], []) == 0.0

    def test_mismatched_lengths_returns_zero(self):
        assert cosine_similarity([1.0, 2.0], [1.0]) == 0.0

    def test_high_dimensional_vectors(self):
        """Simulate typical Gemini embedding dimension (~3072)."""
        import math
        dim = 3072
        v = [1.0 / math.sqrt(dim)] * dim
        result = cosine_similarity(v, v)
        assert result == pytest.approx(1.0, abs=1e-4)

    def test_partial_overlap_between_zero_and_one(self):
        a = [1.0, 1.0, 0.0]
        b = [1.0, 0.0, 1.0]
        result = cosine_similarity(a, b)
        assert 0.0 < result < 1.0


# ─── VectorStore Integration Tests ────────────────────────────────────────────

def _make_mock_embedding_service(embedding_value: list) -> MagicMock:
    svc = MagicMock()
    svc.get_embeddings.side_effect = lambda texts: [embedding_value for _ in texts]
    return svc


def _make_pages(text: str, page=1, section=None) -> list:
    return [DocumentPageSchema(page_number=page, text=text, section_info=section)]


class TestVectorStoreIndexing:
    def test_is_document_indexed_false_before_indexing(self, tmp_path):
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            assert vs.is_document_indexed("doc_not_yet") is False

    def test_is_document_indexed_true_after_indexing(self, tmp_path):
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = _make_mock_embedding_service([0.1, 0.2, 0.3])
            chunks = chunk_document_pages("docA", _make_pages("Some contract text."))
            vs.index_document("docA", chunks, svc)
            assert vs.is_document_indexed("docA") is True

    def test_reindexing_clears_old_chunks(self, tmp_path):
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = _make_mock_embedding_service([0.5, 0.5, 0.5])
            chunks_v1 = chunk_document_pages("docB", _make_pages("First version content."))
            chunks_v2 = chunk_document_pages("docB", _make_pages("Second version content."))
            vs.index_document("docB", chunks_v1, svc)
            count_v1 = vs.index_document("docB", chunks_v2, svc)
            # After re-indexing, only new chunks should be present
            results = vs.search("docB", [0.5, 0.5, 0.5], top_k=50)
            assert len(results) == count_v1

    def test_empty_chunks_returns_zero(self, tmp_path):
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = _make_mock_embedding_service([0.1, 0.2])
            count = vs.index_document("docempty", [], svc)
            assert count == 0

    def test_index_returns_correct_chunk_count(self, tmp_path):
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = _make_mock_embedding_service([0.3, 0.3, 0.3])
            pages = [
                DocumentPageSchema(page_number=1, text="Section 1.\n\nParagraph about rent.", section_info=None),
                DocumentPageSchema(page_number=2, text="Section 2.\n\nParagraph about termination.", section_info=None),
            ]
            chunks = chunk_document_pages("doccount", pages, max_chunk_chars=100)
            count = vs.index_document("doccount", chunks, svc)
            assert count == len(chunks)


class TestVectorStoreSearch:
    def test_search_returns_correct_document_id(self, tmp_path):
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = _make_mock_embedding_service([1.0, 0.0, 0.0])
            chunks = chunk_document_pages("docSearch", _make_pages("Rent is $2,400 per month."))
            vs.index_document("docSearch", chunks, svc)
            results = vs.search("docSearch", [1.0, 0.0, 0.0], top_k=5)
            assert len(results) > 0
            assert all(r.document_id == "docSearch" for r in results)

    def test_search_strict_document_isolation(self, tmp_path):
        """Searching doc A must NEVER return chunks from doc B."""
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = _make_mock_embedding_service([0.5, 0.5, 0.5])
            vs.index_document("docIso_A", chunk_document_pages("docIso_A", _make_pages("Content A.")), svc)
            vs.index_document("docIso_B", chunk_document_pages("docIso_B", _make_pages("Content B.")), svc)
            results = vs.search("docIso_A", [0.5, 0.5, 0.5], top_k=100)
            assert all(r.document_id == "docIso_A" for r in results)
            assert all(r.document_id != "docIso_B" for r in results)

    def test_search_top_k_respected(self, tmp_path):
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = _make_mock_embedding_service([0.3, 0.7])
            # Index a document with many paragraphs
            long_text = "\n\n".join([f"Clause {i}: Some legal text about obligation {i}." for i in range(20)])
            chunks = chunk_document_pages("docTopK", _make_pages(long_text), max_chunk_chars=80)
            vs.index_document("docTopK", chunks, svc)
            results = vs.search("docTopK", [0.3, 0.7], top_k=3)
            assert len(results) <= 3

    def test_search_results_sorted_by_score_descending(self, tmp_path):
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = _make_mock_embedding_service([0.5, 0.5, 0.5])
            chunks = chunk_document_pages("docSort", _make_pages("Para one.\n\nPara two.\n\nPara three."))
            vs.index_document("docSort", chunks, svc)
            results = vs.search("docSort", [0.5, 0.5, 0.5], top_k=10)
            scores = [r.score for r in results]
            assert scores == sorted(scores, reverse=True)

    def test_search_on_unindexed_document_returns_empty(self, tmp_path):
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            results = vs.search("nonexistent_doc", [0.1, 0.2, 0.3], top_k=5)
            assert results == []

    def test_search_min_score_filters_low_scores(self, tmp_path):
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = _make_mock_embedding_service([1.0, 0.0, 0.0])
            chunks = chunk_document_pages("docFilter", _make_pages("Lease agreement clause about rent."))
            vs.index_document("docFilter", chunks, svc)
            # Query with orthogonal vector — should be filtered by min_score=0.5
            results = vs.search("docFilter", [0.0, 1.0, 0.0], top_k=10, min_score=0.5)
            assert all(r.score >= 0.5 for r in results)

    def test_chunk_match_fields_populated(self, tmp_path):
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = _make_mock_embedding_service([0.7, 0.3, 0.1])
            pages = _make_pages("SECTION 3. PAYMENT\n\nRent is $2,400 per month.", page=3, section="SECTION 3")
            chunks = chunk_document_pages("docFields", pages)
            vs.index_document("docFields", chunks, svc)
            results = vs.search("docFields", [0.7, 0.3, 0.1], top_k=5)
            assert len(results) > 0
            r = results[0]
            assert r.document_id == "docFields"
            assert r.page_number == 3
            assert isinstance(r.source_text, str) and len(r.source_text) > 0
            assert isinstance(r.score, float)
            assert 0.0 <= r.score <= 1.0

    def test_multiple_documents_independent_search(self, tmp_path):
        """Each document should have independent, non-overlapping search results."""
        db = str(tmp_path / "test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = _make_mock_embedding_service([0.6, 0.4])

            for doc_i in range(5):
                doc_id = f"docMulti_{doc_i}"
                chunks = chunk_document_pages(doc_id, _make_pages(f"Unique clause for document {doc_i}"))
                vs.index_document(doc_id, chunks, svc)

            for doc_i in range(5):
                doc_id = f"docMulti_{doc_i}"
                results = vs.search(doc_id, [0.6, 0.4], top_k=10)
                assert all(r.document_id == doc_id for r in results)
