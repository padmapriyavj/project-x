import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/FormField'
import { SimpleModal } from '@/components/ui/SimpleModal'
import {
  addMaterial,
  type MaterialType,
  updateMaterial,
} from '@/lib/courseContentLocal'

type Props = {
  courseId: number
  isOpen: boolean
  onClose: () => void
  onUploaded?: () => void
}

function guessType(name: string): MaterialType {
  const n = name.toLowerCase()
  if (n.endsWith('.pdf')) return 'pdf'
  if (n.endsWith('.ppt') || n.endsWith('.pptx')) return 'ppt'
  return 'ppt'
}

function isAllowedFilename(name: string): boolean {
  const n = name.toLowerCase()
  return n.endsWith('.pdf') || n.endsWith('.ppt') || n.endsWith('.pptx')
}

export function UploadMaterialModal({ courseId, isOpen, onClose, onUploaded }: Props) {
  const [filename, setFilename] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setFilename('')
    setExcerpt('')
    setBusy(false)
  }

  const finish = useCallback(() => {
    reset()
    onClose()
  }, [onClose])

  const simulateUpload = useCallback(
    (name: string, text: string) => {
      const type = guessType(name)
      const row = addMaterial({
        courseId,
        filename: name || 'material',
        type,
        processingStatus: 'processing',
        excerpt: text || undefined,
      })
      setBusy(true)
      window.setTimeout(() => {
        updateMaterial(row.id, { processingStatus: 'ready' })
        setBusy(false)
        onUploaded?.()
        finish()
      }, 900)
    },
    [courseId, finish, onUploaded],
  )

  const onPickFiles = (files: FileList | null) => {
    if (!files?.length) return
    const f = files[0]
    if (!isAllowedFilename(f.name)) return
    setFilename(f.name)
    const placeholder =
      excerpt.trim() ||
      `Uploaded: ${f.name} (${Math.round(f.size / 1024)} KB). Optional note below is stored locally for demos.`
    simulateUpload(f.name, placeholder)
  }

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (!filename.trim()) return
    if (!isAllowedFilename(filename.trim())) return
    simulateUpload(filename.trim(), excerpt)
  }

  return (
    <SimpleModal title="Upload course material" isOpen={isOpen} onClose={finish}>
      <p className="text-foreground/70 mb-4 text-sm">
        PDF and PowerPoint only (.pdf, .ppt, .pptx), matching the platform upload rules.
      </p>
      <div
        className={`border-divider mb-4 rounded-[var(--radius-md)] border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'bg-background/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          onPickFiles(e.dataTransfer.files)
        }}
      >
        <p className="text-foreground/80 mb-2 text-sm">Drag a file here or</p>
        <label className="inline-block">
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.ppt,.pptx"
            onChange={(e) => onPickFiles(e.target.files)}
          />
          <span className="text-primary cursor-pointer text-sm font-semibold underline-offset-2 hover:underline">
            choose file
          </span>
        </label>
      </div>
      <form onSubmit={submitManual} className="space-y-4">
        <TextField
          id="material-filename"
          label="Display name"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Week3-slides.pdf"
        />
        <div className="space-y-1">
          <label htmlFor="material-excerpt" className="mb-0.5 block text-sm font-medium text-foreground">
            Note (optional, local demo)
          </label>
          <textarea
            id="material-excerpt"
            rows={4}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Optional short note stored with this upload in the browser…"
            className="border-divider bg-surface text-foreground placeholder:text-foreground/40 min-h-[5.5rem] w-full resize-y rounded-[var(--radius-sm)] border px-3 py-2.5 text-sm outline-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={finish} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={busy || !filename.trim() || !isAllowedFilename(filename.trim())}
          >
            {busy ? 'Processing…' : 'Add material'}
          </Button>
        </div>
      </form>
    </SimpleModal>
  )
}
