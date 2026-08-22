from app.schemas.summary import SummaryContent, SummaryLength
from app.services.summarization.provider import (
    GeminiSummarizationProvider,
)


class SummarizationService:

    def __init__(self) -> None:
        self.provider = GeminiSummarizationProvider()

    def summarize(
        self,
        text: str,
        length: SummaryLength,
    ) -> SummaryContent:

        cleaned_text = text.strip()

        if not cleaned_text:
            raise ValueError(
                "Cannot summarize an empty document."
            )

        return self.provider.summarize(
            cleaned_text,
            length,
        )