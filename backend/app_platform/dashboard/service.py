"""Business logic for dashboard endpoints."""

from typing import Any

from database import get_supabase
from models.user import User

from .schemas import (
    CompletedEvent,
    ConceptMasteryCell,
    CourseAnalyticsResponse,
    ProfessorCourseOverview,
    ProfessorDashboardResponse,
    ProfessorUserInfo,
    StudentAnalytics,
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


# =============================================================================
# Professor Dashboard
# =============================================================================


def _get_professor_courses(professor_id: int) -> list[dict[str, Any]]:
    """Get courses owned by this professor."""
    sb = get_supabase()
    res = sb.table("courses").select("id,name").eq("professor_id", professor_id).execute()
    return list(res.data or [])


def _get_enrollment_count(course_id: int) -> int:
    """Get count of enrolled students for a course."""
    sb = get_supabase()
    res = sb.table("enrollments").select("id", count="exact").eq("course_id", course_id).execute()
    return res.count or 0


def _get_tempos_scheduled(course_id: int) -> int:
    """Get count of tempo quizzes for a course."""
    sb = get_supabase()
    res = (
        sb.table("quizzes")
        .select("id", count="exact")
        .eq("course_id", str(course_id))
        .eq("type", "tempo")
        .execute()
    )
    return res.count or 0


def _get_class_avg_score(course_id: int) -> float | None:
    """Get average score across all quiz attempts for a course."""
    sb = get_supabase()
    quizzes_res = sb.table("quizzes").select("id").eq("course_id", str(course_id)).execute()
    quiz_ids = [row["id"] for row in (quizzes_res.data or [])]
    if not quiz_ids:
        return None

    attempts_res = (
        sb.table("quiz_attempts")
        .select("score_pct")
        .in_("quiz_id", quiz_ids)
        .not_.is_("score_pct", "null")
        .execute()
    )
    scores = [row["score_pct"] for row in (attempts_res.data or []) if row.get("score_pct") is not None]
    if not scores:
        return None
    return round(sum(scores) / len(scores), 2)


def build_professor_dashboard(user: User) -> ProfessorDashboardResponse:
    """Build the full professor dashboard response."""
    user_info = ProfessorUserInfo(
        id=user.id,
        display_name=user.display_name,
        email=user.email,
    )

    courses = _get_professor_courses(user.id)
    course_overviews: list[ProfessorCourseOverview] = []

    for course in courses:
        course_id = course["id"]
        overview = ProfessorCourseOverview(
            id=course_id,
            name=course["name"],
            enrollment_count=_get_enrollment_count(course_id),
            tempos_scheduled=_get_tempos_scheduled(course_id),
            class_avg_score=_get_class_avg_score(course_id),
        )
        course_overviews.append(overview)

    return ProfessorDashboardResponse(user=user_info, courses=course_overviews)


# =============================================================================
# Professor Course Analytics
# =============================================================================


def _get_enrolled_students(course_id: int) -> list[dict[str, Any]]:
    """Get enrolled students with their basic info."""
    sb = get_supabase()
    enr_res = sb.table("enrollments").select("user_id").eq("course_id", course_id).execute()
    user_ids = [row["user_id"] for row in (enr_res.data or [])]
    if not user_ids:
        return []

    users_res = (
        sb.table("users")
        .select("id,display_name,email,avatar_config,coins,current_streak")
        .in_("id", user_ids)
        .execute()
    )
    return list(users_res.data or [])


def _get_student_quiz_stats(student_id: int, course_id: int) -> dict[str, Any]:
    """Get quiz stats for a student in a specific course."""
    sb = get_supabase()

    quizzes_res = sb.table("quizzes").select("id").eq("course_id", str(course_id)).execute()
    quiz_ids = [row["id"] for row in (quizzes_res.data or [])]
    if not quiz_ids:
        return {"quizzes_taken": 0, "avg_score": None, "last_activity": None}

    attempts_res = (
        sb.table("quiz_attempts")
        .select("score_pct,completed_at")
        .eq("user_id", str(student_id))
        .in_("quiz_id", quiz_ids)
        .not_.is_("completed_at", "null")
        .order("completed_at", desc=True)
        .execute()
    )
    attempts = attempts_res.data or []
    if not attempts:
        return {"quizzes_taken": 0, "avg_score": None, "last_activity": None}

    scores = [a["score_pct"] for a in attempts if a.get("score_pct") is not None]
    avg_score = round(sum(scores) / len(scores), 2) if scores else None
    last_activity = attempts[0].get("completed_at") if attempts else None

    return {
        "quizzes_taken": len(attempts),
        "avg_score": avg_score,
        "last_activity": last_activity,
    }


def _get_course_concepts(course_id: int) -> list[dict[str, Any]]:
    """Get all concepts for a course via lessons."""
    sb = get_supabase()

    lessons_res = sb.table("lessons").select("id").eq("course_id", course_id).execute()
    lesson_ids = [str(row["id"]) for row in (lessons_res.data or [])]
    if not lesson_ids:
        return []

    concepts_res = (
        sb.table("concepts")
        .select("id,name,lesson_id")
        .in_("lesson_id", lesson_ids)
        .execute()
    )
    return list(concepts_res.data or [])


def _get_concept_heatmap(
    student_ids: list[int],
    concept_ids: list[str],
    concept_names: dict[str, str],
) -> list[ConceptMasteryCell]:
    """Get concept mastery data for all students and concepts."""
    if not student_ids or not concept_ids:
        return []

    sb = get_supabase()
    heatmap_cells: list[ConceptMasteryCell] = []

    mastery_res = (
        sb.table("user_concept_mastery")
        .select("user_id,concept_id,mastery_score")
        .in_("user_id", [str(sid) for sid in student_ids])
        .in_("concept_id", concept_ids)
        .execute()
    )

    for row in mastery_res.data or []:
        concept_id = row["concept_id"]
        cell = ConceptMasteryCell(
            student_id=int(row["user_id"]) if isinstance(row["user_id"], str) and row["user_id"].isdigit() else row["user_id"],
            concept_id=concept_id,
            concept_name=concept_names.get(concept_id, "Unknown"),
            mastery_score=float(row.get("mastery_score", 0)),
        )
        heatmap_cells.append(cell)

    return heatmap_cells


def get_course_if_owned(course_id: int, professor_id: int) -> dict[str, Any] | None:
    """Get course if owned by professor, else None."""
    sb = get_supabase()
    res = (
        sb.table("courses")
        .select("id,name,professor_id")
        .eq("id", course_id)
        .limit(1)
        .execute()
    )
    if not res.data or len(res.data) == 0:
        return None
    course = res.data[0]
    if course.get("professor_id") != professor_id:
        return None
    return dict(course)


def build_course_analytics(course_id: int, course: dict[str, Any]) -> CourseAnalyticsResponse:
    """Build course analytics response with roster and concept heatmap."""
    students = _get_enrolled_students(course_id)

    roster: list[StudentAnalytics] = []
    for student in students:
        student_id = student["id"]
        stats = _get_student_quiz_stats(student_id, course_id)
        analytics = StudentAnalytics(
            id=student_id,
            display_name=student["display_name"],
            email=student["email"],
            avatar_config=student.get("avatar_config") or {},
            coins=student.get("coins", 0),
            current_streak=student.get("current_streak", 0),
            quizzes_taken=stats["quizzes_taken"],
            avg_score=stats["avg_score"],
            last_activity=stats["last_activity"],
        )
        roster.append(analytics)

    concepts = _get_course_concepts(course_id)
    concept_ids = [c["id"] for c in concepts]
    concept_names = {c["id"]: c["name"] for c in concepts}
    student_ids = [s["id"] for s in students]

    heatmap = _get_concept_heatmap(student_ids, concept_ids, concept_names)

    return CourseAnalyticsResponse(
        course_id=course_id,
        course_name=course["name"],
        roster=roster,
        concept_heatmap=heatmap,
    )
