import os
import pytest
from app.services.parsers.pdf import extract_pdf
from app.services.parsers.docx import extract_docx
from app.services.parsers.txt import extract_txt

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")


def test_pdf_extraction():
    pdf_path = os.path.join(SAMPLES_DIR, "sample_contract.pdf")
    pages, meta = extract_pdf(pdf_path)
    
    assert len(pages) == 2
    assert meta["page_count"] == 2
    assert pages[0].page_number == 1
    assert "RESIDENTIAL LEASE AGREEMENT" in pages[0].text
    assert pages[1].page_number == 2
    assert "Early Termination" in pages[1].text


def test_docx_extraction():
    docx_path = os.path.join(SAMPLES_DIR, "sample_contract.docx")
    pages, meta = extract_docx(docx_path)
    
    assert len(pages) >= 1
    assert pages[0].page_number == 1
    assert "EMPLOYMENT AGREEMENT" in pages[0].text
    assert "Compensation" in pages[0].text


def test_txt_extraction():
    txt_path = os.path.join(SAMPLES_DIR, "sample_lease.txt")
    pages, meta = extract_txt(txt_path)
    
    assert len(pages) >= 1
    assert pages[0].page_number == 1
    assert "RESIDENTIAL LEASE AGREEMENT" in pages[0].text
    assert "SECTION 1: PARTIES & PREMISES" in pages[0].text
