import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import UPLOAD_DIR, settings
from app.schemas.document import UploadResponse


router = APIRouter(prefix="/api/documents", tags=["Documents"])


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


def validate_file_type(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename was provided.",
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a PDF, PNG, JPG, or JPEG.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file MIME type.",
        )

    return extension


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
):
    extension = validate_file_type(file)

    document_id = str(uuid.uuid4())
    stored_filename = f"{document_id}{extension}"
    destination = UPLOAD_DIR / stored_filename

    total_size = 0

    try:
        with destination.open("wb") as output_file:
            while chunk := await file.read(1024 * 1024):
                total_size += len(chunk)

                if total_size > settings.max_file_size_bytes:
                    output_file.close()

                    if destination.exists():
                        destination.unlink()

                    raise HTTPException(
                        status_code=413,
                        detail=(
                            f"File is too large. "
                            f"Maximum allowed size is "
                            f"{settings.max_file_size_mb} MB."
                        ),
                    )

                output_file.write(chunk)

    except HTTPException:
        raise

    except Exception as exc:
        if destination.exists():
            destination.unlink()

        raise HTTPException(
            status_code=500,
            detail="Failed to save the uploaded file.",
        ) from exc

    return UploadResponse(
        success=True,
        filename=file.filename,
        document_id=document_id,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=total_size,
        message="Document uploaded successfully.",
    )