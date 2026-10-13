// src/pages/LoginPage.tsx — Vibrant Light SaaS Auth Page (Stripe / Linear style)
// ExplainMyLesson AI · Platform Pembelajaran RAG Adaptif

import LoginForm from "@/components/LoginForm";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Link, useSearchParams } from "react-router-dom";

export default function LoginPage() {
  useDocumentTitle("Masuk — ExplainMyLesson AI");
  const [searchParams] = useSearchParams();
  const authError = searchParams.get("auth_error");
  const redirect = searchParams.get("redirect");

  return (
    <main className="min-h-screen relative flex items-center justify-center px-4 py-10 bg-gradient-to-br from-sky-100 via-yellow-50 to-pink-100 text-slate-900 selection:bg-pink-500 selection:text-white overflow-hidden">
      {/* Floating Playful Blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-300/40 blur-3xl rounded-full pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-300/40 blur-3xl rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/2 -left-20 w-60 h-60 bg-sky-300/40 blur-3xl rounded-full pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md space-y-5">
        {/* Back Link & Brand Header */}
        <div className="text-center space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-black text-sky-800 bg-white/80 hover:bg-white px-4 py-1.5 rounded-full border-2 border-sky-200 shadow-sm transition hover:scale-105 active:scale-95"
          >
            <span>Kembali ke Beranda Utama</span>
          </Link>

          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-yellow-400 via-pink-400 to-sky-400 p-1 shadow-xl shadow-yellow-500/20 transform rotate-2 hover:rotate-0 transition">
              <div className="w-full h-full bg-white rounded-[20px] flex items-center justify-center font-black text-amber-600 text-xl">
                SD
              </div>
            </div>
          </div>

          <div>
            <div className="inline-block bg-yellow-300 text-yellow-950 text-[11px] font-black px-3 py-1 rounded-full border-2 border-yellow-400 shadow-xs mb-1.5 transform -rotate-1">
              Ruang Belajar PKn &amp; Bahasa Jawa SD
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 drop-shadow-xs">
              ExplainMyLesson
            </h1>
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              Masuk untuk kumpulkan poin prestasi &amp; belajar bersama!
            </p>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-md border-4 border-white rounded-[2rem] shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-100 rounded-bl-full -z-10 opacity-70" />

          {authError && (
            <div className="mb-4 text-xs text-amber-900 bg-amber-100 border-2 border-amber-300 rounded-2xl p-3 flex items-start gap-2.5 font-bold">
              <span className="font-black text-amber-800">INFO</span>
              <p className="leading-relaxed">
                Sesi belajarmu sudah selesai. Yuk masuk lagi untuk melanjutkan misi!
              </p>
            </div>
          )}

          <LoginForm redirectTo={redirect} />
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-600 font-extrabold flex items-center justify-center gap-2">
          <span>SD Negeri 1 Madiun</span>
          <span>•</span>
          <span>Kurikulum Merdeka</span>
        </div>
      </div>
    </main>
  );
}
