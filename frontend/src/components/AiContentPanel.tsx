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
import { useEffect, useMemo, useState } from "react";

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
        title: `Ringkasan Modul & Pengamalan: ${activeValidatedModule.chapterCode} - ${activeValidatedModule.title}`,
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

  // Membersihkan suara jika berganti bab/mode atau komponen di-unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      setIsPlaying(false);
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
            {stripEmojis(content.title).replace(/^Ringkasan Modul & Pengamalan:\s*/i, "Materi Pembelajaran: ")}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 mt-0.5">
            Rangkuman materi seru dan contoh perbuatan baik sehari-hari untuk anak hebat 🌟
          </p>
        </div>
      </div>

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

          // Kartu pertama / Pengertian dibuat menonjol sebagai dasar pemahaman
          const isDefinitionCard =
            idx === 0 ||
            (prefix && prefix.toLowerCase().includes("pengertian")) ||
            (prefix && prefix.toLowerCase().includes("pangertosan")) ||
            (prefix && prefix.toLowerCase().includes("arti kata"));

          const colors = [
            "bg-blue-50/95 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-950 dark:text-blue-100",
            "bg-yellow-50/90 dark:bg-yellow-950/35 border-yellow-300 dark:border-yellow-700/60 text-yellow-950 dark:text-yellow-100",
            "bg-teal-50/90 dark:bg-teal-950/35 border-teal-300 dark:border-teal-700/60 text-teal-950 dark:text-teal-100",
            "bg-purple-50/90 dark:bg-purple-950/35 border-purple-300 dark:border-purple-700/60 text-purple-950 dark:text-purple-100",
            "bg-pink-50/90 dark:bg-pink-950/35 border-pink-300 dark:border-pink-700/60 text-pink-950 dark:text-pink-100",
            "bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-300 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-100",
          ];
          const style = isDefinitionCard
            ? "bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-slate-800 dark:via-blue-950/40 dark:to-slate-800 border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-300/40 dark:ring-blue-800/40"
            : colors[idx % colors.length];

          return (
            <div
              key={`${content.title}-${idx}`}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all hover:shadow-md ${style}`}
            >
              {prefix ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {isDefinitionCard && (
                      <span className="inline-flex items-center whitespace-nowrap text-[11px] font-extrabold bg-blue-600 text-white px-3 py-1 rounded-lg shadow-xs tracking-wide">
                        Pengertian Dasar
                      </span>
                    )}
                    <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      {prefix}
                    </h4>
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
