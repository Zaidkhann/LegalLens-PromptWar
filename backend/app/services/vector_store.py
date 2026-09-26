"""
Vector Store / Retrieval Service for LegalLens.
Manages document chunk indexing and vector search using SQLite
with strict document isolation.

Efficiency improvements:
- Numpy-vectorized cosine similarity (batch matrix op instead of Python loop)
- Per-document in-memory embedding cache to avoid repeated JSON parsing
- Fallback to pure-Python cosine if numpy is unavailable
"""

import json
import sqlite3
import math
import logging
from typing import List, Optional, Dict, Tuple
from datetime import datetime, timezone
from pydantic import BaseModel

from app.services.storage import DB_PATH, init_db, get_db_connection
from app.services.chunker import DocumentChunk
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

try:
    import numpy as np
    _NUMPY_AVAILABLE = True
except ImportError:  # pragma: no cover
    _NUMPY_AVAILABLE = False
    logger.warning("numpy not available — falling back to pure-Python cosine similarity")


class ChunkMatch(BaseModel):
    chunk_id: str
    document_id: str
    chunk_index: int
    page_number: int
    section: Optional[str] = None
    source_text: str
    score: float


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes cosine similarity between two float vectors (pure-Python fallback)."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)


def _cosine_similarity_batch_numpy(query: List[float], matrix: "np.ndarray") -> "np.ndarray":
    """
    Vectorized cosine similarity of a query vector against a row matrix.
    Returns a 1-D array of similarity scores, one per row.
    ~10-50x faster than a Python loop for large document chunk sets.
    """
    q = np.array(query, dtype=np.float32)
    q_norm = np.linalg.norm(q)
    if q_norm == 0:
        return np.zeros(len(matrix), dtype=np.float32)
    q = q / q_norm
    # matrix rows are already normalized during indexing
    scores = matrix @ q  # shape: (n_chunks,)
    return scores


class VectorStore:
    """
    Vector storage and retrieval service ensuring strict per-document query isolation.

    In-memory cache: after an initial SQLite fetch, embeddings for a given
    document are kept in _embedding_cache so subsequent Q&A calls skip disk I/O.
    Cache is keyed by document_id and stores a tuple of:
        (row_metadata: list[dict], normalized_matrix: np.ndarray | None)
    """

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        # { document_id -> (rows: list[dict], matrix: np.ndarray | None) }
        self._embedding_cache: Dict[str, Tuple[list, Optional[object]]] = {}
        init_db()

    def is_document_indexed(self, document_id: str) -> bool:
        """Returns True if the document has indexed vector chunks."""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM document_chunks WHERE document_id = ?",
                (document_id,),
            )
            count = cursor.fetchone()[0]
            return count > 0

    def _invalidate_cache(self, document_id: str) -> None:
        """Evict cached embeddings for a document (called on re-index)."""
        self._embedding_cache.pop(document_id, None)

    def _load_chunks_from_db(
        self, document_id: str
    ) -> Tuple[list, Optional[object]]:
        """
        Fetches all chunks for document_id from SQLite, parses embeddings,
        and builds a numpy matrix for vectorized search (if numpy available).
        Result is cached in memory for subsequent calls.
        """
        if document_id in self._embedding_cache:
            return self._embedding_cache[document_id]

        with get_db_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, document_id, chunk_index, page_number, section, source_text, embedding_json
                FROM document_chunks
                WHERE document_id = ?
                """,
                (document_id,),
            )
            rows = [dict(r) for r in cursor.fetchall()]

        if not rows:
            return [], None

        embeddings = [json.loads(r["embedding_json"]) for r in rows]

        matrix = None
        if _NUMPY_AVAILABLE and embeddings:
            mat = np.array(embeddings, dtype=np.float32)  # shape: (n, dim)
            # Pre-normalize rows so dot product == cosine similarity
            norms = np.linalg.norm(mat, axis=1, keepdims=True)
            norms = np.where(norms == 0, 1.0, norms)  # avoid division by zero
            matrix = mat / norms

        self._embedding_cache[document_id] = (rows, matrix)
        return rows, matrix

    def index_document(
        self,
        document_id: str,
        chunks: List[DocumentChunk],
        embedding_service: EmbeddingService,
    ) -> int:
        """
        Generates embeddings for chunks and persists them to SQLite.
        Clears existing chunks for document_id first if re-indexing.
        Invalidates in-memory cache so the next search re-loads fresh data.
        Returns count of indexed chunks.
        """
        if not chunks:
            return 0

        texts = [chunk.source_text for chunk in chunks]
        logger.info(f"Generating embeddings for {len(texts)} chunks of document '{document_id}'...")
        embeddings = embedding_service.get_embeddings(texts)

        now_iso = datetime.now(timezone.utc).isoformat()

        with get_db_connection() as conn:
            cursor = conn.cursor()
            # Clear previous chunks for document_id
            cursor.execute("DELETE FROM document_chunks WHERE document_id = ?", (document_id,))

            for chunk, emb in zip(chunks, embeddings):
                cursor.execute(
                    """
                    INSERT INTO document_chunks (
                        id, document_id, chunk_index, page_number, section, source_text, embedding_json, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        chunk.chunk_id,
                        document_id,
                        chunk.chunk_index,
                        chunk.page_number,
                        chunk.section,
                        chunk.source_text,
                        json.dumps(emb),
                        now_iso,
                    ),
                )
            conn.commit()

        # Evict stale cache after re-indexing
        self._invalidate_cache(document_id)
        logger.info(f"Successfully indexed {len(chunks)} vector chunks for document '{document_id}'.")
        return len(chunks)

    def search(
        self,
        document_id: str,
        query_embedding: List[float],
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> List[ChunkMatch]:
        """
        Retrieves the top_k most relevant chunks strictly for the given document_id.
        Isolation guarantee: Never returns chunks from any other document_id.

        Uses numpy-vectorized batch cosine similarity when available (~10-50x faster
        than the per-row Python loop for large documents). Falls back to pure-Python
        cosine_similarity() if numpy is not installed.
        """
        rows, matrix = self._load_chunks_from_db(document_id)

        if not rows:
            return []

        matches: List[ChunkMatch] = []

        if _NUMPY_AVAILABLE and matrix is not None:
            # ── Fast path: single matrix-vector multiply ──────────────────────
            scores = _cosine_similarity_batch_numpy(query_embedding, matrix)
            for i, r in enumerate(rows):
                score = float(scores[i])
                if score >= min_score:
                    matches.append(
                        ChunkMatch(
                            chunk_id=r["id"],
                            document_id=r["document_id"],
                            chunk_index=r["chunk_index"],
                            page_number=r["page_number"],
                            section=r["section"],
                            source_text=r["source_text"],
                            score=round(score, 4),
                        )
                    )
        else:
            # ── Fallback: pure-Python loop ─────────────────────────────────────
            for r in rows:
                emb = json.loads(r["embedding_json"])
                score = cosine_similarity(query_embedding, emb)
                if score >= min_score:
                    matches.append(
                        ChunkMatch(
                            chunk_id=r["id"],
                            document_id=r["document_id"],
                            chunk_index=r["chunk_index"],
                            page_number=r["page_number"],
                            section=r["section"],
                            source_text=r["source_text"],
                            score=round(score, 4),
                        )
                    )

        # Sort by similarity score descending, return top_k
        matches.sort(key=lambda m: m.score, reverse=True)
        return matches[:top_k]
