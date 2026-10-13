// src/components/MaterialsList.tsx — Daftar Materi & Modul Terbitan (FR-04, FR-05, FR-06)

import { EmptyState, ErrorBanner, ListSkeleton } from "@/components/AsyncStateBanners";
import { useMaterialsQuery } from "@/hooks/useMaterialsQuery";

const VARIANT_LABEL: Record<string, { label: string; style: string }> = {
  public: {
    label: "Modul Publik Dosen",
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  private: {
    label: "Catatan Privat",
    style: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export default function MaterialsList() {
  const { data: materials, isLoading, isError, error, refetch, isFetching } = useMaterialsQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <span>Modul Terunggah &amp; Terindeks RAG</span>
          {materials && (
            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {materials.length} File
            </span>
          )}
        </h3>
        {isFetching && !isLoading && (
          <span className="text-[10px] text-blue-600 font-semibold animate-pulse">
            Menyinkronkan…
          </span>
        )}
      </div>

      {isLoading && <ListSkeleton rows={3} />}

      {isError && (
        <ErrorBanner
          message={error instanceof Error ? error.message : "Gagal memuat daftar materi."}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && materials && materials.length === 0 && (
        <EmptyState
          title="Belum ada materi ter-upload"
          description="Unggah dokumen PDF pertama Anda lewat tombol di atas — daftar ini akan otomatis
            ter-update tanpa reload berkat invalidasi cache TanStack Query."
        />
      )}

      {!isLoading && !isError && materials && materials.length > 0 && (
        <ul className="space-y-2.5">
          {materials.map((m) => {
            const variantConfig = VARIANT_LABEL[m.variant] ?? {
              label: m.variant,
              style: "bg-slate-100 text-slate-600 border-slate-200",
            };

            return (
              <li
                key={m.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs flex items-center justify-between gap-3 text-xs transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-snug">{m.title}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {m.fileName} · {new Date(m.indexedAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full font-bold text-[10px] border whitespace-nowrap shrink-0 ${variantConfig.style}`}
                >
                  {variantConfig.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
