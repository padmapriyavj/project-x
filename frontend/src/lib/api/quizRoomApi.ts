import { apiFetch, apiFetchJson } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'

type CreateBody = components['schemas']['CreateQuizRoomRequest']
type CreateRes = components['schemas']['CreateQuizRoomResponse']
type QuizRoomPublic = components['schemas']['QuizRoomPublic']

/** POST /quiz-rooms — replace mock navigation when Person B ships the handler. */
export async function createQuizRoom(
  body: CreateBody,
  token: string,
): Promise<CreateRes> {
  return apiFetchJson<CreateRes>('/quiz-rooms', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getQuizRoom(
  roomId: string,
  token: string,
): Promise<QuizRoomPublic> {
  const res = await apiFetch(`/quiz-rooms/${encodeURIComponent(roomId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error((await res.text()) || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<QuizRoomPublic>
}
