import { apiFetch } from '@/lib/api/client'

async function authedJson<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(text || `${res.status}`)
  return text ? (JSON.parse(text) as T) : ({} as T)
}

export type ConceptItem = {
  id: string
  lesson_id: string
  name: string
  description?: string | null
}

export async function listLessonConcepts(token: string, lessonId: string): Promise<ConceptItem[]> {
  const data = await authedJson<{ concepts: ConceptItem[] }>(
    `/lessons/${lessonId}/concepts`,
    token,
  )
  return data.concepts ?? []
}

export async function generateLessonConcepts(
  token: string,
  lessonId: string,
): Promise<{ concepts: ConceptItem[] }> {
  return authedJson(`/lessons/${lessonId}/concepts/generate`, token, { method: 'POST' })
}

export type ChoiceItem = { key: string; text: string }

export type QuizGenerateBody = {
  course_id: string
  quiz_type?: 'tempo' | 'practice'
  config: {
    lesson_ids: string[]
    concepts: { concept_id: string; weight: string }[]
    difficulty_weights: { easy: string; medium: string; hard: string }
    num_questions: number
    time_per_question: number
    knowledge_base_ref?: { material_id: string | null; chunk_start: number | null; chunk_end: number | null }
  }
}

export type QuizGenerateResponse = {
  quiz_id: string
  status: string
  questions: Record<string, unknown>[]
}

export async function generateQuiz(token: string, body: QuizGenerateBody): Promise<QuizGenerateResponse> {
  return authedJson('/quizzes/generate', token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getQuiz(token: string, quizId: string): Promise<Record<string, unknown>> {
  return authedJson(`/quizzes/${quizId}`, token)
}

export async function approveQuestion(token: string, questionId: string): Promise<Record<string, unknown>> {
  return authedJson(`/questions/${questionId}/approve`, token, { method: 'POST' })
}

export async function regenerateQuestion(
  token: string,
  questionId: string,
  body?: Record<string, unknown> | null,
): Promise<Record<string, unknown>> {
  return authedJson(`/questions/${questionId}/regenerate`, token, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  })
}

export async function patchQuestion(
  token: string,
  questionId: string,
  body: { text?: string; choices?: ChoiceItem[]; correct_choice?: string },
): Promise<Record<string, unknown>> {
  return authedJson(`/questions/${questionId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function publishQuiz(token: string, quizId: string): Promise<{ quiz_id: string; status: string }> {
  return authedJson(`/quizzes/${quizId}/publish`, token, { method: 'POST' })
}
