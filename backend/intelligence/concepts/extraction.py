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


# OpenAI strict json_schema: every object must list all properties in "required", additionalProperties: false
_CONCEPTS_JSON_SCHEMA: dict[str, Any] = {
    "name": "concepts_extraction",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "concepts": {
                "type": "array",
                "description": "4–8 learnable concepts from the material (fewer if text is very short).",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Short concept title, max 200 characters.",
                        },
                        "description": {
                            "type": "string",
                            "description": "1–3 sentences explaining the concept for students.",
                        },
                    },
                    "required": ["name", "description"],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["concepts"],
        "additionalProperties": False,
    },
}

_CONCEPTS_EXAMPLE_BLOCK = """
## Example output shape (structure only — write concepts from the MATERIAL above, not this example)

```json
{
  "concepts": [
    {
      "name": "Asymptotic notation",
      "description": "Big-O describes an upper bound on growth rate of a function as input size increases."
    },
    {
      "name": "Recurrence relations",
      "description": "Equations that define a sequence recursively; used to analyze divide-and-conquer algorithms."
    }
  ]
}
```

Return a single JSON object matching this exact shape. Use "concepts" as the only top-level key.
"""


def _client() -> OpenAI:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=key)


def _concepts_response_format() -> dict[str, Any]:
    return {"type": "json_schema", "json_schema": _CONCEPTS_JSON_SCHEMA}


def extract_concepts_from_text(
    *,
    course_name: str,
    lesson_title: str,
    material_text: str,
    model: str = "gpt-4o-mini",
) -> list[dict[str, str]]:
    """
    Returns list of ``{"name": str, "description": str}`` (typically 4–8 items per PRD §7.4).

    Uses OpenAI structured outputs (json_schema) so parsing matches what the API / frontend expect.
    """
    system = (
        "You are an expert curriculum analyst. Given course context and instructional text, "
        "extract distinct important concepts students must learn. "
        "Respond with JSON only, matching the provided schema. "
        "Produce 4–8 concepts unless the material is too short (then use fewer). "
        "Names are concise; descriptions are 1–3 sentences, classroom-appropriate."
    )
    user = (
        _CONCEPTS_EXAMPLE_BLOCK
        + "\n---\n"
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
        response_format=_concepts_response_format(),
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
