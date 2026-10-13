// src/views/PelajarDashboardPage.tsx — Ruang Belajar Siswa SD (PKn & Bahasa Jawa)

import AiContentPanel from "@/components/AiContentPanel";
import ChapterModeSelector from "@/components/ChapterModeSelector";
import LevelBadge from "@/components/LevelBadge";
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
import { useUIStore } from "@/lib/store/useUIStore";
import { type AiMode, availableChapters } from "@shared/catalog";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

interface BadgeDetail {
  id: string;
  chapterCode?: string;
  subject: "pkn" | "bjawa";
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

  const setActiveValidatedModule = useUIStore((s) => s.setActiveValidatedModule);

  useEffect(() => {
    let lastActiveId = activeValidatedModule?.id;
    // Sinkronkan modul aktif yang baru saja divalidasi oleh Guru via API secara real-time
    const syncActiveModule = () => {
      fetch("/api/v1/curriculum/active")
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
  }, [setActiveValidatedModule, activeValidatedModule?.id]);

  useEffect(() => {
    setBadgeSubject(isJawaCurrent ? "bjawa" : "pkn");
  }, [chapter, isJawaCurrent]);

  // Set ulang atau sinkronkan status misi harian ketika berganti bab
  useEffect(() => {
    switchChapterMissions(chapter);
  }, [chapter, switchChapterMissions]);

  // State Modal Lencana Interaktif
  const [selectedBadge, setSelectedBadge] = useState<BadgeDetail | null>(null);
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

  // 1. Misi Harian Belajar Dinamis (5 Misi: Rangkuman, Audio, Kuis Level 1, Level 2, Level 3)
  const completedMissionsCount = [
    dailyMissions.readSummary,
    dailyMissions.listenedAudio,
    dailyMissions.quizLevel1,
    dailyMissions.quizLevel2,
    dailyMissions.quizLevel3 || dailyMissions.completedQuiz,
  ].filter(Boolean).length;
  const missionProgressPercent = Math.round((completedMissionsCount / 5) * 100);

  const [currentStudentName, setCurrentStudentName] = useState("Ghandur Fauzan Ngauf Hisam");
  const [currentStudent, setCurrentStudent] = useState<{
    id: string;
    name: string;
    email: string;
    points?: number;
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

  const [registeredStudents, setRegisteredStudents] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      points?: number;
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

  const loadProfile = () => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res?.name && res.role === "pelajar") {
          setCurrentStudent(res);
          setCurrentStudentName(res.name);
          if (typeof res.points === "number") {
            setTotalPoints(res.points);
          }
        }
      })
      .catch(() => {});
  };

  const loadStudents = () => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((students) => {
        if (Array.isArray(students) && students.length > 0) {
          setRegisteredStudents(students);
          const mapped = students.map((s) => ({
            id: s.id,
            name: s.name,
            points: s.points ?? 0,
            isUser: false,
          }));
          setClassmates(mapped);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadProfile();
    checkResetStatus();
    const interval = setInterval(() => {
      checkResetStatus();
      loadStudents();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadStudents();
  }, [currentStudent?.id]);

  const handleSwitchStudent = async (studentId: string) => {
    playClickSound();
    try {
      const res = await fetch("/api/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: studentId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentStudent(data.user);
          setCurrentStudentName(data.user.name);
        }
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

  // --- KOLEKSI PER BAB KHUSUS PKN (4 BAB KURIKULUM RESMI) ---
  const pknBadges: BadgeDetail[] = [
    {
      id: "bab1_pkn",
      chapterCode: "Bab 1",
      subject: "pkn",
      name: "Bab 1 · Makna Sila Ke-3",
      icon: "🌳",
      unlocked: true,
      tag: "Diraih ⭐",
      tagColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800",
      description: "Arti lambang pohon beringin dan serunya hidup rukun di sekolah & rumah.",
      howToGet: "Materi pokok semester awal sudah berhasil diselesaikan.",
      motivation:
        "Pohon beringin yang rindang menaungi persatuan kita. Ayo saling rukun dan menghargai teman sekelas!",
      targetChapterId: "pkn-sila3",
    },
    {
      id: "bab2_pkn",
      chapterCode: "Bab 2",
      subject: "pkn",
      name: "Bab 2 · Gotong Royong",
      icon: "🤝",
      unlocked: isPknBab2Unlocked,
      tag: "Diraih ⭐",
      tagColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800",
      description: "Kerja sama, tolong-menolong, dan toleransi saat piket kebersihan kelas.",
      howToGet: "Lencana Bab 2 berhasil diraih setelah menuntaskan kuis dan pembelajaran gotong royong.",
      motivation:
        "Berat sama dipikul, ringan sama dijinjing. Semangat gotong royong membuat pekerjaan terasa mudah!",
      targetChapterId: "pkn-gotongroyong",
    },
    {
      id: "bab3_pkn",
      chapterCode: "Bab 3",
      subject: "pkn",
      name: "Bab 3 · Norma & Aturan",
      icon: "📜",
      unlocked: isPknBab3Unlocked,
      tag: "Diraih ⭐",
      tagColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800",
      description: "Memahami norma, hak, dan kewajiban siswa di sekolah serta mentaati tata tertib.",
      howToGet: "Lencana Bab 3 berhasil diraih setelah memahami materi norma dan aturan sekolah.",
      motivation:
        "Disiplin mematuhi norma dan tata tertib adalah ciri calon pemimpin bangsa yang berwibawa!",
      targetChapterId: "pkn-norma",
    },
    {
      id: "bab4_pkn",
      chapterCode: "Bab 4",
      subject: "pkn",
      name: "Bab 4 · Bhinneka Tunggal Ika",
      icon: "🌺",
      unlocked: isPknBab4Unlocked,
      tag: "Diraih ⭐",
      tagColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800",
      description: "Mengenal dan menghormati keragaman suku, rumah adat, tarian daerah, dan budaya Nusantara.",
      howToGet: "Lencana Bab 4 berhasil diraih setelah menuntaskan materi Bhinneka Tunggal Ika.",
      motivation:
        "Berbeda-beda tetapi tetap satu jua! Keberagaman adalah kekayaan terindah bangsa Indonesia!",
      targetChapterId: "pkn-bhinneka",
    },
  ];

  // Sisipkan materi kurikulum baru dari guru bila topik di luar 4 bab standar
  if (!isDefaultChapter && activeValidatedModule?.subject === "pkn") {
    pknBadges.push({
      id: activeValidatedModule.id,
      chapterCode: activeValidatedModule.chapterCode,
      subject: "pkn",
      name: `${activeValidatedModule.chapterCode} · ${activeValidatedModule.title.length > 18 ? activeValidatedModule.title.slice(0, 18) + "..." : activeValidatedModule.title}`,
      icon: "✨",
      unlocked: true,
      tag: "Diraih ⭐",
      tagColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800",
      description: activeValidatedModule.title,
      howToGet: "Materi baru dari guru telah aktif dan berhasil diselesaikan.",
      motivation: "Materi pengayaan baru dari guru siap mengasah wawasanmu setelah bab sebelumnya tuntas!",
      targetChapterId: activeValidatedModule.id,
    });
  }

  // --- KOLEKSI PER BAB KHUSUS BAHASA JAWA (4 BAB KURIKULUM RESMI) ---
  const bjawaBadges: BadgeDetail[] = [
    {
      id: "bab1_bjawa",
      chapterCode: "Bab 1",
      subject: "bjawa",
      name: "Bab 1 · Unggah-ungguh",
      icon: "🗣️",
      unlocked: true,
      tag: "Diraih ⭐",
      tagColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800",
      description: "Trapsila guneman, unggah-ungguh basa ngoko marang kanca lan krama alus marang tiyang sepuh.",
      howToGet: "Lencana Bab 1 kasil digayuh amarga wis rampung sinau unggah-ungguh basa Jawa.",
      motivation:
        "Pinter temen! Basa Jawa iku warisan luhur budi pekerti bangsa. Ayo tansah nguri-uri basa Jawa kanthi trapsila lan sopan marang tiyang sepuh!",
      targetChapterId: "bjawa-unggahungguh",
    },
    {
      id: "bab2_bjawa",
      chapterCode: "Bab 2",
      subject: "bjawa",
      name: "Bab 2 · Tokoh Punokawan",
      icon: "🎭",
      unlocked: isBjawaBab2Unlocked,
      tag: "Diraih ⭐",
      tagColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800",
      description: "Ngenal watak luhur pamomong: Semar, Gareng, Petruk, lan Bagong ing pasrawungan.",
      howToGet: "Lencana Bab 2 kasil digayuh sawise rampung kuis lan mangerteni watak Punokawan.",
      motivation:
        "Becik banget! Tuladhanen watak sabare Semar lan blaka sutane Bagong. Dadi bocah Jawa kudu tansah andhap asor!",
      targetChapterId: "bjawa-punokawan",
    },
    {
      id: "bab3_bjawa",
      chapterCode: "Bab 3",
      subject: "bjawa",
      name: "Bab 3 · Pandhawa Lima",
      icon: "🏹",
      unlocked: isBjawaBab3Unlocked,
      tag: "Diraih ⭐",
      tagColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800",
      description: "Kisah kepahlawanan, silsilah Pandhawa Lima, lan watak ksatria ing perang Baratayuda.",
      howToGet: "Lencana Bab 3 kasil digayuh sawise sinau silsilah lan kautaman Pandhawa Lima.",
      motivation:
        "Tiru watak jujur Puntadewa lan kendel Werkudara mbelani bebener lan kautaman!",
      targetChapterId: "bjawa-pandhawa",
    },
    {
      id: "bab4_bjawa",
      chapterCode: "Bab 4",
      subject: "bjawa",
      name: "Bab 4 · Aksara Jawa",
      icon: "📜",
      unlocked: isBjawaBab4Unlocked,
      tag: "Diraih ⭐",
      tagColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800",
      description: "Maca lan nulis 20 aksara Jawa legena (Ha-Na-Ca-Ra-Ka) sarta sandhangan swara.",
      howToGet: "Lencana Bab 4 kasil digayuh sawise gladhen maca lan nulis aksara Jawa.",
      motivation:
        "Luhur tenan prestasimu! Sinau aksara Jawa minangka bukti rasa tresna marang warisan luhur tanah nusantara!",
      targetChapterId: "bjawa-aksara",
    },
  ];

  if (!isDefaultChapter && activeValidatedModule?.subject === "bjawa") {
    bjawaBadges.push({
      id: activeValidatedModule.id,
      chapterCode: activeValidatedModule.chapterCode,
      subject: "bjawa",
      name: `${activeValidatedModule.chapterCode} · ${activeValidatedModule.title.length > 18 ? activeValidatedModule.title.slice(0, 18) + "..." : activeValidatedModule.title}`,
      icon: "✨",
      unlocked: true,
      tag: "Diraih ⭐",
      tagColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-black border border-emerald-300 dark:border-emerald-800",
      description: activeValidatedModule.title,
      howToGet: "Materi anyar saka guru wis kasil dibukak.",
      motivation: "Piwulang anyar saka bapak/ibu guru bakal nambahi kawruhmu sawise bab sadurunge rampung!",
      targetChapterId: activeValidatedModule.id,
    });
  }

  // State daftar materi yang dihapus oleh siswa (tersimpan di localStorage)
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

  // Sinkronisasi otomatis jika materi dihapus/dipulihkan atau disarankan pengayaan oleh guru
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

  const filteredPknBadges = pknBadges.filter(
    (b) =>
      !deletedChapterIds.includes(b.id) &&
      !deletedChapterIds.includes(b.targetChapterId || "") &&
      !deletedChapterIds.includes(b.id.replace(/^mod-/, "")) &&
      !deletedChapterIds.includes((b.targetChapterId || "").replace(/^mod-/, ""))
  );

  const filteredBjawaBadges = bjawaBadges.filter(
    (b) =>
      !deletedChapterIds.includes(b.id) &&
      !deletedChapterIds.includes(b.targetChapterId || "") &&
      !deletedChapterIds.includes(b.id.replace(/^mod-/, "")) &&
      !deletedChapterIds.includes((b.targetChapterId || "").replace(/^mod-/, ""))
  );

  const currentSubjectBadges = badgeSubject === "pkn" ? filteredPknBadges : filteredBjawaBadges;
  const earnedBadges = currentSubjectBadges.filter((b) => b.unlocked);
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
      const otherSubjectBadges = (
        badgeSubject === "pkn" ? filteredBjawaBadges : filteredPknBadges
      ).filter(
        (b) => !toDelete.includes(b.id) && !toDelete.includes(b.targetChapterId || "")
      );
      const fallbackBadge = remainingInSubject[0] || otherSubjectBadges[0];
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
                        {s.name} ({s.weakness?.status === "remedial" ? "⚠️ Remedial" : "✨ Tuntas"})
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

          {/* Gamifikasi Poin Kartu */}
          <div className="flex items-center gap-4 bg-white/20 dark:bg-slate-800/60 backdrop-blur-md border-4 border-white/50 dark:border-slate-700 rounded-2xl p-4 shadow-lg text-white">
            <div className="pr-4 border-r-2 border-white/40 dark:border-slate-700">
              <span className="text-xs font-black text-sky-100 dark:text-sky-300 tracking-wider block">
                Total Poin Prestasi 🪙
              </span>
              <div className="mt-1 text-white">
                <PointsBadge />
              </div>
            </div>

            <div className="pl-2 space-y-1">
              <span className="text-xs font-black text-sky-100 dark:text-sky-300 tracking-wider block">
                Level Kamu 🚀
              </span>
              <div className="mt-1">
                <LevelBadge level="MEDIUM" />
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
                  {completedMissionsCount === 5
                    ? "🎉 5/5 Tuntas Penuh!"
                    : `🎯 ${completedMissionsCount}/5 Tuntas`}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              {/* Misi 1: Baca Rangkuman Bab */}
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
                  <span>Baca Rangkuman Bab 📖</span>
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

              {/* Misi 2: Dengar Penjelasan Audio */}
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
                  <span>Dengar Penjelasan Audio 🎧</span>
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
                  Lencana Bab Diraih
                </h4>
              </div>

              {/* Switcher Tab Mini PKn & B. Jawa & Tombol Pulihkan */}
              <div className="flex items-center gap-1.5 shrink-0">
                {deletedChapterIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRestoreAllChapters}
                    title="Pulihkan semua materi yang pernah dihapus"
                    className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-white/90 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 transition-all shadow-2xs active:scale-95 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>🔄</span>
                    <span>Pulihkan</span>
                  </button>
                )}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-sky-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setBadgeSubject("pkn");
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                      badgeSubject === "pkn"
                        ? "bg-sky-500 text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    PKn
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setBadgeSubject("bjawa");
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                      badgeSubject === "bjawa"
                        ? "bg-emerald-500 text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    B.Jawa
                  </button>
                </div>
              </div>
            </div>

            {/* Kotak Geser Horizontal (Swipeable / Scrollable ke Kiri-Kanan) */}
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-sky-300 dark:scrollbar-thumb-slate-600 snap-x">
              {earnedBadges.map((badge) => {
                const isCurrentChapter =
                  Boolean(badge.targetChapterId) &&
                  (chapter === badge.targetChapterId ||
                    chapter.replace("mod-", "") === badge.targetChapterId?.replace("mod-", ""));

                return (
                  <div
                    key={badge.id}
                    className={`shrink-0 w-32 p-2.5 rounded-xl border transition-all flex flex-col justify-between text-center snap-start ${
                      isCurrentChapter
                        ? "bg-white dark:bg-slate-800 border-amber-500 ring-2 ring-amber-300/60 shadow-sm"
                        : "bg-white/90 dark:bg-slate-800/90 border-sky-200 dark:border-slate-700 shadow-2xs hover:border-sky-300"
                    }`}
                  >
                    <div
                      onClick={() => handleOpenBadge(badge)}
                      className="cursor-pointer space-y-1"
                      title={`Klik untuk info motivasi ${badge.name}`}
                    >
                      <div className="w-9 h-9 mx-auto rounded-lg bg-gradient-to-br from-amber-400 to-yellow-400 text-yellow-950 font-black text-lg flex items-center justify-center shadow-2xs">
                        {badge.icon}
                      </div>
                      <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight line-clamp-2 min-h-[1.75rem]">
                        {badge.name}
                      </p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                        Diraih ⭐
                      </span>
                    </div>

                    <div className="pt-2 flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStudyChapter(badge.targetChapterId);
                        }}
                        title={`Pelajari bab ${badge.name}`}
                        className="w-full py-1 px-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>📖 Pelajari</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBadge(badge);
                        }}
                        title={`Dengarkan motivasi ${badge.name}`}
                        className="w-full py-0.5 px-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-extrabold text-[9px] border border-amber-300 dark:border-amber-800 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>🔊 Motivasi</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChapter(badge);
                        }}
                        title={`Hapus materi ${badge.name} yang sudah tidak terpakai`}
                        className="w-full py-0.5 px-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-extrabold text-[9px] border border-rose-300 dark:border-rose-800 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <span>🗑️ Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {earnedBadges.length === 0 && (
                <div className="w-full py-4 px-3 text-center bg-white/70 dark:bg-slate-800/60 rounded-xl border border-dashed border-sky-200 dark:border-slate-700 space-y-2">
                  <p className="text-[11px] font-bold text-sky-800 dark:text-sky-300">
                    {deletedChapterIds.length > 0
                      ? "Materi telah dihapus atau belum diselesaikan."
                      : "Selesaikan bab & kuis untuk meraih lencana! 🌟"}
                  </p>
                  {deletedChapterIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRestoreAllChapters}
                      className="text-[10px] font-black px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      🔄 Pulihkan Materi Terhapus
                    </button>
                  )}
                </div>
              )}
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
    </div>
  );
}
