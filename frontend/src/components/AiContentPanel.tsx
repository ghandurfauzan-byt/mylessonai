// src/components/AiContentPanel.tsx — Papan Tulis Dongeng AI (SD)

import { ListSkeleton } from "@/components/AsyncStateBanners";
import ClaimPointsButton from "@/components/ClaimPointsButton";
import { useAiContentQuery } from "@/hooks/useAiContentQuery";
import {
  playClickSound,
  playCoinSound,
  playRobotAwakeSound,
  startSpeaking,
  stopSpeaking,
} from "@/lib/soundEffects";
import { useUIStore } from "@/lib/store/useUIStore";
import type { AiMode } from "@shared/catalog";
import { useEffect, useMemo, useRef, useState } from "react";

export default function AiContentPanel({
  chapterId,
  mode,
  refreshNonce,
}: {
  chapterId: string;
  mode: AiMode;
  refreshNonce: string;
}) {
  const activeValidatedModule = useUIStore((s) => s.activeValidatedModule);
  const {
    data: contentFromApi,
    isLoading,
    isError,
    error,
  } = useAiContentQuery(chapterId, mode, refreshNonce);

  // Jika materi modul aktif guru tersedia dan cocok, tampilkan langsung
  const cleanChapterId = (chapterId || "").replace("mod-", "");
  const cleanActiveId = (activeValidatedModule?.id || "").replace("mod-", "");

  const isViewingActiveModule =
    !chapterId ||
    chapterId === "active" ||
    chapterId === activeValidatedModule?.id ||
    (Boolean(cleanActiveId) && cleanChapterId === cleanActiveId);

  const content = useMemo(() => {
    if (isViewingActiveModule && activeValidatedModule?.ragSummary?.length) {
      return {
        title: `Pemaparan Materi: ${activeValidatedModule.chapterCode} - ${activeValidatedModule.title}`,
        body: activeValidatedModule.ragSummary,
      };
    }
    return contentFromApi;
  }, [
    isViewingActiveModule,
    activeValidatedModule?.id,
    activeValidatedModule?.chapterCode,
    activeValidatedModule?.title,
    activeValidatedModule?.ragSummary,
    contentFromApi,
  ]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState<number>(0);
  const [timelineViewMode, setTimelineViewMode] = useState<"stepper" | "vertical">("stepper");
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Membersihkan suara jika berganti bab/mode atau komponen di-unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      setIsPlaying(false);
      setSelectedTimelineIndex(0);
    };
  }, [chapterId, mode]);

  const completeDailyMission = useUIStore((s) => s.completeDailyMission);
  const addPoints = useUIStore((s) => s.addPoints);
  const dailyMissions = useUIStore((s) => s.dailyMissions);

  // Otomatis tandai materi telah dibaca & dipahami, dan berikan poin secara otomatis
  useEffect(() => {
    if (!content || !content.body || content.body.length === 0) return;

    const timer = setTimeout(() => {
      const currentMissions = useUIStore.getState().dailyMissions;
      if (!currentMissions.readSummary) {
        completeDailyMission("readSummary");
        addPoints(10, "Hebat! Kamu telah memahami materi yang disampaikan (+10 ⭐)");
        playCoinSound();
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [content, chapterId, completeDailyMission, addPoints]);

  function stripEmojis(text: string): string {
    return text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, "")
      .trim();
  }

  function cleanChildFriendlyBody(text: string): string {
    let cleaned = stripEmojis(text);

    // Transform adult learning objective / syllabus jargon into direct, warm child-friendly explanations
    cleaned = cleaned
      .replace(
        /Hakikat Materi:\s*Memahami prinsip pokok,?\s*ciri-ciri khas,?\s*serta fungsi esensial dari\s*/gi,
        "Arti pentingnya: "
      )
      .replace(
        /Keterkaitan Nyata:\s*Mengenali bagaimana konsep ini bekerja di masyarakat dan mengapa keberadaannya sangat berpengaruh terhadap kenyamanan hidup kita\.?/gi,
        "Penerapan di masyarakat: Bila semua orang terbiasa saling membantu, lingkungan menjadi bersih, aman, dan kita semua hidup tenteram."
      )
      .replace(
        /Pengetahuan Kritis:\s*Melatih siswa agar dapat membedakan tindakan yang benar,?\s*adil,?\s*dan bermanfaat bagi orang banyak\.?/gi,
        "Sikap yang baik: Kita belajar mendahulukan kebersamaan, bersikap adil, dan tidak mementingkan diri sendiri."
      )
      .replace(
        /Mempelajari materi ini melatih daya pikir kritis,?\s*memperluas wawasan kebangsaan,?\s*serta menumbuhkan rasa kepedulian sosial terhadap sesama sejak usia dini\.?/gi,
        "Mempelajari materi ini sangat penting agar kita tumbuh menjadi anak yang peduli, suka menolong teman, dan menciptakan suasana rukun di sekolah maupun di rumah."
      )
      .replace(
        /memberikan bekal pemahaman komprehensif bagi siswa kelas 4 SD\.?\s*Topik ini mengajarkan konsep dasar/gi,
        "mengajak kita memahami dan membiasakan nilai-nilai baik"
      )
      .replace(/^\s*[•\-\*]\s*/gm, "• ");

    return cleaned.trim();
  }

  function handleReadAloud() {
    if (!content) return;

    if (isPlaying) {
      playClickSound();
      stopSpeaking();
      setIsPlaying(false);
      return;
    }

    playRobotAwakeSound();
    const currentMissions = useUIStore.getState().dailyMissions;
    if (!currentMissions.listenedAudio) {
      completeDailyMission("listenedAudio");
      addPoints(10, "Keren! Kamu mendengarkan penjelasan materi (+10 ⭐)");
      playCoinSound();
    } else {
      completeDailyMission("listenedAudio");
    }

    // Bersihkan judul agar robot langsung to-the-point membahas topik bab
    const cleanTopic = stripEmojis(content.title)
      .replace(/^Ringkasan Modul & (?:Pengamalan|Trap-Trapan|Tuladha Budi Pekerti)?:?\s*/i, "")
      .replace(/^[A-Za-z\s]+:\s*/, "")
      .trim();

    // Bersihkan emoji dan label prefix (apapun kata sebelum titik dua)
    const cleanBodyLines = content.body.map((p) => {
      const cleaned = cleanChildFriendlyBody(p);
      return cleaned.replace(/^[^\w\s]*\s*[^:]+:\s*/, "").trim();
    });

    const textToRead = `Halo adik-adik! Bab ini tentang ${cleanTopic}. ${cleanBodyLines.join(". ")}`;

    setIsPlaying(true);
    startSpeaking({
      text: textToRead,
      rate: 0.95,
      pitch: 1.15,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  }

  if (!content && isLoading) {
    return (
      <div className="space-y-4 p-6 animate-pulse">
        <div className="h-8 bg-sky-200 rounded-full w-2/3" />
        <div className="h-4 bg-sky-100 rounded-full w-1/3" />
        <div className="pt-4 space-y-3">
          <ListSkeleton rows={5} />
        </div>
      </div>
    );
  }

  if (isError || !content) {
    return (
      <div className="bg-rose-100 border-4 border-rose-300 text-rose-800 text-sm font-bold p-6 rounded-3xl space-y-3 text-center">
        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-rose-200 dark:bg-rose-900 flex items-center justify-center text-rose-700 dark:text-rose-200 font-black text-sm">
          INFO
        </div>
        <p>Yaaah... Ceritanya belum dapat dimuat. Coba lagi ya!</p>
        <div className="flex justify-center mt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
          >
            Muat Ulang Halaman 🔄
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Top Header & RAG Badge */}
      <div className="space-y-2.5 border-b-2 border-sky-100 dark:border-slate-800 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReadAloud}
              className={`text-xs font-black px-4 py-2 rounded-full border-2 transition shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer ${
                isPlaying
                  ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 shadow-md animate-pulse"
                  : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 dark:border-blue-500 shadow-md hover:scale-105"
              }`}
              title={isPlaying ? "Klik untuk menghentikan suara" : "Klik untuk mendengarkan penjelasan materi"}
            >
              <span>{isPlaying ? "⏹️" : "🔊"}</span>
              <span>{isPlaying ? "Hentikan Suara" : "Dengarkan Penjelasan"}</span>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-sky-900 dark:text-sky-300 tracking-tight">
            {stripEmojis(content.title)
              .replace(/^Ringkasan Modul & (?:Pengamalan|Trap-Trapan|Tuladha Budi Pekerti)?:?\s*/i, "Pemaparan Materi: ")
              .replace(/^Pemaparan Materi:\s*Pemaparan Materi:\s*/i, "Pemaparan Materi: ")}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 mt-0.5">
            Pemaparan materi lengkap, sejarah singkat, dan konsep pemahaman untuk anak hebat 🌟
          </p>
        </div>
      </div>

      {/* Visual Interaktif Khusus Aksara Jawa */}
      {(() => {
        const rawT = (content.title + " " + chapterId).toLowerCase();
        if (!rawT.includes("aksara") && !rawT.includes("sandhangan")) return null;

        const aksaraRows = [
          {
            label: "Baris 1 (Ana Utusan)",
            meaning: "Ada dua orang utusan setia",
            items: [
              { glyph: "ꦲ", latin: "Ha", sound: "Ha" },
              { glyph: "ꦤ", latin: "Na", sound: "Na" },
              { glyph: "ꦕ", latin: "Ca", sound: "Ca" },
              { glyph: "ꦫ", latin: "Ra", sound: "Ra" },
              { glyph: "ꦏ", latin: "Ka", sound: "Ka" },
            ],
          },
          {
            label: "Baris 2 (Padha Padudon)",
            meaning: "Saling berselisih memegang teguh amanah",
            items: [
              { glyph: "ꦢ", latin: "Da", sound: "Da" },
              { glyph: "ꦠ", latin: "Ta", sound: "Ta" },
              { glyph: "ꦱ", latin: "Sa", sound: "Sa" },
              { glyph: "ꦮ", latin: "Wa", sound: "Wa" },
              { glyph: "ꦭ", latin: "La", sound: "La" },
            ],
          },
          {
            label: "Baris 3 (Padha Jayanya)",
            meaning: "Keduanya sama-sama sakti mandraguna",
            items: [
              { glyph: "ꦥ", latin: "Pa", sound: "Pa" },
              { glyph: "ꦝ", latin: "Dha", sound: "Dha" },
              { glyph: "ꦗ", latin: "Ja", sound: "Ja" },
              { glyph: "ꦪ", latin: "Ya", sound: "Ya" },
              { glyph: "ꦚ", latin: "Nya", sound: "Nya" },
            ],
          },
          {
            label: "Baris 4 (Maga Bathanga)",
            meaning: "Sama-sama gugur memenuhi sumpah setia",
            items: [
              { glyph: "ꦩ", latin: "Ma", sound: "Ma" },
              { glyph: "ꦒ", latin: "Ga", sound: "Ga" },
              { glyph: "ꦧ", latin: "Ba", sound: "Ba" },
              { glyph: "ꦛ", latin: "Tha", sound: "Tha" },
              { glyph: "ꦔ", latin: "Nga", sound: "Nga" },
            ],
          },
        ];

        return (
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 dark:from-amber-950/40 dark:to-slate-900 border-3 border-amber-400 dark:border-amber-600 rounded-3xl p-4 sm:p-5 space-y-4 shadow-lg shadow-amber-500/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-300 dark:border-amber-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                  <span>📜</span>
                  <span>Papan Visual 20 Aksara Jawa Legena (Carakan)</span>
                </h3>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400">
                  Klik tiap huruf untuk mendengarkan lafal pengucapannya! 🔊
                </p>
              </div>
              <span className="text-[11px] font-black bg-amber-400 text-amber-950 px-3 py-1 rounded-full self-start sm:self-auto shadow-xs">
                20 Aksara Wutuh
              </span>
            </div>

            {/* Grid 4 Baris Aksara */}
            <div className="space-y-3">
              {aksaraRows.map((row) => (
                <div key={row.label} className="bg-white/80 dark:bg-slate-800/80 rounded-2xl p-3 border border-amber-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-amber-900 dark:text-amber-300">
                    <span>{row.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">({row.meaning})</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {row.items.map((it) => (
                      <button
                        key={it.latin}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          startSpeaking({ text: `Aksara Jawa ${it.sound}`, rate: 0.9, pitch: 1.1 });
                        }}
                        className="bg-gradient-to-b from-amber-50 to-yellow-100 dark:from-slate-700 dark:to-slate-800 hover:from-amber-100 hover:to-yellow-200 border-2 border-amber-300 dark:border-amber-700/60 rounded-xl p-2 sm:p-2.5 text-center transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer group"
                      >
                        <div className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-yellow-300 group-hover:scale-110 transition-transform">
                          {it.glyph}
                        </div>
                        <div className="text-[11px] font-black text-amber-800 dark:text-amber-400 mt-1">
                          {it.latin}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Ringkasan Sandhangan Swara & Panyigeg */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-2xl border border-sky-200 dark:border-sky-800 text-xs space-y-1.5">
                <h4 className="font-black text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                  <span>🎵</span>
                  <span>Sandhangan Swara (Pengubah Bunyi Vokal)</span>
                </h4>
                <div className="grid grid-cols-5 gap-1 text-center font-bold text-[11px]">
                  <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-slate-700">Wulu (i) ꦶ</div>
                  <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-slate-700">Suku (u) ꦸ</div>
                  <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-slate-700">Pepet (e) ꦼ</div>
                  <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-slate-700">Taling (é) ꦺ</div>
                  <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-slate-700">T.Tarung (o) ꦺꦴ</div>
                </div>
              </div>

              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
                <h4 className="font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <span>🔇</span>
                  <span>Sandhangan Panyigeg (Konsonan Mati)</span>
                </h4>
                <div className="grid grid-cols-4 gap-1 text-center font-bold text-[11px]">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-slate-700">Layar (r) ꦂ</div>
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-slate-700">Cecak (ng) ꦁ</div>
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-slate-700">Wignyan (h) ꦃ</div>
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-slate-700">Pangkon (mati) ꧀</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Visual Interaktif Khusus Arane Anak Kewan */}
      {(() => {
        const rawT = (content.title + " " + chapterId).toLowerCase();
        if (!rawT.includes("kewan")) return null;

        const animals = [
          { name: "Bebek", anak: "Meri", icon: "🦆" },
          { name: "Sapi", anak: "Pedhet", icon: "🐄" },
          { name: "Kucing", anak: "Cemeng", icon: "🐱" },
          { name: "Pitik", anak: "Kuthuk", icon: "🐥" },
          { name: "Wedhus", anak: "Cempe", icon: "🐐" },
          { name: "Gajah", anak: "Bledug", icon: "🐘" },
          { name: "Kodhok", anak: "Precel", icon: "🐸" },
          { name: "Jaran", anak: "Belo", icon: "🐴" },
          { name: "Macan", anak: "Gogor", icon: "🐯" },
          { name: "Baya", anak: "Rete", icon: "🐊" },
        ];

        return (
          <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-green-500/10 dark:from-emerald-950/40 dark:to-slate-900 border-3 border-emerald-400 dark:border-emerald-600 rounded-3xl p-4 sm:p-5 space-y-4 shadow-lg shadow-emerald-500/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-300 dark:border-emerald-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                  <span>🐾</span>
                  <span>Papan Kawruh Jeneng Arane Anak Kewan</span>
                </h3>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                  Klik kartu hewan untuk mendengarkan nama anaknya dalam Basa Jawa! 🔊
                </p>
              </div>
              <span className="text-[11px] font-black bg-emerald-400 text-emerald-950 px-3 py-1 rounded-full self-start sm:self-auto shadow-xs">
                10 Anak Kewan
              </span>
            </div>

            {/* Grid 10 Kartu Hewan & Anaknya */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {animals.map((a) => (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    startSpeaking({ text: `Anak ${a.name} arane ${a.anak}`, rate: 0.95, pitch: 1.1 });
                  }}
                  className="bg-white/90 dark:bg-slate-800/90 hover:bg-emerald-50 dark:hover:bg-slate-700/90 border-2 border-emerald-200 dark:border-emerald-700/60 rounded-2xl p-3 text-center transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer group"
                >
                  <div className="text-3xl mb-1 group-hover:scale-125 transition-transform">{a.icon}</div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{a.name}</div>
                  <div className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                    → {a.anak}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Visual Interaktif Khusus Basa Krama & Unggah-Ungguh Basa */}
      {(() => {
        const rawT = (content.title + " " + chapterId).toLowerCase();
        if (!rawT.includes("unggah") && !rawT.includes("krama") && !rawT.includes("tata krama")) return null;

        const kramaWords = [
          { ngoko: "Mangan", lugu: "Nedha", alus: "Dhahar", icon: "🍚", label: "Makan" },
          { ngoko: "Turu", lugu: "Tilem", alus: "Sare", icon: "🛏️", label: "Tidur" },
          { ngoko: "Lunga", lugu: "Kesah", alus: "Tindak", icon: "🚶", label: "Pergi" },
          { ngoko: "Tuku", lugu: "Tumbas", alus: "Mundhut", icon: "🛍️", label: "Membeli" },
          { ngoko: "Ndeleng", lugu: "Ningali", alus: "Mirsani", icon: "👀", label: "Melihat" },
          { ngoko: "Omah", lugu: "Griya", alus: "Dalem", icon: "🏠", label: "Rumah" },
          { ngoko: "Jeneng", lugu: "Nama", alus: "Asma", icon: "🏷️", label: "Nama" },
          { ngoko: "Teka", lugu: "Dugi", alus: "Rawuh", icon: "🚪", label: "Datang" },
        ];

        return (
          <div className="bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-purple-500/10 dark:from-indigo-950/40 dark:to-slate-900 border-3 border-indigo-400 dark:border-indigo-600 rounded-3xl p-4 sm:p-5 space-y-4 shadow-lg shadow-indigo-500/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-300 dark:border-indigo-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <span>💬</span>
                  <span>Papan Pasinaon Basa Krama &amp; Unggah-Ungguh Basa</span>
                </h3>
                <p className="text-xs font-bold text-indigo-800 dark:text-indigo-400">
                  Basa Krama digunakake kanggo matur marang Bapak/Ibu Guru, wong tuwa, lan simbah kanggo ngurmati.
                </p>
              </div>
              <span className="text-[11px] font-black bg-indigo-500 text-white px-3 py-1 rounded-full self-start sm:self-auto shadow-xs">
                Tembung &amp; Ukara
              </span>
            </div>

            {/* Kotak Fungsi Basa Krama Buat Apa */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-1">
                <div className="font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <span>👨‍👩‍👧</span>
                  <span>1. Kanggo Sapa?</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  Digunakake nalika matur marang Bapak/Ibu ing omah, Bapak/Ibu Guru ing sekolah, simbah, lan para sesepuh.
                </p>
              </div>
              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-1">
                <div className="font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>2. Buat Apa Fungsinya?</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  Supaya guneman dadi runtut, santun, lan ngurmati wong liya. Ajining dhiri dumunung ana ing lathi.
                </p>
              </div>
              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-1">
                <div className="font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <span>✨</span>
                  <span>3. Bedane Tingkatan</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  <b>Ngoko</b> = kanca sakelas. <b>Krama Lugu</b> = kanggo awake dhewe (nedha, tilem). <b>Krama Alus</b> = kagem tiyang sepuh (dhahar, sare).
                </p>
              </div>
            </div>

            {/* Tabel Tembung Ngoko -> Krama Lugu -> Krama Alus */}
            <div className="space-y-2">
              <div className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center justify-between">
                <span>📚 Tabel Tuladha Tembung (Klik kartu untuk mendengarkan lafal 🔊):</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Ngoko ➔ Krama Lugu ➔ Krama Alus</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {kramaWords.map((item) => (
                  <button
                    key={item.ngoko}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      startSpeaking({
                        text: `${item.ngoko}, krama lugune ${item.lugu}, krama aluse ${item.alus}`,
                        rate: 0.95,
                        pitch: 1.1,
                      });
                    }}
                    className="p-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-slate-750 border-2 border-indigo-200 dark:border-indigo-700/60 text-left transition hover:scale-103 active:scale-95 shadow-xs cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Ngoko: <span className="text-slate-900 dark:text-slate-100 font-black">{item.ngoko}</span>
                    </div>
                    <div className="text-xs font-black text-blue-700 dark:text-blue-300">
                      Lugu: {item.lugu}
                    </div>
                    <div className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                      Alus: {item.alus} ⭐
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contoh Kalimat (Ukara) Ngoko vs Krama Alus */}
            <div className="bg-white/95 dark:bg-slate-800/95 p-3 sm:p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
              <h4 className="font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <span>📝</span>
                <span>Tuladha Ukara (Contoh Kalimat Nyata di Keseharian):</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-slate-700/60 border border-indigo-200 dark:border-indigo-700">
                  <div className="text-slate-500 font-bold mb-0.5">Saat Menyapa / Bertanya ke Guru:</div>
                  <div className="font-black text-indigo-950 dark:text-indigo-200 leading-snug">
                    "Nyuwun sewu Bu Guru, kepareng kula badhe nyuwun pirsa babagan tugas sekolah."
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">(Bukan: "Bu Guru, aku arep takon tugas")</div>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-slate-700/60 border border-indigo-200 dark:border-indigo-700">
                  <div className="text-slate-500 font-bold mb-0.5">Menceritakan Orang Tua:</div>
                  <div className="font-black text-indigo-950 dark:text-indigo-200 leading-snug">
                    "Bapak saweg dhahar sekul goreng, dene Ibu saweg tindak dhateng peken."
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">(Bukan: "Bapak lagi mangan sega, Ibu lunga pasar")</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Visual Interaktif Khusus Geguritan (Puisi Basa Jawa) */}
      {(() => {
        const rawT = (content.title + " " + chapterId).toLowerCase();
        if (!rawT.includes("geguritan") && !rawT.includes("puisi")) return null;

        return (
          <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 dark:from-amber-950/40 dark:to-slate-900 border-3 border-amber-400 dark:border-amber-600 rounded-3xl p-4 sm:p-5 space-y-4 shadow-lg shadow-amber-500/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-300 dark:border-amber-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                  <span>📜</span>
                  <span>Papan Pasinaon Geguritan (Puisi Basa Jawa Gagrag Anyar)</span>
                </h3>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400">
                  Geguritan gagrag anyar yaiku puisi Jawa kang ora kaiket paugeran macapat, basane mentes, endah, lan puitis.
                </p>
              </div>
              <span className="text-[11px] font-black bg-amber-400 text-amber-950 px-3 py-1 rounded-full self-start sm:self-auto shadow-xs">
                Sastra &amp; Puisi
              </span>
            </div>

            {/* 3 Kotak Konsep Dasar Geguritan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-1">
                <div className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <span>📖</span>
                  <span>1. Geguritan Buat Apa?</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  Kanggo medharake rasa pangrasa ati (katresnan marang wong tuwa, rasa syukur marang Gusti, utawa tresna marang alam) kanthi basa kang endah.
                </p>
              </div>
              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-1">
                <div className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <span>✨</span>
                  <span>2. Ciri Khas Gagrag Anyar</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  <b>Ora kaiket paugeran</b>: Ora kaiket cacahing larik (guru gatra), suku kata (guru wilangan), utawa tibaning swara (guru lagu). Bebas nanging mentes!
                </p>
              </div>
              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-1">
                <div className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <span>🔍</span>
                  <span>3. Unsur Pambangun</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  <b>Tema</b> (ide pokok), <b>Diksi</b> (pilihan tembung endah), <b>Purwakanthi</b> (persamaan rima swara/sastra), lan <b>Amanat</b> (pesen luhur).
                </p>
              </div>
            </div>

            {/* Contoh Teks Geguritan Nyata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Geguritan 1: Ibu */}
              <div className="bg-white/95 dark:bg-slate-800/95 p-3.5 sm:p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-700 space-y-2.5">
                <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-2">
                  <div className="font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5 text-sm">
                    <span>❤️</span>
                    <span>Tuladha 1: "Ibu"</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      startSpeaking({
                        text: "Geguritan kanthi irah-irahan Ibu. Ibu... Rina wengi tansah ngusap luh ing pipiku. Ndonga puji marang Gusti Kang Murbeng Dumadi. Kagem putra-putrimu kang tansah mbok trisnani. Tresnamu tanpa upama, ora bakal sirna selawase.",
                        rate: 0.9,
                        pitch: 1.1,
                      });
                    }}
                    className="px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] flex items-center gap-1 cursor-pointer transition hover:scale-105 active:scale-95 shadow-xs"
                  >
                    <span>🔊</span>
                    <span>Dengarkan Puisi</span>
                  </button>
                </div>
                <div className="font-serif italic text-amber-950 dark:text-amber-100 space-y-1 text-xs leading-relaxed bg-amber-50/60 dark:bg-slate-700/50 p-3 rounded-xl border border-amber-200/60">
                  <p>Ibu...</p>
                  <p>Rina wengi tansah ngusap luh ing pipiku</p>
                  <p>Ndonga puji marang Gusti Kang Murbeng Dumadi</p>
                  <p>Kagem putra-putrimu kang tansah mbok trisnani</p>
                  <p>Tresnamu tanpa upama, ora bakal sirna selawase...</p>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                  💡 <b>Makna Geguritan:</b> Nggambarake katresnane ibu kang tanpa kendhat, tulus, lan tansah ndongakake anake rina lan wengi.
                </div>
              </div>

              {/* Geguritan 2: Sekolahanku */}
              <div className="bg-white/95 dark:bg-slate-800/95 p-3.5 sm:p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-700 space-y-2.5">
                <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-2">
                  <div className="font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5 text-sm">
                    <span>🏫</span>
                    <span>Tuladha 2: "Sekolahanku"</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      startSpeaking({
                        text: "Geguritan Sekolahanku. Sekolahanku endah asri. Papan kanggo golek ilmu lan wawasan. Bapak Ibu Guru mulang kanthi tulusing ati. Kanca-kancaku padha rukun sesandhingan.",
                        rate: 0.9,
                        pitch: 1.1,
                      });
                    }}
                    className="px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] flex items-center gap-1 cursor-pointer transition hover:scale-105 active:scale-95 shadow-xs"
                  >
                    <span>🔊</span>
                    <span>Dengarkan Puisi</span>
                  </button>
                </div>
                <div className="font-serif italic text-amber-950 dark:text-amber-100 space-y-1 text-xs leading-relaxed bg-amber-50/60 dark:bg-slate-700/50 p-3 rounded-xl border border-amber-200/60">
                  <p>Sekolahanku endah asri...</p>
                  <p>Papan kanggo golek ilmu lan wawasan</p>
                  <p>Bapak Ibu Guru mulang kanthi tulusing ati</p>
                  <p>Kanca-kancaku padha rukun sesandhingan...</p>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                  💡 <b>Makna Geguritan:</b> Nggambarake rasa seneng, syukur, lan semangat sinau ing sekolah amarga gurune tulus lan kancane rukun.
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Visual Interaktif Khusus Pancasila & Norma */}
      {(() => {
        const rawT = (content.title + " " + chapterId).toLowerCase();
        if (!rawT.includes("pancasila") && !rawT.includes("norma") && !rawT.includes("sila")) return null;

        const pancasilaSilas = [
          { sila: 1, simbol: "⭐", nama: "Bintang Emas", bunyi: "Ketuhanan Yang Maha Esa", makna: "Toleransi & ketaatan beragama" },
          { sila: 2, simbol: "🔗", nama: "Rantai Emas", bunyi: "Kemanusiaan yang Adil dan Beradab", makna: "Tolong-menolong & anti perundungan" },
          { sila: 3, simbol: "🌳", nama: "Pohon Beringin", bunyi: "Persatuan Indonesia", makna: "Rukun bersatu di atas keberagaman" },
          { sila: 4, simbol: "🐂", nama: "Kepala Banteng", bunyi: "Kerakyatan yang Dipimpin oleh Hikmat...", makna: "Musyawarah mufakat & gotong royong" },
          { sila: 5, simbol: "🌾", nama: "Padi dan Kapas", bunyi: "Keadilan Sosial bagi Seluruh Rakyat...", makna: "Bersikap adil & tidak mementingkan diri" },
        ];

        return (
          <div className="bg-gradient-to-br from-rose-500/10 via-red-500/10 to-amber-500/10 dark:from-rose-950/40 dark:to-slate-900 border-3 border-rose-400 dark:border-rose-600 rounded-3xl p-4 sm:p-5 space-y-4 shadow-lg shadow-rose-500/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-300 dark:border-rose-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-rose-950 dark:text-rose-200 flex items-center gap-2">
                  <span>🇮🇩</span>
                  <span>Papan Konsep: Pancasila Dasar Negara &amp; 4 Jenis Norma</span>
                </h3>
                <p className="text-xs font-bold text-rose-800 dark:text-rose-400">
                  Pancasila dirumuskan pada 1 Juni 1945 sebagai dasar negara dan pemersatu bangsa Indonesia.
                </p>
              </div>
              <span className="text-[11px] font-black bg-rose-500 text-white px-3 py-1 rounded-full self-start sm:self-auto shadow-xs">
                5 Sila &amp; 4 Norma
              </span>
            </div>

            {/* Grid 5 Sila & Simbolnya */}
            <div className="space-y-2">
              <div className="text-xs font-black text-rose-950 dark:text-rose-200">
                5 Simbol Perisai Garuda Pancasila (Klik untuk mendengarkan lafal 🔊):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {pancasilaSilas.map((s) => (
                  <button
                    key={s.sila}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      startSpeaking({
                        text: `Sila ke ${s.sila}, simbol ${s.nama}, berbunyi ${s.bunyi}. Makna utamanya: ${s.makna}.`,
                        rate: 0.95,
                        pitch: 1.1,
                      });
                    }}
                    className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 hover:bg-rose-50 dark:hover:bg-slate-750 border-2 border-rose-200 dark:border-rose-700/60 text-center transition hover:scale-103 active:scale-95 shadow-xs cursor-pointer group"
                  >
                    <div className="text-3xl mb-1 group-hover:scale-120 transition-transform">{s.simbol}</div>
                    <div className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">Sila Ke-{s.sila}</div>
                    <div className="text-xs font-black text-slate-800 dark:text-slate-100">{s.nama}</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1 line-clamp-2">
                      {s.bunyi}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Macam Norma & Contohnya */}
            <div className="bg-white/95 dark:bg-slate-800/95 p-3.5 sm:p-4 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-2 text-xs">
              <h4 className="font-black text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                <span>⚖️</span>
                <span>4 Macam Norma Aturan Hidup (Sanksi &amp; Contoh Konkret):</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-slate-700/60 border border-amber-200 dark:border-amber-700">
                  <div className="font-black text-amber-900 dark:text-amber-300">1. Norma Agama</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-0.5">Sumber: Wahyu Tuhan YME</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">Contoh: Sholat / ibadah tepat waktu, tidak boleh mencuri</div>
                  <div className="text-[10px] text-red-600 font-extrabold mt-1">Sanksi: Dosa &amp; balasan Tuhan</div>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-50/80 dark:bg-slate-700/60 border border-sky-200 dark:border-sky-700">
                  <div className="font-black text-sky-900 dark:text-sky-300">2. Norma Kesusilaan</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-0.5">Sumber: Hati nurani manusia</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">Contoh: Jujur saat ulangan, tidak menyontek, tidak berbohong</div>
                  <div className="text-[10px] text-red-600 font-extrabold mt-1">Sanksi: Rasa malu &amp; penyesalan</div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-slate-700/60 border border-purple-200 dark:border-purple-700">
                  <div className="font-black text-purple-900 dark:text-purple-300">3. Norma Kesopanan</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-0.5">Sumber: Tata krama adat warga</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">Contoh: Salim tangan guru/orang tua, mengetuk pintu saat bertamu</div>
                  <div className="text-[10px] text-red-600 font-extrabold mt-1">Sanksi: Ditegur atau dicap tak sopan</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-slate-700/60 border border-emerald-200 dark:border-emerald-700">
                  <div className="font-black text-emerald-900 dark:text-emerald-300">4. Norma Hukum</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-0.5">Sumber: Undang-undang negara</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">Contoh: Memakai helm motor, taat rambu lampu merah</div>
                  <div className="text-[10px] text-red-600 font-extrabold mt-1">Sanksi: Tilang, denda, penjara</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Visual Interaktif: Linimasa Sejarah & Kronologi Peristiwa Bangsa / Kebudayaan */}
      {(() => {
        const hasHistory = content.body.some((p) => {
          const l = p.toLowerCase();
          return (
            l.includes("sejarah") ||
            l.includes("kronologi") ||
            l.includes("asal-usul") ||
            l.includes("legenda") ||
            l.includes("majapahit") ||
            l.includes("bpupki") ||
            l.includes("sumpah pemuda")
          );
        });

        if (!hasHistory) return null;

        const milestones = [
          {
            year: "Abad XIV (1365)",
            shortYear: "1365 M",
            era: "Kerajaan Majapahit",
            title: "Kakawin Sutasoma & Bhinneka Tunggal Ika",
            desc: "Pujangga Mpu Tantular menulis bait suci dalam Kakawin Sutasoma: 'Bhinneka Tunggal Ika tan hana dharma mangrwa' sebagai pedoman kerukunan bangsa di era Prabu Hayam Wuruk dan Mahapatih Gajah Mada.",
            icon: "📜",
            color: "from-amber-500 to-yellow-600",
            speech: "Abad ke-14 pada era Kerajaan Majapahit. Pujangga Mpu Tantular menulis Kakawin Sutasoma yang melahirkan semboyan suci Bhinneka Tunggal Ika."
          },
          {
            year: "Abad XV-XVI (1500)",
            shortYear: "1500 M",
            era: "Kasultanan Demak",
            title: "Sunan Kalijaga & Wayang Punokawan",
            desc: "Kanjeng Sunan Kalijaga menyempurnakan 4 tokoh Punokawan (Semar, Gareng, Petruk, Bagong) sebagai media dakwah Islam dan tuntunan watak budi pekerti luhur bagi rakyat dan para ksatria.",
            icon: "🎭",
            color: "from-orange-500 to-amber-600",
            speech: "Abad ke-15 hingga 16 di Kasultanan Demak. Kanjeng Sunan Kalijaga menciptakan tokoh Punokawan sebagai tuntunan akhlak luhur masyarakat Nusantara."
          },
          {
            year: "Legenda Jawa",
            shortYear: "Legenda",
            era: "Medang Kamulan",
            title: "Aji Saka & 20 Aksara Jawa Hanacaraka",
            desc: "Prabu Aji Saka menciptakan 20 aksara Jawa legena untuk mengabadikan kesetiaan abdinya, Dora dan Sembada, yang gugur membela amanah keris pusaka di Gunung Kendeng.",
            icon: "✍️",
            color: "from-yellow-600 to-amber-700",
            speech: "Legenda Medang Kamulan Tanah Jawa. Prabu Aji Saka menciptakan 20 aksara Jawa untuk mengenang kesetiaan Dora dan Sembada."
          },
          {
            year: "28 Oktober 1928",
            shortYear: "1928",
            era: "Kongres Pemuda II",
            title: "Sumpah Pemuda & Lagu Kebangsaan",
            desc: "Para pemuda pelajar dari Jong Java, Sumatra, Batak, Celebes, Ambon, dan Betawi mengikrarkan Sumpah Pemuda dan pertama kali mendengarkan alunan biola lagu Indonesia Raya ciptaan W.R. Supratman.",
            icon: "🎻",
            color: "from-emerald-600 to-teal-700",
            speech: "28 Oktober 1928 di Gedung Kramat 106 Jakarta. Kongres Pemuda II melahirkan ikrar Sumpah Pemuda dan lagu kebangsaan Indonesia Raya ciptaan Wage Rudolf Supratman."
          },
          {
            year: "1 Juni 1945",
            shortYear: "1 Jun 1945",
            era: "Sidang BPUPKI",
            title: "Pidato Bung Karno & Lahir Pancasila",
            desc: "Dalam sidang BPUPKI di Gedung Chuo Sangi In, Ir. Soekarno berpidato membakar semangat tanpa teks mengusulkan lima prinsip dasar falsafah negara yang dinamai Pancasila.",
            icon: "⭐",
            color: "from-rose-500 to-red-600",
            speech: "1 Juni 1945 dalam sidang BPUPKI. Bung Karno berpidato dengan penuh semangat mencetuskan falsafah dasar negara Pancasila."
          },
          {
            year: "17-18 Agustus 1945",
            shortYear: "17 Ags 1945",
            era: "Proklamasi & PPKI",
            title: "Kemerdekaan RI & Pengesahan UUD",
            desc: "Sang Saka Merah Putih dijahit tangan oleh Ibu Fatmawati berkibar saat proklamasi. Keesokan harinya sidang PPKI 18 Agustus mengesahkan UUD 1945 dan menetapkan Pancasila sebagai Dasar Negara.",
            icon: "🚩",
            color: "from-red-600 to-rose-700",
            speech: "17 dan 18 Agustus 1945. Proklamasi Kemerdekaan RI dengan bendera jahitan tangan Ibu Fatmawati serta pengesahan UUD 1945 dan Pancasila oleh PPKI."
          },
          {
            year: "11 Februari 1950",
            shortYear: "1950",
            era: "Kabinet RIS",
            title: "Peresmian Garuda Pancasila",
            desc: "Dirancang oleh Sultan Hamid II dari Pontianak dan disempurnakan langsung Bung Karno dengan menambahkan jambul gagah serta pita semboyan Bhinneka Tunggal Ika yang dicengkeram di depan kedua kaki garuda.",
            icon: "🦅",
            color: "from-amber-600 to-yellow-600",
            speech: "11 Februari 1950. Peresmian Lambang Garuda Pancasila rancangan Sultan Hamid II yang disempurnakan Presiden Soekarno."
          }
        ];

        return (
          <div className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-yellow-500/15 dark:from-amber-950/40 dark:to-slate-900 border-3 border-amber-400 dark:border-amber-600 rounded-3xl p-4 sm:p-6 space-y-5 shadow-lg shadow-amber-500/10">
            {/* Header Linimasa dengan Mode Bentuk Tampilan & Indikator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-300 dark:border-amber-800 pb-3.5">
              <div>
                <h3 className="text-base sm:text-lg font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                  <span>🏛️</span>
                  <span>Jalur Linimasa Sejarah &amp; Peristiwa Bangsa</span>
                </h3>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400">
                  Telusuri tonggak perjalanan sejarah Nusantara dari masa ke masa! 🎧
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* Switch Bentuk Tampilan: Jalur Peta Waktu vs Pita Vertikal */}
                <div className="flex items-center bg-amber-200/80 dark:bg-slate-800 p-1 rounded-xl border border-amber-300 dark:border-amber-700 shadow-2xs text-xs font-black">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setTimelineViewMode("stepper");
                    }}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      timelineViewMode === "stepper"
                        ? "bg-white dark:bg-amber-600 text-amber-950 dark:text-white shadow-xs font-black"
                        : "text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-slate-700 font-bold"
                    }`}
                  >
                    <span>🛣️</span>
                    <span>Jalur Rel Waktu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setTimelineViewMode("vertical");
                    }}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      timelineViewMode === "vertical"
                        ? "bg-white dark:bg-amber-600 text-amber-950 dark:text-white shadow-xs font-black"
                        : "text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-slate-700 font-bold"
                    }`}
                  >
                    <span>📜</span>
                    <span>Pita Berurutan</span>
                  </button>
                </div>

                <span className="text-[11px] font-black bg-amber-400 text-amber-950 px-3 py-1.5 rounded-xl shadow-xs whitespace-nowrap">
                  Tonggak {selectedTimelineIndex + 1} / {milestones.length}
                </span>
              </div>
            </div>

            {/* TAMPILAN BENTUK 1: JALUR REL PETA WAKTU (HORIZONTAL CONNECTED MILESTONE ROADMAP) */}
            {timelineViewMode === "stepper" && (
              <div className="space-y-4">
                {/* Lintasan Rel Relasi Garis Waktu Berpenghubung */}
                <div
                  ref={timelineScrollRef}
                  className="relative overflow-x-auto pb-4 pt-2 px-2 scrollbar-thin scrollbar-thumb-amber-300 dark:scrollbar-thumb-amber-700 scroll-smooth"
                >
                  <div className="min-w-[700px] relative flex items-center justify-between px-6 pt-3 pb-2">
                    {/* Garis Rel Penghubung di Belakang Bulatan */}
                    <div className="absolute left-10 right-10 top-[40px] h-2.5 bg-amber-200 dark:bg-slate-700 rounded-full z-0 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 transition-all duration-300 rounded-full"
                        style={{
                          width: `${(selectedTimelineIndex / (milestones.length - 1)) * 100}%`,
                        }}
                      />
                    </div>

                    {milestones.map((m, mIdx) => {
                      const isSelected = selectedTimelineIndex === mIdx;
                      const isPassed = mIdx <= selectedTimelineIndex;
                      return (
                        <button
                          key={m.title}
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setSelectedTimelineIndex(mIdx);
                            startSpeaking({
                              text: `${m.title}. ${m.desc}`,
                              rate: 0.92,
                              pitch: 1.05,
                            });
                          }}
                          className="relative z-10 flex flex-col items-center group cursor-pointer transition-transform focus:outline-none"
                        >
                          {/* Tahun / Tag Era di Atas */}
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-2 transition-all shadow-2xs whitespace-nowrap ${
                              isSelected
                                ? "bg-amber-600 text-white ring-2 ring-amber-300 scale-105"
                                : isPassed
                                ? "bg-amber-300 text-amber-950 dark:bg-slate-700 dark:text-amber-200"
                                : "bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            {m.shortYear || m.year}
                          </span>

                          {/* Bulatan / Medali Tonggak Sejarah */}
                          <div
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 relative shadow-md ${
                              isSelected
                                ? "bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white ring-4 ring-amber-400/80 scale-115 shadow-xl -translate-y-1"
                                : isPassed
                                ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-slate-700 dark:to-slate-800 border-3 border-amber-400 text-amber-900 dark:text-amber-200 hover:scale-105"
                                : "bg-white dark:bg-slate-800 border-3 border-slate-300 dark:border-slate-700 text-slate-400 hover:border-amber-400 hover:scale-105"
                            }`}
                          >
                            <span>{m.icon}</span>

                            {/* Nomor Tonggak Kecil */}
                            <span
                              className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shadow-xs ${
                                isSelected
                                  ? "bg-rose-500 text-white ring-2 ring-white"
                                  : isPassed
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-400 text-white"
                              }`}
                            >
                              {mIdx + 1}
                            </span>
                          </div>

                          {/* Judul Singkat di Bawah */}
                          <span
                            className={`mt-2 text-[11px] font-extrabold text-center max-w-[85px] leading-tight line-clamp-2 transition-colors ${
                              isSelected
                                ? "text-amber-950 dark:text-amber-200 font-black scale-105"
                                : "text-slate-700 dark:text-slate-300 group-hover:text-amber-700"
                            }`}
                          >
                            {(m.title.split("&")[0] ?? m.title).trim()}
                          </span>

                          {/* Penanda Panah Menunjuk ke Bawah Jika Terpilih */}
                          {isSelected && (
                            <div className="w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-amber-500 mt-1 animate-bounce" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Panggung Kisah Tonggak Sejarah Terpilih */}
                {(() => {
                  const activeMilestone = milestones[selectedTimelineIndex] ?? milestones[0];
                  if (!activeMilestone) return null;

                  return (
                    <div className="bg-white/95 dark:bg-slate-800/95 p-4 sm:p-6 rounded-3xl border-3 border-amber-400 dark:border-amber-600 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      {/* Baris Atas Panggung: Medali Besar, Era, Judul, dan Tombol Suara */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 dark:border-amber-800/80 pb-4">
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-md shrink-0 ring-4 ring-amber-200 dark:ring-amber-900">
                            {activeMilestone.icon}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2.5 py-0.5 rounded-md shadow-2xs">
                                Tonggak {selectedTimelineIndex + 1} / {milestones.length}
                              </span>
                              <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-2.5 py-0.5 rounded-md">
                                {activeMilestone.era} • {activeMilestone.year}
                              </span>
                            </div>
                            <h4 className="font-black text-base sm:text-xl text-amber-950 dark:text-amber-100 mt-1">
                              {activeMilestone.title}
                            </h4>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            startSpeaking({
                              text: `${activeMilestone.title}. ${activeMilestone.desc}`,
                              rate: 0.92,
                              pitch: 1.05,
                            });
                          }}
                          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-md self-start sm:self-auto hover:shadow-lg"
                        >
                          <span className="text-base">🔊</span>
                          <span>Dengarkan Narasi Suara</span>
                        </button>
                      </div>

                      {/* Isi Cerita Sejarah Lengkap */}
                      <div className="bg-amber-50/70 dark:bg-slate-900/50 p-4 sm:p-5 rounded-2xl border border-amber-200/80 dark:border-amber-800/60">
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                          {activeMilestone.desc}
                        </p>
                      </div>

                      {/* Bar Navigasi Langkah: Sebelumnya & Selanjutnya */}
                      <div className="flex items-center justify-between pt-1 gap-2">
                        <button
                          type="button"
                          disabled={selectedTimelineIndex === 0}
                          onClick={() => {
                            playClickSound();
                            const prev = Math.max(0, selectedTimelineIndex - 1);
                            setSelectedTimelineIndex(prev);
                            const target = milestones[prev];
                            if (target) {
                              startSpeaking({
                                text: `${target.title}. ${target.desc}`,
                                rate: 0.92,
                                pitch: 1.05,
                              });
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                            selectedTimelineIndex === 0
                              ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                              : "bg-amber-100 text-amber-950 dark:bg-slate-700 dark:text-amber-200 hover:bg-amber-200 cursor-pointer shadow-xs active:scale-95"
                          }`}
                        >
                          <span>◀</span>
                          <span>Tonggak Sebelumnya</span>
                        </button>

                        {/* Indikator Titik 7 Tonggak */}
                        <div className="hidden sm:flex items-center gap-1.5">
                          {milestones.map((_, dotIdx) => (
                            <button
                              key={`dot-${dotIdx}`}
                              type="button"
                              onClick={() => {
                                playClickSound();
                                setSelectedTimelineIndex(dotIdx);
                              }}
                              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                                selectedTimelineIndex === dotIdx
                                  ? "w-7 bg-amber-500 shadow-xs"
                                  : "w-2.5 bg-amber-200 dark:bg-slate-700 hover:bg-amber-300"
                              }`}
                              title={`Menuju tonggak ${dotIdx + 1}`}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          disabled={selectedTimelineIndex === milestones.length - 1}
                          onClick={() => {
                            playClickSound();
                            const next = Math.min(milestones.length - 1, selectedTimelineIndex + 1);
                            setSelectedTimelineIndex(next);
                            const target = milestones[next];
                            if (target) {
                              startSpeaking({
                                text: `${target.title}. ${target.desc}`,
                                rate: 0.92,
                                pitch: 1.05,
                              });
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                            selectedTimelineIndex === milestones.length - 1
                              ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                              : "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-xs active:scale-95"
                          }`}
                        >
                          <span>Tonggak Berikutnya</span>
                          <span>▶</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAMPILAN BENTUK 2: PITA KRONOLOGI VERTIKAL (VERTICAL TIMELINE STREAM / RIBBON) */}
            {timelineViewMode === "vertical" && (
              <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-1 before:bg-gradient-to-b before:from-amber-400 before:via-orange-400 before:to-yellow-500">
                {milestones.map((m, mIdx) => {
                  const isSelected = selectedTimelineIndex === mIdx;
                  return (
                    <div
                      key={`vertical-${m.title}`}
                      className="relative flex items-start gap-3 sm:gap-4 group"
                    >
                      {/* Simpul Bulatan Garis Waktu Vertikal */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-black shadow-md transition-transform ${
                          isSelected
                            ? "bg-amber-500 text-white ring-4 ring-amber-300 scale-110"
                            : "bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-200 border-2 border-amber-400"
                        }`}
                      >
                        {mIdx + 1}
                      </div>

                      {/* Pita Kartu Peristiwa Horisontal */}
                      <div
                        onClick={() => {
                          playClickSound();
                          setSelectedTimelineIndex(mIdx);
                        }}
                        className={`flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
                          isSelected
                            ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 dark:border-amber-400 ring-2 ring-amber-400"
                            : "bg-white/95 dark:bg-slate-800/90 border-amber-200 dark:border-amber-800/60 hover:bg-amber-50/50"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/70 dark:border-amber-800/60 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl p-1.5 rounded-xl bg-amber-100 dark:bg-slate-700 shadow-2xs">
                              {m.icon}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                                  {m.era} • {m.year}
                                </span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 mt-0.5">
                                {m.title}
                              </h4>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playClickSound();
                              setSelectedTimelineIndex(mIdx);
                              startSpeaking({
                                text: `${m.title}. ${m.desc}`,
                                rate: 0.92,
                                pitch: 1.05,
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                          >
                            <span>🔊</span>
                            <span>Dengarkan</span>
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed pt-2.5">
                          {m.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Main Content Body */}
      <div className="space-y-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
        {content.body.map((paragraph, idx) => {
          const colonIdx = paragraph.indexOf(":");
          const hasPrefix =
            colonIdx > 0 && colonIdx < 80 && !paragraph.slice(0, colonIdx).includes("\n");
          const rawPrefix = hasPrefix ? paragraph.slice(0, colonIdx).trim() : null;
          const rawBody = hasPrefix ? paragraph.slice(colonIdx + 1).trim() : paragraph;
          const prefix = rawPrefix ? stripEmojis(rawPrefix) : null;
          const bodyText = cleanChildFriendlyBody(rawBody);

          // Kartu sejarah lengkap dideteksi dari kata kunci sejarah / riwayat / asal-usul
          const isHistoryCard = Boolean(
            prefix &&
              (prefix.toLowerCase().includes("sejarah") ||
                prefix.toLowerCase().includes("asal-usul") ||
                prefix.toLowerCase().includes("asal usul") ||
                prefix.toLowerCase().includes("riwayat") ||
                prefix.toLowerCase().includes("kronologi") ||
                prefix.toLowerCase().includes("legenda"))
          );

          // Kartu pertama / Pengertian dibuat menonjol sebagai dasar pemahaman
          const isDefinitionCard =
            !isHistoryCard &&
            (idx === 0 ||
              (prefix && prefix.toLowerCase().includes("pengertian")) ||
              (prefix && prefix.toLowerCase().includes("pangertosan")) ||
              (prefix && prefix.toLowerCase().includes("arti kata")));

          const colors = [
            "bg-blue-50/95 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-950 dark:text-blue-100",
            "bg-yellow-50/90 dark:bg-yellow-950/35 border-yellow-300 dark:border-yellow-700/60 text-yellow-950 dark:text-yellow-100",
            "bg-teal-50/90 dark:bg-teal-950/35 border-teal-300 dark:border-teal-700/60 text-teal-950 dark:text-teal-100",
            "bg-purple-50/90 dark:bg-purple-950/35 border-purple-300 dark:border-purple-700/60 text-purple-950 dark:text-purple-100",
            "bg-pink-50/90 dark:bg-pink-950/35 border-pink-300 dark:border-pink-700/60 text-pink-950 dark:text-pink-100",
            "bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-300 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-100",
          ];

          const style = isHistoryCard
            ? "bg-gradient-to-br from-amber-50 via-orange-50/70 to-yellow-50/90 dark:from-amber-950/45 dark:via-orange-950/35 dark:to-slate-800 border-amber-400 dark:border-amber-600 shadow-md ring-2 ring-amber-300/40 dark:ring-amber-700/40"
            : isDefinitionCard
            ? "bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-slate-800 dark:via-blue-950/40 dark:to-slate-800 border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-300/40 dark:ring-blue-800/40"
            : colors[idx % colors.length];

          return (
            <div
              key={`${content.title}-${idx}`}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all hover:shadow-md ${style}`}
            >
              {prefix ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {isHistoryCard ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-lg shadow-xs tracking-wide">
                          <span>🏛️</span>
                          <span>Sejarah Lengkap &amp; Kronologi</span>
                        </span>
                      ) : isDefinitionCard ? (
                        <span className="inline-flex items-center whitespace-nowrap text-[11px] font-extrabold bg-blue-600 text-white px-3 py-1 rounded-lg shadow-xs tracking-wide">
                          Pengertian Dasar
                        </span>
                      ) : null}
                      <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        {prefix}
                      </h4>
                    </div>

                    {isHistoryCard && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          startSpeaking({
                            text: `${prefix}. ${bodyText}`,
                            rate: 0.92,
                            pitch: 1.05,
                          });
                        }}
                        className="px-2.5 py-1 rounded-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black text-[11px] flex items-center gap-1.5 cursor-pointer transition hover:scale-105 active:scale-95 shadow-xs"
                        title="Dengarkan narasi kisah sejarah ini"
                      >
                        <span>🔊</span>
                        <span>Dengarkan Kisah Ini</span>
                      </button>
                    )}
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap text-xs sm:text-sm font-semibold opacity-95">
                    {bodyText}
                  </p>
                </div>
              ) : (
                <p className="leading-relaxed whitespace-pre-wrap text-xs sm:text-sm font-semibold">
                  {cleanChildFriendlyBody(paragraph)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer & Gamification CTA */}
      <div className="bg-gradient-to-r from-yellow-200 to-amber-300 dark:from-amber-950/60 dark:to-yellow-950/40 border-2 border-yellow-400 dark:border-amber-600 p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 mt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
            POIN
          </div>
          <div>
            <p className="font-black text-amber-900 dark:text-amber-200 text-base">
              {dailyMissions.readSummary
                ? "Materi Berhasil Dipahami! 🎉"
                : "Sedang Mempelajari & Memahami Materi..."}
            </p>
            <p className="text-amber-800 dark:text-amber-300 font-bold text-xs">
              {dailyMissions.readSummary
                ? "Poin prestasimu otomatis bertambah +10 ⭐ saat membaca atau mendengarkan penjelasan materi."
                : "Poin prestasimu otomatis bertambah saat kamu membaca atau mendengarkan materi ini!"}
            </p>
          </div>
        </div>
        <ClaimPointsButton key={chapterId} />
      </div>
    </div>
  );
}
