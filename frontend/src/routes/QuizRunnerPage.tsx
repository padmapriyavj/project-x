import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { BetchaSelector } from '@/components/betcha/BetchaSelector'
import { Button } from '@/components/ui/Button'
import { useQuizRoomConnection } from '@/hooks/useQuizRoomConnection'
import type { FinnMood } from '@/components/finn/FinnMascot'
import { FinnMascot } from '@/components/finn/FinnMascot'
import { CountdownTimer } from '@/components/quiz/CountdownTimer'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { Spinner } from '@/components/ui/Spinner'
import { getApiBaseUrl } from '@/lib/env'
import { getQuizWithRetry, placeBetcha, scoreQuizAttempt, type ScoreAnswerInput } from '@/lib/api/intelligenceApi'
import {
  mockQuizQuestions,
  type BetchaMultiplier,
  type MockQuestion,
  type QuizRunLocationState,
  type QuizResultsLocationState,
} from '@/lib/mocks/quizRun'
import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'
import type { QuestionPublic, QuizCompletePayload, RoomStatePayload } from '@/lib/realtime/protocol'
import { QUIZ_SERVER_EVENTS } from '@/lib/realtime/quizRoom'
import {
  speakEndQuizSummary,
  speakQuizQuestionRead,
  speakWrongAnswerReframe,
} from '@/lib/voice/quizVoice'
import { useAuthStore } from '@/stores/authStore'
import { useStudentEconomyStore } from '@/stores/studentEconomyStore'

const QUESTION_SECONDS = 45

const CHOICE_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

function apiQuestionRowToMock(q: Record<string, unknown>): MockQuestion {
  const id = String(q.id ?? '')
  const rawChoices = Array.isArray(q.choices) ? q.choices : []
  const keys: string[] = []
  const texts: string[] = []
  for (const ch of rawChoices) {
    if (ch && typeof ch === 'object' && 'key' in ch) {
      keys.push(String((ch as { key: unknown }).key).toUpperCase())
      texts.push(String((ch as { text?: unknown }).text ?? ''))
    }
  }
  const cc = String(q.correct_choice ?? '').toUpperCase()
  let correctIndex = keys.indexOf(cc)
  if (correctIndex < 0) correctIndex = 0
  return {
    id,
    prompt: String(q.text ?? '').trim() || '(No prompt)',
    choices: texts,
    correctIndex,
  }
}

function isDemoQuizRoomId(id: string | undefined) {
  if (!id) return false
  return id.startsWith('mock-')
}

function toMultiplierLabel(m: BetchaMultiplier): '1x' | '3x' | '5x' {
  if (m === 3) return '3x'
  if (m === 5) return '5x'
  return '1x'
}

function questionPublicToMock(q: QuestionPublic): MockQuestion {
  const choices = (q.choices ?? []).map((c) => String((c as { text?: string }).text ?? ''))
  return {
    id: q.question_id,
    prompt: q.text,
    choices,
    correctIndex: 0,
  }
}

export function QuizRunnerPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const decodedRoomId = roomId ? decodeURIComponent(roomId) : undefined
  const location = useLocation()
  const navigate = useNavigate()
  const run = location.state as QuizRunLocationState | null
  const useRealtime = Boolean(run?.realtime && decodedRoomId)
  const isApiSolo = Boolean(run && !useRealtime && run.api)
  const socket = useQuizRoomConnection(decodedRoomId, { skip: !useRealtime })

  const token = useAuthStore((s) => s.token)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const setCoinsFromBackend = useStudentEconomyStore((s) => s.setCoinsFromBackend)
  const patchUser = useAuthStore((s) => s.patchUser)

  const [betchaLocked, setBetchaLocked] = useState(() => !run?.api)
  const [betchaError, setBetchaError] = useState<string | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finnMood, setFinnMood] = useState<FinnMood>('neutral')
  const [timerKey, setTimerKey] = useState(0)
  const [reading, setReading] = useState(false)
  const started = useRef(false)
  const answersRef = useRef<ScoreAnswerInput[]>([])

  const [wsQuestion, setWsQuestion] = useState<MockQuestion | null>(null)
  const [wsTotal, setWsTotal] = useState(0)
  const [wsIndex, setWsIndex] = useState(0)
  const [wsError, setWsError] = useState<string | null>(null)
  const duelStartSent = useRef(false)
  const wsJoined = useRef(false)
  const wsCompleteHandled = useRef(false)

  const [apiQuizQuestions, setApiQuizQuestions] = useState<MockQuestion[] | null>(null)
  const [apiQuizLoadError, setApiQuizLoadError] = useState<string | null>(null)
  const [countdownSeconds, setCountdownSeconds] = useState(QUESTION_SECONDS)

  useEffect(() => {
    if (!run?.api || !token || useRealtime) return
    let cancelled = false
    setApiQuizQuestions(null)
    setApiQuizLoadError(null)
    void (async () => {
      try {
        const data = await getQuizWithRetry(token, run.api!.quizId)
        if (cancelled) return
        const raw = (data.questions as Record<string, unknown>[]) ?? []
        const sorted = [...raw].sort(
          (a, b) => Number(a.question_order ?? 0) - Number(b.question_order ?? 0),
        )
        setApiQuizQuestions(sorted.map(apiQuestionRowToMock))
        const cfg = data.config as Record<string, unknown> | undefined
        const t = cfg && typeof cfg.time_per_question === 'number' ? cfg.time_per_question : null
        if (t !== null && t >= 5 && t <= 600) setCountdownSeconds(t)
        else setCountdownSeconds(QUESTION_SECONDS)
        setQIndex(0)
        setCorrectCount(0)
        answersRef.current = []
        setTimerKey((k) => k + 1)
      } catch (e) {
        if (!cancelled) {
          setApiQuizLoadError(e instanceof Error ? e.message : 'Could not load quiz.')
          setApiQuizQuestions([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [run?.api?.quizId, run?.api?.attemptId, token, useRealtime])

  useEffect(() => {
    if (!run || useRealtime) return
    const q = run.api ? apiQuizQuestions?.[qIndex] : mockQuizQuestions[qIndex]
    if (!q) return
    let cancelled = false
    const play = async () => {
      setReading(true)
      setFinnMood('speaking')
      try {
        await speakQuizQuestionRead(q.prompt)
      } finally {
        if (!cancelled) {
          setFinnMood('neutral')
          setReading(false)
        }
      }
    }
    void play()
    return () => {
      cancelled = true
    }
  }, [qIndex, run, useRealtime, apiQuizQuestions])

  useEffect(() => {
    if (!run || !useRealtime || !wsQuestion) return
    let cancelled = false
    const play = async () => {
      setReading(true)
      setFinnMood('speaking')
      try {
        await speakQuizQuestionRead(wsQuestion.prompt)
      } finally {
        if (!cancelled) {
          setFinnMood('neutral')
          setReading(false)
        }
      }
    }
    void play()
    return () => {
      cancelled = true
    }
  }, [run, useRealtime, wsQuestion])

  useEffect(() => {
    if (!run || started.current) return
    started.current = true
    if (!run.api || !token) {
      // One-shot: no server attempt → keep Betcha UI locked (mock / tempo without scoring row).
      queueMicrotask(() => setBetchaLocked(true))
      return
    }
    const stake = run.stakeCoins ?? 50
    void (async () => {
      try {
        const res = await placeBetcha(token, run.api!.quizId, {
          attempt_id: parseInt(run.api!.attemptId, 10),
          multiplier: toMultiplierLabel(run.betcha),
          stake_coins: stake,
        })
        setCoinsFromBackend(res.coins_balance_after)
        patchUser({ coins: res.coins_balance_after })
        setBetchaLocked(true)
        setBetchaError(null)
      } catch (e) {
        setBetchaError(e instanceof Error ? e.message : 'Could not place Betcha wager.')
        setBetchaLocked(true)
      }
    })()
  }, [run, token, setCoinsFromBackend, patchUser])

  const finishRun = useCallback(
    async (finalCorrect: number) => {
      const questionBank = run?.api ? (apiQuizQuestions ?? []) : mockQuizQuestions
      const total = questionBank.length || 1
      const pct = Math.round((finalCorrect / total) * 100)
      const betcha = run?.betcha ?? 1

      if (run?.api && token) {
        try {
          const ordered: ScoreAnswerInput[] = questionBank.map((q) => {
            const saved = answersRef.current.find((a) => a.question_id === q.id)
            const letter =
              saved?.selected_choice ?? (CHOICE_KEYS[q.correctIndex] ?? 'A')
            return {
              question_id: q.id,
              selected_choice: letter,
              time_taken_ms: saved?.time_taken_ms ?? 0,
            }
          })
          const scored = await scoreQuizAttempt(token, run.api.attemptId, ordered)
          const coinsEarned = scored.payout_coins ?? scored.base_coins
          const outcome =
            scored.betcha_applied && scored.payout_coins != null
              ? `Betcha applied — payout ${scored.payout_coins} coins (factor ${scored.betcha_effective_factor ?? '—'}).`
              : `Scored: ${scored.correct_count}/${scored.total_questions} correct. Base coins: ${scored.base_coins}.`
          setFinnMood('celebrating')
          await speakEndQuizSummary(
            `You got ${scored.correct_count} out of ${scored.total_questions} correct. ${outcome}`,
          )
          setFinnMood('neutral')
          const results: QuizResultsLocationState = {
            mode: run.mode ?? 'solo',
            betcha,
            correctCount: scored.correct_count,
            totalQuestions: scored.total_questions,
            coinsEarned,
            betchaOutcome: outcome,
          }
          if (scored.current_streak != null) {
            patchUser({ current_streak: scored.current_streak })
          }
          void queryClient.invalidateQueries({ queryKey: queryKeys.scoringMe })
          void queryClient.invalidateQueries({ queryKey: queryKeys.studentDashboard })
          void refreshUser()
          navigate(`/student/quiz/${decodedRoomId}/results`, { state: results })
          return
        } catch (e) {
          console.error(e)
          const msg = e instanceof Error ? e.message : 'Server scoring failed.'
          const results: QuizResultsLocationState = {
            mode: run.mode ?? 'solo',
            betcha,
            correctCount: finalCorrect,
            totalQuestions: total,
            coinsEarned: 0,
            betchaOutcome: msg,
            serverScoringFailed: true,
          }
          navigate(`/student/quiz/${decodedRoomId}/results`, { state: results })
          return
        }
      }

      let coins = Math.round(10 * finalCorrect * (pct / 100))
      let outcome = `Betcha ${betcha}× — proportional payout.`
      if (betcha === 3 && pct >= 70) {
        coins = Math.round(coins * 3)
        outcome = 'Betcha 3× — you hit 70%+; triple payout applies.'
      } else if (betcha === 3) {
        outcome = 'Betcha 3× — below 70%; fallback to 1× payout.'
      }
      if (betcha === 5 && pct >= 90) {
        coins = Math.round(coins * 5)
        outcome = 'Betcha 5× — you hit 90%+; fivefold payout applies.'
      } else if (betcha === 5) {
        outcome = 'Betcha 5× — below 90%; fallback to 1× payout.'
      }
      const summary = `You got ${finalCorrect} out of ${total} correct. ${outcome}`
      setFinnMood('celebrating')
      await speakEndQuizSummary(summary)
      setFinnMood('neutral')
      const results: QuizResultsLocationState = {
        mode: run?.mode ?? 'solo',
        betcha,
        correctCount: finalCorrect,
        totalQuestions: total,
        coinsEarned: coins,
        betchaOutcome: outcome,
      }
      navigate(`/student/quiz/${decodedRoomId}/results`, { state: results })
    },
    [navigate, decodedRoomId, run, token, patchUser, refreshUser, apiQuizQuestions],
  )

  const finishWsRun = useCallback(
    async (payload: QuizCompletePayload) => {
      if (wsCompleteHandled.current) return
      wsCompleteHandled.current = true
      const betcha = run?.betcha ?? 1
      const summary = payload.summary
      const attemptId = payload.attempt_id ?? run?.api?.attemptId

      if (attemptId && token) {
        try {
          const ordered = [...answersRef.current]
          const scored = await scoreQuizAttempt(token, attemptId, ordered)
          const coinsEarned = scored.payout_coins ?? scored.base_coins
          const outcome =
            scored.betcha_applied && scored.payout_coins != null
              ? `Betcha applied — payout ${scored.payout_coins} coins (factor ${scored.betcha_effective_factor ?? '—'}).`
              : `Scored: ${scored.correct_count}/${scored.total_questions} correct. Base coins: ${scored.base_coins}.`
          setFinnMood('celebrating')
          await speakEndQuizSummary(
            `You got ${scored.correct_count} out of ${scored.total_questions} correct. ${outcome}`,
          )
          setFinnMood('neutral')
          const results: QuizResultsLocationState = {
            mode: run?.mode ?? 'solo',
            betcha,
            correctCount: scored.correct_count,
            totalQuestions: scored.total_questions,
            coinsEarned,
            betchaOutcome: outcome,
          }
          if (scored.current_streak != null) {
            patchUser({ current_streak: scored.current_streak })
          }
          void queryClient.invalidateQueries({ queryKey: queryKeys.scoringMe })
          void queryClient.invalidateQueries({ queryKey: queryKeys.studentDashboard })
          void refreshUser()
          navigate(`/student/quiz/${decodedRoomId}/results`, { state: results })
          return
        } catch (e) {
          console.error(e)
        }
      }

      setFinnMood('celebrating')
      await speakEndQuizSummary(
        `You got ${summary.correct_count} out of ${summary.total_questions} correct (${summary.score_pct}% ).`,
      )
      setFinnMood('neutral')
      const results: QuizResultsLocationState = {
        mode: run?.mode ?? 'solo',
        betcha,
        correctCount: summary.correct_count,
        totalQuestions: summary.total_questions,
        coinsEarned: Math.round(summary.score_pct),
        betchaOutcome: 'Server summary (scoring unavailable).',
      }
      navigate(`/student/quiz/${decodedRoomId}/results`, { state: results })
    },
    [navigate, decodedRoomId, run, token, patchUser, refreshUser],
  )

  useEffect(() => {
    if (!socket || !useRealtime) return
    const onConnectErr = (e: Error) => {
      setWsError(e?.message || 'Could not connect to the quiz server (Socket.IO).')
    }
    socket.on('connect_error', onConnectErr)
    return () => {
      socket.off('connect_error', onConnectErr)
    }
  }, [socket, useRealtime])

  useEffect(() => {
    if (!socket || !run?.realtime || !decodedRoomId) return
    const { quizId, mode, attemptId } = run.realtime
    const join = () => {
      if (wsJoined.current) return
      wsJoined.current = true
      socket.emit('room:join', {
        room_id: decodedRoomId,
        quiz_id: quizId,
        mode,
        attempt_id: attemptId ?? null,
        display_name: null,
      })
    }
    if (socket.connected) join()
    else socket.on('connect', join)
    return () => {
      socket.off('connect', join)
      wsJoined.current = false
    }
  }, [socket, run?.realtime, decodedRoomId])

  useEffect(() => {
    if (!socket || !run?.realtime || !decodedRoomId) return

    const onQuestion = (...args: unknown[]) => {
      const payload = args[0] as { question?: QuestionPublic }
      if (!payload?.question) return
      const mq = questionPublicToMock(payload.question)
      setWsQuestion(mq)
      setWsTotal(payload.question.total_questions)
      setWsIndex(payload.question.question_index)
      setSelected(null)
      setTimerKey((k) => k + 1)
    }

    const onComplete = (...args: unknown[]) => {
      const payload = args[0] as QuizCompletePayload
      void finishWsRun(payload)
    }

    const onError = (...args: unknown[]) => {
      const payload = args[0] as { message?: string }
      setWsError(payload?.message ?? 'Room error')
    }

    const onState = (...args: unknown[]) => {
      const payload = args[0] as RoomStatePayload
      if (run.realtime?.mode !== 'duel') return
      if (payload.status !== 'waiting') return
      if (payload.participants.length < 2 || duelStartSent.current) return
      duelStartSent.current = true
      socket.emit('quiz:start', { room_id: decodedRoomId })
    }

    socket.on('quiz:question', onQuestion)
    socket.on('quiz:complete', onComplete)
    socket.on('room:error', onError)
    socket.on('room:state', onState)

    return () => {
      socket.off('quiz:question', onQuestion)
      socket.off('quiz:complete', onComplete)
      socket.off('room:error', onError)
      socket.off('room:state', onState)
    }
  }, [socket, run, decodedRoomId, finishWsRun])

  useEffect(() => {
    if (!socket || useRealtime) return
    const handlers = QUIZ_SERVER_EVENTS.map((ev) => {
      const fn = (...payload: unknown[]) => {
        if (import.meta.env.DEV) {
          console.debug('[quiz-room]', ev, payload)
        }
      }
      socket.on(ev, fn)
      return { ev, fn }
    })
    return () => {
      for (const { ev, fn } of handlers) socket.off(ev, fn)
    }
  }, [socket, useRealtime])

  const submitOrTimeoutFixed = useCallback(async () => {
    if (!run) return
    if (useRealtime && socket && wsQuestion) {
      const letter =
        selected !== null ? (CHOICE_KEYS[selected] ?? String(selected)) : (CHOICE_KEYS[0] ?? 'A')
      answersRef.current = [
        ...answersRef.current.filter((a) => a.question_id !== wsQuestion.id),
        { question_id: wsQuestion.id, selected_choice: letter, time_taken_ms: 0 },
      ]
      socket.emit('quiz:answer', {
        question_id: wsQuestion.id,
        selected_choice: letter,
        time_taken_ms: 0,
      })
      setSelected(null)
      return
    }

    const soloBank = run.api ? (apiQuizQuestions ?? []) : mockQuizQuestions
    const question = soloBank[qIndex]
    if (!question) return

    const letter =
      selected !== null ? (CHOICE_KEYS[selected] ?? String(selected)) : (CHOICE_KEYS[0] ?? 'A')
    answersRef.current = [
      ...answersRef.current.filter((a) => a.question_id !== question.id),
      { question_id: question.id, selected_choice: letter, time_taken_ms: 0 },
    ]

    const ok = selected !== null && selected === question.correctIndex
    if (!ok && selected !== null) {
      setFinnMood('concerned')
      await speakWrongAnswerReframe(
        "Not quite — that's okay. Take a breath and we'll move to the next one.",
      )
      setFinnMood('neutral')
    }

    const nextCorrect = correctCount + (ok ? 1 : 0)
    const isLast = qIndex + 1 >= soloBank.length
    if (isLast) {
      await finishRun(nextCorrect)
      return
    }
    setCorrectCount(nextCorrect)
    setQIndex((i) => i + 1)
    setSelected(null)
    setTimerKey((k) => k + 1)
  }, [run, useRealtime, socket, wsQuestion, qIndex, selected, correctCount, finishRun, apiQuizQuestions])

  if (!run) {
    return (
      <section className="text-left" aria-label="Quiz">
        <h1 className="text-foreground mb-2 text-xl">No quiz session</h1>
        <p className="text-foreground/80 mb-4 max-w-md text-sm">
          This page needs navigation state from the practice lobby or Tempo flow (Betcha and mode).
          Opening this URL directly will not start a quiz.
        </p>
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <Link
            to="/student/practice"
            className="text-primary underline-offset-2 hover:underline"
          >
            Practice hub
          </Link>
          <Link to="/student" className="text-primary underline-offset-2 hover:underline">
            Student dashboard
          </Link>
        </div>
      </section>
    )
  }

  if (isApiSolo && apiQuizQuestions === null && !apiQuizLoadError) {
    return (
      <section className="text-left" aria-label="Quiz">
        <Spinner label="Loading quiz…" />
      </section>
    )
  }

  if (isApiSolo && apiQuizLoadError) {
    return (
      <section className="text-left" aria-label="Quiz">
        <p className="text-danger text-sm" role="alert">
          {apiQuizLoadError}
        </p>
        <Link to="/student/practice" className="text-primary mt-4 inline-block text-sm underline">
          Back to practice
        </Link>
      </section>
    )
  }

  if (isApiSolo && apiQuizQuestions && apiQuizQuestions.length === 0) {
    return (
      <section className="text-left" aria-label="Quiz">
        <p className="text-foreground/80 text-sm">This quiz has no questions to display.</p>
        <Link to="/student/practice" className="text-primary mt-4 inline-block text-sm underline">
          Back to practice
        </Link>
      </section>
    )
  }

  const question = useRealtime ? wsQuestion : run?.api ? apiQuizQuestions?.[qIndex] : mockQuizQuestions[qIndex]
  if (!question) {
    return (
      <section className="text-left" aria-label="Quiz">
        <p className="text-foreground/80 text-sm">
          {useRealtime ? 'Connecting to quiz room…' : 'No question loaded.'}
        </p>
        {wsError ? (
          <p className="text-danger mt-2 text-sm" role="alert">
            {wsError}
          </p>
        ) : null}
      </section>
    )
  }

  const apiOrWsConfigured =
    Boolean(import.meta.env.VITE_WS_BASE_URL?.trim()) || Boolean(getApiBaseUrl())
  const showSocketDemoHint = isDemoQuizRoomId(decodedRoomId)
  const showSocketConfigHint = useRealtime && !socket && !apiOrWsConfigured

  const soloTotalLabel = run?.api
    ? String(apiQuizQuestions?.length ?? 0)
    : String(mockQuizQuestions.length)

  const questionLabel = useRealtime
    ? `Question ${wsIndex + 1} of ${wsTotal || '…'}`
    : `Question ${qIndex + 1} of ${soloTotalLabel}`

  return (
    <section className="text-left" aria-label="Quiz">
      <nav className="text-foreground/70 mb-4 text-sm" aria-label="Breadcrumb">
        <Link to="/student/practice" className="text-primary hover:underline">
          Practice
        </Link>
        <span className="mx-2">/</span>
        <span className="font-mono text-foreground/80">{decodedRoomId}</span>
      </nav>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-foreground/65 text-xs uppercase tracking-wide">
            {run.mode} · Room
          </p>
          <h1 className="text-foreground text-xl">{run.courseName ?? 'Quiz'}</h1>
        </div>
        <FinnMascot mood={finnMood} isSpeaking={reading} />
      </div>

      {betchaError ? (
        <p className="text-danger mb-4 max-w-xl text-sm" role="alert">
          {betchaError}
        </p>
      ) : null}
      {wsError ? (
        <p className="text-danger mb-4 max-w-xl text-sm" role="alert">
          {wsError}
        </p>
      ) : null}

      <div className="mb-6 max-w-lg">
        <BetchaSelector
          value={run.betcha}
          onChange={() => {}}
          locked={betchaLocked}
          disabled={!!run.api}
        />
      </div>

      <div className="mx-auto mb-4 flex w-full max-w-2xl flex-wrap items-center justify-between gap-4">
        <p className="text-foreground/70 text-sm">{questionLabel}</p>
        <CountdownTimer
          key={timerKey}
          seconds={countdownSeconds}
          onExpire={() => void submitOrTimeoutFixed()}
        />
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <QuestionCard
          question={question}
          selectedIndex={selected}
          onSelect={setSelected}
          disabled={reading}
          focusResetKey={useRealtime ? question.id : qIndex}
        />
      </div>

      <div className="mx-auto mt-6 w-full max-w-2xl">
        <Button
          type="button"
          variant="secondary"
          disabled={selected === null || reading}
          onClick={() => void submitOrTimeoutFixed()}
        >
          Lock answer
        </Button>
      </div>

      {showSocketDemoHint ? (
        <p className="text-foreground/60 mt-4 max-w-xl text-xs">
          Live quiz-room Socket.IO is skipped for <span className="font-mono">mock-*</span> room ids so local demos
          stay quiet.
        </p>
      ) : null}
      {showSocketConfigHint ? (
        <p className="text-foreground/60 mt-4 max-w-xl text-xs">
          Set <span className="font-mono">VITE_API_BASE_URL</span> or{' '}
          <span className="font-mono">VITE_WS_BASE_URL</span> to enable the quiz-room client for this room.
        </p>
      ) : null}
    </section>
  )
}
