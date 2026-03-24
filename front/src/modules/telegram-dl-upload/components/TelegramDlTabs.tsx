type TelegramDlTabId = 'import' | 'match'

interface TelegramDlTabsProps {
  activeTab: TelegramDlTabId
  onChange: (tab: TelegramDlTabId) => void
}

const tabs: Array<{ id: TelegramDlTabId; label: string; description: string }> = [
  {
    id: 'import',
    label: 'Импорт DL',
    description: 'Загрузка XLSX и история файлов',
  },
  {
    id: 'match',
    label: 'Матчинг DL',
    description: 'Полная база и последний запуск матчинга',
  },
]

export default function TelegramDlTabs({ activeTab, onChange }: TelegramDlTabsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-2 shadow-soft-md backdrop-blur-2xl">
      <div role="tablist" aria-label="Режимы работы с выгрузкой DL" className="grid gap-2 md:grid-cols-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={[
                'rounded-xl border px-4 py-3 text-left transition-colors',
                isActive
                  ? 'border-cyan-400/40 bg-cyan-400/12 text-white shadow-lg shadow-cyan-500/10'
                  : 'border-transparent bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white',
              ].join(' ')}
            >
              <div className="text-sm font-semibold">{tab.label}</div>
              <div className="mt-1 text-xs text-slate-400">{tab.description}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
