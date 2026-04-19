import { useState } from 'react'

import { Button } from '@/components/ui/Button'

type JoinCodeDisplayProps = {
  courseId: number
  code: string
}

function buildJoinUrl(courseId: number): string {
  if (typeof window === 'undefined') return `/join/${courseId}`
  return `${window.location.origin}/join/${courseId}`
}

export function JoinCodeDisplay({ courseId, code }: JoinCodeDisplayProps) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const joinUrl = buildJoinUrl(courseId)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = joinUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  return (
    <div className="border-divider/60 bg-background flex w-full max-w-full flex-col gap-3 rounded-[var(--radius-md)] border p-4 sm:max-w-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-foreground/60 text-xs font-medium uppercase tracking-wide">Join code</p>
          <p className="text-foreground font-mono text-lg font-bold tracking-widest break-all">{code}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => void copyCode()} className="shrink-0">
          {copiedCode ? 'Copied!' : 'Copy code'}
        </Button>
      </div>
      <div className="border-divider/40 border-t pt-3">
        <p className="text-foreground/60 mb-1 text-xs font-medium uppercase tracking-wide">
          Student invite link
        </p>
        <p className="text-foreground/85 mb-2 break-all font-mono text-xs">{joinUrl}</p>
        <p className="text-foreground/60 mb-3 text-xs">
          Students open this link, then enter the join code above — no course ID to type.
        </p>
        <Button type="button" size="sm" onClick={() => void copyLink()} className="w-full sm:w-auto">
          {copiedLink ? 'Link copied!' : 'Copy invite link'}
        </Button>
      </div>
    </div>
  )
}
