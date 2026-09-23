import os
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

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
UPLOADS_DIR = os.path.join(STORAGE_DIR, "uploads")
DB_PATH = os.path.join(STORAGE_DIR, "db.sqlite3")


def init_db():
    """Ensure storage directory exists and database tables are initialized."""
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    
    with sqlite3.connect(DB_PATH) as conn:
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
    
    with sqlite3.connect(DB_PATH) as conn:
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
    
    with sqlite3.connect(DB_PATH) as conn:
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
    
    with sqlite3.connect(DB_PATH) as conn:
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
    
    with sqlite3.connect(DB_PATH) as conn:
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
        
    with sqlite3.connect(DB_PATH) as conn:
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
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT storage_path FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        return row[0] if row else None
