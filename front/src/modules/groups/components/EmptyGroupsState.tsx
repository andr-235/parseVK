function EmptyGroupsState() {
  return (
    <div
      className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-[20px] bg-background-primary p-10 text-center text-text-secondary md:p-12"
      role="status"
    >
      <div className="grid place-items-center rounded-[30px] border border-dashed border-[rgba(52,152,219,0.35)] bg-[linear-gradient(135deg,rgba(52,152,219,0.16),rgba(52,152,219,0.04))] p-6">
        <div className="flex h-[clamp(56px,16vw,68px)] w-[clamp(56px,16vw,68px)] items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(52,152,219,0.2),rgba(52,152,219,0.05))] text-[clamp(28px,8vw,36px)] text-[#3498db]">
          📁
        </div>
      </div>
      <h3 className="text-lg font-semibold text-text-primary">Список пуст</h3>
      <p className="max-w-[420px] text-[15px] leading-relaxed">
        Добавьте группы по ссылке или загрузите список из файла — после обработки данные появятся здесь и будут доступны для
        управления.
      </p>
    </div>
  )
}

export default EmptyGroupsState
