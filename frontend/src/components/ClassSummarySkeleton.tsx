// src/components/ClassSummarySkeleton.tsx — Fallback Skeleton Bento Metrics

export default function ClassSummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 3 }, (_, i) => `metric-skeleton-${i}`).map((cardKey) => (
        <div
          key={cardKey}
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs animate-pulse space-y-4"
        >
          <div className="flex justify-between items-center">
            <div className="h-3 w-28 bg-slate-200 rounded-md" />
            <div className="h-7 w-7 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-8 w-20 bg-slate-200 rounded-lg" />
          <div className="h-3 w-36 bg-slate-100 rounded-md" />
        </div>
      ))}
    </div>
  );
}
