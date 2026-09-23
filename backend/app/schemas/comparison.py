"""
Pydantic schemas for AI Legal Document Comparison.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class ChangeType(str, Enum):
    ADDED = "ADDED"
    REMOVED = "REMOVED"
    MODIFIED = "MODIFIED"
    UNCHANGED = "UNCHANGED"


class AttentionLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    NONE = "NONE"


class ComparisonChange(BaseModel):
    id: str = Field(..., description="Unique identifier for the change item.")
    section: str = Field(..., description="Section heading or clause title (e.g. 'Clause 8.1 Notice Period').")
    change_type: ChangeType = Field(..., description="Type of change: ADDED, REMOVED, MODIFIED, or UNCHANGED.")
    original_text: str = Field(default="", description="Original clause text from Document A (or N/A if ADDED).")
    revised_text: str = Field(default="", description="Revised clause text from Document B (or N/A if REMOVED).")
    explanation: str = Field(..., description="Plain-language explanation of the legal change.")
    attention_level: AttentionLevel = Field(default=AttentionLevel.LOW, description="Attention severity rating.")
    page_original: Optional[int] = Field(default=None, description="Page number in Document A.")
    page_revised: Optional[int] = Field(default=None, description="Page number in Document B.")
    is_important: bool = Field(default=False, description="Flag indicating if this change alters key legal terms (payment, deadlines, liability).")


class DocumentComparison(BaseModel):
    comparison_id: str
    document_a_id: str
    document_b_id: str
    document_a_title: str
    document_b_title: str
    summary: str = Field(..., description="High-level plain-language executive summary of all detected changes.")
    total_changes: int = 0
    added_count: int = 0
    removed_count: int = 0
    modified_count: int = 0
    important_changes_count: int = 0
    important_changes: List[str] = Field(default_factory=list, description="List of bullet point highlights of key changes.")
    changes: List[ComparisonChange] = Field(default_factory=list)
    disclaimer: str = (
        "LegalLens document comparison highlights textual and structural changes for informational review. "
        "It does not constitute formal legal counsel."
    )


class ComparisonRequest(BaseModel):
    document_a_id: str = Field(..., description="Document ID for Version 1 (Original).")
    document_b_id: str = Field(..., description="Document ID for Version 2 (Revised).")
    force_recompare: bool = Field(default=False, description="Set to true to bypass cache and force re-analysis.")

    @field_validator("document_b_id")
    @classmethod
    def validate_different_documents(cls, v: str, info) -> str:
        doc_a = info.data.get("document_a_id")
        if doc_a and v == doc_a:
            raise ValueError("Document A and Document B cannot be the same document.")
        return v


class ComparisonResponse(BaseModel):
    success: bool = True
    comparison: DocumentComparison
