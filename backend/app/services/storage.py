import os
import json
import uuid
import sqlite3
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from app.schemas.document import (
    ProcessingStatus,
    DocumentMetaData,
    DocumentPageSchema,
    DocumentContentResponse,
)
from app.schemas.analysis import AnalysisStatus

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
UPLOADS_DIR = os.path.join(STORAGE_DIR, "uploads")
DB_PATH = os.path.join(STORAGE_DIR, "db.sqlite3")


def get_db_connection() -> sqlite3.Connection:
    """Helper to open a SQLite connection with performance PRAGMAs tuned for high concurrency."""
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.execute("PRAGMA temp_store=MEMORY;")
    cursor.execute("PRAGMA cache_size=-64000;")  # 64MB memory cache
    cursor.execute("PRAGMA mmap_size=268435456;")  # 256MB mmap I/O
    return conn


def init_db():
    """Ensure storage directory exists and database tables are initialized with high-performance indexes."""
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                original_filename TEXT NOT NULL,
                title TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                storage_path TEXT NOT NULL,
                page_count INTEGER DEFAULT 0,
                processing_status TEXT NOT NULL,
                error_message TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id TEXT NOT NULL,
                page_number INTEGER NOT NULL,
                text TEXT NOT NULL,
                section_info TEXT,
                FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
            )
        """)

        # Phase 3: Analysis tables
        # Add analysis_status column if not exists
        try:
            cursor.execute("ALTER TABLE documents ADD COLUMN analysis_status TEXT DEFAULT 'not_started'")
        except sqlite3.OperationalError:
            pass  # Column already exists

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id TEXT UNIQUE NOT NULL,
                analysis_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
            )
        """)

        # Phase 4: Document chunks & vector store table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_chunks (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                page_number INTEGER NOT NULL,
                section TEXT,
                source_text TEXT NOT NULL,
                embedding_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON document_chunks(document_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_pages_doc_id ON document_pages(document_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analyses_doc_id ON analyses(document_id)")

        # Phase 5: Document comparisons table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_comparisons (
                id TEXT PRIMARY KEY,
                document_a_id TEXT NOT NULL,
                document_b_id TEXT NOT NULL,
                summary TEXT NOT NULL,
                total_changes INTEGER NOT NULL,
                added_count INTEGER NOT NULL,
                removed_count INTEGER NOT NULL,
                modified_count INTEGER NOT NULL,
                comparison_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (document_a_id) REFERENCES documents (id) ON DELETE CASCADE,
                FOREIGN KEY (document_b_id) REFERENCES documents (id) ON DELETE CASCADE
            )
        """)
        conn.commit()


def save_file_to_disk(file_bytes: bytes, file_type: str) -> tuple[str, str]:
    """
    Saves file bytes to disk in the isolated uploads directory using a UUID.
    Returns (document_id, storage_path).
    """
    init_db()
    doc_id = str(uuid.uuid4())
    storage_filename = f"{doc_id}.{file_type}"
    storage_path = os.path.join(UPLOADS_DIR, storage_filename)
    
    with open(storage_path, "wb") as f:
        f.write(file_bytes)
        
    return doc_id, storage_path


def create_document(
    doc_id: str,
    original_filename: str,
    title: str,
    file_type: str,
    file_size: int,
    storage_path: str,
    status: ProcessingStatus = ProcessingStatus.UPLOADED,
) -> DocumentMetaData:
    """Inserts a new document record into SQLite database."""
    init_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO documents (
                id, original_filename, title, file_type, file_size, storage_path,
                page_count, processing_status, error_message, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                doc_id,
                original_filename,
                title,
                file_type,
                file_size,
                storage_path,
                0,
                status.value,
                None,
                now_iso,
                now_iso,
            ),
        )
        conn.commit()

    return DocumentMetaData(
        id=doc_id,
        original_filename=original_filename,
        title=title,
        file_type=file_type,
        file_size=file_size,
        page_count=0,
        processing_status=status,
        error_message=None,
        created_at=now_iso,
        updated_at=now_iso,
    )


def update_document_status(
    doc_id: str,
    status: ProcessingStatus,
    page_count: int = 0,
    error_message: Optional[str] = None,
):
    """Updates document status, page count, and timestamp in SQLite database."""
    init_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE documents
            SET processing_status = ?, page_count = ?, error_message = ?, updated_at = ?
            WHERE id = ?
            """,
            (status.value, page_count, error_message, now_iso, doc_id),
        )
        conn.commit()


def save_document_pages(doc_id: str, pages: List[DocumentPageSchema]):
    """Stores extracted pages into SQLite database."""
    init_db()
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Clear existing pages if re-parsing
        cursor.execute("DELETE FROM document_pages WHERE document_id = ?", (doc_id,))
        
        for p in pages:
            cursor.execute(
                """
                INSERT INTO document_pages (document_id, page_number, text, section_info)
                VALUES (?, ?, ?, ?)
                """,
                (doc_id, p.page_number, p.text, p.section_info),
            )
        conn.commit()


def get_document_by_id(doc_id: str) -> Optional[DocumentMetaData]:
    """Retrieves document metadata by ID."""
    init_db()
    
    with get_db_connection() as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        
        if not row:
            return None
            
        return DocumentMetaData(
            id=row["id"],
            original_filename=row["original_filename"],
            title=row["title"],
            file_type=row["file_type"],
            file_size=row["file_size"],
            page_count=row["page_count"],
            processing_status=ProcessingStatus(row["processing_status"]),
            error_message=row["error_message"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


def get_document_content(doc_id: str) -> Optional[DocumentContentResponse]:
    """Retrieves full document structured content including all pages."""
    doc = get_document_by_id(doc_id)
    if not doc:
        return None
        
    with get_db_connection() as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT page_number, text, section_info FROM document_pages WHERE document_id = ? ORDER BY page_number ASC",
            (doc_id,),
        )
        rows = cursor.fetchall()
        
        pages = [
            DocumentPageSchema(
                page_number=r["page_number"],
                text=r["text"],
                section_info=r["section_info"],
            )
            for r in rows
        ]
        
        return DocumentContentResponse(
            document_id=doc.id,
            title=doc.title,
            file_type=doc.file_type,
            page_count=doc.page_count,
            pages=pages,
        )


def get_document_storage_path(doc_id: str) -> Optional[str]:
    """Returns absolute file path to the stored document."""
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT storage_path FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        return row[0] if row else None


# ─── Phase 3: Analysis Storage ────────────────────────────────────────────────


def update_analysis_status(
    doc_id: str,
    status: AnalysisStatus,
):
    """Updates the analysis_status column on a document."""
    init_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE documents SET analysis_status = ?, updated_at = ? WHERE id = ?",
            (status.value, now_iso, doc_id),
        )
        conn.commit()


def get_analysis_status(doc_id: str) -> Optional[str]:
    """Returns the analysis_status for a document."""
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT analysis_status FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        return row[0] if row else None


def save_analysis(doc_id: str, analysis_dict: dict):
    """Inserts or updates the analysis JSON for a document."""
    init_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    analysis_json_str = json.dumps(analysis_dict, ensure_ascii=False)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM analyses WHERE document_id = ?",
            (doc_id,),
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                "UPDATE analyses SET analysis_json = ?, updated_at = ? WHERE document_id = ?",
                (analysis_json_str, now_iso, doc_id),
            )
        else:
            cursor.execute(
                "INSERT INTO analyses (document_id, analysis_json, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (doc_id, analysis_json_str, now_iso, now_iso),
            )
        conn.commit()


def get_analysis(doc_id: str) -> Optional[dict]:
    """Retrieves the structured analysis dict for a document."""
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT analysis_json FROM analyses WHERE document_id = ?",
            (doc_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None
        return json.loads(row[0])


# ─── Phase 5: Document Comparison Storage ─────────────────────────────────────


def list_documents() -> List[DocumentMetaData]:
    """Retrieves all uploaded documents ordered by creation date descending."""
    init_db()
    with get_db_connection() as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [
            DocumentMetaData(
                id=r["id"],
                original_filename=r["original_filename"],
                title=r["title"],
                file_type=r["file_type"],
                file_size=r["file_size"],
                page_count=r["page_count"],
                processing_status=ProcessingStatus(r["processing_status"]),
                error_message=r["error_message"],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
            )
            for r in rows
        ]


def save_comparison(comp_dict: dict) -> str:
    """Inserts or updates a document comparison record."""
    init_db()
    comp_id = comp_dict.get("comparison_id") or str(uuid.uuid4())
    comp_dict["comparison_id"] = comp_id
    now_iso = datetime.now(timezone.utc).isoformat()
    json_str = json.dumps(comp_dict, ensure_ascii=False)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO document_comparisons (
                id, document_a_id, document_b_id, summary, total_changes,
                added_count, removed_count, modified_count, comparison_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                comp_id,
                comp_dict["document_a_id"],
                comp_dict["document_b_id"],
                comp_dict.get("summary", ""),
                comp_dict.get("total_changes", 0),
                comp_dict.get("added_count", 0),
                comp_dict.get("removed_count", 0),
                comp_dict.get("modified_count", 0),
                json_str,
                now_iso,
            ),
        )
        conn.commit()
    return comp_id


def get_comparison(comp_id: str) -> Optional[dict]:
    """Retrieves a comparison by its comparison ID."""
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT comparison_json FROM document_comparisons WHERE id = ?", (comp_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return json.loads(row[0])


def get_comparison_by_docs(doc_a_id: str, doc_b_id: str) -> Optional[dict]:
    """Retrieves existing comparison record for document pair A & B (in either direction)."""
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT comparison_json FROM document_comparisons
            WHERE (document_a_id = ? AND document_b_id = ?)
               OR (document_a_id = ? AND document_b_id = ?)
            ORDER BY created_at DESC LIMIT 1
            """,
            (doc_a_id, doc_b_id, doc_b_id, doc_a_id),
        )
        row = cursor.fetchone()
        if not row:
            return None
        return json.loads(row[0])
