/**
 * Finn Coach — ElevenLabs **Conversational AI** (PRD §7.8).
 *
 * Full agent + tool-calling session belongs here (Hour 14–20). Wire WebSocket or
 * official browser SDK when keys/agents are ready.
 *
 * @see https://elevenlabs.io/docs/conversational-ai
 */

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
    ? 'Agent id is set. Connect the Conversational AI client (WebSocket / SDK) to start sessions.'
    : 'Set VITE_ELEVENLABS_AGENT_ID to your ElevenLabs Conversational AI agent id, then integrate the client per ElevenLabs docs.'
}

/**
 * Placeholder until Conversational AI is integrated. Throws so callers can catch and show UI.
 */
export async function startCoachConversationSession(): Promise<never> {
  throw new Error(
    'Coach Conversational AI session not wired yet (PRD §7.8). ' + getCoachSetupHint(),
  )
}
