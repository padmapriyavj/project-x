import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'

import { CoinCounter } from '@/components/dashboard/CoinCounter'
import {
  StudentCoachCta,
  StudentCourseCard,
} from '@/components/dashboard/StudentCourseCard'
import { StreakFlame } from '@/components/dashboard/StreakFlame'
import type { FinnMood } from '@/components/finn/FinnMascot'
import { FinnMascot } from '@/components/finn/FinnMascot'
import { queryKeys } from '@/lib/queryKeys'
import { fetchStudentDashboardMock } from '@/lib/queries/dashboardQueries'
import { playFinnGreeting } from '@/lib/voice/playFinnGreeting'

const moods: FinnMood[] = [
  'neutral',
  'thinking',
  'celebrating',
  'concerned',
  'speaking',
  'sleeping',
]

export function StudentDashboardPage() {
  const [moodIndex, setMoodIndex] = useState(0)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const dashboard = useQuery({
    queryKey: queryKeys.studentDashboard,
    queryFn: fetchStudentDashboardMock,
  })

  const greeting = useMutation({
    mutationFn: playFinnGreeting,
    onMutate: () => setVoiceError(null),
    onError: (err) =>
      setVoiceError(err instanceof Error ? err.message : 'Voice failed.'),
  })

  const mood = moods[moodIndex] ?? 'neutral'

  return (
    <div className="text-left">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="mb-2 text-2xl">Student dashboard</h1>
          <p className="text-foreground/75 max-w-xl text-sm">
            Mock data via TanStack Query — swap the query function for real
            `apiFetch` calls when Person A ships endpoints.{' '}
            <Link
              to="/student/practice"
              className="text-primary font-medium underline-offset-2 hover:underline"
            >
              Practice hub
            </Link>
            {' · '}
            <Link
              to="/student/practice/duel-voice-preview"
              className="text-primary font-medium underline-offset-2 hover:underline"
            >
              Duel voice preview
            </Link>
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end">
          <FinnMascot mood={mood} isSpeaking={greeting.isPending} />
          <div className="flex flex-col gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => setMoodIndex((i) => (i + 1) % moods.length)}
              className="border-divider text-foreground hover:bg-background rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-medium"
            >
              Cycle Finn mood (demo)
            </button>
            <button
              type="button"
              onClick={() => greeting.mutate()}
              disabled={greeting.isPending}
              className="bg-secondary text-surface rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {greeting.isPending ? 'Playing…' : "Play Finn's greeting"}
            </button>
            {voiceError ? (
              <p className="text-danger max-w-xs text-right text-xs">{voiceError}</p>
            ) : null}
          </div>
        </div>
      </div>

      {dashboard.isLoading ? (
        <p className="text-foreground/70 text-sm">Loading your dashboard…</p>
      ) : null}
      {dashboard.isError ? (
        <p className="text-danger text-sm">Could not load dashboard.</p>
      ) : null}

      {dashboard.data ? (
        <>
          <div className="mb-8 flex flex-wrap gap-4">
            <StreakFlame days={dashboard.data.streakDays} />
            <CoinCounter value={dashboard.data.coins} />
            <StudentCoachCta />
          </div>
          <h2 className="font-heading text-foreground mb-3 text-lg">Your courses</h2>
          <div className="space-y-4">
            {dashboard.data.courses.map((c) => (
              <StudentCourseCard key={c.id} course={c} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
