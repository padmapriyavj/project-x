/**
 * Finn Coach — ElevenLabs **Conversational AI** (PRD §7.8).
 *
 * Uses `@elevenlabs/client` in the browser. For production, prefer a server-issued
 * signed URL or conversation token instead of exposing a long-lived API key.
 *
 * @see https://elevenlabs.io/docs/conversational-ai/libraries/java-script
 */

import type { Callbacks, VoiceConversation } from '@elevenlabs/client'

export type CoachSessionStatus = 'unconfigured' | 'ready'

export function getCoachAgentId(): string | undefined {
  const id = import.meta.env.VITE_ELEVENLABS_AGENT_ID?.trim()
  return id || undefined
}

export function getCoachSessionStatus(): CoachSessionStatus {
  return getCoachAgentId() ? 'ready' : 'unconfigured'
}

export function getCoachSetupHint(): string {
  return getCoachAgentId()
    ? 'Agent id is set. Start a session below (microphone permission required). For production, proxy auth via your backend.'
    : 'Set VITE_ELEVENLABS_AGENT_ID to your ElevenLabs Conversational AI agent id.'
}

export type CoachSessionCallbacks = Pick<
  Callbacks,
  'onConnect' | 'onDisconnect' | 'onError' | 'onStatusChange' | 'onModeChange'
>

/**
 * Starts a voice conversation with the configured agent.
 * Pass optional `authorization` via env `VITE_ELEVENLABS_API_KEY` (dev / hackathon only).
 */
export async function startCoachConversationSession(
  callbacks: CoachSessionCallbacks,
): Promise<VoiceConversation> {
  const agentId = getCoachAgentId()
  if (!agentId) {
    throw new Error(`Coach is not configured. ${getCoachSetupHint()}`)
  }

  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY?.trim()

  const { Conversation } = await import('@elevenlabs/client')

  const session = await Conversation.startSession({
    agentId,
    ...(apiKey ? { authorization: apiKey } : {}),
    ...callbacks,
  })

  return session as VoiceConversation
}

export async function endCoachConversationSession(
  session: VoiceConversation | null,
): Promise<void> {
  if (!session) return
  try {
    await session.endSession()
  } catch {
    // ignore double-end
  }
}
