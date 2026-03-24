import SectionCard from '@/shared/components/SectionCard'

export default function TelegramDlUploadHistory() {
  return (
    <SectionCard
      title="История загрузок"
      description="Последние импортированные файлы и их активные версии появятся здесь."
      className="border border-white/10 bg-slate-900/80 backdrop-blur-2xl"
      headerClassName="border-white/10"
      contentClassName="space-y-4"
    >
      <div className="rounded-lg border border-dashed border-white/10 bg-slate-800/30 px-4 py-10 text-center">
        <div className="text-base font-medium text-white">Пока нет загруженных файлов</div>
        <div className="mt-2 text-sm text-slate-400">
          После первой выгрузки здесь появится список файлов, дата загрузки и статус замены.
        </div>
      </div>
    </SectionCard>
  )
}
