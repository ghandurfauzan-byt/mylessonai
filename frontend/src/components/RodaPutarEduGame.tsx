// frontend/src/components/RodaPutarEduGame.tsx
// Game Edukasi: Roda Putar Cerdas & Tantangan Bintang (Spin the Wheel Quiz)

"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  playClickSound,
  playCorrectSound,
  playWrongSound,
  playCoinSound,
  playBadgeFanfareSound,
} from "@/lib/soundEffects";
import { useUIStore, ValidatedModuleSummary } from "@/lib/store/useUIStore";

interface Props {
  chapter?: string;
  chapterTitle?: string;
  studentName?: string;
  activeModule?: ValidatedModuleSummary;
  onFinish?: (score: number) => void;
  onSwitchToAdventure?: () => void;
  onSwitchToMatching?: () => void;
}

interface WheelSegment {
  id: number;
  label: string;
  color: string;
  icon: string;
  multiplier: number;
}

const SEGMENTS: WheelSegment[] = [
  { id: 1, label: "Tantangan x2", color: "#f59e0b", icon: "⭐", multiplier: 2 },
  { id: 2, label: "Koin Emas +30", color: "#10b981", icon: "🪙", multiplier: 1 },
  { id: 3, label: "Tantangan x3", color: "#3b82f6", icon: "🌟", multiplier: 3 },
  { id: 4, label: "Kilat Bintang", color: "#ec4899", icon: "⚡", multiplier: 2 },
  { id: 5, label: "Hadiah Super", color: "#8b5cf6", icon: "🎁", multiplier: 2 },
  { id: 6, label: "Tantangan x2", color: "#06b6d4", icon: "🎯", multiplier: 2 },
  { id: 7, label: "Tanya Guru", color: "#14b8a6", icon: "👨‍🏫", multiplier: 2 },
  { id: 8, label: "Juara Bintang", color: "#ef4444", icon: "🏆", multiplier: 3 },
];

export default function RodaPutarEduGame({
  chapter,
  chapterTitle,
  studentName,
  activeModule,
  onFinish,
  onSwitchToAdventure,
  onSwitchToMatching,
}: Props) {
  const addPoints = useUIStore((s) => s.addPoints);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<WheelSegment | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [spinsLeft, setSpinsLeft] = useState(5);
  const [isGameCompleted, setIsGameCompleted] = useState(false);

  // Bank Soal Tantangan Materi
  const questions = useMemo(() => {
    // 1. Ekstrak Soal dari Modul Baru yang Ditarik dari API Kemendikbud jika ada
    const quizMap = (activeModule?.quizQuestions as any);
    if (quizMap && (quizMap[1]?.length || quizMap[2]?.length || quizMap[3]?.length)) {
      const dyn: Array<{ q: string; opts: string[]; correct: number; exp: string }> = [];
      [1, 2, 3].forEach((lvl) => {
        const list = quizMap[lvl] || [];
        list.forEach((q: any) => {
          const promptText = q.pertanyaan || q.question;
          const optionsList = q.opsi || q.options;
          if (promptText && Array.isArray(optionsList) && optionsList.length >= 2) {
            const opts = optionsList.map((o: any) => (typeof o === "string" ? o : o.teks || o.text || String(o)));
            const correct = typeof q.correctOption === "number" ? q.correctOption : 0;
            const exp = q.hint || "Bagus sekali! Jawabanmu tepat.";
            dyn.push({ q: promptText, opts, correct, exp });
          }
        });
      });
      if (dyn.length >= 3) return dyn;
    }

    const raw = (chapterTitle || activeModule?.title || chapter || "").toLowerCase();
    const id = (chapter || activeModule?.id || "").toLowerCase();

    if (id.includes("kewan") || raw.includes("kewan")) {
      return [
        { q: "Anak bebek ing basa Jawa diarani apa?", opts: ["Meri", "Pedhet", "Cemeng", "Kuthuk"], correct: 0, exp: "Bener! Anak bebek diarani meri." },
        { q: "Jeneng arane anak sapi yaiku...", opts: ["Gudel", "Pedhet", "Belo", "Precel"], correct: 1, exp: "Tepat! Anak sapi diarani pedhet." },
        { q: "Kewan kang anake diarani 'bledug' yaiku...", opts: ["Macan", "Wedhus", "Gajah", "Pitik"], correct: 2, exp: "Pinter! Anak gajah diarani bledug." },
        { q: "Anak kucing diarani cemeng, dene anak wedhus diarani...", opts: ["Cempe", "Meri", "Kuthuk", "Belo"], correct: 0, exp: "Leres! Anak wedhus arane cempe." },
      ];
    }

    if (id.includes("aksara") || raw.includes("aksara")) {
      return [
        { q: "Aksara Jawa legena wutuh cacahe ana pira?", opts: ["15", "18", "20", "24"], correct: 2, exp: "Leres! Cacahe ana 20 aksara legena." },
        { q: "Sandhangan swara kanggo ngowahi vokal dadi 'i' yaiku...", opts: ["Suku", "Wulu", "Pepet", "Taling"], correct: 1, exp: "Bener! Wulu ngowahi dadi swara 'i'." },
        { id: "q4", q: "Sandhangan panyigeg aksara 'r' yaiku...", opts: ["Cecak", "Layar", "Wignyan", "Pangkon"], correct: 1, exp: "Pinter! Layar kanggo sigeg 'r'." },
      ];
    }

    if (id.includes("geguritan") || raw.includes("geguritan") || raw.includes("puisi")) {
      return [
        { q: "Puisi basa Jawa gagrag anyar kang ora kaiket dening paugeran diarani...", opts: ["Tembang Macapat", "Geguritan", "Parikan", "Wangsalan"], correct: 1, exp: "Leres! Geguritan gagrag anyar bebas ora kaiket paugeran macapat." },
        { q: "Runtuting swara vokal utawa konsonan ing geguritan diarani...", opts: ["Purwakanthi", "Diksi", "Amanat", "Guru Gatra"], correct: 0, exp: "Tepat! Purwakanthi yaiku runtuting swara utawa sastra." },
        { q: "Cacahing larik ing sajroning geguritan diarani...", opts: ["Guru Wilangan", "Guru Lagu", "Guru Gatra", "Pada"], correct: 2, exp: "Pinter! Guru gatra yaiku cacahing larik." },
        { q: "Pesen becik kang kinandhut ing geguritan kanggo pamaca diarani...", opts: ["Tema", "Diksi", "Amanat", "Latar"], correct: 2, exp: "Bagus! Amanat yaiku pesen luhur puitis." },
      ];
    }

    if (id.includes("unggah") || raw.includes("unggah") || raw.includes("krama") || raw.includes("tata krama")) {
      return [
        { q: "Basa krama alus kagem Bapak/Ibu saka tembung 'mangan' yaiku...", opts: ["Nedha", "Dhahar", "Ngunjuk", "Turu"], correct: 1, exp: "Leres! Dhahar kagem tiyang sepuh utawa guru." },
        { q: "Basa krama alus saka tembung 'turu' yaiku...", opts: ["Tilem", "Sare", "Mlebu", "Tindak"], correct: 1, exp: "Tepat! Sare kagem tiyang sepuh, tilem kanggo awake dhewe." },
        { q: "Nalika matur marang Bapak utawa Ibu Guru, basa kang trep yaiku...", opts: ["Basa Ngoko Lugu", "Basa Krama Alus", "Basa Gaul", "Basa Kasar"], correct: 1, exp: "Pinter! Marang guru wajib nggunakake Basa Krama Alus." },
        { q: "Tembung 'lunga' yen dikramakake alus dadi...", opts: ["Kesah", "Tindak", "Mlayu", "Rawuh"], correct: 1, exp: "Bagus! Bapak/Ibu Guru tindak dhateng kantor." },
      ];
    }

    return [
      { q: "Pohon beringin merupakan lambang dari sila ke-...", opts: ["Sila 1", "Sila 2", "Sila 3", "Sila 4"], correct: 2, exp: "Tepat! Pohon beringin adalah lambang Sila ke-3 Persatuan Indonesia." },
      { q: "Semboyan persatuan bangsa Indonesia adalah...", opts: ["Bhinneka Tunggal Ika", "Tut Wuri Handayani", "Ing Ngarso Sung Tulodo", "Pancasila Sakti"], correct: 0, exp: "Bagus! Bhinneka Tunggal Ika bermakna berbeda-beda tetapi tetap satu." },
      { q: "Sikap gotong royong di lingkungan kelas tercermin dari...", opts: ["Mengerjakan PR teman", "Melaksanakan piket kelas kompak", "Bermain game sendiri", "Menonton teman bekerja"], correct: 1, exp: "Hebat! Piket kelas bersama adalah wujud nyata gotong royong." },
      { q: "Pepatah 'Berat sama dipikul, ringan sama dijinjing' mengajarkan...", opts: ["Bekerja sama saling membantu", "Memilih tugas yang ringan", "Menyerahkan tugas ke orang lain", "Bekerja sendiri"], correct: 0, exp: "Tepat sekali! Kebersamaan meringankan pekerjaan berat." },
    ];
  }, [chapterTitle, chapter, activeModule?.title, activeModule?.id]);

  const [activeQuestion, setActiveQuestion] = useState<{ q: string; opts: string[]; correct: number; exp: string } | null>(null);
  const [answeredState, setAnsweredState] = useState<{ isAnswered: boolean; isCorrect: boolean } | null>(null);

  // Gambar Roda Putar di Canvas
  const drawWheel = useCallback((currentAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 12;
    const arc = (2 * Math.PI) / SEGMENTS.length;

    ctx.clearRect(0, 0, size, size);

    // Gambar segmen
    SEGMENTS.forEach((seg, i) => {
      const angle = currentAngle + i * arc;
      ctx.beginPath();
      ctx.fillStyle = seg.color;
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.lineTo(center, center);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Label teks & ikon
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 4;
      ctx.fillText(`${seg.icon} ${seg.label}`, radius - 16, 5);
      ctx.restore();
    });

    // Lingkaran tengah & poros roda
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#fbbf24";
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎡", center, center);
  }, []);

  useEffect(() => {
    drawWheel(rotation);
  }, [rotation, drawWheel]);

  // Putar Roda Cerdas
  const handleSpin = () => {
    if (isSpinning || spinsLeft <= 0 || activeQuestion) return;
    playClickSound();
    setIsSpinning(true);
    setSelectedSegment(null);
    setAnsweredState(null);

    const spinRotations = 4 + Math.random() * 4; // 4 - 8 putaran
    const targetAngle = rotation + spinRotations * 2 * Math.PI + Math.random() * ((2 * Math.PI) / SEGMENTS.length);
    const duration = 3500;
    const startTime = performance.now();
    const startAngle = rotation;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const curAngle = startAngle + (targetAngle - startAngle) * easeProgress;
      setRotation(curAngle);
      drawWheel(curAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setSpinsLeft((prev) => prev - 1);

        // Hitung segmen yang berhenti di panah kanan (angle 0)
        const normalized = (curAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const arc = (2 * Math.PI) / SEGMENTS.length;
        // Panah di posisi atas (-PI/2)
        const pointerAngle = (3 * Math.PI) / 2;
        const diff = (pointerAngle - normalized + 2 * Math.PI) % (2 * Math.PI);
        const winningIndex = Math.floor(diff / arc) % SEGMENTS.length;
        const winner: WheelSegment = SEGMENTS[winningIndex] ?? SEGMENTS[0]!;

        setSelectedSegment(winner);
        playCoinSound();

        // Jika kena koin langsung tambah poin, jika tantangan/soal buka kuis
        if (winner.label.includes("Koin Emas")) {
          const reward = 30;
          setGameScore((prev) => prev + reward);
          addPoints(reward, "Hebat! Mendapatkan Koin Emas dari Roda Keberuntungan (+30 🪙)");
        } else {
          // Buka kuis tantangan materi
          const randomQ = questions[Math.floor(Math.random() * questions.length)] ?? questions[0] ?? null;
          setActiveQuestion(randomQ);
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const handleAnswerQuestion = (optIdx: number) => {
    if (!activeQuestion || answeredState?.isAnswered) return;
    playClickSound();

    const isCorrect = optIdx === activeQuestion.correct;
    setAnsweredState({ isAnswered: true, isCorrect });

    if (isCorrect) {
      playCorrectSound();
      playCoinSound();
      const mult = selectedSegment?.multiplier || 2;
      const reward = 25 * mult;
      setGameScore((prev) => prev + reward);
      addPoints(reward, `Keren! Berhasil menjawab tantangan roda (+${reward} ⭐)`);
    } else {
      playWrongSound();
    }
  };

  const handleCloseQuestion = () => {
    playClickSound();
    setActiveQuestion(null);
    setAnsweredState(null);
    if (spinsLeft <= 0) {
      setIsGameCompleted(true);
      playBadgeFanfareSound();
      if (onFinish) onFinish(gameScore);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 bg-slate-900/95 border-3 border-amber-400 rounded-3xl shadow-2xl text-white space-y-5 text-center">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow-inner">
            🎡
          </span>
          <div className="text-left">
            <h3 className="font-black text-sm sm:text-base text-yellow-300">
              Roda Putar Cerdas &amp; Tantangan Bintang
            </h3>
            <p className="text-[11px] text-slate-300">
              Putar roda dan taklukkan tantangan materi!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black bg-slate-800 text-yellow-300 border border-yellow-400/40 px-3 py-1.5 rounded-xl">
            ⭐ {gameScore} Poin
          </span>
          <span className="text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-xl">
            🎟️ {spinsLeft}x Putar
          </span>
        </div>
      </div>

      {isGameCompleted ? (
        <div className="py-8 space-y-4 animate-in zoom-in-95">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-yellow-400/20 border-3 border-yellow-400 flex items-center justify-center text-4xl shadow-xl animate-bounce">
            🏆
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-yellow-300">
              SESI RODA PUTAR SELESAI! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              Kamu berhasil mengumpulkan total <b>+{gameScore} Poin Bintang</b>!
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSpinsLeft(5);
                setGameScore(0);
                setIsGameCompleted(false);
              }}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition cursor-pointer"
            >
              🔄 Putar Ulang 5x Lagi
            </button>
            {onSwitchToAdventure && (
              <button
                type="button"
                onClick={onSwitchToAdventure}
                className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg transition cursor-pointer"
              >
                🏰 Coba Petualangan 3D
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ARENA RODA PUTAR CANVAS & POINTER */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto my-2 flex items-center justify-center">
            {/* Panah Penunjuk Roda (Atas) */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 text-3xl filter drop-shadow-md animate-pulse">
              🔻
            </div>

            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="w-full h-full rounded-full shadow-2xl"
            />
          </div>

          {/* HASIL SEGMEN */}
          {selectedSegment && !activeQuestion && (
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-yellow-400 text-xs sm:text-sm font-bold text-yellow-200 animate-in zoom-in-95">
              🎉 Roda berhenti di: <b>{selectedSegment.icon} {selectedSegment.label}</b>!
            </div>
          )}

          {/* TOMBOL PUTAR SEKARANG */}
          <div>
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning || spinsLeft <= 0 || Boolean(activeQuestion)}
              className={`py-3.5 px-8 rounded-full font-black text-sm sm:text-base border-4 border-white shadow-2xl transition-all cursor-pointer ${
                isSpinning || spinsLeft <= 0
                  ? "bg-slate-700 text-slate-400 opacity-60 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 hover:from-amber-500 hover:to-orange-600 text-white hover:scale-105 active:scale-95 shadow-orange-500/30"
              }`}
            >
              {isSpinning ? "🎡 Roda Sedang Berputar..." : `🚀 PUTAR RODA SEKARANG (${spinsLeft}x Lagi)`}
            </button>
          </div>

          {/* MODAL KUIS TANTANGAN MATERI KETIKA RODA BERHENTI */}
          {activeQuestion && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900 border-3 border-amber-400 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl text-left">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <span className="text-xs font-black text-yellow-300 uppercase tracking-wide">
                    🎯 Tantangan Soal Materi (Poin x{selectedSegment?.multiplier || 2})
                  </span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                    Roda Keberuntungan
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-sm sm:text-base text-yellow-100">
                    {activeQuestion.q}
                  </h4>
                </div>

                <div className="space-y-2">
                  {activeQuestion.opts.map((opt, oIdx) => {
                    const isSelected = answeredState?.isAnswered;
                    const isCorrectOpt = oIdx === activeQuestion.correct;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleAnswerQuestion(oIdx)}
                        disabled={answeredState?.isAnswered}
                        className={`w-full p-3 rounded-2xl border-2 text-xs font-bold text-left transition-all cursor-pointer ${
                          isSelected
                            ? isCorrectOpt
                              ? "bg-emerald-600 border-emerald-400 text-white font-black"
                              : "bg-slate-800/60 border-slate-700 text-slate-400 opacity-60"
                            : "bg-slate-800 hover:bg-slate-750 border-slate-600 hover:border-yellow-400 text-slate-200 hover:scale-[1.01]"
                        }`}
                      >
                        <span className="inline-block w-6 font-mono text-amber-300 font-black">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {answeredState && (
                  <div className={`p-3 rounded-2xl text-xs font-bold text-center space-y-2 ${
                    answeredState.isCorrect
                      ? "bg-emerald-500/20 border border-emerald-400 text-emerald-300"
                      : "bg-rose-500/20 border border-rose-400 text-rose-300"
                  }`}>
                    <p>{activeQuestion.exp}</p>
                    <button
                      type="button"
                      onClick={handleCloseQuestion}
                      className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition cursor-pointer"
                    >
                      Lanjut Main 🎡
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
