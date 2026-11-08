// frontend/src/components/AdaptiveEduGameModal.tsx
// Game Edukasi Visual 2D Interaktif (2D Canvas RPG Adventure & Interactive Card Match)
// 100% Gratis, Instan, Tanpa Perlu Login ke Luar, Langsung Dimainkan Siswa SD

"use client";

import ModalPortal from "@/components/ModalPortal";
import {
  playBadgeFanfareSound,
  playClickSound,
  playCoinSound,
  playCorrectSound,
  playRobotAwakeSound,
  playWrongSound,
} from "@/lib/soundEffects";
import { useUIStore } from "@/lib/store/useUIStore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chapter: string;
  chapterTitle?: string;
}

// Quest Item di Dunia 2D
interface WorldQuest {
  id: number;
  x: number;
  y: number;
  npcName: string;
  icon: string;
  location: string;
  story: string;
  question: string;
  options: {
    text: string;
    isRight: boolean;
    explanation: string;
    points: number;
  }[];
  completed?: boolean;
}

// Kartu Menjodohkan
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

  // Dynamic content dari modul
  const [resolvedTitle, setResolvedTitle] = useState<string>(chapterTitle || chapter);
  const [dynamicSummary, setDynamicSummary] = useState<string[]>([]);

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

  // Deteksi genre otomatis:
  // Jika Jawa / Aksara / Pasangan / Kosakata -> Format Menjodohkan Kartu
  // Jika PKn / Cerita / Nilai / Sains / Sejarah -> Format Petualangan 2D RPG Penjelajahan
  const isMatchingGenre = useMemo(() => {
    const c = (chapter || "").toLowerCase();
    const t = (resolvedTitle || "").toLowerCase();
    const s = dynamicSummary.join(" ").toLowerCase();
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
      s.includes("aksara") ||
      s.includes("krama")
    );
  }, [chapter, resolvedTitle, dynamicSummary]);

  const gameType: "adventure" | "matching" = isMatchingGenre ? "matching" : "adventure";

  // --------------------------------------------------------------------------
  // BAGIAN 1: SISTEM GAME 2D RPG PETUALANGAN (CANVAS EXPLORATION WORLD)
  // --------------------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Posisi Pemain (Karakter Anak SD)
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number; dir: "down" | "up" | "left" | "right" }>({
    x: 80,
    y: 200,
    dir: "right",
  });

  const [activeQuest, setActiveQuest] = useState<WorldQuest | null>(null);
  const [questFeedback, setQuestFeedback] = useState<string | null>(null);
  const [selectedQuestOption, setSelectedQuestOption] = useState<number | null>(null);
  const [adventureScore, setAdventureScore] = useState(0);
  const [adventureFinished, setAdventureFinished] = useState(false);

  // Quests yang tersebar di peta 2D sesuai materi
  const initialQuests: WorldQuest[] = useMemo(() => {
    const c = (chapter || "").toLowerCase();
    const t = (resolvedTitle || "").toLowerCase();

    if (c.includes("gotongroyong") || t.includes("gotong royong")) {
      return [
        {
          id: 1,
          x: 220,
          y: 110,
          npcName: "Pak Bon & Regu Sapu",
          icon: "🧹",
          location: "Halaman Depan Sekolah",
          story: "Dedaunan kering berserakan di lapangan seusai jam istirahat.",
          question: "Pak Bon dan teman piket sedang sibuk menyapu sendirian. Tindakanmu?",
          options: [
            {
              text: "Ambil sapu lidi dan ikut membantu menyapu bersama-sama.",
              isRight: true,
              explanation: "Hebat! Gotong royong membuat pekerjaan berat jadi cepat selesai dan terasa ringan.",
              points: 10,
            },
            {
              text: "Duduk santai di kantin sambil menonton teman bekerja.",
              isRight: false,
              explanation: "Kurang baik. Gotong royong membutuhkan partisipasi aktif bersama.",
              points: 0,
            },
          ],
        },
        {
          id: 2,
          x: 420,
          y: 260,
          npcName: "Tim Mading Kelas",
          icon: "🎨",
          location: "Ruang Mading Sekolah",
          story: "Teman-teman sedang menghias majalah dinding kelas untuk lomba besok.",
          question: "Ada teman yang bingung menata hiasan kertas. Bagaimana sikapmu?",
          options: [
            {
              text: "Bagi tugas secara adil: ada yang menggunting, mewarnai, dan menempelkan.",
              isRight: true,
              explanation: "Tepat sekali! Pembagian tugas yang rukun adalah kunci gotong royong.",
              points: 10,
            },
            {
              text: "Menyuruh satu orang saja mengerjakan agar kamu tidak capek.",
              isRight: false,
              explanation: "Tidak adil. Pekerjaan bersama harus dipikul secara kompak.",
              points: 0,
            },
          ],
        },
      ];
    }

    if (c.includes("norma") || t.includes("norma") || t.includes("aturan")) {
      return [
        {
          id: 1,
          x: 220,
          y: 110,
          npcName: "Ibu Kasir Kantin",
          icon: "🍲",
          location: "Kantin Kejujuran Sekolah",
          story: "Antrean pembelian makan siang cukup panjang di depan etalase.",
          question: "Perutmu lapar, tapi banyak teman sudah antre di depan. Sikapmu?",
          options: [
            {
              text: "Berdiri tertib di belakang antrean tanpa menyerobot teman di depan.",
              isRight: true,
              explanation: "Tertib antre mencerminkan pengamalan norma kesopanan dan disiplin sosial.",
              points: 10,
            },
            {
              text: "Menyelip ke paling depan kasir agar cepat dapat makanan.",
              isRight: false,
              explanation: "Menyerobot melanggar norma ketertiban dan merugikan teman lain.",
              points: 0,
            },
          ],
        },
        {
          id: 2,
          x: 420,
          y: 260,
          npcName: "Guru Piket",
          icon: "🚪",
          location: "Pintu Ruang Guru",
          story: "Kamu diminta menyerahkan buku tugas ke ruang guru.",
          question: "Pintu ruang guru sedang tertutup rapat. Apa tindakan santunmu?",
          options: [
            {
              text: "Ketuk pintu perlahan 3 kali, beri salam sopan, lalu minta izin masuk.",
              isRight: true,
              explanation: "Luar biasa santun! Adab mengetuk pintu dan salam menghormati para guru.",
              points: 10,
            },
            {
              text: "Tendang atau dorong pintu keras-keras lalu langsung lari masuk.",
              isRight: false,
              explanation: "Tidak sopan. Masuk ruangan harus selalu dengan izin dan salam.",
              points: 0,
            },
          ],
        },
      ];
    }

    // Default: Sila 3 & Pengamalan Pancasila
    return [
      {
        id: 1,
        x: 220,
        y: 110,
        npcName: "Budi (Siswa Baru)",
        icon: "⚽",
        location: "Lapangan Sepak Bola",
        story: "Ada siswa pindahan baru dari daerah seberang yang duduk sendirian tanpa kawan.",
        question: "Teman-temanmu sedang membagi tim bermain kasti. Apa yang kamu lakukan?",
        options: [
          {
            text: "Ajak siswa baru tersebut bergabung ke timmu dengan ramah dan gembira.",
            isRight: true,
            explanation: "Sempurna! Ini wujud Sila ke-3: Persatuan Indonesia tanpa membeda-bedakan asal suku.",
            points: 10,
          },
          {
            text: "Jauhi anak tersebut karena belum tahu logat bicaranya.",
            isRight: false,
            explanation: "Kurang baik. Kita harus selalu bersatu dan ramah pada siapa saja.",
            points: 0,
          },
        ],
      },
      {
        id: 2,
        x: 420,
        y: 260,
        npcName: "Pak RW & Warga",
        icon: "🏡",
        location: "Balai Warga Desa Harmoni",
        story: "Dua kelompok warga berbeda usulan tentang rute jalan sehat kemerdekaan.",
        question: "Diskusi mulai agak memanas. Saran bijak apa yang kamu sampaikan?",
        options: [
          {
            text: "Usulkan musyawarah mufakat secara kekeluargaan agar semua sepakat dengan damai.",
            isRight: true,
            explanation: "Bintang 5! Musyawarah mufakat menjaga kerukunan dan persatuan bangsa.",
            points: 10,
          },
          {
            text: "Paksakan pilihan kelompokmu sendiri dan jangan pedulikan orang lain.",
            isRight: false,
            explanation: "Memaksakan kehendak dapat memecah belah persatuan warga.",
            points: 0,
          },
        ],
      },
    ];
  }, [chapter, resolvedTitle]);

  const [quests, setQuests] = useState<WorldQuest[]>(initialQuests);

  useEffect(() => {
    setQuests(initialQuests);
    setPlayerPos({ x: 80, y: 200, dir: "right" });
    setActiveQuest(null);
    setQuestFeedback(null);
    setSelectedQuestOption(null);
    setAdventureScore(0);
    setAdventureFinished(false);
  }, [initialQuests]);

  // Loop Render Canvas Dunia 2D
  useEffect(() => {
    if (gameType !== "adventure") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // 1. Background Rumput Taman
      ctx.fillStyle = "#86efac"; // grass green
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Jalur Jalan Setapak (Batu Paving)
      ctx.fillStyle = "#fed7aa"; // pathway
      ctx.fillRect(40, 180, 520, 45); // horizontal path
      ctx.fillRect(200, 40, 45, 180); // vertical to quest 1
      ctx.fillRect(400, 180, 45, 160); // vertical to quest 2

      // 3. Pohon-Pohon Hiasan
      const drawTree = (tx: number, ty: number) => {
        ctx.fillStyle = "#78350f"; // batang
        ctx.fillRect(tx + 12, ty + 20, 8, 18);
        ctx.fillStyle = "#15803d"; // daun
        ctx.beginPath();
        ctx.arc(tx + 16, ty + 15, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(tx + 14, ty + 12, 12, 0, Math.PI * 2);
        ctx.fill();
      };

      drawTree(30, 50);
      drawTree(120, 70);
      drawTree(320, 60);
      drawTree(520, 80);
      drawTree(90, 270);
      drawTree(280, 290);
      drawTree(510, 280);

      // 4. Bangunan Sekolah & Tiang Bendera
      // Gedung Sekolah di Pojok Kiri Atas
      ctx.fillStyle = "#f87171"; // genteng merah
      ctx.beginPath();
      ctx.moveTo(30, 40);
      ctx.lineTo(100, 15);
      ctx.lineTo(170, 40);
      ctx.fill();
      ctx.fillStyle = "#fef08a"; // dinding kuning
      ctx.fillRect(40, 40, 120, 60);
      ctx.fillStyle = "#38bdf8"; // jendela
      ctx.fillRect(55, 55, 25, 25);
      ctx.fillRect(120, 55, 25, 25);
      ctx.fillStyle = "#92400e"; // pintu
      ctx.fillRect(90, 65, 20, 35);

      // Tiang Bendera Merah Putih
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(175, 80, 3, 50);
      ctx.fillStyle = "#ef4444"; // merah
      ctx.fillRect(178, 80, 18, 8);
      ctx.fillStyle = "#ffffff"; // putih
      ctx.fillRect(178, 88, 18, 8);

      // 5. Gambar Quests / NPCs
      quests.forEach((q) => {
        // Lingkaran Interaksi
        ctx.fillStyle = q.completed ? "rgba(34, 197, 94, 0.3)" : "rgba(234, 179, 8, 0.4)";
        ctx.beginPath();
        ctx.arc(q.x, q.y, 24, 0, Math.PI * 2);
        ctx.fill();

        // Icon Karakter
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(q.icon, q.x, q.y);

        // Tanda Seru / Centang Melayang
        ctx.font = "bold 14px sans-serif";
        ctx.fillStyle = q.completed ? "#16a34a" : "#dc2626";
        ctx.fillText(q.completed ? "✓" : "!", q.x, q.y - 28);

        // Label Nama NPC
        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.fillText(q.npcName, q.x, q.y + 24);
      });

      // 6. Gambar Pemain (Karakter Anak SD)
      // Badan
      ctx.fillStyle = "#ef4444"; // Kemeja Merah Putih (bawah merah)
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, 14, 0, Math.PI * 2);
      ctx.fill();

      // Topi / Kepala
      ctx.fillStyle = "#fed7aa"; // Wajah
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y - 12, 10, 0, Math.PI * 2);
      ctx.fill();

      // Topi Merah SD
      ctx.fillStyle = "#b91c1c";
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y - 16, 9, Math.PI, 0, false);
      ctx.fill();

      // Mata
      ctx.fillStyle = "#0f172a";
      const eyeOffset = playerPos.dir === "left" ? -4 : playerPos.dir === "right" ? 4 : 0;
      ctx.fillRect(playerPos.x - 3 + eyeOffset, playerPos.y - 14, 2, 2);
      ctx.fillRect(playerPos.x + 3 + eyeOffset, playerPos.y - 14, 2, 2);

      // Label Pemain
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = "#047857";
      ctx.textAlign = "center";
      ctx.fillText("Kamu (Siswa)", playerPos.x, playerPos.y + 24);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [playerPos, quests, gameType]);

  // Deteksi Tabrakan / Jarak ke Quest NPC
  const checkQuestProximity = useCallback(
    (nx: number, ny: number) => {
      for (const q of quests) {
        const dist = Math.hypot(nx - q.x, ny - q.y);
        if (dist < 32 && !q.completed) {
          setActiveQuest(q);
          setSelectedQuestOption(null);
          setQuestFeedback(null);
          playRobotAwakeSound();
          return;
        }
      }
    },
    [quests]
  );

  // Navigasi Gerakan Karakter
  const movePlayer = useCallback(
    (dx: number, dy: number, dir: "down" | "up" | "left" | "right") => {
      if (activeQuest) return; // Kunci gerakan jika sedang dialog quest

      setPlayerPos((prev) => {
        const nx = Math.max(30, Math.min(570, prev.x + dx));
        const ny = Math.max(40, Math.min(340, prev.y + dy));
        checkQuestProximity(nx, ny);
        return { x: nx, y: ny, dir };
      });
    },
    [activeQuest, checkQuestProximity]
  );

  // Keyboard Event Listener (Panah & WASD)
  useEffect(() => {
    if (gameType !== "adventure" || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 15;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        movePlayer(0, -step, "up");
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        movePlayer(0, step, "down");
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        movePlayer(-step, 0, "left");
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        movePlayer(step, 0, "right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameType, isOpen, movePlayer]);

  // Handler Pilihan Quest Petualangan
  const handleSelectOption = (optIdx: number) => {
    if (!activeQuest || selectedQuestOption !== null) return;

    const opt = activeQuest.options[optIdx];
    if (!opt) return;
    setSelectedQuestOption(optIdx);

    if (opt.isRight) {
      playCorrectSound();
      playCoinSound();
      setAdventureScore((prev) => prev + opt.points);
      setQuestFeedback(`🎉 TEPAT SEKALI! ${opt.explanation}`);

      // Tandai quest selesai
      setQuests((prev) =>
        prev.map((q) => (q.id === activeQuest.id ? { ...q, completed: true } : q))
      );
    } else {
      playWrongSound();
      setQuestFeedback(`💡 CATATAN BELAJAR: ${opt.explanation}`);
    }
  };

  const handleCloseQuestDialogue = () => {
    playClickSound();
    setActiveQuest(null);
    setSelectedQuestOption(null);
    setQuestFeedback(null);

    // Cek apakah semua quest selesai
    const remaining = quests.filter((q) => !q.completed);
    if (remaining.length === 0) {
      setAdventureFinished(true);
      playBadgeFanfareSound();
      addPoints(25);
    }
  };

  // --------------------------------------------------------------------------
  // BAGIAN 2: SISTEM GAME MENJODOHKAN (MATCHING PUZZLE BERBUNGA & BERWARNA)
  // --------------------------------------------------------------------------
  const matchingPairs: MatchingPair[] = useMemo(() => {
    const c = (chapter || "").toLowerCase();
    const t = (resolvedTitle || "").toLowerCase();

    // Tokoh Punokawan
    if (c.includes("punokawan") || t.includes("punokawan")) {
      return [
        { id: "1", left: "Semar", right: "Kuncung Putih & Bapak Bijaksana", hint: "Tokoh paling sepuh" },
        { id: "2", left: "Gareng", right: "Sikil Jinjit & Tangan Ceko", hint: "Waspada lan ngati-ati" },
        { id: "3", left: "Petruk", right: "Irung Dawa & Seneng Guyon", hint: "Awak dhuwur langsing" },
        { id: "4", left: "Bagong", right: "Awak Bunder Lemu & Jujur", hint: "Anak bungsu Semar" },
      ];
    }

    // Pandhawa Lima
    if (c.includes("pandhawa") || t.includes("pandhawa")) {
      return [
        { id: "1", left: "Puntadewa", right: "Pambarep Pandhawa, Jujur & Getih Putih", hint: "Ratu ing Amarta" },
        { id: "2", left: "Werkudara", right: "Gagah Gedhe, Kuku Pancanaka, Jujur", hint: "Satria ing Jodhipati" },
        { id: "3", left: "Janaka (Arjuna)", right: "Pinter Manah & Bagus Rupane", hint: "Satria ing Madukara" },
        { id: "4", left: "Nakula & Sadewa", right: "Satria Kembar, Setya & Pinter Ngrumat Jaran", hint: "Satria kembar" },
      ];
    }

    // Unggah-Ungguh Basa
    if (c.includes("unggah") || t.includes("unggah")) {
      return [
        { id: "1", left: "Mangan (Ngoko)", right: "Dahar (Krama Inggil)", hint: "Kanggo Bapak / Ibu Guru" },
        { id: "2", left: "Turu (Ngoko)", right: "Sare (Krama Inggil)", hint: "Kanggo Istirahat wengi" },
        { id: "3", left: "Lunga (Ngoko)", right: "Tindak (Krama Inggil)", hint: "Menyang kantor / sekolah" },
        { id: "4", left: "Tuku (Ngoko)", right: "Mundhut (Krama Inggil)", hint: "Tuku barang ing toko" },
        { id: "5", left: "Kowe (Ngoko)", right: "Panjenengan (Krama Inggil)", hint: "Sebutan kurmat" },
      ];
    }

    // Aksara Jawa (Default)
    return [
      { id: "1", left: "ꦲ (Ha)", right: "Hana / Caraka (Bunyi H / A)", hint: "Aksara kapisan" },
      { id: "2", left: "ꦤ (Na)", right: "Nata / Nampa (Bunyi N)", hint: "Aksara kapindho" },
      { id: "3", left: "ꦕ (Ca)", right: "Catur / Cara (Bunyi C)", hint: "Aksara katelu" },
      { id: "4", left: "ꦫ (Ra)", right: "Rasa / Ratu (Bunyi R)", hint: "Aksara kapapat" },
      { id: "5", left: "ꦏ (Ka)", right: "Karya / Kayu (Bunyi K)", hint: "Aksara kalima" },
    ];
  }, [chapter, resolvedTitle]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [matchingScore, setMatchingScore] = useState(0);
  const [matchingFinished, setMatchingFinished] = useState(false);
  const [shuffledRights, setShuffledRights] = useState<MatchingPair[]>([]);

  useEffect(() => {
    if (gameType === "matching") {
      const copy = [...matchingPairs].sort(() => Math.random() - 0.5);
      setShuffledRights(copy);
      setMatchedIds([]);
      setSelectedLeft(null);
      setMatchingScore(0);
      setMatchingFinished(false);
    }
  }, [gameType, matchingPairs]);

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

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-modal-title"
      >
        <div className="bg-white dark:bg-slate-900 border-4 border-yellow-400 dark:border-amber-500 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
          {/* HEADER MODAL */}
          <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 p-3.5 sm:p-4 text-slate-950 flex items-center justify-between border-b-2 border-amber-300 shadow-sm shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-11 h-11 rounded-2xl bg-white shadow-md flex items-center justify-center text-2xl shrink-0 animate-bounce">
                {gameType === "adventure" ? "🗺️" : "🧩"}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    id="game-modal-title"
                    className="font-black text-base sm:text-lg text-slate-950 truncate"
                  >
                    {gameType === "adventure"
                      ? "Petualangan Penjelajah Pengamalan"
                      : "Teka-Teki Menjodohkan Kartu Ceria"}
                  </h3>
                  <span className="text-[10px] font-black bg-white/95 text-amber-900 px-2 py-0.5 rounded-full shadow-xs">
                    ⚡ Langsung Main
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
              className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-900 font-black flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition shrink-0 cursor-pointer"
              aria-label="Tutup Game"
            >
              ✕
            </button>
          </div>

          {/* BADGE SKOR & STATUS */}
          <div className="bg-amber-50 dark:bg-amber-950/40 px-4 py-2 border-b border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs font-black shrink-0">
            <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200">
              <span>🎯 Mode: {gameType === "adventure" ? "Petualangan 2D RPG" : "Menjodohkan Kartu"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-300">
                🪙 Skor: {gameType === "adventure" ? adventureScore : matchingScore} Koin
              </span>
              <span className="bg-yellow-200 dark:bg-yellow-900/60 text-amber-900 dark:text-yellow-200 px-3 py-1 rounded-full">
                ⭐ Hadiah: +25 Poin
              </span>
            </div>
          </div>

          {/* ARENA PERMAINAN VISUAL */}
          <div className="p-3 sm:p-5 overflow-y-auto flex-1 flex flex-col items-center justify-center">
            {gameType === "adventure" ? (
              // ==========================================
              // ARENA GAME 2D PETUALANGAN (CANVAS EXPLORER)
              // ==========================================
              adventureFinished ? (
                <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
                  <div className="w-20 h-20 bg-yellow-100 dark:bg-amber-950/60 rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner border-2 border-yellow-300">
                    🏆
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-xl text-emerald-600 dark:text-emerald-400">
                      Misi Penjelajahan Selesai!
                    </h4>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Kamu berhasil menyelesaikan seluruh pos perbuatan baik di peta!
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-black px-4 py-2 rounded-2xl border border-amber-300">
                    <span>⭐ Poin Prestasi: +25 Poin</span>
                    <span>•</span>
                    <span>Skor Akhir: {adventureScore} Koin</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setQuests(initialQuests);
                        setPlayerPos({ x: 80, y: 200, dir: "right" });
                        setActiveQuest(null);
                        setQuestFeedback(null);
                        setSelectedQuestOption(null);
                        setAdventureScore(0);
                        setAdventureFinished(false);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-black py-2.5 px-6 rounded-2xl shadow-md transition cursor-pointer"
                    >
                      🔄 Jelajahi Peta Lagi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center space-y-3 relative">
                  {/* Petunjuk Kontrol */}
                  <div className="w-full text-center text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    🚶 Gunakan <b>Tombol Panah / WASD</b> atau tombol di bawah untuk berjalan menemui kawan bertanda <b>(!)</b>
                  </div>

                  {/* KANVAS 2D DUNIA GAME */}
                  <div className="relative border-4 border-amber-400 rounded-2xl overflow-hidden shadow-lg bg-green-200 max-w-full">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={360}
                      className="block max-w-full h-auto"
                    />

                    {/* POPUP DIALOG INTERAKTIF SAAT MENDEKATI NPC */}
                    {activeQuest && (
                      <div className="absolute inset-x-3 bottom-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border-2 border-amber-400 shadow-2xl animate-in fade-in slide-in-from-bottom-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-amber-200 dark:border-slate-700 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{activeQuest.icon}</span>
                            <div>
                              <div className="font-black text-xs text-amber-700 dark:text-amber-400 uppercase">
                                {activeQuest.location}
                              </div>
                              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                {activeQuest.npcName}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-black px-2.5 py-0.5 rounded-full">
                            Tantangan Sikap
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                          {activeQuest.question}
                        </p>

                        {/* Pilihan Tindakan */}
                        <div className="space-y-2">
                          {activeQuest.options.map((opt, oIdx) => {
                            const isSelected = selectedQuestOption === oIdx;
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
                                disabled={selectedQuestOption !== null}
                                onClick={() => handleSelectOption(oIdx)}
                                className={`w-full text-left p-2.5 rounded-xl border-2 font-medium text-xs transition flex items-start gap-2.5 cursor-pointer ${btnStyle}`}
                              >
                                <span className="w-5 h-5 rounded-md bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  {oIdx === 0 ? "A" : "B"}
                                </span>
                                <span className="flex-1 leading-snug">{opt.text}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Feedback & Tombol Lanjut */}
                        {questFeedback && (
                          <div className="space-y-2 pt-1 border-t border-amber-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {questFeedback}
                            </p>
                            <button
                              type="button"
                              onClick={handleCloseQuestDialogue}
                              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-2 px-4 rounded-xl shadow-md transition text-xs cursor-pointer"
                            >
                              Lanjut Berjalan di Peta ➡️
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* KONTROL D-PAD (UNTUK TOUCH / MOUSE KLIK) */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => movePlayer(0, -20, "up")}
                      className="w-12 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-amber-300 font-black text-slate-800 dark:text-slate-200 shadow-sm transition active:scale-90 flex items-center justify-center cursor-pointer"
                      aria-label="Atas"
                    >
                      ▲
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => movePlayer(-20, 0, "left")}
                        className="w-12 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-amber-300 font-black text-slate-800 dark:text-slate-200 shadow-sm transition active:scale-90 flex items-center justify-center cursor-pointer"
                        aria-label="Kiri"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => movePlayer(0, 20, "down")}
                        className="w-12 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-amber-300 font-black text-slate-800 dark:text-slate-200 shadow-sm transition active:scale-90 flex items-center justify-center cursor-pointer"
                        aria-label="Bawah"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => movePlayer(20, 0, "right")}
                        className="w-12 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-amber-300 font-black text-slate-800 dark:text-slate-200 shadow-sm transition active:scale-90 flex items-center justify-center cursor-pointer"
                        aria-label="Kanan"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              // ==========================================
              // ARENA GAME MENJODOHKAN (MATCHING PUZZLE)
              // ==========================================
              matchingFinished ? (
                <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-6 rounded-2xl shadow-md transition cursor-pointer"
                    >
                      🔄 Mainkan Lagi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <div className="text-center text-xs font-bold text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                    👉 Klik 1 kartu di sebelah <b>Kiri</b>, lalu klik pasangan yang cocok di sebelah <b>Kanan</b>!
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* KOLOM KIRI */}
                    <div className="space-y-2">
                      <div className="text-center font-black text-xs text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 py-1.5 rounded-xl">
                        Simbol / Istilah
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
                            className={`w-full p-3.5 rounded-2xl border-2 font-bold text-xs sm:text-sm text-left transition cursor-pointer ${
                              isDone
                                ? "bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 line-through opacity-60"
                                : isSelected
                                ? "bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-950 dark:text-amber-200 scale-102 ring-4 ring-amber-300 shadow-md"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/40 shadow-xs"
                            }`}
                          >
                            <span className="text-sm sm:text-base font-black">{pair.left}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* KOLOM KANAN */}
                    <div className="space-y-2">
                      <div className="text-center font-black text-xs text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/40 py-1.5 rounded-xl">
                        Pasangan Arti
                      </div>
                      {shuffledRights.map((pair) => {
                        const isDone = matchedIds.includes(pair.id);
                        return (
                          <button
                            key={pair.id}
                            type="button"
                            disabled={isDone}
                            onClick={() => handleRightCardClick(pair.id)}
                            className={`w-full p-3.5 rounded-2xl border-2 font-bold text-xs sm:text-sm text-left transition cursor-pointer ${
                              isDone
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300 dark:border-emerald-800 line-through opacity-60"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 shadow-xs"
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
            )}
          </div>

          {/* FOOTER MODAL */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>🎮 Game Edukasi Adaptif 100% Gratis di Browser</span>
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
