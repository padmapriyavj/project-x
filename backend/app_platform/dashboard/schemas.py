"""Pydantic schemas for student dashboard."""

from typing import Any

from pydantic import BaseModel


class StudentUserInfo(BaseModel):
    """User info subset for dashboard."""

    model_config = {"from_attributes": True}

    id: int
    display_name: str
    coins: int
    current_streak: int
    avatar_config: dict[str, Any]


class UpcomingEvent(BaseModel):
    """Upcoming quiz/tempo event."""

    id: str
    title: str
    date: str


class CompletedEvent(BaseModel):
    """Completed quiz with stats."""

    id: str
    title: str
    attempted: int
    correct: int
    wrong: int
    concepts: list[str]
    coins: int
    betcha: str | None


class StudentCourseStats(BaseModel):
    """Per-course stats for student dashboard."""

    id: int
    name: str
    tests_taken: int
    coins_earned: int
    top_weak_concept: str | None
    active_tempo: dict[str, Any] | None
    upcoming_events: list[UpcomingEvent]
    completed_events: list[CompletedEvent]


class StudentDashboardResponse(BaseModel):
    """Full student dashboard response."""

    user: StudentUserInfo
    courses: list[StudentCourseStats]
