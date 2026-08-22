from pydantic import BaseModel


class UploadResponse(BaseModel):
    """Response returned after a document is successfully uploaded."""

    success: bool
    filename: str
    document_id: str
    content_type: str
    size_bytes: int
    message: str