import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { listingsService } from '@/services/listingsService'
import type { IListing, ListingUpdatePayload } from '@/types/api'

type Props = {
  listing: IListing | null
  isOpen: boolean
  onClose: () => void
  onUpdated: (listing: IListing) => void
}

type FormState = {
  title: string
  description: string
  price: string
  currency: string
  city: string
  address: string
  contactName: string
  contactPhone: string
}

const initialState: FormState = {
  title: '',
  description: '',
  price: '',
  currency: '',
  city: '',
  address: '',
  contactName: '',
  contactPhone: '',
}

const toNullable = (value: string): string | null => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function EditListingModal({ listing, isOpen, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<FormState>(initialState)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen || !listing) {
      setForm(initialState)
      setSaving(false)
      return
    }
    setForm({
      title: listing.title ?? '',
      description: listing.description ?? '',
      price: listing.price != null ? String(listing.price) : '',
      currency: listing.currency ?? '',
      city: listing.city ?? '',
      address: listing.address ?? '',
      contactName: listing.contactName ?? '',
      contactPhone: listing.contactPhone ?? '',
    })
  }, [isOpen, listing])

  if (!isOpen || !listing) {
    return null
  }

  const handleChange = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    const payload: ListingUpdatePayload = {}

    const titleValue = toNullable(form.title)
    if (titleValue !== (listing.title ?? null)) payload.title = titleValue

    const descriptionValue = toNullable(form.description)
    if (descriptionValue !== (listing.description ?? null)) payload.description = descriptionValue

    const cityValue = toNullable(form.city)
    if (cityValue !== (listing.city ?? null)) payload.city = cityValue

    const addressValue = toNullable(form.address)
    if (addressValue !== (listing.address ?? null)) payload.address = addressValue

    const contactNameValue = toNullable(form.contactName)
    if (contactNameValue !== (listing.contactName ?? null)) payload.contactName = contactNameValue

    const contactPhoneValue = toNullable(form.contactPhone)
    if (contactPhoneValue !== (listing.contactPhone ?? null)) payload.contactPhone = contactPhoneValue

    const currencyValue = toNullable(form.currency)
    if (currencyValue !== (listing.currency ?? null)) payload.currency = currencyValue

    const priceTrimmed = form.price.trim()
    if (!priceTrimmed) {
      if (listing.price != null) payload.price = null
    } else {
      const parsed = Number.parseInt(priceTrimmed, 10)
      if (!Number.isFinite(parsed)) {
        toast.error('Цена должна быть числом')
        return
      }
      if (parsed !== listing.price) payload.price = parsed
    }

    if (Object.keys(payload).length === 0) {
      toast.success('Изменений нет')
      onClose()
      return
    }

    setSaving(true)
    try {
      const updated = await listingsService.updateListing(listing.id, payload)
      onUpdated(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border/70 bg-background-primary text-text-primary shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border/40 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold">Редактирование объявления</h2>
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
              <label className="text-sm font-medium text-text-secondary">Заголовок</label>
              <Input value={form.title} onChange={handleChange('title')} placeholder="Заголовок" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-text-secondary">Описание</label>
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                className="min-h-28 w-full resize-y rounded-xl border border-border/60 bg-background-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/70"
                placeholder="Описание"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-text-secondary">Цена</label>
              <Input value={form.price} onChange={handleChange('price')} placeholder="Например, 8500000" inputMode="numeric" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-text-secondary">Валюта</label>
              <Input value={form.currency} onChange={handleChange('currency')} placeholder="RUB" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-text-secondary">Город</label>
              <Input value={form.city} onChange={handleChange('city')} placeholder="Город" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-text-secondary">Адрес</label>
              <Input value={form.address} onChange={handleChange('address')} placeholder="Адрес" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-text-secondary">Контактное лицо</label>
              <Input value={form.contactName} onChange={handleChange('contactName')} placeholder="Имя" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-text-secondary">Телефон</label>
              <Input value={form.contactPhone} onChange={handleChange('contactPhone')} placeholder="+7..." />
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
                'Сохранить'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditListingModal

