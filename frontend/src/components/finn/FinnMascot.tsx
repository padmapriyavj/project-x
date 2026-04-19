import { AnimatePresence, motion } from 'framer-motion'

export type FinnMood =
  | 'neutral'
  | 'thinking'
  | 'celebrating'
  | 'concerned'
  | 'speaking'
  | 'sleeping'

type Props = {
  mood: FinnMood
  /** Extra animation when Finn is reading lines aloud */
  isSpeaking?: boolean
  className?: string
}

function FoxFace({ mood }: { mood: FinnMood }) {
  const tilt = mood === 'concerned' ? -6 : mood === 'thinking' ? 4 : 0
  const eyeClosed = mood === 'sleeping'
  const smile = mood === 'celebrating'
  const worried = mood === 'concerned'

  return (
    <g transform={`rotate(${tilt} 48 42)`}>
      <ellipse cx="16" cy="22" rx="9" ry="15" fill="#c45d2e" transform="rotate(-16 16 22)" />
      <ellipse cx="80" cy="22" rx="9" ry="15" fill="#c45d2e" transform="rotate(16 80 22)" />
      <ellipse cx="48" cy="42" rx="34" ry="30" fill="#e07a3c" />
      <ellipse cx="48" cy="48" rx="28" ry="22" fill="#f4a574" opacity="0.5" />
      {!eyeClosed ? (
        <>
          <circle cx="36" cy="38" r="4" fill="#1e2a44" />
          <circle cx="60" cy="38" r="4" fill="#1e2a44" />
          {mood === 'thinking' ? (
            <path
              d="M58 30 Q62 24 66 30"
              stroke="#1e2a44"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          ) : null}
        </>
      ) : (
        <>
          <path
            d="M32 38 Q36 42 40 38"
            stroke="#1e2a44"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M56 38 Q60 42 64 38"
            stroke="#1e2a44"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {smile ? (
        <path
          d="M34 52 Q48 62 62 52"
          stroke="#1e2a44"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      ) : worried ? (
        <path
          d="M38 54 Q48 48 58 54"
          stroke="#1e2a44"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M38 52 Q48 58 58 52"
          stroke="#1e2a44"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {mood === 'celebrating' ? (
        <g fill="#d4a534" opacity="0.95">
          <circle cx="14" cy="18" r="3" />
          <circle cx="82" cy="14" r="2.5" />
          <circle cx="76" cy="26" r="2" />
          <circle cx="20" cy="26" r="2" />
        </g>
      ) : null}
    </g>
  )
}

function MouthSpeaking() {
  return (
    <motion.ellipse
      cx="48"
      cy="54"
      rx="10"
      ry="7"
      fill="#4a2c1a"
      opacity={0.35}
      animate={{ opacity: [0.35, 0.08, 0.35] }}
      transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

export function FinnMascot({ mood, isSpeaking, className = '' }: Props) {
  const showMouth = (isSpeaking || mood === 'speaking') && mood !== 'sleeping'

  return (
    <div
      className={`relative inline-flex flex-col items-center ${className}`}
      aria-label={`Finn the fox, ${mood} mood`}
    >
      <motion.div
        animate={
          mood === 'celebrating'
            ? { y: [0, -4, 0], rotate: [0, -2, 2, 0] }
            : mood === 'sleeping'
              ? { y: [0, 1, 0] }
              : { y: 0, rotate: 0 }
        }
        transition={{
          duration: mood === 'celebrating' ? 0.9 : 3.2,
          repeat:
            mood === 'celebrating' || mood === 'sleeping' ? Infinity : 0,
          ease: 'easeInOut',
        }}
        className="drop-shadow-md"
      >
        <svg width="120" height="120" viewBox="0 0 96 88" role="img">
          <title>Finn</title>
          <FoxFace mood={mood} />
          <AnimatePresence>
            {showMouth ? <MouthSpeaking key="mouth" /> : null}
          </AnimatePresence>
        </svg>
      </motion.div>
      <p className="text-foreground/70 mt-1 font-mono text-[0.65rem] uppercase tracking-widest">
        {mood}
      </p>
    </div>
  )
}
