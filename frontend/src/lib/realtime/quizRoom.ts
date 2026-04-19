/**
 * Socket.IO `/quiz-room` namespace (PRD §8.4).
 *
 * Server → client: `room:state`, `quiz:question`, `quiz:peer_answered`, `quiz:next`, `quiz:complete`
 * Client → server: `room:join`, `quiz:answer`
 *
 * Wire handlers when Person B finalizes payloads; connect when HTTP origin is known.
 */

import { io, type Socket } from 'socket.io-client'

export const QUIZ_SERVER_EVENTS = [
  'room:state',
  'quiz:question',
  'quiz:peer_answered',
  'quiz:next',
  'quiz:complete',
] as const

export const QUIZ_CLIENT_EVENTS = ['room:join', 'quiz:answer'] as const

export type QuizServerEvent = (typeof QUIZ_SERVER_EVENTS)[number]
export type QuizClientEvent = (typeof QUIZ_CLIENT_EVENTS)[number]

/** HTTP(S) origin for Socket.IO (client upgrades to WS). */
function getHttpOrigin(): string | undefined {
  const ws = import.meta.env.VITE_WS_BASE_URL?.trim().replace(/\/$/, '')
  if (ws) return ws
  const api = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '')
  return api || undefined
}

export type QuizRoomSocket = Socket

export function connectQuizRoom(
  roomId: string,
  opts: { token?: string } = {},
): QuizRoomSocket | null {
  const origin = getHttpOrigin()
  if (!origin) {
    console.info(
      '[quiz-room] Set VITE_WS_BASE_URL or VITE_API_BASE_URL to enable Socket.IO.',
    )
    return null
  }
  const socket = io(`${origin}/quiz-room`, {
    path: '/socket.io',
    auth: { token: opts.token ?? '' },
    query: { room_id: roomId },
    autoConnect: true,
    reconnection: true,
  })
  return socket
}

export function disconnectQuizRoom(socket: QuizRoomSocket | null): void {
  socket?.disconnect()
}
