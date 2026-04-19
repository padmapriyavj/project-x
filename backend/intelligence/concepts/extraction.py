"""OpenAI: extract concepts from course + lesson context and material text."""

from __future__ import annotations

import json
import os
from typing import Any

from openai import OpenAI
from pydantic import BaseModel, Field


class _ConceptOut(BaseModel):
    name: str = Field(max_length=200)
    description: str = Field(default="")


class _ConceptsPayload(BaseModel):
    concepts: list[_ConceptOut]


def _client() -> OpenAI:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=key)


def extract_concepts_from_text(
    *,
    course_name: str,
    lesson_title: str,
    material_text: str,
    model: str = "gpt-4o-mini",
) -> list[dict[str, str]]:
    """
    Returns list of ``{"name": str, "description": str}`` (typically 4–8 items per PRD §7.4).
    """
    system = (
        "You are an expert curriculum analyst. Given course context and instructional text, "
        "extract distinct important concepts students must learn. "
        "Output ONLY valid JSON: {\"concepts\": [{\"name\": string, \"description\": string}, ...]}. "
        "Use 4–8 concepts unless the text is very short. Names are concise; descriptions are 1–3 sentences."
    )
    user = (
        f"Course: {course_name}\n"
        f"Lesson title: {lesson_title}\n\n"
        f"Material text:\n{material_text[:95_000]}\n"
    )

    resp = _client().chat.completions.create(
        model=model,
        temperature=0.3,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
    )
    raw = resp.choices[0].message.content or "{}"
    data = json.loads(raw)
    payload = _ConceptsPayload.model_validate(data)
    out: list[dict[str, str]] = []
    for c in payload.concepts:
        name = c.name.strip()[:200]
        if not name:
            continue
        out.append({"name": name, "description": (c.description or "").strip()})
    if len(out) < 1:
        raise ValueError("Model returned no concepts")
    return out
