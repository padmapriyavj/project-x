"""score_attempt — grade answers, coins, optional Betcha (PRD §7.6–§7.7)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any
from uuid import UUID

from intelligence.betcha.service import apply_betcha_resolution_to_attempt
from intelligence.quiz.repository import (
    get_attempt_row,
    get_quiz_row,
    get_user_coins,
    insert_answers,
    list_questions,
    mark_attempt_completed,
    update_attempt_scores,
    update_user_coins,
)
from intelligence.quiz.schemas import AnswerInput, ScoreAttemptResult


def _base_coins_for_quiz(quiz_type: str, correct: int, total: int) -> int:
    """PRD §7.9 stub: practice 10 per correct; tempo 50 per correct (time bonus omitted)."""
    if quiz_type == "tempo":
        return correct * 50
    return correct * 10


'''
Should check this implementation - Do we really need this
'''

def score_attempt(
    *,
    quiz_id: UUID,
    attempt_id: UUID,
    user_id: UUID,
    answers: list[AnswerInput],
) -> ScoreAttemptResult:
    """
    Persist answers, compute score, apply Betcha payout via ``intelligence.betcha.service`` when wager exists.
    """
    quiz = get_quiz_row(quiz_id)
    attempt = get_attempt_row(attempt_id)

    if str(attempt.get("user_id")) != str(user_id):
        raise ValueError("Attempt does not belong to user")
    if str(attempt.get("quiz_id")) != str(quiz_id):
        raise ValueError("Attempt does not match quiz")

    questions = list_questions(quiz_id)
    qmap: dict[str, dict[str, Any]] = {str(q["id"]): q for q in questions}
    total = len(questions)
    if total == 0:
        raise ValueError("Quiz has no questions")
    if {str(a.question_id) for a in answers} != set(qmap.keys()):
        raise ValueError("Must submit exactly one answer per question")

    rows: list[dict[str, Any]] = []
    correct = 0
    for a in answers:
        qid = str(a.question_id)
        q = qmap.get(qid)
        if q is None:
            raise ValueError(f"Unknown question_id {qid}")
        ok = str(q.get("correct_choice") or "").upper() == str(a.selected_choice).upper()
        if ok:
            correct += 1
        rows.append(
            {
                "question_id": qid,
                "selected_choice": a.selected_choice,
                "is_correct": ok,
                "time_taken_ms": a.time_taken_ms,
            }
        )

    insert_answers(attempt_id, rows)

    score_pct = (Decimal(correct) / Decimal(total) * Decimal("100")).quantize(Decimal("0.01"))
    qtype = str(quiz.get("type") or "practice")
    base_coins = _base_coins_for_quiz(qtype, correct, total)

    resolution = apply_betcha_resolution_to_attempt(
        user_id=user_id,
        attempt_id=attempt_id,
        score_percent=score_pct,
        base_coins=base_coins,
    )

    if resolution is None:
        new_bal = get_user_coins(user_id) + base_coins
        update_user_coins(user_id, new_bal)
        update_attempt_scores(attempt_id, score_pct=score_pct, coins_earned=base_coins, completed=True)
        return ScoreAttemptResult(
            quiz_id=quiz_id,
            attempt_id=attempt_id,
            score_pct=score_pct,
            correct_count=correct,
            total_questions=total,
            base_coins=base_coins,
            payout_coins=base_coins,
            betcha_applied=False,
        )

    mark_attempt_completed(attempt_id)
    return ScoreAttemptResult(
        quiz_id=quiz_id,
        attempt_id=attempt_id,
        score_pct=score_pct,
        correct_count=correct,
        total_questions=total,
        base_coins=base_coins,
        payout_coins=resolution.payout_coins,
        betcha_effective_factor=resolution.effective_factor,
        betcha_applied=True,
    )
