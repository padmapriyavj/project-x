import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/FormField'
import { SimpleModal } from '@/components/ui/SimpleModal'
import { addNotification, addTempo } from '@/lib/courseContentLocal'

type Props = {
  courseId: number
  lessonId: string
  courseName: string
  isOpen: boolean
  onClose: () => void
}

export function ScheduleTempoModal({ courseId, lessonId, courseName, isOpen, onClose }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('12:00')

  const schedule = () => {
    const iso = new Date(`${date}T${time}:00`).toISOString()
    addTempo({ courseId, lessonId, scheduledAt: iso })
    addNotification({
      title: 'Tempo scheduled',
      body: `Tempo for ${courseName} scheduled.`,
      type: 'tempo',
    })
    onClose()
  }

  const fireNow = () => {
    addTempo({ courseId, lessonId, scheduledAt: new Date().toISOString(), status: 'live' })
    addNotification({
      title: 'Tempo live',
      body: `Dev: Tempo fired now for ${courseName}.`,
      type: 'tempo',
    })
    onClose()
  }

  return (
    <SimpleModal title="Schedule Tempo" isOpen={isOpen} onClose={onClose}>
      <p className="text-foreground/70 mb-4 text-sm">
        Pick a delivery window (stored locally for demo). Use Fire now for judges (PRD dev override).
      </p>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField id="tempo-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField id="tempo-time" label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" onClick={schedule}>
          Schedule
        </Button>
        <Button type="button" variant="secondary" onClick={fireNow}>
          Fire now (dev)
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Skip
        </Button>
      </div>
    </SimpleModal>
  )
}
