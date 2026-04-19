"""Tempo scheduling + join hints (PRD §8.5, quizzes.scheduled_at)."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from intelligence.quiz.repository import (
    get_quiz_row,
    list_due_tempos,
    list_upcoming_tempos,
    update_quiz_scheduled_at,
)

_fired_quiz_ids: set[str] = set()


def schedule_tempo(*, quiz_id: UUID, scheduled_at: datetime) -> None:
    quiz = get_quiz_row(quiz_id)
    if str(quiz.get("type") or "") != "tempo":
        raise ValueError("Quiz must be type tempo")
    if str(quiz.get("status") or "") != "published":
        raise ValueError("Quiz must be published to schedule")
    iso = scheduled_at.astimezone(timezone.utc).isoformat()
    update_quiz_scheduled_at(quiz_id, iso)


def upcoming_for_student(*, limit: int = 30) -> list[dict]:
    return list_upcoming_tempos(limit=limit)


async def fire_due_tempos() -> int:
    """Emit ``tempo:fire`` for due quizzes once each (process memory). Returns emit count."""
    from engagement.tempo.broadcast import emit_tempo_fire

    due = list_due_tempos()
    n = 0
    for row in due:
        qid = str(row["id"])
        if qid in _fired_quiz_ids:
            continue
        _fired_quiz_ids.add(qid)
        await emit_tempo_fire(
            quiz_id=qid,
            course_id=str(row.get("course_id") or ""),
            scheduled_at=str(row.get("scheduled_at") or ""),
        )
        n += 1
    return n


def dev_fire_quiz(*, quiz_id: UUID) -> None:
    """Mark quiz as fired in-memory and emit (caller awaits broadcast)."""
    _fired_quiz_ids.add(str(quiz_id))


def join_hints(*, quiz_id: UUID) -> dict:
    """Stable socket room id for a class Tempo (aligns UI + server)."""
    rid = f"tempo:{quiz_id}"
    return {"quiz_id": quiz_id, "realtime_room_id": rid, "mode": "tempo"}
