// src/components/RefreshAiButton.tsx
// Regenerasi Konten AI (FR-19) via URL Query String Mutation (Client-side)

import { useTransition } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function RefreshAiButton({
  variant = "default",
}: { variant?: "default" | "retry" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleRefreshAi() {
    const params = new URLSearchParams(searchParams);
    params.set("r", Date.now().toString());
    startTransition(() => {
      navigate(`/dashboard/pelajar?${params.toString()}`);
    });
  }

  if (variant === "retry") {
    return (
      <button
        type="button"
        onClick={handleRefreshAi}
        disabled={isPending}
        className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit transition shadow-xs"
      >
        <svg
          className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>{isPending ? "Memuat Ulang..." : "Coba Lagi"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleRefreshAi}
      disabled={isPending}
      aria-label="Refresh konten AI"
      className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 transition shrink-0 shadow-xs active:scale-[0.98]"
    >
      <svg
        className={`w-3.5 h-3.5 text-blue-500 ${isPending ? "animate-spin" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <span>{isPending ? "Memproses..." : "Regenerasi AI"}</span>
    </button>
  );
}
