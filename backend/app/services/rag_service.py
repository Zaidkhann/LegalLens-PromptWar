"""
RAG Service for LegalLens Grounded Q&A.
Orchestrates indexing, retrieval, prompt generation, Gemini API invocation,
and response validation with strict legal safety rules.
"""

import json
import logging
from typing import Optional, List, Dict, Any
from google import genai
from google.genai import types

from app.schemas.qa import QARequest, QAResponse, LegalAnswer, SourceCitation
from app.schemas.document import ProcessingStatus
from app.services.storage import get_document_by_id, get_document_content
from app.services.chunker import chunk_document_pages
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore, ChunkMatch
from app.services.gemini_service import _get_client, PRIMARY_MODEL, FALLBACK_MODEL
from app.core.prompts import build_qa_prompt

logger = logging.getLogger(__name__)


import hashlib

# In-memory cache for Q&A responses: {(doc_id, question_hash): QAResponse}
_QA_CACHE: Dict[tuple, QAResponse] = {}
MAX_QA_CACHE_SIZE = 100


class RAGService:
    """
    RAG engine orchestrating document-grounded legal Q&A.
    """

    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        vector_store: Optional[VectorStore] = None,
    ):
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_store = vector_store or VectorStore()


    def ensure_document_indexed(self, document_id: str) -> bool:
        """
        Ensures the document pages are chunked and indexed into vector store.
        """
        if self.vector_store.is_document_indexed(document_id):
            return True

        content = get_document_content(document_id)
        if not content or not content.pages:
            logger.warning(f"No pages found for document '{document_id}' during indexing.")
            return False

        chunks = chunk_document_pages(document_id, content.pages)
        if not chunks:
            logger.warning(f"Chunker returned 0 chunks for document '{document_id}'.")
            return False

        indexed_count = self.vector_store.index_document(
            document_id=document_id,
            chunks=chunks,
            embedding_service=self.embedding_service,
        )
        return indexed_count > 0

    async def answer_question(self, document_id: str, question: str) -> QAResponse:
        """
        Processes a user question about a document, retrieves relevant context,
        and generates a grounded answer via Gemini API.
        Caches results per (document_id, question) for maximum speed.
        """
        # Validate and sanitize question input
        sanitized_q = question.strip()
        # Neutralize common prompt injection patterns safely
        injection_patterns = ["ignore previous instructions", "ignore all previous", "system prompt", "you are now"]
        for pat in injection_patterns:
            if pat in sanitized_q.lower():
                sanitized_q = sanitized_q.replace(pat, f"[filtered: {pat}]")

        q_hash = hashlib.sha256(sanitized_q.lower().encode('utf-8')).hexdigest()
        cache_key = (document_id, q_hash)
        if cache_key in _QA_CACHE:
            logger.info(f"Q&A cache hit for document '{document_id}' — returning cached answer.")
            return _QA_CACHE[cache_key]

        qa_req = QARequest(question=sanitized_q)

        # 1. Verify document exists and text extraction completed
        doc = get_document_by_id(document_id)
        if not doc:
            raise ValueError(f"Document with ID '{document_id}' not found.")

        if doc.processing_status != ProcessingStatus.COMPLETED:
            raise ValueError(f"Document processing status is '{doc.processing_status.value}'. Content is not ready.")

        # 2. Ensure document chunks are indexed
        indexed = self.ensure_document_indexed(document_id)
        if not indexed:
            raise ValueError(f"Document '{document_id}' has no searchable text content.")

        # 3. Generate query embedding
        query_embedding = self.embedding_service.get_embedding(qa_req.question)

        # 4. Search relevant chunks strictly isolated by document_id
        top_matches: List[ChunkMatch] = self.vector_store.search(
            document_id=document_id,
            query_embedding=query_embedding,
            top_k=5,
        )

        # Internal debug info for evaluation
        debug_info = {
            "document_id": document_id,
            "retrieved_count": len(top_matches),
            "top_score": top_matches[0].score if top_matches else 0.0,
            "retrieved_chunk_ids": [m.chunk_id for m in top_matches],
            "retrieved_pages": sorted(list(set(m.page_number for m in top_matches))),
        }

        if not top_matches or top_matches[0].score < 0.15:
            # Low similarity threshold indicates no relevant document content
            return QAResponse(
                success=True,
                question=qa_req.question,
                answer="The document does not provide enough information to answer this question.",
                key_points=[],
                citations=[],
                not_found=True,
                debug_info=debug_info,
            )

        # Format retrieved chunks for prompt
        retrieved_dicts = [
            {
                "chunk_id": m.chunk_id,
                "page_number": m.page_number,
                "section": m.section,
                "source_text": m.source_text,
                "score": m.score,
            }
            for m in top_matches
        ]

        prompt = build_qa_prompt(question=qa_req.question, retrieved_chunks=retrieved_dicts)

        # 5. Invoke Gemini with fallback and structured JSON schema
        client = _get_client()
        model = PRIMARY_MODEL
        legal_answer: Optional[LegalAnswer] = None

        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=LegalAnswer,
                        temperature=0.1,
                    ),
                )

                raw_text = response.text.strip() if response.text else ""
                if not raw_text:
                    raise ValueError("Gemini returned empty response text.")

                # Strip potential markdown fences
                if raw_text.startswith("```"):
                    first_nl = raw_text.find("\n")
                    raw_text = raw_text[first_nl + 1:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[: raw_text.rfind("```")]
                raw_text = raw_text.strip()

                parsed = json.loads(raw_text)
                legal_answer = LegalAnswer.model_validate(parsed)
                break

            except Exception as e:
                logger.warning(f"RAG Gemini attempt {attempt + 1} with model '{model}' failed: {e}")
                if attempt == 0 and model == PRIMARY_MODEL:
                    model = FALLBACK_MODEL

        if not legal_answer:
            raise RuntimeError("Failed to generate validated grounded answer from Gemini API.")

        # Filter citations to ensure valid page numbers matching retrieved context
        retrieved_page_numbers = {m.page_number for m in top_matches}
        valid_citations: List[SourceCitation] = []
        for cite in legal_answer.citations:
            # If citation page is in retrieved pages, include it
            if cite.page_number in retrieved_page_numbers:
                valid_citations.append(cite)
            elif len(retrieved_page_numbers) == 1:
                # If only one page was retrieved, ground citation to that page
                cite_copy = cite.model_copy()
                cite_copy.page_number = list(retrieved_page_numbers)[0]
                valid_citations.append(cite_copy)

        # Fallback citation if model omitted citations but returned grounded answer
        if not valid_citations and not legal_answer.not_found and top_matches:
            best = top_matches[0]
            valid_citations.append(
                SourceCitation(
                    page_number=best.page_number,
                    section=best.section,
                    excerpt=best.source_text[:200] + ("..." if len(best.source_text) > 200 else ""),
                    relevance=best.score,
                )
            )

        res = QAResponse(
            success=True,
            question=qa_req.question,
            answer=legal_answer.answer,
            key_points=legal_answer.key_points,
            citations=valid_citations,
            not_found=legal_answer.not_found,
            debug_info=debug_info,
        )

        if len(_QA_CACHE) >= MAX_QA_CACHE_SIZE:
            _QA_CACHE.pop(next(iter(_QA_CACHE)))
        _QA_CACHE[cache_key] = res
        return res


# Singleton instance
rag_service = RAGService()
