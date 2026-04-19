import type { MockQuestion } from '@/lib/mocks/quizRun'

type Props = {
  question: MockQuestion
  selectedIndex: number | null
  onSelect: (index: number) => void
  disabled?: boolean
}

export function QuestionCard({
  question,
  selectedIndex,
  onSelect,
  disabled,
}: Props) {
  return (
    <div className="bg-surface border-divider/60 rounded-[var(--radius-lg)] border p-6 text-left">
      <h2 className="font-heading text-foreground mb-4 text-lg leading-snug">
        {question.prompt}
      </h2>
      <ul className="space-y-2">
        {question.choices.map((c, i) => {
          const selected = selectedIndex === i
          return (
            <li key={i}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(i)}
                className={`border-divider text-foreground hover:border-primary/40 w-full rounded-[var(--radius-sm)] border px-4 py-3 text-left text-sm transition-colors ${
                  selected ? 'border-primary bg-primary/10 ring-primary/25 ring-2' : ''
                } ${disabled ? 'opacity-60' : ''}`}
              >
                <span className="font-mono text-foreground/60 mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {c}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
