import pytest

from app.services.file_validator import (
    FileValidationError,
    validate_file,
)


def test_valid_pdf():
    validate_file(
        filename="document.pdf",
        content_type="application/pdf",
        file_size=1000,
        file_header=b"%PDF-1.7",
    )


def test_valid_png():
    validate_file(
        filename="document.png",
        content_type="image/png",
        file_size=1000,
        file_header=b"\x89PNG\r\n\x1a\n",
    )


def test_reject_unsupported_extension():
    with pytest.raises(FileValidationError):
        validate_file(
            filename="document.exe",
            content_type="application/octet-stream",
            file_size=1000,
            file_header=b"MZ",
        )


def test_reject_mismatched_content():
    with pytest.raises(FileValidationError):
        validate_file(
            filename="document.pdf",
            content_type="application/pdf",
            file_size=1000,
            file_header=b"MZ",
        )


def test_reject_empty_file():
    with pytest.raises(FileValidationError):
        validate_file(
            filename="document.pdf",
            content_type="application/pdf",
            file_size=0,
            file_header=b"",
        )


def test_reject_large_file():
    with pytest.raises(FileValidationError):
        validate_file(
            filename="document.pdf",
            content_type="application/pdf",
            file_size=10 * 1024 * 1024 + 1,
            file_header=b"%PDF-1.7",
        )