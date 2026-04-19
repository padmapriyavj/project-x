"""Pydantic models for Betcha HTTP API (PRD §7.7, §7.9; PERSON_B quiz runtime)."""

from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

StakeCoins = Literal[50, 100, 200]


class PlaceBetchaBody(BaseModel):
    attempt_id: int = Field(description="Quiz attempt row to attach the wager to")
    multiplier: Literal["1x", "3x", "5x"]
    stake_coins: StakeCoins


class PlaceBetchaResponse(BaseModel):
    attempt_id: int
    multiplier: str
    stake_coins: int
    coins_balance_after: int


class FinalizeBetchaBody(BaseModel):
    """Pre-scored values from the quiz runner; scoring module supplies these at finalize time."""

    score_percent: Decimal = Field(ge=Decimal("0"), le=Decimal("100"))
    base_coins: int = Field(ge=0, description="Pre-Betcha coin pool for this attempt (PRD §7.7)")


class FinalizeBetchaResponse(BaseModel):
    attempt_id: int
    betcha_applied: bool
    payout_coins: int = None
    effective_factor: int = None
