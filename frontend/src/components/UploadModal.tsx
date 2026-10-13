// src/components/UploadModal.tsx — Modal Unggah Modul Kuliah & Catatan Privat (FR-04, FR-05, FR-06)

import { useCreateMaterialMutation } from "@/hooks/useMaterialsQuery";
import { useUIStore } from "@/lib/store/useUIStore";
import { availableChapters } from "@shared/catalog";
import { MaterialUploadSchema } from "@shared/schema";
import { useState } from "react";

const initialForm = {
  title: "",
  chapter: availableChapters[0]?.value ?? "",
  file: null as File | null,
};

export default function UploadModal() {
  const isOpen = useUIStore((s) => s.isUploadModalOpen);
  const variant = useUIStore((s) => s.uploadModalVariant);
  const closeUploadModal = useUIStore((s) => s.closeUploadModal);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMaterialMutation = useCreateMaterialMutation();

  if (!isOpen) return null;

  const isPublic = variant === "public";

  function resetAndClose() {
    setForm(initialForm);
    setErrors({});
    createMaterialMutation.reset();
    closeUploadModal();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = MaterialUploadSchema.safeParse({
      title: form.title,
      fileName: form.file?.name ?? "",
      chapter: isPublic ? form.chapter : undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.errors) {
        const key = String(issue.path[0] ?? "title");
        fieldErrors[key === "fileName" ? "file" : key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (form.file && form.file.type !== "application/pdf") {
      setErrors({ file: "Format file harus PDF." });
      return;
    }

    setErrors({});
    createMaterialMutation.mutate(
      { ...parsed.data, variant },
      {
        onSuccess: () => {
          setTimeout(resetAndClose, 1200);
        },
      }
    );
  }

  const status = createMaterialMutation.isPending
    ? "loading"
    : createMaterialMutation.isSuccess
      ? "success"
      : createMaterialMutation.isError
        ? "error"
        : "idle";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-800 dark:text-slate-100">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${isPublic ? "bg-purple-600" : "bg-blue-600"}`}
            />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              {isPublic ? "Unggah Modul Pembelajaran (Publik)" : "Upload Catatan Privat Mahasiswa"}
            </h3>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Tutup"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg p-1 transition"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="docTitle" className="block text-xs font-bold text-slate-700 mb-1">
              {isPublic ? "Judul Modul Pembelajaran" : "Judul Catatan / Dokumen Privat"}
            </label>
            <input
              id="docTitle"
              type="text"
              placeholder={
                isPublic
                  ? "Contoh: Bab 4 - Software Testing & QA"
                  : "Contoh: Catatan Tambahan Pertemuan 3"
              }
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={`w-full bg-slate-50 border rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                errors.title ? "border-rose-500" : "border-slate-300"
              }`}
            />
            {errors.title && <p className="text-[11px] text-rose-600 mt-1">{errors.title}</p>}
          </div>

          {isPublic && (
            <div>
              <label htmlFor="docChapter" className="block text-xs font-bold text-slate-700 mb-1">
                Kaitkan ke Bab
              </label>
              <select
                id="docChapter"
                value={form.chapter}
                onChange={(e) => setForm((f) => ({ ...f, chapter: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              >
                {availableChapters.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="docFile" className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Dokumen PDF
            </label>
            <input
              id="docFile"
              type="file"
              accept=".pdf"
              onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
              className={`w-full bg-slate-50 border rounded-xl p-2 text-xs text-slate-700 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer ${
                errors.file ? "border-rose-500" : "border-slate-300"
              }`}
            />
            <p className="text-[10px] text-slate-500 mt-1.5">
              {isPublic
                ? "Modul ini akan diindeks oleh RAG Engine dan diakses oleh seluruh mahasiswa di kelas."
                : "Dokumen ini diproses 500 karakter per chunk dan hanya disimpan untuk akun Anda."}
            </p>
            {errors.file && <p className="text-[11px] text-rose-600 mt-1">{errors.file}</p>}
          </div>

          {status === "error" && (
            <div className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
              {createMaterialMutation.error instanceof Error
                ? createMaterialMutation.error.message
                : "Terjadi kesalahan saat mengunggah."}
            </div>
          )}
          {status === "success" && (
            <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 font-medium">
              <svg
                className="w-4 h-4 text-emerald-600 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Dokumen berhasil diunggah &amp; diindeks RAG Engine secara instan!</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={resetAndClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/25 active:scale-95"
            >
              {status === "loading"
                ? "Mengunggah..."
                : isPublic
                  ? "Unggah Modul"
                  : "Simpan Dokumen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
