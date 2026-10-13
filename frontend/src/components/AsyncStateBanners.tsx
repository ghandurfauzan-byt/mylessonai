// src/components/AsyncStateBanners.tsx — Status Asinkronus & Skeleton Loading (FR-07 s/d FR-18)

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-4 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-rose-600 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shadow-xs"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
      <div className="w-9 h-9 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2">
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className="text-xs font-bold text-slate-800">{title}</p>
      <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">{description}</p>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 animate-pulse">
      {Array.from({ length: rows }, (_, i) => `skeleton-row-${i}`).map((rowKey) => (
        <div key={rowKey} className="h-14 bg-slate-100 rounded-xl border border-slate-200/60" />
      ))}
    </div>
  );
}
