// frontend/src/components/AdaptiveEduGameModal.tsx
// Game Edukasi Adaptif Otomatis Berbasis Seluruh Materi Kurikulum & Modul Guru + Integrasi Manus AI

"use client";

import ModalPortal from "@/components/ModalPortal";
import {
  playBadgeFanfareSound,
  playClickSound,
  playCoinSound,
  playCorrectSound,
  playWrongSound,
} from "@/lib/soundEffects";
import { useUIStore } from "@/lib/store/useUIStore";
import React, { useEffect, useMemo, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chapter: string;
  chapterTitle?: string;
}

// Model data quest petualangan
interface AdventureStep {
  pos: number;
  location: string;
  story: string;
  dilemma: string;
  options: {
    text: string;
    isRight: boolean;
    explanation: string;
    points: number;
  }[];
}

// Model data kartu menjodohkan
interface MatchingPair {
  id: string;
  left: string;
  right: string;
  hint: string;
}

export default function AdaptiveEduGameModal({
  isOpen,
  onClose,
  chapter,
  chapterTitle,
}: Props) {
  const addPoints = useUIStore((s) => s.addPoints);
  const activeValidatedModule = useUIStore((s) => s.activeValidatedModule);

  // Dynamic content dari API untuk modul baru yang di-upload oleh Guru
  const [dynamicSummary, setDynamicSummary] = useState<string[]>([]);
  const [resolvedTitle, setResolvedTitle] = useState<string>(chapterTitle || chapter);

  // Ambil data ringkasan materi aktif dari server secara asinkron jika materi berubah
  useEffect(() => {
    let isMounted = true;
    const fetchContent = async () => {
      try {
        const res = await fetch(`/api/content?chapter=${encodeURIComponent(chapter)}&mode=cerita`);
        const json = await res.json();
        if (isMounted && json && json.body && Array.isArray(json.body)) {
          setDynamicSummary(json.body);
          if (json.title) {
            setResolvedTitle(json.title.replace("Ringkasan Modul & Pengamalan: ", ""));
          }
        }
      } catch {
        // Gunakan fallback modul aktif
        if (isMounted && activeValidatedModule?.ragSummary) {
          setDynamicSummary(activeValidatedModule.ragSummary);
          setResolvedTitle(activeValidatedModule.title);
        }
      }
    };

    fetchContent();
    return () => {
      isMounted = false;
    };
  }, [chapter, activeValidatedModule]);

  // Deteksi genre game otomatis sesuai materi (apakah materi simbol/kosakata vs naratif/pengamalan)
  const isMatchingGenre = useMemo(() => {
    const c = (chapter || "").toLowerCase();
    const t = (resolvedTitle || "").toLowerCase();
    const s = dynamicSummary.join(" ").toLowerCase();

    // Materi yang lebih cocok menjodohkan (Matching Game):
    // Bahasa Jawa, Aksara, Pasangan, Kosakata, Vocab, Istilah, Rumus, Sinonim, Lawan Kata
    return (
      c.includes("bjawa") ||
      c.includes("aksara") ||
      c.includes("unggah") ||
      c.includes("punokawan") ||
      c.includes("pandhawa") ||
      t.includes("jawa") ||
      t.includes("aksara") ||
      t.includes("unggah") ||
      t.includes("punokawan") ||
      t.includes("pandhawa") ||
      t.includes("kosakata") ||
      t.includes("istilah") ||
      s.includes("aksara") ||
      s.includes("krama") ||
      s.includes("ngoko")
    );
  }, [chapter, resolvedTitle, dynamicSummary]);

  const gameType: "adventure" | "matching" = isMatchingGenre ? "matching" : "adventure";

  // Tab aktif: Arena Game Langsung vs Integrasi Manus AI
  const [activeTab, setActiveTab] = useState<"game" | "manus">("game");
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // -------------------------------------------------------------
  // 1. DATA GAME PETUALANGAN (ADVENTURE) SESUAI SELURUH BAB MATERI
  // -------------------------------------------------------------
  const adventureSteps: AdventureStep[] = useMemo(() => {
    const c = (chapter || "").toLowerCase();
    const t = (resolvedTitle || "").toLowerCase();

    // A. BAB GOTONG ROYONG (PKN BAB 2)
    if (c.includes("gotongroyong") || t.includes("gotong royong")) {
      return [
        {
          pos: 1,
          location: "🏫 Halaman Depan Sekolah",
          story: "Dedaunan kering berserakan di lapangan setelah angin kencang kemarin sore.",
          dilemma: "Budi melihat teman-teman regu piket sedang sibuk menyapu sendirian.",
          options: [
            {
              text: "Segera mengambil sapu lidi dan ikut membantu membersihkan halaman bersama.",
              isRight: true,
              explanation: "Hebat! Gotong royong membuat pekerjaan berat menjadi cepat selesai dan terasa ringan.",
              points: 10,
            },
            {
              text: "Duduk santai di teras sambil menonton teman-teman bekerja.",
              isRight: false,
              explanation: "Kurang tepat. Menonton saja tidak mencerminkan sikap gotong royong dan kebersamaan.",
              points: 0,
            },
          ],
        },
        {
          pos: 2,
          location: "🎨 Ruang Mading Kelas",
          story: "Kelasmu akan dinilai dalam lomba mading antar kelas besok pagi.",
          dilemma: "Ada teman yang bingung menempelkan hiasan dan cat mading.",
          options: [
            {
              text: "Membagi tugas: ada yang menggambar, menggunting, dan menempelkan bersama-sama.",
              isRight: true,
              explanation: "Tepat sekali! Pembagian tugas yang rukun dan adil adalah kunci keberhasilan gotong royong.",
              points: 10,
            },
            {
              text: "Menyuruh satu teman saja mengerjakan semuanya agar tidak repot.",
              isRight: false,
              explanation: "Kurang baik. Beban kerja harus dipikul bersama agar adil dan kompak.",
              points: 0,
            },
          ],
        },
      ];
    }

    // B. BAB NORMA & ATURAN SEKOLAH (PKN BAB 3)
    if (c.includes("norma") || t.includes("norma") || t.includes("aturan")) {
      return [
        {
          pos: 1,
          location: "🍲 Kantin Kejujuran Sekolah",
          story: "Saat jam istirahat, banyak siswa yang ingin membeli makan siang.",
          dilemma: "Antrean cukup panjang di depan kasir kantin.",
          options: [
            {
              text: "Berdiri tertib di barisan antrean tanpa menyerobot teman di depan.",
              isRight: true,
              explanation: "Luar biasa! Disiplin antre adalah pengamalan norma kesopanan dan ketertiban umum.",
              points: 10,
            },
            {
              text: "Menyelip langsung ke depan kasir karena merasa sangat lapar.",
              isRight: false,
              explanation: "Tidak boleh ya! Menyerobot antrean melanggar norma ketertiban dan merugikan teman lain.",
              points: 0,
            },
          ],
        },
        {
          pos: 2,
          location: "🚪 Pintu Ruang Guru",
          story: "Kamu diminta mengantarkan buku tugas ke meja wali kelas.",
          dilemma: "Pintu ruang guru sedang tertutup rapat.",
          options: [
            {
              text: "Mengetuk pintu perlahan tiga kali, mengucapkan salam, lalu meminta izin masuk.",
              isRight: true,
              explanation: "Sangat santun! Itu adalah pengamalan norma kesopanan kepada guru dan orang yang lebih tua.",
              points: 10,
            },
            {
              text: "Mendorong pintu keras-keras lalu langsung berlari ke dalam.",
              isRight: false,
              explanation: "Kurang sopan. Masuk ke ruangan harus selalu diawali dengan ketukan dan salam santun.",
              points: 0,
            },
          ],
        },
      ];
    }

    // C. BAB BHINNEKA TUNGGAL IKA & KEBERAGAMAN (PKN BAB 4)
    if (c.includes("bhinneka") || t.includes("bhinneka") || t.includes("keberagaman")) {
      return [
        {
          pos: 1,
          location: "🎪 Panggung Seni Budaya Sekolah",
          story: "Sekolah mengadakan Festival Budaya Nusantara dengan baju adat dari Sabang sampai Merauke.",
          dilemma: "Ada teman yang memakai pakaian adat daerah lain yang belum pernah kamu lihat sebelumnya.",
          options: [
            {
              text: "Memuji keunikan baju adatnya dengan bangga dan bertanya tentang makna budaya asalnya.",
              isRight: true,
              explanation: "Sangat bijak! Menghargai keragaman budaya adalah wujud semboyan Bhinneka Tunggal Ika.",
              points: 10,
            },
            {
              text: "Menertawakan hiasan kepalanya karena berbeda dengan baju adat daerahmu.",
              isRight: false,
              explanation: "Salah besar. Kita tidak boleh mencela pakaian adat teman yang berbeda suku bangsa.",
              points: 0,
            },
          ],
        },
        {
          pos: 2,
          location: "🍱 Meja Makan Istirahat",
          story: "Teman di sebelahmu membawa bekal makanan khas tradisional dari kampung halamannya.",
          dilemma: "Temanmu menawarkan untuk mencicipi masakannya bersama.",
          options: [
            {
              text: "Menerima tawaran dengan sopan dan mengucapkan terima kasih sambil mencicipi bersama.",
              isRight: true,
              explanation: "Keren! Sikap toleransi kuliner dan persahabatan mempererat persatuan anak bangsa.",
              points: 10,
            },
            {
              text: "Menutup hidung dan mengejek aroma makanannya di depan teman-teman.",
              isRight: false,
              explanation: "Kurang terpuji. Kita harus selalu menghargai makanan khas setiap daerah.",
              points: 0,
            },
          ],
        },
      ];
    }

    // D. BAB SILA KE-3 PANCASILA (PKN BAB 1 - DEFAULT)
    if (c.includes("sila3") || t.includes("sila ke-3") || t.includes("persatuan")) {
      return [
        {
          pos: 1,
          location: "🏫 Lapangan Upacara & Olahraga",
          story: "Ada siswa baru yang pindah dari luar kota dan belum memiliki teman bermain bola kasti.",
          dilemma: "Teman-temanmu sedang sibuk memilih anggota kelompok bermain.",
          options: [
            {
              text: "Mengajak siswa baru tersebut masuk ke tim dengan ramah dan senyum ceria.",
              isRight: true,
              explanation: "Bintang 5! Ini wujud nyata Sila ke-3: Persatuan Indonesia tanpa membeda-bedakan asal daerah.",
              points: 10,
            },
            {
              text: "Menjauhinya karena ia belum mengenal peraturan tim sekolah.",
              isRight: false,
              explanation: "Tidak baik. Sila ke-3 mengajarkan kita untuk selalu merangkul dan rukun dengan siapa saja.",
              points: 0,
            },
          ],
        },
        {
          pos: 2,
          location: "🏡 Balai Musyawarah Desa Harmoni",
          story: "Dua kelompok regu berbeda pendapat mengenai persiapan pawai perayaan kemerdekaan.",
          dilemma: "Suasana diskusi mulai agak panas di dalam ruangan rapat.",
          options: [
            {
              text: "Mengusulkan musyawarah mufakat secara kekeluargaan agar semua kelompok sepakat dengan damai.",
              isRight: true,
              explanation: "Bijak sekali! Musyawarah mufakat menjaga persatuan dan keutuhan lingkungan masyarakat.",
              points: 10,
            },
            {
              text: "Memaksakan kehendak regu sendiri tanpa mau mendengarkan masukan regu lain.",
              isRight: false,
              explanation: "Salah. Memaksakan kehendak dapat memecah belah kerukunan dan persatuan.",
              points: 0,
            },
          ],
        },
      ];
    }

    // E. FALLBACK DINAMIS UNTUK MODUL GURU APAPUN (CUSTOM MODUL / MAPEL LAIN)
    // Otomatis men-generate alur petualangan dari ringkasan modul aktual!
    const point1 = dynamicSummary[0] || `Memahami konsep utama materi ${resolvedTitle}.`;
    const point2 = dynamicSummary[1] || `Menerapkan pemahaman materi ${resolvedTitle} dalam kehidupan sehari-hari.`;

    return [
      {
        pos: 1,
        location: `🏫 Laboratorium & Ruang Belajar (${resolvedTitle})`,
        story: `Guru sedang menjelaskan konsep penting: "${point1.slice(0, 100)}..."`,
        dilemma: "Kamu menghadapi pertanyaan penerapan materi ini di hadapan kelas.",
        options: [
          {
            text: `Memilih tindakan yang benar dan tepat sesuai panduan modul pembelajaran ${resolvedTitle}.`,
            isRight: true,
            explanation: `Luar biasa! Pemahamanmu sangat tajam mengenai materi ${resolvedTitle}.`,
            points: 10,
          },
          {
            text: "Mengabaikan materi dan bertindak sembarangan tanpa membaca modul.",
            isRight: false,
            explanation: "Kurang tepat. Selalu perhatikan intisari materi agar pemahamanmu semakin mantap.",
            points: 0,
          },
        ],
      },
      {
        pos: 2,
        location: `🌍 Arena Pengamalan Sehari-hari (${resolvedTitle})`,
        story: `Di lingkungan nyata: "${point2.slice(0, 100)}..."`,
        dilemma: "Bagaimana sikap terbaik yang harus kamu tunjukkan?",
        options: [
          {
            text: "Menerapkan ilmu yang telah dipelajari dengan penuh tanggung jawab, jujur, dan disiplin.",
            isRight: true,
            explanation: "Sempurna! Kamu telah membuktikan pengamalan materi dengan sangat baik.",
            points: 10,
          },
          {
            text: "Bersikap acuh tak acuh terhadap lingkungan sekitar.",
            isRight: false,
            explanation: "Salah. Belajar yang sejati harus tercermin dalam perbuatan baik sehari-hari.",
            points: 0,
          },
        ],
      },
    ];
  }, [chapter, resolvedTitle, dynamicSummary]);

  // -------------------------------------------------------------
  // 2. DATA GAME MENJODOHKAN (MATCHING) SESUAI SELURUH BAB BASA JAWA / MODUL LAIN
  // -------------------------------------------------------------
  const matchingPairs: MatchingPair[] = useMemo(() => {
    const c = (chapter || "").toLowerCase();
    const t = (resolvedTitle || "").toLowerCase();

    // A. TOKOH PUNOKAWAN (BASA JAWA BAB 2)
    if (c.includes("punokawan") || t.includes("punokawan")) {
      return [
        { id: "1", left: "Semar", right: "Kuncung Putih & Bapak Bijaksana", hint: "Tokoh paling sepuh" },
        { id: "2", left: "Gareng", right: "Sikil Jinjit & Tangan Ceko", hint: "Waspada lan ngati-ati" },
        { id: "3", left: "Petruk", right: "Irung Dawa & Seneng Guyon", hint: "Awak dhuwur langsing" },
        { id: "4", left: "Bagong", right: "Awak Bunder Lemu & Jujur", hint: "Anak bungsu Semar" },
      ];
    }

    // B. PANDHAWA LIMA (BASA JAWA BAB 3)
    if (c.includes("pandhawa") || t.includes("pandhawa")) {
      return [
        { id: "1", left: "Puntadewa", right: "Pambarep Pandhawa, Jujur & Getih Putih", hint: "Ratu ing Amarta" },
        { id: "2", left: "Werkudara", right: "Gagah Gedhe, Kuku Pancanaka, Jujur", hint: "Satria ing Jodhipati" },
        { id: "3", left: "Janaka (Arjuna)", right: "Pinter Manah & Bagus Rupane", hint: "Satria ing Madukara" },
        { id: "4", left: "Nakula & Sadewa", right: "Satria Kembar, Setya & Pinter Ngrumat Jaran", hint: "Satria kembar" },
      ];
    }

    // C. UNGGAH-UNGGUH BASA (BASA JAWA BAB 1)
    if (c.includes("unggah") || t.includes("unggah")) {
      return [
        { id: "1", left: "Mangan (Ngoko)", right: "Dahar (Krama Inggil)", hint: "Kanggo Bapak / Ibu Guru" },
        { id: "2", left: "Turu (Ngoko)", right: "Sare (Krama Inggil)", hint: "Kanggo Istirahat wengi" },
        { id: "3", left: "Lunga (Ngoko)", right: "Tindak (Krama Inggil)", hint: "Menyang kantor / sekolah" },
        { id: "4", left: "Tuku (Ngoko)", right: "Mundhut (Krama Inggil)", hint: "Tuku barang ing toko" },
        { id: "5", left: "Kowe (Ngoko)", right: "Panjenengan (Krama Inggil)", hint: "Sebutan kurmat" },
      ];
    }

    // D. AKSARA JAWA (BASA JAWA BAB 4)
    if (c.includes("aksara") || t.includes("aksara")) {
      return [
        { id: "1", left: "ꦲ (Ha)", right: "Hana / Caraka (Bunyi H / A)", hint: "Aksara kapisan" },
        { id: "2", left: "ꦤ (Na)", right: "Nata / Nampa (Bunyi N)", hint: "Aksara kapindho" },
        { id: "3", left: "ꦕ (Ca)", right: "Catur / Cara (Bunyi C)", hint: "Aksara katelu" },
        { id: "4", left: "ꦫ (Ra)", right: "Rasa / Ratu (Bunyi R)", hint: "Aksara kapapat" },
        { id: "5", left: "ꦏ (Ka)", right: "Karya / Kayu (Bunyi K)", hint: "Aksara kalima" },
      ];
    }

    // E. FALLBACK DINAMIS UNTUK MODUL KOSAKATA / ISTILAH BARU GURU
    if (dynamicSummary.length >= 2) {
      return dynamicSummary.slice(0, 4).map((line, idx) => {
        const parts = line.split(":");
        const leftText = (parts[0] || `Istilah ${idx + 1}`).trim().slice(0, 25);
        const rightText = (parts[1] || parts[0] || `Penjelasan materi ${idx + 1}`).trim().slice(0, 40);
        return {
          id: String(idx + 1),
          left: leftText,
          right: rightText,
          hint: `Materi ${resolvedTitle}`,
        };
      });
    }

    // Default pasangan aksara
    return [
      { id: "1", left: "ꦲ (Ha)", right: "Hana / Caraka (Bunyi H / A)", hint: "Aksara kapisan" },
      { id: "2", left: "ꦤ (Na)", right: "Nata / Nampa (Bunyi N)", hint: "Aksara kapindho" },
      { id: "3", left: "ꦕ (Ca)", right: "Catur / Cara (Bunyi C)", hint: "Aksara katelu" },
      { id: "4", left: "ꦫ (Ra)", right: "Rasa / Ratu (Bunyi R)", hint: "Aksara kapapat" },
    ];
  }, [chapter, resolvedTitle, dynamicSummary]);

  // State Adventure Game
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [adventureScore, setAdventureScore] = useState(0);
  const [adventureFinished, setAdventureFinished] = useState(false);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [stepFeedback, setStepFeedback] = useState<string | null>(null);

  // State Matching Game
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [matchingScore, setMatchingScore] = useState(0);
  const [matchingFinished, setMatchingFinished] = useState(false);
  const [shuffledRights, setShuffledRights] = useState<MatchingPair[]>([]);

  // Acak kartu saat game menjodohkan dibuka / ganti bab
  useEffect(() => {
    if (gameType === "matching") {
      const copy = [...matchingPairs].sort(() => Math.random() - 0.5);
      setShuffledRights(copy);
      setMatchedIds([]);
      setSelectedLeft(null);
      setMatchingScore(0);
      setMatchingFinished(false);
    } else {
      setCurrentStepIdx(0);
      setAdventureScore(0);
      setAdventureFinished(false);
      setSelectedOptionIdx(null);
      setStepFeedback(null);
    }
  }, [chapter, gameType, matchingPairs]);

  // Reset saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setActiveTab("game");
      setCopiedPrompt(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Prompt generator khusus untuk Manus AI (Selalu akurat sesuai materi aktual)
  const manusPrompt =
    gameType === "adventure"
      ? `Buat web game 2D petualangan interaktif (HTML5 Canvas/Phaser) ramah anak SD bertema materi: "${resolvedTitle}". Karakter anak SD berpetualang menyelesaikan pos misi studi kasus nyata sesuai materi tersebut (${dynamicSummary.slice(0, 2).join("; ") || "misi pengamalan nilai"}). Berikan visual kartun warna-warni ceria, efek suara koin emas saat memilih keputusan bijak, dan sertifikat bintang juara di akhir game.`
      : `Buat web game edukasi anak SD bertema materi: "${resolvedTitle}". Genre: Menjodohkan Kartu Pasangan (Memory/Drag-and-Drop Matching). Siswa mencocokkan simbol/istilah materi (${matchingPairs.map((p) => p.left).join(", ")}) dengan pasangannya yang tepat. Berikan efek suara tepuk tangan saat cocok, timer tantangan 60 detik, dan animasi kartu bersinar.`;

  // Handler interaksi Petualangan
  const handleSelectAdventureOption = (optIdx: number) => {
    if (selectedOptionIdx !== null) return;

    const step = adventureSteps[currentStepIdx];
    if (!step) return;
    const opt = step.options[optIdx];
    if (!opt) return;

    setSelectedOptionIdx(optIdx);

    if (opt.isRight) {
      playCorrectSound();
      playCoinSound();
      setAdventureScore((prev) => prev + opt.points);
      setStepFeedback(`🎉 TEPAT SEKALI! ${opt.explanation}`);
    } else {
      playWrongSound();
      setStepFeedback(`💡 CATATAN BELAJAR: ${opt.explanation}`);
    }
  };

  const handleNextAdventureStep = () => {
    playClickSound();
    if (currentStepIdx + 1 < adventureSteps.length) {
      setCurrentStepIdx((prev) => prev + 1);
      setSelectedOptionIdx(null);
      setStepFeedback(null);
    } else {
      setAdventureFinished(true);
      playBadgeFanfareSound();
      addPoints(25);
    }
  };

  // Handler interaksi Menjodohkan (Matching)
  const handleLeftCardClick = (id: string) => {
    if (matchedIds.includes(id)) return;
    playClickSound();
    setSelectedLeft(id);
  };

  const handleRightCardClick = (id: string) => {
    if (!selectedLeft) {
      playWrongSound();
      return;
    }
    if (matchedIds.includes(id)) return;

    if (selectedLeft === id) {
      playCorrectSound();
      playCoinSound();
      const updated = [...matchedIds, id];
      setMatchedIds(updated);
      setSelectedLeft(null);
      setMatchingScore((prev) => prev + 10);

      if (updated.length === matchingPairs.length) {
        setMatchingFinished(true);
        playBadgeFanfareSound();
        addPoints(25);
      }
    } else {
      playWrongSound();
      setSelectedLeft(null);
    }
  };

  const handleCopyManusPrompt = () => {
    navigator.clipboard.writeText(manusPrompt);
    playClickSound();
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-modal-title"
      >
        <div className="bg-white dark:bg-slate-900 border-4 border-yellow-300 dark:border-amber-500 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
          {/* HEADER MODAL */}
          <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 p-4 sm:p-5 text-slate-900 flex items-center justify-between border-b-2 border-amber-300 shadow-sm shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-2xl shrink-0 animate-bounce">
                {gameType === "adventure" ? "🗺️" : "🧩"}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    id="game-modal-title"
                    className="font-black text-lg sm:text-xl text-slate-950 truncate"
                  >
                    {gameType === "adventure"
                      ? "Petualangan Penjelajah Pengamalan"
                      : "Teka-Teki Menjodohkan Kartu Ceria"}
                  </h3>
                  <span className="text-[11px] font-black bg-white/90 text-amber-900 px-2.5 py-0.5 rounded-full shadow-xs">
                    ⚡ 100% Adaptif Sesuai Modul
                  </span>
                </div>
                <p className="text-xs font-bold text-amber-950/90 truncate">
                  Materi: {resolvedTitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-900 font-black flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition shrink-0"
              aria-label="Tutup Game"
            >
              ✕
            </button>
          </div>

          {/* TAB NAVIGATOR: ARENA GAMEPLAY VS MANUS AI ENGINE */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50 p-2 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab("game");
              }}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 ${
                activeTab === "game"
                  ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span>🎮</span>
              <span>Mainkan Game Sekarang (Instan)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab("manus");
              }}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 ${
                activeTab === "manus"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span>✨</span>
              <span>Generate di Manus AI (3D/Canvas)</span>
            </button>
          </div>

          {/* BODY MODAL */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {activeTab === "game" ? (
              // TAB 1: ARENA GAMEPLAY
              gameType === "adventure" ? (
                // MODE PETUALANGAN
                adventureFinished ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-20 h-20 bg-yellow-100 dark:bg-amber-950/60 rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner border-2 border-yellow-300">
                      🏆
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-xl text-emerald-600 dark:text-emerald-400">
                        Misi Penjelajahan Berhasil!
                      </h4>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Kamu hebat sekali menyelesaikan seluruh tantangan untuk materi {resolvedTitle}!
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-black px-4 py-2 rounded-2xl border border-amber-300">
                      <span>⭐ Poin Prestasi: +25 Poin</span>
                      <span>•</span>
                      <span>Skor Misi: {adventureScore} Koin</span>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setCurrentStepIdx(0);
                          setAdventureScore(0);
                          setAdventureFinished(false);
                          setSelectedOptionIdx(null);
                          setStepFeedback(null);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-black py-2.5 px-6 rounded-2xl shadow-md transition"
                      >
                        🔄 Main Petualangan Lagi
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status Pos */}
                    <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200 dark:border-amber-800">
                      <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                        Pos {currentStepIdx + 1} dari {adventureSteps.length}
                      </span>
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300">
                        🪙 {adventureScore} Koin
                      </span>
                    </div>

                    {/* Lokasi & Cerita */}
                    {adventureSteps[currentStepIdx] && (
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {adventureSteps[currentStepIdx]?.location}
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                          {adventureSteps[currentStepIdx]?.story}
                        </p>
                        <div className="p-3 bg-yellow-50 dark:bg-amber-950/40 rounded-xl border-l-4 border-amber-400 text-xs font-bold text-amber-950 dark:text-amber-200">
                          🤔 Tantangan Sikap: {adventureSteps[currentStepIdx]?.dilemma}
                        </div>
                      </div>
                    )}

                    {/* Pilihan Tindakan */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-black text-slate-700 dark:text-slate-300">
                        Pilih keputusan terbaik sesuai materi pembelajaran:
                      </div>
                      {(adventureSteps[currentStepIdx]?.options || []).map((opt, oIdx) => {
                        const isSelected = selectedOptionIdx === oIdx;
                        let btnStyle =
                          "border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20";
                        if (isSelected) {
                          btnStyle = opt.isRight
                            ? "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200"
                            : "bg-rose-100 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200";
                        }
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={selectedOptionIdx !== null}
                            onClick={() => handleSelectAdventureOption(oIdx)}
                            className={`w-full text-left p-3.5 rounded-2xl border-2 font-medium text-xs sm:text-sm transition flex items-start gap-3 ${btnStyle}`}
                          >
                            <span className="w-6 h-6 rounded-lg bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {oIdx === 0 ? "A" : "B"}
                            </span>
                            <span className="flex-1 leading-snug">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback & Tombol Lanjut */}
                    {stepFeedback && (
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-600 space-y-2 animate-in fade-in">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {stepFeedback}
                        </p>
                        <button
                          type="button"
                          onClick={handleNextAdventureStep}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-2.5 px-4 rounded-xl shadow-md hover:scale-[1.02] active:scale-95 transition text-xs"
                        >
                          Lanjut ke Pos Berikutnya ➡️
                        </button>
                      </div>
                    )}
                  </div>
                )
              ) : // MODE MENJODOHKAN
              matchingFinished ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner border-2 border-emerald-300">
                    🎉
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-xl text-emerald-600 dark:text-emerald-400">
                      Pinter Banget! Semua Pasangan Cocok!
                    </h4>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Kamu berhasil mencocokkan seluruh kartu untuk materi {resolvedTitle}!
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-black px-4 py-2 rounded-2xl border border-emerald-300">
                    <span>⭐ Poin Prestasi: +25 Poin</span>
                    <span>•</span>
                    <span>Skor Cocok: {matchingScore} Koin</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        const copy = [...matchingPairs].sort(() => Math.random() - 0.5);
                        setShuffledRights(copy);
                        setMatchedIds([]);
                        setSelectedLeft(null);
                        setMatchingScore(0);
                        setMatchingFinished(false);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-6 rounded-2xl shadow-md transition"
                    >
                      🔄 Mainkan Lagi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Matching */}
                  <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200 dark:border-amber-800">
                    <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                      🎯 Terjodohkan: {matchedIds.length} dari {matchingPairs.length} Pasangan
                    </span>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300">
                      🪙 {matchingScore} Koin
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Petunjuk: Klik 1 kartu di sebelah <b>Kiri</b>, lalu klik pasangan artinya di sebelah{" "}
                    <b>Kanan</b>!
                  </p>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* KOLOM KIRI */}
                    <div className="space-y-2">
                      <div className="text-center font-black text-xs text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 py-1 rounded-lg">
                        Simbol / Istilah Materi
                      </div>
                      {matchingPairs.map((pair) => {
                        const isDone = matchedIds.includes(pair.id);
                        const isSelected = selectedLeft === pair.id;
                        return (
                          <button
                            key={pair.id}
                            type="button"
                            disabled={isDone}
                            onClick={() => handleLeftCardClick(pair.id)}
                            className={`w-full p-3 rounded-xl border-2 font-bold text-xs sm:text-sm text-left transition ${
                              isDone
                                ? "bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 line-through opacity-60"
                                : isSelected
                                ? "bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-950 dark:text-amber-200 scale-102 ring-2 ring-amber-400"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                            }`}
                          >
                            <span className="text-sm font-black">{pair.left}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* KOLOM KANAN */}
                    <div className="space-y-2">
                      <div className="text-center font-black text-xs text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/40 py-1 rounded-lg">
                        Pasangan Arti / Penjelasan
                      </div>
                      {shuffledRights.map((pair) => {
                        const isDone = matchedIds.includes(pair.id);
                        return (
                          <button
                            key={pair.id}
                            type="button"
                            disabled={isDone}
                            onClick={() => handleRightCardClick(pair.id)}
                            className={`w-full p-3 rounded-xl border-2 font-bold text-xs sm:text-sm text-left transition ${
                              isDone
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300 dark:border-emerald-800 line-through opacity-60"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700"
                            }`}
                          >
                            <span className="text-xs sm:text-sm">{pair.right}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )
            ) : (
              // TAB 2: MANUS AI GENERATOR BRIDGE
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 rounded-2xl border-2 border-purple-300 dark:border-purple-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <h4 className="font-black text-sm text-purple-950 dark:text-purple-200">
                      Autonomous Game Generator Manus AI
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Sistem ExplainMyLesson telah otomatis merangkai prompt instruksi game engine
                    lengkap yang siap dikirim ke <b>Manus AI</b> untuk di-generate menjadi game 3D/Phaser
                    utuh sesuai materi: <b>{resolvedTitle}</b>!
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                      Prompt Instruksi Game Terstruktur:
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyManusPrompt}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      {copiedPrompt ? "✅ Tersalin!" : "📋 Salin Prompt"}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={manusPrompt}
                    rows={4}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-purple-200 dark:border-slate-700 bg-purple-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <a
                    href={`https://manus.im/app?prompt=${encodeURIComponent(manusPrompt)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      playBadgeFanfareSound();
                      handleCopyManusPrompt();
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-3 px-5 rounded-2xl shadow-lg shadow-purple-500/30 transition flex items-center justify-center gap-2 text-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <span>🚀 Buka & Generate di Manus AI</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Baru</span>
                  </a>
                  <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2">
                    *Prompt otomatis disalin ke clipboard saat tombol ditekan untuk langsung di-paste di Manus AI.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER MODAL */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>💡 Mode Adaptif Otomatis Berdasarkan Modul Pelajaran</span>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
