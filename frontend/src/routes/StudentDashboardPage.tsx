import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { StudentCourseCard } from '@/components/courses/StudentCourseCard'
import { JoinCourseModal } from '@/components/courses/JoinCourseModal'
import { Button } from '@/components/ui/Button'
import { CoinCounter } from '@/components/dashboard/CoinCounter'
import { StudentCoachCta } from '@/components/dashboard/StudentCourseCard'
import { StreakFlame } from '@/components/dashboard/StreakFlame'
import type { FinnMood } from '@/components/finn/FinnMascot'
import { FinnMascot } from '@/components/finn/FinnMascot'
import { PageHeader } from '@/components/ui/PageHeader'
import { useCoursesQuery } from '@/lib/queries/courseQueries'
import { playFinnGreeting } from '@/lib/voice/playFinnGreeting'
import { useAuthStore } from '@/stores/authStore'
import { useStudentEconomyStore } from '@/stores/studentEconomyStore'

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
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

  const user = useAuthStore((s) => s.user)
  const courses = useCoursesQuery()
  const coins = useStudentEconomyStore((s) => s.coins)

  const greeting = useMutation({
    mutationFn: playFinnGreeting,
    onMutate: () => setVoiceError(null),
    onError: (err) =>
      setVoiceError(err instanceof Error ? err.message : 'Voice failed.'),
  })

  const mood = moods[moodIndex] ?? 'neutral'

  const title = `Welcome${user?.display_name ? `, ${user.display_name}` : ''}`

  return (
    <div className="text-left">
      <PageHeader
        title={title}
        description="Use the header to open Practice, Shop, Space, and Coach. Finn is here when you need a quick demo."
        actions={
          <Button type="button" onClick={() => setIsJoinModalOpen(true)}>
            Join course
          </Button>
        }
      />

      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="order-2 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:order-1">
          <StreakFlame days={user?.current_streak ?? 0} />
          <CoinCounter value={coins} />
          <div className="flex items-stretch justify-center sm:justify-start">
            <StudentCoachCta />
          </div>
        </div>
        <div className="order-1 flex flex-col items-center gap-3 lg:order-2 lg:items-end">
          <FinnMascot mood={mood} isSpeaking={greeting.isPending} />
          <div className="flex w-full max-w-xs flex-col gap-2 sm:max-w-none lg:items-end">
            <Button variant="ghost" size="sm" type="button" onClick={() => setMoodIndex((i) => (i + 1) % moods.length)}>
              Cycle Finn mood (demo)
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => greeting.mutate()}
              disabled={greeting.isPending}
              fullWidth
              className="lg:w-auto"
            >
              {greeting.isPending ? 'Playing...' : "Play Finn's greeting"}
            </Button>
            {voiceError ? (
              <p className="text-danger text-center text-xs lg:text-right">{voiceError}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-foreground text-xl sm:text-2xl">Your courses</h2>
      </div>

      {courses.isLoading ? (
        <p className="text-foreground/70 text-sm">Loading your courses...</p>
      ) : null}
      {courses.isError ? (
        <p className="text-danger text-sm">Could not load courses.</p>
      ) : null}

      {courses.data ? (
        courses.data.length > 0 ? (
          <div className="space-y-4">
            {courses.data.map((c) => (
              <StudentCourseCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <div className="bg-surface shadow-soft border-divider/60 rounded-[var(--radius-lg)] border p-8 text-center sm:p-10">
            <p className="text-foreground/70 mb-4 text-sm sm:text-base">
              You haven&apos;t joined any courses yet.
            </p>
            <Button type="button" onClick={() => setIsJoinModalOpen(true)}>
              Join your first course
            </Button>
          </div>
        )
      ) : null}

      <JoinCourseModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  )
}
