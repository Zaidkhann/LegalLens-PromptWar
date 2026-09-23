"""
Vector Store / Retrieval Service for LegalLens.
Manages document chunk indexing and vector search using SQLite
with strict document isolation.
"""

import json
import sqlite3
import math
import logging
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from app.services.storage import DB_PATH, init_db
from app.services.chunker import DocumentChunk
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class ChunkMatch(BaseModel):
    chunk_id: str
    document_id: str
    chunk_index: int
    page_number: int
    section: Optional[str] = None
    source_text: str
    score: float


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes cosine similarity between two float vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)


class VectorStore:
    """
    Vector storage and retrieval service ensuring strict per-document query isolation.
    """

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        init_db()

    def is_document_indexed(self, document_id: str) -> bool:
        """Returns True if the document has indexed vector chunks."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM document_chunks WHERE document_id = ?",
                (document_id,),
            )
            count = cursor.fetchone()[0]
            return count > 0

    def index_document(
        self,
        document_id: str,
        chunks: List[DocumentChunk],
        embedding_service: EmbeddingService,
    ) -> int:
        """
        Generates embeddings for chunks and persists them to SQLite.
        Clears existing chunks for document_id first if re-indexing.
        Returns count of indexed chunks.
        """
        if not chunks:
            return 0

        texts = [chunk.source_text for chunk in chunks]
        logger.info(f"Generating embeddings for {len(texts)} chunks of document '{document_id}'...")
        embeddings = embedding_service.get_embeddings(texts)

        now_iso = datetime.now(timezone.utc).isoformat()

        with sqlite3.connect(self.db_path) as conn:
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
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            # STRICT FILTER: document_id = ?
            cursor.execute(
                """
                SELECT id, document_id, chunk_index, page_number, section, source_text, embedding_json
                FROM document_chunks
                WHERE document_id = ?
                """,
                (document_id,),
            )
            rows = cursor.fetchall()

        matches: List[ChunkMatch] = []
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

        # Sort by similarity score descending
        matches.sort(key=lambda m: m.score, reverse=True)
        return matches[:top_k]
