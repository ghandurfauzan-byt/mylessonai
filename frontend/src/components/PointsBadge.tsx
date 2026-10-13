// src/components/PointsBadge.tsx — Client UI State (Zustand)

import { useUIStore } from "@/lib/store/useUIStore";

export default function PointsBadge() {
  const totalPoints = useUIStore((state) => state.totalPoints);
  return (
    <div className="flex items-center gap-1.5 bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-3.5 py-1 rounded-full border-2 border-amber-400 dark:border-amber-700 shadow-sm">
      <span className="text-base animate-bounce">🪙</span>
      <span className="text-lg font-black">{totalPoints}</span>
      <span className="text-xs font-extrabold uppercase">Poin</span>
    </div>
  );
}
