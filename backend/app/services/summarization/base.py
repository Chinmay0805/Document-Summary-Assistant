from abc import ABC, abstractmethod

from app.schemas.summary import SummaryContent, SummaryLength


class SummarizationProvider(ABC):

    @abstractmethod
    def summarize(
        self,
        text: str,
        length: SummaryLength,
    ) -> SummaryContent:
        """Generate a structured summary from document text."""
        raise NotImplementedError