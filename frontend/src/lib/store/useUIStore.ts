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
}

export interface ValidatedModuleSummary {
  id: string;
  chapterCode: string;
  title: string;
  subject: "pkn" | "bjawa";
  subjectLabel: string;
  source: string;
  validatedAt: string;
  ragSummary?: string[];
  quizQuestions?: Record<number, Question[]>;
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
      };
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`daily_missions_${chapterId}`);
          if (stored) {
            return {
              currentChapterId: chapterId,
              dailyMissions: JSON.parse(stored),
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
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return {
    readSummary: false,
    listenedAudio: false,
    completedQuiz: false,
    quizLevel1: false,
    quizLevel2: false,
    quizLevel3: false,
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
