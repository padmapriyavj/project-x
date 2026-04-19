from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class DuelCreateBody(BaseModel):
    """Create a duel lobby for a published quiz (typically ``type=practice``)."""

    quiz_id: UUID


class DuelCreateResponse(BaseModel):
    room_id: str
    quiz_id: UUID
    status: str
    realtime: dict = Field(
        default_factory=lambda: {
            "namespace": "/quiz-room",
            "mode": "duel",
            "instructions": "Emit room:join with room_id, quiz_id, mode=duel; then quiz:start when 2 players ready.",
        }
    )


class DuelJoinResponse(BaseModel):
    room_id: str
    quiz_id: UUID
    ok: bool = True


class DuelAttemptResponse(BaseModel):
    attempt_id: UUID
    room_id: str
    quiz_id: UUID


class DuelSettleBody(BaseModel):
    attempt_a: UUID
    attempt_b: UUID
    opponent_ante: int = Field(default=0, ge=0, le=10_000)


class DuelSettleResponse(BaseModel):
    winner_user_id: UUID
    loser_user_id: UUID
    winner_duel_coins: int
    loser_duel_coins: int
    settled: bool = True
