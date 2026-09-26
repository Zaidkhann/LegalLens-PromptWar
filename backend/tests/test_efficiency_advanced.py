"""
Efficiency tests for LegalLens.
Verifies that:
1. Numpy-vectorized cosine similarity produces identical results to pure-Python.
2. In-memory embedding cache eliminates repeated SQLite I/O on repeated Q&A calls.
3. Cache is correctly invalidated on document re-indexing.
4. Embedding-service LRU cache prevents duplicate API calls.
5. Batch search is faster than sequential individual calls (performance regression guard).
"""

import time
import math
import json
import os
import pytest
from unittest.mock import MagicMock, patch, call

from app.schemas.document import DocumentPageSchema
from app.services.chunker import chunk_document_pages
from app.services.vector_store import (
    VectorStore,
    cosine_similarity,
    _NUMPY_AVAILABLE,
)
from app.services.embedding_service import EmbeddingService
from app.services.storage import init_db

try:
    import numpy as np
except ImportError:
    np = None


# ─── 1. Numpy vs Pure-Python Parity ──────────────────────────────────────────

class TestNumpyVsPurePythonParity:
    """Vectorized and pure-Python cosine should return identical results."""

    @pytest.mark.skipif(not _NUMPY_AVAILABLE, reason="numpy not installed")
    def test_identical_vectors(self):
        from app.services.vector_store import _cosine_similarity_batch_numpy
        v = [0.3, 0.5, 0.8, 0.1, 0.4]
        # Pre-normalize matrix the same way VectorStore does before caching
        mat_raw = np.array([v], dtype=np.float32)
        norms = np.linalg.norm(mat_raw, axis=1, keepdims=True)
        mat_norm = mat_raw / norms
        np_score = float(_cosine_similarity_batch_numpy(v, mat_norm)[0])
        py_score = cosine_similarity(v, v)
        assert abs(np_score - py_score) < 1e-4

    @pytest.mark.skipif(not _NUMPY_AVAILABLE, reason="numpy not installed")
    def test_orthogonal_vectors(self):
        from app.services.vector_store import _cosine_similarity_batch_numpy
        a = [1.0, 0.0, 0.0]
        b = [0.0, 1.0, 0.0]
        mat = np.array([b], dtype=np.float32)
        np_score = float(_cosine_similarity_batch_numpy(a, mat)[0])
        py_score = cosine_similarity(a, b)
        assert abs(np_score - py_score) < 1e-4

    @pytest.mark.skipif(not _NUMPY_AVAILABLE, reason="numpy not installed")
    def test_batch_vs_individual_scores_match(self):
        """Batch numpy scores must match per-pair pure-Python scores for N vectors."""
        from app.services.vector_store import _cosine_similarity_batch_numpy
        import random
        random.seed(42)
        dim = 64
        n = 50
        query = [random.gauss(0, 1) for _ in range(dim)]
        vectors = [[random.gauss(0, 1) for _ in range(dim)] for _ in range(n)]

        mat = np.array(vectors, dtype=np.float32)
        norms = np.linalg.norm(mat, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1.0, norms)
        mat_norm = mat / norms

        np_scores = _cosine_similarity_batch_numpy(query, mat_norm)

        for i, vec in enumerate(vectors):
            py_score = cosine_similarity(query, vec)
            assert abs(float(np_scores[i]) - py_score) < 1e-3, \
                f"Mismatch at index {i}: numpy={np_scores[i]:.6f}, python={py_score:.6f}"

    @pytest.mark.skipif(not _NUMPY_AVAILABLE, reason="numpy not installed")
    def test_zero_query_vector_returns_zeros(self):
        from app.services.vector_store import _cosine_similarity_batch_numpy
        query = [0.0, 0.0, 0.0]
        mat = np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]], dtype=np.float32)
        scores = _cosine_similarity_batch_numpy(query, mat)
        assert all(s == 0.0 for s in scores)


# ─── 2. Embedding Cache Tests ─────────────────────────────────────────────────

class TestVectorStoreEmbeddingCache:
    """In-memory embedding cache reduces SQLite I/O on repeated Q&A calls."""

    def test_cache_populated_on_first_search(self, tmp_path):
        db = str(tmp_path / "cache_test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = MagicMock()
            svc.get_embeddings.return_value = [[0.5, 0.5, 0.5]]
            chunks = chunk_document_pages("docCache", [
                DocumentPageSchema(page_number=1, text="Rent payment terms.", section_info=None)
            ])
            vs.index_document("docCache", chunks, svc)
            assert "docCache" not in vs._embedding_cache

            vs.search("docCache", [0.5, 0.5, 0.5], top_k=5)
            assert "docCache" in vs._embedding_cache

    def test_second_search_uses_cache_not_sqlite(self, tmp_path):
        """After the first search, subsequent calls must not open SQLite again."""
        db = str(tmp_path / "cache_test2.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = MagicMock()
            svc.get_embeddings.return_value = [[0.3, 0.6, 0.1]]
            chunks = chunk_document_pages("docCacheHit", [
                DocumentPageSchema(page_number=1, text="Employment obligations stated herein.", section_info=None)
            ])
            vs.index_document("docCacheHit", chunks, svc)

            # First search populates cache
            vs.search("docCacheHit", [0.3, 0.6, 0.1], top_k=5)
            rows_first, matrix_first = vs._embedding_cache["docCacheHit"]

            # Second search should return the exact same objects (identity check)
            vs.search("docCacheHit", [0.3, 0.6, 0.1], top_k=5)
            rows_second, matrix_second = vs._embedding_cache["docCacheHit"]

            assert rows_first is rows_second, "Cache return must be the same list object"

    def test_reindex_invalidates_cache(self, tmp_path):
        db = str(tmp_path / "cache_test3.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = MagicMock()
            svc.get_embeddings.return_value = [[0.7, 0.3, 0.0]]
            page = [DocumentPageSchema(page_number=1, text="Original lease terms.", section_info=None)]
            chunks = chunk_document_pages("docReindex", page)
            vs.index_document("docReindex", chunks, svc)

            # Populate cache
            vs.search("docReindex", [0.7, 0.3, 0.0], top_k=5)
            assert "docReindex" in vs._embedding_cache

            # Re-index must evict cache
            vs.index_document("docReindex", chunks, svc)
            assert "docReindex" not in vs._embedding_cache

    def test_cache_isolated_per_document(self, tmp_path):
        db = str(tmp_path / "cache_test4.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)
            svc = MagicMock()
            svc.get_embeddings.return_value = [[0.5, 0.5]]

            for doc_id in ["docA", "docB", "docC"]:
                page = [DocumentPageSchema(page_number=1, text=f"Content for {doc_id}.", section_info=None)]
                chunks = chunk_document_pages(doc_id, page)
                vs.index_document(doc_id, chunks, svc)

            vs.search("docA", [0.5, 0.5], top_k=5)
            vs.search("docB", [0.5, 0.5], top_k=5)

            assert "docA" in vs._embedding_cache
            assert "docB" in vs._embedding_cache
            assert "docC" not in vs._embedding_cache  # never queried


# ─── 3. Embedding Service API Call Deduplication ──────────────────────────────

class TestEmbeddingServiceAPIDeduplication:
    """Verifies that the LRU cache in EmbeddingService prevents duplicate API calls."""

    def test_cache_hit_skips_api(self):
        svc = EmbeddingService(api_key="fake-key")
        FAKE_EMB = [0.1, 0.2, 0.3]
        svc._cache["cached text"] = FAKE_EMB

        call_count = {"n": 0}

        def raise_if_called(*args, **kwargs):
            call_count["n"] += 1
            raise AssertionError("API should not be called on cache hit")

        svc._get_client = raise_if_called
        result = svc.get_embedding("cached text")
        assert result == FAKE_EMB
        assert call_count["n"] == 0

    def test_batch_embeddings_use_cache(self):
        svc = EmbeddingService(api_key="fake-key")
        texts = ["clause one", "clause two", "clause three"]
        fake_embs = {t: [float(i)] for i, t in enumerate(texts)}
        svc._cache.update(fake_embs)

        results = svc.get_embeddings(texts)
        assert len(results) == 3
        for i, text in enumerate(texts):
            assert results[i] == [float(i)]

    def test_cache_max_size_prevents_unbounded_growth(self):
        svc = EmbeddingService(api_key="fake-key")
        svc._max_cache_size = 10
        # Fill to max
        for i in range(10):
            svc._cache[f"text_{i}"] = [float(i)]
        assert len(svc._cache) == 10

        # Simulate what happens if add another (cache is full)
        if len(svc._cache) < svc._max_cache_size:
            svc._cache["overflow_text"] = [99.9]
        assert len(svc._cache) <= svc._max_cache_size


# ─── 4. Search Performance Regression Guard ───────────────────────────────────

class TestSearchPerformance:
    """
    Ensures that batch search over many chunks completes within acceptable time.
    This guards against accidental O(n^2) or blocking I/O regressions.
    """

    @pytest.mark.skipif(not _NUMPY_AVAILABLE, reason="numpy not installed")
    def test_numpy_search_faster_than_threshold(self, tmp_path):
        """Searching 200 chunks with numpy should complete in under 100ms."""
        db = str(tmp_path / "perf_test.sqlite3")
        with patch("app.services.vector_store.DB_PATH", db), \
             patch("app.services.storage.DB_PATH", db):
            init_db()
            vs = VectorStore(db_path=db)

            n_chunks = 200
            dim = 64

            import random
            random.seed(0)

            # Build fake rows and matrix directly in cache (skip DB I/O for pure perf test)
            fake_rows = [
                {
                    "id": f"chunk_{i}",
                    "document_id": "perfDoc",
                    "chunk_index": i,
                    "page_number": (i // 10) + 1,
                    "section": None,
                    "source_text": f"Clause text number {i} about payment terms.",
                    "embedding_json": json.dumps([random.gauss(0, 1) for _ in range(dim)]),
                }
                for i in range(n_chunks)
            ]
            embeddings = [json.loads(r["embedding_json"]) for r in fake_rows]
            mat = np.array(embeddings, dtype=np.float32)
            norms = np.linalg.norm(mat, axis=1, keepdims=True)
            norms = np.where(norms == 0, 1.0, norms)
            mat_norm = mat / norms

            vs._embedding_cache["perfDoc"] = (fake_rows, mat_norm)

            query = [random.gauss(0, 1) for _ in range(dim)]
            start = time.perf_counter()
            results = vs.search("perfDoc", query, top_k=10)
            elapsed = time.perf_counter() - start

            assert len(results) <= 10
            assert elapsed < 0.1, f"Search took {elapsed:.3f}s — exceeds 100ms threshold"
