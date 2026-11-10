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
  const s = subject.toLowerCase();
  const i = id.toLowerCase();
  const r = (Array.isArray(ragSummary) ? ragSummary.join(" ") : String(ragSummary || "")).toLowerCase();

  // 1. Prioritas Menjodohkan Kartu (Matching): Anak Kewan, Aksara Jawa, Sandhangan, Tata Krama / Unggah-Ungguh
  if (
    i.includes("kewan") ||
    t.includes("kewan") ||
    r.includes("anak kewan") ||
    i.includes("aksara") ||
    t.includes("aksara") ||
    i.includes("sandhangan") ||
    t.includes("sandhangan") ||
    i.includes("unggah") ||
    t.includes("unggah") ||
    t.includes("tata krama") ||
    t.includes("jodoh") ||
    t.includes("pasangan") ||
    i.includes("punokawan") ||
    t.includes("punokawan")
  ) {
    return "matching";
  }

  // 2. Prioritas Susun Kata & Huruf Misteri (Susun Kata / Anagram / Geguritan Puisi)
  if (
    i.includes("geguritan") ||
    t.includes("geguritan") ||
    r.includes("geguritan") ||
    t.includes("puisi") ||
    i.includes("susun") ||
    t.includes("susun") ||
    t.includes("ejaan") ||
    t.includes("rangkai kata") ||
    t.includes("kata misteri") ||
    t.includes("anagram") ||
    t.includes("tebak kata") ||
    t.includes("kosakata") ||
    t.includes("kosa kata")
  ) {
    return "susunkata";
  }

  // 3. Prioritas Roda Putar Cerdas (Spin the Wheel): Tantangan Cepat & Kuis Variasi
  if (
    i.includes("roda") ||
    t.includes("roda") ||
    i.includes("wheel") ||
    t.includes("wheel") ||
    t.includes("putar") ||
    t.includes("tantangan kilat")
  ) {
    return "wheel";
  }

  // 4. Prioritas Papan Ular Tangga Edukasi: Evaluasi, Ujian, Latihan Soal, Sains/IPA/Matematika
  if (
    i.includes("kuis") ||
    t.includes("kuis") ||
    i.includes("evaluasi") ||
    t.includes("evaluasi") ||
    t.includes("latihan soal") ||
    t.includes("ujian") ||
    t.includes("sains") ||
    t.includes("ipa") ||
    t.includes("matematika") ||
    t.includes("siklus") ||
    r.includes("evaluasi pemahaman") ||
    /\b(tes|soal)\b/i.test(t)
  ) {
    return "ulartangga";
  }

  // 5. Default: Petualangan 3D Jelajah Desa (Pengamalan Budi Pekerti, Sikap Ksatria, Pancasila, Gotong Royong, Norma)
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
