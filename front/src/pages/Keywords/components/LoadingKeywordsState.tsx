function LoadingKeywordsState() {
  return (
    <div
      className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-[20px] bg-background-primary p-10 text-center text-text-secondary md:p-12"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-12 w-12 rounded-full border-4 border-[rgba(52,152,219,0.2)] border-t-[#3498db] animate-spin" />
      <p className="font-semibold text-text-primary">Загружаем ключевые слова…</p>
    </div>
  )
}

export default LoadingKeywordsState
