"""
Pydantic schemas for Grounded Legal Document Q&A / RAG.
"""

from typing import List, Optional, Any
from pydantic import BaseModel, Field, field_validator


class SourceCitation(BaseModel):
    page_number: int = Field(..., description="The exact page number in the document where the source chunk appears.")
    section: Optional[str] = Field(default=None, description="Section or clause title if available (e.g. 'Clause 2.1').")
    excerpt: str = Field(..., description="Verbatim or close excerpt from the retrieved document text.")
    relevance: Optional[float] = Field(default=None, description="Similarity or relevance score.")


class LegalAnswer(BaseModel):
    answer: str = Field(
        ...,
        description="Grounded plain-language answer strictly derived from the provided document context.",
    )
    key_points: List[str] = Field(
        default_factory=list,
        description="Bullet point summary of key information from the answer.",
    )
    citations: List[SourceCitation] = Field(
        default_factory=list,
        description="List of supporting citations with exact page numbers and excerpts.",
    )
    confidence: Optional[str] = Field(
        default="HIGH",
        description="Confidence level of the answer based on document clarity ('HIGH', 'MEDIUM', 'LOW').",
    )
    not_found: bool = Field(
        default=False,
        description="Set to true if the document does not contain enough information to answer the question.",
    )


class QARequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000, description="Natural language question about the document.")

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Question cannot be empty or whitespace only.")
        if len(cleaned) > 1000:
            raise ValueError("Question exceeds maximum allowed length of 1000 characters.")
        return cleaned


class QAResponse(BaseModel):
    success: bool = True
    question: str
    answer: str
    key_points: List[str] = Field(default_factory=list)
    citations: List[SourceCitation] = Field(default_factory=list)
    not_found: bool = False
    disclaimer: str = (
        "LegalLens provides document-based information and explanations, not legal advice. "
        "Consult a qualified attorney for formal legal advice."
    )
    debug_info: Optional[dict] = Field(
        default=None,
        description="Internal RAG retrieval metrics for quality evaluation (chunk_ids, similarity scores, page numbers).",
    )
