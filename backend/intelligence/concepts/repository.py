"""Supabase persistence for lessons (context fields) and concepts."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from postgrest.exceptions import APIError

from intelligence.betcha.client import get_supabase


def get_lesson(lesson_id: UUID) -> dict[str, Any] | None:
    sb = get_supabase()
    try:
        res = sb.table("lessons").select("*").eq("id", str(lesson_id)).single().execute()
        return dict(res.data)
    except APIError:
        return None


def update_lesson_context(
    lesson_id: UUID,
    *,
    course_id: UUID,
    title: str,
    material_id: UUID,
) -> None:
    sb = get_supabase()
    sb.table("lessons").update(
        {
            "course_id": str(course_id),
            "title": title,
            "material_id": str(material_id),
        }
    ).eq("id", str(lesson_id)).execute()


def get_course_name(course_id: UUID) -> str:
    sb = get_supabase()
    try:
        res = sb.table("courses").select("name").eq("id", str(course_id)).single().execute()
        return str(res.data.get("name") or "Course")
    except APIError:
        return "Course"


def delete_concepts_for_lesson(lesson_id: UUID) -> None:
    sb = get_supabase()
    sb.table("concepts").delete().eq("lesson_id", str(lesson_id)).execute()


def insert_concepts(lesson_id: UUID, items: list[dict[str, str]]) -> list[dict[str, Any]]:
    sb = get_supabase()
    payload = [
        {
            "lesson_id": str(lesson_id),
            "name": it["name"],
            "description": it.get("description") or "",
        }
        for it in items
    ]
    res = sb.table("concepts").insert(payload).execute()
    return [dict(r) for r in (res.data or [])]


def list_concepts(lesson_id: UUID) -> list[dict[str, Any]]:
    sb = get_supabase()
    res = (
        sb.table("concepts")
        .select("id,lesson_id,name,description")
        .eq("lesson_id", str(lesson_id))
        .order("name")
        .execute()
    )
    return [dict(r) for r in (res.data or [])]
