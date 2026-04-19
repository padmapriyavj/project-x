import type { FinnVoiceTrigger } from '@/lib/voice/prdTriggers'

/**
 * Optional cached clip per trigger (PRD §14.3 — avoid API for static lines at demo).
 * First-login also honors legacy `VITE_FINN_GREETING_AUDIO_URL`.
 */
export function getVoiceCacheUrl(trigger: FinnVoiceTrigger): string | undefined {
  const env = import.meta.env
  switch (trigger) {
    case 'first_login_of_day':
      return (
        env.VITE_VOICE_CACHE_FIRST_LOGIN_URL ?? env.VITE_FINN_GREETING_AUDIO_URL
      )
    case 'before_tempo':
      return env.VITE_VOICE_CACHE_BEFORE_TEMPO_URL
    case 'tempo_voice_ping':
      return env.VITE_VOICE_CACHE_TEMPO_PING_URL
    case 'end_quiz_summary':
      return env.VITE_VOICE_CACHE_END_QUIZ_URL
    case 'duel_intro':
      return env.VITE_VOICE_CACHE_DUEL_INTRO_URL
    default:
      return undefined
  }
}
