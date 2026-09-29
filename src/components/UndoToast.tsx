interface UndoToastProps {
  message: string
  onUndo: () => void
}

export function UndoToast({ message, onUndo }: UndoToastProps) {
  return (
    <div
      className="mx-gutter mb-2 flex min-h-11 items-center gap-3 rounded-full bg-ink px-4 text-footnote text-cream shadow-lg dark:bg-cream dark:text-ink"
      role="status"
    >
      <p className="min-w-0 flex-1 truncate">{message}</p>
      <span aria-hidden="true">·</span>
      <button
        type="button"
        onClick={onUndo}
        className="hit-touch shrink-0 font-semibold"
      >
        Undo
      </button>
    </div>
  )
}
