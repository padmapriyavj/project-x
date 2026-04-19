"""OpenAI-backed MCQ generation (OPENAI_API_KEY)."""

from __future__ import annotations

import json
import os
from typing import Any
from uuid import UUID

from openai import OpenAI

from intelligence.quiz.schemas import ChoiceItem, Difficulty, QuestionDraft


def _client() -> OpenAI:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=key)


def generate_mcq_batch(
    *,
    context_text: str,
    concept_specs: list[dict[str, Any]],
    allocations: list[tuple[str, Difficulty]],
    model: str = "gpt-4o-mini",
) -> list[QuestionDraft]:
    """
    ``concept_specs``: ``[{id, name, description}, ...]``
    ``allocations``: ordered list of (concept_id str, difficulty) per question index.
    """
    spec_lines = "\n".join(
        f"- {c['id']}: {c['name']} — {c.get('description') or ''}" for c in concept_specs
    )
    alloc_lines = "\n".join(
        f"{i + 1}. concept_id={cid} difficulty={diff}" for i, (cid, diff) in enumerate(allocations)
    )

    system = (
        "You write multiple-choice questions for university courses. "
        "Output ONLY valid JSON: an object with key \"questions\" whose value is an array. "
        "Each element must have: text (string), choices (array of {key, text} with keys A,B,C,D), "
        "correct_choice (one of A,B,C,D), concept_id (uuid string), difficulty (easy|medium|hard). "
        "Questions must match the concept and difficulty assigned for that index in order."
    )
    user = (
        f"Course material context (may be truncated):\n{context_text[:80_000]}\n\n"
        f"Concepts:\n{spec_lines}\n\n"
        f"Required question sequence ({len(allocations)} questions):\n{alloc_lines}\n"
        "Return {\"questions\": [ ... ]} with exactly one object per required line, in order."
    )

    resp = _client().chat.completions.create(
        model=model,
        temperature=0.4,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
    )
    raw = resp.choices[0].message.content or "{}"
    data = json.loads(raw)
    arr = data.get("questions")
    if not isinstance(arr, list) or len(arr) != len(allocations):
        raise ValueError("Model returned wrong number of questions")

    out: list[QuestionDraft] = []
    for i, item in enumerate(arr):
        cid_req, diff_req = allocations[i]
        chs = item.get("choices") or []
        choices = [
            ChoiceItem(key=str(c["key"]).strip().upper()[:1], text=str(c["text"])) for c in chs
        ]
        cc = str(item.get("correct_choice", "A")).strip().upper()[:1]
        out.append(
            QuestionDraft(
                text=str(item["text"]),
                choices=choices,
                correct_choice=cc,
                concept_id=UUID(cid_req),
                difficulty=diff_req,
            )
        )
        keys = {c.key for c in out[-1].choices}
        if keys != {"A", "B", "C", "D"}:
            raise ValueError("Each question must have choices A–D")
        if out[-1].correct_choice not in keys:
            raise ValueError("correct_choice must match a choice key")
    return out


def regenerate_single_mcq(
    *,
    context_text: str,
    concept_specs: list[dict[str, Any]],
    concept_id: str,
    difficulty: Difficulty,
    model: str = "gpt-4o-mini",
) -> QuestionDraft:
    return generate_mcq_batch(
        context_text=context_text,
        concept_specs=concept_specs,
        allocations=[(concept_id, difficulty)],
        model=model,
    )[0]


def build_generation_metadata(model: str, seed: str | None = None) -> dict[str, Any]:
    return {"model": model, "prompt_version": "quiz_v1", "seed": seed}
