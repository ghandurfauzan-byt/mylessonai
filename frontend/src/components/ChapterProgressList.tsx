// src/components/ChapterProgressList.tsx — Tingkat Pemahaman Per Bab (FR-15)
// Dikelompokkan ke dalam 2 Golongan: PKn & Bahasa Jawa dengan interaksi klik bab untuk analisis siswa lemah

import { ErrorBanner, ListSkeleton } from "@/components/AsyncStateBanners";
import { useChapterProgressQuery } from "@/hooks/useChapterProgressQuery";
import { createNotification } from "@/lib/api/classApi";
import { playClickSound, playCoinSound, playCorrectSound } from "@/lib/soundEffects";
import { useUIStore } from "@/lib/store/useUIStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const TONE_STYLES: Record<string, { bar: string; text: string; label: string; badge: string }> = {
  high: {
    bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
    text: "text-emerald-800 dark:text-emerald-200",
    label: "Pemahaman Tinggi",
    badge: "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700",
  },
  good: {
    bar: "bg-gradient-to-r from-blue-600 to-indigo-600",
    text: "text-blue-800 dark:text-blue-200",
    label: "Pemahaman Baik",
    badge: "bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700",
  },
  warning: {
    bar: "bg-gradient-to-r from-amber-500 to-rose-500",
    text: "text-amber-800 dark:text-amber-200",
    label: "Perlu Perhatian",
    badge: "bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700",
  },
};

const DEFAULT_TONE = TONE_STYLES.good!;

interface WeakPoint {
  title: string;
  desc: string;
  percentageMissed: string;
}

interface WeakStudent {
  id: string;
  name: string;
  score: number;
  outOf: string;
  note: string;
  status: string;
}

interface ChapterDiagnosticData {
  chapterTitle: string;
  subject: string;
  statusClass: string;
  weakPoints: WeakPoint[];
  weakStudents: WeakStudent[];
  masteredStudentsCount: number;
  recommendation: string;
}

function getChapterDiagnostic(chapterName: string, percent: number): ChapterDiagnosticData {
  const lower = chapterName.toLowerCase();

  // 1. Bab 2 Gotong Royong (PKn)
  if (lower.includes("gotong")) {
    return {
      chapterTitle: "Bab 2 · Gotong Royong sebagai Jati Diri Bangsa",
      subject: "Pendidikan Pancasila & PKn",
      statusClass: "Belum Mencapai KKTP (Rata-rata Kelas 58%)",
      weakPoints: [
        {
          title: "Membedakan Gotong Royong di Lingkungan Sekolah vs Rumah",
          desc: "Sebanyak 62% siswa keliru menentukan contoh piket kelas mandiri tanpa pamrih dibanding tugas harian di rumah.",
          percentageMissed: "62% Siswa Keliru",
        },
        {
          title: "Konsep Kerja Sama Tanpa Pamrih & Musyawarah Mufakat",
          desc: "Sebagian siswa masih menganggap bantuan kepada teman piket harus disertai imbalan materi atau poin.",
          percentageMissed: "55% Siswa Keliru",
        },
        {
          title: "Analisis Soal Cerita Studi Kasus Piket Bersama",
          desc: "Siswa kesulitan memecahkan masalah pembagian tugas saat salah satu teman sedang berhalangan hadir.",
          percentageMissed: "48% Siswa Keliru",
        },
      ],
      weakStudents: [
        {
          id: "s1",
          name: "Budi Santoso",
          score: 20,
          outOf: "2/10 Soal",
          note: "Kesulitan memahami makna tolong-menolong tanpa imbalan dan nilai kerja sama tim.",
          status: "Sangat Butuh Remedial",
        },
        {
          id: "s2",
          name: "Siti Aminah",
          score: 50,
          outOf: "5/10 Soal",
          note: "Keliru pada soal studi kasus musyawarah mufakat di lingkungan kelas.",
          status: "Perlu Bimbingan",
        },
        {
          id: "s3",
          name: "Ahmad Fauzi",
          score: 58,
          outOf: "6/10 Soal",
          note: "Belum konsisten menerapkan prinsip berat sama dipikul, ringan sama dijinjing.",
          status: "Perlu Latihan Tambahan",
        },
      ],
      masteredStudentsCount: 25,
      recommendation:
        "Lakukan kegiatan simulasi bermain peran (roleplay) musyawarah piket kelas dan tugaskan siswa mendengarkan penjelasan narasi modul di Whiteboard AI.",
    };
  }

  // 2. Bab 1 Sila Ke-3 / Lambang Beringin (PKn)
  if (lower.includes("sila") || lower.includes("beringin") || lower.includes("lambang")) {
    return {
      chapterTitle: "Bab 1 · Makna Lambang Sila Ke-3 Persatuan Indonesia",
      subject: "Pendidikan Pancasila & PKn",
      statusClass: "Tuntas Sangat Baik (Rata-rata Kelas 88% - 92%)",
      weakPoints: [
        {
          title: "Filosofi Sulur Gantung & Akar Pohon Beringin",
          desc: "Siswa tertukar antara arti akar tunggang (tempat berteduh negara) dengan sulur gantung (keragaman suku nusantara).",
          percentageMissed: "32% Siswa Keliru",
        },
      ],
      weakStudents: [
        {
          id: "s3",
          name: "Ahmad Fauzi",
          score: 65,
          outOf: "6.5/10 Soal",
          note: "Perlu penguatan pada arti filosofis sulur pohon beringin yang menaungi persatuan.",
          status: "Perlu Penguatan",
        },
      ],
      masteredStudentsCount: 27,
      recommendation:
        "Capaian kelas sudah tinggi. Cukup berikan ulasan ringkas mengenai makna simbol beringin pada awal pembelajaran.",
    };
  }

  // 3. Bab 3 Norma & Aturan (PKn)
  if (lower.includes("norma") || lower.includes("aturan")) {
    return {
      chapterTitle: "Bab 3 · Norma & Aturan di Lingkungan Sekolah",
      subject: "Pendidikan Pancasila & PKn",
      statusClass: "Tuntas Istimewa (Rata-rata Kelas 94%)",
      weakPoints: [
        {
          title: "Membedakan Hak dan Kewajiban Siswa di Fasilitas Sekolah",
          desc: "Sebagian kecil siswa menganggap meminjam buku tanpa batas waktu adalah hak istimewa siswa.",
          percentageMissed: "18% Siswa Keliru",
        },
      ],
      weakStudents: [
        {
          id: "s2",
          name: "Siti Aminah",
          score: 68,
          outOf: "7/10 Soal",
          note: "Perlu diingatkan kembali batasan hak siswa saat menggunakan fasilitas umum perpustakaan.",
          status: "Perlu Penguatan",
        },
      ],
      masteredStudentsCount: 27,
      recommendation:
        "Sebagian besar siswa telah menguasai norma sekolah dengan sangat baik. Berikan apresiasi bintang prestasi untuk kelas.",
    };
  }

  // 4. Bab 4 Bhinneka Tunggal Ika (PKn)
  if (lower.includes("bhinneka") || lower.includes("ragam")) {
    return {
      chapterTitle: "Bab 4 · Bhinneka Tunggal Ika & Keragaman Nusantara",
      subject: "Pendidikan Pancasila & PKn",
      statusClass: "Tuntas Baik (Rata-rata Kelas 72%)",
      weakPoints: [
        {
          title: "Mencocokkan Rumah Adat dan Pakaian Tradisional Daerah Luar Jawa",
          desc: "Siswa masih tertukar antara Rumah Gadang (Minangkabau) dan Tongkonan (Toraja).",
          percentageMissed: "42% Siswa Keliru",
        },
        {
          title: "Asal-Usul Kitab Sutasoma karya Mpu Tantular",
          desc: "Siswa lupa nama kitab kuno asal semboyan Bhinneka Tunggal Ika.",
          percentageMissed: "36% Siswa Keliru",
        },
      ],
      weakStudents: [
        {
          id: "s1",
          name: "Budi Santoso",
          score: 60,
          outOf: "6/10 Soal",
          note: "Kesulitan mengingat nama-nama rumah adat dan tarian daerah Nusantara.",
          status: "Perlu Bimbingan",
        },
        {
          id: "s3",
          name: "Ahmad Fauzi",
          score: 65,
          outOf: "6.5/10 Soal",
          note: "Tertukar antara pakaian adat daerah Sumatera dan Sulawesi.",
          status: "Perlu Latihan",
        },
      ],
      masteredStudentsCount: 26,
      recommendation:
        "Tampilkan peta interaktif budaya nusantara dan berikan kuis tebak gambar rumah adat.",
    };
  }

  // --- BAHASA JAWA ---
  if (lower.includes("unggah")) {
    return {
      chapterTitle: "Bab 1 · Trap-Trapan Unggah-Ungguh Basa Jawa",
      subject: "Muatan Lokal Bahasa Jawa",
      statusClass: "Tuntas Baik (Rata-rata Kelas 80%)",
      weakPoints: [
        {
          title: "Trap-Trapan Krama Alus marang Guru vs Wong Tuwa",
          desc: "Siswa nggunakake tembung Krama Alus kanggo awake dhewe (tuladha: 'kula sampun dhahar' kang kudune 'nedha').",
          percentageMissed: "46% Siswa Keliru",
        },
        {
          title: "Solah Bawa nalika Matur marang Tiyang Sepuh",
          desc: "Siswa lali ngendika 'nderek langkung' nalika mlaku ing sangarepe wong sepuh.",
          percentageMissed: "34% Siswa Keliru",
        },
      ],
      weakStudents: [
        {
          id: "s1",
          name: "Budi Santoso",
          score: 55,
          outOf: "5.5/10 Soal",
          note: "Kleru nggunakake tembung dhahar marang awake dhewe nalika matur marang guru.",
          status: "Perlu Bimbingan",
        },
        {
          id: "s3",
          name: "Ahmad Fauzi",
          score: 62,
          outOf: "6.2/10 Soal",
          note: "Kurang lancar mbedakake tembung ngoko lugu lan krama alus.",
          status: "Perlu Latihan",
        },
      ],
      masteredStudentsCount: 26,
      recommendation:
        "Ajak siswa gladhen pacelathon basa Krama Alus kanthi pasangan ing ngarep kelas kanthi tema nyuwun idin marang Bapak/Ibu Guru.",
    };
  }

  if (lower.includes("punokawan") || lower.includes("wayang")) {
    return {
      chapterTitle: "Bab 2 · Niteni Watak Luhur Tokoh Punokawan",
      subject: "Muatan Lokal Bahasa Jawa",
      statusClass: "Tuntas (Rata-rata Kelas 70%)",
      weakPoints: [
        {
          title: "Watak Blaka Suta Tokoh Bagong",
          desc: "Siswa durung paham tegese blaka suta yaiku jujur apa anane lan ora seneng dora.",
          percentageMissed: "44% Siswa Keliru",
        },
        {
          title: "Urutan Kelairan Tokoh Punokawan",
          desc: "Siswa kleru antarane Gareng, Petruk, lan Bagong minangka anake Semar.",
          percentageMissed: "38% Siswa Keliru",
        },
      ],
      weakStudents: [
        {
          id: "s2",
          name: "Siti Aminah",
          score: 60,
          outOf: "6/10 Soal",
          note: "Kleru nyebutake watak ksatria Bagong lan pusaka Semar.",
          status: "Perlu Penguatan",
        },
      ],
      masteredStudentsCount: 27,
      recommendation:
        "Tampilake gambar paraga wayang Punokawan kanthi ciri fisik lan watake kanthi visual ceria.",
    };
  }

  if (lower.includes("pandhawa") || lower.includes("tembang")) {
    return {
      chapterTitle: "Bab 3 · Silsilah & Kautaman Pandhawa Lima",
      subject: "Muatan Lokal Bahasa Jawa",
      statusClass: "Tuntas Baik (Rata-rata Kelas 82%)",
      weakPoints: [
        {
          title: "Silsilah Kasatriyan lan Senjata Pandhawa",
          desc: "Siswa tertukar antara kasatriyan Madukara (Janaka) lan Jodhipati (Werkudara).",
          percentageMissed: "35% Siswa Keliru",
        },
      ],
      weakStudents: [
        {
          id: "s3",
          name: "Ahmad Fauzi",
          score: 68,
          outOf: "6.8/10 Soal",
          note: "Tertukar senjata Gada Rujakpala kagungane Werkudara.",
          status: "Perlu Penguatan",
        },
      ],
      masteredStudentsCount: 27,
      recommendation:
        "Gawe bagan silsilah kulawarga Pandhawa Lima ing papan tulis interaktif.",
    };
  }

  if (lower.includes("aksara")) {
    return {
      chapterTitle: "Bab 4 · Gladhen Maca & Nulis Aksara Jawa Legena",
      subject: "Muatan Lokal Bahasa Jawa",
      statusClass: "Tuntas Baik (Rata-rata Kelas 84%)",
      weakPoints: [
        {
          title: "Sandhangan Swara Wulu, Suku, Taling, lan Taling Tarung",
          desc: "Siswa kleru nulis sandhangan taling ing sangarepe aksara legena.",
          percentageMissed: "30% Siswa Keliru",
        },
      ],
      weakStudents: [
        {
          id: "s1",
          name: "Budi Santoso",
          score: 62,
          outOf: "6.2/10 Soal",
          note: "Kleru nulis tembung nganggo sandhangan panyigeg layar lan wignyan.",
          status: "Perlu Latihan",
        },
      ],
      masteredStudentsCount: 27,
      recommendation:
        "Bimbing siswa nulis aksara Jawa 2 tembung saben dina kanthi papan tulis interaktif.",
    };
  }

  // Fallback untuk modul baru
  return {
    chapterTitle: chapterName,
    subject: "Materi Baru Terintegrasi",
    statusClass: `Tingkat Pemahaman Kelas: ${percent}%`,
    weakPoints: [
      {
        title: "Pemahaman Konsep Inti & Evaluasi Mandiri",
        desc: "Siswa yang belum tuntas memerlukan pengulangan intisari materi dan bimbingan langsung.",
        percentageMissed: `${Math.max(15, 100 - percent)}% Siswa Keliru`,
      },
    ],
    weakStudents: [
      {
        id: "s1",
        name: "Budi Santoso",
        score: Math.max(35, percent - 25),
        outOf: `${Math.round((Math.max(35, percent - 25) / 100) * 10)}/10 Soal`,
        note: "Perlu bimbingan intensif dan penjelasan tambahan dari guru.",
        status: "Perlu Bimbingan",
      },
    ],
    masteredStudentsCount: 26,
    recommendation:
      "Lakukan penguatan materi dengan kuis adaptif interaktif level 1 di kelas.",
  };
}

export default function ChapterProgressList({
  role = "pelajar",
}: {
  role?: "pelajar" | "pengajar";
}) {
  const isStudent = role === "pelajar";
  const { data: rawChapters, isLoading, isError, error, refetch } = useChapterProgressQuery();
  const activeValidatedModule = useUIStore((s) => s.activeValidatedModule);
  const [selectedSubject, setSelectedSubject] = useState<"pkn" | "bjawa">("pkn");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // State Modal Diagnostik Guru: Mengetahui siswa yang lemah di bab terkait
  const [selectedDiagnosticChapter, setSelectedDiagnosticChapter] = useState<{
    id: number;
    name: string;
    percent: number;
    tone: string;
  } | null>(null);

  // State daftar materi/bab yang dihapus (tersimpan di localStorage)
  const [deletedChapterIds, setDeletedChapterIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("deleted_chapter_ids");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [];
  });

  // Sinkronisasi real-time antar-tab & antar-komponen via Storage Event
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("deleted_chapter_ids");
        setDeletedChapterIds(stored ? JSON.parse(stored) : []);
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // State rekomendasi pengayaan yang disarankan oleh guru untuk siswa lemah
  const [recommendedPengayaan, setRecommendedPengayaan] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem("recommended_pengayaan_students");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [pengayaanSuccessToast, setPengayaanSuccessToast] = useState<string | null>(null);

  if (isLoading) return <ListSkeleton rows={3} />;

  if (isError || !rawChapters) {
    return (
      <ErrorBanner
        message={error instanceof Error ? error.message : "Gagal memuat progres bab."}
        onRetry={() => refetch()}
      />
    );
  }

  // Helper identifikasi apakah sebuah bab adalah Bahasa Jawa
  function isBjawaChapter(name: string, subject?: string) {
    if (subject === "bjawa") return true;
    const lower = name.toLowerCase();
    return (
      lower.includes("b. jawa") ||
      lower.includes("jawa") ||
      lower.includes("unggah") ||
      lower.includes("tembang") ||
      lower.includes("wayang") ||
      lower.includes("punokawan") ||
      lower.includes("aksara") ||
      lower.includes("mahabarata")
    );
  }

  const allChapters = [...rawChapters];

  // Sisipkan modul tervalidasi aktif guru ke kategori yang sesuai
  if (activeValidatedModule && activeValidatedModule.id !== "pkn-sila3") {
    const isJawa =
      activeValidatedModule.subject === "bjawa" ||
      isBjawaChapter(activeValidatedModule.title, activeValidatedModule.subject);

    if (
      !allChapters.some((c) =>
        c.name.toLowerCase().includes(activeValidatedModule.title.toLowerCase().slice(0, 10))
      )
    ) {
      allChapters.unshift({
        id: 99,
        name: `${isJawa ? "B. Jawa" : "PKn"}: ${activeValidatedModule.chapterCode} (${activeValidatedModule.title.slice(0, 18)}...)`,
        percent: 92,
        tone: "high",
      });
    }
  }

  function isChapterDeleted(c: { id: number; name: string }): boolean {
    if (deletedChapterIds.length === 0) return false;
    const idStr = String(c.id);
    const lower = c.name.toLowerCase();

    if (deletedChapterIds.includes(idStr) || deletedChapterIds.includes(`ch-${c.id}`)) {
      return true;
    }
    if (
      c.id === 99 &&
      (deletedChapterIds.includes("mod-custom") ||
        (activeValidatedModule &&
          (deletedChapterIds.includes(activeValidatedModule.id) ||
            deletedChapterIds.includes(activeValidatedModule.id.replace(/^mod-/, "")))))
    ) {
      return true;
    }
    if (
      lower.includes("gotong") &&
      (deletedChapterIds.includes("pkn-gotongroyong") ||
        deletedChapterIds.includes("bab2") ||
        deletedChapterIds.includes("2"))
    ) {
      return true;
    }
    if (
      (lower.includes("sila") || lower.includes("makna lambang") || lower.includes("beringin")) &&
      (deletedChapterIds.includes("pkn-sila3") ||
        deletedChapterIds.includes("bab1") ||
        deletedChapterIds.includes("1"))
    ) {
      return true;
    }
    if (
      (lower.includes("norma") || lower.includes("aturan")) &&
      (deletedChapterIds.includes("pkn-norma") ||
        deletedChapterIds.includes("bab3") ||
        deletedChapterIds.includes("3"))
    ) {
      return true;
    }
    if (
      (lower.includes("bhinneka") || lower.includes("ragam")) &&
      (deletedChapterIds.includes("pkn-bhinneka") ||
        deletedChapterIds.includes("bab4") ||
        deletedChapterIds.includes("4"))
    ) {
      return true;
    }
    if (
      lower.includes("unggah") &&
      (deletedChapterIds.includes("bjawa-unggahungguh") ||
        deletedChapterIds.includes("bab1_bjawa") ||
        deletedChapterIds.includes("5"))
    ) {
      return true;
    }
    if (
      (lower.includes("punokawan") || lower.includes("wayang")) &&
      (deletedChapterIds.includes("bjawa-punokawan") ||
        deletedChapterIds.includes("bab2_bjawa") ||
        deletedChapterIds.includes("6"))
    ) {
      return true;
    }
    if (
      (lower.includes("pandhawa") || lower.includes("tembang")) &&
      (deletedChapterIds.includes("bjawa-pandhawa") ||
        deletedChapterIds.includes("bab3_bjawa") ||
        deletedChapterIds.includes("7"))
    ) {
      return true;
    }
    if (
      lower.includes("aksara") &&
      (deletedChapterIds.includes("bjawa-aksara") ||
        deletedChapterIds.includes("bab4_bjawa") ||
        deletedChapterIds.includes("8"))
    ) {
      return true;
    }
    if (
      activeValidatedModule &&
      lower.includes(activeValidatedModule.chapterCode.toLowerCase()) &&
      (deletedChapterIds.includes(activeValidatedModule.id) ||
        deletedChapterIds.includes(activeValidatedModule.id.replace(/^mod-/, "")))
    ) {
      return true;
    }

    return false;
  }

  function handleDeleteChapter(
    chapterItem: { id: number; name: string },
    e?: React.MouseEvent
  ) {
    if (e) e.stopPropagation();
    playClickSound();

    const cleanName = chapterItem.name.replace(/^PKn:\s*/i, "").replace(/^B\.\s*Jawa:\s*/i, "");
    const confirmed = window.confirm(
      `Hapus materi "${cleanName}"?\n\nMateri yang sudah tidak digunakan ini akan dihapus dari daftar kurikulum dan pemahaman kelas.`
    );
    if (!confirmed) return;

    const toDelete: string[] = [String(chapterItem.id), `ch-${chapterItem.id}`];
    const lower = chapterItem.name.toLowerCase();

    if (
      chapterItem.id === 99 ||
      (activeValidatedModule &&
        lower.includes(activeValidatedModule.chapterCode.toLowerCase()))
    ) {
      toDelete.push("mod-custom");
      if (activeValidatedModule) {
        toDelete.push(activeValidatedModule.id);
        toDelete.push(activeValidatedModule.id.replace(/^mod-/, ""));
        fetch(
          `/api/v1/curriculum/modules/${encodeURIComponent(activeValidatedModule.id)}`,
          { method: "DELETE" }
        ).catch(() => {});
      }
    }

    if (lower.includes("gotong")) toDelete.push("pkn-gotongroyong", "bab2", "2");
    if (lower.includes("sila") || lower.includes("makna lambang") || lower.includes("beringin")) {
      toDelete.push("pkn-sila3", "bab1", "1");
    }
    if (lower.includes("norma") || lower.includes("aturan")) toDelete.push("pkn-norma", "bab3", "3");
    if (lower.includes("bhinneka") || lower.includes("ragam")) toDelete.push("pkn-bhinneka", "bab4", "4");
    if (lower.includes("unggah")) toDelete.push("bjawa-unggahungguh", "bab1_bjawa", "5");
    if (lower.includes("punokawan") || lower.includes("wayang")) toDelete.push("bjawa-punokawan", "bab2_bjawa", "6");
    if (lower.includes("pandhawa") || lower.includes("tembang")) toDelete.push("bjawa-pandhawa", "bab3_bjawa", "7");
    if (lower.includes("aksara")) toDelete.push("bjawa-aksara", "bab4_bjawa", "8");

    const updated = Array.from(new Set([...deletedChapterIds, ...toDelete]));
    setDeletedChapterIds(updated);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("deleted_chapter_ids", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      } catch {}
    }
  }

  function handleRestoreAllDeleted() {
    playCoinSound();
    if (
      window.confirm(
        "Pulihkan semua materi yang pernah dihapus kembali ke daftar bab?"
      )
    ) {
      setDeletedChapterIds([]);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("deleted_chapter_ids");
          window.dispatchEvent(new Event("storage"));
        } catch {}
      }
    }
  }

  async function handleRecommendPengayaan(
    student: WeakStudent,
    diag: ChapterDiagnosticData
  ) {
    playCoinSound();
    playCorrectSound();

    const updated = { ...recommendedPengayaan, [student.id]: true };
    setRecommendedPengayaan(updated);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("recommended_pengayaan_students", JSON.stringify(updated));
        localStorage.setItem(
          "active_student_pengayaan_recommendation",
          JSON.stringify({
            studentId: student.id,
            studentName: student.name,
            chapterTitle: diag.chapterTitle,
            subject: diag.subject,
            recommendedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          })
        );
        window.dispatchEvent(new Event("storage"));
      } catch {}
    }

    setPengayaanSuccessToast(
      `Modul pengayaan materi "${diag.chapterTitle}" berhasil disarankan untuk ${student.name}! 🚀`
    );

    setTimeout(() => {
      setPengayaanSuccessToast(null);
    }, 4500);

    try {
      await createNotification({
        title: `Rekomendasi Modul Pengayaan dari Guru 🚀`,
        message: `Bapak/Ibu Guru telah menyiapkan materi pengayaan & latihan khusus untukmu pada materi "${diag.chapterTitle}". Yuk pelajari agar pemahamanmu semakin hebat!`,
        type: "success",
        link: "/dashboard/pelajar",
        targetRole: "pelajar",
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {}
  }

  // Pisahkan ke dalam 2 golongan dan filter materi yang sudah dihapus
  const pknChapters = allChapters.filter((c) => !isBjawaChapter(c.name) && !isChapterDeleted(c));
  const bjawaChapters = allChapters.filter((c) => isBjawaChapter(c.name) && !isChapterDeleted(c));

  // Hitung rata-rata pemahaman
  const pknAvg = Math.round(
    pknChapters.reduce((acc, cur) => acc + cur.percent, 0) / (pknChapters.length || 1)
  );
  const bjawaAvg = Math.round(
    bjawaChapters.reduce((acc, cur) => acc + cur.percent, 0) / (bjawaChapters.length || 1)
  );

  const activeChapters = selectedSubject === "pkn" ? pknChapters : bjawaChapters;
  const currentAvg = selectedSubject === "pkn" ? pknAvg : bjawaAvg;
  const completedCount = activeChapters.filter((c) => c.percent >= 70).length;

  function handleChapterClick(chapterName: string) {
    playClickSound();
    const lower = chapterName.toLowerCase();
    let targetChapter = "pkn-sila3";

    if (lower.includes("gotong")) {
      targetChapter = "pkn-gotongroyong";
    } else if (lower.includes("norma") || lower.includes("aturan") || lower.includes("musyawarah")) {
      targetChapter = "pkn-norma";
    } else if (lower.includes("bhinneka") || lower.includes("ragam")) {
      targetChapter = "pkn-bhinneka";
    } else if (lower.includes("unggah")) {
      targetChapter = "bjawa-unggahungguh";
    } else if (lower.includes("punokawan") || lower.includes("wayang")) {
      targetChapter = "bjawa-punokawan";
    } else if (lower.includes("pandhawa") || lower.includes("tembang")) {
      targetChapter = "bjawa-pandhawa";
    } else if (lower.includes("aksara")) {
      targetChapter = "bjawa-aksara";
    } else if (
      activeValidatedModule &&
      lower.includes(activeValidatedModule.chapterCode.toLowerCase())
    ) {
      targetChapter = activeValidatedModule.id;
    } else if (selectedSubject === "bjawa") {
      targetChapter = "bjawa-unggahungguh";
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("chapter", targetChapter);
    nextParams.set("mode", "cerita");
    nextParams.delete("r");
    navigate(`/dashboard/pelajar?${nextParams.toString()}`);

    setTimeout(() => {
      const el = document.getElementById("papan-tulis-materi");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  }

  const diagnosticData = selectedDiagnosticChapter
    ? getChapterDiagnostic(selectedDiagnosticChapter.name, selectedDiagnosticChapter.percent)
    : null;

  return (
    <div className="space-y-3.5 pt-1">
      {/* 1. DUA GOLONGAN / TABS PELAJARAN (PKn & BAHASA JAWA) */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-sky-100 dark:border-slate-700">
        <button
          type="button"
          onClick={() => {
            playClickSound();
            setSelectedSubject("pkn");
          }}
          className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-xl text-xs font-black transition-all ${
            selectedSubject === "pkn"
              ? "bg-white dark:bg-sky-950 text-sky-900 dark:text-sky-200 shadow-md border-2 border-sky-400 dark:border-sky-600 scale-[1.02]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-3 rounded-xs overflow-hidden inline-flex flex-col border border-slate-300 dark:border-slate-600 shadow-2xs shrink-0">
              <span className="bg-rose-600 h-1/2 w-full" />
              <span className="bg-white h-1/2 w-full" />
            </span>
            <span>🇮🇩 Pelajaran PKn</span>
          </div>
          <span className="text-[10px] font-extrabold opacity-80 mt-0.5">
            {pknChapters.length} Bab · {isStudent ? `Capaianmu ${pknAvg}%` : `Rata-rata Seluruh Siswa ${pknAvg}%`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            playClickSound();
            setSelectedSubject("bjawa");
          }}
          className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-xl text-xs font-black transition-all ${
            selectedSubject === "bjawa"
              ? "bg-white dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 shadow-md border-2 border-emerald-400 dark:border-emerald-600 scale-[1.02]"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🎭</span>
            <span>Bahasa Jawa</span>
          </div>
          <span className="text-[10px] font-extrabold opacity-80 mt-0.5">
            {bjawaChapters.length} Bab · {isStudent ? `Capaianmu ${bjawaAvg}%` : `Rata-rata Seluruh Siswa ${bjawaAvg}%`}
          </span>
        </button>
      </div>

      {/* 2. RINGKASAN GOLONGAN AKTIF */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>
            Status: <strong className="text-slate-900 dark:text-white">{completedCount}</strong> dari{" "}
            <strong className="text-slate-900 dark:text-white">{activeChapters.length}</strong> Bab{" "}
            {isStudent ? "Tuntas Dipelajari ⭐" : "Tuntas Kelas"}
          </span>
          {deletedChapterIds.length > 0 && (
            <button
              type="button"
              onClick={handleRestoreAllDeleted}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Pulihkan semua materi yang pernah dihapus"
            >
              <span>🔄</span> Pulihkan ({deletedChapterIds.length})
            </button>
          )}
        </div>
        <span className="text-sky-600 dark:text-sky-400 font-bold">
          {isStudent ? "Capaian Pribadimu:" : "Rata-rata Seluruh Siswa:"} {currentAvg}%
        </span>
      </div>

      {/* 3. DAFTAR BAB-BAB PELAJARAN YANG BISA DIKLIK */}
      {activeChapters.length === 0 ? (
        <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 space-y-3">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Semua materi pada mata pelajaran ini telah dihapus.
          </p>
          {deletedChapterIds.length > 0 && (
            <button
              type="button"
              onClick={handleRestoreAllDeleted}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>🔄</span> Pulihkan Semua Materi Terhapus
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeChapters.map((chapter) => {
            const tone = TONE_STYLES[chapter.tone] ?? DEFAULT_TONE;
            const isTuntas = chapter.percent >= 70;

            // Bersihkan nama agar rapi
            const cleanName = chapter.name.replace(/^PKn:\s*/i, "").replace(/^B\.\s*Jawa:\s*/i, "");

            return (
              <div
                key={chapter.id}
                onClick={() => {
                  if (isStudent) {
                    handleChapterClick(chapter.name);
                  } else {
                    playClickSound();
                    setSelectedDiagnosticChapter(chapter);
                  }
                }}
                title={
                  isStudent
                    ? "Klik untuk mempelajari bab ini di whiteboard 📖"
                    : "Klik bab ini untuk melihat rincian siswa yang lemah & titik kesulitan belajar 🔍"
                }
                className="group p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2"
              >
                <div className="flex justify-between items-center text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-bold ${isTuntas ? "text-emerald-600" : "text-amber-500"}`}>
                      {isTuntas ? "✅" : "⏳"}
                    </span>
                    <span className="font-black text-slate-800 dark:text-slate-200 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400">
                      {cleanName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* TOMBOL HAPUS MATERI PER BAB */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteChapter(chapter, e)}
                      title={`Hapus materi "${cleanName}"`}
                      className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200 dark:border-rose-800 px-2 py-1 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <span>🗑️</span>
                      <span>Hapus</span>
                    </button>

                    {/* UNTUK GURU: Hapus tulisan "Pelajari Lagi", gantikan dengan tombol/indikator cek siswa lemah */}
                    {!isStudent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-700 px-2.5 py-1 rounded-xl shadow-2xs group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600 transition-all">
                        <span>🔍 Cek Siswa Lemah</span>
                      </span>
                    ) : (
                      <span className="hidden sm:inline-block text-[10px] font-black text-blue-600 dark:text-blue-400 group-hover:underline">
                        Pelajari Lagi 📖
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${tone.badge} ${tone.text}`}
                    >
                      {chapter.percent}% ·{" "}
                      {isTuntas
                        ? isStudent
                          ? "Tuntas Dipelajari ⭐"
                          : "Tuntas Kelas ⭐"
                        : isStudent
                          ? "Perlu Berlatih 📖"
                          : "Belajar Bersama 📖"}
                    </span>
                  </div>
                </div>

              {/* Bar Pemahaman */}
              <div className="w-full bg-slate-100 dark:bg-slate-700/80 rounded-full h-2.5 overflow-hidden p-[1px] border border-slate-200/80 dark:border-slate-600">
                <div
                  className={`${tone.bar} h-full rounded-full transition-all duration-700`}
                  style={{ width: `${chapter.percent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-0.5">
                <span className="opacity-80">
                  {isStudent
                    ? chapter.percent >= 85
                      ? "🌟 Pemahamanmu Sangat Baik!"
                      : chapter.percent >= 70
                        ? "👍 Pemahamanmu Baik, Pertahankan!"
                        : "💪 Ayo Latihan Lagi Bab Ini!"
                    : chapter.percent >= 85
                      ? "🌟 Rata-rata Pemahaman Sangat Baik (Klik untuk Analisis)"
                      : chapter.percent >= 70
                        ? "👍 Rata-rata Pemahaman Baik (Klik untuk Analisis)"
                        : "💪 Butuh Pendampingan Siswa (Klik untuk Analisis)"}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500">
                  {isStudent ? "Capaian Individu Siswa" : "Rata-rata Seluruh Siswa"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* 4. MODAL DIAGNOSTIK ANALISIS SISWA LEMAH (KHUSUS GURU) */}
      {selectedDiagnosticChapter && !isStudent && diagnosticData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-4 border-sky-300 dark:border-sky-800 shadow-2xl p-6 sm:p-7 space-y-5 relative">
            {/* Dekorasi Cahaya */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-sky-200/40 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header Modal Diagnostik */}
            <div className="flex items-start justify-between gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                  📊
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {diagnosticData.chapterTitle}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                      {diagnosticData.subject}
                    </span>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {diagnosticData.statusClass}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setSelectedDiagnosticChapter(null);
                }}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-base flex items-center justify-center transition cursor-pointer"
                title="Tutup Analisis"
              >
                ✕
              </button>
            </div>

            {/* Bagian 1: Di Mana Siswa Lemah (Sub-Indikator Materi) */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <h4 className="text-xs sm:text-sm font-black text-rose-900 dark:text-rose-300 uppercase tracking-wider">
                  Titik Kelemahan Materi Siswa di Bab Ini
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Berdasarkan evaluasi kuis dan tugas mandiri, berikut adalah indikator pembelajaran yang paling banyak keliru dikerjakan oleh siswa:
              </p>

              <div className="space-y-2">
                {diagnosticData.weakPoints.map((point) => (
                  <div
                    key={point.title}
                    className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-rose-950 dark:text-rose-200">
                        • {point.title}
                      </span>
                      <span className="text-[10px] font-black bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 px-2 py-0.5 rounded-full shrink-0">
                        {point.percentageMissed}
                      </span>
                    </div>
                    <p className="text-xs text-rose-800/90 dark:text-rose-300 font-semibold leading-relaxed pl-3">
                      {point.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bagian 2: Daftar Siswa yang Lemah & Butuh Bimbingan */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">👥</span>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Siswa yang Perlu Bimbingan / Remedial
                  </h4>
                </div>
                <span className="text-[11px] font-black text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                  {diagnosticData.weakStudents.length} Siswa Perlu Perhatian
                </span>
              </div>

              {pengayaanSuccessToast && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-400 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
                  <span className="text-base">🎉</span>
                  <span>{pengayaanSuccessToast}</span>
                </div>
              )}

              <div className="space-y-2">
                {diagnosticData.weakStudents.map((student) => {
                  const initials = student.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("");
                  const isRec = !!recommendedPengayaan[student.id];

                  return (
                    <div
                      key={student.id}
                      className="p-3.5 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs border-2 border-white dark:border-amber-800">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                              {student.name}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300">
                              {student.status}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                            Kelemahan: <span className="text-amber-900 dark:text-amber-200">{student.note}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                            Skor: {student.outOf}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">
                            ({student.score}%)
                          </span>
                        </div>

                        {/* TOMBOL SARANKAN PEMBELAJARAN PENGAYAAN */}
                        <button
                          type="button"
                          onClick={() => handleRecommendPengayaan(student, diagnosticData)}
                          className={`text-[11px] font-black px-3.5 py-1.5 rounded-xl transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            isRec
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-xs"
                              : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm hover:shadow"
                          }`}
                          title={`Sarankan pembelajaran modul pengayaan untuk ${student.name}`}
                        >
                          <span>{isRec ? "✅" : "🚀"}</span>
                          <span>{isRec ? "Pengayaan Disarankan" : "Sarankan Pengayaan"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <span>✅</span>
                <span>
                  {diagnosticData.masteredStudentsCount} Siswa lainnya di kelas telah mencapai nilai di atas kriteria ketuntasan (KKTP).
                </span>
              </div>
            </div>

            {/* Bagian 3: Rekomendasi Tindak Lanjut Guru */}
            <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border-2 border-sky-200 dark:border-sky-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">💡</span>
                <h4 className="text-xs sm:text-sm font-black text-sky-950 dark:text-sky-200">
                  Rekomendasi Tindak Lanjut Bpk/Ibu Guru:
                </h4>
              </div>
              <p className="text-xs text-sky-900 dark:text-sky-300 font-semibold leading-relaxed">
                {diagnosticData.recommendation}
              </p>

              <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    handleDeleteChapter(selectedDiagnosticChapter, e);
                    setSelectedDiagnosticChapter(null);
                  }}
                  className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-extrabold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer shadow-xs active:scale-95"
                  title="Hapus materi ini jika sudah tidak terpakai"
                >
                  <span>🗑️</span>
                  <span>Hapus Materi Ini</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSelectedDiagnosticChapter(null);
                  }}
                  className="w-full sm:w-auto bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-extrabold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Tutup Analisis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
