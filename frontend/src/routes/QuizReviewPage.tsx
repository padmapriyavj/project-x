import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { ScheduleTempoModal } from '@/components/tempo/ScheduleTempoModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import {
  approveQuestion,
  getQuiz,
  patchQuestion,
  publishQuiz,
  regenerateQuestion,
} from '@/lib/api/intelligenceApi'
import { getLesson } from '@/lib/courseContentLocal'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'

type Choice = { key: string; text: string }

type QRow = {
  id: string
  text: string
  choices: Choice[]
  correct_choice: string
  approved: boolean
  difficulty?: string
}

export function QuizReviewPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const qid = quizId ?? ''
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [meta, setMeta] = useState<{ courseId: number; lessonId: string; courseName: string } | null>(null)

  const quizQuery = useQuery({
    queryKey: queryKeys.quizDetail(qid),
    queryFn: async () => {
      if (!token) throw new Error('Auth')
      return (await getQuiz(token, qid)) as Record<string, unknown>
    },
    enabled: !!token && !!qid,
  })

  const questions: QRow[] = (quizQuery.data?.questions as QRow[] | undefined) ?? []

  useEffect(() => {
    if (!quizQuery.data || meta) return
    const lid = quizQuery.data.lesson_id as string | undefined
    const les = lid ? getLesson(lid) : undefined
    if (les) {
      setMeta({ courseId: les.courseId, lessonId: les.id, courseName: 'Course' })
    }
  }, [quizQuery.data, meta])

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.quizDetail(qid) })

  const approve = useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error('Auth')
      return approveQuestion(token, id)
    },
    onSuccess: invalidate,
  })

  const regen = useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error('Auth')
      return regenerateQuestion(token, id, null)
    },
    onSuccess: invalidate,
  })

  const saveText = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => {
      if (!token) throw new Error('Auth')
      return patchQuestion(token, id, { text })
    },
    onSuccess: invalidate,
  })

  const publish = useMutation({
    mutationFn: () => {
      if (!token) throw new Error('Auth')
      return publishQuiz(token, qid)
    },
    onSuccess: () => setScheduleOpen(true),
  })

  if (quizQuery.isLoading) return <Spinner label="Loading quiz…" />
  if (quizQuery.isError || !quizQuery.data) {
    return (
      <p className="text-danger text-sm">
        Could not load quiz.{' '}
        <Link to="/professor" className="text-primary underline">
          Dashboard
        </Link>
      </p>
    )
  }

  const allApproved = questions.length > 0 && questions.every((q) => q.approved)

  return (
    <div className="text-left">
      <nav className="mb-6">
        <Link to="/professor" className="text-primary inline-flex min-h-11 items-center text-sm underline">
          &larr; Dashboard
        </Link>
      </nav>

      <PageHeader
        title="Quiz review"
        description="Approve, edit, or regenerate each question. Publish when ready."
      />

      <ul className="mb-8 space-y-4">
        {questions.map((q) => (
          <li key={q.id}>
            <Card padding="md" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground/60 text-xs uppercase">{q.difficulty ?? 'mixed'}</span>
                <span className={q.approved ? 'text-success text-xs font-medium' : 'text-warning text-xs'}>
                  {q.approved ? 'Approved' : 'Draft'}
                </span>
              </div>
              <label className="block text-sm font-medium" htmlFor={`qt-${q.id}`}>
                Question
              </label>
              <textarea
                id={`qt-${q.id}`}
                className="border-divider bg-surface w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm"
                rows={3}
                defaultValue={q.text}
                onBlur={(e) => {
                  if (e.target.value !== q.text) saveText.mutate({ id: q.id, text: e.target.value })
                }}
              />
              <ul className="space-y-1 text-sm">
                {q.choices.map((c) => (
                  <li key={c.key} className="flex gap-2">
                    <span className="font-mono text-foreground/60">{c.key}</span>
                    <span>{c.text}</span>
                    {c.key === q.correct_choice ? (
                      <span className="text-success text-xs">(correct)</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={q.approved || approve.isPending}
                  onClick={() => approve.mutate(q.id)}
                >
                  Approve
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => regen.mutate(q.id)}>
                  Regenerate
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={!allApproved || publish.isPending} onClick={() => publish.mutate()}>
          {publish.isPending ? 'Publishing…' : 'Publish quiz'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => navigate('/professor')}>
          Done later
        </Button>
      </div>

      {publish.isError ? (
        <p className="text-danger mt-4 text-sm" role="alert">
          {publish.error instanceof Error ? publish.error.message : 'Publish failed'}
        </p>
      ) : null}

      {meta ? (
        <ScheduleTempoModal
          courseId={meta.courseId}
          lessonId={meta.lessonId}
          courseName={meta.courseName}
          isOpen={scheduleOpen}
          onClose={() => {
            setScheduleOpen(false)
            navigate(`/professor/course/${meta.courseId}?tab=lessons`)
          }}
        />
      ) : null}
    </div>
  )
}
