import PageHeroCard from '@/shared/components/PageHeroCard'

export default function TelegramDlUploadHero() {
  return (
    <PageHeroCard
      title="Выгрузка с ДЛ"
      description="Загружайте несколько XLSX файлов формата groupexport_*.xlsx за один раз. Повторная загрузка с тем же именем файла будет пропущена как дубликат."
      footer={
        <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
          <span className="rounded-full border border-border/60 bg-background-primary/70 px-3 py-1.5">
            Можно выбрать несколько XLSX файлов
          </span>
          <span className="rounded-full border border-border/60 bg-background-primary/70 px-3 py-1.5">
            Дубликаты пропускаются по полному имени файла
          </span>
        </div>
      }
      className="py-1"
    />
  )
}
