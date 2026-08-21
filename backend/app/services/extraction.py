from pathlib import Path

from app.schemas.extraction import ExtractionResult
from app.services.ocr_extractor import (
    extract_image_text,
    extract_pdf_ocr,
)
from app.services.pdf_extractor import extract_pdf_text
from app.services.text_processor import (
    count_words,
    normalize_text,
)


MIN_NATIVE_PDF_CHARACTERS = 50


class ExtractionError(Exception):
    """Raised when document extraction cannot produce usable text."""


def _build_result(
    text: str,
    method: str,
    pages: int,
) -> ExtractionResult:
    normalized_text = normalize_text(text)

    return ExtractionResult(
        text=normalized_text,
        method=method,
        pages=pages,
        characters=len(normalized_text),
        words=count_words(normalized_text),
    )


def extract_document(
    file_path: Path,
    content_type: str,
) -> ExtractionResult:

    if content_type == "application/pdf":
        return _extract_pdf(file_path)

    if content_type.startswith("image/"):
        return _extract_image(file_path)

    raise ExtractionError(
        f"Unsupported document type: {content_type}"
    )


def _extract_pdf(file_path: Path) -> ExtractionResult:
    try:
        text, pages = extract_pdf_text(file_path)

        normalized_text = normalize_text(text)

        # Normal PDF with a usable text layer.
        if len(normalized_text) >= MIN_NATIVE_PDF_CHARACTERS:
            return _build_result(
                normalized_text,
                "pdf_text",
                pages,
            )

        # Little/no native text means this is likely a scanned PDF.
        ocr_text, ocr_pages = extract_pdf_ocr(file_path)

        if not normalize_text(ocr_text):
            raise ExtractionError(
                "No readable text could be extracted from this document."
            )

        return _build_result(
            ocr_text,
            "ocr_pdf",
            ocr_pages,
        )

    except ExtractionError:
        raise

    except Exception as exc:
        raise ExtractionError(
            "Failed to process the PDF."
        ) from exc


def _extract_image(file_path: Path) -> ExtractionResult:
    try:
        text = extract_image_text(file_path)

        if not normalize_text(text):
            raise ExtractionError(
                "No readable text could be extracted from this image."
            )

        return _build_result(
            text,
            "ocr_image",
            1,
        )

    except ExtractionError:
        raise

    except Exception as exc:
        raise ExtractionError(
            "Failed to process the image."
        ) from exc