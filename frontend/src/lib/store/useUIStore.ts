// src/lib/store/useUIStore.ts
//
// Store Zustand (~0.5 KB gzipped) — SATU-SATUNYA tempat menyimpan Client UI
// State di seluruh aplikasi. Dipertahankan 1:1 dari Tugas 7 (lib/store/useUIStore.ts)
// — migrasi build tool ke Vite TIDAK mengubah state management sama sekali.
//
// ATURAN KETAT yang dijaga di file ini:
//   1. TIDAK PERNAH menyimpan hasil panggilan REST API (Material/Question/
//      ClassSummary/dst.) di sini — itu tanggung jawab TanStack Query.
//   2. TIDAK dibungkus <Context.Provider> apa pun — hook ini bisa dipanggil
//      langsung dari komponen mana saja.
//   3. Setiap komponen WAJIB memakai selector presisi (mis. useUIStore(s => s.x))
//      agar hanya re-render saat slice yang dipilih berubah.
//
// Empat kelompok Client UI State yang dikelola:
//   A. Modal/Drawer aktif   -> isUploadModalOpen, uploadModalVariant
//   B. Theme Toggle         -> themeMode
//   C. Draft Form Steps     -> quizDraft
//   D. Gamifikasi           -> totalPoints

import type { Question } from "@shared/schema";
import { create } from "zustand";

export type UploadModalVariant = "private" | "public";
export type ThemeMode = "light" | "dark";

export interface PointRewardNotice {
  id: string;
  amount: number;
  message: string;
}

interface QuizDraftState {
  selectedOption: number | null;
  showHint: boolean;
}

interface UIState {
  isUploadModalOpen: boolean;
  uploadModalVariant: UploadModalVariant;
  openUploadModal: (variant: UploadModalVariant) => void;
  closeUploadModal: () => void;

  themeMode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;

  quizDraft: QuizDraftState;
  setQuizSelectedOption: (index: number) => void;
  setQuizShowHint: (value: boolean) => void;
  resetQuizDraft: () => void;

  totalPoints: number;
  latestPointReward: PointRewardNotice | null;
  addPoints: (amount: number, message?: string) => void;
  setTotalPoints: (amount: number) => void;
  resetTotalPoints: () => void;
  clearPointReward: () => void;

  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;

  isClassModalOpen: boolean;
  openClassModal: () => void;
  closeClassModal: () => void;

  activeValidatedModule: ValidatedModuleSummary;
  setActiveValidatedModule: (mod: ValidatedModuleSummary) => void;

  currentChapterId: string;
  dailyMissions: DailyMissionsState;
  switchChapterMissions: (chapterId: string) => void;
  resetCurrentChapterMissions: (chapterId?: string) => void;
  completeDailyMission: (mission: keyof DailyMissionsState) => void;
}

export interface DailyMissionsState {
  readSummary: boolean;
  listenedAudio: boolean;
  completedQuiz: boolean;
  quizLevel1: boolean;
  quizLevel2: boolean;
  quizLevel3: boolean;
  playedGame: boolean;
}

export type GameType = "adventure" | "matching" | "ulartangga" | "susunkata" | "wheel";

export interface ValidatedModuleSummary {
  id: string;
  chapterCode: string;
  title: string;
  subject: "pkn" | "bjawa";
  subjectLabel: string;
  source: string;
  validatedAt: string;
  grade?: string;
  learningGoal?: string;
  ragSummary?: string[];
  quizQuestions?: Record<number, Question[]>;
  gameType?: GameType;
}

/**
 * Otomatis menentukan 1 jenis game resmi yang paling pas untuk suatu materi:
 * - "adventure"  : Khusus materi yang butuh PENGAMALAN / IMPLEMENTASI BUDI PEKERTI (Pancasila, Gotong Royong, Norma, Toleransi, Bharatayudha Ksatria)
 * - "matching"   : Khusus materi HAFALAN SIMBOL & PADANAN KATA (Aksara Jawa, Arane Anak Kewan, Unggah-Ungguh Basa, Tokoh Wayang)
 * - "susunkata"  : Khusus materi PENYUSUNAN KATA & EJAAN (Susun Huruf/Kata Misteri, Anagram, Kosa Kata Basa Jawa/Indonesia)
 * - "wheel"      : Khusus materi KUIS PUTAR CERDAS & TANTANGAN BINTANG (Variasi Roda Putar Interaktif)
 * - "ulartangga" : Khusus materi TES & EVALUASI PEMAHAMAN (Papan Ular Tangga, Sains/IPA, Matematika, Latihan Soal)
 */
export function resolveGameTypeForModule(
  title = "",
  subject = "",
  id = "",
  ragSummary?: string[] | string
): GameType {
  const t = title.toLowerCase();
  const i = id.toLowerCase();
  const directText = `${t} ${i}`;

  // TAHAP 1: PRIORITAS TINGGI BERDASARKAN JUDUL & ID BAB SECARA LANGSUNG
  // A. Susun Huruf & Kata Misteri / Geguritan Puisi Jawa
  if (
    directText.includes("geguritan") ||
    directText.includes("puisi") ||
    directText.includes("pantun") ||
    directText.includes("syair") ||
    directText.includes("sastra") ||
    directText.includes("susun") ||
    directText.includes("ejaan") ||
    directText.includes("rangkai") ||
    directText.includes("kata misteri") ||
    directText.includes("anagram") ||
    directText.includes("tebak kata") ||
    directText.includes("diksi") ||
    directText.includes("purwakanthi")
  ) {
    return "susunkata";
  }

  // B. Menjodohkan Kartu (Matching): Anak Kewan, Aksara Jawa, Sandhangan, Tata Krama / Krama Alus, Wayang
  if (
    directText.includes("kewan") ||
    directText.includes("aksara") ||
    directText.includes("sandhangan") ||
    directText.includes("unggah") ||
    directText.includes("krama") ||
    directText.includes("tata krama") ||
    directText.includes("punokawan") ||
    directText.includes("pandhawa") ||
    directText.includes("wayang") ||
    directText.includes("jodoh") ||
    directText.includes("pasang") ||
    directText.includes("padanan") ||
    directText.includes("sinonim") ||
    directText.includes("antonim") ||
    directText.includes("matching")
  ) {
    return "matching";
  }

  // C. Roda Putar Cerdas & Tantangan Kilat (Spin the Wheel)
  if (
    directText.includes("roda") ||
    directText.includes("wheel") ||
    directText.includes("putar") ||
    directText.includes("spin") ||
    directText.includes("tantangan kilat")
  ) {
    return "wheel";
  }

  // D. Papan Ular Tangga Edukasi: Evaluasi, Ujian, Latihan Soal, Sains/IPA/Matematika
  if (
    directText.includes("kuis") ||
    directText.includes("evaluasi") ||
    directText.includes("latihan") ||
    directText.includes("sains") ||
    directText.includes("ipa") ||
    directText.includes("matematika") ||
    directText.includes("hitung") ||
    directText.includes("siklus") ||
    directText.includes("cbt") ||
    /\b(tes|soal|ujian)\b/i.test(directText)
  ) {
    return "ulartangga";
  }

  // TAHAP 2: JIKA JUDUL UMUM, EVALUASI DARI INTISARI RAG SUMMARY
  const r = (Array.isArray(ragSummary) ? ragSummary.join(" ") : String(ragSummary || "")).toLowerCase();
  if (r.includes("geguritan") || r.includes("puisi") || r.includes("susun kata")) {
    return "susunkata";
  }
  if (r.includes("anak kewan") || r.includes("aksara jawa") || r.includes("sandhangan") || r.includes("basa krama") || r.includes("punokawan")) {
    return "matching";
  }
  if (r.includes("evaluasi pemahaman") || r.includes("latihan soal") || r.includes("tes pemahaman")) {
    return "ulartangga";
  }

  // TAHAP 3: DEFAULT UNTUK PENGAMALAN NILAI, BUDI PEKERTI, GOTONG ROYONG, PANCASILA, NORMA
  return "adventure";
}

const initialQuizDraft: QuizDraftState = { selectedOption: null, showHint: false };

function getInitialTheme(): ThemeMode {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("theme_mode");
      if (stored === "dark" || stored === "light") return stored;
    } catch {}
  }
  return "light";
}

export const useUIStore = create<UIState>()((set) => ({
  isUploadModalOpen: false,
  uploadModalVariant: "private",
  openUploadModal: (variant) => set({ isUploadModalOpen: true, uploadModalVariant: variant }),
  closeUploadModal: () => set({ isUploadModalOpen: false }),

  themeMode: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const nextTheme: ThemeMode = state.themeMode === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("theme_mode", nextTheme);
        } catch {}
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
      }
      return { themeMode: nextTheme };
    }),
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("theme_mode", theme);
      } catch {}
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    set({ themeMode: theme });
  },

  quizDraft: initialQuizDraft,
  setQuizSelectedOption: (index) =>
    set((state) => ({ quizDraft: { ...state.quizDraft, selectedOption: index } })),
  setQuizShowHint: (value) =>
    set((state) => ({ quizDraft: { ...state.quizDraft, showHint: value } })),
  resetQuizDraft: () => set({ quizDraft: initialQuizDraft }),

  totalPoints: 420,
  latestPointReward: null,
  addPoints: (amount, message) => {
    if (typeof window !== "undefined") {
      fetch("/api/students/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      }).catch(() => {});
    }
    set((state) => ({
      totalPoints: state.totalPoints + amount,
      latestPointReward: {
        id: `${Date.now()}_${Math.random()}`,
        amount,
        message: message ?? "Poin Prestasi Berhasil Dikumpulkan!",
      },
    }));
  },
  setTotalPoints: (amount) => set({ totalPoints: amount }),
  resetTotalPoints: () => set({ totalPoints: 0 }),
  clearPointReward: () => set({ latestPointReward: null }),

  isProfileModalOpen: false,
  openProfileModal: () => set({ isProfileModalOpen: true }),
  closeProfileModal: () => set({ isProfileModalOpen: false }),

  isClassModalOpen: false,
  openClassModal: () => set({ isClassModalOpen: true }),
  closeClassModal: () => set({ isClassModalOpen: false }),

  activeValidatedModule: getInitialValidatedModule(),
  setActiveValidatedModule: (mod) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("active_validated_module", JSON.stringify(mod));
      } catch {}
    }
    set({ activeValidatedModule: mod });
  },

  currentChapterId: "pkn-sila3",
  switchChapterMissions: (chapterId: string) => {
    set((state) => {
      if (state.currentChapterId === chapterId) return state;
      const freshMissions: DailyMissionsState = {
        readSummary: false,
        listenedAudio: false,
        completedQuiz: false,
        quizLevel1: false,
        quizLevel2: false,
        quizLevel3: false,
        playedGame: false,
      };
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`daily_missions_${chapterId}`);
          if (stored) {
            return {
              currentChapterId: chapterId,
              dailyMissions: { playedGame: false, ...JSON.parse(stored) },
            };
          }
        } catch {}
      }
      return {
        currentChapterId: chapterId,
        dailyMissions: freshMissions,
      };
    });
  },
  resetCurrentChapterMissions: (chapterId?: string) => {
    set((state) => {
      const targetCh = chapterId || state.currentChapterId;
      const freshMissions: DailyMissionsState = {
        readSummary: false,
        listenedAudio: false,
        completedQuiz: false,
        quizLevel1: false,
        quizLevel2: false,
        quizLevel3: false,
        playedGame: false,
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(`daily_missions_${targetCh}`);
          localStorage.removeItem("daily_missions");
        } catch {}
      }
      return { dailyMissions: freshMissions };
    });
  },

  dailyMissions: getInitialDailyMissions(),
  completeDailyMission: (mission) => {
    set((state) => {
      if (state.dailyMissions[mission]) return state;
      const next: DailyMissionsState = { ...state.dailyMissions, [mission]: true };
      if (mission === "quizLevel3") {
        next.completedQuiz = true;
      }
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`daily_missions_${state.currentChapterId}`, JSON.stringify(next));
          localStorage.setItem("daily_missions", JSON.stringify(next));
        } catch {}
      }
      return { dailyMissions: next };
    });
  },
}));

function getInitialDailyMissions(): DailyMissionsState {
  if (typeof window !== "undefined") {
    try {
      const stored =
        localStorage.getItem("daily_missions_pkn-sila3") || localStorage.getItem("daily_missions");
      if (stored) {
        const parsed = JSON.parse(stored);
        return { playedGame: false, ...parsed };
      }
    } catch {}
  }
  return {
    readSummary: false,
    listenedAudio: false,
    completedQuiz: false,
    quizLevel1: false,
    quizLevel2: false,
    quizLevel3: false,
    playedGame: false,
  };
}

function getInitialValidatedModule(): ValidatedModuleSummary {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("active_validated_module");
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return {
    id: "pkn-sila3",
    chapterCode: "Bab 1",
    title: "Makna Lambang Sila Ke-3: Persatuan Indonesia di Sekolah & Rumah",
    subject: "pkn",
    subjectLabel: "Pendidikan Pancasila & PKn",
    source: "API SIBI Kemdikbudristek (Kurikulum Merdeka)",
    validatedAt: "Hari ini, oleh Bpk. Guru",
  };
}
