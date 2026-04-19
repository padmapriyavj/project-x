"""Betcha persistence and resolution using the Supabase client (PRD §7.7, §7.9; Person A schema)."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from postgrest.exceptions import APIError

from intelligence.betcha.client import get_supabase
from intelligence.betcha.resolve import BetchaResolution, parse_multiplier, resolve_betcha_payout


def _uuid_str(u: UUID) -> str:
    return str(u)


def place_betcha_wager(
    *,
    user_id: UUID,
    quiz_id: UUID,
    attempt_id: UUID,
    multiplier: str,
    stake_coins: int,
) -> int:
    """
    Deduct stake and record wager on ``quiz_attempts``. Returns new ``users.coins``.

    Uses compare-and-swap on ``users.coins`` to avoid dropping below zero under concurrency.
    """
    parse_multiplier(multiplier)
    sb = get_supabase()

    try:
        att = (
            sb.table("quiz_attempts")
            .select("id,user_id,quiz_id,completed_at,betcha_placed_at,betcha_locked")
            .eq("id", _uuid_str(attempt_id))
            .single()
            .execute()
        )
    except APIError as e:
        raise ValueError("Quiz attempt not found") from e

    row: dict[str, Any] = att.data
    if UUID(str(row["user_id"])) != user_id:
        raise ValueError("Attempt does not belong to the current user")
    if UUID(str(row["quiz_id"])) != quiz_id:
        raise ValueError("Attempt does not match this quiz")
    if row.get("completed_at") is not None:
        raise ValueError("Attempt is already completed")
    if row.get("betcha_placed_at") is not None:
        raise ValueError("Betcha wager already placed")
    if row.get("betcha_locked"):
        raise ValueError("Betcha is locked for this attempt")

    has_ans = (
        sb.table("answers")
        .select("id")
        .eq("attempt_id", _uuid_str(attempt_id))
        .limit(1)
        .execute()
    )
    if has_ans.data and len(has_ans.data) > 0:
        raise ValueError("Betcha cannot be changed after answers exist")

    try:
        usr = sb.table("users").select("coins").eq("id", _uuid_str(user_id)).single().execute()
    except APIError as e:
        raise ValueError("User not found") from e

    old_coins = int(usr.data["coins"])
    if old_coins < stake_coins:
        raise ValueError("Insufficient coins for this stake")

    new_coins = old_coins - stake_coins
    cas = (
        sb.table("users")
        .update({"coins": new_coins})
        .eq("id", _uuid_str(user_id))
        .eq("coins", old_coins)
        .execute()
    )
    if not cas.data:
        raise ValueError("Could not update balance (try again)")

    placed_at = datetime.now(timezone.utc).isoformat()
    
    try:
        sb.table("quiz_attempts").update(
            {
                "betcha_multiplier": multiplier,
                "betcha_stake_coins": stake_coins,
                "betcha_placed_at": placed_at,
            }
        ).eq("id", _uuid_str(attempt_id)).execute()
    except APIError:
        sb.table("users").update({"coins": old_coins}).eq("id", _uuid_str(user_id)).eq("coins", new_coins).execute()
        raise

    return new_coins


def apply_betcha_resolution_to_attempt(
    *,
    user_id: UUID,
    attempt_id: UUID,
    score_percent: Decimal,
    base_coins: int,
) -> BetchaResolution:
    """
    If a wager exists: credit payout, set ``betcha_resolved``, ``coins_earned``, ``score_pct``.

    If no wager: returns ``None`` (no coin or attempt updates here).
    """
    sb = get_supabase()

    try:
        att = (
            sb.table("quiz_attempts")
            .select("id,user_id,betcha_placed_at,betcha_multiplier,betcha_resolved")
            .eq("id", _uuid_str(attempt_id))
            .single()
            .execute()
        )
    except APIError as e:
        raise ValueError("Quiz attempt not found") from e

    row: dict[str, Any] = att.data
    if UUID(str(row["user_id"])) != user_id:
        raise ValueError("Attempt does not belong to the current user")
    if row.get("betcha_placed_at") is None:
        return None
    if row.get("betcha_resolved"):
        raise ValueError("Betcha already resolved for this attempt")

    mult = parse_multiplier(str(row["betcha_multiplier"]))
    resolution = resolve_betcha_payout(score_percent, base_coins, mult)
    payout = resolution.payout_coins

    try:
        usr = sb.table("users").select("coins").eq("id", _uuid_str(user_id)).single().execute()
    except APIError as e:
        raise ValueError("User not found") from e

    old_coins = int(usr.data["coins"])
    new_coins = old_coins + payout
    cas = (
        sb.table("users")
        .update({"coins": new_coins})
        .eq("id", _uuid_str(user_id))
        .eq("coins", old_coins)
        .execute()
    )
    if not cas.data:
        raise ValueError("Could not credit coins (try again)")

    score_val = float(score_percent)
    try:
        sb.table("quiz_attempts").update(
            {
                "betcha_resolved": True,
                "coins_earned": payout,
                "score_pct": score_val,
            }
        ).eq("id", _uuid_str(attempt_id)).execute()
    except APIError:
        sb.table("users").update({"coins": old_coins}).eq("id", _uuid_str(user_id)).eq("coins", new_coins).execute()
        raise

    return resolution
