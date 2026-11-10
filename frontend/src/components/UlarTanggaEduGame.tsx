// frontend/src/components/UlarTanggaEduGame.tsx
// Game Edukasi Papan: Ular Tangga Tes & Evaluasi Pemahaman Materi
// Fitur:
// 1. Papan 36 Petak Interaktif (6x6 serpentine grid)
// 2. Dadu Kocok Interaktif (1 s/d 6) dengan animasi kocokan
// 3. Tangga Prestasi (Naik petak jika berhasil jawab kuis tes materi)
// 4. Ular Tantangan (Turun petak jika jawaban kurang tepat)
// 5. Petak Kuis & Koin Bonus
// 6. Lawan Kawan Sekelas Online (Siti Rahmawati) dengan giliran otomatis
// 7. Integrasi Poin & Sound Effects

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  playClickSound,
  playCorrectSound,
  playWrongSound,
  playCoinSound,
  playSpringJumpSound,
  playOofSound,
  playBadgeFanfareSound,
} from "@/lib/soundEffects";
import { useUIStore, ValidatedModuleSummary } from "@/lib/store/useUIStore";

interface Props {
  chapter?: string;
  chapterTitle?: string;
  studentName?: string;
  activeModule?: ValidatedModuleSummary;
  onSwitchToAdventure?: () => void;
  onSwitchToMatching?: () => void;
}

interface TileData {
  number: number;
  type: "normal" | "ladder" | "snake" | "quiz" | "coin" | "start" | "finish";
  targetNumber?: number; // untuk tangga / ular
  label?: string;
  colorClass: string;
  icon?: string;
}

interface QuestionItem {
  id: string;
  pertanyaan: string;
  opsi: Array<{ id: string; teks: string; benar: boolean; penjelasan: string }>;
}

export default function UlarTanggaEduGame({
  chapter = "pkn",
  chapterTitle,
  studentName = "Ghandur Fauzan",
  activeModule,
  onSwitchToAdventure,
  onSwitchToMatching,
}: Props) {
  const addPoints = useUIStore((s) => s.addPoints);

  // Posisi Pion (1 s/d 36)
  const [playerPos, setPlayerPos] = useState<number>(1);
  const [rivalPos, setRivalPos] = useState<number>(1);

  // Skor & Status Game
  const [boardScore, setBoardScore] = useState<number>(0);
  const [currentTurn, setCurrentTurn] = useState<"player" | "rival">("player");
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [diceNumber, setDiceNumber] = useState<number>(1);
  const [logMessage, setLogMessage] = useState<string>("Giliranmu! Tekan tombol 'Kocok Dadu' untuk melangkah!");

  // Kuis Interaktif saat kena Tangga / Ular / Petak Kuis
  const [activeQuestion, setActiveQuestion] = useState<QuestionItem | null>(null);
  const [pendingMoveType, setPendingMoveType] = useState<"ladder" | "snake" | "quiz" | null>(null);
  const [pendingTargetTile, setPendingTargetTile] = useState<number | null>(null);
  const [questionFeedback, setQuestionFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Kemenangan Game
  const [winner, setWinner] = useState<"player" | "rival" | null>(null);

  const resolvedTitle = useMemo(() => {
    return activeModule?.title || chapterTitle || chapter || "Evaluasi Pemahaman Materi";
  }, [activeModule, chapterTitle, chapter]);

  const isJawaTopic = useMemo(() => {
    const raw = resolvedTitle.toLowerCase();
    const id = (chapter || activeModule?.id || "").toLowerCase();
    return (
      id.includes("bjawa") ||
      id.includes("aksara") ||
      id.includes("punokawan") ||
      id.includes("pandhawa") ||
      id.includes("unggah") ||
      raw.includes("jawa") ||
      raw.includes("aksara") ||
      raw.includes("wayang") ||
      raw.includes("punokawan") ||
      raw.includes("pandhawa") ||
      raw.includes("unggah")
    );
  }, [resolvedTitle, chapter, activeModule]);

  // Bank Soal Tes Materi Sesuai Topik Aktif
  const questionPool = useMemo<QuestionItem[]>(() => {
    if (resolvedTitle.toLowerCase().includes("aksara") || chapter.includes("aksara")) {
      return [
        {
          id: "q_aks1",
          pertanyaan: "Aksara Jawa 'ꦲ' ing aksara latin diwaca:",
          opsi: [
            { id: "A", teks: "Ha", benar: true, penjelasan: "Bener! 'ꦲ' iku aksara legena sepisanan (Ha)." },
            { id: "B", teks: "Na", benar: false, penjelasan: "Aksara 'Na' wujude ꦤ." },
            { id: "C", teks: "Ca", benar: false, penjelasan: "Aksara 'Ca' wujude ꦕ." },
          ],
        },
        {
          id: "q_aks2",
          pertanyaan: "Sandhangan swara kang ndadekake unine dadi 'u' yaiku:",
          opsi: [
            { id: "A", teks: "Suku ( ..ꦸ )", benar: true, penjelasan: "Pinter! Sandhangan suku marahi unine 'u'." },
            { id: "B", teks: "Wulu ( ..ꦶ )", benar: false, penjelasan: "Wulu marahi unine 'i'." },
            { id: "C", teks: "Taling ( ꦺ.. )", benar: false, penjelasan: "Taling marahi unine 'e'." },
          ],
        },
        {
          id: "q_aks3",
          pertanyaan: "Aksara Jawa 'ꦫ' diwaca apa?",
          opsi: [
            { id: "A", teks: "Ra", benar: true, penjelasan: "Tepat! ꦫ diwaca Ra." },
            { id: "B", teks: "Ka", benar: false, penjelasan: "Ka wujude ꦏ." },
            { id: "C", teks: "Da", benar: false, penjelasan: "Da wujude ꦢ." },
          ],
        },
        {
          id: "q_aks4",
          pertanyaan: "Jumlah aksara Jawa carakan (legena) ana piro?",
          opsi: [
            { id: "A", teks: "20 Aksara", benar: true, penjelasan: "Bener banget! Saka Ha nganti Nga cacahe ana 20." },
            { id: "B", teks: "15 Aksara", benar: false, penjelasan: "Aksara Jawa legena ana 20." },
            { id: "C", teks: "26 Aksara", benar: false, penjelasan: "26 iku aksara alfabet latin." },
          ],
        },
      ];
    }

    if (isJawaTopic) {
      return [
        {
          id: "q_jw1",
          pertanyaan: "Nalika matur marang Bapak utawa Ibu Guru, basa kang bener digunakake yaiku:",
          opsi: [
            { id: "A", teks: "Krama Alus", benar: true, penjelasan: "Leres sanget! Marang guru kudu nganggo krama alus." },
            { id: "B", teks: "Ngoko Lugu", benar: false, penjelasan: "Ngoko lugu kanggo kanca sakelas." },
            { id: "C", teks: "Ngoko Kasar", benar: false, penjelasan: "Ora pareng kasar marang sinten kemawon." },
          ],
        },
        {
          id: "q_jw2",
          pertanyaan: "Tokoh pewayangan Punokawan kang watake wicaksana, sabar, lan dadi pamonging para satria yaiku:",
          opsi: [
            { id: "A", teks: "Kyai Semar", benar: true, penjelasan: "Bener! Semar minangka pralambang kawicaksanan luhur." },
            { id: "B", teks: "Petruk", benar: false, penjelasan: "Petruk duwe julukan Kanthong Bolong." },
            { id: "C", teks: "Bagong", benar: false, penjelasan: "Bagong anake Semar sing paling wuragil." },
          ],
        },
        {
          id: "q_jw3",
          pertanyaan: "Tembung krama kanggo 'mangan' tumrap tiyang sepuh yaiku:",
          opsi: [
            { id: "A", teks: "Dhahar", benar: true, penjelasan: "Leres! Bapak/Ibu Guru saweg dhahar." },
            { id: "B", teks: "Nedha", benar: false, penjelasan: "Nedha kanggo awake dhewe." },
            { id: "C", teks: "Mbadhog", benar: false, penjelasan: "Tembung kasar banget iki." },
          ],
        },
      ];
    }

    // Default: Materi PKn (Pancasila, Gotong Royong, Norma)
    return [
      {
        id: "q_pkn1",
        pertanyaan: "Semboyan persatuan bangsa Indonesia yang bermakna 'Berbeda-beda tetapi tetap satu' adalah:",
        opsi: [
          { id: "A", teks: "Bhinneka Tunggal Ika", benar: true, penjelasan: "Hebat! Merupakan semboyan suci pemersatu bangsa." },
          { id: "B", teks: "Tut Wuri Handayani", benar: false, penjelasan: "Itu semboyan pendidikan nasional." },
          { id: "C", teks: "Garuda Pancasila", benar: false, penjelasan: "Garuda adalah lambang negara." },
        ],
      },
      {
        id: "q_pkn2",
        pertanyaan: "Pohon Beringin adalah simbol sila Pancasila ke-...",
        opsi: [
          { id: "A", teks: "Sila Ke-3 (Persatuan Indonesia)", benar: true, penjelasan: "Tepat sekali! Menggambarkan tempat berteduh dan persatuan." },
          { id: "B", teks: "Sila Ke-2", benar: false, penjelasan: "Sila ke-2 bersimbol Rantai Emas." },
          { id: "C", teks: "Sila Ke-5", benar: false, penjelasan: "Sila ke-5 bersimbol Padi dan Kapas." },
        ],
      },
      {
        id: "q_pkn3",
        pertanyaan: "Perilaku yang mencerminkan nilai gotong royong di lingkungan sekolah adalah:",
        opsi: [
          { id: "A", teks: "Bekerja sama membersihkan kelas saat piket", benar: true, penjelasan: "Pintar! Piket bersama membuat pekerjaan ringan." },
          { id: "B", teks: "Mengerjakan ujian bersama-sama", benar: false, penjelasan: "Saat ujian harus jujur mandiri, bukan gotong royong mencontek." },
          { id: "C", teks: "Membiarkan teman membersihkan halaman sendirian", benar: false, penjelasan: "Itu sikap tidak peduli sesama." },
        ],
      },
      {
        id: "q_pkn4",
        pertanyaan: "Norma yang bersumber dari hati nurani manusia mengenai baik dan buruk disebut norma:",
        opsi: [
          { id: "A", teks: "Kesusilaan", benar: true, penjelasan: "Benar! Norma kesusilaan lahir dari hati nurani." },
          { id: "B", teks: "Hukum", benar: false, penjelasan: "Norma hukum dibuat oleh negara/pemerintah." },
          { id: "C", teks: "Kesopanan", benar: false, penjelasan: "Norma kesopanan bersumber dari adat kebiasaan masyarakat." },
        ],
      },
    ];
  }, [resolvedTitle, chapter, isJawaTopic]);

  // Definisi Peta 36 Petak Papan Ular Tangga
  const boardTiles = useMemo<TileData[]>(() => {
    const tiles: TileData[] = [];
    for (let i = 1; i <= 36; i++) {
      let type: TileData["type"] = "normal";
      let targetNumber: number | undefined;
      let label: string | undefined;
      let icon: string | undefined;
      let colorClass = "from-slate-800 to-slate-900 border-slate-700 text-slate-200";

      if (i === 1) {
        type = "start";
        label = "Mulai";
        icon = "🚩";
        colorClass = "from-emerald-900/80 to-emerald-950 border-emerald-400 text-emerald-200";
      } else if (i === 36) {
        type = "finish";
        label = "Finish Juara";
        icon = "🏆";
        colorClass = "from-amber-600 to-yellow-500 border-yellow-300 text-slate-950 font-black";
      }
      // Tangga Kebaikan / Prestasi
      else if (i === 4) {
        type = "ladder";
        targetNumber = 14;
        label = "Tangga Rajin Belajar";
        icon = "🪜";
        colorClass = "from-teal-900 to-emerald-900 border-teal-400 text-teal-200";
      } else if (i === 9) {
        type = "ladder";
        targetNumber = 22;
        label = "Tangga Tata Krama";
        icon = "🪜";
        colorClass = "from-teal-900 to-emerald-900 border-teal-400 text-teal-200";
      } else if (i === 20) {
        type = "ladder";
        targetNumber = 32;
        label = "Tangga Budi Pekerti";
        icon = "🪜";
        colorClass = "from-teal-900 to-emerald-900 border-teal-400 text-teal-200";
      }
      // Ular Tantangan
      else if (i === 17) {
        type = "snake";
        targetNumber = 7;
        label = "Ular Lupa Tugas";
        icon = "🐍";
        colorClass = "from-rose-950 to-red-900 border-rose-500 text-rose-200";
      } else if (i === 29) {
        type = "snake";
        targetNumber = 16;
        label = "Ular Kurang Cermat";
        icon = "🐍";
        colorClass = "from-rose-950 to-red-900 border-rose-500 text-rose-200";
      } else if (i === 34) {
        type = "snake";
        targetNumber = 23;
        label = "Ular Ceroboh";
        icon = "🐍";
        colorClass = "from-rose-950 to-red-900 border-rose-500 text-rose-200";
      }
      // Petak Kuis Materi
      else if (i === 8 || i === 13 || i === 25 || i === 31) {
        type = "quiz";
        label = "Kuis Tes";
        icon = "❓";
        colorClass = "from-indigo-900 to-indigo-950 border-indigo-400 text-indigo-200";
      }
      // Petak Bonus Koin
      else if (i === 11 || i === 27) {
        type = "coin";
        label = "+15 Koin";
        icon = "⭐";
        colorClass = "from-amber-950 to-yellow-950 border-amber-400 text-amber-200";
      }

      tiles.push({
        number: i,
        type,
        targetNumber,
        label,
        colorClass,
        icon,
      });
    }
    return tiles;
  }, []);

  // Format Grid 6x6 Baris Zig-Zag (Serpentine)
  const gridRows = useMemo(() => {
    const rows: TileData[][] = [];
    // 6 baris: baris 6 (31-36 di atas) sampai baris 1 (1-6 di bawah)
    for (let r = 5; r >= 0; r--) {
      const start = r * 6 + 1;
      const rowSlice = boardTiles.slice(start - 1, start + 5);
      // Baris genap dari kanan ke kiri, ganjil dari kiri ke kanan
      if (r % 2 === 1) {
        rows.push([...rowSlice].reverse());
      } else {
        rows.push(rowSlice);
      }
    }
    return rows;
  }, [boardTiles]);

  // Kocok Dadu Pemain
  const handleRollDice = useCallback(() => {
    if (isRolling || currentTurn !== "player" || winner) return;

    playClickSound();
    setIsRolling(true);
    setLogMessage("Mengocok dadu... 🎲");

    let count = 0;
    const interval = setInterval(() => {
      setDiceNumber(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 8) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceNumber(finalDice);
        setIsRolling(false);
        processPlayerMove(finalDice);
      }
    }, 80);
  }, [isRolling, currentTurn, winner]);

  // Jalankan Langkah Pemain
  const processPlayerMove = useCallback(
    (steps: number) => {
      let nextPos = playerPos + steps;
      if (nextPos >= 36) {
        setPlayerPos(36);
        setWinner("player");
        playBadgeFanfareSound();
        addPoints(50, "Juara 1 Papan Ular Tangga Evaluasi Materi!");
        setLogMessage("🎉 Selamat! Kamu mencapai petak Finish dan menjadi Juara!");
        return;
      }

      setPlayerPos(nextPos);
      playCoinSound();

      const tile = boardTiles.find((t) => t.number === nextPos);
      if (!tile) return;

      // 1. Kena Tangga: Beri Soal Tes Materi!
      if (tile.type === "ladder" && tile.targetNumber) {
        setPendingMoveType("ladder");
        setPendingTargetTile(tile.targetNumber);
        const randomQ = questionPool[Math.floor(Math.random() * questionPool.length)];
        setActiveQuestion(randomQ);
        setLogMessage(`🪜 Kamu menemukan ${tile.label}! Jawab kuis tes ini untuk menaiki tangga!`);
        return;
      }

      // 2. Kena Ular: Beri Soal Tanggap Bencana!
      if (tile.type === "snake" && tile.targetNumber) {
        setPendingMoveType("snake");
        setPendingTargetTile(tile.targetNumber);
        const randomQ = questionPool[Math.floor(Math.random() * questionPool.length)];
        setActiveQuestion(randomQ);
        setLogMessage(`🐍 Waspada! Ada ${tile.label}! Jawab kuis untuk selamat dari gigitan ular!`);
        return;
      }

      // 3. Petak Kuis Biasa
      if (tile.type === "quiz") {
        setPendingMoveType("quiz");
        const randomQ = questionPool[Math.floor(Math.random() * questionPool.length)];
        setActiveQuestion(randomQ);
        setLogMessage("❓ Kamu berada di Petak Kuis! Jawab kuis untuk mendapatkan +20 Poin!");
        return;
      }

      // 4. Petak Koin Bonus
      if (tile.type === "coin") {
        setBoardScore((s) => s + 15);
        addPoints(15, "Bonus petak koin emas ular tangga");
        setLogMessage("⭐ Kamu mendarat di Petak Bintang Bonus! (+15 Koin)");
      } else {
        setLogMessage(`Kamu melangkah ke petak ${nextPos}.`);
      }

      // Oper Giliran ke Lawan (Siti)
      triggerRivalTurn();
    },
    [playerPos, boardTiles, questionPool, addPoints]
  );

  // Giliran Kawan Sekelas Online (Siti)
  const triggerRivalTurn = useCallback(() => {
    setCurrentTurn("rival");
    setTimeout(() => {
      const rivalDice = Math.floor(Math.random() * 6) + 1;
      setDiceNumber(rivalDice);
      setRivalPos((prev) => {
        let nPos = prev + rivalDice;
        if (nPos >= 36) {
          setWinner("rival");
          playOofSound();
          setLogMessage("👧 Siti berhasil mencapai petak finish lebih dulu!");
          return 36;
        }

        const tile = boardTiles.find((t) => t.number === nPos);
        if (tile?.type === "ladder" && tile.targetNumber) {
          setLogMessage(`👧 Siti menaiki ${tile.label} ke petak ${tile.targetNumber}!`);
          return tile.targetNumber;
        } else if (tile?.type === "snake" && tile.targetNumber) {
          setLogMessage(`👧 Siti terpeleset ${tile.label} ke petak ${tile.targetNumber}!`);
          return tile.targetNumber;
        }
        setLogMessage(`👧 Siti melangkah ${rivalDice} petak ke nomor ${nPos}.`);
        return nPos;
      });
      setCurrentTurn("player");
    }, 1800);
  }, [boardTiles]);

  // Jawab Kuis Tes Materi Papan
  const handleAnswerQuestion = useCallback(
    (opsi: { id: string; teks: string; benar: boolean; penjelasan: string }) => {
      if (questionFeedback) return;
      setSelectedOptionId(opsi.id);
      playClickSound();

      if (opsi.benar) {
        playCorrectSound();
        setQuestionFeedback({ isCorrect: true, text: `Hebat! ${opsi.penjelasan}` });
        setBoardScore((s) => s + 25);
        addPoints(25, `Menjawab benar kuis papan ular tangga: ${resolvedTitle}`);

        setTimeout(() => {
          if (pendingMoveType === "ladder" && pendingTargetTile) {
            playSpringJumpSound();
            setPlayerPos(pendingTargetTile);
            setLogMessage(`🚀 Luar biasa! Kamu menaiki tangga ke petak ${pendingTargetTile}!`);
          } else if (pendingMoveType === "snake") {
            setLogMessage("🛡️ Hebat! Kamu berhasil menjawab benar dan selamat dari gigitan ular!");
          } else {
            setLogMessage("⭐ Jawaban benar! Kamu mendapatkan +25 Poin Tes!");
          }
          setActiveQuestion(null);
          setQuestionFeedback(null);
          setSelectedOptionId(null);
          setPendingMoveType(null);
          setPendingTargetTile(null);
          triggerRivalTurn();
        }, 1600);
      } else {
        playWrongSound();
        setQuestionFeedback({ isCorrect: false, text: `Kurang tepat. ${opsi.penjelasan}` });

        setTimeout(() => {
          if (pendingMoveType === "snake" && pendingTargetTile) {
            playOofSound();
            setPlayerPos(pendingTargetTile);
            setLogMessage(`🐍 Sayang sekali, kamu terpeleset turun ke petak ${pendingTargetTile}!`);
          } else if (pendingMoveType === "ladder") {
            setLogMessage("Tangga tidak dapat dinaiki karena jawaban tes belum tepat.");
          }
          setActiveQuestion(null);
          setQuestionFeedback(null);
          setSelectedOptionId(null);
          setPendingMoveType(null);
          setPendingTargetTile(null);
          triggerRivalTurn();
        }, 1800);
      }
    },
    [questionFeedback, pendingMoveType, pendingTargetTile, addPoints, resolvedTitle, triggerRivalTurn]
  );

  // Reset Permainan Ular Tangga
  const handleRestart = useCallback(() => {
    setPlayerPos(1);
    setRivalPos(1);
    setBoardScore(0);
    setCurrentTurn("player");
    setWinner(null);
    setDiceNumber(1);
    setActiveQuestion(null);
    setQuestionFeedback(null);
    setSelectedOptionId(null);
    setLogMessage("Permainan dimulai kembali! Tekan 'Kocok Dadu' untuk melangkah!");
  }, []);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-3 sm:p-5 overflow-y-auto bg-gradient-to-b from-slate-950 via-indigo-950/70 to-slate-950 text-white select-none">
      {/* HEADER INFO EVALUASI */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-indigo-400/40 p-3 sm:p-4 rounded-3xl shadow-xl backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 border border-amber-300 flex items-center justify-center text-2xl shadow-lg">
            🎲
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xs sm:text-sm text-yellow-300 tracking-wide">
                ULAR TANGGA EDUKASI: TES PEMAHAMAN MATERI
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-400/30">
                Papan Kuis 36 Petak
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              Materi Tes: <b className="text-emerald-400">{resolvedTitle}</b>
            </p>
          </div>
        </div>

        {/* Status Skor & Kawan Online */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-2xl border border-yellow-400/40 text-xs font-black text-yellow-300">
            <span>⭐ Skor Tes: {boardScore}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-2xl border border-slate-700 text-xs font-bold text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Vs Siti (Online)</span>
          </div>

          <button
            type="button"
            onClick={handleRestart}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition cursor-pointer"
            title="Mulai Ulang Papan"
          >
            🔄
          </button>
        </div>
      </div>

      {/* PAPAN 36 PETAK (6x6 GRID) */}
      <div className="w-full max-w-2xl my-auto py-2">
        <div className="bg-slate-900/95 border-3 border-indigo-400/60 p-2 sm:p-3 rounded-3xl shadow-2xl backdrop-blur-md space-y-1.5">
          {gridRows.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {row.map((tile) => {
                const isPlayerHere = playerPos === tile.number;
                const isRivalHere = rivalPos === tile.number;

                return (
                  <div
                    key={tile.number}
                    className={`h-14 sm:h-16 rounded-2xl p-1.5 flex flex-col justify-between items-center text-center relative border transition-all duration-300 shadow-md bg-gradient-to-br ${tile.colorClass} ${
                      isPlayerHere ? "ring-3 ring-yellow-400 scale-102 z-10" : ""
                    }`}
                  >
                    {/* Nomor Petak */}
                    <div className="w-full flex items-center justify-between text-[10px] sm:text-xs font-black leading-none opacity-80">
                      <span>#{tile.number}</span>
                      {tile.icon && <span className="text-xs">{tile.icon}</span>}
                    </div>

                    {/* Label Petak Khusus */}
                    {tile.label && (
                      <span className="text-[8px] sm:text-[9px] font-bold line-clamp-1 leading-tight px-1 rounded-md">
                        {tile.label}
                      </span>
                    )}

                    {/* Pion Pemain & Lawan di Atas Petak */}
                    <div className="flex items-center justify-center gap-1">
                      {isPlayerHere && (
                        <span
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-xs shadow-lg animate-bounce"
                          title={`Pion Kamu: ${studentName}`}
                        >
                          🎒
                        </span>
                      )}
                      {isRivalHere && (
                        <span
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-sky-400 border-2 border-white flex items-center justify-center text-xs shadow-lg"
                          title="Pion Kawan: Siti"
                        >
                          👧
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* CONTROLLER DADU & STATUS GILIRAN */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-700/80 p-3 sm:p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 backdrop-blur-md">
        {/* Log Notifikasi Langkah */}
        <div className="flex items-center gap-2.5 text-xs text-slate-200 min-w-0">
          <span className="text-xl">📢</span>
          <p className="font-semibold text-slate-100 truncate">{logMessage}</p>
        </div>

        {/* Kontrol Dadu */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Tampilan Angka Dadu */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-white flex items-center justify-center text-2xl font-black text-slate-950 shadow-lg">
            {isRolling ? "🎲" : diceNumber}
          </div>

          {/* Tombol Kocok */}
          <button
            type="button"
            disabled={isRolling || currentTurn !== "player" || !!winner}
            onClick={handleRollDice}
            className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition flex items-center gap-2 cursor-pointer border-2 border-white ${
              currentTurn === "player" && !isRolling && !winner
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white hover:scale-105 active:scale-95"
                : "bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed opacity-60"
            }`}
          >
            <span>🎲</span>
            <span>{isRolling ? "Mengocok..." : currentTurn === "player" ? "KOCOK DADU" : "Giliran Siti..."}</span>
          </button>
        </div>
      </div>

      {/* POPUP KUIS TES MATERI SAAT KENA TANGGA / ULAR / PETAK KUIS */}
      {activeQuestion && (
        <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900/95 border-3 border-indigo-400 rounded-3xl max-w-md w-full p-5 text-white space-y-3.5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
              <span className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-2xl shadow-inner">
                {pendingMoveType === "ladder" ? "🪜" : pendingMoveType === "snake" ? "🐍" : "❓"}
              </span>
              <div>
                <h4 className="font-black text-sm text-yellow-300">
                  {pendingMoveType === "ladder"
                    ? "Tantangan Tangga Prestasi!"
                    : pendingMoveType === "snake"
                    ? "Tantangan Ular: Uji Cermat!"
                    : "Kuis Tes Pemahaman"}
                </h4>
                <p className="text-[11px] text-slate-300">
                  Jawab dengan tepat untuk menentukan langkah pionmu!
                </p>
              </div>
            </div>

            {/* Pertanyaan */}
            <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
              {activeQuestion.pertanyaan}
            </p>

            {/* Pilihan Opsi */}
            <div className="space-y-2 pt-1">
              {activeQuestion.opsi.map((opsi) => {
                const isPicked = selectedOptionId === opsi.id;
                return (
                  <button
                    key={opsi.id}
                    type="button"
                    onClick={() => handleAnswerQuestion(opsi)}
                    disabled={!!questionFeedback}
                    className={`w-full text-left p-3 rounded-2xl text-xs font-semibold transition border flex items-center justify-between cursor-pointer ${
                      isPicked
                        ? opsi.benar
                          ? "bg-emerald-600/90 border-emerald-400 text-white shadow-lg"
                          : "bg-rose-600/90 border-rose-400 text-white shadow-lg"
                        : "bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900/80 flex items-center justify-center text-[10px] font-bold text-yellow-300">
                        {opsi.id}
                      </span>
                      <span>{opsi.teks}</span>
                    </div>
                    {isPicked && <span>{opsi.benar ? "✓ Benar" : "✗ Salah"}</span>}
                  </button>
                );
              })}
            </div>

            {/* Feedback Jawaban */}
            {questionFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold animate-in zoom-in-95 ${
                  questionFeedback.isCorrect
                    ? "bg-emerald-950/90 border border-emerald-400 text-emerald-200"
                    : "bg-rose-950/90 border border-rose-400 text-rose-200"
                }`}
              >
                {questionFeedback.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL SELEBRASI JUARA FINISH */}
      {winner && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95 text-center">
          <div className="bg-slate-900 border-4 border-yellow-400 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-yellow-400/20 border-3 border-yellow-400 flex items-center justify-center text-4xl mx-auto animate-bounce">
              {winner === "player" ? "🏆" : "🎖️"}
            </div>
            <div>
              <h3 className="font-black text-xl sm:text-2xl text-yellow-300">
                {winner === "player" ? "SELAMAT! KAMU JUARA ULAR TANGGA! 🌟" : "SITI MENCAPAI FINISH DULUAN!"}
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {winner === "player"
                  ? `Kamu berhasil menguasai tes materi ${resolvedTitle} dan menjadi Bintang Kelas!`
                  : `Permainan selesai! Kamu telah mengumpulkan skor tes yang luar biasa!`}
              </p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 flex justify-around text-xs">
              <div>
                <div className="text-slate-400">Total Skor Tes</div>
                <div className="font-black text-yellow-300 text-sm">+{boardScore} Poin</div>
              </div>
              <div>
                <div className="text-slate-400">Peringkat Akhir</div>
                <div className="font-black text-emerald-300 text-sm">
                  {winner === "player" ? "🥇 Juara 1" : "🥈 Runner Up"}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleRestart}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer"
              >
                🔄 Main Papan Ular Tangga Lagi
              </button>
              {onSwitchToAdventure && (
                <button
                  type="button"
                  onClick={onSwitchToAdventure}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                >
                  🏰 Lihat Implementasi di Petualangan 3D
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
