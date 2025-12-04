import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
// Использование services для одноразовой операции (обновление объявления)
// Это допустимо согласно правилам архитектуры для операций, не требующих состояния
import { listingsService } from '@/services/listingsService'
import type { IListing, ListingUpdatePayload } from '@/types/api'

type Props = {
  listing: IListing | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

function EditListingModal({ listing, isOpen, onClose, onUpdated }: Props) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen || !listing) {
      setNote('')
      setSaving(false)
      return
    }
    setNote(listing.manualNote ?? '')
  }, [isOpen, listing])

  if (!isOpen || !listing) {
    return null
  }

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setNote(event.target.value)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    const payload: ListingUpdatePayload = {}
    const normalizedNote = note.trim()
    const currentNote = listing.manualNote ?? ''
    if (normalizedNote !== currentNote.trim()) {
      payload.manualNote = normalizedNote.length > 0 ? normalizedNote : null
    }

    if (Object.keys(payload).length === 0) {
      toast.success('Изменений нет')
      onClose()
      return
    }

    setSaving(true)
    try {
      await listingsService.updateListing(listing.id, payload)
      onUpdated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border/70 bg-background-primary text-text-primary shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border/40 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold">Ручное примечание</h2>
            <p className="text-sm text-text-secondary">{listing.url}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-background-primary/50 px-3 py-1 text-lg text-text-secondary transition-colors hover:text-text-primary"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-text-secondary">Примечание</label>
              <textarea
                value={note}
                onChange={handleChange}
                className="min-h-40 w-full resize-y rounded-xl border border-border/60 bg-background-primary/95 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/70 [scrollbar-color:rgba(255,255,255,0.25)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb:hover]:bg-white/30 [&::-webkit-scrollbar-track]:bg-transparent"
                placeholder="Например, уточнения по контакту, текущие договоренности и т.п."
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-border/40 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="size-4" />
                  Сохраняем…
                </span>
              ) : (
                'Сохранить примечание'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditListingModal
