"""Betcha: confidence wagering (PRD §7.7–§7.9). Import ``intelligence.betcha.router`` for FastAPI routes."""

from intelligence.betcha.resolve import (
    ALLOWED_STAKES,
    BetchaMultiplier,
    BetchaResolution,
    parse_multiplier,
    resolve_betcha_payout,
    validate_stake,
)
from intelligence.betcha.service import apply_betcha_resolution_to_attempt, place_betcha_wager

__all__ = [
    "ALLOWED_STAKES",
    "BetchaMultiplier",
    "BetchaResolution",
    "apply_betcha_resolution_to_attempt",
    "parse_multiplier",
    "place_betcha_wager",
    "resolve_betcha_payout",
    "validate_stake",
]
