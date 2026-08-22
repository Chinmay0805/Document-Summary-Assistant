import json

from google import genai
from google.genai import types

from app.config import settings
from app.schemas.summary import SummaryContent, SummaryLength
from app.services.summarization.base import SummarizationProvider


class GeminiSummarizationProvider(SummarizationProvider):

    def __init__(self) -> None:
        if not settings.gemini_api_key:
            raise RuntimeError(
                "Gemini API key is not configured."
            )

        self.client = genai.Client(
            api_key=settings.gemini_api_key
        )

    def summarize(
        self,
        text: str,
        length: SummaryLength,
    ) -> SummaryContent:

        if not text or not text.strip():
            raise ValueError(
                "Cannot summarize an empty document."
            )

        prompt = f"""
You are a document summarization assistant.

Summarize the following document.

Required summary length:
{length}

Rules:
- Preserve factual accuracy.
- Do not invent information.
- Do not add information that is not present in the document.
- The overview should capture the overall purpose and content.
- key_points should contain the most important factual points.
- main_ideas should capture the central concepts or conclusions.
- Keep the output concise.
- Do not use Markdown.
- Return only the requested structured summary.

Document:

{text}
"""

        try:
            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SummaryContent,
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(
                        disable=True
                    ),
                ),
            )

        except Exception as exc:
            raise RuntimeError(
                f"Gemini summarization failed: {exc}"
            ) from exc

        if not response.text:
            raise RuntimeError(
                "The summarization provider returned an empty response."
            )

        try:
            data = json.loads(response.text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "The summarization provider returned invalid JSON."
            ) from exc

        try:
            return SummaryContent.model_validate(data)
        except Exception as exc:
            raise RuntimeError(
                "The summarization provider returned an invalid summary structure."
            ) from exc