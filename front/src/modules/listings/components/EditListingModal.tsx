import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { listingsService } from '@/modules/listings/api/listings.api'
import type { IListing, ListingUpdatePayload } from '@/shared/types'

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

  if (!isOpen || !listing) return null

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glow line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2 className="font-monitoring-display text-xl font-semibold text-white">
              Ручное примечание
            </h2>
            <p className="mt-1 truncate text-sm text-slate-400">{listing.url}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors duration-200 hover:bg-white/5 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-300">
                Примечание
              </label>
              <textarea
                value={note}
                onChange={handleChange}
                rows={5}
                className="w-full resize-y rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 [scrollbar-color:rgba(255,255,255,0.25)_transparent] [scrollbar-width:thin]"
                placeholder="Например, уточнения по контакту, текущие договорённости и т.п."
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={saving}
                className="h-11 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="group relative h-11 overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative flex items-center gap-2">
                  {saving ? (
                    <>
                      <Spinner className="size-4" />
                      Сохраняем…
                    </>
                  ) : (
                    'Сохранить примечание'
                  )}
                </span>
              </Button>
            </div>
          </div>
        </form>

        {/* Bottom accent line */}
        <div className="h-px bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
      </div>
    </div>
  )
}

export default EditListingModal
