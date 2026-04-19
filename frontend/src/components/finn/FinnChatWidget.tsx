import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'

function publicMascotUrl(filename: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}mascot/${filename}`
}

export function FinnChatWidget() {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const isOnCoachPage = location.pathname === '/coach'

  if (isOnCoachPage) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={isHovered ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.9 }}
        className="bg-surface border-divider/60 shadow-soft pointer-events-none absolute -top-12 right-0 whitespace-nowrap rounded-lg border px-3 py-2"
      >
        <p className="text-foreground text-sm font-medium">Chat with Finn</p>
        <div
          className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
        />
      </motion.div>

      {/* Floating button */}
      <motion.button
        type="button"
        onClick={() => navigate('/coach')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="bg-surface border-primary/30 shadow-soft hover:border-primary/60 group relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Chat with Finn"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Idle breathing animation */}
        <motion.div
          animate={{
            y: [0, -2, 0],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <img
            src={publicMascotUrl('kit-happy.svg')}
            width={48}
            height={48}
            alt=""
            className="pointer-events-none block select-none"
            decoding="async"
            draggable={false}
          />
        </motion.div>

        {/* Notification dot */}
        <span className="bg-primary absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
          ?
        </span>
      </motion.button>
    </div>
  )
}
