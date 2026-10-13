// src/components/ChapterModeSelector.tsx
// Navigasi Bab & Mode Generasi AI (FR-07, FR-08, FR-09, FR-10)

import { playClickSound } from "@/lib/soundEffects";
import { useUIStore } from "@/lib/store/useUIStore";
import { type AiMode, aiModes } from "@shared/catalog";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ChapterModeSelector({
  chapter,
  mode,
}: {
  chapter: string;
  mode: AiMode;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeModule = useUIStore((s) => s.activeValidatedModule);

  function updateQuery(next: { chapter?: string; mode?: string }) {
    const params = new URLSearchParams(searchParams);
    if (next.chapter) params.set("chapter", next.chapter);
    if (next.mode) params.set("mode", next.mode);
    params.delete("r");
    navigate(`/dashboard/pelajar?${params.toString()}`);
    setTimeout(() => {
      const el = document.getElementById("papan-tulis-materi");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  }

  const isBjawa = activeModule.subject === "bjawa";

  return (
    <div className="space-y-4">
      {/* 1. MODUL TERVALIDASI GURU (KARTU ELEGAN & RAMAH ANAK) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span>Modul Pembelajaran Aktif</span>
          </span>
          <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>✓ Tervalidasi Guru</span>
          </span>
        </div>

        {/* Kartu Modul Utama */}
        <div
          onClick={() => {
            playClickSound();
            updateQuery({ chapter: activeModule.id, mode: "cerita" });
          }}
          className="bg-gradient-to-br from-blue-500/10 via-sky-50 to-indigo-50/50 dark:from-slate-800 dark:via-blue-950/40 dark:to-slate-800 border-2 border-blue-400 dark:border-blue-600 rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all active:scale-[0.99]"
          title="Klik untuk membuka materi aktif ini"
        >
          <div className="flex items-start gap-3">
            {/* Emblem Pelajaran Cantik & Jelas */}
            <div
              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-md border-2 border-white dark:border-blue-400 ${
                isBjawa
                  ? "bg-gradient-to-br from-emerald-500 to-teal-700 text-white"
                  : "bg-gradient-to-br from-blue-600 to-indigo-700 text-white"
              }`}
            >
              {isBjawa ? (
                <span className="text-base leading-none">🎭</span>
              ) : (
                <span className="w-5 h-3 rounded-xs inline-flex flex-col border border-white/60 shadow-2xs overflow-hidden shrink-0">
                  <span className="bg-rose-600 h-1/2 w-full" />
                  <span className="bg-white h-1/2 w-full" />
                </span>
              )}
              <span className="text-[9px] font-black tracking-wider uppercase mt-0.5">
                {isBjawa ? "JAWA" : "PKN"}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase text-white bg-blue-600 dark:bg-blue-500 px-2.5 py-0.5 rounded-full shadow-2xs">
                  {activeModule.chapterCode}
                </span>
                <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
                  {activeModule.subjectLabel}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-1.5 leading-snug">
                {activeModule.title}
              </h4>
            </div>
          </div>

          {/* Footer Guru & Status */}
          <div className="pt-2.5 border-t border-blue-200/80 dark:border-slate-700/80 flex items-center justify-between text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span>👨‍🏫 Guru:</span>
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                {activeModule.validatedAt}
              </span>
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-black flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
              <span>⚡</span> Langsung Aktif
            </span>
          </div>
        </div>
      </div>

      {/* 2. PILIH FORMAT PENJELASAN (DESAIN KARTU SERU & INTERAKTIF) */}
      <fieldset>
        <legend className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-2.5">
          Pilih Format Penjelasan RAG 💡
        </legend>

        <div className="space-y-2.5">
          {aiModes.map((m) => {
            const isSelected = mode === m.value;
            const isQuizMode = m.value === "kuis_tantangan";

            return (
              <div
                key={m.value}
                onClick={() => {
                  playClickSound();
                  if (isQuizMode) {
                    navigate("/dashboard/pelajar/kuis");
                  } else {
                    updateQuery({ mode: m.value });
                  }
                }}
                className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${
                  isSelected
                    ? isQuizMode
                      ? "bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-slate-800 dark:via-emerald-950/40 dark:to-slate-800 border-emerald-500 shadow-md ring-2 ring-emerald-400/30"
                      : "bg-gradient-to-r from-blue-50 via-sky-50 to-white dark:from-slate-800 dark:via-blue-950/40 dark:to-slate-800 border-blue-500 shadow-md ring-2 ring-blue-400/30"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Ikon Format Bersih & Proporsional */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm border-2 ${
                      isQuizMode
                        ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-white dark:border-emerald-400"
                        : "bg-gradient-to-br from-blue-400 to-indigo-500 text-white border-white dark:border-blue-400"
                    }`}
                  >
                    {isQuizMode ? "🎮" : "📖"}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                        {m.label}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.2 rounded-full border ${
                          isQuizMode
                            ? "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                            : "bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700"
                        }`}
                      >
                        {isQuizMode ? "🏆 +30 Poin" : "⭐ Materi Pokok"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-snug">
                      {isQuizMode
                        ? "Latihan kuis adaptif berhadiah koin emas"
                        : "Intisari modul ramah anak & contoh aksi nyata"}
                    </p>
                  </div>
                </div>

                {/* Indikator Pemilihan Cantik */}
                <div className="shrink-0 pl-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? isQuizMode
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white inline-block" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
