import ChapterProgressList from "@/components/ChapterProgressList";
import ClassSummaryCards from "@/components/ClassSummaryCards";
import CurriculumValidationManager from "@/components/CurriculumValidationManager";
import ExportReportButton from "@/components/ExportReportButton";
import InviteTeacherModal from "@/components/InviteTeacherModal";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { playClickSound } from "@/lib/soundEffects";
import { useState } from "react";

export default function PengajarDashboardPage() {
  useDocumentTitle("Dashboard Guru — Validasi Materi & Evaluasi Siswa");
  const [isResetting, setIsResetting] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleResetPoints = async () => {
    playClickSound();
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin mereset SELURUH poin siswa dan ranking juara kelas ke 0?\n\nSetelah di-reset:\n1. Peringkat siswa akan dikosongkan dan disembunyikan.\n2. Siswa akan menerima pemberitahuan di dashboard bahwa poin telah di-reset oleh guru untuk periode baru."
    );
    if (!confirmed) return;

    try {
      setIsResetting(true);
      const res = await fetch("/api/students/reset-points", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(
          "Berhasil! 🔄 Seluruh poin siswa dan ranking telah di-reset ke 0. Notifikasi otomatis telah dikirimkan ke dashboard siswa."
        );
        window.location.reload();
      } else {
        alert(data.message || "Gagal mereset poin siswa.");
      }
    } catch {
      alert("Terjadi kesalahan saat mereset poin siswa.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-7 bg-slate-50 dark:bg-slate-900/60 min-h-screen p-4 rounded-3xl transition-colors">
      {/* 1. TOP COMMAND CENTER BANNER (GURU DASHBOARD) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 dark:from-emerald-950 dark:via-teal-950 dark:to-emerald-900 p-6 sm:p-7 text-white shadow-lg border-4 border-white dark:border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-teal-300/30 dark:bg-teal-700/20 blur-2xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-900 dark:text-teal-200 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm border border-transparent dark:border-teal-700">
                🏫 SD Negeri 1 Madiun
              </span>
              <span className="text-xs font-black text-white bg-teal-700 dark:bg-teal-900/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-teal-400 dark:border-teal-700">
                👨‍🏫 Guru Kelas: Bpk. Darmawan
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
              Panel Guru: Kurikulum PKn &amp; Bahasa Jawa 👨‍🏫
            </h1>
            <p className="text-sm text-teal-50 dark:text-teal-200 max-w-xl font-medium leading-relaxed">
              Tarik materi resmi dari API SIBI Kemdikbudristek &amp; Disdikbud, validasi intisari
              pengamalan kurikulum, pantau perkembangan belajar siswa, dan berikan bimbingan khusus.
            </p>
          </div>

          {/* Tombol Aksi Cepat Guru (Undang Guru, Reset Poin, & Ekspor Laporan) */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsInviteModalOpen(true);
              }}
              title="Undang dan tambahkan akun guru baru ke sistem"
              className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-md transition-all flex items-center gap-2 border-2 border-white/20 cursor-pointer"
            >
              <span>➕</span>
              <span>Undang Guru Baru 👨‍🏫</span>
            </button>
            <button
              type="button"
              onClick={handleResetPoints}
              disabled={isResetting}
              title="Reset seluruh poin siswa dan ranking juara kelas untuk periode baru"
              className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-md transition-all flex items-center gap-2 border-2 border-white/20 cursor-pointer disabled:opacity-50"
            >
              <span>{isResetting ? "⏳" : "🔄"}</span>
              <span>{isResetting ? "Mereset..." : "Reset Poin & Ranking"}</span>
            </button>
            <ExportReportButton />
          </div>
        </div>
      </section>

      {/* Modal Undang Guru Baru */}
      <InviteTeacherModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      {/* 2. PUSAT VALIDASI KURIKULUM & PENGATURAN BAB PELAJARAN (KEMDIKBUD & DISDIK) */}
      <div id="section-curriculum-manager">
        <CurriculumValidationManager />
      </div>

      {/* 3. BENTO METRIC CARDS (CLASS SUMMARY DENGAN INTERAKSI KLIK) */}
      <ClassSummaryCards />

      {/* 4. MAIN ANALYTICS (CHAPTER PROGRESS RATA-RATA KELAS & DIAGNOSTIK) */}
      <section
        id="section-chapter-progress"
        className="w-full bg-sky-50 dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border-4 border-sky-200 dark:border-slate-800 shadow-xl shadow-sky-200/40 dark:shadow-none space-y-4"
      >
        <div className="flex items-center justify-between border-b-4 border-sky-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="font-black text-sky-900 dark:text-sky-300 text-lg">
              Tingkat Pemahaman Rata-Rata Seluruh Siswa 📊
            </h2>
            <p className="text-xs font-bold text-sky-700 dark:text-sky-400 mt-1">
              Pilih mata pelajaran PKn atau Bahasa Jawa dan klik bab untuk mendiagnosis siswa yang lemah
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border-2 border-sky-100 dark:border-slate-700">
          <ChapterProgressList role="pengajar" />
        </div>
      </section>
    </div>
  );
}
