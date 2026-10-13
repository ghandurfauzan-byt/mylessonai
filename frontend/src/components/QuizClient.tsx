import { ErrorBanner, ListSkeleton } from "@/components/AsyncStateBanners";
import { useQuizQuestionsQuery } from "@/hooks/useQuizQuery";
import {
  playClickSound,
  playCoinSound,
  playCorrectSound,
  playWrongSound,
} from "@/lib/soundEffects";
import { useUIStore } from "@/lib/store/useUIStore";
import type { Question } from "@shared/schema";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function QuizClient({ initialQuestions }: { initialQuestions?: Question[] }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedLevel = Number(searchParams.get("level") || "1");
  const initialLevel = requestedLevel >= 1 && requestedLevel <= 3 ? requestedLevel : 1;
  const chapterParam = searchParams.get("chapter");

  const [level, setLevel] = useState(initialLevel);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeValidatedModule = useUIStore((s) => s.activeValidatedModule);
  const validatedQuestions = activeValidatedModule?.quizQuestions?.[level];

  const {
    data: apiQuestions,
    isLoading: isApiLoading,
    isError,
    error,
    refetch,
  } = useQuizQuestionsQuery(level, level === 1 ? initialQuestions : undefined);

  const questions =
    validatedQuestions && validatedQuestions.length > 0 ? validatedQuestions : apiQuestions;
  const isLoading = (!questions || questions.length === 0) && isApiLoading;

  const selectedOption = useUIStore((s) => s.quizDraft.selectedOption);
  const showHint = useUIStore((s) => s.quizDraft.showHint);
  const setQuizSelectedOption = useUIStore((s) => s.setQuizSelectedOption);
  const setQuizShowHint = useUIStore((s) => s.setQuizShowHint);
  const resetQuizDraft = useUIStore((s) => s.resetQuizDraft);

  const totalPoints = useUIStore((state) => state.totalPoints);
  const addPoints = useUIStore((state) => state.addPoints);
  const completeDailyMission = useUIStore((state) => state.completeDailyMission);
  const switchChapterMissions = useUIStore((state) => state.switchChapterMissions);

  useEffect(() => {
    if (chapterParam) {
      switchChapterMissions(chapterParam);
    }
  }, [chapterParam, switchChapterMissions]);

  function handleSubmitAnswer() {
    if (!questions || isSubmitting) return;
    if (selectedOption === null) {
      playWrongSound();
      setFeedback("Pilih jawabanmu dulu ya! 😊");
      return;
    }

    const currentQuestion = questions[questionIndex];
    if (!currentQuestion) return;
    const isCorrect = selectedOption === currentQuestion.correctOption;

    setIsSubmitting(true);

    if (isCorrect) {
      playCorrectSound();
      setTimeout(() => playCoinSound(), 200);
      setAnswerStatus("correct");
      addPoints(10); // Menambahkan 10 Poin Prestasi
    } else {
      playWrongSound();
      setAnswerStatus("wrong");
    }

    setTimeout(
      () => {
        setAnswerStatus("idle");
        setIsSubmitting(false);
        setFeedback(null);
        resetQuizDraft();

        const nextIndex = questionIndex + 1;
        if (nextIndex >= questions.length) {
          if (level === 1) {
            completeDailyMission("quizLevel1");
            addPoints(10, "Hebat! Kuis Level 1 Tuntas! +10 Poin 🎮");
          } else if (level === 2) {
            completeDailyMission("quizLevel2");
            addPoints(20, "Luar Biasa! Kuis Level 2 Tuntas! +20 Poin ⚡");
          } else if (level === 3) {
            completeDailyMission("quizLevel3");
            completeDailyMission("completedQuiz");
            addPoints(30, "Juara! Kuis Level 3 & Seluruh Kuis Tuntas! +30 Poin 🏆");
          }

          if (level < 3) {
            setQuestionIndex(0);
            setLevel(level + 1);
          } else {
            alert(
              `Wah, kamu Hebat Sekali! 🎉 Seluruh 3 Level Kuis Berhasil Dituntaskan! Kamu sekarang punya ${
                totalPoints + (isCorrect ? 10 : 0) + 30
              } Poin! 🌟`
            );
            navigate(
              chapterParam
                ? `/dashboard/pelajar?chapter=${encodeURIComponent(chapterParam)}`
                : "/dashboard/pelajar"
            );
          }
        } else {
          setQuestionIndex(nextIndex);
        }
      },
      isCorrect ? 1400 : 1600
    );
  }

  function handleExit() {
    if (confirm("Mau keluar dari game kuis ini? Nanti koinnya ngga nambah lho!"))
      navigate(
        chapterParam
          ? `/dashboard/pelajar?chapter=${encodeURIComponent(chapterParam)}`
          : "/dashboard/pelajar"
      );
  }

  const totalQuestions = questions?.length ?? 5;
  const progressPercent = Math.round(((questionIndex + 1) / totalQuestions) * 100);
  const currentQuestion = questions?.[questionIndex] ?? null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Top Status Bar (Fun & Bubbly) */}
      <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300 dark:bg-yellow-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-pink-300 dark:bg-pink-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
            🎯
          </div>
          <div>
            <h1 className="text-xl font-black text-pink-600 dark:text-pink-400 uppercase">
              Tingkat Soal: Level {level} 🚀
            </h1>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {activeValidatedModule?.title
                ? `Materi: ${activeValidatedModule.chapterCode} • ${activeValidatedModule.title}`
                : "Uji Pemahaman Pembelajaran"}
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full sm:w-64 space-y-2">
          <div className="flex justify-between text-sm font-extrabold text-blue-800 dark:text-blue-300">
            <span>Perjalanan</span>
            <span>
              {questionIndex + 1} dari {totalQuestions} Soal
            </span>
          </div>
          <div className="w-full bg-blue-100 dark:bg-blue-950 rounded-full h-4 overflow-hidden border-2 border-blue-200 dark:border-blue-800 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-400 to-pink-500 h-full rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgogIDxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz4KICA8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iI2ZmZiIHN0cm9rZS1vcGFjaXR5PSIuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] opacity-30"></div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExit}
          className="relative z-10 text-sm bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold px-4 py-2 border-b-4 border-slate-400 dark:border-slate-600 rounded-2xl active:translate-y-1 active:border-b-0 transition-all"
        >
          Tutup Kuis
        </button>
      </section>

      {/* Question Card (Colorful & Big) */}
      <article className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-950 dark:to-purple-950 border-4 border-indigo-400 dark:border-indigo-800 p-6 sm:p-8 rounded-[2rem] shadow-2xl space-y-8 relative overflow-hidden">
        {isLoading && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl">
            <ListSkeleton rows={4} />
          </div>
        )}

        {isError && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl">
            <ErrorBanner
              message={error instanceof Error ? error.message : "Soal gagal dimuat."}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {!isLoading && !isError && currentQuestion && (
          <>
            <div className="space-y-4 text-center">
              <span className="inline-block bg-yellow-400 dark:bg-yellow-500 text-yellow-900 dark:text-yellow-950 font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm transform -rotate-2">
                Pertanyaan {questionIndex + 1}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                {currentQuestion.question}
              </h2>
            </div>

            <fieldset>
              <legend className="sr-only">Pilihan Jawaban</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuestion.options.map((option: string, idx: number) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectChoice = idx === currentQuestion.correctOption;
                  const optionLetters = ["A", "B", "C", "D"];
                  const letter = optionLetters[idx] ?? String.fromCharCode(65 + idx);
                  const badgeColors = [
                    "bg-sky-500 text-white",
                    "bg-emerald-500 text-white",
                    "bg-amber-500 text-white",
                    "bg-purple-500 text-white",
                  ];
                  const badgeClass = badgeColors[idx % badgeColors.length];

                  let optionCardClass =
                    "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-slate-700/60 shadow-md hover:-translate-y-1";

                  if (answerStatus === "correct" && isSelected) {
                    optionCardClass =
                      "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-4 ring-emerald-300 shadow-xl scale-[1.02] font-black";
                  } else if (answerStatus === "wrong" && isSelected) {
                    optionCardClass =
                      "bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-950 dark:text-rose-100 ring-4 ring-rose-300 shadow-md font-bold";
                  } else if (answerStatus === "wrong" && isCorrectChoice) {
                    optionCardClass =
                      "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-400/60 font-bold";
                  } else if (isSelected) {
                    optionCardClass =
                      "bg-amber-50 dark:bg-amber-950/80 border-amber-400 dark:border-amber-400 text-amber-950 dark:text-amber-100 ring-4 ring-amber-300/60 shadow-xl scale-[1.02] font-black";
                  }

                  return (
                    <label
                      key={`${currentQuestion.id}-option-${idx}`}
                      className={`group relative flex items-center gap-3.5 p-4 sm:p-5 rounded-2xl border-2 border-b-[6px] cursor-pointer transition-all transform active:translate-y-1 active:border-b-2 select-none ${optionCardClass}`}
                    >
                      <input
                        type="radio"
                        name="quiz_option"
                        value={idx}
                        disabled={isSubmitting}
                        checked={isSelected}
                        onChange={() => {
                          playClickSound();
                          setQuizSelectedOption(idx);
                          setFeedback(null);
                        }}
                        className="sr-only"
                      />
                      {/* Letter Badge (A, B, C, D) */}
                      <span
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 shadow-sm transition-transform group-hover:scale-110 ${badgeClass}`}
                      >
                        {letter}
                      </span>

                      {/* Option Text */}
                      <span className="flex-1 text-base sm:text-lg font-bold leading-snug">
                        {option}
                      </span>

                      {/* Interactive Selection Indicators */}
                      {isSelected && answerStatus === "idle" && (
                        <span className="shrink-0 bg-amber-400 text-amber-950 text-xs font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
                          <span>⭐</span>
                          <span className="hidden sm:inline">Dipilih</span>
                        </span>
                      )}
                      {answerStatus === "correct" && isSelected && (
                        <span className="shrink-0 bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                          <span>🎉</span>
                          <span>Tepat!</span>
                        </span>
                      )}
                      {answerStatus === "wrong" && isSelected && (
                        <span className="shrink-0 bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                          <span>❌</span>
                          <span>Belum Pas</span>
                        </span>
                      )}
                      {answerStatus === "wrong" && isCorrectChoice && !isSelected && (
                        <span className="shrink-0 bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                          <span>✅</span>
                          <span className="hidden sm:inline">Jawaban Tepat</span>
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Answer Status Feedback Overlay */}
            {answerStatus === "correct" && (
              <div className="bg-gradient-to-r from-emerald-400 to-green-500 border-4 border-white text-emerald-950 p-4 rounded-2xl text-center shadow-xl flex items-center justify-center gap-3 animate-bounce">
                <span className="text-xl font-black">🎉 Hebat Banget! Jawabanmu Benar! +10 Poin Prestasi ⭐</span>
              </div>
            )}

            {answerStatus === "wrong" && (
              <div className="bg-gradient-to-r from-rose-400 to-pink-500 border-4 border-white text-rose-950 p-4 rounded-2xl text-center shadow-xl flex items-center justify-center gap-3">
                <span className="text-lg font-black">
                  💪 Belum tepat, tidak apa-apa! Simak petunjuk rahasia dan terus semangat! ✨
                </span>
              </div>
            )}

            {/* Hint Box (Bantuan Petunjuk Belajar) */}
            <aside className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-indigo-950/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-lg border-2 border-amber-300 dark:border-amber-700/60">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 flex items-center justify-center text-2xl shrink-0 shadow-md">
                  💡
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <span>Petunjuk Rahasia Guru 📜</span>
                  </h3>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">
                    {showHint ? (
                      <span className="text-amber-950 dark:text-amber-100 font-bold bg-amber-200/70 dark:bg-amber-900/50 px-2.5 py-1 rounded-lg inline-block">
                        ✨ {currentQuestion.hint}
                      </span>
                    ) : (
                      "Sedikit bingung? Buka petunjuk belajar agar semakin paham materinya!"
                    )}
                  </p>
                </div>
              </div>
              {!showHint && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setQuizShowHint(true);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 font-black px-4 py-2.5 rounded-xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all shadow-md hover:scale-105 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Buka Petunjuk 💡</span>
                </button>
              )}
            </aside>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-black/25 p-4 sm:p-5 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-amber-950 font-black text-sm sm:text-base px-4 py-2 rounded-xl shadow-md border-b-2 border-amber-600 flex items-center gap-1.5">
                  <span>🪙 {totalPoints} Poin Prestasi</span>
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {feedback && (
                  <span className="bg-yellow-300 text-yellow-950 px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm animate-bounce shadow-md">
                    {feedback}
                  </span>
                )}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitAnswer}
                  className={`w-full sm:w-auto text-white text-base sm:text-lg font-black px-8 py-3.5 rounded-2xl border-b-[5px] transition-all shadow-xl active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? "bg-slate-400 border-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 border-emerald-800 hover:scale-105"
                  }`}
                >
                  {isSubmitting ? "Memeriksa... ⏳" : "Kunci Jawaban 🚀"}
                </button>
              </div>
            </div>
          </>
        )}
      </article>
    </main>
  );
}
