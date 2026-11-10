// frontend/src/components/SusunKataEduGame.tsx
// Game Edukasi: Teka-Teki Susun Huruf & Kata Misteri (Word Scramble / Anagram)

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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

interface WordPuzzle {
  id: string;
  word: string;
  clue: string;
  category: string;
  icon: string;
}

const DEFAULT_PUZZLE: WordPuzzle = {
  id: "w_default",
  word: "PANCASILA",
  clue: "Dasar dan pedoman luhur bangsa Indonesia yang terdiri dari 5 sila",
  category: "Pendidikan Pancasila",
  icon: "🇮🇩",
};

export default function SusunKataEduGame({
  chapter,
  chapterTitle,
  studentName,
  activeModule,
  onFinish,
  onSwitchToAdventure,
  onSwitchToMatching,
}: Props) {
  const addPoints = useUIStore((s) => s.addPoints);

  const puzzles: WordPuzzle[] = useMemo(() => {
    const raw = (chapterTitle || activeModule?.title || chapter || "").toLowerCase();
    const id = (chapter || activeModule?.id || "").toLowerCase();

    // 1. TOPIK ARANE ANAK KEWAN
    if (id.includes("kewan") || raw.includes("kewan")) {
      return [
        { id: "w1", word: "MERI", clue: "Jeneng arane anak bebek yaiku...", category: "Arane Anak Kewan", icon: "🦆" },
        { id: "w2", word: "PEDHET", clue: "Jeneng arane anak sapi yaiku...", category: "Arane Anak Kewan", icon: "🐄" },
        { id: "w3", word: "CEMENG", clue: "Jeneng arane anak kucing yaiku...", category: "Arane Anak Kewan", icon: "🐱" },
        { id: "w4", word: "KUTHUK", clue: "Jeneng arane anak pitik yaiku...", category: "Arane Anak Kewan", icon: "🐥" },
        { id: "w5", word: "CEMPE", clue: "Jeneng arane anak wedhus yaiku...", category: "Arane Anak Kewan", icon: "🐐" },
        { id: "w6", word: "BLEDUG", clue: "Jeneng arane anak gajah yaiku...", category: "Arane Anak Kewan", icon: "🐘" },
        { id: "w7", word: "PRECEL", clue: "Jeneng arane anak kodhok yaiku...", category: "Arane Anak Kewan", icon: "🐸" },
        { id: "w8", word: "BELO", clue: "Jeneng arane anak jaran yaiku...", category: "Arane Anak Kewan", icon: "🐴" },
      ];
    }

    // 2. TOPIK AKSARA JAWA & SANDHANGAN
    if (id.includes("aksara") || raw.includes("aksara") || raw.includes("sandhangan")) {
      return [
        { id: "w1", word: "CARAKAN", clue: "Rong puluh (20) aksara Jawa dhasar diarani aksara...", category: "Aksara Jawa", icon: "📜" },
        { id: "w2", word: "WULU", clue: "Sandhangan swara kang ngowahi vokal dadi swara 'i'...", category: "Sandhangan", icon: "🎵" },
        { id: "w3", word: "SUKU", clue: "Sandhangan swara kang ngowahi vokal dadi swara 'u'...", category: "Sandhangan", icon: "🎵" },
        { id: "w4", word: "PEPET", clue: "Sandhangan swara kang ngowahi dadi swara 'e' kaya sega...", category: "Sandhangan", icon: "🎵" },
        { id: "w5", word: "TALING", clue: "Sandhangan swara kang ngowahi dadi swara 'é' kaya saté...", category: "Sandhangan", icon: "🎵" },
        { id: "w6", word: "LAYAR", clue: "Sandhangan panyigeg wanda kanggo mateni konsonan 'r'...", category: "Sandhangan", icon: "✍️" },
        { id: "w7", word: "CECAK", clue: "Sandhangan panyigeg wanda kanggo mateni konsonan 'ng'...", category: "Sandhangan", icon: "✍️" },
        { id: "w8", word: "PANGKON", clue: "Sandhangan paten kanggo mateni aksara ing pungkasan ukara...", category: "Sandhangan", icon: "🛑" },
      ];
    }

    // 3. TOPIK PANDHAWA & BHARATAYUDHA
    if (id.includes("pandhawa") || raw.includes("pandhawa") || raw.includes("baratayuda") || raw.includes("bharatayudha")) {
      return [
        { id: "w1", word: "PUNTADEWA", clue: "Pembarepe Pandhawa kang getihe putih lan ora tau goroh...", category: "Tokoh Wayang", icon: "👑" },
        { id: "w2", word: "WERKUDARA", clue: "Ksatria Jodhipati kang nduweni pusaka Kuku Pancanaka...", category: "Tokoh Wayang", icon: "💪" },
        { id: "w3", word: "JANAKA", clue: "Ksatria Madukara kang prigel manah pusaka Pasopati...", category: "Tokoh Wayang", icon: "🏹" },
        { id: "w4", word: "NAKULA", clue: "Sedulur kembar Pandhawa kang prigel ing babagan petungan...", category: "Tokoh Wayang", icon: "🌿" },
        { id: "w5", word: "KRESNA", clue: "Ratu Dwarawati pamong ksatria kang nduweni pusaka Cakra...", category: "Tokoh Wayang", icon: "🪷" },
        { id: "w6", word: "KSATRIA", clue: "Pejuang luhur kang tansah mbelani bebener lan netepi janji...", category: "Nilai Luhur", icon: "🛡️" },
      ];
    }

    // 4. TOPIK GEGURITAN (PUISI BASA JAWA)
    if (id.includes("geguritan") || raw.includes("geguritan") || raw.includes("puisi")) {
      return [
        { id: "w1", word: "GEGURITAN", clue: "Puisi Jawa gagrag anyar kang ora kaiket dening paugeran tartamtu...", category: "Sastra Jawa", icon: "📜" },
        { id: "w2", word: "PURWAKANTHI", clue: "Runtuting swara vokal utawa sastra ing geguritan diarani...", category: "Unsur Geguritan", icon: "🎵" },
        { id: "w3", word: "MENTES", clue: "Basane geguritan iku endah lan nduweni teges kang jero utawa...", category: "Sifat Basa", icon: "💡" },
        { id: "w4", word: "GATRA", clue: "Cacahing larik ing sajroning geguritan diarani guru...", category: "Paugeran", icon: "✍️" },
        { id: "w5", word: "WILANGAN", clue: "Cacahing wanda utawa suku kata ing saben larik diarani guru...", category: "Paugeran", icon: "🔢" },
        { id: "w6", word: "AMANAT", clue: "Pesen becik kang kinandhut ing geguritan kanggo para pamaca...", category: "Unsur Batin", icon: "🎁" },
      ];
    }

    // 5. TOPIK BASA KRAMA & UNGGAH-UNGGUH
    if (id.includes("unggah") || raw.includes("unggah") || raw.includes("krama") || raw.includes("tata krama")) {
      return [
        { id: "w1", word: "DHAHAR", clue: "Basa krama alus saka tembung mangan kagem Bapak/Ibu Guru...", category: "Basa Krama", icon: "🍚" },
        { id: "w2", word: "SARE", clue: "Basa krama alus saka tembung turu kagem tiyang sepuh...", category: "Basa Krama", icon: "🛏️" },
        { id: "w3", word: "TINDAK", clue: "Basa krama alus saka tembung lunga kagem Pak Guru...", category: "Basa Krama", icon: "🚶" },
        { id: "w4", word: "MUNDHUT", clue: "Basa krama alus saka tembung tuku kagem tiyang sepuh...", category: "Basa Krama", icon: "🛍️" },
        { id: "w5", word: "MIRSANI", clue: "Basa krama alus saka tembung ndeleng utawa ndelok...", category: "Basa Krama", icon: "👀" },
        { id: "w6", word: "DALEM", clue: "Basa krama alus saka tembung omah kagem sesepuh...", category: "Basa Krama", icon: "🏠" },
        { id: "w7", word: "ASMA", clue: "Basa krama alus saka tembung jeneng kagem tiyang sepuh...", category: "Basa Krama", icon: "🏷️" },
      ];
    }

    // 4. TOPIK PANCASILA & GOTONG ROYONG (DEFAULT)
    return [
      { id: "w1", word: "PERSATUAN", clue: "Bunyi sila ke-3 Pancasila adalah: ... Indonesia", category: "Pancasila", icon: "🌳" },
      { id: "w2", word: "BERINGIN", clue: "Pohon besar dan rindang lambang sila ke-3 Pancasila...", category: "Pancasila", icon: "🌳" },
      { id: "w3", word: "GOTONG", clue: "Bekerja bersama-sama secara sukarela: ... royong", category: "Budi Pekerti", icon: "🤝" },
      { id: "w4", word: "RUKUN", clue: "Hidup damai saling menghormati dan tidak bertengkar...", category: "Budi Pekerti", icon: "❤️" },
      { id: "w5", word: "BHINNEKA", clue: "Semboyan keragaman bangsa: ... Tunggal Ika", category: "Wawasan Kebangsaan", icon: "🇮🇩" },
      { id: "w6", word: "TOLERANSI", clue: "Sikap saling menghormati perbedaan suku dan agama...", category: "Karakter", icon: "⭐" },
    ];
  }, [chapterTitle, chapter, activeModule?.title, activeModule?.id]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentPuzzle: WordPuzzle = puzzles[currentIndex] ?? puzzles[0] ?? DEFAULT_PUZZLE;

  const [availableLetters, setAvailableLetters] = useState<Array<{ id: number; char: string; used: boolean }>>([]);
  const [placedLetters, setPlacedLetters] = useState<Array<{ letterId: number; char: string }>>([]);

  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [isWrongShake, setIsWrongShake] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isAllCompleted, setIsAllCompleted] = useState(false);

  const initPuzzle = useCallback((puzzle: WordPuzzle) => {
    const letters = puzzle.word.split("");
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    if (letters.length > 2 && shuffled.join("") === puzzle.word) {
      shuffled.reverse();
    }
    setAvailableLetters(shuffled.map((char, i) => ({ id: i, char, used: false })));
    setPlacedLetters([]);
    setIsAnswerCorrect(false);
    setIsWrongShake(false);
  }, []);

  useEffect(() => {
    if (currentPuzzle) {
      initPuzzle(currentPuzzle);
    }
  }, [currentPuzzle, initPuzzle]);

  const handleSelectLetter = (letterObj: { id: number; char: string; used: boolean }) => {
    if (letterObj.used || isAnswerCorrect) return;
    playClickSound();

    const nextPlaced = [...placedLetters, { letterId: letterObj.id, char: letterObj.char }];
    setPlacedLetters(nextPlaced);

    setAvailableLetters((prev) =>
      prev.map((l) => (l.id === letterObj.id ? { ...l, used: true } : l))
    );

    if (nextPlaced.length === currentPuzzle.word.length) {
      const constructedWord = nextPlaced.map((p) => p.char).join("");
      if (constructedWord === currentPuzzle.word) {
        playCorrectSound();
        playCoinSound();
        setIsAnswerCorrect(true);
        const reward = 20 * combo;
        setGameScore((prev) => prev + reward);
        addPoints(reward, `Hebat! Kata "${currentPuzzle.word}" berhasil disusun (+${reward} ⭐)`);
        setCombo((prev) => Math.min(prev + 1, 4));
      } else {
        playWrongSound();
        setIsWrongShake(true);
        setTimeout(() => setIsWrongShake(false), 600);
      }
    }
  };

  const handleRemoveLetter = (index: number) => {
    if (isAnswerCorrect) return;
    playClickSound();

    const target = placedLetters[index];
    if (!target) return;

    setPlacedLetters((prev) => prev.filter((_, i) => i !== index));
    setAvailableLetters((prev) =>
      prev.map((l) => (l.id === target.letterId ? { ...l, used: false } : l))
    );
  };

  const handleUseHint = () => {
    if (isAnswerCorrect) return;
    playClickSound();

    const targetWord = currentPuzzle.word;
    const currentLength = placedLetters.length;

    if (currentLength < targetWord.length) {
      const nextCharNeeded = targetWord[currentLength];
      const candidate = availableLetters.find((l) => !l.used && l.char === nextCharNeeded);
      if (candidate) {
        handleSelectLetter(candidate);
        setHintsUsed((prev) => prev + 1);
      }
    }
  };

  const handleClear = () => {
    playClickSound();
    initPuzzle(currentPuzzle);
  };

  const handleNextWord = () => {
    playClickSound();
    if (currentIndex + 1 < puzzles.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsAllCompleted(true);
      playBadgeFanfareSound();
      if (onFinish) onFinish(gameScore);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 bg-slate-900/95 border-3 border-amber-400 rounded-3xl shadow-2xl text-white space-y-5">
      {/* HEADER GAME */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-inner">
            🔤
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
              {currentPuzzle.category}
            </span>
            <h3 className="font-black text-base sm:text-lg text-yellow-300">
              Teka-Teki Susun Huruf &amp; Kata
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-yellow-400/40 text-xs font-bold text-yellow-300">
            ⭐ {gameScore} Poin
          </div>
          {combo > 1 && (
            <div className="bg-amber-500/20 text-amber-300 border border-amber-400/50 px-2.5 py-1 rounded-xl text-xs font-black animate-pulse">
              🔥 {combo}x Combo!
            </div>
          )}
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-700 font-bold">
            Kata {currentIndex + 1}/{puzzles.length}
          </span>
        </div>
      </div>

      {isAllCompleted ? (
        <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-yellow-400/20 border-3 border-yellow-400 flex items-center justify-center text-5xl shadow-2xl animate-bounce">
            🏆
          </div>
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-yellow-300">
              HEBAT! SEMUA KATA BERHASIL DISUSUN! 🎉
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Kamu telah menguasai kosa kata dan istilah materi <b>{activeModule?.title || chapterTitle}</b> dengan sempurna!
            </p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 max-w-sm mx-auto flex justify-around text-xs">
            <div>
              <div className="text-slate-400">Total Skor Diraih</div>
              <div className="font-black text-yellow-300 text-base">+{gameScore} Poin ⭐</div>
            </div>
            <div>
              <div className="text-slate-400">Kata Tuntas</div>
              <div className="font-black text-emerald-300 text-base">{puzzles.length}/{puzzles.length} Kata</div>
            </div>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCurrentIndex(0);
                setIsAllCompleted(false);
                setGameScore(0);
                setCombo(1);
              }}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition cursor-pointer"
            >
              🔄 Main Ulang Lagi
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
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-800/80 p-4 rounded-2xl border-2 border-indigo-400/40 text-center space-y-1.5">
            <div className="text-4xl mb-1">{currentPuzzle.icon}</div>
            <div className="text-xs text-indigo-300 font-extrabold uppercase tracking-wide">
              Petunjuk Soal:
            </div>
            <p className="text-sm sm:text-base font-black text-yellow-200 max-w-md mx-auto leading-relaxed">
              "{currentPuzzle.clue}"
            </p>
            <div className="text-[11px] text-slate-400 font-medium">
              Panjang Kata: <b>{currentPuzzle.word.length} Huruf</b>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 text-center">
              Susunan Jawabanmu: (Klik huruf untuk membatalkan)
            </div>
            <div className={`flex flex-wrap items-center justify-center gap-2 py-2 ${isWrongShake ? "animate-shake" : ""}`}>
              {Array.from({ length: currentPuzzle.word.length }).map((_, idx) => {
                const placed = placedLetters[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => placed && handleRemoveLetter(idx)}
                    className={`w-11 h-12 sm:w-13 sm:h-14 rounded-2xl font-black text-lg sm:text-2xl flex items-center justify-center border-3 transition-all cursor-pointer ${
                      isAnswerCorrect
                        ? "bg-emerald-600 border-emerald-300 text-white scale-105 shadow-lg shadow-emerald-500/30"
                        : placed
                        ? "bg-amber-400 border-yellow-200 text-slate-950 shadow-md hover:scale-105 active:scale-95"
                        : "bg-slate-800/80 border-dashed border-slate-600 text-slate-500"
                    }`}
                  >
                    {placed ? placed.char : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {isAnswerCorrect && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 text-center space-y-2 animate-in zoom-in-95">
              <div className="text-sm sm:text-base font-black">
                🎉 TEPAT SEKALI! JAWABAN BENAR: <u>{currentPuzzle.word}</u> (+{20 * combo} Poin)
              </div>
              <button
                type="button"
                onClick={handleNextWord}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs sm:text-sm shadow-md transition hover:scale-105 cursor-pointer"
              >
                Lanjut Kata Berikutnya ➡️
              </button>
            </div>
          )}

          {!isAnswerCorrect && (
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-bold text-slate-400 text-center">
                Pilih Huruf untuk Menyusun Kata:
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                {availableLetters.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleSelectLetter(l)}
                    disabled={l.used}
                    className={`w-11 h-12 sm:w-13 sm:h-14 rounded-2xl font-black text-lg sm:text-2xl transition-all border-2 cursor-pointer shadow-md ${
                      l.used
                        ? "bg-slate-800/40 border-slate-700/40 text-slate-600 opacity-40 cursor-not-allowed scale-90"
                        : "bg-gradient-to-b from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 border-indigo-300 text-white hover:scale-110 active:scale-95 shadow-indigo-500/20"
                    }`}
                  >
                    {l.char}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleUseHint}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 border border-yellow-400/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>💡</span>
                  <span>Bantuan Huruf</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>🔄</span>
                  <span>Ulangi Pilihan</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
