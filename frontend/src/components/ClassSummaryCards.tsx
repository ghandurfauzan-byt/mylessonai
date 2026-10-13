// src/components/ClassSummaryCards.tsx — Bento Metric Cards Panel Guru (FR-15 & FR-18)

import { ErrorBanner } from "@/components/AsyncStateBanners";
import ClassSummarySkeleton from "@/components/ClassSummarySkeleton";
import { useClassSummaryQuery } from "@/hooks/useClassSummaryQuery";
import { playClickSound } from "@/lib/soundEffects";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function MetricCard({
  label,
  value,
  valueClass = "text-slate-900 dark:text-white",
  note,
  noteClass = "text-slate-500 dark:text-slate-400",
  cardBg = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
  iconBg = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200",
  icon,
  onClick,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
  note: string;
  noteClass?: string;
  cardBg?: string;
  iconBg?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`p-5 sm:p-6 rounded-2xl border transition shadow-xs hover:shadow-md flex flex-col justify-between ${
        onClick ? "cursor-pointer hover:scale-[1.02] active:scale-[0.99]" : ""
      } ${cardBg}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-tight text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs ${iconBg}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <p className={`text-2xl sm:text-3xl font-black tracking-tight ${valueClass}`}>{value}</p>
        <span className={`text-[11px] font-bold mt-1 inline-block ${noteClass}`}>{note}</span>
      </div>
    </div>
  );
}

export default function ClassSummaryCards() {
  const { data: summary, isLoading, isError, error, refetch } = useClassSummaryQuery();
  const queryClient = useQueryClient();
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [registeredStudents, setRegisteredStudents] = useState<
    Array<{ id: string; name: string; email: string; nimNip?: string; points?: number }>
  >([]);

  const fetchStudents = () => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res)) setRegisteredStudents(res);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStudents();
  }, [showRosterModal]);

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Hapus akun siswa "${name}" dari sistem database?`)) return;
    try {
      playClickSound();
      setDeletingId(id);
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRegisteredStudents((prev) => prev.filter((s) => s.id !== id));
        queryClient.invalidateQueries({ queryKey: ["class-summary"] });
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Gagal menghapus siswa.");
      }
    } catch {
      alert("Terjadi kesalahan saat menghapus siswa.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetAllPoints = async () => {
    if (
      !confirm(
        "Reset seluruh poin siswa ke 0? Peringkat ranking akan dikosongkan dan siswa akan menerima notifikasi bahwa poin telah di-reset guru."
      )
    )
      return;
    try {
      playClickSound();
      const res = await fetch("/api/students/reset-points", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchStudents();
        queryClient.invalidateQueries({ queryKey: ["class-summary"] });
        alert("Seluruh poin siswa berhasil di-reset ke 0! 🔄");
      }
    } catch {
      alert("Gagal mereset poin siswa.");
    }
  };

  if (isLoading) return <ClassSummarySkeleton />;

  if (isError || !summary) {
    return (
      <ErrorBanner
        message={error instanceof Error ? error.message : "Gagal memuat ringkasan kelas."}
        onRetry={() => refetch()}
      />
    );
  }

  function scrollToSection(id: string) {
    playClickSound();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const studentCountDisplay =
    registeredStudents.length > 0 ? registeredStudents.length : summary.totalStudents;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <MetricCard
          label="Siswa SD Terdaftar"
          value={studentCountDisplay}
          valueClass="text-blue-900 dark:text-blue-200"
          cardBg="border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/90 via-indigo-50/30 to-white dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900"
          iconBg="bg-blue-600 text-white shadow-sm shadow-blue-500/25"
          note="👥 Akun Siswa Terverifikasi di Sistem"
          noteClass="text-blue-700 dark:text-blue-400 font-bold"
          onClick={() => {
            playClickSound();
            setShowRosterModal(true);
          }}
          icon={
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
        <MetricCard
          label="Rata-Rata Pemahaman"
          value={`${summary.averageComprehension}%`}
          valueClass="text-indigo-900 dark:text-indigo-200"
          cardBg="border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/90 via-purple-50/30 to-white dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900"
          iconBg="bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
          note="📊 Rata-Rata Seluruh Bab Pembelajaran"
          noteClass="text-indigo-700 dark:text-indigo-400 font-bold"
          onClick={() => scrollToSection("section-chapter-progress")}
          icon={
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
        />
        <MetricCard
          label="Modul Aktif Terindeks"
          value={`${summary.activeModules} Modul`}
          valueClass="text-purple-900 dark:text-purple-200"
          cardBg="border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/90 via-pink-50/30 to-white dark:from-slate-900 dark:via-purple-950/30 dark:to-slate-900"
          iconBg="bg-purple-600 text-white shadow-sm shadow-purple-500/25"
          note={summary.modulesNote || "📚 Terhubung Katalog Kurikulum & API"}
          noteClass="text-purple-700 dark:text-purple-400 font-bold"
          onClick={() => scrollToSection("section-curriculum-manager")}
          icon={
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          }
        />
      </div>

      {/* Modal Daftar Siswa SD Terdaftar */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border-4 border-blue-300 dark:border-blue-700 shadow-2xl p-6 sm:p-7 space-y-4 relative">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                  👥
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Daftar Siswa SD Terdaftar (Kelas 4A) 🎒
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Total {registeredStudents.length} Siswa Terdaftar di Sistem
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowRosterModal(false);
                }}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-black text-lg flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {registeredStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold">
                  Belum ada siswa yang terdaftar di database.
                </div>
              ) : (
                registeredStudents.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 flex items-center justify-center text-[11px] font-black">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 truncate">
                        <span className="text-slate-800 dark:text-slate-200 block truncate">
                          {s.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          {s.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-amber-600 dark:text-amber-400 font-black">
                          🪙 {s.points ?? 200} Poin
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">
                          ● Aktif
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStudent(s.id, s.name);
                        }}
                        disabled={deletingId === s.id}
                        title={`Hapus siswa ${s.name}`}
                        className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center transition border border-rose-200/50 dark:border-rose-800/40"
                      >
                        {deletingId === s.id ? (
                          <span className="animate-spin text-xs">⏳</span>
                        ) : (
                          <span className="text-xs">🗑️</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetAllPoints}
                className="px-3.5 py-2 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-extrabold text-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span>🔄</span>
                <span>Reset Poin Siswa ke 0</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowRosterModal(false);
                }}
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
