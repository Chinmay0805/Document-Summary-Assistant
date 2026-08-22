from app.schemas.summary import SummaryContent
from app.services.summarization.base import SummarizationProvider
from app.services.summarization.service import SummarizationService


class FakeProvider(SummarizationProvider):

    def summarize(self, text, length):
        return SummaryContent(
            overview="Test overview.",
            key_points=[
                "Important point one.",
                "Important point two.",
            ],
            main_ideas=[
                "Main idea one.",
            ],
        )


def test_summarization_service():
    service = SummarizationService.__new__(
        SummarizationService
    )

    service.provider = FakeProvider()

    result = service.summarize(
        "This is test document content.",
        "medium",
    )

    assert result.overview == "Test overview."
    assert len(result.key_points) == 2
    assert len(result.main_ideas) == 1

def test_empty_document_rejected():
    service = SummarizationService.__new__(
        SummarizationService
    )

    service.provider = FakeProvider()

    try:
        service.summarize("", "medium")
        assert False
    except ValueError as exc:
        assert "empty" in str(exc).lower()