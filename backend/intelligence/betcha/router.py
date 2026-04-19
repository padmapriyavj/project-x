"""FastAPI routes for Betcha (PRD §10 quiz runtime; PERSON_B)."""

from fastapi import APIRouter, Depends, HTTPException, status

from intelligence.betcha.deps import get_current_user_id
from intelligence.betcha.schemas import (
    FinalizeBetchaBody,
    FinalizeBetchaResponse,
    PlaceBetchaBody,
    PlaceBetchaResponse,
)
from intelligence.betcha.service import apply_betcha_resolution_to_attempt, place_betcha_wager

router = APIRouter(prefix="/api/v1", tags=["Betcha"])


@router.post(
    "/quizzes/{quiz_id}/betcha",
    response_model=PlaceBetchaResponse,
    summary="Place Betcha wager (upfront stake)",
)
async def post_quiz_betcha(
    quiz_id: int,
    body: PlaceBetchaBody,
    user_id: int = Depends(get_current_user_id),
) -> PlaceBetchaResponse:
    try:
        balance = place_betcha_wager(
            user_id=user_id,
            quiz_id=quiz_id,
            attempt_id=body.attempt_id,
            multiplier=body.multiplier,
            stake_coins=body.stake_coins,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e

    return PlaceBetchaResponse(
        attempt_id=body.attempt_id,
        multiplier=body.multiplier,
        stake_coins=body.stake_coins,
        coins_balance_after=balance,
    )


@router.post(
    "/quiz-attempts/{attempt_id}/finalize",
    response_model=FinalizeBetchaResponse,
    summary="Finalize attempt Betcha resolution",
    description=(
        "Apply PRD §7.7 payout when a wager exists. Pass ``score_percent`` and ``base_coins`` from the quiz "
        "scoring step. If no wager was placed, ``betcha_applied`` is false."
    ),
)
async def post_quiz_attempt_finalize(
    attempt_id: int,
    body: FinalizeBetchaBody,
    user_id: int = Depends(get_current_user_id),
) -> FinalizeBetchaResponse:
    try:
        resolution = apply_betcha_resolution_to_attempt(
            user_id=user_id,
            attempt_id=attempt_id,
            score_percent=body.score_percent,
            base_coins=body.base_coins,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e

    if resolution is None:
        return FinalizeBetchaResponse(attempt_id=attempt_id, betcha_applied=False)

    return FinalizeBetchaResponse(
        attempt_id=attempt_id,
        betcha_applied=True,
        payout_coins=resolution.payout_coins,
        effective_factor=resolution.effective_factor,
    )
