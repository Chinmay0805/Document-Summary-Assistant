from pathlib import Path

import fitz
import pytesseract
from PIL import Image

from app.config import settings


class OCRExtractionError(Exception):
    """Raised when OCR extraction fails."""


def configure_tesseract() -> None:
    if settings.tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = (
            settings.tesseract_cmd
        )


def extract_image_text(file_path: Path) -> str:
    configure_tesseract()

    try:
        with Image.open(file_path) as image:
            return pytesseract.image_to_string(
                image,
                lang=settings.ocr_language,
            )

    except Exception as exc:
        raise OCRExtractionError(
            "Failed to extract text from the image using OCR."
        ) from exc


def extract_pdf_ocr(file_path: Path) -> tuple[str, int]:
    configure_tesseract()

    try:
        document = fitz.open(file_path)

        try:
            pages = len(document)
            extracted_pages = []

            for page in document:
                # Render at 2x resolution to improve OCR quality.
                pixmap = page.get_pixmap(
                    matrix=fitz.Matrix(2, 2),
                    alpha=False,
                )

                image = Image.frombytes(
                    "RGB",
                    [pixmap.width, pixmap.height],
                    pixmap.samples,
                )

                text = pytesseract.image_to_string(
                    image,
                    lang=settings.ocr_language,
                )

                if text.strip():
                    extracted_pages.append(text)

            return "\n\n".join(extracted_pages), pages

        finally:
            document.close()

    except Exception as exc:
        raise OCRExtractionError(
            "Failed to extract text from the scanned PDF using OCR."
        ) from exc