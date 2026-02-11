import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { listingsService } from '@/modules/listings/api/listings.api'
import type { IListing, ListingUpdatePayload } from '@/shared/types'

type Props = {
  listing: IListing | null
  onClose: () => void
  onUpdated: () => void
}

interface FormState {
  title: string
  url: string
  description: string
  source: string
  price: string
  currency: string
  city: string
  address: string
  latitude: string
  longitude: string
  rooms: string
  areaTotal: string
  areaLiving: string
  areaKitchen: string
  floor: string
  floorsTotal: string
  contactName: string
  contactPhone: string
  sourceAuthorName: string
  sourceAuthorPhone: string
  sourceAuthorUrl: string
  publishedAt: string
  sourcePostedAt: string
  manualNote: string
}

function toFormState(listing: IListing): FormState {
  return {
    title: listing.title ?? '',
    url: listing.url ?? '',
    description: listing.description ?? '',
    source: listing.source ?? '',
    price: listing.price != null ? String(listing.price) : '',
    currency: listing.currency ?? '',
    city: listing.city ?? '',
    address: listing.address ?? '',
    latitude: listing.latitude != null ? String(listing.latitude) : '',
    longitude: listing.longitude != null ? String(listing.longitude) : '',
    rooms: listing.rooms != null ? String(listing.rooms) : '',
    areaTotal: listing.areaTotal != null ? String(listing.areaTotal) : '',
    areaLiving: listing.areaLiving != null ? String(listing.areaLiving) : '',
    areaKitchen: listing.areaKitchen != null ? String(listing.areaKitchen) : '',
    floor: listing.floor != null ? String(listing.floor) : '',
    floorsTotal: listing.floorsTotal != null ? String(listing.floorsTotal) : '',
    contactName: listing.contactName ?? '',
    contactPhone: listing.contactPhone ?? '',
    sourceAuthorName: listing.sourceAuthorName ?? '',
    sourceAuthorPhone: listing.sourceAuthorPhone ?? '',
    sourceAuthorUrl: listing.sourceAuthorUrl ?? '',
    publishedAt: listing.publishedAt ? listing.publishedAt.slice(0, 16) : '',
    sourcePostedAt: listing.sourcePostedAt ?? '',
    manualNote: listing.manualNote ?? '',
  }
}

function buildPayload(form: FormState, original: IListing): ListingUpdatePayload {
  const payload: ListingUpdatePayload = {}

  const str = (val: string): string | null => val.trim() || null
  const num = (val: string): number | null => {
    const n = Number(val.trim())
    return val.trim() !== '' && Number.isFinite(n) ? n : null
  }

  if ((str(form.title) ?? null) !== (original.title ?? null)) payload.title = str(form.title)
  if ((str(form.url) ?? '') !== original.url) payload.url = form.url.trim() || undefined
  if ((str(form.description) ?? null) !== (original.description ?? null))
    payload.description = str(form.description)
  if ((str(form.source) ?? null) !== (original.source ?? null)) payload.source = str(form.source)
  if (num(form.price) !== (original.price ?? null)) payload.price = num(form.price)
  if ((str(form.currency) ?? null) !== (original.currency ?? null))
    payload.currency = str(form.currency)
  if ((str(form.city) ?? null) !== (original.city ?? null)) payload.city = str(form.city)
  if ((str(form.address) ?? null) !== (original.address ?? null))
    payload.address = str(form.address)
  if (num(form.latitude) !== (original.latitude ?? null)) payload.latitude = num(form.latitude)
  if (num(form.longitude) !== (original.longitude ?? null)) payload.longitude = num(form.longitude)
  if (num(form.rooms) !== (original.rooms ?? null))
    payload.rooms = num(form.rooms) !== null ? Math.round(num(form.rooms)!) : null
  if (num(form.areaTotal) !== (original.areaTotal ?? null)) payload.areaTotal = num(form.areaTotal)
  if (num(form.areaLiving) !== (original.areaLiving ?? null))
    payload.areaLiving = num(form.areaLiving)
  if (num(form.areaKitchen) !== (original.areaKitchen ?? null))
    payload.areaKitchen = num(form.areaKitchen)
  if (num(form.floor) !== (original.floor ?? null))
    payload.floor = num(form.floor) !== null ? Math.round(num(form.floor)!) : null
  if (num(form.floorsTotal) !== (original.floorsTotal ?? null))
    payload.floorsTotal = num(form.floorsTotal) !== null ? Math.round(num(form.floorsTotal)!) : null
  if ((str(form.contactName) ?? null) !== (original.contactName ?? null))
    payload.contactName = str(form.contactName)
  if ((str(form.contactPhone) ?? null) !== (original.contactPhone ?? null))
    payload.contactPhone = str(form.contactPhone)
  if ((str(form.sourceAuthorName) ?? null) !== (original.sourceAuthorName ?? null))
    payload.sourceAuthorName = str(form.sourceAuthorName)
  if ((str(form.sourceAuthorPhone) ?? null) !== (original.sourceAuthorPhone ?? null))
    payload.sourceAuthorPhone = str(form.sourceAuthorPhone)
  if ((str(form.sourceAuthorUrl) ?? null) !== (original.sourceAuthorUrl ?? null))
    payload.sourceAuthorUrl = str(form.sourceAuthorUrl)
  if ((str(form.sourcePostedAt) ?? null) !== (original.sourcePostedAt ?? null))
    payload.sourcePostedAt = str(form.sourcePostedAt)
  if ((str(form.manualNote) ?? null) !== (original.manualNote ?? null))
    payload.manualNote = str(form.manualNote)

  const publishedAtVal = form.publishedAt.trim() ? new Date(form.publishedAt).toISOString() : null
  const originalPublishedAt = original.publishedAt ?? null
  if (publishedAtVal !== originalPublishedAt) payload.publishedAt = publishedAtVal

  return payload
}

// ─── Field helpers ────────────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </label>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
      {children}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FullEditListingModal({ listing, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!listing) {
      setForm(null)
      setSaving(false)
      return
    }
    setForm(toFormState(listing))
  }, [listing])

  if (!listing || !form) return null

  const set =
    (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => prev && { ...prev, [field]: e.target.value })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (saving) return

    const payload = buildPayload(form, listing)
    if (Object.keys(payload).length === 0) {
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2 className="font-monitoring-display text-xl font-semibold text-white">
              Редактировать объявление
            </h2>
            <p className="mt-1 max-w-[420px] truncate text-sm text-slate-400">{listing.url}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors duration-200 hover:bg-white/5 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
          {/* Main */}
          <Section title="Основное">
            <Field label="Заголовок">
              <input
                className={inputClass}
                value={form.title}
                onChange={set('title')}
                placeholder="Заголовок объявления"
              />
            </Field>
            <Field label="URL">
              <input
                className={inputClass}
                value={form.url}
                onChange={set('url')}
                placeholder="https://..."
              />
            </Field>
            <Field label="Источник">
              <input
                className={inputClass}
                value={form.source}
                onChange={set('source')}
                placeholder="vk, avito, …"
              />
            </Field>
            <Field label="Описание">
              <textarea
                className={`${inputClass} resize-y`}
                rows={3}
                value={form.description}
                onChange={set('description')}
                placeholder="Описание"
              />
            </Field>
          </Section>

          {/* Price */}
          <Section title="Цена">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Цена">
                <input
                  className={inputClass}
                  type="number"
                  value={form.price}
                  onChange={set('price')}
                  placeholder="0"
                />
              </Field>
              <Field label="Валюта">
                <input
                  className={inputClass}
                  value={form.currency}
                  onChange={set('currency')}
                  placeholder="₽"
                />
              </Field>
            </div>
          </Section>

          {/* Location */}
          <Section title="Расположение">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Город">
                <input
                  className={inputClass}
                  value={form.city}
                  onChange={set('city')}
                  placeholder="Москва"
                />
              </Field>
              <Field label="Адрес">
                <input
                  className={inputClass}
                  value={form.address}
                  onChange={set('address')}
                  placeholder="ул. Примерная, 1"
                />
              </Field>
              <Field label="Широта">
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={set('latitude')}
                  placeholder="55.7558"
                />
              </Field>
              <Field label="Долгота">
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={set('longitude')}
                  placeholder="37.6173"
                />
              </Field>
            </div>
          </Section>

          {/* Property */}
          <Section title="Параметры">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Комнат">
                <input
                  className={inputClass}
                  type="number"
                  value={form.rooms}
                  onChange={set('rooms')}
                  placeholder="1"
                />
              </Field>
              <Field label="Площадь общая">
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  value={form.areaTotal}
                  onChange={set('areaTotal')}
                  placeholder="50"
                />
              </Field>
              <Field label="Площадь жилая">
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  value={form.areaLiving}
                  onChange={set('areaLiving')}
                  placeholder="30"
                />
              </Field>
              <Field label="Площадь кухни">
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  value={form.areaKitchen}
                  onChange={set('areaKitchen')}
                  placeholder="10"
                />
              </Field>
              <Field label="Этаж">
                <input
                  className={inputClass}
                  type="number"
                  value={form.floor}
                  onChange={set('floor')}
                  placeholder="5"
                />
              </Field>
              <Field label="Этажей в доме">
                <input
                  className={inputClass}
                  type="number"
                  value={form.floorsTotal}
                  onChange={set('floorsTotal')}
                  placeholder="9"
                />
              </Field>
            </div>
          </Section>

          {/* Contact */}
          <Section title="Контакт">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Имя">
                <input
                  className={inputClass}
                  value={form.contactName}
                  onChange={set('contactName')}
                  placeholder="Иван Иванов"
                />
              </Field>
              <Field label="Телефон">
                <input
                  className={inputClass}
                  value={form.contactPhone}
                  onChange={set('contactPhone')}
                  placeholder="+7..."
                />
              </Field>
            </div>
          </Section>

          {/* Source author */}
          <Section title="Автор источника">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Имя автора">
                <input
                  className={inputClass}
                  value={form.sourceAuthorName}
                  onChange={set('sourceAuthorName')}
                  placeholder="Имя"
                />
              </Field>
              <Field label="Телефон автора">
                <input
                  className={inputClass}
                  value={form.sourceAuthorPhone}
                  onChange={set('sourceAuthorPhone')}
                  placeholder="+7..."
                />
              </Field>
            </div>
            <Field label="URL автора">
              <input
                className={inputClass}
                value={form.sourceAuthorUrl}
                onChange={set('sourceAuthorUrl')}
                placeholder="https://vk.com/..."
              />
            </Field>
          </Section>

          {/* Dates */}
          <Section title="Даты">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Дата публикации">
                <input
                  className={inputClass}
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={set('publishedAt')}
                />
              </Field>
              <Field label="Дата публикации (текст)">
                <input
                  className={inputClass}
                  value={form.sourcePostedAt}
                  onChange={set('sourcePostedAt')}
                  placeholder="вчера в 18:00"
                />
              </Field>
            </div>
          </Section>

          {/* Note */}
          <Section title="Заметка">
            <Field label="Ручное примечание">
              <textarea
                className={`${inputClass} resize-y`}
                rows={3}
                value={form.manualNote}
                onChange={set('manualNote')}
                placeholder="Например, уточнения по контакту…"
              />
            </Field>
          </Section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={saving}
              className="h-10 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="group relative h-10 overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative flex items-center gap-2">
                {saving ? (
                  <>
                    <Spinner className="size-4" />
                    Сохраняем…
                  </>
                ) : (
                  'Сохранить'
                )}
              </span>
            </Button>
          </div>
        </form>

        {/* Bottom accent */}
        <div className="h-px bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
      </div>
    </div>
  )
}
