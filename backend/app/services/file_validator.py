from pathlib import Path


ALLOWED_EXTENSIONS = {
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
}

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


class FileValidationError(Exception):
    """Raised when an uploaded file fails validation."""


FILE_SIGNATURES = {
    ".pdf": [b"%PDF"],
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".jpg": [b"\xff\xd8\xff"],
    ".jpeg": [b"\xff\xd8\xff"],
}


def validate_file(
    filename: str,
    content_type: str,
    file_size: int,
    file_header: bytes,
) -> None:

    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise FileValidationError(
            "Unsupported file type. "
            "Only PDF, PNG, JPG, and JPEG files are allowed."
        )

    if content_type not in ALLOWED_CONTENT_TYPES:
        raise FileValidationError(
            "Invalid content type."
        )

    if file_size <= 0:
        raise FileValidationError(
            "Uploaded file is empty."
        )

    if file_size > MAX_FILE_SIZE_BYTES:
        raise FileValidationError(
            "File size exceeds the 10 MB limit."
        )

    valid_signatures = FILE_SIGNATURES[extension]

    if not any(
        file_header.startswith(signature)
        for signature in valid_signatures
    ):
        raise FileValidationError(
            "File content does not match its extension."
        )