"""
Embedding service for LegalLens document Q&A / RAG.
Uses google-genai SDK with supported embedding models.
"""

import os
import logging
from typing import List
from dotenv import load_dotenv
from google import genai

logger = logging.getLogger(__name__)

# Load .env configuration
_env_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    ".env",
)
load_dotenv(dotenv_path=_env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Currently supported embedding model in Google Gemini API
PRIMARY_EMBEDDING_MODEL = "gemini-embedding-001"
FALLBACK_EMBEDDING_MODEL = "gemini-embedding-2"


class EmbeddingService:
    """
    Clean abstraction for generating text embeddings using Google Gemini API.
    Includes in-memory LRU caching for performance optimization.
    """

    def __init__(self, api_key: str = GEMINI_API_KEY):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self._client = None
        self._cache: dict[str, List[float]] = {}
        self._max_cache_size = 1000

    def _get_client(self) -> genai.Client:
        if not self._client:
            if not self.api_key:
                raise RuntimeError(
                    "GEMINI_API_KEY environment variable is not set. "
                    "Cannot generate document embeddings."
                )
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def get_embedding(self, text: str) -> List[float]:
        """
        Generates a vector embedding for a single text string, with caching.
        """
        if not text or not text.strip():
            raise ValueError("Cannot generate embedding for empty text.")

        cleaned_text = text.strip()
        if cleaned_text in self._cache:
            logger.debug(f"Embedding cache hit for text length {len(cleaned_text)}")
            return self._cache[cleaned_text]

        client = self._get_client()
        models_to_try = [PRIMARY_EMBEDDING_MODEL, FALLBACK_EMBEDDING_MODEL]

        for model in models_to_try:
            try:
                res = client.models.embed_content(
                    model=model,
                    contents=cleaned_text,
                )
                if res.embeddings and len(res.embeddings) > 0:
                    emb_val = res.embeddings[0].values
                    # Cache result if cache limit not exceeded
                    if len(self._cache) < self._max_cache_size:
                        self._cache[cleaned_text] = emb_val
                    return emb_val
            except Exception as e:
                logger.warning(f"Embedding failure with model '{model}': {e}")
                continue

        raise RuntimeError("Failed to generate vector embedding from Gemini API.")

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates vector embeddings for a list of text strings.
        """
        embeddings = []
        for text in texts:
            emb = self.get_embedding(text)
            embeddings.append(emb)
        return embeddings
