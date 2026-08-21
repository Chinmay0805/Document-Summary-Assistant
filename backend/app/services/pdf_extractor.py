from pathlib import Path

import fitz


class PDFExtractionError(Exception):
    """Raised when native PDF extraction fails."""


def extract_pdf_text(file_path: Path) -> tuple[str, int]:
    try:
        document = fitz.open(file_path)

        try:
            pages = len(document)
            page_text = []

            for page in document:
                text = page.get_text("text")

                if text.strip():
                    page_text.append(text)

            return "\n\n".join(page_text), pages

        finally:
            document.close()

    except Exception as exc:
        raise PDFExtractionError(
            "Failed to extract text from the PDF."
        ) from exc