"""Pydantic models for QuizGenerationConfig (PRD §7.6) and API payloads."""

from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

QuizType = Literal["tempo", "practice"]
QuizStatus = Literal["draft", "reviewing", "published", "archived"]
Difficulty = Literal["easy", "medium", "hard"]


class ConceptWeight(BaseModel):
    concept_id: UUID
    """Weight as percent (0–100); snapshot only, not stored on concepts row."""

    weight: Decimal = Field(ge=0, le=100)


class DifficultyWeights(BaseModel):
    easy: Decimal = Field(ge=0, le=100)
    medium: Decimal = Field(ge=0, le=100)
    hard: Decimal = Field(ge=0, le=100)

    @model_validator(mode="after")
    def sum_to_100(self) -> "DifficultyWeights":
        s = self.easy + self.medium + self.hard
        if s != Decimal("100"):
            raise ValueError("difficulty_weights must sum to 100")
        return self


class KnowledgeBaseRef(BaseModel):
    """Optional pointer for chunk ranges; may be empty when using lesson_ids only."""

    material_id: UUID | None = None
    chunk_start: int | None = None
    chunk_end: int | None = None


class QuizGenerationConfig(BaseModel):
    lesson_ids: list[UUID] = Field(min_length=1)
    concepts: list[ConceptWeight] = Field(min_length=1)
    difficulty_weights: DifficultyWeights
    num_questions: int = Field(ge=1, le=100)
    time_per_question: int = Field(ge=5, le=600, description="Seconds per question")
    knowledge_base_ref: KnowledgeBaseRef | None = None

    @field_validator("concepts", mode="after")
    @classmethod
    def concept_weights_sum(cls, v: list[ConceptWeight]) -> list[ConceptWeight]:
        s = sum(c.weight for c in v)
        if s != Decimal("100"):
            raise ValueError("concept weights must sum to 100")
        return v


class QuizGenerateRequest(BaseModel):
    """Body for POST /quizzes/generate."""

    course_id: UUID
    config: QuizGenerationConfig
    quiz_type: QuizType = "practice"


class ChoiceItem(BaseModel):
    key: str
    text: str


class QuestionDraft(BaseModel):
    text: str
    choices: list[ChoiceItem]
    correct_choice: str
    concept_id: UUID
    difficulty: Difficulty


class QuizGenerateResponse(BaseModel):
    quiz_id: UUID
    status: str
    questions: list[dict]


class QuestionRegenerateRequest(BaseModel):
    config: QuizGenerationConfig | None = None


class QuestionPublic(BaseModel):
    id: UUID
    quiz_id: UUID
    question_order: int
    text: str
    choices: list[dict]
    correct_choice: str
    concept_id: UUID
    difficulty: str
    approved: bool
    generation_metadata: dict | None = None


class QuizPublic(BaseModel):
    id: UUID
    type: str
    lesson_id: UUID | None
    course_id: UUID
    created_by: UUID
    config: dict
    status: str
    scheduled_at: str | None
    duration_sec: int | None
    questions: list[QuestionPublic]


class QuestionRegenerateRequest(BaseModel):
    """Optional override; otherwise snapshot is loaded from quiz.config."""

    config: QuizGenerationConfig | None = None


class PublishResponse(BaseModel):
    quiz_id: UUID
    status: str


class AnswerInput(BaseModel):
    question_id: UUID
    selected_choice: str
    time_taken_ms: int = 0


class ScoreAttemptInput(BaseModel):
    """Answers for scoring a completed attempt."""

    answers: list[AnswerInput]


class QuestionEditBody(BaseModel):
    """Professor edits before approve (PRD review stage)."""

    text: str | None = None
    choices: list[ChoiceItem] | None = None
    correct_choice: str | None = None


class ScoreAttemptResult(BaseModel):
    quiz_id: UUID
    attempt_id: UUID
    score_pct: Decimal
    correct_count: int
    total_questions: int
    base_coins: int
    payout_coins: int | None = None
    betcha_effective_factor: int | None = None
    betcha_applied: bool = False
    current_streak: int | None = None
    streak_milestone_bonus_coins: int = 0
    streak_already_active_today: bool = False
