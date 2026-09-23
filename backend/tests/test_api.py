import os
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")


@pytest.mark.asyncio
async def test_api_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_upload_pdf_flow():
    pdf_path = os.path.join(SAMPLES_DIR, "sample_contract.pdf")
    transport = ASGITransport(app=app)
    
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        with open(pdf_path, "rb") as f:
            files = {"file": ("sample_contract.pdf", f, "application/pdf")}
            res = await ac.post("/api/v1/documents/upload", files=files)
            
        assert res.status_code == 201
        data = res.json()
        assert "document_id" in data
        assert data["file_type"] == "pdf"
        assert data["page_count"] == 2
        assert data["processing_status"] == "completed"

        doc_id = data["document_id"]

        # Fetch document metadata
        meta_res = await ac.get(f"/api/v1/documents/{doc_id}")
        assert meta_res.status_code == 200
        meta_data = meta_res.json()
        assert meta_data["id"] == doc_id
        assert meta_data["processing_status"] == "completed"

        # Fetch document content
        content_res = await ac.get(f"/api/v1/documents/{doc_id}/content")
        assert content_res.status_code == 200
        content_data = content_res.json()
        assert content_data["document_id"] == doc_id
        assert content_data["page_count"] == 2
        assert len(content_data["pages"]) == 2
        assert content_data["pages"][0]["page_number"] == 1
        assert "RESIDENTIAL LEASE AGREEMENT" in content_data["pages"][0]["text"]


@pytest.mark.asyncio
async def test_upload_txt_flow():
    txt_path = os.path.join(SAMPLES_DIR, "sample_lease.txt")
    transport = ASGITransport(app=app)
    
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        with open(txt_path, "rb") as f:
            files = {"file": ("sample_lease.txt", f, "text/plain")}
            res = await ac.post("/api/v1/documents/upload", files=files)
            
        assert res.status_code == 201
        data = res.json()
        assert data["file_type"] == "txt"
        assert data["processing_status"] == "completed"


@pytest.mark.asyncio
async def test_get_nonexistent_document():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/documents/non-existent-id")
        assert res.status_code == 404
