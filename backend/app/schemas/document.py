from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class ProcessingStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentBase(BaseModel):
    title: str
    original_filename: str
    file_type: str
    file_size: int


class DocumentCreate(DocumentBase):
    pass


class DocumentMetaData(DocumentBase):
    id: str
    page_count: int = 0
    processing_status: ProcessingStatus = ProcessingStatus.UPLOADED
    error_message: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class DocumentPageSchema(BaseModel):
    page_number: int
    text: str
    section_info: Optional[str] = None


class DocumentContentResponse(BaseModel):
    document_id: str
    title: str
    file_type: str
    page_count: int
    pages: List[DocumentPageSchema]


class UploadResponse(BaseModel):
    document_id: str
    title: str
    file_type: str
    file_size: int
    page_count: int
    processing_status: ProcessingStatus
    message: str
