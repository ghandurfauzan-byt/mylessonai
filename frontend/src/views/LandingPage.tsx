// src/pages/LandingPage.tsx — Vibrant Light SaaS Edition (Stripe / Linear Light style)
// ExplainMyLesson AI · Platform Pembelajaran RAG Adaptif

import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  useDocumentTitle("ExplainMyLesson SD — Belajar PKn & Bahasa Jawa Ceria Berbasis RAG");

  // State interaktif untuk interactive product demo frame
  const [activePreviewTab, setActivePreviewTab] = useState<
    "ringkasan" | "analogi" | "kuis" | "rag"
  >("ringkasan");
  const [selectedDemoQuizOption, setSelectedDemoQuizOption] = useState<number | null>(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Bagaimana ExplainMyLesson AI membantu anak SD belajar PKn dan Bahasa Jawa?",
      a: "ExplainMyLesson menggunakan teknologi RAG pintar yang menyajikan materi modul Kurikulum Merdeka (seperti Sila Pancasila, Gotong Royong, Unggah-Ungguh Basa, dan Tokoh Punokawan) menjadi dongeng berpoin yang ringkas, analogi kehidupan sehari-hari, serta dibacakan langsung oleh Robot Pintar bersuara ramah.",
    },
    {
      q: "Bagaimana cara kerja kuis gamifikasi dan koin emas?",
      a: "Setiap kali siswa SD menyelesaikan bacaan modul, mendengarkan narasi robot, atau menjawab kuis adaptif (Level 1 Dasar, Level 2 Menengah, Level 3 Mahir), siswa akan mendapatkan koin emas dan naik level. Tersedia pula Papan Juara Kelas dan koleksi Lencana Prestasi untuk memotivasi anak belajar setiap hari.",
    },
    {
      q: "Bagaimana Guru memantau pemahaman siswa dan memberikan bimbingan?",
      a: "Bapak/Ibu Guru dapat masuk melalui Meja Guru untuk melihat grafik pemahaman per bab kelas, mendeteksi otomatis siswa yang memperoleh nilai di bawah 60 (butuh bimbingan), mengirimkan rekomendasi belajar materi ulang, serta mengekspor rekapitulasi nilai kelas ke format CSV.",
    },
    {
      q: "Apakah materi yang dijawab oleh AI aman dan terverifikasi dari modul resmi?",
      a: "Sangat aman. Sistem mengunci 100% pengetahuan pada modul resmi guru sekolah dasar tanpa mengambil konten luar yang tidak terverifikasi, sehingga 0% halusinasi dan sepenuhnya sesuai dengan silabus kelas sekolah dasar.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-slate-900 font-sans selection:bg-blue-600 selection:text-white antialiased relative">
      {/* 1. TOP HEADER & MODERN SAAS NAVIGATION BAR */}
      {/* 1. TOP HEADER & MODERN NAVIGATION BAR */}
      <header
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b-2 border-yellow-200 shadow-xs"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-xl p-1"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-400 to-sky-400 p-0.5 shadow-md shadow-yellow-500/30 group-hover:scale-105 transition">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-amber-600 text-xs">
                SD
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-pink-600 transition">
                  ExplainMyLesson
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-300 text-yellow-950 border border-yellow-400">
                  SD Pintar
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold -mt-0.5">
                Pendidikan Kewarganegaraan &amp; Basa Jawa
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login?role=pelajar"
              className="text-xs font-black px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-yellow-950 shadow-md border-b-2 border-amber-600 transition active:translate-y-0.5 flex items-center gap-1.5"
            >
              <span>Masuk Siswa</span>
            </Link>
            <Link
              to="/login?role=pengajar"
              className="text-xs font-black px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 transition flex items-center gap-1.5"
            >
              <span>Meja Guru</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION DENGAN PASTEL GLOW & BUBBLY THEME */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-sky-50 via-yellow-50/40 to-white border-b-2 border-yellow-100">
        {/* Ambient Soft Pastel Blobs */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[380px] bg-gradient-to-tr from-yellow-200/50 via-pink-200/40 to-sky-200/50 blur-3xl rounded-full pointer-events-none z-0" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-purple-200/40 blur-3xl rounded-full pointer-events-none z-0" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-emerald-200/40 blur-3xl rounded-full pointer-events-none z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-yellow-300 shadow-sm text-yellow-950 text-xs font-black backdrop-blur-md transform -rotate-1">
              <span>AI Peringkas Modul Adaptif Anak SD</span>
              <span className="text-yellow-400">•</span>
              <span className="text-pink-600">Kurikulum Merdeka Interaktif</span>
            </div>

            {/* High-Impact Display Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.18] drop-shadow-xs">
              Meringkas Pelajaran Jadi Dongeng Adaptif &amp;{" "}
              <span className="bg-gradient-to-r from-pink-500 via-amber-500 to-sky-500 bg-clip-text text-transparent underline decoration-wavy decoration-yellow-400">
                Petualangan Belajar Menyenangkan
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-bold leading-relaxed">
              Ubah modul tebal PKn &amp; Bahasa Jawa menjadi <b>ringkasan adaptif ramah anak SD</b>.
              Didongengkan langsung oleh <b>Robot Pintar Bersuara</b>, kumpulkan{" "}
              <b>Poin Prestasi</b>, dan taklukkan kuis tantangan 3 level berhadiah capaian juara
              kelas!
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto">
              <Link
                to="/login?role=pelajar"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-yellow-950 font-black text-base shadow-xl shadow-amber-500/30 border-b-4 border-amber-600 hover:scale-105 active:translate-y-1 active:border-b-0 transition flex items-center justify-center gap-3 group"
              >
                <span>Mulai Main &amp; Belajar (Siswa SD)</span>
              </Link>
              <Link
                to="/login?role=pengajar"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 border-4 border-purple-200 text-purple-900 font-black text-sm shadow-md transition hover:scale-103 active:translate-y-0.5 flex items-center justify-center gap-2.5"
              >
                <span>Meja Guru (Upload &amp; Validasi)</span>
              </Link>
            </div>

            {/* 4 Fitur Utama Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 w-full max-w-3xl">
              <div className="bg-white p-3.5 rounded-2xl border-2 border-yellow-200 shadow-sm text-center space-y-1">
                <span className="font-bold text-amber-500 text-sm block">01</span>
                <p className="text-xs font-black text-slate-800">Ringkasan Adaptif</p>
                <p className="text-[10px] text-slate-500 font-bold">
                  Modul tebal jadi cerita ringkas
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border-2 border-sky-200 shadow-sm text-center space-y-1">
                <span className="font-bold text-sky-500 text-sm block">02</span>
                <p className="text-xs font-black text-slate-800">Robot Bersuara</p>
                <p className="text-[10px] text-slate-500 font-bold">
                  Narasi audio ceria &amp; interaktif
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border-2 border-pink-200 shadow-sm text-center space-y-1">
                <span className="font-bold text-pink-500 text-sm block">03</span>
                <p className="text-xs font-black text-slate-800">Game Kuis 3 Level</p>
                <p className="text-[10px] text-slate-500 font-bold">Kumpulkan koin &amp; lencana</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border-2 border-purple-200 shadow-sm text-center space-y-1">
                <span className="font-bold text-purple-500 text-sm block">04</span>
                <p className="text-xs font-black text-slate-800">Juara Kelas</p>
                <p className="text-[10px] text-slate-500 font-bold">Leaderboard koin seru siswa</p>
              </div>
            </div>

            {/* Social Trust Proof Pill */}
            <div className="pt-4 flex items-center gap-3 text-xs text-slate-600">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                  P
                </div>
                <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                  M
                </div>
                <div className="w-7 h-7 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                  D
                </div>
              </div>
              <span className="font-medium">
                Diuji &amp; divalidasi pada modul kurikulum pembelajaran modern
              </span>
            </div>
          </div>

          {/* 3. INTERACTIVE PRODUCT DEMO FRAME (MAC / BROWSER LIGHT SAAS STYLE) */}
          <div id="demo" className="mt-14 max-w-5xl mx-auto">
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-200 to-slate-300 p-1 shadow-2xl shadow-blue-500/10 border border-slate-200">
              <div className="rounded-xl bg-white overflow-hidden">
                {/* Browser Window Bar */}
                <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                    <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1 rounded-md bg-white border border-slate-200 text-[11px] text-slate-500 font-mono">
                      <span className="text-emerald-600 font-semibold">https://</span>
                      <span>app.explainmylesson.id/modul/pkn-sila3</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      RAG Verified (0% Halusinasi)
                    </span>
                  </div>
                </div>

                {/* Interactive Mode Tabs */}
                <div className="bg-slate-50/70 p-2.5 border-b border-slate-200 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("ringkasan")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                      activePreviewTab === "ringkasan"
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>1. Ringkasan &amp; Pengamalan Modul</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("analogi")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                      activePreviewTab === "analogi"
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>2. Cerita &amp; Analogi Sehari-Hari</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("kuis")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                      activePreviewTab === "kuis"
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    <span>3. Kuis Adaptif SD (+Koin)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("rag")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                      activePreviewTab === "rag"
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    <span>4. Inspektur Dokumen Resmi Guru</span>
                  </button>
                </div>

                {/* Live Preview Screen Content */}
                <div className="p-6 sm:p-8 min-h-[300px] text-slate-700 text-xs sm:text-sm">
                  {activePreviewTab === "ringkasan" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            Modul PKn: Makna &amp; Pengamalan Sila Ke-3 Pancasila
                          </h4>
                          <span className="text-xs text-slate-500">
                            Kompresi cerdas: Buku ajar PPKn SD diringkas menjadi 3 pilar aksi nyata
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded font-bold">
                          0.15s Processing
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4 pt-1">
                        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                          <span className="text-amber-800 font-mono text-xs font-bold">
                            Pilar 1
                          </span>
                          <h5 className="font-bold text-slate-900 text-xs">
                            Pohon Beringin Pelindung
                          </h5>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Simbol keteduhan tempat berteduh semua warga Indonesia dari berbagai
                            suku, agama, dan budaya di bawah satu naungan bangsa.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-1">
                          <span className="text-sky-800 font-mono text-xs font-bold">Pilar 2</span>
                          <h5 className="font-bold text-slate-900 text-xs">
                            Rukun di Jam Istirahat
                          </h5>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Tidak memilih-milih kawan bermain, mengajak teman yang duduk sendirian,
                            dan saling menghormati perbedaan di sekolah.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                          <span className="text-emerald-800 font-mono text-xs font-bold">
                            Pilar 3
                          </span>
                          <h5 className="font-bold text-slate-900 text-xs">
                            Cinta Produk Dalam Negeri
                          </h5>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Bangga mengenakan seragam batik daerah, memakai sepatu buatan perajin
                            lokal, dan mencintai kesenian tradisional.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === "analogi" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="border-b border-slate-100 pb-3">
                        <h4 className="text-base font-bold text-slate-900">
                          Analogi Logis: Mengapa Gotong Royong Itu Seperti Sapu Lidi?
                        </h4>
                        <span className="text-xs text-slate-500">
                          Perumpamaan konkret agar nilai budi pekerti langsung dimengerti anak
                        </span>
                      </div>
                      <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50/70 via-yellow-50/40 to-slate-50 border border-amber-200">
                        <p className="text-slate-800 leading-relaxed text-xs sm:text-sm">
                          "Bayangkan sebatang lidi tipis. Jika digunakan untuk menyapu tumpukan daun
                          gugur di halaman sekolah, lidi itu akan mudah patah dan halamannya tidak
                          bersih. Tetapi jika puluhan lidi diikat menjadi satu menjadi{" "}
                          <strong>sapu lidi yang kokoh</strong>, halaman yang luas akan bersih dalam
                          sekejap! Begitulah gotong royong dan persatuan: ketika kita rukun bersama
                          kawan, tugas seberat apa pun terasa ringan!"
                        </p>
                        <div className="mt-3 pt-3 border-t border-amber-200 flex items-center justify-between text-[11px] text-amber-800 font-semibold">
                          <span>Relevan untuk Modul PKn Sila Ke-3 &amp; Gotong Royong</span>
                          <span className="text-emerald-700">✓ Diverifikasi Guru Kelas</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === "kuis" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Level 1 — DASAR
                            </span>
                            <span className="text-xs text-amber-700 font-bold">
                              +10 Poin Prestasi
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                            Soal Kuis: Apa lambang dari Sila Ke-3 Pancasila "Persatuan Indonesia"?
                          </h4>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">Soal 1/5</span>
                      </div>

                      <div className="space-y-2">
                        {[
                          "Pohon Beringin yang rindang dan berakar kokoh.",
                          "Bintang Emas bersudut lima.",
                          "Padi dan Kapas kemakmuran.",
                        ].map((opt, i) => (
                          <button
                            type="button"
                            key={`demo-quiz-${i}`}
                            onClick={() => setSelectedDemoQuizOption(i)}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs cursor-pointer transition flex items-center gap-3 ${
                              selectedDemoQuizOption === i
                                ? "bg-amber-50 border-amber-500 text-amber-950 shadow-xs font-bold"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                selectedDemoQuizOption === i
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="leading-snug flex-1">{opt}</span>
                            {selectedDemoQuizOption === i && i === 0 && (
                              <span className="text-[10px] text-emerald-700 font-black bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                                Benar! (+10 Poin)
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activePreviewTab === "rag" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            Inspektur Dokumen Silabus Guru
                          </h4>
                          <span className="text-xs text-slate-500">
                            Melihat teks asli dari PDF buku tema sekolah yang dijadikan rujukan
                            sistem
                          </span>
                        </div>
                        <span className="text-xs font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded font-bold">
                          Kesesuaian Silabus: 100%
                        </span>
                      </div>
                      <div className="bg-slate-50 font-mono text-[11px] p-4 rounded-xl border border-slate-200 text-slate-800 space-y-2">
                        <div className="text-slate-500 text-[10px]">
                          // Sumber: Modul_PPKn_Kelas4_Kurikulum_Merdeka.pdf [Bab 3, Halaman 24]
                        </div>
                        <p className="text-slate-900">
                          "Sila Ketiga mengajarkan bahwa keanekaragaman suku bangsa, bahasa daerah,
                          dan tradisi di Indonesia harus dirawat dengan semangat kebersamaan dan
                          persatuan tanpa membeda-bedakan satu sama lain."
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Window Bottom Status Footer */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-3">
                    <span>
                      Modul Aktif:{" "}
                      <strong className="text-slate-900">PKn: Makna Sila Ke-3 Pancasila</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      Guru Kelas:{" "}
                      <strong className="text-slate-900">Ibu Guru Pertiwi, S.Pd.</strong>
                    </span>
                  </div>
                  <Link
                    to="/login?role=pelajar"
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <span>Jalankan di Dashboard Pelajar</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MODERN LIGHT SAAS BENTO GRID (ARSITEKTUR & FITUR KUNCI) */}
      <section id="bento" className="py-20 lg:py-28 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Sistem Pembelajaran Ceria &amp; Terpercaya 2026
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Belajar Menyenangkan Berbasis Dongeng &amp; Nilai Karakter Anak SD
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Menggabungkan suara narasi Robot Pintar, kuis adaptif poin prestasi, dan pengamalan
              nyata budi pekerti di sekolah maupun di rumah.
            </p>
          </div>

          {/* Bento Box Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento 1: Intisari Modul Anak SD (Span 2) */}
            <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-amber-50/80 via-yellow-50/40 to-white p-7 sm:p-8 border border-amber-200/80 hover:border-amber-400 hover:shadow-xl transition relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-amber-500/25">
                  MODUL
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Intisari Modul Padat Jadi Dongeng Ramah Anak
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed font-medium">
                    Anak-anak tidak lagi pusing menghafal buku tebal yang membosankan. Materi
                    Pancasila dan Bahasa Jawa disajikan dalam format cerita menarik, analogi sapu
                    lidi, dan keteladanan Punokawan yang mudah dicerna.
                  </p>
                </div>
                <div className="pt-2 grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/90 border border-amber-200 text-center shadow-2xs">
                    <div className="text-lg font-black text-amber-600">4 Modul</div>
                    <div className="text-[10px] text-slate-500 font-bold">
                      PKn &amp; Bahasa Jawa
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/90 border border-emerald-200 text-center shadow-2xs">
                    <div className="text-lg font-black text-emerald-600">100%</div>
                    <div className="text-[10px] text-slate-500 font-bold">Kurikulum Merdeka SD</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/90 border border-indigo-200 text-center shadow-2xs">
                    <div className="text-lg font-black text-indigo-600">Audio</div>
                    <div className="text-[10px] text-slate-500 font-bold">Suara Robot Ramah</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 2: 0% Halusinasi Guardrail (Span 1) */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white p-7 sm:p-8 border border-emerald-200/80 hover:border-emerald-400 hover:shadow-xl transition relative overflow-hidden group">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-500/25">
                  AMAN
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Aman &amp; Terverifikasi Guru
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Sistem RAG memastikan AI hanya menjawab berdasarkan materi modul resmi yang
                  disiapkan Bapak/Ibu Guru, bebas dari konten fiktif atau halusinasi liar internet.
                </p>
                <div className="p-3 rounded-xl bg-white/90 border border-emerald-300 text-[11px] text-emerald-900 font-bold flex items-center gap-2 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>100% aman untuk siswa sekolah dasar.</span>
                </div>
              </div>
            </div>

            {/* Bento 3: 3-Tier Adaptive Quiz CBT (Span 1) */}
            <div className="rounded-2xl bg-gradient-to-br from-yellow-50/80 via-amber-50/40 to-white p-7 sm:p-8 border border-yellow-300 hover:border-yellow-400 hover:shadow-xl transition relative overflow-hidden group">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 font-black text-xs">
                  KUIS
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Kuis Tantangan 3 Level (+150 Poin)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  5 soal per level dengan sound effect seru dan tantangan bertingkat:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/90 border border-emerald-200 shadow-2xs">
                    <span className="text-emerald-800 font-bold">Level 1: Dasar</span>
                    <span className="text-emerald-700 font-black">+10 Poin per soal</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/90 border border-blue-200 shadow-2xs">
                    <span className="text-blue-800 font-bold">Level 2: Menengah</span>
                    <span className="text-blue-700 font-black">+20 Poin per soal</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/90 border border-purple-200 shadow-2xs">
                    <span className="text-purple-800 font-bold">Level 3: Mahir</span>
                    <span className="text-purple-700 font-black">+30 Poin per soal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 4: Guru Analytics & Bimbingan (Span 2) */}
            <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-purple-50/80 via-pink-50/40 to-white p-7 sm:p-8 border border-purple-200/80 hover:border-purple-400 hover:shadow-xl transition relative overflow-hidden group">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 font-black text-xs">
                  GURU
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Meja Guru: Pantauan Pemahaman &amp; Bimbingan Khusus
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Bapak/Ibu Guru dapat memantau perolehan poin prestasi siswa sekelas, mendeteksi
                    adik-adik yang nilainya kurang dari 60, dan mengirim saran bimbingan materi
                    secara terarah.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-xs text-amber-800 font-bold flex items-center justify-center sm:justify-start gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Deteksi Otomatis Nilai &lt; 60</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Tersedia tombol rekomendasi belajar ulang langsung dan ekspor rekap nilai
                      kelas ke file CSV.
                    </p>
                  </div>
                  <Link
                    to="/login?role=pengajar"
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition whitespace-nowrap shadow-md shadow-purple-500/20"
                  >
                    Buka Meja Guru
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MODERN LIGHT SAAS COMPARISON TABLE (SKPL TABEL 1.1) */}
      <section
        id="komparasi"
        className="py-20 lg:py-28 border-b border-slate-200/80 bg-slate-50/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-800 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full">
              Matriks Keunggulan Sistem
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Mengapa ExplainMyLesson Sangat Cocok untuk Siswa SD?
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Perbandingan antara metode belajar konvensional / AI umum dengan sistem terverifikasi
              kurikulum sekolah dasar.
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="p-4 sm:p-5">Parameter Belajar</th>
                    <th className="p-4 sm:p-5 text-slate-500">
                      Buku Cetak Konvensional &amp; AI Umum
                    </th>
                    <th className="p-4 sm:p-5 text-blue-900 bg-blue-50/70 border-l border-r border-blue-100 font-extrabold">
                      ExplainMyLesson SD (RAG + Gamifikasi)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-900">Format Penyajian Materi</td>
                    <td className="p-4 sm:p-5 text-slate-600">
                      Teks paragraf panjang yang membosankan dan membuat anak cepat jenuh.
                    </td>
                    <td className="p-4 sm:p-5 font-bold text-blue-800 bg-blue-50/40 border-l border-r border-blue-100">
                      ✓ Dongeng ringkas berpoin + Dibacakan suara pendamping yang ramah
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-900">
                      Tingkat Keamanan Jawaban AI
                    </td>
                    <td className="p-4 sm:p-5 text-rose-600 font-medium">
                      Beresiko tinggi menampilkan bahasa dewasa/sulit yang tidak sesuai anak SD.
                    </td>
                    <td className="p-4 sm:p-5 font-bold text-emerald-800 bg-blue-50/40 border-l border-r border-blue-100">
                      ✓ 100% Terkunci pada buku kurikulum resmi dari Guru (0% Halusinasi).
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-900">Motivasi Belajar Siswa</td>
                    <td className="p-4 sm:p-5 text-slate-600">
                      Pasif, tidak ada timbal balik hadiah langsung saat selesai membaca.
                    </td>
                    <td className="p-4 sm:p-5 font-bold text-blue-800 bg-blue-50/40 border-l border-r border-blue-100">
                      ✓ Kuis 3 level arcade, Poin Prestasi, Papan Juara Kelas &amp; Lencana
                      Prestasi.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-slate-900">
                      Pemantauan oleh Guru Kelas
                    </td>
                    <td className="p-4 sm:p-5 text-slate-600">
                      Guru baru tahu kesulitan siswa saat ulangan akhir semester.
                    </td>
                    <td className="p-4 sm:p-5 font-bold text-blue-800 bg-blue-50/40 border-l border-r border-blue-100">
                      ✓ Dashboard Guru realtime: deteksi nilai &lt; 60, bimbingan cepat &amp; ekspor
                      CSV.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LATAR BELAKANG ANALISIS MASALAH ANAK SD */}
      <section id="pieces" className="py-20 lg:py-24 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
              Kebutuhan Pembelajaran Anak SD
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Menjawab 3 Tantangan Nyata Belajar PKn &amp; Bahasa Jawa
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Dirancang untuk menumbuhkan minat belajar dan budi pekerti luhur sejak dini.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 sm:p-7 rounded-2xl bg-amber-50/60 border border-amber-200 hover:border-amber-400 hover:shadow-md transition space-y-3">
              <span className="text-xs font-bold text-amber-800 font-mono">
                01 / CERITA MENARIK
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">
                Pancasila Jangan Cuma Dihafal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Anak sering hafal bunyi sila tetapi bingung bagaimana menerapkannya saat berteman
                dan bermain di sekolah.
              </p>
              <div className="pt-2 text-xs font-bold text-amber-700">
                &rarr; Dilengkapi contoh aksi nyata &amp; analogi ramah anak.
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-sky-50/60 border border-sky-200 hover:border-sky-400 hover:shadow-md transition space-y-3">
              <span className="text-xs font-bold text-sky-800 font-mono">
                02 / UNGGAH-UNGGUH BASA
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">
                Sulit Membedakan Basa Krama
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Banyak siswa SD kesulitan membedakan kapan memakai Ngoko untuk teman dan Krama Alus
                untuk orang tua/guru.
              </p>
              <div className="pt-2 text-xs font-bold text-sky-700">
                &rarr; Belajar tata krama lewat perumpamaan tokoh Punokawan.
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-emerald-50/60 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition space-y-3">
              <span className="text-xs font-bold text-emerald-800 font-mono">
                03 / BIMBINGAN GURU
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">
                Anak Butuh Dukungan Tepat Waktu
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Guru memerlukan sistem yang memberitahu jika ada siswa yang tertinggal dalam bab
                tertentu sebelum ujian tiba.
              </p>
              <div className="pt-2 text-xs font-bold text-emerald-700">
                &rarr; Sistem rekomendasi remedial otomatis &amp; peringatan nilai &lt; 60.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INTERACTIVE FAQ ACCORDION (LIGHT SAAS STYLE) */}
      <section id="faq" className="py-20 lg:py-24 border-b border-slate-200/80 bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
              Tanya Jawab Pintar
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Segala hal tentang cara belajar seru, kuis berhadiah koin, dan bimbingan guru.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={`faq-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 transition"
                  >
                    <span>{faq.q}</span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-3 ${
                        isOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. VIBRANT CTA CALLOUT BANNER */}
      <section className="py-20 lg:py-24 relative overflow-hidden bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 text-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md">
            Siap Belajar PKn &amp; Bahasa Jawa dengan Seru?
          </h2>
          <p className="text-white/90 text-sm sm:text-base max-w-xl mx-auto font-bold">
            Kumpulkan poin prestasimu sekarang, dengarkan cerita ringkas, dan jadilah juara kelas di SD
            Negeri 1 Madiun!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login?role=pelajar"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-amber-950 font-black text-sm sm:text-base shadow-xl border-b-4 border-amber-600 hover:scale-105 active:translate-y-1 active:border-b-0 transition flex items-center justify-center gap-2"
            >
              <span>Masuk Siswa SD (Mulai Belajar)</span>
            </Link>
            <Link
              to="/login?role=pengajar"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border-2 border-white text-white font-black text-sm sm:text-base transition flex items-center justify-center gap-2"
            >
              <span>Buka Meja Guru</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. PLATFORM OVERVIEW & FOOTER */}
      <footer
        id="tentang"
        className="py-14 bg-white border-t border-slate-200/80 text-slate-600 text-xs relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid md:grid-cols-12 gap-8 items-center border-b border-slate-100 pb-8">
            <div className="md:col-span-7 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-pink-400 to-sky-400 flex items-center justify-center text-white font-black text-xs shadow-sm">
                  SD
                </div>
                <span className="font-black text-slate-900 text-base tracking-tight">
                  ExplainMyLesson SD
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-300 text-yellow-950 border border-yellow-400">
                  EdTech SD Ceria
                </span>
              </div>
              <p className="text-slate-600 text-xs max-w-md leading-relaxed">
                Platform Pembelajaran Adaptif Berbasis Dongeng &amp; Suara Robot Pintar dengan Kuis
                Gamifikasi Bertingkat.
              </p>
              <p className="text-slate-400 text-[11px] font-medium">
                Dirancang khusus untuk memudahkan siswa SD memahami nilai budi pekerti Pancasila dan
                keluhuran budaya Jawa secara gembira.
              </p>
            </div>

            <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-slate-50/90 hover:bg-yellow-50/40 p-4 rounded-xl border border-slate-200/80 shadow-xs transition">
                <span className="text-[10px] text-amber-800 font-black uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-full inline-block">
                  Sekolah
                </span>
                <p className="font-black text-slate-800 text-xs mt-2">SD Negeri 1 Madiun</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Kurikulum Merdeka 🇮🇩</p>
              </div>
              <div className="bg-slate-50/90 hover:bg-purple-50/40 p-4 rounded-xl border border-slate-200/80 shadow-xs transition">
                <span className="text-[10px] text-purple-800 font-black uppercase tracking-wider bg-purple-100 px-2 py-0.5 rounded-full inline-block">
                  Bimbingan
                </span>
                <p className="font-black text-slate-800 text-xs mt-2">Ibu Guru Pertiwi, S.Pd.</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Guru Kelas SD</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              <span>Ruang Belajar Digital Siswa · </span>
              <strong className="text-slate-800 font-semibold">SD Negeri 1 Madiun</strong>
              <span className="text-slate-400 ml-1.5">
                © 2026 ExplainMyLesson SD. Seluruh Hak Cipta Dilindungi.
              </span>
            </div>
            <div className="text-slate-400">
              Stack: React 18 · Vite 5 · TypeScript · Tailwind · Zustand · Web Audio API
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
