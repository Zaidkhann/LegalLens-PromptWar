"""
Gemini AI analysis service for LegalLens.
Uses google-genai SDK with structured JSON output.
"""

import os
import json
import logging
from typing import Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.schemas.analysis import LegalAnalysis
from app.schemas.document import DocumentPageSchema
from app.core.prompts import build_analysis_prompt

logger = logging.getLogger(__name__)

# Load .env from project root
_env_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "..",
    ".env",
)
load_dotenv(dotenv_path=_env_path)
# Also try loading from backend/.env
load_dotenv(dotenv_path=os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    ".env",
))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Model to use — with fallback
PRIMARY_MODEL = "gemini-2.5-flash"
FALLBACK_MODEL = "gemini-2.0-flash"


def _get_client() -> genai.Client:
    """Creates a Gemini client from the API key."""
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY environment variable is not set. "
            "Please create a .env file with GEMINI_API_KEY=your_key"
        )
    return genai.Client(api_key=GEMINI_API_KEY)


def format_document_for_prompt(pages: list[DocumentPageSchema]) -> str:
    """
    Formats extracted document pages into a single text block
    with clear page markers for the AI prompt.
    """
    sections = []
    for page in pages:
        marker = f"--- PAGE {page.page_number} ---"
        sections.append(f"{marker}\n{page.text}")
    return "\n\n".join(sections)


def _parse_analysis_response(raw_text: str) -> LegalAnalysis:
    """
    Parses the Gemini response text into a validated LegalAnalysis model.
    Handles cases where Gemini wraps JSON in markdown code fences.
    """
    text = raw_text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        first_newline = text.find("\n")
        text = text[first_newline + 1:]
    if text.endswith("```"):
        text = text[: text.rfind("```")]
    text = text.strip()

    parsed = json.loads(text)
    return LegalAnalysis.model_validate(parsed)


import hashlib

# In-memory cache for document analysis {content_hash: LegalAnalysis}
_ANALYSIS_CACHE: dict[str, LegalAnalysis] = {}
MAX_ANALYSIS_CACHE_SIZE = 50


async def analyze_document(pages: list[DocumentPageSchema]) -> LegalAnalysis:
    """
    Sends extracted document pages to Gemini for structured legal analysis.
    Returns a validated LegalAnalysis model.
    Caches result by document text hash to maximize efficiency.
    """
    document_text = format_document_for_prompt(pages)
    content_hash = hashlib.sha256(document_text.encode('utf-8')).hexdigest()

    if content_hash in _ANALYSIS_CACHE:
        logger.info(f"Analysis cache hit for hash '{content_hash[:12]}...' — returning cached result.")
        return _ANALYSIS_CACHE[content_hash]

    client = _get_client()
    prompt = build_analysis_prompt(document_text)

    model = PRIMARY_MODEL
    max_retries = 2

    for attempt in range(max_retries + 1):
        try:
            logger.info(f"Gemini analysis attempt {attempt + 1} using model '{model}'")

            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=LegalAnalysis,
                    temperature=0.2,
                ),
            )

            raw_text = response.text
            if not raw_text or not raw_text.strip():
                raise ValueError("Gemini returned an empty response.")

            analysis = _parse_analysis_response(raw_text)
            logger.info("Gemini analysis completed and validated successfully.")
            if len(_ANALYSIS_CACHE) >= MAX_ANALYSIS_CACHE_SIZE:
                _ANALYSIS_CACHE.pop(next(iter(_ANALYSIS_CACHE)))
            _ANALYSIS_CACHE[content_hash] = analysis
            return analysis

        except Exception as e:
            logger.warning(f"Gemini attempt {attempt + 1} failed: {e}")

            # On first failure with primary model, try fallback model
            if attempt == 0 and model == PRIMARY_MODEL:
                logger.info(f"Falling back to model '{FALLBACK_MODEL}'")
                model = FALLBACK_MODEL
                continue

            if attempt < max_retries:
                continue

            raise RuntimeError(
                f"Gemini analysis failed after {max_retries + 1} attempts: {str(e)}"
            )

    # Should never reach here, but just to be safe:
    raise RuntimeError("Gemini analysis failed unexpectedly.")
