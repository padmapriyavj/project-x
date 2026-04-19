"""Business logic for student dashboard."""

from typing import Any

from database import get_supabase
from models.user import User

from .schemas import (
    CompletedEvent,
    StudentCourseStats,
    StudentDashboardResponse,
    StudentUserInfo,
    UpcomingEvent,
)

_COURSE_SELECT = "id,name"


def _get_enrolled_courses(user_id: int) -> list[dict[str, Any]]:
    """Get courses the student is enrolled in."""
    sb = get_supabase()
    enr = sb.table("enrollments").select("course_id").eq("user_id", user_id).execute()
    course_ids = [row["course_id"] for row in (enr.data or [])]
    if not course_ids:
        return []
    res = sb.table("courses").select(_COURSE_SELECT).in_("id", course_ids).execute()
    return list(res.data or [])


def _get_course_stats(user_id: int, course_id: int) -> dict[str, Any]:
    """
    Aggregate quiz stats for a student in a course.

    Returns zeroed stats initially; Person B will wire quiz_attempts here.
    """
    return {
        "tests_taken": 0,
        "coins_earned": 0,
    }


def _get_top_weak_concept(user_id: int, course_id: int) -> str | None:
    """
    Get the concept with lowest mastery for the student in this course.

    Returns None initially; will be computed from answers + questions.concept_id.
    """
    return None


def _get_active_tempo(course_id: int) -> dict[str, Any] | None:
    """
    Check if there's an active tempo quiz for this course.

    Returns None initially; will check quizzes table for type=tempo, status=active.
    """
    return None


def _get_upcoming_events(user_id: int, course_id: int) -> list[UpcomingEvent]:
    """
    Get upcoming scheduled quizzes/tempos for this course.

    Returns empty list initially; will query quizzes with future scheduled_at.
    """
    return []


def _get_completed_events(user_id: int, course_id: int) -> list[CompletedEvent]:
    """
    Get completed quiz attempts with stats for this course.

    Returns empty list initially; will query quiz_attempts joined with quizzes.
    """
    return []


def build_student_dashboard(user: User) -> StudentDashboardResponse:
    """Build the full student dashboard response."""
    user_info = StudentUserInfo(
        id=user.id,
        display_name=user.display_name,
        coins=user.coins,
        current_streak=user.current_streak,
        avatar_config=user.avatar_config,
    )

    courses = _get_enrolled_courses(user.id)
    course_stats_list: list[StudentCourseStats] = []

    for course in courses:
        course_id = course["id"]
        stats = _get_course_stats(user.id, course_id)

        course_stats = StudentCourseStats(
            id=course_id,
            name=course["name"],
            tests_taken=stats["tests_taken"],
            coins_earned=stats["coins_earned"],
            top_weak_concept=_get_top_weak_concept(user.id, course_id),
            active_tempo=_get_active_tempo(course_id),
            upcoming_events=_get_upcoming_events(user.id, course_id),
            completed_events=_get_completed_events(user.id, course_id),
        )
        course_stats_list.append(course_stats)

    return StudentDashboardResponse(user=user_info, courses=course_stats_list)
