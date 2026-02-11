import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { listingsService, type CreateListingPayload } from '@/modules/listings/api/listings.api'
import { Spinner } from '@/shared/ui/spinner'
import { PlusCircle } from 'lucide-react'

interface CreateListingModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

const CURRENCY_OPTIONS = ['RUB', 'USD', 'EUR']

const EMPTY_FORM: CreateListingPayload = {
  url: '',
  title: '',
  description: '',
  price: null,
  currency: 'RUB',
  source: '',
  address: '',
  city: '',
  rooms: null,
  areaTotal: null,
  floor: null,
  floorsTotal: null,
  contactName: '',
  contactPhone: '',
  sourceAuthorUrl: '',
  publishedAt: null,
}

const INPUT_CLASS =
  'h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 transition-all duration-200 focus:border-cyan-400/50 focus:ring-cyan-400/20'

const SELECT_CLASS =
  'h-11 w-full appearance-none rounded-xl border border-white/10 bg-slate-800/50 px-3 text-sm text-white outline-none transition-all duration-200 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20'

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-slate-300">{label}</label>
      {children}
    </div>
  )
}

function CreateListingModal({ isOpen, onClose, onCreated }: CreateListingModalProps) {
  const [form, setForm] = useState<CreateListingPayload>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const setField = <K extends keyof CreateListingPayload>(
    key: K,
    value: CreateListingPayload[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleStringChange =
    (key: keyof CreateListingPayload) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setField(key, e.target.value as CreateListingPayload[typeof key])
    }

  const handleNumberChange =
    (key: keyof CreateListingPayload) => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      if (raw === '') {
        setField(key, null as CreateListingPayload[typeof key])
      } else {
        const n = Number.parseFloat(raw)
        setField(key, (Number.isNaN(n) ? null : n) as CreateListingPayload[typeof key])
      }
    }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.url.trim()) {
      setError('URL объявления обязателен')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await listingsService.createListing({ ...form, url: form.url.trim() })
      setForm(EMPTY_FORM)
      onCreated()
      onClose()
    } catch {
      setError('Не удалось создать объявление. Проверьте данные.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (isSaving) return
    setForm(EMPTY_FORM)
    setError(null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md"
      onClick={handleClose}
    >
      <div
        className="relative my-8 w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glow line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-800/50">
              <PlusCircle className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-monitoring-display text-xl font-semibold text-white">
                Добавить объявление
              </h2>
              <p className="text-sm text-slate-400">Заполните данные вручную</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors duration-200 hover:bg-white/5 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6">
          <LabeledField label="URL объявления *">
            <Input
              value={form.url}
              onChange={handleStringChange('url')}
              placeholder="https://avito.ru/..."
              className={INPUT_CLASS}
              autoFocus
            />
          </LabeledField>

          <LabeledField label="Заголовок">
            <Input
              value={form.title ?? ''}
              onChange={handleStringChange('title')}
              placeholder="1-комн. квартира, 35 м²"
              className={INPUT_CLASS}
            />
          </LabeledField>

          <div className="grid grid-cols-2 gap-3">
            <LabeledField label="Цена">
              <Input
                type="number"
                value={form.price ?? ''}
                onChange={handleNumberChange('price')}
                placeholder="5 000 000"
                className={INPUT_CLASS}
              />
            </LabeledField>
            <LabeledField label="Валюта">
              <select
                className={SELECT_CLASS}
                value={form.currency ?? 'RUB'}
                onChange={handleStringChange('currency')}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </LabeledField>
          </div>

          <LabeledField label="Источник">
            <Input
              value={form.source ?? ''}
              onChange={handleStringChange('source')}
              placeholder="avito, cian, youla…"
              className={INPUT_CLASS}
            />
          </LabeledField>

          <div className="grid grid-cols-2 gap-3">
            <LabeledField label="Город">
              <Input
                value={form.city ?? ''}
                onChange={handleStringChange('city')}
                placeholder="Москва"
                className={INPUT_CLASS}
              />
            </LabeledField>
            <LabeledField label="Адрес">
              <Input
                value={form.address ?? ''}
                onChange={handleStringChange('address')}
                placeholder="ул. Ленина, 1"
                className={INPUT_CLASS}
              />
            </LabeledField>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <LabeledField label="Комнат">
              <Input
                type="number"
                value={form.rooms ?? ''}
                onChange={handleNumberChange('rooms')}
                placeholder="2"
                className={INPUT_CLASS}
              />
            </LabeledField>
            <LabeledField label="Площадь м²">
              <Input
                type="number"
                value={form.areaTotal ?? ''}
                onChange={handleNumberChange('areaTotal')}
                placeholder="52"
                className={INPUT_CLASS}
              />
            </LabeledField>
            <LabeledField label="Этаж">
              <Input
                type="number"
                value={form.floor ?? ''}
                onChange={handleNumberChange('floor')}
                placeholder="5"
                className={INPUT_CLASS}
              />
            </LabeledField>
            <LabeledField label="Этажей">
              <Input
                type="number"
                value={form.floorsTotal ?? ''}
                onChange={handleNumberChange('floorsTotal')}
                placeholder="10"
                className={INPUT_CLASS}
              />
            </LabeledField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LabeledField label="Имя контакта">
              <Input
                value={form.contactName ?? ''}
                onChange={handleStringChange('contactName')}
                placeholder="Иван Иванов"
                className={INPUT_CLASS}
              />
            </LabeledField>
            <LabeledField label="Телефон">
              <Input
                value={form.contactPhone ?? ''}
                onChange={handleStringChange('contactPhone')}
                placeholder="+7 999 000 00 00"
                className={INPUT_CLASS}
              />
            </LabeledField>
          </div>

          <LabeledField label="URL автора">
            <Input
              value={form.sourceAuthorUrl ?? ''}
              onChange={handleStringChange('sourceAuthorUrl')}
              placeholder="https://vk.com/id123"
              className={INPUT_CLASS}
            />
          </LabeledField>

          <LabeledField label="Дата публикации">
            <Input
              type="date"
              value={form.publishedAt ? form.publishedAt.slice(0, 10) : ''}
              onChange={(e) => {
                const val = e.target.value
                setField('publishedAt', val ? `${val}T00:00:00.000Z` : null)
              }}
              className={INPUT_CLASS}
            />
          </LabeledField>

          <LabeledField label="Описание">
            <textarea
              value={form.description ?? ''}
              onChange={handleStringChange('description')}
              placeholder="Описание объявления…"
              rows={3}
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 [scrollbar-color:rgba(255,255,255,0.25)_transparent] [scrollbar-width:thin]"
            />
          </LabeledField>

          {/* Error */}
          {error && (
            <div className="animate-in slide-in-from-top-2 fade-in-0 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <span className="font-mono-accent">⚠</span> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSaving}
              className="h-11 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="group relative h-11 overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative flex items-center gap-2">
                {isSaving ? (
                  <>
                    <Spinner className="size-4" />
                    Сохраняем…
                  </>
                ) : (
                  'Добавить'
                )}
              </span>
            </Button>
          </div>
        </form>

        {/* Bottom accent line */}
        <div className="h-px bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
      </div>
    </div>
  )
}

export default CreateListingModal
