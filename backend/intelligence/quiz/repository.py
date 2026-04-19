"""Supabase persistence for quizzes and questions."""

from __future__ import annotations

from decimal import Decimal
from typing import Any
from uuid import UUID

from intelligence.betcha.client import get_supabase


def insert_quiz(
    *,
    course_id: UUID,
    created_by: UUID,
    config: dict[str, Any],
    quiz_type: str,
    lesson_id: UUID | None,
    status: str,
    duration_sec: int | None,
    scheduled_at: str | None = None,
) -> UUID:
    sb = get_supabase()
    row = {
        "type": quiz_type,
        "course_id": str(course_id),
        "created_by": str(created_by),
        "config": config,
        "status": status,
        "duration_sec": duration_sec,
    }
    if lesson_id is not None:
        row["lesson_id"] = str(lesson_id)
    if scheduled_at is not None:
        row["scheduled_at"] = scheduled_at
    res = sb.table("quizzes").insert(row).execute()
    if not res.data:
        raise RuntimeError("Failed to insert quiz")
    return UUID(str(res.data[0]["id"]))


def insert_questions(quiz_id: UUID, rows: list[dict[str, Any]]) -> list[UUID]:
    sb = get_supabase()
    payload = [{**r, "quiz_id": str(quiz_id)} for r in rows]
    res = sb.table("questions").insert(payload).execute()
    return [UUID(str(r["id"])) for r in (res.data or [])]


def get_quiz_row(quiz_id: UUID) -> dict[str, Any]:
    sb = get_supabase()
    res = sb.table("quizzes").select("*").eq("id", str(quiz_id)).single().execute()
    return dict(res.data)


def list_questions(quiz_id: UUID) -> list[dict[str, Any]]:
    sb = get_supabase()
    res = (
        sb.table("questions")
        .select("*")
        .eq("quiz_id", str(quiz_id))
        .order("question_order")
        .execute()
    )
    return list(res.data or [])


def get_question_row(question_id: UUID) -> dict[str, Any]:
    sb = get_supabase()
    res = sb.table("questions").select("*").eq("id", str(question_id)).single().execute()
    return dict(res.data)


def update_question_row(question_id: UUID, fields: dict[str, Any]) -> None:
    sb = get_supabase()
    sb.table("questions").update(fields).eq("id", str(question_id)).execute()


def update_quiz_status(quiz_id: UUID, status: str) -> None:
    sb = get_supabase()
    sb.table("quizzes").update({"status": status}).eq("id", str(quiz_id)).execute()


def fetch_concepts_for_lessons(lesson_ids: list[UUID]) -> list[dict[str, Any]]:
    sb = get_supabase()
    out: list[dict[str, Any]] = []
    for lid in lesson_ids:
        res = sb.table("concepts").select("id,lesson_id,name,description").eq("lesson_id", str(lid)).execute()
        for r in res.data or []:
            out.append(dict(r))
    return out


def insert_quiz_attempt_stub(
    *,
    quiz_id: UUID,
    user_id: UUID,
    mode: str = "solo",
    room_id: str | None = None,
) -> UUID:
    """Create an attempt row for scoring (minimal fields)."""
    sb = get_supabase()
    from datetime import datetime, timezone

    row = {
        "quiz_id": str(quiz_id),
        "user_id": str(user_id),
        "mode": mode,
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    if room_id is not None:
        row["room_id"] = room_id
    res = sb.table("quiz_attempts").insert(row).execute()
    if not res.data:
        raise RuntimeError("Failed to insert quiz_attempt")
    return UUID(str(res.data[0]["id"]))


def insert_answers(attempt_id: UUID, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    sb = get_supabase()
    payload = [{**r, "attempt_id": str(attempt_id)} for r in rows]
    sb.table("answers").insert(payload).execute()


def update_attempt_scores(
    attempt_id: UUID,
    *,
    score_pct: Decimal,
    coins_earned: int,
    completed: bool = True,
) -> None:
    sb = get_supabase()
    from datetime import datetime, timezone

    fields: dict[str, Any] = {
        "score_pct": float(score_pct),
        "coins_earned": coins_earned,
    }
    if completed:
        fields["completed_at"] = datetime.now(timezone.utc).isoformat()
    sb.table("quiz_attempts").update(fields).eq("id", str(attempt_id)).execute()


def mark_attempt_completed(attempt_id: UUID) -> None:
    from datetime import datetime, timezone

    sb = get_supabase()
    sb.table("quiz_attempts").update(
        {"completed_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", str(attempt_id)).execute()


def get_attempt_row(attempt_id: UUID) -> dict[str, Any]:
    sb = get_supabase()
    res = sb.table("quiz_attempts").select("*").eq("id", str(attempt_id)).single().execute()
    return dict(res.data)


def attempt_has_answers(attempt_id: UUID) -> bool:
    sb = get_supabase()
    res = (
        sb.table("answers")
        .select("id")
        .eq("attempt_id", str(attempt_id))
        .limit(1)
        .execute()
    )
    return bool(res.data and len(res.data) > 0)


def update_user_coins(user_id: UUID, new_balance: int) -> None:
    sb = get_supabase()
    sb.table("users").update({"coins": new_balance}).eq("id", str(user_id)).execute()


def get_user_coins(user_id: UUID) -> int:
    sb = get_supabase()
    res = sb.table("users").select("coins").eq("id", str(user_id)).single().execute()
    return int(res.data["coins"])


def list_upcoming_tempos(*, limit: int = 50) -> list[dict[str, Any]]:
    """Published tempo quizzes with ``scheduled_at`` in the future (UTC)."""
    from datetime import datetime, timezone

    sb = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    res = (
        sb.table("quizzes")
        .select("id,course_id,type,status,scheduled_at,lesson_id,created_by,duration_sec,config")
        .eq("type", "tempo")
        .eq("status", "published")
        .execute()
    )
    rows = [r for r in (res.data or []) if r.get("scheduled_at") and str(r["scheduled_at"]) > now]
    rows.sort(key=lambda x: str(x.get("scheduled_at") or ""))
    return rows[:limit]


def list_due_tempos(*, limit: int = 100) -> list[dict[str, Any]]:
    """Published tempo quizzes that should fire (``scheduled_at`` <= now)."""
    from datetime import datetime, timezone

    sb = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    res = (
        sb.table("quizzes")
        .select("id,course_id,type,status,scheduled_at,lesson_id,created_by,duration_sec,config")
        .eq("type", "tempo")
        .eq("status", "published")
        .execute()
    )
    rows = [r for r in (res.data or []) if r.get("scheduled_at") and str(r["scheduled_at"]) <= now]
    return rows[:limit]


def update_quiz_scheduled_at(quiz_id: UUID, scheduled_at: str | None) -> None:
    sb = get_supabase()
    sb.table("quizzes").update({"scheduled_at": scheduled_at}).eq("id", str(quiz_id)).execute()


def update_attempt_room_id(attempt_id: UUID, room_id: str) -> None:
    sb = get_supabase()
    sb.table("quiz_attempts").update({"room_id": room_id}).eq("id", str(attempt_id)).execute()
