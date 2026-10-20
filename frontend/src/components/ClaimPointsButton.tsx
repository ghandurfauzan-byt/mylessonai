// src/components/ClaimPointsButton.tsx — Gamifikasi Klaim Poin (FR-13 & FR-14)

import { playCoinSound } from "@/lib/soundEffects";
import { useUIStore } from "@/lib/store/useUIStore";
import { useState } from "react";

const POINTS_PER_CLAIM = 10;

export default function ClaimPointsButton() {
  const dailyMissions = useUIStore((state) => state.dailyMissions);
  const addPoints = useUIStore((state) => state.addPoints);
  const completeDailyMission = useUIStore((state) => state.completeDailyMission);
  const [showSparkle, setShowSparkle] = useState(false);

  const claimed = dailyMissions.readSummary;

  function handleClaim() {
    if (claimed) return;
    playCoinSound();
    addPoints(POINTS_PER_CLAIM, "Hebat! Kamu telah memahami materi yang disampaikan (+10 ⭐)");
    completeDailyMission("readSummary");
    setShowSparkle(true);
    setTimeout(() => setShowSparkle(false), 2000);
  }

  return (
    <div className="relative">
      {showSparkle && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-yellow-400 text-yellow-950 font-black text-xs px-3 py-1 rounded-full shadow-lg border-2 border-white animate-bounce pointer-events-none z-20 whitespace-nowrap">
          <span>✨ +{POINTS_PER_CLAIM} POIN PRESTASI! 🌟</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleClaim}
        disabled={claimed}
        className={`text-sm font-black px-6 py-3 rounded-2xl transition-all flex items-center gap-2.5 shadow-lg ${
          claimed
            ? "bg-emerald-500 text-white border-2 border-emerald-600 cursor-default shadow-sm"
            : "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-yellow-950 border-b-4 border-amber-600 active:translate-y-1 active:border-b-0 hover:scale-105"
        }`}
      >
        {claimed ? (
          <>
            <span className="text-base">✅</span>
            <span>Materi Telah Dipahami (+10 ⭐)</span>
          </>
        ) : (
          <>
            <span className="text-base animate-bounce">🪙</span>
            <span>Klaim Pemahaman Materi (+10 ⭐)</span>
          </>
        )}
      </button>
    </div>
  );
}
