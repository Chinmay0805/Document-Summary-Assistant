from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    max_file_size_mb: int = 10
    upload_directory: str = "uploads"
    frontend_url: str = "http://localhost:3000"

    # OCR configuration
    tesseract_cmd: str | None = None
    ocr_language: str = "eng"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


settings = Settings()

UPLOAD_DIR = Path(settings.upload_directory)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)