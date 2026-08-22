from typing import Literal

from pydantic import BaseModel, Field


SummaryLength = Literal["short", "medium", "long"]


class SummaryRequest(BaseModel):
    length: SummaryLength = Field(
        default="medium",
        description="Desired summary length.",
    )


class SummaryContent(BaseModel):
    overview: str
    key_points: list[str]
    main_ideas: list[str]


class SummaryResponse(BaseModel):
    success: bool
    document_id: str
    summary: SummaryContent
    length: SummaryLength