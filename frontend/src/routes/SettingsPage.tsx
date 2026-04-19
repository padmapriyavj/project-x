import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { TextField } from '@/components/ui/FormField'
import { patchProfile } from '@/lib/authApi'
import { useAuthStore } from '@/stores/authStore'

const VOICE_KEY = 'deductible:voiceFinnEnabled'

export function SettingsPage() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [voiceOn, setVoiceOn] = useState(() => localStorage.getItem(VOICE_KEY) !== 'false')

  useEffect(() => {
    setDisplayName(user?.display_name ?? '')
  }, [user])

  useEffect(() => {
    localStorage.setItem(VOICE_KEY, voiceOn ? 'true' : 'false')
  }, [voiceOn])

  const save = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Not signed in')
      return patchProfile(token, {
        display_name: displayName.trim(),
      })
    },
    onSuccess: () => void refreshUser(),
  })

  return (
    <div className="text-left">
      <nav className="mb-6">
        <Link
          to={user?.role === 'professor' ? '/professor' : '/student'}
          className="text-primary inline-flex min-h-11 items-center text-sm underline"
        >
          &larr; Dashboard
        </Link>
      </nav>

      <PageHeader title="Settings" description="Update your display name and voice preferences." />

      <div className="mx-auto max-w-lg space-y-6">
        <Card padding="lg" className="space-y-4">
          <h2 className="font-heading text-lg">Profile</h2>
          <TextField
            id="settings-name"
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <p className="text-foreground/60 text-sm">Email: {user?.email ?? '—'}</p>
        </Card>

        <Card padding="lg" className="space-y-4">
          <h2 className="font-heading text-lg">Voice</h2>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} />
            Finn voice enabled in quizzes and coach
          </label>
        </Card>

        {save.isError ? (
          <p className="text-danger text-sm" role="alert">
            {save.error instanceof Error ? save.error.message : 'Save failed'}
          </p>
        ) : null}

        <Button type="button" disabled={save.isPending || !token} onClick={() => save.mutate()}>
          {save.isPending ? 'Saving…' : 'Save profile'}
        </Button>
      </div>
    </div>
  )
}
