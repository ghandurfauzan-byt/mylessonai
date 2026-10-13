// src/components/ExportReportButton.tsx — Ekspor Rekapitulasi Nilai Kelas (FR-18)
//
// Mendukung ekspor data pemahaman kelas ke format PDF resmi KOP UNS dan Excel/CSV.

import { useState } from "react";

export default function ExportReportButton() {
  const [status, setStatus] = useState<
    "idle" | "loading-csv" | "loading-pdf" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleExportCsv() {
    setStatus("loading-csv");
    setMessage(null);
    try {
      const res = await fetch("/api/export?format=csv");
      if (!res.ok) throw new Error("Gagal mengekspor laporan.");

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+)"/);
      const fileName = match?.[1] ?? "Laporan_Analisis_Kelas.csv";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setStatus("success");
      setMessage(`Excel/CSV berhasil diunduh: ${fileName}`);
      setTimeout(() => setStatus("idle"), 3500);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setTimeout(() => setStatus("idle"), 3500);
    }
  }

  function handleExportPdf() {
    setStatus("loading-pdf");
    setMessage(null);
    try {
      // Membuka pratinjau cetak PDF resmi di tab baru
      const newWin = window.open("/api/export?format=pdf", "_blank");
      if (newWin) {
        setStatus("success");
        setMessage("Laporan PDF resmi dibuka pada jendela baru.");
      } else {
        throw new Error("Pop-up diblokir browser. Izinkan pop-up untuk mencetak PDF.");
      }
      setTimeout(() => setStatus("idle"), 3500);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Gagal membuka PDF.");
      setTimeout(() => setStatus("idle"), 3500);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {/* Tombol Ekspor PDF (FR-18, TC-21) */}
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={status !== "idle"}
          className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 disabled:opacity-50 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs transition flex items-center gap-1.5 active:scale-[0.98]"
        >
          <svg
            className="w-4 h-4 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>Ikon Cetak PDF</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          <span>{status === "loading-pdf" ? "Membuka PDF..." : "Ekspor PDF 📄"}</span>
        </button>

        {/* Tombol Ekspor Excel / CSV (FR-18, TC-22) */}
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={status !== "idle"}
          className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 disabled:opacity-50 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-2xs transition flex items-center gap-1.5 active:scale-[0.98]"
        >
          <svg
            className={`w-4 h-4 text-slate-500 ${status === "loading-csv" ? "animate-bounce" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>Ikon Unduh Excel</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>{status === "loading-csv" ? "Mengunduh..." : "Ekspor Excel/CSV 📊"}</span>
        </button>
      </div>

      {status === "success" && (
        <span className="text-[11px] font-medium text-emerald-600 animate-in fade-in">
          ✓ {message}
        </span>
      )}
      {status === "error" && (
        <span className="text-[11px] font-medium text-rose-600 animate-in fade-in">
          ✕ {message}
        </span>
      )}
    </div>
  );
}
