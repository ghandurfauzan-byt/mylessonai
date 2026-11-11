// src/components/ResetPointsModal.tsx — Dialog Reset Poin Fleksibel Guru (Per-Kelas & Per-Materi)
"use client";

import ModalPortal from "@/components/ModalPortal";
import { playClickSound, playCorrectSound } from "@/lib/soundEffects";
import React, { useState } from "react";

interface ResetPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function ResetPointsModal({
  isOpen,
  onClose,
  onSuccess,
}: ResetPointsModalProps) {
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmReset = async () => {
    playClickSound();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/students/reset-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelas: selectedKelas === "all" ? undefined : selectedKelas,
          chapterId: selectedChapter === "all" ? undefined : selectedChapter,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playCorrectSound();
        try {
          localStorage.removeItem("adventure_high_score");
          localStorage.removeItem("adventure_session_score");
        } catch {}
        onSuccess(
          data.message ||
            "Poin belajar dan petualangan game berhasil di-reset sesuai pilihan kelas dan materi!"
        );
        onClose();
      } else {
        alert(data.message || "Gagal mereset poin siswa.");
      }
    } catch {
      alert("Terjadi kesalahan saat mereset poin siswa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <div className="bg-white dark:bg-slate-900 border-4 border-rose-300 dark:border-rose-900/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl shadow-sm border border-rose-200 dark:border-rose-800">
                🔄
              </span>
              <div>
                <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                  Reset Poin &amp; Skor Siswa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih cakupan kelas dan bab materi yang ingin di-reset poinnya
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Form Pilihan Kelas & Materi */}
          <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {/* Pilihan Kelas */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                🏫 Pilih Target Rombongan Belajar (Kelas):
              </label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-rose-400 outline-none cursor-pointer"
              >
                <option value="all">🌟 Semua Kelas (Kelas 1 s/d Kelas 6)</option>
                <option value="Kelas 1">Kelas 1 (Fase A)</option>
                <option value="Kelas 2">Kelas 2 (Fase A)</option>
                <option value="Kelas 3">Kelas 3 (Fase B)</option>
                <option value="Kelas 4">Kelas 4 (Fase B - Utama)</option>
                <option value="Kelas 5">Kelas 5 (Fase C)</option>
                <option value="Kelas 6">Kelas 6 (Fase C)</option>
              </select>
            </div>

            {/* Pilihan Materi */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                📖 Pilih Materi / Bab Kurikulum:
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-rose-400 outline-none cursor-pointer"
              >
                <option value="all">🌐 Semua Materi (Reset Total Seluruh Bab)</option>
                <optgroup label="🇮🇩 Pendidikan Pancasila (PKn)">
                  <option value="pkn-sila3">PKn: Bab 1 - Makna Sila Ke-3</option>
                  <option value="pkn-gotongroyong">PKn: Bab 2 - Gotong Royong</option>
                  <option value="pkn-norma">PKn: Bab 3 - Norma &amp; Aturan Sekolah</option>
                  <option value="pkn-bhinneka">PKn: Bab 4 - Bhinneka Tunggal Ika</option>
                </optgroup>
                <optgroup label="🦚 Muatan Lokal Bahasa Jawa">
                  <option value="bjawa-unggahungguh">B. Jawa: Bab 1 - Unggah-ungguh Basa</option>
                  <option value="bjawa-punokawan">B. Jawa: Bab 2 - Tokoh Wayang Punokawan</option>
                  <option value="bjawa-pandhawa">B. Jawa: Bab 3 - Pandhawa Lima</option>
                  <option value="bjawa-aksara">B. Jawa: Bab 4 - Aksara Jawa</option>
                  <option value="bjawa-kewan">B. Jawa: Bab 5 - Arane Anak Kewan</option>
                  <option value="bjawa-geguritan">B. Jawa: Bab 6 - Pasinaon Geguritan</option>
                </optgroup>
              </select>
            </div>

            {/* Preview Dampak Aksi */}
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 space-y-1">
              <span className="font-black text-[11px] uppercase tracking-wide block flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Konfirmasi Tindakan Reset:</span>
              </span>
              <p className="text-[11px] font-medium leading-relaxed">
                {selectedChapter === "all" && selectedKelas === "all" ? (
                  <span>
                    Akan mereset <strong>seluruh poin dan skor</strong> pada semua kelas untuk seluruh materi ke <strong>0</strong>.
                  </span>
                ) : selectedChapter === "all" ? (
                  <span>
                    Akan mereset <strong>seluruh poin materi</strong> khusus untuk siswa di <strong>{selectedKelas}</strong> ke <strong>0</strong>.
                  </span>
                ) : selectedKelas === "all" ? (
                  <span>
                    Akan mereset poin dan evaluasi pada bab materi <strong>"{selectedChapter}"</strong> untuk semua siswa di sekolah ke <strong>0</strong>.
                  </span>
                ) : (
                  <span>
                    Akan mereset poin dan evaluasi materi <strong>"{selectedChapter}"</strong> khusus untuk siswa <strong>{selectedKelas}</strong> ke <strong>0</strong>.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs shadow-md shadow-rose-500/20 cursor-pointer transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{isSubmitting ? "Mereset..." : "Reset Poin Terpilih 🔄"}</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
