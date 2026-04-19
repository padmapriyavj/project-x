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


def _question_item_schema() -> dict[str, Any]:
    """One MCQ object; keys must match DB / frontend expectations."""
    return {
        "type": "object",
        "properties": {
            "text": {
                "type": "string",
                "description": "The question stem shown to the student.",
            },
            "choices": {
                "type": "array",
                "description": "Exactly four options with keys A, B, C, D.",
                "minItems": 4,
                "maxItems": 4,
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "description": "Must be A, B, C, or D.",
                            "enum": ["A", "B", "C", "D"],
                        },
                        "text": {"type": "string", "description": "Answer option text."},
                    },
                    "required": ["key", "text"],
                    "additionalProperties": False,
                },
            },
            "correct_choice": {
                "type": "string",
                "description": "The single correct letter.",
                "enum": ["A", "B", "C", "D"],
            },
            "concept_id": {
                "type": "string",
                "description": "UUID string matching the concept for this question.",
            },
            "difficulty": {
                "type": "string",
                "enum": ["easy", "medium", "hard"],
            },
        },
        "required": ["text", "choices", "correct_choice", "concept_id", "difficulty"],
        "additionalProperties": False,
    }


def _quiz_questions_json_schema(num_questions: int) -> dict[str, Any]:
    if num_questions < 1:
        raise ValueError("num_questions must be >= 1")
    return {
        "name": "quiz_mcq_batch",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "questions": {
                    "type": "array",
                    "description": f"Exactly {num_questions} questions in the same order as the required sequence.",
                    "minItems": num_questions,
                    "maxItems": num_questions,
                    "items": _question_item_schema(),
                }
            },
            "required": ["questions"],
            "additionalProperties": False,
        },
    }


_QUIZ_EXAMPLE_BLOCK = """
## Example output shape (structure only — questions must follow YOUR required sequence below)

```json
{
  "questions": [
    {
      "text": "What is the time complexity of binary search on a sorted array of n elements?",
      "choices": [
        {"key": "A", "text": "O(n)"},
        {"key": "B", "text": "O(log n)"},
        {"key": "C", "text": "O(n log n)"},
        {"key": "D", "text": "O(1)"}
      ],
      "correct_choice": "B",
      "concept_id": "00000000-0000-0000-0000-000000000000",
      "difficulty": "medium"
    }
  ]
}
```

Rules:
- Top-level key must be exactly `"questions"` (array).
- Each question has exactly four `choices` with keys A, B, C, D (each key once).
- `correct_choice` must equal one of the choice keys.
- `concept_id` must be the UUID string from the assignment line for that row.
- `difficulty` must be exactly `"easy"`, `"medium"`, or `"hard"` as assigned.
"""


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
    n = len(allocations)
    spec_lines = "\n".join(
        f"- {c['id']}: {c['name']} — {c.get('description') or ''}" for c in concept_specs
    )
    alloc_lines = "\n".join(
        f"{i + 1}. concept_id={cid} difficulty={diff}" for i, (cid, diff) in enumerate(allocations)
    )

    system = (
        "You write multiple-choice questions for university courses. "
        "Follow the JSON schema exactly. Each question must align with the concept_id and difficulty "
        "given for that line number. Ground stems in the course material context when possible."
    )
    user = (
        _QUIZ_EXAMPLE_BLOCK
        + "\n---\n"
        f"Course material context (may be truncated):\n{context_text[:80_000]}\n\n"
        f"Concepts:\n{spec_lines}\n\n"
        f"Required question sequence — produce EXACTLY {n} questions in this order (line 1 = questions[0], etc.):\n"
        f"{alloc_lines}\n"
    )

    resp = _client().chat.completions.create(
        model=model,
        temperature=0.4,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_schema", "json_schema": _quiz_questions_json_schema(n)},
    )
    raw = resp.choices[0].message.content or "{}"
    data = json.loads(raw)
    arr = data.get("questions")
    if not isinstance(arr, list) or len(arr) != n:
        raise ValueError(f"Model returned wrong number of questions (expected {n}, got {len(arr) if isinstance(arr, list) else 'invalid'})")

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
    return {"model": model, "prompt_version": "quiz_v2_structured", "seed": seed}
