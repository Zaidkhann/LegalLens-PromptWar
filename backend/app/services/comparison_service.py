"""
Comparison Service for LegalLens Document Comparison.
Orchestrates section alignment, Gemini AI semantic change evaluation,
schema validation, and persistent caching.
"""

import json
import logging
import uuid
from typing import Optional, List, Dict, Any

from google import genai
from google.genai import types

from app.schemas.comparison import (
    ComparisonChange,
    DocumentComparison,
    ChangeType,
    AttentionLevel,
)
from app.schemas.document import ProcessingStatus
from app.services.storage import (
    get_document_by_id,
    get_document_content,
    get_comparison_by_docs,
    save_comparison,
)
from app.services.comparator import align_and_diff_documents, AlignedSection
from app.services.gemini_service import _get_client, PRIMARY_MODEL, FALLBACK_MODEL
from app.core.prompts import build_comparison_prompt

logger = logging.getLogger(__name__)


class ComparisonService:
    """
    Service managing document comparison workflow.
    """

    async def compare_documents(
        self,
        document_a_id: str,
        document_b_id: str,
        force_recompare: bool = False,
    ) -> DocumentComparison:
        """
        Compares Document A and Document B. Returns cached comparison if available unless force_recompare=True.
        """
        if document_a_id == document_b_id:
            raise ValueError("Document A and Document B cannot be the same document.")

        # 1. Verify access and metadata for both documents
        doc_a = get_document_by_id(document_a_id)
        if not doc_a:
            raise ValueError(f"Document A with ID '{document_a_id}' not found.")

        doc_b = get_document_by_id(document_b_id)
        if not doc_b:
            raise ValueError(f"Document B with ID '{document_b_id}' not found.")

        if doc_a.processing_status != ProcessingStatus.COMPLETED:
            raise ValueError(f"Document A processing status is '{doc_a.processing_status.value}'. Content is not ready.")

        if doc_b.processing_status != ProcessingStatus.COMPLETED:
            raise ValueError(f"Document B processing status is '{doc_b.processing_status.value}'. Content is not ready.")

        # 2. Check cached comparison
        if not force_recompare:
            cached_dict = get_comparison_by_docs(document_a_id, document_b_id)
            if cached_dict:
                try:
                    logger.info(f"Returning cached comparison for '{document_a_id}' vs '{document_b_id}'.")
                    return DocumentComparison.model_validate(cached_dict)
                except Exception as e:
                    logger.warning(f"Failed to validate cached comparison: {e}")

        # 3. Retrieve extracted pages for both documents
        content_a = get_document_content(document_a_id)
        content_b = get_document_content(document_b_id)

        if not content_a or not content_a.pages:
            raise ValueError(f"Document A '{document_a_id}' contains no text content.")

        if not content_b or not content_b.pages:
            raise ValueError(f"Document B '{document_b_id}' contains no text content.")

        # 4. Perform deterministic section alignment and diff detection
        aligned_sections: List[AlignedSection] = align_and_diff_documents(content_a.pages, content_b.pages)

        # Count diffs
        added_count = sum(1 for s in aligned_sections if s.change_type == ChangeType.ADDED)
        removed_count = sum(1 for s in aligned_sections if s.change_type == ChangeType.REMOVED)
        modified_count = sum(1 for s in aligned_sections if s.change_type == ChangeType.MODIFIED)
        total_changes = added_count + removed_count + modified_count

        # 5. Handle identical documents case
        if total_changes == 0:
            comp_id = str(uuid.uuid4())
            identical_comp = DocumentComparison(
                comparison_id=comp_id,
                document_a_id=document_a_id,
                document_b_id=document_b_id,
                document_a_title=doc_a.title,
                document_b_title=doc_b.title,
                summary="Both documents are identical in structure and text content. No added, removed, or modified clauses were detected.",
                total_changes=0,
                added_count=0,
                removed_count=0,
                modified_count=0,
                important_changes_count=0,
                important_changes=[],
                changes=[],
            )
            save_comparison(identical_comp.model_dump())
            return identical_comp

        # Prepare diff list for Gemini prompt
        diff_dicts_for_prompt = [
            {
                "title": s.title,
                "change_type": s.change_type.value,
                "doc_a_text": s.doc_a_text[:1200],
                "doc_b_text": s.doc_b_text[:1200],
                "page_a": s.page_a,
                "page_b": s.page_b,
            }
            for s in aligned_sections
            if s.change_type != ChangeType.UNCHANGED
        ]

        # 6. Invoke Gemini API for semantic impact analysis
        prompt = build_comparison_prompt(doc_a.title, doc_b.title, diff_dicts_for_prompt)

        client = _get_client()
        model = PRIMARY_MODEL
        parsed_data = None

        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1,
                    ),
                )
                raw_text = response.text.strip() if response.text else ""
                if raw_text.startswith("```"):
                    first_nl = raw_text.find("\n")
                    raw_text = raw_text[first_nl + 1:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[: raw_text.rfind("```")]
                raw_text = raw_text.strip()

                parsed_data = json.loads(raw_text)
                break
            except Exception as e:
                logger.warning(f"Comparison Gemini attempt {attempt + 1} with '{model}' failed: {e}")
                if attempt == 0 and model == PRIMARY_MODEL:
                    model = FALLBACK_MODEL

        # Fallback deterministic comparison generator if Gemini API fails or returns invalid output
        final_changes: List[ComparisonChange] = []
        summary_text = ""
        important_highlights: List[str] = []

        if parsed_data and isinstance(parsed_data, dict):
            summary_text = parsed_data.get("summary", f"{total_changes} changes detected between versions.")
            important_highlights = parsed_data.get("important_changes", [])

            raw_changes = parsed_data.get("changes", [])
            for idx, rc in enumerate(raw_changes, 1):
                try:
                    c_type_str = str(rc.get("change_type", "MODIFIED")).upper()
                    c_type = ChangeType[c_type_str] if c_type_str in ChangeType.__members__ else ChangeType.MODIFIED

                    att_str = str(rc.get("attention_level", "LOW")).upper()
                    att_lvl = AttentionLevel[att_str] if att_str in AttentionLevel.__members__ else AttentionLevel.LOW

                    final_changes.append(
                        ComparisonChange(
                            id=str(rc.get("id") or idx),
                            section=rc.get("section") or f"Section {idx}",
                            change_type=c_type,
                            original_text=rc.get("original_text") or "",
                            revised_text=rc.get("revised_text") or "",
                            explanation=rc.get("explanation") or "Text change detected between versions.",
                            attention_level=att_lvl,
                            page_original=rc.get("page_original"),
                            page_revised=rc.get("page_revised"),
                            is_important=bool(rc.get("is_important", att_lvl in [AttentionLevel.HIGH, AttentionLevel.MEDIUM])),
                        )
                    )
                except Exception as e:
                    logger.warning(f"Error parsing change item {idx}: {e}")

        # Deterministic fallback if final_changes is empty
        if not final_changes:
            logger.info("Using deterministic fallback changes from section alignment.")
            summary_text = f"{total_changes} textual and structural changes detected between '{doc_a.title}' and '{doc_b.title}'."
            for idx, s in enumerate(aligned_sections, 1):
                if s.change_type == ChangeType.UNCHANGED:
                    continue
                is_imp = any(kw in s.title.lower() for kw in ["payment", "rent", "fee", "notice", "terminate", "penalty", "liability"])
                att_lvl = AttentionLevel.HIGH if is_imp else AttentionLevel.LOW
                exp = f"{s.change_type.value.capitalize()} in section '{s.title}'."

                if s.change_type == ChangeType.ADDED:
                    exp = f"New clause '{s.title}' added to Version 2."
                elif s.change_type == ChangeType.REMOVED:
                    exp = f"Clause '{s.title}' removed from Version 2."
                elif s.change_type == ChangeType.MODIFIED:
                    exp = f"Text modified in clause '{s.title}'."

                final_changes.append(
                    ComparisonChange(
                        id=str(idx),
                        section=s.title,
                        change_type=s.change_type,
                        original_text=s.doc_a_text or "N/A",
                        revised_text=s.doc_b_text or "N/A",
                        explanation=exp,
                        attention_level=att_lvl,
                        page_original=s.page_a,
                        page_revised=s.page_b,
                        is_important=is_imp,
                    )
                )

        important_count = sum(1 for c in final_changes if c.is_important)

        comp_id = str(uuid.uuid4())
        doc_comp = DocumentComparison(
            comparison_id=comp_id,
            document_a_id=document_a_id,
            document_b_id=document_b_id,
            document_a_title=doc_a.title,
            document_b_title=doc_b.title,
            summary=summary_text,
            total_changes=len(final_changes),
            added_count=sum(1 for c in final_changes if c.change_type == ChangeType.ADDED),
            removed_count=sum(1 for c in final_changes if c.change_type == ChangeType.REMOVED),
            modified_count=sum(1 for c in final_changes if c.change_type == ChangeType.MODIFIED),
            important_changes_count=important_count,
            important_changes=important_highlights,
            changes=final_changes,
        )

        # 7. Persist comparison to DB
        save_comparison(doc_comp.model_dump())
        return doc_comp


# Singleton instance
comparison_service = ComparisonService()
