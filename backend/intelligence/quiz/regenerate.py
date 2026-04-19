"""regenerate_question(question_id, config) — single question (PRD §7.6)."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from intelligence.quiz.chunk_source import load_chunk_text_for_lessons
from intelligence.quiz.openai_client import build_generation_metadata, regenerate_single_mcq
from intelligence.quiz.repository import (
    fetch_concepts_for_lessons,
    get_question_row,
    get_quiz_row,
    update_question_row,
)
from intelligence.quiz.schemas import QuizGenerationConfig


def regenerate_question(
    question_id: UUID,
    config_override: QuizGenerationConfig | None = None,
) -> dict[str, Any]:
    """
    Regenerate one question using the quiz's stored ``config`` snapshot unless ``config_override`` is set.
    """
    qrow = get_question_row(question_id)
    quiz = get_quiz_row(UUID(str(qrow["quiz_id"])))

    raw_cfg = quiz.get("config")
    if not raw_cfg:
        raise ValueError("Quiz has no config snapshot")

    cfg = config_override or QuizGenerationConfig.model_validate(raw_cfg)
    lesson_ids = cfg.lesson_ids

    concepts_rows = fetch_concepts_for_lessons(lesson_ids)
    concept_id = str(qrow.get("concept_id"))
    spec_ids = {str(r["id"]) for r in concepts_rows}
    if concept_id not in spec_ids:
        raise ValueError("Question concept_id is not in lesson concepts")

    concept_specs = [
        {"id": str(r["id"]), "name": r.get("name") or "", "description": r.get("description") or ""}
        for r in concepts_rows
        if str(r["id"]) == concept_id
    ]

    context = load_chunk_text_for_lessons(lesson_ids)
    if not context.strip():
        context = "(No material text for these lessons.)"

    diff = str(qrow.get("difficulty") or "medium").lower()
    if diff not in ("easy", "medium", "hard"):
        diff = "medium"

    draft = regenerate_single_mcq(
        context_text=context,
        concept_specs=concept_specs,
        concept_id=concept_id,
        difficulty=diff,  # type: ignore[arg-type]
    )

    meta = build_generation_metadata("gpt-4o-mini")
    update_question_row(
        question_id,
        {
            "text": draft.text,
            "choices": [c.model_dump() for c in draft.choices],
            "correct_choice": draft.correct_choice,
            "concept_id": str(draft.concept_id),
            "difficulty": draft.difficulty,
            "generation_metadata": meta,
            "approved": False,
        },
    )

    return get_question_row(question_id)
