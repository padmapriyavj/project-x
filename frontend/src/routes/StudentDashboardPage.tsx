import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { StudentCourseCard } from '@/components/courses/StudentCourseCard'
import { JoinCourseModal } from '@/components/courses/JoinCourseModal'
import { Button } from '@/components/ui/Button'
import type { FinnMood } from '@/components/finn/FinnMascot'
import { FinnMascot } from '@/components/finn/FinnMascot'
import { Spinner } from '@/components/ui/Spinner'
import { useStudentDashboardQuery } from '@/lib/queries/dashboardQueries'
import { useCoursesQuery } from '@/lib/queries/courseQueries'
import { playFinnGreeting } from '@/lib/voice/playFinnGreeting'
import { useAuthStore } from '@/stores/authStore'

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
  const dashboard = useStudentDashboardQuery()
  const coursesFallback = useCoursesQuery()

  const greeting = useMutation({
    mutationFn: playFinnGreeting,
    onMutate: () => setVoiceError(null),
    onError: (err) =>
      setVoiceError(err instanceof Error ? err.message : 'Voice failed.'),
  })

  const mood = moods[moodIndex] ?? 'neutral'

  const welcomeMessage = user?.display_name
    ? `Hey ${user.display_name}! Ready to learn something new today?`
    : 'Hey there! Ready to learn something new today?'

  return (
    <div className="text-left">
      {/* Finn welcome section */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        <button
          type="button"
          onClick={() => greeting.mutate()}
          disabled={greeting.isPending}
          className="group relative flex-shrink-0 focus:outline-none"
          aria-label="Play Finn's greeting"
        >
          <FinnMascot mood={mood} isSpeaking={greeting.isPending} size={100} />
          <span className="bg-primary/90 text-primary-foreground absolute -bottom-1 -right-1 rounded-full p-1.5 text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            🔊
          </span>
        </button>
        <div className="relative max-w-md">
          <div className="bg-surface border-divider/60 shadow-soft relative rounded-2xl border px-5 py-4">
            <p className="text-foreground text-base font-medium">{welcomeMessage}</p>
            {voiceError ? (
              <p className="text-danger mt-2 text-xs">{voiceError}</p>
            ) : null}
          </div>
          {/* Speech bubble pointer */}
          <div className="border-surface absolute -left-2 top-4 hidden h-4 w-4 rotate-45 border-b border-l sm:block" style={{ backgroundColor: 'var(--color-surface)' }} />
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="ghost" size="sm" type="button" onClick={() => setMoodIndex((i) => (i + 1) % moods.length)}>
            Cycle mood
          </Button>
          <Button type="button" onClick={() => setIsJoinModalOpen(true)}>
            Join course
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-foreground text-xl sm:text-2xl">Your courses</h2>
      </div>

      {dashboard.isLoading ? <Spinner label="Loading dashboard…" /> : null}
      {dashboard.isError ? (
        <p className="text-danger mb-3 text-sm">
          Dashboard API unavailable — showing your enrolled courses from the courses list instead.
        </p>
      ) : null}

      {dashboard.isSuccess && dashboard.data.courses.length > 0 ? (
        <div className="space-y-4">
          {dashboard.data.courses.map((c) => (
            <StudentCourseCard key={c.id} course={{ id: c.id, name: c.name }} />
          ))}
        </div>
      ) : null}

      {dashboard.isSuccess && dashboard.data.courses.length === 0 && coursesFallback.data && coursesFallback.data.length > 0 ? (
        <div className="space-y-4">
          {coursesFallback.data.map((c) => (
            <StudentCourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : null}

      {dashboard.isError && coursesFallback.data && coursesFallback.data.length > 0 ? (
        <div className="space-y-4">
          {coursesFallback.data.map((c) => (
            <StudentCourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : null}

      {dashboard.isSuccess &&
      dashboard.data.courses.length === 0 &&
      (!coursesFallback.data || coursesFallback.data.length === 0) &&
      !coursesFallback.isLoading ? (
        <div className="bg-surface shadow-soft border-divider/60 rounded-[var(--radius-lg)] border p-8 text-center sm:p-10">
          <p className="text-foreground/70 mb-4 text-sm sm:text-base">
            You haven&apos;t joined any courses yet.
          </p>
          <Button type="button" onClick={() => setIsJoinModalOpen(true)}>
            Join your first course
          </Button>
        </div>
      ) : null}

      {dashboard.isError &&
      (!coursesFallback.data || coursesFallback.data.length === 0) &&
      !coursesFallback.isLoading ? (
        <div className="bg-surface shadow-soft border-divider/60 rounded-[var(--radius-lg)] border p-8 text-center sm:p-10">
          <p className="text-foreground/70 mb-4 text-sm sm:text-base">
            You haven&apos;t joined any courses yet.
          </p>
          <Button type="button" onClick={() => setIsJoinModalOpen(true)}>
            Join your first course
          </Button>
        </div>
      ) : null}

      <JoinCourseModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  )
}
