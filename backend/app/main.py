from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.documents import router as documents_router
from app.config import settings


app = FastAPI(
    title="Document Summary Assistant API",
    version="1.0.0",
    description="Backend API for document upload and processing.",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(documents_router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "document-summary-assistant-api",
    }