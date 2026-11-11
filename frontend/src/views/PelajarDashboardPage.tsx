// src/views/PelajarDashboardPage.tsx — Ruang Belajar Siswa SD (PKn & Bahasa Jawa)

import AdaptiveEduGameModal from "@/components/AdaptiveEduGameModal";
import AiContentPanel from "@/components/AiContentPanel";
import ChapterModeSelector from "@/components/ChapterModeSelector";
import ModalPortal from "@/components/ModalPortal";
import PointsBadge from "@/components/PointsBadge";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  playBadgeFanfareSound,
  playClickSound,
  playRobotAwakeSound,
  speakBadgeMotivation,
  stopBadgeSpeech,
} from "@/lib/soundEffects";
import { useUIStore, resolveGameTypeForModule } from "@/lib/store/useUIStore";
import { type AiMode, availableChapters } from "@shared/catalog";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

interface BadgeDetail {
  id: string;
  chapterCode?: string;
  subject?: "pkn" | "bjawa";
  name: string;
  icon: string;
  unlocked: boolean;
  tag: string;
  tagColor: string;
  description: string;
  howToGet: string;
  motivation: string;
  targetChapterId?: string;
}

export default function PelajarDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const totalPoints = useUIStore((s) => s.totalPoints);
  const addPoints = useUIStore((s) => s.addPoints);
  const setTotalPoints = useUIStore((s) => s.setTotalPoints);
  const resetTotalPoints = useUIStore((s) => s.resetTotalPoints);
  const activeValidatedModule = useUIStore((s) => s.activeValidatedModule);
  const dailyMissions = useUIStore((s) => s.dailyMissions);
  const switchChapterMissions = useUIStore((s) => s.switchChapterMissions);
  const resetCurrentChapterMissions = useUIStore((s) => s.resetCurrentChapterMissions);

  const paramChapter = searchParams.get("chapter");
  const defaultChapter = activeValidatedModule?.id || "pkn-sila3";
  const chapter = paramChapter ?? defaultChapter;
  const mode = (searchParams.get("mode") ?? "cerita") as AiMode;
  const refreshNonce = searchParams.get("r") ?? "0";

  // Identifikasi otomatis pelajaran aktif (PKn vs Bahasa Jawa)
  const isJawaCurrent =
    chapter.toLowerCase().includes("bjawa") ||
    chapter.toLowerCase().includes("unggah") ||
    chapter.toLowerCase().includes("punokawan") ||
    chapter.toLowerCase().includes("tembang") ||
    chapter.toLowerCase().includes("wayang") ||
    activeValidatedModule?.subject === "bjawa";

  // State Golongan Lencana Aktif (Otomatis sesuai pelajaran yang sedang dibuka)
  const [badgeSubject, setBadgeSubject] = useState<"pkn" | "bjawa">(
    isJawaCurrent ? "bjawa" : "pkn"
  );

  // 1. Dapatkan informasi topik yang sedang diambil / dipilih siswa (Materi Yang Diambil)
  const currentChapterInfo = useMemo(() => {
    const fromCatalog = availableChapters.find((c) => c.value === chapter);
    const cleanActiveId = (activeValidatedModule?.id || "").replace("mod-", "");
    const cleanChapter = chapter.replace("mod-", "");
    const isMatchingActive =
      Boolean(activeValidatedModule) &&
      (cleanChapter === cleanActiveId || chapter === activeValidatedModule?.id);

    const title = isMatchingActive
      ? activeValidatedModule!.title
      : fromCatalog?.label || chapter;

    const subject = isMatchingActive
      ? activeValidatedModule!.subject
      : chapter.toLowerCase().includes("bjawa") ||
        chapter.toLowerCase().includes("unggah") ||
        chapter.toLowerCase().includes("krama") ||
        chapter.toLowerCase().includes("aksara") ||
        chapter.toLowerCase().includes("geguritan") ||
        chapter.toLowerCase().includes("kewan") ||
        chapter.toLowerCase().includes("wayang") ||
        chapter.toLowerCase().includes("pandhawa") ||
        chapter.toLowerCase().includes("punokawan")
      ? "bjawa"
      : "pkn";

    const gameType =
      isMatchingActive && activeValidatedModule?.gameType
        ? activeValidatedModule.gameType
        : resolveGameTypeForModule(
            title,
            subject,
            chapter,
            isMatchingActive ? activeValidatedModule?.ragSummary : undefined
          );

    const moduleToPass = isMatchingActive ? activeValidatedModule : undefined;

    return {
      title,
      subject,
      gameType,
      moduleToPass,
    };
  }, [chapter, activeValidatedModule]);

  // Dynamic Game Mode & Title based on active curriculum / chapter yang diambil siswa
  const activeGameInfo = useMemo(() => {
    const rawTitle = currentChapterInfo.title;
    const cleanTitle = rawTitle.replace(/^.*-\s*/, "");
    const targetGameType = currentChapterInfo.gameType;

    if (targetGameType === "matching") {
      return {
        type: "matching",
        icon: "🧩",
        badge: "Teka-Teki Pasangan",
        title: `Menjodohkan: ${cleanTitle}`,
      };
    }

    if (targetGameType === "susunkata") {
      return {
        type: "susunkata",
        icon: "🔤",
        badge: "Susun Huruf & Kata",
        title: `Teka-Teki Kata: ${cleanTitle}`,
      };
    }

    if (targetGameType === "wheel") {
      return {
        type: "wheel",
        icon: "🎡",
        badge: "Roda Putar Cerdas",
        title: `Roda Tantangan: ${cleanTitle}`,
      };
    }

    if (targetGameType === "ulartangga") {
      return {
        type: "ulartangga",
        icon: "🎲",
        badge: "Ular Tangga Edukasi",
        title: `Ular Tangga Kuis: ${cleanTitle}`,
      };
    }

    // Default: adventure (pengamalan nilai budi pekerti, gotong royong, bharatayudha)
    return {
      type: "adventure",
      icon: "🏰",
      badge: "Petualangan 3D",
      title: `Petualangan Desa: ${cleanTitle}`,
    };
  }, [currentChapterInfo]);

  const setActiveValidatedModule = useUIStore((s) => s.setActiveValidatedModule);

  const [currentStudentName, setCurrentStudentName] = useState("Ghandur Fauzan Ngauf Hisam");
  const [currentStudent, setCurrentStudent] = useState<{
    id: string;
    name: string;
    email: string;
    kelas?: string;
    noAbsen?: string;
    points?: number;
    materialScore?: number;
    quizScore?: number;
    gamePoints?: number;
    weakness?: {
      chapterId: string;
      chapterName: string;
      subject: string;
      score: number;
      outOf: number;
      status: "remedial" | "tuntas";
      message: string;
    };
  } | null>(null);

  useEffect(() => {
    let lastActiveId = activeValidatedModule?.id;
    // Sinkronkan modul aktif yang baru saja divalidasi oleh Guru via API secara real-time
    const syncActiveModule = () => {
      const studentKelas = currentStudent?.kelas || "Kelas 4";
      fetch(`/api/v1/curriculum/active?kelas=${encodeURIComponent(studentKelas)}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data && res.data.id !== lastActiveId) {
            lastActiveId = res.data.id;
            setActiveValidatedModule(res.data);
          }
        })
        .catch(() => {});
    };

    syncActiveModule();
    const interval = setInterval(syncActiveModule, 8000);
    window.addEventListener("focus", syncActiveModule);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", syncActiveModule);
    };
  }, [setActiveValidatedModule, activeValidatedModule?.id, currentStudent?.kelas]);

  useEffect(() => {
    setBadgeSubject(isJawaCurrent ? "bjawa" : "pkn");
  }, [chapter, isJawaCurrent]);

  // Set ulang atau sinkronkan status misi harian ketika berganti bab
  useEffect(() => {
    switchChapterMissions(chapter);
  }, [chapter, switchChapterMissions]);

  // State Modal Lencana Interaktif
  const [selectedBadge, setSelectedBadge] = useState<BadgeDetail | null>(null);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const badgeSpeechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bersihkan suara & timer saat berpindah halaman
  useEffect(() => {
    return () => {
      if (badgeSpeechTimeoutRef.current) {
        clearTimeout(badgeSpeechTimeoutRef.current);
      }
      stopBadgeSpeech();
    };
  }, []);

  // 1. Misi Harian Belajar Dinamis (6 Misi: Rangkuman, Audio, Game Petualangan, Kuis L1, L2, L3)
  const completedMissionsCount = [
    dailyMissions.readSummary,
    dailyMissions.listenedAudio,
    dailyMissions.playedGame,
    dailyMissions.quizLevel1,
    dailyMissions.quizLevel2,
    dailyMissions.quizLevel3 || dailyMissions.completedQuiz,
  ].filter(Boolean).length;
  const missionProgressPercent = Math.round((completedMissionsCount / 6) * 100);

  

  const [registeredStudents, setRegisteredStudents] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      kelas?: string;
      noAbsen?: string;
      points?: number;
      gamePoints?: number;
      quizScore?: number;
      weakness?: {
        chapterId: string;
        chapterName: string;
        subject: string;
        score: number;
        outOf: number;
        status: "remedial" | "tuntas";
        message: string;
      };
    }>
  >([]);

  const [isPointsReset, setIsPointsReset] = useState(false);

  const checkResetStatus = () => {
    fetch("/api/students/reset-status")
      .then((r) => r.json())
      .then((res) => {
        if (!res?.isReset || !res.resetAt) return;
        const lastAck = Number(localStorage.getItem("last_acknowledged_reset_time") || "0");
        if (res.resetAt > lastAck) {
          // Ada reset baru dari guru!
          localStorage.setItem("last_acknowledged_reset_time", String(res.resetAt));
          resetTotalPoints();
          setIsPointsReset(true);
        }
      })
      .catch(() => {});
  };

  const loadProfile = (targetChapter = chapter) => {
    fetch(`/api/profile?chapter=${encodeURIComponent(targetChapter)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.name) {
          setCurrentStudent(res);
          setCurrentStudentName(res.name);
          const studentScore = res.gamePoints ?? res.points ?? 0;
          setTotalPoints(studentScore);
        }
      })
      .catch(() => {});
  };

  const loadStudents = (targetChapter = chapter) => {
    fetch(`/api/students?chapter=${encodeURIComponent(targetChapter)}`)
      .then((r) => r.json())
      .then((students) => {
        if (Array.isArray(students) && students.length > 0) {
          setRegisteredStudents(students);
          const mapped = students.map((s) => ({
            id: s.id,
            name: s.name,
            points: s.gamePoints ?? s.points ?? 0,
            isUser: false,
          }));
          setClassmates(mapped);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadProfile(chapter);
    loadStudents(chapter);
    checkResetStatus();
    const interval = setInterval(() => {
      checkResetStatus();
      loadStudents(chapter);
    }, 4000);
    return () => clearInterval(interval);
  }, [chapter]);

  useEffect(() => {
    loadStudents(chapter);
  }, [currentStudent?.id, chapter]);

  const handleSwitchStudent = async (studentId: string) => {
    playClickSound();
    try {
      const res = await fetch("/api/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: studentId }),
      });
      if (res.ok) {
        loadProfile(chapter);
        loadStudents(chapter);
      }
    } catch (err) {
      console.error("Gagal mengganti akun:", err);
    }
  };

  // 2. Juara Kelas Dinamis (Leaderboard Terurut Berdasarkan Poin Siswa)
  const [classmates, setClassmates] = useState<
    Array<{ id: string; name: string; points: number; isUser: boolean }>
  >([
    { id: "budi", name: "Budi Santoso", points: 360, isUser: false },
    { id: "siti", name: "Siti Aminah", points: 310, isUser: false },
    { id: "ahmad", name: "Ahmad Fauzi", points: 270, isUser: false },
  ]);

  const combinedClassmates = classmates.map((c) =>
    c.name.toLowerCase().includes(currentStudentName.toLowerCase()) ||
    currentStudentName.toLowerCase().includes(c.name.toLowerCase())
      ? { ...c, name: `${currentStudentName} (Kamu)`, points: totalPoints, isUser: true }
      : c
  );
  if (!combinedClassmates.some((c) => c.isUser)) {
    combinedClassmates.push({
      id: "user",
      name: `${currentStudentName} (Kamu)`,
      points: totalPoints,
      isUser: true,
    });
  }

  const sortedClassmates = [...combinedClassmates].sort((a, b) => b.points - a.points);
  const userRank = sortedClassmates.findIndex((c) => c.isUser) + 1;
  const topThreeClassmates = sortedClassmates.slice(0, 3);
  const firstPlace = topThreeClassmates[0];
  const secondPlace = topThreeClassmates[1];
  const thirdPlace = topThreeClassmates[2];

  const isRankingEmpty =
    (isPointsReset && totalPoints === 0) ||
    (sortedClassmates.length > 0 && sortedClassmates.every((c) => (c.points ?? 0) === 0));

  // 3. Progres Per Bab & Lencana Prestasi (Bertambah seiring bab yang diselesaikan)
  const isPknBab2Unlocked =
    dailyMissions.completedQuiz || dailyMissions.quizLevel1 || totalPoints >= 200;
  const isPknBab3Unlocked = totalPoints >= 300;
  const isPknBab4Unlocked = totalPoints >= 400;

  const isBjawaBab2Unlocked =
    dailyMissions.completedQuiz || dailyMissions.quizLevel1 || totalPoints >= 200;
  const isBjawaBab3Unlocked = totalPoints >= 300;
  const isBjawaBab4Unlocked = totalPoints >= 400;

  const cleanActiveId = activeValidatedModule?.id.replace(/^mod-/, "") ?? "";
  const isDefaultChapter = [
    "pkn-sila3",
    "pkn-gotongroyong",
    "pkn-norma",
    "pkn-bhinneka",
    "bjawa-unggahungguh",
    "bjawa-punokawan",
    "bjawa-pandhawa",
    "bjawa-aksara",
  ].includes(cleanActiveId);

    // --- LENCANA PRESTASI AKTIVITAS HARIAN SISWA (DIPEROLEH OTOMATIS DARI AKTIVITAS HARIAN) ---
  const isQuizCompletedToday = Boolean(
    dailyMissions.quizLevel1 || dailyMissions.quizLevel2 || dailyMissions.quizLevel3 || dailyMissions.completedQuiz
  );

  const dailyActivityBadges: BadgeDetail[] = [
    {
      id: "badge_audio",
      name: "Pendengar Budiman",
      icon: "🎧",
      unlocked: dailyMissions.listenedAudio,
      tag: dailyMissions.listenedAudio ? "Diraih Hari Ini ⭐" : "Belum Diraih 🔒",
      tagColor: dailyMissions.listenedAudio
        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800"
        : "text-slate-500 bg-slate-100 dark:bg-slate-800 font-bold border border-slate-300 dark:border-slate-700",
      description: "Mendengarkan penjelasan audio materi dari Guru dan Robot Pintar.",
      howToGet: "Klik tombol Putar Penjelasan Suara di materi hari ini.",
      motivation: "Hebat! Dengan mendengarkan secara seksama, ilmumu bertambah dan pemahamanmu semakin kuat!",
    },
    {
      id: "badge_game",
      name: "Penjelajah Desa",
      icon: "🎮",
      unlocked: dailyMissions.playedGame,
      tag: dailyMissions.playedGame ? "Diraih Hari Ini ⭐" : "Belum Diraih 🔒",
      tagColor: dailyMissions.playedGame
        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800"
        : "text-slate-500 bg-slate-100 dark:bg-slate-800 font-bold border border-slate-300 dark:border-slate-700",
      description: "Menjelajahi pos edukasi dan berpetualang di Desa Adat Nusantara.",
      howToGet: "Mainkan 1 sesi game petualangan edukasi desa hari ini.",
      motivation: "Petualang cilik tangguh! Kamu telah menjelajahi pos desa dan belajar dengan penuh riang gembira!",
    },
    {
      id: "badge_quiz",
      name: "Bintang Kuis Pintar",
      icon: "🎯",
      unlocked: isQuizCompletedToday,
      tag: isQuizCompletedToday ? "Diraih Hari Ini ⭐" : "Belum Diraih 🔒",
      tagColor: isQuizCompletedToday
        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800"
        : "text-slate-500 bg-slate-100 dark:bg-slate-800 font-bold border border-slate-300 dark:border-slate-700",
      description: "Menjawab kuis tantangan harian dengan pemahaman yang baik.",
      howToGet: "Kerjakan dan selesaikan minimal 1 level kuis tantangan hari ini.",
      motivation: "Bintang kelas yang cemerlang! Ketekunanmu mengerjakan kuis membuktikan kamu anak yang cerdas!",
    },
    {
      id: "badge_summary",
      name: "Kutu Buku Hebat",
      icon: "📖",
      unlocked: dailyMissions.readSummary,
      tag: dailyMissions.readSummary ? "Diraih Hari Ini ⭐" : "Belum Diraih 🔒",
      tagColor: dailyMissions.readSummary
        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800"
        : "text-slate-500 bg-slate-100 dark:bg-slate-800 font-bold border border-slate-300 dark:border-slate-700",
      description: "Membaca ringkasan materi dan intisari pengamalan budi pekerti.",
      howToGet: "Buka dan pahami ringkasan materi di ruang belajar.",
      motivation: "Membaca adalah jendela dunia! Teruslah rajin membaca buku untuk meraih cita-citamu!",
    },
    {
      id: "badge_gotongroyong",
      name: "Sahabat Gotong Royong",
      icon: "🤝",
      unlocked: completedMissionsCount >= 4,
      tag: completedMissionsCount >= 4 ? "Diraih Hari Ini ⭐" : "Belum Diraih 🔒",
      tagColor: completedMissionsCount >= 4
        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800"
        : "text-slate-500 bg-slate-100 dark:bg-slate-800 font-bold border border-slate-300 dark:border-slate-700",
      description: "Menyelesaikan seluruh misi belajar harian dan menyapa kawan sekelas.",
      howToGet: "Selesaikan minimal 4 misi belajar harian hari ini.",
      motivation: "Luar biasa! Kamu adalah teladan Pelajar Pancasila yang disiplin, mandiri, dan berjiwa gotong royong!",
    },
  ];

  const earnedDailyBadges = dailyActivityBadges.filter((b) => b.unlocked);

  const currentSubjectBadges = dailyActivityBadges;
  const earnedBadges = earnedDailyBadges;
  const completeDailyMission = useUIStore((s) => s.completeDailyMission);

  function handleOpenBadge(badge: BadgeDetail) {
    if (badgeSpeechTimeoutRef.current) {
      clearTimeout(badgeSpeechTimeoutRef.current);
      badgeSpeechTimeoutRef.current = null;
    }
    stopBadgeSpeech();
    playBadgeFanfareSound();
    setSelectedBadge(badge);
    setIsSpeaking(true);
    if (!dailyMissions.listenedAudio) {
      addPoints(10, "Keren! Kamu mendengarkan audio motivasi lencana (+10 ⭐)");
    }
    completeDailyMission("listenedAudio");
    const speechText = `Halo Adik Hebat! Selamat, kamu telah meraih ${badge.name}! Pesan motivasi untukmu: ${badge.motivation}. Ayo terus semangat belajar ya!`;
    // Jeda 450ms agar suara efek terdengar merdu terlebih dahulu sebelum robot berbicara
    badgeSpeechTimeoutRef.current = setTimeout(() => {
      speakBadgeMotivation(speechText, () => setIsSpeaking(false));
    }, 450);
  }

  function handleCloseBadge() {
    if (badgeSpeechTimeoutRef.current) {
      clearTimeout(badgeSpeechTimeoutRef.current);
      badgeSpeechTimeoutRef.current = null;
    }
    playClickSound();
    stopBadgeSpeech();
    setIsSpeaking(false);
    setSelectedBadge(null);
  }

  function handleReplaySpeech(badge: BadgeDetail) {
    if (badgeSpeechTimeoutRef.current) {
      clearTimeout(badgeSpeechTimeoutRef.current);
      badgeSpeechTimeoutRef.current = null;
    }
    stopBadgeSpeech();
    playRobotAwakeSound();
    setIsSpeaking(true);
    if (!dailyMissions.listenedAudio) {
      addPoints(10, "Keren! Kamu mendengarkan audio motivasi lencana (+10 ⭐)");
    }
    completeDailyMission("listenedAudio");
    const speechText = badge.unlocked
      ? `Halo Adik Hebat! Ini adalah ${badge.name}. Materi bab ini sudah terbuka untukmu! Pesan motivasi untukmu: ${badge.motivation}. Ayo terus semangat belajar ya!`
      : `Halo Adik Hebat! ${badge.name} masih terkunci ya. Cara membukanya: ${badge.howToGet}. Ayo tuntaskan bab sebelumnya terlebih dahulu! Kamu pasti bisa!`;
    badgeSpeechTimeoutRef.current = setTimeout(() => {
      speakBadgeMotivation(speechText, () => setIsSpeaking(false));
    }, 180);
  }

  function handleStopSpeech() {
    if (badgeSpeechTimeoutRef.current) {
      clearTimeout(badgeSpeechTimeoutRef.current);
      badgeSpeechTimeoutRef.current = null;
    }
    playClickSound();
    stopBadgeSpeech();
    setIsSpeaking(false);
  }

  function handleStudyChapter(targetChapterId?: string) {
    if (!targetChapterId) return;
    playClickSound();
    stopBadgeSpeech();
    setIsSpeaking(false);
    setSelectedBadge(null);

    const params = new URLSearchParams(searchParams);
    params.set("chapter", targetChapterId);
    params.set("mode", "cerita");
    params.set("r", Date.now().toString());
    navigate(`/dashboard/pelajar?${params.toString()}`);

    setTimeout(() => {
      const el = document.getElementById("papan-tulis-materi");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  }

    // State daftar materi yang dihapus oleh siswa
  const [deletedChapterIds, setDeletedChapterIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("deleted_chapter_ids");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [];
  });

  // State rekomendasi modul pengayaan dari guru untuk siswa
  const [activePengayaanRec, setActivePengayaanRec] = useState<{
    studentId?: string;
    studentName?: string;
    chapterTitle?: string;
    subject?: string;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("active_student_pengayaan_recommendation");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("deleted_chapter_ids");
        setDeletedChapterIds(stored ? JSON.parse(stored) : []);
        const recStored = localStorage.getItem("active_student_pengayaan_recommendation");
        setActivePengayaanRec(recStored ? JSON.parse(recStored) : null);
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Fungsi hapus materi per bab / materi yang sudah tidak dipakai
  function handleDeleteChapter(badge: BadgeDetail) {
    playClickSound();
    const confirmed = window.confirm(
      `Hapus materi "${badge.name}"?\n\nMateri yang sudah tidak dipakai ini akan dihapus dari daftar belajarmu.`
    );
    if (!confirmed) return;

    const toDelete = [
      badge.id,
      badge.targetChapterId,
      badge.id.replace(/^mod-/, ""),
      badge.targetChapterId?.replace(/^mod-/, ""),
    ].filter(Boolean) as string[];

    const updated = Array.from(new Set([...deletedChapterIds, ...toDelete]));
    setDeletedChapterIds(updated);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("deleted_chapter_ids", JSON.stringify(updated));
      } catch {}
    }

    // Jika materi ini adalah modul kurikulum di server (custom/guru), hapus juga via backend API
    if (badge.id.startsWith("mod-") || badge.targetChapterId?.startsWith("mod-")) {
      const modId = badge.id.startsWith("mod-") ? badge.id : (badge.targetChapterId || badge.id);
      fetch(`/api/v1/curriculum/modules/${encodeURIComponent(modId)}`, {
        method: "DELETE",
      }).catch(() => {});
    }

    // Jika materi yang dihapus adalah materi yang sedang aktif di layar, alihkan ke materi lain yang tersisa
    const isCurrentActive =
      chapter === badge.targetChapterId ||
      chapter === badge.id ||
      chapter.replace(/^mod-/, "") === badge.targetChapterId?.replace(/^mod-/, "");

    if (isCurrentActive) {
      const remainingInSubject = currentSubjectBadges.filter(
        (b) => !toDelete.includes(b.id) && !toDelete.includes(b.targetChapterId || "")
      );
      const fallbackBadge = remainingInSubject[0];
      if (fallbackBadge?.targetChapterId) {
        handleStudyChapter(fallbackBadge.targetChapterId);
      }
    }
  }

  function handleRestoreAllChapters() {
    playClickSound();
    setDeletedChapterIds([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("deleted_chapter_ids");
      } catch {}
    }
  }

  const chapterLabel =
    activeValidatedModule?.title ??
    availableChapters.find((c) => c.value === chapter)?.label ??
    "Beranda Belajar";
  useDocumentTitle(`Siswa SD — ${chapterLabel}`);

  return (
    <div className="space-y-6 bg-sky-50 dark:bg-slate-950/80 min-h-screen p-4 rounded-3xl transition-colors">
      {/* 1. KOTAK MISI SISWA (WARNA WARNI & CERIA UNTUK ANAK SD) */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-400 via-blue-400 to-indigo-400 dark:from-sky-950 dark:via-blue-950 dark:to-indigo-950 p-6 sm:p-8 text-white shadow-xl shadow-sky-300/50 dark:shadow-none border-4 border-white dark:border-slate-800">
        {/* Dekorasi Bentuk Lucu */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-yellow-300/30 dark:bg-yellow-500/10 rounded-full blur-xl pointer-events-none animate-pulse" />
        <div className="absolute left-10 -top-10 w-32 h-32 bg-pink-300/30 dark:bg-pink-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-900 dark:text-blue-200 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full shadow-sm border-2 border-sky-200 dark:border-sky-800">
                🏫 SD Negeri 1 Madiun
              </span>
              <span className="text-xs font-black text-amber-900 bg-amber-300 dark:bg-amber-400 px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border-2 border-white dark:border-amber-300">
                🔥 Keaktifan Belajar 7 Hari
              </span>
              {registeredStudents.length > 0 && (
                <div className="inline-flex items-center gap-2 text-xs font-black text-blue-950 dark:text-blue-100 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-full shadow-md border-2 border-sky-300 dark:border-sky-600">
                  <span>👤 Akun:</span>
                  <select
                    aria-label="Pilih Akun Siswa"
                    value={currentStudent?.id || ""}
                    onChange={(e) => handleSwitchStudent(e.target.value)}
                    className="bg-transparent font-black text-xs text-blue-900 dark:text-blue-200 cursor-pointer focus:outline-none"
                  >
                    {registeredStudents.map((s) => (
                      <option key={s.id} value={s.id} className="text-slate-900 bg-white">
                        {s.name} (🎮 {s.gamePoints ?? s.points ?? 0} Poin | 📝 Kuis: {s.quizScore ?? (s.weakness ? s.weakness.score * 10 : 80)}{s.weakness?.status === "remedial" ? " - ⚠️ Remedial" : ""})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
              Hai, {currentStudent?.name || currentStudentName}! 🎒
            </h1>
            <p className="text-sm sm:text-base text-sky-50 dark:text-sky-200 max-w-xl font-bold leading-relaxed drop-shadow-sm">
              Materi Pendidikan Kewarganegaraan (PKn) dan Bahasa Jawa terintegrasi Kurikulum
              Merdeka. Kumpulkan poin prestasi dan raih capaian belajar terbaik!
            </p>
          </div>

          {/* Gamifikasi 2 Skor Utama: Skor Game & Skor Kuis (Rapi, Seimbang & Selaras) */}
          <div className="flex items-center gap-3.5 sm:gap-5 bg-white/25 dark:bg-slate-800/80 backdrop-blur-md border-3 border-white/60 dark:border-slate-700 rounded-2xl px-4 sm:px-5 py-3 shadow-lg text-white">
            {/* 🎮 Skor Game */}
            <div className="flex flex-col items-start gap-1 shrink-0">
              <span className="text-[11px] font-black text-white/95 dark:text-sky-300 tracking-wider flex items-center gap-1.5 drop-shadow-xs">
                <span>🎮</span>
                <span>Skor Game</span>
              </span>
              <PointsBadge value={currentStudent?.gamePoints ?? currentStudent?.points ?? totalPoints} />
            </div>

            {/* Pemisah Vertikal Halus */}
            <div className="h-9 w-0.5 bg-white/35 dark:bg-slate-700 rounded-full shrink-0" />

            {/* 📝 Skor Kuis */}
            <div className="flex flex-col items-start gap-1 shrink-0">
              <span className="text-[11px] font-black text-white/95 dark:text-emerald-300 tracking-wider flex items-center gap-1.5 drop-shadow-xs">
                <span>📝</span>
                <span>Skor Kuis</span>
              </span>
              <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 px-3.5 py-1 rounded-full border-2 border-emerald-400 dark:border-emerald-700 shadow-sm">
                <span className="text-base">🎯</span>
                <span className="text-lg font-black leading-none">
                  {currentStudent?.quizScore ?? (currentStudent?.weakness ? currentStudent.weakness.score * 10 : 90)}
                </span>
                <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 leading-none">
                  / 100
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SMART ALERT: REKOMENDASI BELAJAR (FR-17) - DINAMIS SESUAI KEKURANGAN AKUN / SARAN GURU */}
      {(() => {
        const hasTeacherPengayaan = !!activePengayaanRec;
        const weakness = currentStudent?.weakness;
        const isRemedial = hasTeacherPengayaan ? false : (weakness ? weakness.status === "remedial" : true);
        const chapterTarget = hasTeacherPengayaan
          ? (activePengayaanRec.chapterTitle?.toLowerCase().includes("gotong")
              ? "pkn-gotongroyong"
              : activePengayaanRec.chapterTitle?.toLowerCase().includes("norma")
                ? "pkn-norma"
                : activePengayaanRec.chapterTitle?.toLowerCase().includes("bhinneka")
                  ? "pkn-bhinneka"
                  : activePengayaanRec.chapterTitle?.toLowerCase().includes("unggah")
                    ? "bjawa-unggahungguh"
                    : activePengayaanRec.chapterTitle?.toLowerCase().includes("punokawan")
                      ? "bjawa-punokawan"
                      : activePengayaanRec.chapterTitle?.toLowerCase().includes("pandhawa")
                        ? "bjawa-pandhawa"
                        : activePengayaanRec.chapterTitle?.toLowerCase().includes("aksara")
                          ? "bjawa-aksara"
                          : weakness?.chapterId || "pkn-sila3")
          : (weakness?.chapterId || "pkn-gotongroyong");
        const chapterName = hasTeacherPengayaan
          ? (activePengayaanRec.chapterTitle || "Pelajaran Rekomendasi Pengayaan Guru")
          : (weakness?.chapterName || "Pelajaran PKn (Gotong Royong)");

        return (
          <aside
            className={`rounded-3xl border-4 ${
              isRemedial
                ? "border-amber-300 dark:border-amber-800/70 bg-gradient-to-r from-amber-100 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20"
                : "border-emerald-300 dark:border-emerald-800/70 bg-gradient-to-r from-emerald-100 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20"
            } p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden`}
          >
            <div className="flex items-start gap-4 relative z-10">
              <div
                className={`w-12 h-12 rounded-full ${
                  isRemedial ? "bg-amber-500" : "bg-emerald-500"
                } text-white flex items-center justify-center shrink-0 shadow-sm font-black text-xl border-2 border-white dark:border-amber-900`}
              >
                {isRemedial ? "💡" : "🌟"}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    className={`font-black ${
                      isRemedial
                        ? "text-amber-900 dark:text-amber-200"
                        : "text-emerald-900 dark:text-emerald-200"
                    } text-base sm:text-lg`}
                  >
                    {hasTeacherPengayaan
                      ? "Rekomendasi Modul Pengayaan dari Guru 🚀"
                      : isRemedial
                        ? "Rekomendasi Bimbingan & Pengulangan Materi 💡"
                        : "Capaian Belajar Istimewa: Tuntas KKTP 🌟"}
                  </h2>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                      isRemedial
                        ? "bg-amber-200/90 text-amber-950 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700"
                        : "bg-emerald-200/90 text-emerald-950 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700"
                    }`}
                  >
                    {hasTeacherPengayaan
                      ? "Disarankan oleh Bpk/Ibu Guru ✨"
                      : isRemedial
                        ? `Evaluasi: ${weakness?.score ?? 2}/${weakness?.outOf ?? 10} (Perlu Bimbingan)`
                        : "Melampaui Target KKTP"}
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    isRemedial
                      ? "text-amber-800 dark:text-amber-300"
                      : "text-emerald-800 dark:text-emerald-300"
                  } font-semibold leading-relaxed max-w-2xl`}
                >
                  {hasTeacherPengayaan ? (
                    <>
                      Bapak/Ibu Guru secara khusus merekomendasikanmu untuk mempelajari <b>modul pengayaan {chapterName}</b>.
                      Yuk pelajari intisarinya dan selesaikan tantangan belajar agar pemahamanmu semakin hebat!
                    </>
                  ) : isRemedial ? (
                    <>
                      Nilai belajarmu di <b>{chapterName}</b> masih perlu sedikit latihan lagi ya.
                      Yuk pelajari kembali cerita seru dan contoh perbuatan baik yang telah
                      disiapkan Guru!
                    </>
                  ) : (
                    weakness?.message ||
                    "Luar biasa! Seluruh nilai belajarmu sudah tuntas dan sangat hebat. Yuk pelajari modul pengayaan agar wawasanmu makin luas!"
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleStudyChapter(chapterTarget)}
              className={`relative z-10 ${
                isRemedial
                  ? "bg-amber-600 hover:bg-amber-700 dark:border-amber-400"
                  : "bg-emerald-600 hover:bg-emerald-700 dark:border-emerald-400"
              } text-white text-sm font-black px-6 py-3 rounded-full transition shadow-md hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2 border-2 border-white cursor-pointer`}
            >
              <span>
                {hasTeacherPengayaan
                  ? "Pelajari Modul Pengayaan 🚀"
                  : isRemedial
                    ? "Pelajari Modul Sekarang 🚀"
                    : "Pelajari Modul Pengayaan 🚀"}
              </span>
            </button>
          </aside>
        );
      })()}

      {/* 3. WORKSPACE: AREA BELAJAR UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Kiri: Pilihan Pelajaran & Mode */}
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border-4 border-sky-100 dark:border-slate-800 shadow-xl shadow-sky-200/40 dark:shadow-none space-y-4">
          <div className="text-center pb-3 border-b-2 border-sky-50 dark:border-slate-800">
            <h3 className="font-black text-lg text-sky-800 dark:text-sky-300">Materi Pelajaran Aktif 📚</h3>
            <p className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-1 flex items-center justify-center gap-1.5">
              <span className="w-3.5 h-2.5 rounded-xs inline-flex flex-col border border-slate-300 dark:border-slate-600 shadow-2xs shrink-0 overflow-hidden">
                <span className="bg-rose-600 h-1/2 w-full" />
                <span className="bg-white h-1/2 w-full" />
              </span>
              <span>PKn &amp; 🎭 Bahasa Jawa</span>
            </p>
          </div>

          <ChapterModeSelector chapter={chapter} mode={mode} />

          {/* Tombol Game Edukasi Interaktif (Game 3D Seru) */}
          <div>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsGameModalOpen(true);
              }}
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-3.5 px-4 rounded-2xl transition shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between border-4 border-white dark:border-amber-600 group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
                  {activeGameInfo.icon}
                </span>
                <div className="text-left min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-yellow-100 flex items-center gap-1.5 flex-wrap">
                    <span>Game Seru</span>
                    <span className="bg-white/20 px-1.5 py-0.2 rounded text-[9px] font-bold">{activeGameInfo.badge} 🎵</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black truncate text-white">
                    {activeGameInfo.title}
                  </div>
                </div>
              </div>
              <span className="text-[11px] bg-white text-orange-950 font-black px-2.5 py-1 rounded-full shadow-xs shrink-0">
                +25 Poin ⭐
              </span>
            </button>
          </div>

          {/* Tombol Mulai Kuis Evaluasi */}
          <div>
            <Link
              to={`/dashboard/pelajar/kuis?chapter=${encodeURIComponent(chapter)}`}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black py-3.5 px-5 rounded-2xl transition shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 flex items-center justify-between border-4 border-white dark:border-emerald-600 group"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-base">
                  🎮
                </span>
                <span className="text-sm">Mulai Kuis Tantangan 🎮</span>
              </div>
              <span className="text-xs bg-yellow-300 dark:bg-amber-300 text-amber-900 font-black px-3 py-1 rounded-full shadow-sm">
                +30 Poin 🌟
              </span>
            </Link>
          </div>

          {/* 1. MISI HARIAN BELAJAR (DINAMIS & REAL-TIME DENGAN 3 LEVEL KUIS) */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-100/60 dark:from-amber-950/30 dark:to-yellow-950/20 p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-800/60 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-black bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded-md text-amber-900 dark:text-amber-200">
                  🎯
                </span>
                <h4 className="font-black text-xs text-amber-950 dark:text-amber-200 uppercase tracking-wider truncate">
                  Misi Harian Belajar
                </h4>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    resetCurrentChapterMissions(chapter);
                  }}
                  title="Set ulang misi harian untuk bab ini"
                  className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all active:scale-95 flex items-center gap-1 shadow-2xs"
                >
                  <span>🔄</span>
                  <span>Reset</span>
                </button>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs transition-all ${
                    completedMissionsCount === 5
                      ? "bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 animate-pulse font-black"
                      : "bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200"
                  }`}
                >
                  {completedMissionsCount === 6
                    ? "🎉 6/6 Tuntas Penuh!"
                    : `🎯 ${completedMissionsCount}/6 Tuntas`}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              {/* Misi 1: Memahami Materi yang Disampaikan */}
              <div
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  dailyMissions.readSummary
                    ? "bg-white/95 dark:bg-slate-800/95 border-emerald-300 dark:border-emerald-700"
                    : "bg-white/70 dark:bg-slate-800/70 border-amber-200 dark:border-amber-900/40"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                  <span
                    className={
                      dailyMissions.readSummary
                        ? "text-emerald-500 font-black text-sm"
                        : "text-slate-300 dark:text-slate-600 font-black"
                    }
                  >
                    {dailyMissions.readSummary ? "✅" : "⏳"}
                  </span>
                  <span>Memahami Materi yang Disampaikan 📖</span>
                </div>
                <span
                  className={`text-[11px] font-black ${
                    dailyMissions.readSummary
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {dailyMissions.readSummary ? "Tuntas (+10 ⭐)" : "+10 Poin"}
                </span>
              </div>

              {/* Misi 2: Mendengarkan Penjelasan Materi */}
              <div
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  dailyMissions.listenedAudio
                    ? "bg-white/95 dark:bg-slate-800/95 border-emerald-300 dark:border-emerald-700"
                    : "bg-white/70 dark:bg-slate-800/70 border-amber-200 dark:border-amber-900/40"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                  <span
                    className={
                      dailyMissions.listenedAudio
                        ? "text-emerald-500 font-black text-sm"
                        : "text-slate-300 dark:text-slate-600 font-black"
                    }
                  >
                    {dailyMissions.listenedAudio ? "✅" : "⏳"}
                  </span>
                  <span>Mendengarkan Penjelasan Materi 🎧</span>
                </div>
                <span
                  className={`text-[11px] font-black ${
                    dailyMissions.listenedAudio
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {dailyMissions.listenedAudio ? "Tuntas (+10 ⭐)" : "+10 Poin"}
                </span>
              </div>

              {/* Misi 3: Taklukkan Kuis Level 1 */}
              <Link
                to={`/dashboard/pelajar/kuis?level=1&chapter=${encodeURIComponent(chapter)}`}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all hover:scale-[1.01] ${
                  dailyMissions.quizLevel1
                    ? "bg-white/95 dark:bg-slate-800/95 border-emerald-300 dark:border-emerald-700"
                    : "bg-white/70 dark:bg-slate-800/70 border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                  <span
                    className={
                      dailyMissions.quizLevel1
                        ? "text-emerald-500 font-black text-sm"
                        : "text-slate-300 dark:text-slate-600 font-black"
                    }
                  >
                    {dailyMissions.quizLevel1 ? "✅" : "⏳"}
                  </span>
                  <span>Taklukkan Kuis Level 1 🎮</span>
                </div>
                <span
                  className={`text-[11px] font-black ${
                    dailyMissions.quizLevel1
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {dailyMissions.quizLevel1 ? "Tuntas (+10 🏆)" : "+10 Poin"}
                </span>
              </Link>

              {/* Misi 4: Taklukkan Kuis Level 2 */}
              <Link
                to={`/dashboard/pelajar/kuis?level=2&chapter=${encodeURIComponent(chapter)}`}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all hover:scale-[1.01] ${
                  dailyMissions.quizLevel2
                    ? "bg-white/95 dark:bg-slate-800/95 border-emerald-300 dark:border-emerald-700"
                    : "bg-white/70 dark:bg-slate-800/70 border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                  <span
                    className={
                      dailyMissions.quizLevel2
                        ? "text-emerald-500 font-black text-sm"
                        : "text-slate-300 dark:text-slate-600 font-black"
                    }
                  >
                    {dailyMissions.quizLevel2 ? "✅" : "⏳"}
                  </span>
                  <span>Taklukkan Kuis Level 2 ⚡</span>
                </div>
                <span
                  className={`text-[11px] font-black ${
                    dailyMissions.quizLevel2
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {dailyMissions.quizLevel2 ? "Tuntas (+20 🏆)" : "+20 Poin"}
                </span>
              </Link>

              {/* Misi 5: Taklukkan Kuis Level 3 */}
              <Link
                to={`/dashboard/pelajar/kuis?level=3&chapter=${encodeURIComponent(chapter)}`}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all hover:scale-[1.01] ${
                  dailyMissions.quizLevel3 || dailyMissions.completedQuiz
                    ? "bg-white/95 dark:bg-slate-800/95 border-emerald-300 dark:border-emerald-700"
                    : "bg-white/70 dark:bg-slate-800/70 border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                  <span
                    className={
                      dailyMissions.quizLevel3 || dailyMissions.completedQuiz
                        ? "text-emerald-500 font-black text-sm"
                        : "text-slate-300 dark:text-slate-600 font-black"
                    }
                  >
                    {dailyMissions.quizLevel3 || dailyMissions.completedQuiz ? "✅" : "⏳"}
                  </span>
                  <span>Taklukkan Kuis Level 3 👑</span>
                </div>
                <span
                  className={`text-[11px] font-black ${
                    dailyMissions.quizLevel3 || dailyMissions.completedQuiz
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {dailyMissions.quizLevel3 || dailyMissions.completedQuiz
                    ? "Tuntas (+30 🏆)"
                    : "+30 Poin"}
                </span>
              </Link>

              {/* Misi 6: Mainkan 1 Sesi Game Petualangan Edukasi */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsGameModalOpen(true);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all hover:scale-[1.01] text-left cursor-pointer ${
                  dailyMissions.playedGame
                    ? "bg-white/95 dark:bg-slate-800/95 border-emerald-300 dark:border-emerald-700"
                    : "bg-white/70 dark:bg-slate-800/70 border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                  <span
                    className={
                      dailyMissions.playedGame
                        ? "text-emerald-500 font-black text-sm"
                        : "text-slate-300 dark:text-slate-600 font-black"
                    }
                  >
                    {dailyMissions.playedGame ? "✅" : "⏳"}
                  </span>
                  <span>Mainkan Game Petualangan Desa 🗺️</span>
                </div>
                <span
                  className={`text-[11px] font-black ${
                    dailyMissions.playedGame
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {dailyMissions.playedGame ? "Tuntas (+15 ⭐)" : "+15 Poin"}
                </span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-amber-200/70 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${missionProgressPercent}%` }}
              />
            </div>
          </div>

          {/* KOLEKSI LENCANA PRESTASI BAB (KOTAK KECIL HORIZONTAL SCROLL / GESER) */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-800/80 dark:to-slate-900 p-3.5 rounded-2xl border-2 border-sky-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm">⭐</span>
                <h4 className="font-black text-xs text-sky-950 dark:text-sky-200 truncate">
                  Lencana Aktivitas Harian
                </h4>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 shadow-2xs">
                  🏆 {earnedDailyBadges.length}/5 Diraih
                </span>
              </div>
            </div>

            {/* Kotak Geser Horizontal 5 Lencana Aktivitas Harian */}
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-sky-300 dark:scrollbar-thumb-slate-600 snap-x">
              {dailyActivityBadges.map((badge) => {
                const isUnlocked = badge.unlocked;
                return (
                  <div
                    key={badge.id}
                    className={`shrink-0 w-32 p-2.5 rounded-2xl border-2 transition-all flex flex-col justify-between text-center snap-start ${
                      isUnlocked
                        ? "bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-800 border-amber-400 shadow-md shadow-amber-500/10"
                        : "bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-70"
                    }`}
                  >
                    <div
                      onClick={() => handleOpenBadge(badge)}
                      className="cursor-pointer space-y-1.5"
                      title={`Klik untuk melihat info ${badge.name}`}
                    >
                      <div
                        className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-xl shadow-xs transition-transform ${
                          isUnlocked
                            ? "bg-gradient-to-br from-amber-400 to-yellow-400 text-yellow-950 animate-bounce"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                        }`}
                      >
                        {badge.icon}
                      </div>
                      <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight line-clamp-1">
                        {badge.name}
                      </p>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-full inline-block ${
                          isUnlocked
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500 border border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isUnlocked ? "Diraih ⭐" : "Belum Diraih 🔒"}
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBadge(badge);
                        }}
                        className={`w-full py-1 px-1.5 rounded-lg font-black text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs ${
                          isUnlocked
                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                        }`}
                      >
                        <span>{isUnlocked ? "🔊 Motivasi" : "❓ Cara Raih"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-bold">
              👈 Geser untuk melihat lencana lainnya 👉
            </p>
          </div>
        </aside>

        {/* Panel Kanan: Papan Tulis AI */}
        <article
          id="papan-tulis-materi"
          className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border-4 border-sky-100 dark:border-slate-800 shadow-xl shadow-sky-200/40 dark:shadow-none relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 dark:bg-sky-950/20 rounded-bl-full -z-10 opacity-50" />
          <AiContentPanel chapterId={chapter} mode={mode} refreshNonce={refreshNonce} />
        </article>
      </div>

      {/* 4. TANGGA JUARA KELAS 3 BESAR (MODEL PODIUM HORIZONTAL DI PALING BAWAH) */}
      <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border-4 border-purple-200 dark:border-purple-950/60 shadow-lg shadow-purple-200/30 dark:shadow-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-purple-50 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 flex items-center justify-center font-black text-xl shadow-sm">
              🏆
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-purple-950 dark:text-purple-200">
                Tangga Juara Kelas 4A 🏆
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                Tiga Siswa Teratas Peraih Poin Prestasi Tertinggi Pekan Ini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRankingEmpty ? (
              <span className="text-xs font-black text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-3 py-1.5 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 animate-pulse shadow-2xs">
                <span>⚠️</span>
                <span>Poin Telah Di-Reset Guru</span>
              </span>
            ) : (
              <span className="text-xs font-black text-purple-800 dark:text-purple-200 bg-purple-100 dark:bg-purple-950/80 px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800">
                {userRank <= 3 ? `🎉 Kamu Juara ${userRank}!` : `Peringkatmu: ke-${userRank} (${totalPoints} Poin)`}
              </span>
            )}
          </div>
        </div>

        {/* Jika Poin Telah Di-Reset Guru: Sembunyikan Tangga Podium & Tampilkan Notifikasi Khusus */}
        {isRankingEmpty ? (
          <div className="py-7 px-4 sm:px-6 text-center bg-gradient-to-br from-amber-50 to-orange-50/70 dark:from-slate-800/90 dark:to-amber-950/40 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 space-y-3 my-2 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-400 text-amber-950 flex items-center justify-center text-3xl shadow-sm animate-bounce">
              📢
            </div>
            <div className="space-y-1">
              <h4 className="text-base sm:text-lg font-black text-amber-950 dark:text-amber-200">
                Poin Telah Di-Reset oleh Guru 🔄
              </h4>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300 max-w-md mx-auto leading-relaxed">
                Bapak/Ibu Guru telah mereset seluruh perolehan poin dan tangga juara kelas untuk memulai periode baru.
                Tangga juara akan otomatis tampil kembali setelah kamu menyelesaikan kuis dan misi harian! 🚀
              </p>
            </div>
            <div className="pt-1">
              <Link
                to={`/dashboard/pelajar/kuis?level=1&chapter=${encodeURIComponent(chapter)}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>🎮</span>
                <span>Mulai Kuis &amp; Kumpulkan Poin Baru</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Podium Horizontal: Juara 2 (Kiri), Juara 1 (Tengah Lebih Tinggi), Juara 3 (Kanan) */
          <div className="pt-2 pb-1">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto items-end text-center">
              {/* JUARA 2 (PERAK) */}
              {secondPlace && (
                <div className="flex flex-col items-center">
                  <div
                    className={`w-full p-2.5 sm:p-3 rounded-2xl border-2 transition-all space-y-1 ${
                      secondPlace.isUser
                        ? "bg-amber-100/90 dark:bg-amber-950/60 border-amber-400 shadow-md ring-2 ring-amber-300"
                        : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl block">🥈</span>
                    <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                      {secondPlace.name}
                    </p>
                    <span className="inline-block text-[10px] sm:text-xs font-black bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg">
                      🪙 {secondPlace.points} Poin
                    </span>
                  </div>
                  {/* Tangga Podium 2 */}
                  <div className="w-full bg-gradient-to-t from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-600 h-20 sm:h-24 rounded-t-2xl flex flex-col items-center justify-center border-t-4 border-slate-400 dark:border-slate-500 shadow-inner mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-slate-200">2</span>
                    <span className="text-[10px] sm:text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Perak</span>
                  </div>
                </div>
              )}

              {/* JUARA 1 (EMAS - PALING TINGGI) */}
              {firstPlace && (
                <div className="flex flex-col items-center">
                  <div className="relative w-full">
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl drop-shadow-md animate-pulse">👑</span>
                    <div
                      className={`w-full p-3 sm:p-3.5 rounded-2xl border-3 transition-all space-y-1 ${
                        firstPlace.isUser
                          ? "bg-gradient-to-br from-yellow-200 via-amber-200 to-yellow-100 dark:from-amber-900/60 dark:to-yellow-900/40 border-amber-500 shadow-lg ring-3 ring-amber-400 scale-[1.03]"
                          : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-md"
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl block">🥇</span>
                      <p className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 truncate">
                        {firstPlace.name}
                      </p>
                      <span className="inline-block text-[11px] sm:text-xs font-black bg-amber-300 dark:bg-amber-900 text-amber-950 dark:text-amber-100 px-2.5 py-0.5 rounded-lg shadow-2xs">
                        🪙 {firstPlace.points} Poin
                      </span>
                    </div>
                  </div>
                  {/* Tangga Podium 1 */}
                  <div className="w-full bg-gradient-to-t from-amber-400 via-yellow-400 to-yellow-300 dark:from-amber-700 dark:via-yellow-600 dark:to-yellow-500 h-28 sm:h-32 rounded-t-2xl flex flex-col items-center justify-center border-t-4 border-yellow-200 dark:border-yellow-300 shadow-md mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-amber-950 dark:text-amber-100 drop-shadow-sm">1</span>
                    <span className="text-[10px] sm:text-xs font-black text-amber-900 dark:text-amber-100 uppercase tracking-wider">Juara 1 ⭐</span>
                  </div>
                </div>
              )}

              {/* JUARA 3 (PERUNGGU) */}
              {thirdPlace && (
                <div className="flex flex-col items-center">
                  <div
                    className={`w-full p-2.5 sm:p-3 rounded-2xl border-2 transition-all space-y-1 ${
                      thirdPlace.isUser
                        ? "bg-amber-100/90 dark:bg-amber-950/60 border-amber-400 shadow-md ring-2 ring-amber-300"
                        : "bg-orange-50/70 dark:bg-slate-800/80 border-orange-200 dark:border-orange-900/40"
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl block">🥉</span>
                    <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                      {thirdPlace.name}
                    </p>
                    <span className="inline-block text-[10px] sm:text-xs font-black bg-amber-200/80 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 px-2 py-0.5 rounded-lg">
                      🪙 {thirdPlace.points} Poin
                    </span>
                  </div>
                  {/* Tangga Podium 3 */}
                  <div className="w-full bg-gradient-to-t from-amber-600/70 to-orange-400 dark:from-amber-900 dark:to-amber-700 h-16 sm:h-20 rounded-t-2xl flex flex-col items-center justify-center border-t-4 border-orange-300 dark:border-orange-500 shadow-inner mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-white dark:text-amber-100">3</span>
                    <span className="text-[10px] sm:text-xs font-black text-amber-100 uppercase tracking-wider">Perunggu</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 5. MODAL INTERAKTIF: CARA MENDAPATKAN LENCANA & SUARA MOTIVASI ROBOT */}
      {selectedBadge && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border-4 border-amber-300 dark:border-amber-500/80 shadow-2xl p-6 sm:p-7 space-y-5 relative overflow-hidden">
              {/* Dekorasi kilau */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-yellow-200/40 dark:bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-sky-200/40 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header Bab & Lencana */}
              <div className="flex items-start justify-between gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-md border-2 shrink-0 ${
                      selectedBadge.unlocked
                        ? "bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 text-amber-950 border-white dark:border-amber-300 shadow-amber-300/40"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <span>{selectedBadge.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {selectedBadge.name}
                      </h3>
                    </div>
                    <span
                      className="text-[11px] font-black px-2.5 py-0.5 rounded-full inline-block mt-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                    >
                      🎉 Lencana Berhasil Diraih
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseBadge}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-black text-lg flex items-center justify-center transition cursor-pointer"
                  aria-label="Tutup Dialog"
                >
                  ✕
                </button>
              </div>

              {/* Deskripsi Singkat */}
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {selectedBadge.description}
              </p>

              {/* Kotak Petunjuk / Pencapaian Bab */}
              <div className="p-4 rounded-2xl border-2 space-y-1.5 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 dark:text-amber-200">
                    ⭐ Status Pembelajaran Bab Ini:
                  </h4>
                </div>
                <p className="text-xs font-bold leading-relaxed text-amber-900 dark:text-amber-300">
                  {selectedBadge.howToGet}
                </p>
              </div>

              {/* Kotak Pesan Motivasi Khusus */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 border-2 border-sky-300 dark:border-sky-700/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-sky-950 dark:text-sky-200 uppercase tracking-wider">
                    💡 Pesan Motivasi Buat Kamu:
                  </h4>
                </div>
                <p className="text-xs font-bold text-sky-900 dark:text-sky-300 leading-relaxed italic">
                  &ldquo;{selectedBadge.motivation}&rdquo;
                </p>
              </div>

              {/* Kontrol Suara Robot Penyemangat */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    🎙️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                        {isSpeaking ? "Suara Sedang Diputar... 🔊" : "Suara Pendamping Belajar 🎙️"}
                      </span>
                      {isSpeaking && (
                        <div className="flex items-center gap-1 h-3">
                          <span className="w-1 bg-amber-500 rounded-full animate-bounce h-2.5" />
                          <span className="w-1 bg-amber-500 rounded-full animate-bounce [animation-delay:150ms] h-3.5" />
                          <span className="w-1 bg-amber-500 rounded-full animate-bounce [animation-delay:300ms] h-2" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      {isSpeaking ? "Dengarkan baik-baik ya!" : "Tekan untuk mendengarkan panduan"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {isSpeaking ? (
                    <button
                      type="button"
                      onClick={handleStopSpeech}
                      className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs transition shadow-md flex items-center gap-1.5"
                    >
                      <span>⏹️</span>
                      <span>Hentikan</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReplaySpeech(selectedBadge)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition shadow-md shadow-amber-500/30 flex items-center gap-1.5"
                    >
                      <span>▶</span>
                      <span>Putar Suara 🔊</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tombol Aksi Bawah */}
              <div className="pt-1 flex flex-wrap items-center justify-end gap-3">
                {selectedBadge.unlocked && selectedBadge.targetChapterId && (
                  <button
                    type="button"
                    onClick={() => handleStudyChapter(selectedBadge.targetChapterId)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs transition shadow-md text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>📖 Pelajari Lagi Bab Ini</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCloseBadge}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs transition shadow-lg shadow-emerald-500/30 text-center cursor-pointer"
                >
                  Keren, Aku Mengerti! 👍
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Game Edukasi Adaptif (1 Materi = 1 Model Game Eksklusif Sesuai Materi yang Diambil) */}
      <AdaptiveEduGameModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        chapter={chapter}
        chapterTitle={currentChapterInfo.title}
        studentName={currentStudentName}
        forcedGameMode={activeGameInfo.type as any}
        activeModule={currentChapterInfo.moduleToPass}
      />
    </div>
  );
}
