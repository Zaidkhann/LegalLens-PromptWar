"""
Pydantic schemas for structured GenAI legal document analysis output.
These schemas define the exact shape of the Gemini structured response.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


# ─── Enums ────────────────────────────────────────────────────────────────────

class ClauseCategory(str, Enum):
    PAYMENT = "Payment"
    TERMINATION = "Termination"
    RENEWAL = "Renewal"
    LIABILITY = "Liability"
    CONFIDENTIALITY = "Confidentiality"
    RESTRICTIONS = "Restrictions"
    DISPUTE_RESOLUTION = "Dispute Resolution"
    NOTICE = "Notice"
    OBLIGATIONS = "Obligations"
    PENALTIES = "Penalties"
    OTHER = "Other"


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ActionCategory(str, Enum):
    REVIEW = "REVIEW"
    DEADLINE = "DEADLINE"
    CLARIFICATION = "CLARIFICATION"
    ACTION = "ACTION"


class Priority(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class AnalysisStatus(str, Enum):
    NOT_STARTED = "not_started"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


# ─── Component Schemas (used inside LegalAnalysis) ────────────────────────────

class DocumentOverview(BaseModel):
    document_type: Optional[str] = Field(None, description="Type of legal document (e.g. Lease Agreement, Employment Contract)")
    purpose: Optional[str] = Field(None, description="Purpose of the document")
    parties: Optional[List[str]] = Field(default_factory=list, description="Parties involved in the document")
    key_dates: Optional[List[str]] = Field(default_factory=list, description="Key dates mentioned in the document")
    financial_terms: Optional[List[str]] = Field(default_factory=list, description="Financial terms such as rent, salary, fees")
    duration: Optional[str] = Field(None, description="Duration or term of the agreement")
    important_obligations: Optional[List[str]] = Field(default_factory=list, description="Most important obligations")
    summary: Optional[str] = Field(None, description="Short plain-language summary of the entire document")


class PlainLanguageExplanation(BaseModel):
    summary: Optional[str] = Field(None, description="Plain-language explanation of what this document is asking the reader to agree to")
    key_takeaways: Optional[List[str]] = Field(default_factory=list, description="Bullet-point key takeaways for a non-lawyer")


class ImportantClause(BaseModel):
    category: Optional[str] = Field(None, description="Clause category: Payment, Termination, Renewal, Liability, Confidentiality, Restrictions, Dispute Resolution, Notice, Obligations, Penalties, Other")
    title: Optional[str] = Field(None, description="Short descriptive title for this clause")
    original_text: Optional[str] = Field(None, description="Original clause text from the document")
    plain_explanation: Optional[str] = Field(None, description="Plain-language explanation of what this clause means")
    page_number: Optional[int] = Field(None, description="Page number where this clause appears")
    source_reference: Optional[str] = Field(None, description="Section or clause reference (e.g. Clause 3.2)")


class AttentionSignal(BaseModel):
    title: Optional[str] = Field(None, description="Short title describing the attention point")
    category: Optional[str] = Field(None, description="Category of the attention signal")
    severity: Optional[str] = Field(None, description="Severity level: LOW, MEDIUM, or HIGH")
    what_it_says: Optional[str] = Field(None, description="What the clause actually states")
    why_it_matters: Optional[str] = Field(None, description="Why this deserves closer review, using cautious language")
    clarification_needed: Optional[str] = Field(None, description="What the user may want to clarify or ask about")
    page_number: Optional[int] = Field(None, description="Page number where this clause appears")
    source_reference: Optional[str] = Field(None, description="Section or clause reference")


class Obligation(BaseModel):
    party: Optional[str] = Field(None, description="Which party has this obligation")
    obligation: Optional[str] = Field(None, description="Description of the obligation")
    deadline: Optional[str] = Field(None, description="Deadline if specified, otherwise null")
    condition: Optional[str] = Field(None, description="Condition if specified, otherwise null")
    page_number: Optional[int] = Field(None, description="Page number where this obligation appears")


class ImportantDate(BaseModel):
    date: Optional[str] = Field(None, description="The date or date-related term")
    description: Optional[str] = Field(None, description="What this date relates to")
    related_clause: Optional[str] = Field(None, description="Related clause or section reference")
    page_number: Optional[int] = Field(None, description="Page number where this date appears")


class ActionItem(BaseModel):
    task: Optional[str] = Field(None, description="Actionable task description")
    category: Optional[str] = Field(None, description="Category: REVIEW, DEADLINE, CLARIFICATION, or ACTION")
    priority: Optional[str] = Field(None, description="Priority: HIGH, MEDIUM, or LOW")
    reason: Optional[str] = Field(None, description="Why this action is recommended")
    page_number: Optional[int] = Field(None, description="Page number when applicable")


class LawyerQuestion(BaseModel):
    question: Optional[str] = Field(None, description="Question to consider asking a legal professional")
    context: Optional[str] = Field(None, description="Context from the document that prompted this question")
    page_number: Optional[int] = Field(None, description="Relevant page number")


# ─── Top-Level Analysis Container ─────────────────────────────────────────────

class LegalAnalysis(BaseModel):
    """Complete structured legal document analysis output from Gemini."""
    overview: Optional[DocumentOverview] = None
    plain_language: Optional[PlainLanguageExplanation] = None
    important_clauses: Optional[List[ImportantClause]] = Field(default_factory=list)
    attention_signals: Optional[List[AttentionSignal]] = Field(default_factory=list)
    obligations: Optional[List[Obligation]] = Field(default_factory=list)
    important_dates: Optional[List[ImportantDate]] = Field(default_factory=list)
    action_items: Optional[List[ActionItem]] = Field(default_factory=list)
    lawyer_questions: Optional[List[LawyerQuestion]] = Field(default_factory=list)


# ─── API Response Schemas ─────────────────────────────────────────────────────

class AnalysisMetaResponse(BaseModel):
    document_id: str
    analysis_status: AnalysisStatus
    message: str


class FullAnalysisResponse(BaseModel):
    document_id: str
    analysis_status: AnalysisStatus
    analysis: Optional[LegalAnalysis] = None
    disclaimer: str = "LegalLens provides informational assistance and document navigation. It does not provide legal advice or replace a qualified legal professional."
