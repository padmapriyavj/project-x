import { useEffect, useState } from 'react'

import {
  connectQuizRoom,
  disconnectQuizRoom,
  type QuizRoomSocket,
} from '@/lib/realtime/quizRoom'
import { useAuthStore } from '@/stores/authStore'

/**
 * Optional live socket for quiz rooms. Skips mock/tempo placeholder ids (local shell only).
 */
export function useQuizRoomConnection(roomId: string | undefined): QuizRoomSocket | null {
  const token = useAuthStore((s) => s.token)
  const [socket, setSocket] = useState<QuizRoomSocket | null>(null)

  useEffect(() => {
    if (!roomId || roomId.startsWith('mock-') || roomId.startsWith('tempo-')) {
      const clearId = requestAnimationFrame(() => setSocket(null))
      return () => cancelAnimationFrame(clearId)
    }

    const s = connectQuizRoom(roomId, { token: token ?? undefined })
    const setId = requestAnimationFrame(() => setSocket(s))
    return () => {
      cancelAnimationFrame(setId)
      disconnectQuizRoom(s)
      requestAnimationFrame(() => setSocket(null))
    }
  }, [roomId, token])

  return socket
}
