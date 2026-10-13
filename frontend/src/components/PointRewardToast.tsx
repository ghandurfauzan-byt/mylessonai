// src/components/PointRewardToast.tsx — Notifikasi Perayaan Penambahan Koin (Gamifikasi)
import { playCoinSound } from "@/lib/soundEffects";
import { useUIStore } from "@/lib/store/useUIStore";
import { useEffect, useState } from "react";

export default function PointRewardToast() {
  const latestReward = useUIStore((s) => s.latestPointReward);
  const clearPointReward = useUIStore((s) => s.clearPointReward);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!latestReward) {
      setVisible(false);
      return;
    }

    setVisible(true);
    // Mainkan efek denting koin emas yang meriah
    try {
      playCoinSound();
    } catch {}

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(clearPointReward, 300);
    }, 3800);

    return () => clearTimeout(timer);
  }, [latestReward, clearPointReward]);

  if (!latestReward || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-4 sm:right-8 z-50 animate-in slide-in-from-top-4 fade-in duration-300 max-w-sm w-full pointer-events-auto"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 dark:from-amber-600 dark:via-yellow-500 dark:to-amber-700 p-1 shadow-2xl shadow-amber-500/40 border-2 border-white dark:border-amber-300">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md border-2 border-white dark:border-amber-300 shrink-0">
              🌟
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                  +{latestReward.amount} Poin Prestasi 🪙
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 leading-snug">
                {latestReward.message
                  .replace(
                    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu,
                    ""
                  )
                  .trim()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setVisible(false);
              clearPointReward();
            }}
            aria-label="Tutup notifikasi koin"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
