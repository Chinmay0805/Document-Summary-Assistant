import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import UPLOAD_DIR, settings
from app.schemas.document import UploadResponse
from app.schemas.extraction import ExtractionResponse
from app.schemas.summary import SummaryRequest, SummaryResponse
from app.services.extraction import ExtractionError, extract_document
from app.services.file_validator import (
    FileValidationError,
    validate_file,
)
from app.services.summarization.service import SummarizationService


router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"],
)


EXTENSION_TO_CONTENT_TYPE = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


def validate_upload_metadata(file: UploadFile) -> str:
    """Validate filename metadata and return the normalized extension."""

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename was provided.",
        )

    return Path(file.filename).suffix.lower()


def get_document_file(document_id: str) -> tuple[Path, str]:
    """Validate document ID and resolve the stored document."""

    try:
        uuid.UUID(document_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid document ID.",
        ) from exc

    matching_files = list(
        UPLOAD_DIR.glob(f"{document_id}.*")
    )

    if not matching_files:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    file_path = matching_files[0]

    content_type = EXTENSION_TO_CONTENT_TYPE.get(
        file_path.suffix.lower()
    )

    if not content_type:
        raise HTTPException(
            status_code=400,
            detail="Unsupported document type.",
        )

    return file_path, content_type


def get_summarization_service() -> SummarizationService:
    """Create the summarization service."""

    return SummarizationService()


@router.post(
    "/upload",
    response_model=UploadResponse,
)
async def upload_document(
    file: UploadFile = File(...),
):
    extension = validate_upload_metadata(file)

    document_id = str(uuid.uuid4())
    stored_filename = f"{document_id}{extension}"
    destination = UPLOAD_DIR / stored_filename

    total_size = 0
    first_chunk = b""

    try:
        with destination.open("wb") as output_file:
            while chunk := await file.read(1024 * 1024):
                total_size += len(chunk)

                if not first_chunk:
                    first_chunk = chunk[:16]

                if total_size > settings.max_file_size_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=(
                            f"File is too large. Maximum allowed size is "
                            f"{settings.max_file_size_mb} MB."
                        ),
                    )

                output_file.write(chunk)

        # Validate the complete upload after streaming it to disk.
        try:
            validate_file(
                filename=file.filename,
                content_type=file.content_type or "",
                file_size=total_size,
                file_header=first_chunk,
            )
        except FileValidationError as exc:
            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc

    except HTTPException:
        if destination.exists():
            destination.unlink()

        raise

    except Exception as exc:
        if destination.exists():
            destination.unlink()

        raise HTTPException(
            status_code=500,
            detail="Failed to save the uploaded file.",
        ) from exc

    finally:
        await file.close()

    return UploadResponse(
        success=True,
        filename=file.filename,
        document_id=document_id,
        content_type=file.content_type
        or "application/octet-stream",
        size_bytes=total_size,
        message="Document uploaded successfully.",
    )


@router.post(
    "/{document_id}/extract",
    response_model=ExtractionResponse,
)
async def extract_uploaded_document(
    document_id: str,
):
    file_path, content_type = get_document_file(document_id)

    try:
        result = extract_document(
            file_path,
            content_type,
        )

        return ExtractionResponse(
            success=True,
            document_id=document_id,
            extraction=result,
        )

    except ExtractionError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while extracting the document.",
        ) from exc


@router.post(
    "/{document_id}/summarize",
    response_model=SummaryResponse,
)
async def summarize_document(
    document_id: str,
    request: SummaryRequest,
):
    file_path, content_type = get_document_file(document_id)

    try:
        # Extract document text.
        extraction_result = extract_document(
            file_path,
            content_type,
        )

        # Generate summary.
        service = get_summarization_service()

        summary = service.summarize(
            extraction_result.text,
            request.length,
        )

        return SummaryResponse(
            success=True,
            document_id=document_id,
            summary=summary,
            length=request.length,
        )

    except ExtractionError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        # TEMPORARY DEBUG LOGGING.
        # Remove detailed exception output before production.
        print(
            f"SUMMARY ERROR: "
            f"{type(exc).__name__}: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Summary generation failed: "
                f"{type(exc).__name__}: {exc}"
            ),
        ) from exc