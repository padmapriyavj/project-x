"""HTTP response models for ingestion context endpoints."""

from uuid import UUID

from pydantic import BaseModel, Field


class LessonContextResponse(BaseModel):
    lesson_id: UUID
    text: str
    char_count: int = Field(description="Length of returned text")
    truncated: bool = False


class MaterialContextResponse(BaseModel):
    material_id: UUID
    text: str
    char_count: int
    truncated: bool = False
