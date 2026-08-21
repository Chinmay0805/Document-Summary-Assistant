from typing import Literal

from pydantic import BaseModel, Field


ExtractionMethod = Literal[
    "pdf_text",
    "ocr_image",
    "ocr_pdf",
]


class ExtractionResult(BaseModel):
    text: str = Field(
        description="Normalized extracted text."
    )
    method: ExtractionMethod
    pages: int = Field(ge=1)
    characters: int = Field(ge=0)
    words: int = Field(ge=0)


class ExtractionResponse(BaseModel):
    success: bool
    document_id: str
    extraction: ExtractionResult