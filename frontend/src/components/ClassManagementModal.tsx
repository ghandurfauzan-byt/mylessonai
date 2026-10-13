// src/components/ClassManagementModal.tsx — Manajemen Kelas Pengajar (FR-21)
//
// Memfasilitasi dosen untuk membuat, melihat, dan mengelola kelas perkuliahan,
// kurikulum mata kuliah, dan kuota mahasiswa sesuai FR-21 SKPL.

import { createClass, deleteClass, fetchClasses } from "@/lib/api/classApi";
import { useUIStore } from "@/lib/store/useUIStore";
import type { ClassRoom } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function ClassManagementModal() {
  const isOpen = useUIStore((s) => s.isClassModalOpen);
  const closeModal = useUIStore((s) => s.closeClassModal);
  const queryClient = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState("Semester Ganjil");
  const [academicYear, setAcademicYear] = useState("2025/2026");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: classes = [], isLoading } = useQuery<ClassRoom[]>({
    queryKey: ["classes"],
    queryFn: fetchClasses,
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsAdding(false);
      setName("");
      setCode("");
      setErrorMsg(null);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Gagal membuat kelas baru.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  if (!isOpen) return null;

  function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setErrorMsg("Nama kelas dan kode kelas wajib diisi.");
      return;
    }
    createMutation.mutate({ name, code, semester, academicYear });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 relative animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                KELAS
              </div>
              <div>
                <h2
                  id="class-modal-title"
                  className="font-black text-slate-900 dark:text-white text-base"
                >
                  Manajemen Kelas &amp; Mata Kuliah (FR-21)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kelola rombongan belajar mahasiswa dan penugasan modul RAG
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Tutup modal kelas"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-700">
              Daftar Kelas Aktif ({classes.length})
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            >
              <span>{isAdding ? "✕ Batal" : "+ Tambah Kelas Baru"}</span>
            </button>
          </div>

          {/* Form Tambah Kelas */}
          {isAdding && (
            <form
              onSubmit={handleCreateClass}
              className="mb-4 p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3 text-xs"
            >
              <h3 className="font-extrabold text-purple-900">Form Kelas Baru</h3>
              {errorMsg && <div className="text-rose-700 font-medium">✕ {errorMsg}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Mata Kuliah</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Praktik Pemrograman Web"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Kelas</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: TI-WEB-01"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                  >
                    <option value="Semester Ganjil">Semester Ganjil</option>
                    <option value="Semester Genap">Semester Genap</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2025/2026"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl shadow-md transition disabled:opacity-60"
                >
                  {createMutation.isPending ? "Menyimpan..." : "Simpan Kelas"}
                </button>
              </div>
            </form>
          )}

          {/* List Kelas */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Memuat daftar kelas...</div>
            ) : classes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada kelas terdaftar.
              </div>
            ) : (
              classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/20 transition flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-xs sm:text-sm">
                        {cls.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                        {cls.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-1">
                      <span>
                        Sem. {cls.semester} {cls.academicYear}
                      </span>
                      <span>{cls.studentCount} Siswa</span>
                      <span>{cls.modulesCount} Modul</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(cls.id)}
                    disabled={deleteMutation.isPending}
                    title="Hapus kelas"
                    className="text-xs font-bold text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition shrink-0"
                  >
                    Hapus
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
