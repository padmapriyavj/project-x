"""Concept extraction HTTP API (PERSON_B §6 — Concepts & quiz generation)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from intelligence.betcha.deps import get_current_user_id
from intelligence.concepts.schemas import (
    ConceptGenerateBody,
    ConceptGenerateResponse,
    ConceptItem,
    ConceptListResponse,
)
from intelligence.concepts.service import generate_concepts_for_lesson, list_concepts_for_lesson

router = APIRouter(prefix="/api/v1", tags=["Concepts"])


@router.post(
    "/lessons/{lesson_id}/concepts/generate",
    response_model=ConceptGenerateResponse,
    summary="Run LLM concept extraction for a lesson",
    description=(
        "Updates the lesson with ``course_id``, ``title``, and ``material_id``. Text is resolved via "
        "``intelligence.ingestion`` (materials row / ``metadata``), then OpenAI extracts concepts; "
        "existing concepts for the lesson are replaced."
    ),
)
async def post_generate_concepts(
    lesson_id: UUID,
    _user_id: UUID = Depends(get_current_user_id),
) -> ConceptGenerateResponse:
    try:
        stored = generate_concepts_for_lesson(lesson_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e

    items = [
        ConceptItem(
            id=UUID(str(r["id"])),
            lesson_id=UUID(str(r["lesson_id"])),
            name=str(r["name"]),
            description=r.get("description"),
        )
        for r in stored
    ]
    return ConceptGenerateResponse(lesson_id=lesson_id, concepts=items, replaced=True)


@router.get(
    "/lessons/{lesson_id}/concepts",
    response_model=ConceptListResponse,
    summary="List concepts for a lesson",
    description="Used by professor (Tempo) and student flows (practice / duel) to read stored concepts.",
)
async def get_lesson_concepts(lesson_id: UUID) -> ConceptListResponse:
    try:
        rows = list_concepts_for_lesson(lesson_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e

    items = [
        ConceptItem(
            id=UUID(str(r["id"])),
            lesson_id=UUID(str(r["lesson_id"])),
            name=str(r["name"]),
            description=r.get("description"),
        )
        for r in rows
    ]
    return ConceptListResponse(lesson_id=lesson_id, concepts=items)
