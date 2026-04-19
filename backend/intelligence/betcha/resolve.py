"""Pure Betcha payout math (PRD §7.7). No I/O."""

from dataclasses import dataclass
from decimal import Decimal, ROUND_FLOOR
from typing import Literal

BetchaMultiplier = Literal["1x", "3x", "5x"]

ALLOWED_STAKES = frozenset({50, 100, 200})


@dataclass(frozen=True)
class BetchaResolution:
    """Result of applying Betcha rules at finalize time."""

    payout_coins: int
    effective_factor: int  # 1, 3, or 5
    met_70: bool
    met_90: bool


def validate_stake(stake_coins: int | None) -> None:
    if stake_coins is None:
        return
    if stake_coins not in ALLOWED_STAKES:
        raise ValueError("stake_coins must be one of 50, 100, 200")


def parse_multiplier(s: str) -> BetchaMultiplier:
    if s not in ("1x", "3x", "5x"):
        raise ValueError("multiplier must be one of 1x, 3x, 5x")
    return s  # type: ignore[return-value]


def _effective_factor(multiplier: BetchaMultiplier, score_percent: Decimal) -> int:
    sp = score_percent
    if multiplier == "1x":
        return 1
    if multiplier == "3x":
        return 3 if sp >= Decimal("70") else 1
    if multiplier == "5x":
        return 5 if sp >= Decimal("90") else 1
    raise ValueError(f"unknown multiplier: {multiplier}")


def resolve_betcha_payout(
    score_percent: Decimal,
    base_coins: int,
    multiplier: BetchaMultiplier,
) -> BetchaResolution:
    """
    ``score_percent`` is 0–100. ``base_coins`` is the pre-Betcha coin pool for the attempt (from scoring).

    Payout uses floor integer math: floor(base_coins * score_percent * factor / 100).
    """
    if base_coins < 0:
        raise ValueError("base_coins must be non-negative")
    if score_percent < 0 or score_percent > Decimal("100"):
        raise ValueError("score_percent must be between 0 and 100")

    met_70 = score_percent >= Decimal("70")
    met_90 = score_percent >= Decimal("90")
    factor = _effective_factor(multiplier, score_percent)

    # Integer floor: (base * score * factor) / 100
    num = Decimal(base_coins) * score_percent * Decimal(factor)
    den = Decimal(100)
    payout = int((num / den).to_integral_value(rounding=ROUND_FLOOR))

    return BetchaResolution(
        payout_coins=payout,
        effective_factor=factor,
        met_70=met_70,
        met_90=met_90,
    )
