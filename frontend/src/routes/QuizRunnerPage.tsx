import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { useQuizRoomConnection } from '@/hooks/useQuizRoomConnection'
import { BetchaSelector } from '@/components/betcha/BetchaSelector'
import type { FinnMood } from '@/components/finn/FinnMascot'
import { FinnMascot } from '@/components/finn/FinnMascot'
import { CountdownTimer } from '@/components/quiz/CountdownTimer'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import {
  mockQuizQuestions,
  type QuizRunLocationState,
  type QuizResultsLocationState,
} from '@/lib/mocks/quizRun'
import { QUIZ_SERVER_EVENTS } from '@/lib/realtime/quizRoom'
import {
  speakEndQuizSummary,
  speakQuizQuestionRead,
  speakWrongAnswerReframe,
} from '@/lib/voice/quizVoice'

const QUESTION_SECONDS = 45

export function QuizRunnerPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const socket = useQuizRoomConnection(roomId)
  const location = useLocation()
  const navigate = useNavigate()
  const run = location.state as QuizRunLocationState | null

  const [betchaLocked, setBetchaLocked] = useState(false)
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finnMood, setFinnMood] = useState<FinnMood>('neutral')
  const [timerKey, setTimerKey] = useState(0)
  const [reading, setReading] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (!run) return
    const q = mockQuizQuestions[qIndex]
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
  }, [qIndex, run])

  useEffect(() => {
    if (!run || started.current) return
    started.current = true
    setBetchaLocked(true)
  }, [run])

  useEffect(() => {
    if (!socket) return
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
  }, [socket])

  const finishRun = useCallback(
    async (finalCorrect: number) => {
      const total = mockQuizQuestions.length
      const pct = Math.round((finalCorrect / total) * 100)
      const betcha = run?.betcha ?? 1
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
      navigate(`/student/quiz/${roomId}/results`, { state: results })
    },
    [navigate, roomId, run?.betcha, run?.mode],
  )

  const submitOrTimeoutFixed = useCallback(async () => {
    if (!run) return
    const question = mockQuizQuestions[qIndex]
    if (!question) return

    const ok = selected !== null && selected === question.correctIndex
    if (!ok && selected !== null) {
      setFinnMood('concerned')
      await speakWrongAnswerReframe(
        "Not quite — that's okay. Take a breath and we'll move to the next one.",
      )
      setFinnMood('neutral')
    }

    const nextCorrect = correctCount + (ok ? 1 : 0)
    const isLast = qIndex + 1 >= mockQuizQuestions.length
    if (isLast) {
      await finishRun(nextCorrect)
      return
    }
    setCorrectCount(nextCorrect)
    setQIndex((i) => i + 1)
    setSelected(null)
    setTimerKey((k) => k + 1)
  }, [run, qIndex, selected, correctCount, finishRun])

  if (!run) {
    return (
      <section className="text-left">
        <p className="text-foreground/80 mb-4 text-sm">
          Start a quiz from the practice lobby so Betcha and mode are set.
        </p>
        <Link to="/student/practice" className="text-primary text-sm font-medium underline">
          Go to practice hub
        </Link>
      </section>
    )
  }

  const question = mockQuizQuestions[qIndex]
  if (!question) {
    return null
  }

  return (
    <section className="text-left">
      <nav className="text-foreground/70 mb-4 text-sm">
        <Link to="/student/practice" className="text-primary hover:underline">
          Practice
        </Link>
        <span className="mx-2">/</span>
        <span className="font-mono text-foreground/80">{roomId}</span>
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

      <div className="mb-6 max-w-lg">
        <BetchaSelector
          value={run.betcha}
          onChange={() => {}}
          locked={betchaLocked}
          disabled
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-foreground/70 text-sm">
          Question {qIndex + 1} of {mockQuizQuestions.length}
        </p>
        <CountdownTimer
          key={timerKey}
          seconds={QUESTION_SECONDS}
          onExpire={() => void submitOrTimeoutFixed()}
        />
      </div>

      <QuestionCard
        question={question}
        selectedIndex={selected}
        onSelect={setSelected}
        disabled={reading}
      />

      <button
        type="button"
        className="bg-secondary text-surface mt-6 rounded-[var(--radius-sm)] px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
        disabled={selected === null || reading}
        onClick={() => void submitOrTimeoutFixed()}
      >
        Lock answer
      </button>
    </section>
  )
}
