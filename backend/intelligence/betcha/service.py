"""Betcha persistence and resolution using the Supabase client (PRD §7.7, §7.9; Person A schema)."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from postgrest.exceptions import APIError

from intelligence.betcha.client import get_supabase
from intelligence.betcha.resolve import BetchaResolution, parse_multiplier, resolve_betcha_payout


def _wager_recorded(row: dict[str, Any]) -> bool:
    """True if a Betcha wager was persisted (full schema or multiplier-only fallback)."""
    if row.get("betcha_placed_at") is not None:
        return True
    m = row.get("betcha_multiplier")
    return m is not None and str(m).strip() != ""


def _is_unknown_column_error(err: APIError) -> bool:
    """PostgREST rejects UPDATE payload keys that are not real columns (PGRST204)."""
    if err.code == "PGRST204":
        return True
    msg = (err.message or "").lower()
    return "schema cache" in msg and "column" in msg


def place_betcha_wager(
    *,
    user_id: int,
    quiz_id: int,
    attempt_id: int,
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
        att = sb.table("quiz_attempts").select("*").eq("id", int(attempt_id)).single().execute()
    except APIError as e:
        raise ValueError("Quiz attempt not found") from e

    row: dict[str, Any] = att.data
    if int(row["user_id"]) != int(user_id):
        raise ValueError("Attempt does not belong to the current user")
    if int(row["quiz_id"]) != int(quiz_id):
        raise ValueError("Attempt does not match this quiz")
    if row.get("completed_at") is not None:
        raise ValueError("Attempt is already completed")
    if row.get("betcha_locked"):
        raise ValueError("Betcha is locked for this attempt")

    has_ans = (
        sb.table("answers")
        .select("id")
        .eq("attempt_id", int(attempt_id))
        .limit(1)
        .execute()
    )
    if has_ans.data and len(has_ans.data) > 0:
        raise ValueError("Betcha cannot be changed after answers exist")

    try:
        usr = sb.table("users").select("coins").eq("id", int(user_id)).single().execute()
    except APIError as e:
        raise ValueError("User not found") from e

    old_coins = int(usr.data["coins"])
    if old_coins < stake_coins:
        raise ValueError("Insufficient coins for this stake")

    new_coins = old_coins - stake_coins
    cas = (
        sb.table("users")
        .update({"coins": new_coins})
        .eq("id", int(user_id))
        .eq("coins", old_coins)
        .execute()
    )
    if not cas.data:
        raise ValueError("Could not update balance (try again)")

    placed_at = datetime.now(timezone.utc).isoformat()
    full_payload: dict[str, Any] = {
        "betcha_multiplier": multiplier,
        "betcha_stake_coins": stake_coins,
        "betcha_placed_at": placed_at,
    }
    minimal_payload: dict[str, Any] = {"betcha_multiplier": multiplier}

    try:
        sb.table("quiz_attempts").update(full_payload).eq("id", int(attempt_id)).execute()
    except APIError as first:
        if not _is_unknown_column_error(first):
            sb.table("users").update({"coins": old_coins}).eq("id", int(user_id)).eq("coins", new_coins).execute()
            raise
        try:
            sb.table("quiz_attempts").update(minimal_payload).eq("id", int(attempt_id)).execute()
        except APIError:
            sb.table("users").update({"coins": old_coins}).eq("id", int(user_id)).eq("coins", new_coins).execute()
            raise

    return new_coins


def apply_betcha_resolution_to_attempt(
    *,
    user_id: int,
    attempt_id: int,
    score_percent: Decimal,
    base_coins: int,
) -> BetchaResolution | None:
    """
    If a wager exists: credit payout, set ``betcha_resolved``, ``coins_earned``, ``score_pct``.

    If no wager: returns ``None`` (no coin or attempt updates here).
    """
    sb = get_supabase()

    try:
        att = sb.table("quiz_attempts").select("*").eq("id", int(attempt_id)).single().execute()
    except APIError as e:
        raise ValueError("Quiz attempt not found") from e

    row: dict[str, Any] = att.data
    if int(row["user_id"]) != int(user_id):
        raise ValueError("Attempt does not belong to the current user")
    if not _wager_recorded(row):
        return None
    if row.get("betcha_resolved"):
        raise ValueError("Betcha already resolved for this attempt")

    mult = parse_multiplier(str(row["betcha_multiplier"]))
    resolution = resolve_betcha_payout(score_percent, base_coins, mult)
    payout = resolution.payout_coins

    try:
        usr = sb.table("users").select("coins").eq("id", int(user_id)).single().execute()
    except APIError as e:
        raise ValueError("User not found") from e

    old_coins = int(usr.data["coins"])
    new_coins = old_coins + payout
    cas = (
        sb.table("users")
        .update({"coins": new_coins})
        .eq("id", int(user_id))
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
        ).eq("id", int(attempt_id)).execute()
    except APIError:
        sb.table("users").update({"coins": old_coins}).eq("id", int(user_id)).eq("coins", new_coins).execute()
        raise

    return resolution
