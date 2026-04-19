import { playBlobUrl } from '@/lib/voice/playback'

/**
 * ElevenLabs Text-to-Speech (HTTP API).
 * @see https://elevenlabs.io/docs/api-reference/text-to-speech
 */
export async function playElevenLabsTts(
  apiKey: string,
  voiceId: string,
  text: string,
): Promise<void> {
  const id = voiceId.trim()
  if (!id) {
    throw new Error(
      'ElevenLabs voice id is missing. Set VITE_ELEVENLABS_VOICE_ID or remove an empty value from .env.',
    )
  }
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(id)}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
      }),
    },
  )
  if (!res.ok) {
    throw new Error((await res.text()) || 'ElevenLabs TTS request failed.')
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  await playBlobUrl(objectUrl)
}
