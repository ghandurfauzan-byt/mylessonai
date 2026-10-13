// src/components/LevelBadge.tsx — Komponen presentational tingkat kompetensi kuis

const LEVEL_STYLES: Record<string, { bg: string; dot: string }> = {
  EASY: {
    bg: "bg-emerald-50 text-emerald-950 border-emerald-300 font-bold shadow-xs",
    dot: "bg-emerald-600 ring-2 ring-emerald-200",
  },
  MEDIUM: {
    bg: "bg-sky-100 text-blue-950 border-sky-300 font-black shadow-xs",
    dot: "bg-blue-600 ring-2 ring-blue-300",
  },
  HARD: {
    bg: "bg-purple-100 text-purple-950 border-purple-300 font-bold shadow-xs",
    dot: "bg-purple-600 ring-2 ring-purple-200",
  },
};

const LEVEL_TEXT: Record<string, string> = {
  EASY: "Level 1: Dasar",
  MEDIUM: "Level 2: Menengah",
  HARD: "Level 3: Analisis Lanjut",
};

const DEFAULT_STYLE = LEVEL_STYLES.EASY!;
const DEFAULT_TEXT = LEVEL_TEXT.EASY!;

export default function LevelBadge({
  level = "EASY",
  className = "",
}: {
  level?: string;
  className?: string;
}) {
  const style = LEVEL_STYLES[level] ?? DEFAULT_STYLE;
  const label = LEVEL_TEXT[level] ?? DEFAULT_TEXT;

  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border ${style.bg} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
      <span className="tracking-tight">{label}</span>
    </span>
  );
}
