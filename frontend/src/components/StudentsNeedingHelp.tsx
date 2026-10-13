// src/components/StudentsNeedingHelp.tsx — Daftar Siswa SD Perlu Bimbingan (FR-15)

import { ErrorBanner, ListSkeleton } from "@/components/AsyncStateBanners";
import { useStudentsNeedingHelpQuery } from "@/hooks/useStudentsNeedingHelpQuery";
import { createNotification } from "@/lib/api/classApi";
import { playClickSound, playCoinSound, playCorrectSound } from "@/lib/soundEffects";
import type { StudentHelp } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function StudentsNeedingHelp() {
  const { data: students, isLoading, isError, error, refetch } = useStudentsNeedingHelpQuery();
  const queryClient = useQueryClient();
  const [helpedIds, setHelpedIds] = useState<Record<string, boolean>>({});
  const [activeGuidingStudent, setActiveGuidingStudent] = useState<StudentHelp | null>(null);
  const [isSuccessToast, setIsSuccessToast] = useState<string | null>(null);

  function handleOpenGuide(student: StudentHelp) {
    playClickSound();
    setActiveGuidingStudent(student);
  }

  async function handleConfirmRemedial() {
    if (!activeGuidingStudent) return;
    playCoinSound();
    playCorrectSound();

    const studentName = activeGuidingStudent.name;
    const studentChapter = activeGuidingStudent.chapter;

    setHelpedIds((prev) => ({ ...prev, [activeGuidingStudent.id]: true }));
    setActiveGuidingStudent(null);
    setIsSuccessToast(
      `Program pengayaan & materi bimbingan berhasil disarankan untuk siswa: ${studentName}! 🚀`
    );

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "active_student_pengayaan_recommendation",
          JSON.stringify({
            studentId: activeGuidingStudent.id,
            studentName: studentName,
            chapterTitle: studentChapter,
            recommendedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          })
        );
        window.dispatchEvent(new Event("storage"));
      } catch {}
    }

    setTimeout(() => {
      setIsSuccessToast(null);
    }, 4500);

    try {
      await createNotification({
        title: `Rekomendasi Modul Pengayaan dari Guru 🚀`,
        message: `Pak Guru telah menyiapkan ringkasan materi pengayaan & bimbingan khusus untukmu pada materi ${studentChapter}. Yuk pelajari bersama!`,
        type: "success",
        link: "/dashboard/pelajar",
        targetRole: "pelajar",
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      // Ignore
    }
  }

  if (isLoading) return <ListSkeleton rows={2} />;

  if (isError || !students) {
    return (
      <ErrorBanner
        message={
          error instanceof Error ? error.message : "Gagal memuat daftar pelajar perlu bimbingan."
        }
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-3">
      {isSuccessToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-400 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span className="font-bold text-emerald-600">🎉</span>
          <span>{isSuccessToast}</span>
        </div>
      )}

      {students.map((student) => {
        const isHelped = !!helpedIds[student.id];
        const initials = student.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("");

        return (
          <div
            key={student.id}
            className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 flex items-center justify-between gap-3 transition shadow-2xs hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs border border-white dark:border-amber-800">
                {initials}
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">{student.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                    {student.chapter}
                  </span>
                  <span className="text-[10px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 px-1.5 py-0.5 rounded-md">
                    Skor: {student.score}/{student.outOf}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenGuide(student)}
              className={`text-[11px] font-black px-3.5 py-2 rounded-xl transition shrink-0 shadow-xs flex items-center gap-1.5 ${
                isHelped
                  ? "bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-95"
              }`}
            >
              <span>{isHelped ? "✅" : "🚀"}</span>
              <span>{isHelped ? "Pengayaan Disarankan" : "Sarankan Pengayaan"}</span>
            </button>
          </div>
        );
      })}

      {/* Modal Program Bimbingan Guru */}
      {activeGuidingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border-4 border-amber-300 dark:border-amber-700 shadow-2xl p-6 sm:p-7 space-y-4 relative">
            <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black text-base flex items-center justify-center shadow-xs">
                  👨‍🏫
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Program Bimbingan Belajar Siswa 👨‍🏫
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    Pemberian materi remedial &amp; penguatan konsep
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveGuidingStudent(null);
                }}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-black text-lg flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-1">
              <span className="text-xs font-black text-amber-950 dark:text-amber-200 block">
                Target Siswa: {activeGuidingStudent.name} (Kelas 4A)
              </span>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                Materi yang perlu diulang: <strong>{activeGuidingStudent.chapter}</strong> (Hasil
                kuis terakhir: {activeGuidingStudent.score}/{activeGuidingStudent.outOf})
              </p>
            </div>

            <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Aksi yang Akan Dikirimkan ke Siswa:
              </p>
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>
                  Rekomendasikan modul ringkasan &amp; audio penjelasan robot ke akun siswa
                </span>
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>Kirim 3 latihan kuis pemahaman Level 1 yang lebih mudah</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>
                  Kirim pesan motivasi guru: &ldquo;Kamu pasti bisa, pelajari lagi yuk!&rdquo;
                </span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveGuidingStudent(null);
                }}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRemedial}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs transition shadow-md shadow-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Kirim Modul Pengayaan &amp; Bimbingan 🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
