from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class CreateCourseRequest(BaseModel):
    name: str
    description: Optional[str] = None
    schedule: dict[str, Any] = Field(default_factory=dict)


class UpdateCourseRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    schedule: Optional[dict[str, Any]] = None


class EnrollRequest(BaseModel):
    join_code: str


class CourseResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    professor_id: int
    name: str
    description: Optional[str]
    schedule: dict[str, Any]
    join_code: str
    created_at: datetime


class StudentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    email: str
    display_name: str
    avatar_config: dict[str, Any]
    coins: int
    current_streak: int
