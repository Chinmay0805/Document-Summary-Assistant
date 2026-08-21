from io import BytesIO

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_upload_valid_pdf():
    response = client.post(
        "/api/documents/upload",
        files={
            "file": (
                "test.pdf",
                BytesIO(b"%PDF-1.7\nfake pdf content"),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "document_id" in data

    document_id = data["document_id"]

    # Clean up uploaded test file.
    from app.config import UPLOAD_DIR

    for file_path in UPLOAD_DIR.glob(f"{document_id}.*"):
        file_path.unlink()


def test_upload_rejects_unsupported_extension():
    response = client.post(
        "/api/documents/upload",
        files={
            "file": (
                "malware.exe",
                BytesIO(b"MZ fake executable"),
                "application/octet-stream",
            )
        },
    )

    assert response.status_code == 400


def test_upload_rejects_mismatched_file_content():
    response = client.post(
        "/api/documents/upload",
        files={
            "file": (
                "document.pdf",
                BytesIO(b"MZ fake executable"),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 400


def test_extract_invalid_document_id():
    response = client.post(
        "/api/documents/not-a-uuid/extract"
    )

    assert response.status_code == 400


def test_extract_missing_document():
    response = client.post(
        "/api/documents/00000000-0000-0000-0000-000000000000/extract"
    )

    assert response.status_code == 404