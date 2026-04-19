"""Load material chunk text for lessons (PRD: knowledge base for quiz generation)."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from intelligence.betcha.client import get_supabase


def load_chunk_text_for_lessons(lesson_ids: list[UUID], max_chars: int = 120_000) -> str:
    """
    Concatenate chunk text referenced by each lesson's ``sources`` JSON
    (``[{material_id, start, end}]`` page ranges per PRD §9).

    If ``intelligence.ingestion`` later exposes assembly, delegate there without changing callers.
    """
    sb = get_supabase()
    parts: list[str] = []

    for lid in lesson_ids:
        try:
            res = (
                sb.table("lessons")
                .select("sources,title")
                .eq("id", str(lid))
                .single()
                .execute()
            )
        except Exception:
            continue

        row: dict[str, Any] = res.data or {}
        sources = row.get("sources") or []
        if not isinstance(sources, list):
            continue

        for src in sources:
            if not isinstance(src, dict):
                continue
            mid = src.get("material_id")
            start = src.get("start")
            end = src.get("end")
            if mid is None or start is None or end is None:
                continue

            chunks = (
                sb.table("material_chunks")
                .select("text,location_start,location_end")
                .eq("material_id", str(mid))
                .execute()
            )
            for ch in chunks.data or []:
                ls = int(ch.get("location_start", 0))
                le = int(ch.get("location_end", 0))
                if le < int(start) or ls > int(end):
                    continue
                t = ch.get("text") or ""
                if t:
                    parts.append(t.strip())

    text = "\n\n".join(parts)
    if len(text) > max_chars:
        return text[:max_chars] + "\n\n[truncated]"
    return text
