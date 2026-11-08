// frontend/src/components/AdaptiveEduGameModal.tsx
// Game Edukasi 3D Real Roblox-Style Engine: "Negeri Garuda: Petualangan 5 Sila & Misi Akbar"
// Sesuai Game Design Document (GDD) Lengkap:
// - FASE 0: Halaman Utama (Lobby - Lapangan Patung Garuda, Pak Guru Virtual, Papan Skor, 5 Pilar Belajar Bebas)
// - FASE 1: Zona 1 "Cahaya Ketuhanan" (Sila ke-1: 5 Simbol Kepercayaan & Toleransi Beragama)
// - FASE 2: Zona 2 "Rantai Kemanusiaan" (Sila ke-2: Tolong 3 Warga - Doni Jatuh, Ibu Siti Belanjaan, Lawan Bullying)
// - FASE 3: Zona 3 "Pohon Persatuan" (Sila ke-3: Scavenger Hunt 3 Daun Persatuan & Damai 3 Suku)
// - FASE 4: Zona 4 "Ruang Musyawarah" (Sila ke-4: Balai Desa, Meja Bundar, Musyawarah Mufakat 4 Siswa)
// - FASE 5: Zona 5 "Timbangan Keadilan" (Sila ke-5: Hakim Cilik Selesaikan 3 Kasus Keadilan Sosial)
// - FASE 6: Misi Akbar "Selamatkan Negeri Garuda" (Gotong Royong Satukan 5 Kristal Sila, Garuda Emas Menyala)
// - Adaptif otomatis untuk materi bab pelajaran lainnya (Bahasa Jawa / Mapel lain)

"use client";

import ModalPortal from "@/components/ModalPortal";
import {
  playBadgeFanfareSound,
  playClickSound,
  playCoinPickupSound,
  playCoinSound,
  playCorrectSound,
  playDashSound,
  playJumpSound,
  playKnockDoorSound,
  playOofSound,
  playRobotAwakeSound,
  playSpringJumpSound,
  startAdventureBgm,
  stopAdventureBgm,
} from "@/lib/soundEffects";
import { useUIStore } from "@/lib/store/useUIStore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chapter: string;
  chapterTitle?: string;
}

// Tipe Fase Petualangan Sesuai GDD
type GameZonePhase =
  | "lobby"
  | "zona1"
  | "zona2"
  | "zona3"
  | "zona4"
  | "zona5"
  | "misi_akbar"
  | "tamat";

interface PilarBelajar {
  sila: number;
  simbol: string;
  judul: string;
  penjelasan: string;
  contohAksi: string;
}

interface DialogModalState {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  characterName: string;
  characterAvatar: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  onSuccess?: () => void;
}

export default function AdaptiveEduGameModal({
  isOpen,
  onClose,
  chapter,
  chapterTitle,
}: Props) {
  const addPoints = useUIStore((s) => s.addPoints);
  const activeValidatedModule = useUIStore((s) => s.activeValidatedModule);

  const [resolvedTitle, setResolvedTitle] = useState<string>(chapterTitle || chapter);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentZone, setCurrentZone] = useState<GameZonePhase>("lobby");
  const [adventureScore, setAdventureScore] = useState(0);
  const [playerLives, setPlayerLives] = useState(3);
  const [isSprinting, setIsSprinting] = useState(false);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  // Progresi Misi Per Zona
  const [zona1Symbols, setZona1Symbols] = useState<number[]>([1, 2, 3, 4, 5]);
  const [zona1Found, setZona1Found] = useState<number[]>([]);
  const [zona2Helped, setZona2Helped] = useState<string[]>([]);
  const [zona3Leaves, setZona3Leaves] = useState<number[]>([]);
  const [zona4MusyawarahDone, setZona4MusyawarahDone] = useState(false);
  const [zona5CasesDone, setZona5CasesDone] = useState<number[]>([]);
  const [akbarCrystalsDone, setAkbarCrystalsDone] = useState<number[]>([]);

  // Dialog State untuk Interaksi ProximityPrompt
  const [dialogState, setDialogState] = useState<DialogModalState | null>(null);
  const [selectedPilar, setSelectedPilar] = useState<PilarBelajar | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showGuruPrompt, setShowGuruPrompt] = useState(false);

  // Mount Element Ref Callback untuk Three.js
  const [mountEl, setMountEl] = useState<HTMLDivElement | null>(null);

  // Deteksi genre otomatis (Jika materi Bahasa Jawa menggunakan puzzle kartu ceria)
  const isMatchingGenre = useMemo(() => {
    const c = (chapter || "").toLowerCase();
    const t = (resolvedTitle || "").toLowerCase();
    return (
      c.includes("bjawa") ||
      c.includes("aksara") ||
      c.includes("unggah") ||
      c.includes("punokawan") ||
      c.includes("pandhawa") ||
      t.includes("jawa") ||
      t.includes("aksara") ||
      t.includes("unggah") ||
      t.includes("punokawan") ||
      t.includes("pandhawa")
    );
  }, [chapter, resolvedTitle]);

  const gameType: "adventure" | "matching" = isMatchingGenre ? "matching" : "adventure";

  // Data 5 Pilar Belajar Bebas di Lobby
  const pilarMateriList: PilarBelajar[] = useMemo(() => [
    {
      sila: 1,
      simbol: "⭐",
      judul: "Sila ke-1: Ketuhanan Yang Maha Esa",
      penjelasan: "Mengakui keberadaan Tuhan Yang Maha Esa serta saling menghormati antarumat beragama tanpa memaksakan kehendak.",
      contohAksi: "Menjaga ketenangan saat teman berbeda agama sedang beribadah dan selalu berdoa sebelum belajar.",
    },
    {
      sila: 2,
      simbol: "⛓️",
      judul: "Sila ke-2: Kemanusiaan Yang Adil dan Beradab",
      penjelasan: "Menjunjung tinggi persamaan hak, harkat, dan martabat manusia serta gemar melakukan kegiatan kemanusiaan.",
      contohAksi: "Menolong teman yang terjatuh dari sepeda, menghibur teman yang sedih, dan tidak mengejek fisik kawan (anti-bullying).",
    },
    {
      sila: 3,
      simbol: "🌳",
      judul: "Sila ke-3: Persatuan Indonesia",
      penjelasan: "Mengutamakan persatuan dan kesatuan bangsa di atas kepentingan pribadi atau kelompok dengan semboyan Bhinneka Tunggal Ika.",
      contohAksi: "Bermain rukun bersama seluruh teman tanpa membedakan suku, bahasa daerah, atau asal pulau.",
    },
    {
      sila: 4,
      simbol: "🐂",
      judul: "Sila ke-4: Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan dalam Permusyawaratan/Perwakilan",
      penjelasan: "Mengambil keputusan untuk kepentingan bersama melalui jalan musyawarah mufakat dengan lapang dada.",
      contohAksi: "Memilih ketua kelas dan jadwal piket bersama-sama dengan mendengarkan pendapat seluruh siswa secara bijak.",
    },
    {
      sila: 5,
      simbol: "🌾",
      judul: "Sila ke-5: Keadilan Sosial bagi Seluruh Rakyat Indonesia",
      penjelasan: "Bersikap adil kepada sesama, menghormati hak orang lain, gemar bergotong royong, dan suka bekerja keras.",
      contohAksi: "Membagi tugas piket kebersihan kelas secara seimbang dan tidak membeda-bedakan perlakuan kepada teman.",
    },
  ], []);

  // Kontrol Musik Petualangan
  useEffect(() => {
    if (isOpen && gameStarted && bgmEnabled) {
      startAdventureBgm();
    }
    return () => {
      stopAdventureBgm();
    };
  }, [isOpen, gameStarted, bgmEnabled]);

  // Reset Saat Modal Dibuka
  useEffect(() => {
    if (isOpen) {
      setGameStarted(false);
      setCurrentZone("lobby");
      setAdventureScore(0);
      setPlayerLives(3);
      setZona1Found([]);
      setZona2Helped([]);
      setZona3Leaves([]);
      setZona4MusyawarahDone(false);
      setZona5CasesDone([]);
      setAkbarCrystalsDone([]);
      setDialogState(null);
      setSelectedPilar(null);
      setShowScoreboard(false);
      setShowGuruPrompt(false);
    }
  }, [isOpen]);

  // Input Keyboard Ref
  const keysRef = useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
    sprint: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
  });

  // State Posisi Pemain dalam 3D
  const playerPosRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 6 });

  // --------------------------------------------------------------------------
  // AKSI INTERAKSI ZONA & DIALOG SESUAI GDD
  // --------------------------------------------------------------------------

  // Buka Dialog Simbol Zona 1 (Sila 1)
  const triggerZona1Prompt = useCallback((symbolId: number) => {
    if (zona1Found.includes(symbolId)) {
      setActiveNotification("✨ Simbol Kepercayaan ini sudah menyala terang!");
      setTimeout(() => setActiveNotification(null), 2500);
      return;
    }

    const questionMap: Record<number, { title: string; q: string; opt: any[] }> = {
      1: {
        title: "Lentera Cahaya Doa (Kuil Nusantara)",
        q: "Teman sekelasmu yang berbeda agama sedang khusyuk berdoa sebelum makan siang. Sikap terbaikmu adalah:",
        opt: [
          { id: "A", text: "Menghormati dan menjaga ketenangan dengan tidak berisik.", isCorrect: true, explanation: "Tepat sekali! Menghormati ibadah orang lain adalah wujud nyata Sila ke-1." },
          { id: "B", text: "Mengajaknya bercanda dan menggodanya saat berdoa.", isCorrect: false, explanation: "Kurang tepat. Mengganggu orang yang sedang berdoa melanggar nilai toleransi." },
          { id: "C", text: "Menjauhinya karena cara berdoanya berbeda.", isCorrect: false, explanation: "Kurang tepat. Perbedaan keyakinan harus dihormati dengan sikap ramah." },
        ],
      },
      2: {
        title: "Kitab Budi Pekerti (Pos Moderasi)",
        q: "Ada hari besar keagamaan temanmu yang berbeda keyakinan. Tindakan toleransi yang tepat adalah:",
        opt: [
          { id: "A", text: "Mengucapkan selamat dengan ramah dan tulus persaudaraan.", isCorrect: true, explanation: "Luar biasa! Memberi selamat adalah bukti persaudaraan antarumat beragama." },
          { id: "B", text: "Mengejek tradisi perayaannya di depan teman lain.", isCorrect: false, explanation: "Salah. Kita tidak boleh mencela ajaran dan tradisi agama sahabat kita." },
          { id: "C", text: "Melarang teman lain untuk berteman dengannya.", isCorrect: false, explanation: "Salah. Sila ke-1 mengajarkan kerukunan hidup antarumat beragama." },
        ],
      },
      3: {
        title: "Bunga Melati Toleransi (Taman Damai)",
        q: "Di desamu akan dibangun tempat ibadah bagi warga yang berbeda agama. Sikap warga yang sesuai Pancasila adalah:",
        opt: [
          { id: "A", text: "Mendukung dan saling membantu menjaga keamanan bersama.", isCorrect: true, explanation: "Hebat! Setiap warga negara berhak beribadah menurut agamanya masing-masing." },
          { id: "B", text: "Menolak karena berbeda dengan mayoritas warga.", isCorrect: false, explanation: "Kurang bijak. Negara menjamin kebebasan beribadah seluruh rakyat." },
          { id: "C", text: "Mengabaikan dan tidak peduli lingkungan sekitar.", isCorrect: false, explanation: "Kurang baik. Kita harus menjaga kerukunan dan saling peduli." },
        ],
      },
      4: {
        title: "Lonceng Kedamaian (Pura Suci)",
        q: "Kamu melihat ada teman yang lupa membawa bekal saat berpuasa keagamaan. Sikapmu adalah:",
        opt: [
          { id: "A", text: "Menghormatinya dan tidak makan/minum dengan mencolok di depannya.", isCorrect: true, explanation: "Sangat terpuji! Menahan diri untuk menghormati teman yang berpuasa adalah empati luhur." },
          { id: "B", text: "Pamer makanan lezat di hadapannya agar dia tergoda.", isCorrect: false, explanation: "Tidak baik. Menggoda teman yang berpuasa bertentangan dengan adab toleransi." },
          { id: "C", text: "Memaksanya untuk membatalkan puasanya.", isCorrect: false, explanation: "Keliru. Kita wajib menghargai ibadah yang sedang dijalankan kawan kita." },
        ],
      },
      5: {
        title: "Kubah Persaudaraan (Puncak Cahaya)",
        q: "Apa inti utama makna Sila ke-1 'Ketuhanan Yang Maha Esa' bagi anak Indonesia?",
        opt: [
          { id: "A", text: "Bertaqwa kepada Tuhan serta hidup rukun berdampingan antarumat beragama.", isCorrect: true, explanation: "Sempurna! Rukun beragama adalah pondasi kokoh bangsa Indonesia." },
          { id: "B", text: "Memaksakan agama kita kepada orang lain yang berbeda.", isCorrect: false, explanation: "Salah. Tidak boleh ada paksaan dalam memilih keyakinan beragama." },
          { id: "C", text: "Hanya berteman dengan orang yang satu agama saja.", isCorrect: false, explanation: "Salah. Kita bersaudara dengan seluruh rakyat Indonesia." },
        ],
      },
    };

    const qData = questionMap[symbolId] ?? questionMap[1]!;
    if (!qData) return;
    setDialogState({
      isOpen: true,
      title: qData.title,
      characterName: "Pemuka Agama Nusantara",
      characterAvatar: "👳‍♂️",
      question: qData.q,
      options: qData.opt,
      onSuccess: () => {
        playCoinSound();
        playCorrectSound();
        setZona1Found((prev) => {
          const next = [...prev, symbolId];
          if (next.length >= 5) {
            playBadgeFanfareSound();
            setActiveNotification("🎉 5 Simbol Kepercayaan Menyala! Gerbang Zona 2 'Rantai Kemanusiaan' Telah Terbuka!");
            setCurrentZone("zona2");
          } else {
            setActiveNotification(`✨ Simbol ${symbolId} Menyala! (${next.length}/5 Simbol Terkumpul)`);
          }
          return next;
        });
        setAdventureScore((s) => s + 10);
      },
    });
  }, [zona1Found]);

  // Buka Dialog Misi Zona 2 (Sila 2: Tolong 3 Warga)
  const triggerZona2Prompt = useCallback((citizenId: string) => {
    if (zona2Helped.includes(citizenId)) {
      setActiveNotification("❤️ Warga ini sudah kamu tolong dengan tulus!");
      setTimeout(() => setActiveNotification(null), 2500);
      return;
    }

    if (citizenId === "doni") {
      setDialogState({
        isOpen: true,
        title: "Tolong Doni Terjatuh dari Sepeda",
        characterName: "Doni (Siswa Kelas 3 SD)",
        characterAvatar: "🚲",
        question: "Doni tergelincir di jalan desa dan lututnya berdarah. Apa tindakan pertolongan pertamamu?",
        options: [
          { id: "A", text: "Segera mendekat, membantunya berdiri, dan mengambil kotak P3K untuk mengobati lukanya.", isCorrect: true, explanation: "Hebat! Kamu menunjukkan rasa kemanusiaan dan tolong-menolong tanpa pamrih." },
          { id: "B", text: "Menertawakannya dan mengunggah videonya ke internet.", isCorrect: false, explanation: "Sangat tidak beradab! Sila ke-2 mengajarkan kita untuk beradab dan berempati." },
          { id: "C", text: "Berjalan melewatinya seolah-olah tidak terjadi apa-apa.", isCorrect: false, explanation: "Kurang peduli. Jika kawan celaka, kita wajib membantunya." },
        ],
        onSuccess: () => {
          playCorrectSound();
          setZona2Helped((prev) => {
            const next = [...prev, "doni"];
            if (next.length >= 3) {
              playBadgeFanfareSound();
              setActiveNotification("🎉 3 Warga Tertolong! Gerbang Zona 3 'Pohon Persatuan' Telah Terbuka!");
              setCurrentZone("zona3");
            } else {
              setActiveNotification(`🩹 Kamu berhasil menolong Doni! (${next.length}/3 Warga)`);
            }
            return next;
          });
          setAdventureScore((s) => s + 15);
        },
      });
    } else if (citizenId === "ibu_siti") {
      setDialogState({
        isOpen: true,
        title: "Bantu Ibu Siti Membawa Belanjaan",
        characterName: "Ibu Siti (Pedagang Sayur Desa)",
        characterAvatar: "👵",
        question: "Ibu Siti kerepotan membawa dua keranjang sayur berat melintasi jembatan. Sikapmu adalah:",
        options: [
          { id: "A", text: "Menyapa dengan sopan dan membawakan salah satu keranjang sampai ke rumahnya.", isCorrect: true, explanation: "Sikap luhur! Menghormati dan meringankan beban orang yang lebih tua adalah adab mulia." },
          { id: "B", text: "Meminta uang imbalan terlebih dahulu baru mau menolong.", isCorrect: false, explanation: "Salah. Menolong sesama manusia harus ikhlas tanpa meminta upah." },
          { id: "C", text: "Menonton saja sambil duduk santai di pagar.", isCorrect: false, explanation: "Salah. Kita harus peka terhadap kesusahan orang di sekitar kita." },
        ],
        onSuccess: () => {
          playCorrectSound();
          setZona2Helped((prev) => {
            const next = [...prev, "ibu_siti"];
            if (next.length >= 3) {
              playBadgeFanfareSound();
              setActiveNotification("🎉 3 Warga Tertolong! Gerbang Zona 3 'Pohon Persatuan' Telah Terbuka!");
              setCurrentZone("zona3");
            } else {
              setActiveNotification(`🧺 Kamu berhasil membantu Ibu Siti! (${next.length}/3 Warga)`);
            }
            return next;
          });
          setAdventureScore((s) => s + 15);
        },
      });
    } else if (citizenId === "rian_bullying") {
      setDialogState({
        isOpen: true,
        title: "Hentikan Ejekan (Anti-Bullying)",
        characterName: "Rian (Teman yang Bersedih)",
        characterAvatar: "😢",
        question: "Rian menangis karena diejek logat bicara dan bentuk fisiknya oleh anak lain. Apa tindakanmu?",
        options: [
          { id: "A", text: "Menegur pengejek secara tegas namun santun, merangkul Rian, dan mengajaknya bermain bersama.", isCorrect: true, explanation: "Pemberani dan adil! Semua manusia bermartabat sama di mata hukum dan Tuhan." },
          { id: "B", text: "Ikut menertawakan agar dianggap keren oleh anak-anak lain.", isCorrect: false, explanation: "Sangat keliru. Bullying melukai hati sesama dan merusak nilai kemanusiaan." },
          { id: "C", text: "Diam saja karena takut ikut dimusuhi.", isCorrect: false, explanation: "Kurang berani. Kita harus berani membela kebenaran dan keadilan." },
        ],
        onSuccess: () => {
          playCorrectSound();
          setZona2Helped((prev) => {
            const next = [...prev, "rian_bullying"];
            if (next.length >= 3) {
              playBadgeFanfareSound();
              setActiveNotification("🎉 3 Warga Tertolong! Gerbang Zona 3 'Pohon Persatuan' Telah Terbuka!");
              setCurrentZone("zona3");
            } else {
              setActiveNotification(`🛡️ Kamu berhasil membela Rian! (${next.length}/3 Warga)`);
            }
            return next;
          });
          setAdventureScore((s) => s + 15);
        },
      });
    }
  }, [zona2Helped]);

  // Buka Dialog Misi Zona 3 (Sila 3: Scavenger Hunt 3 Daun Persatuan)
  const triggerZona3Prompt = useCallback((leafId: number) => {
    if (zona3Leaves.includes(leafId)) {
      setActiveNotification("🍃 Daun Persatuan ini sudah kamu amankan!");
      setTimeout(() => setActiveNotification(null), 2500);
      return;
    }

    const qMap: Record<number, { title: string; q: string; opt: any[] }> = {
      1: {
        title: "Daun Persatuan I (Tepi Sungai Desa)",
        q: "Apa semboyan persatuan bangsa Indonesia yang tertulis di cengkeraman burung Garuda?",
        opt: [
          { id: "A", text: "Bhinneka Tunggal Ika (Berbeda-beda tetapi tetap satu jua).", isCorrect: true, explanation: "Benar sekali! Keberagaman suku dan bahasa adalah kekayaan yang menyatu." },
          { id: "B", text: "Bersatu Kita Runtuh, Bercerai Kita Teguh.", isCorrect: false, explanation: "Terbalik! Semboyan yang benar adalah bersatu kita teguh." },
          { id: "C", text: "Satu Nusa, Satu Bangsa, Beda Hak.", isCorrect: false, explanation: "Keliru. Hak seluruh bangsa Indonesia adalah setara." },
        ],
      },
      2: {
        title: "Daun Persatuan II (Bukit Suku Nusantara)",
        q: "Tiga suku desa sedang berselisih memperebutkan sumber air sungai. Solusi terbaik sesuai Sila ke-3 adalah:",
        opt: [
          { id: "A", text: "Bergotong royong membangun saluran air bersama agar semua suku mendapat aliran yang cukup.", isCorrect: true, explanation: "Bagus sekali! Gotong royong dan persatuan menyelesaikan konflik secara damai." },
          { id: "B", text: "Membiarkan suku yang paling kuat menguasai seluruh air sungai.", isCorrect: false, explanation: "Salah. Itu perpecahan dan ketidakadilan." },
          { id: "C", text: "Menyuruh salah satu suku pindah dari desa.", isCorrect: false, explanation: "Salah. Seluruh warga berhak tinggal dengan rukun dan damai." },
        ],
      },
      3: {
        title: "Daun Persatuan III (Akar Pohon Beringin)",
        q: "Simbol Sila ke-3 adalah Pohon Beringin. Apa filosofi luhur dari pohon ini?",
        opt: [
          { id: "A", text: "Pohon besar berakar gantung kokoh sebagai tempat berteduh seluruh rakyat Indonesia.", isCorrect: true, explanation: "Tepat sekali! Beringin melambangkan naungan persatuan yang rindang dan kuat." },
          { id: "B", text: "Pohon liar yang hanya tumbuh di satu daerah tertentu.", isCorrect: false, explanation: "Salah. Beringin melambangkan persatuan seluruh nusantara." },
          { id: "C", text: "Pohon yang mudah tumbang bila terkena angin.", isCorrect: false, explanation: "Salah. Pohon beringin akarnya sangat kokoh menancap ke bumi." },
        ],
      },
    };

    const qData = qMap[leafId] ?? qMap[1]!;
    if (!qData) return;
    setDialogState({
      isOpen: true,
      title: qData.title,
      characterName: "Tetua Suku Nusantara",
      characterAvatar: "🌳",
      question: qData.q,
      options: qData.opt,
      onSuccess: () => {
        playCoinSound();
        playCorrectSound();
        setZona3Leaves((prev) => {
          const next = [...prev, leafId];
          if (next.length >= 3) {
            playBadgeFanfareSound();
            setActiveNotification("🎉 3 Daun Persatuan Diserahkan! Ketiga Suku Rukun Berdamai! Gerbang Zona 4 Terbuka!");
            setCurrentZone("zona4");
          } else {
            setActiveNotification(`🍃 Daun Persatuan ${leafId} Ditemukan! (${next.length}/3 Daun)`);
          }
          return next;
        });
        setAdventureScore((s) => s + 20);
      },
    });
  }, [zona3Leaves]);

  // Buka Dialog Misi Zona 4 (Sila 4: Musyawarah Balai Desa)
  const triggerZona4Prompt = useCallback(() => {
    if (zona4MusyawarahDone) {
      setActiveNotification("🗳️ Musyawarah Mufakat telah berhasil disepakati!");
      setTimeout(() => setActiveNotification(null), 2500);
      return;
    }

    setDialogState({
      isOpen: true,
      title: "Ruang Musyawarah: Penentuan Kegiatan Class Meeting",
      characterName: "Edo, Siti, Beni, Dayu (4 Siswa Perwakilan)",
      characterAvatar: "🗣️",
      question: "Edo ingin futsal, Siti ingin cerdas cermat, Beni ingin lomba melukis, dan Dayu ingin pentas tari. Bagaimana cara memimpin musyawarah yang bijak?",
      options: [
        { id: "A", text: "Dengarkan semua usulan, rangkum kelebihan masing-masing, dan sepakati 'Pekan Budaya & Olahraga Terpadu' agar semua minat terwadahi.", isCorrect: true, explanation: "Luar biasa! Musyawarah mufakat menghasilkan mufakat yang memuaskan seluruh pihak dengan rasa kebersamaan." },
        { id: "B", text: "Langsung voting kilat tanpa memberi kesempatan Siti dan Dayu berbicara.", isCorrect: false, explanation: "Kurang demokratis. Semua peserta musyawarah berhak menyampaikan gagasannya." },
        { id: "C", text: "Ketua menentukan sendiri kegiatan yang dia sukai tanpa peduli yang lain.", isCorrect: false, explanation: "Otoriter! Sila ke-4 melarang pemaksaan kehendak pribadi." },
      ],
      onSuccess: () => {
        playBadgeFanfareSound();
        setZona4MusyawarahDone(true);
        setActiveNotification("🎉 Mufakat Tercapai! Semua Siswa Puas & Bahagia! Gerbang Zona 5 'Timbangan Keadilan' Terbuka!");
        setCurrentZone("zona5");
        setAdventureScore((s) => s + 25);
      },
    });
  }, [zona4MusyawarahDone]);

  // Buka Dialog Misi Zona 5 (Sila 5: Hakim Cilik Keadilan Sosial)
  const triggerZona5Prompt = useCallback((caseId: number) => {
    if (zona5CasesDone.includes(caseId)) {
      setActiveNotification("⚖️ Kasus Keadilan ini sudah kamu putuskan secara adil!");
      setTimeout(() => setActiveNotification(null), 2500);
      return;
    }

    const cMap: Record<number, { title: string; q: string; opt: any[] }> = {
      1: {
        title: "Kasus I: Pembagian Tugas Kelompok Belajar",
        q: "Dua anggota kelompok ingin hanya menulis nama saja tanpa mengerjakan materi presentasi. Keputusan Hakim Cilik:",
        opt: [
          { id: "A", text: "Bagi tugas secara proporsional sesuai kemampuan masing-masing anggota agar adil merata.", isCorrect: true, explanation: "Sangat adil! Setiap hak harus diimbangi dengan kewajiban yang seimbang." },
          { id: "B", text: "Biarkan saja mereka malas karena mereka anak orang kaya.", isCorrect: false, explanation: "Salah besar! Keadilan tidak memandang kekayaan atau kedudukan." },
          { id: "C", text: "Keluarkan mereka dari sekolah secara sepihak.", isCorrect: false, explanation: "Berlebihan. Bimbingan dan pembagian tugas adil adalah solusi bijak." },
        ],
      },
      2: {
        title: "Kasus II: Fasilitas Membaca di Perpustakaan Desa",
        q: "Buku ensiklopedia favorit di perpustakaan sangat diminati banyak siswa. Tindakan yang mencerminkan keadilan sosial:",
        opt: [
          { id: "A", text: "Menerapkan sistem antrean peminjaman bergiliran secara teratur bagi seluruh siswa tanpa pilih kasih.", isCorrect: true, explanation: "Bijaksana! Keadilan sosial memberikan akses yang sama bagi seluruh warga sekolah." },
          { id: "B", text: "Memberikan buku tersebut selamanya hanya kepada juara kelas saja.", isCorrect: false, explanation: "Kurang adil. Seluruh siswa berhak membaca dan mengembangkan diri." },
          { id: "C", text: "Menyembunyikan buku agar tidak ada yang bisa membaca.", isCorrect: false, explanation: "Tindakan egois yang merugikan orang banyak." },
        ],
      },
      3: {
        title: "Kasus III: Penghargaan Hasil Gotong Royong",
        q: "Kelompokmu memenangkan piala kebersihan kelas berkat kerja keras bersama seluruh anggota. Sikap ketua kelompok:",
        opt: [
          { id: "A", text: "Menyampaikan terima kasih kepada seluruh anggota dan merayakan kemenangan bersama secara setara.", isCorrect: true, explanation: "Sikap pemimpin Pancasila sejati! Menghargai hasil karya orang lain adalah butir Sila ke-5." },
          { id: "B", text: "Mengaku bahwa piala itu murni hasil kerja keras ketua seorang diri.", isCorrect: false, explanation: "Egois dan curang. Mengabaikan jerih payah kawan melanggar Sila ke-5." },
          { id: "C", text: "Membuang piala karena merasa hadiahnya kurang mewah.", isCorrect: false, explanation: "Tidak bersyukur dan tidak menghargai usaha bersama." },
        ],
      },
    };

    const qData = cMap[caseId] ?? cMap[1]!;
    if (!qData) return;
    setDialogState({
      isOpen: true,
      title: qData.title,
      characterName: "Dewi Keadilan Nusantara",
      characterAvatar: "⚖️",
      question: qData.q,
      options: qData.opt,
      onSuccess: () => {
        playCoinSound();
        playCorrectSound();
        setZona5CasesDone((prev) => {
          const next = [...prev, caseId];
          if (next.length >= 3) {
            playBadgeFanfareSound();
            setActiveNotification("🎉 3 Kasus Keadilan Selesai! Gerbang MISI AKBAR 'Selamatkan Negeri Garuda' Telah Terbuka!");
            setCurrentZone("misi_akbar");
          } else {
            setActiveNotification(`⚖️ Kasus ${caseId} Diputuskan Adil! (${next.length}/3 Kasus)`);
          }
          return next;
        });
        setAdventureScore((s) => s + 25);
      },
    });
  }, [zona5CasesDone]);

  // Buka Misi Akbar: Pulihkan Cahaya Garuda
  const triggerMisiAkbarPrompt = useCallback((crystalId: number) => {
    if (akbarCrystalsDone.includes(crystalId)) {
      setActiveNotification("💎 Kristal ini telah terpasang kokoh di Altar Garuda!");
      setTimeout(() => setActiveNotification(null), 2500);
      return;
    }

    const crystalTitles: Record<number, string> = {
      1: "Kristal Bintang Emas (Ketuhanan Yang Maha Esa) ⭐",
      2: "Kristal Rantai Baja (Kemanusiaan yang Adil dan Beradab) ⛓️",
      3: "Kristal Beringin Rindang (Persatuan Indonesia) 🌳",
      4: "Kristal Kepala Banteng (Hikmat Musyawarah Mufakat) 🐂",
      5: "Kristal Padi & Kapas (Keadilan Sosial Seluruh Rakyat) 🌾",
    };

    setDialogState({
      isOpen: true,
      title: `Altar Garuda: Pasang ${crystalTitles[crystalId]}`,
      characterName: "Garuda Emas Penjaga Negeri",
      characterAvatar: "🦅",
      question: `Gotong royong memulihkan Negeri Garuda! Serukan komitmen luhur pengamalan Sila ke-${crystalId}:`,
      options: [
        { id: "A", text: `Saya berjanji mengamalkan nilai luhur Sila ke-${crystalId} dalam kehidupan sehari-hari di rumah dan sekolah!`, isCorrect: true, explanation: "Garuda Emas bersorak bahagia! Ikrar sucimu membakar semangat kebangsaan." },
        { id: "B", text: "Hanya menghafal saat ulangan saja tapi tidak mempraktikkannya.", isCorrect: false, explanation: "Nilai Pancasila harus dipraktikkan nyata, bukan sekadar hafalan lisan." },
      ],
      onSuccess: () => {
        playCoinSound();
        playRobotAwakeSound();
        setAkbarCrystalsDone((prev) => {
          const next = [...prev, crystalId];
          if (next.length >= 5) {
            playBadgeFanfareSound();
            setCurrentZone("tamat");
            setActiveNotification("🏆 MAHA KARYA SELESAI! NEGERI GARUDA BERSINAR GEMILANG! KAMU PENJELAJAH PANCASILA SEJATI!");
            addPoints(50);
          } else {
            setActiveNotification(`💎 Kristal ${crystalId}/5 Berhasil Disematkan ke Altar Garuda!`);
          }
          return next;
        });
        setAdventureScore((s) => s + 30);
      },
    });
  }, [akbarCrystalsDone, addPoints]);

  // --------------------------------------------------------------------------
  // ENGINE 3D ROBLOX THREE.JS UNTUK NEGERI GARUDA
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (gameType !== "adventure" || !isOpen || !mountEl) return;

    const mount = mountEl;

    // 1. SETUP SCENE, CAMERA, & RENDERER
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#60a5fa"); // Langit Cerah Roblox
    scene.fog = new THREE.FogExp2("#93c5fd", 0.007);

    const getViewportSize = () => {
      const rect = mount.getBoundingClientRect();
      const w = rect.width > 50 ? Math.floor(rect.width) : (mount.clientWidth > 50 ? mount.clientWidth : window.innerWidth);
      const h = rect.height > 50 ? Math.floor(rect.height) : (mount.clientHeight > 50 ? mount.clientHeight : Math.max(300, window.innerHeight - 56));
      return { w, h };
    };

    const { w: initW, h: initH } = getViewportSize();

    const camera = new THREE.PerspectiveCamera(58, initW / initH, 0.1, 1000);
    camera.position.set(0, 4.2, 14.5);
    camera.lookAt(0, 1.6, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor("#60a5fa", 1);
    renderer.setSize(initW, initH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    mount.appendChild(renderer.domElement);

    // 2. LIGHTING (Terang & Bersahabat)
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.95);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight("#ffffff", "#445566", 0.85);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight("#fffbeb", 1.5);
    sunLight.position.set(30, 60, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // 3. TERRAIN BESAR NEGERI GARUDA (Lobby hingga Misi Akbar: Z = +20 s/d Z = -480)
    const groundGeo = new THREE.PlaneGeometry(100, 560);
    const groundMat = new THREE.MeshLambertMaterial({ color: "#4ade80" }); // Hijau Rumput Roblox
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, 0, -220);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Jalur Jalan Utama Desa (Yellow Sand Path)
    const pathGeo = new THREE.PlaneGeometry(12, 540);
    const pathMat = new THREE.MeshLambertMaterial({ color: "#fef08a" });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.02, -220);
    scene.add(pathMesh);

    // Dinding Pembatas Tebing Kiri & Kanan (Roblox Cliff)
    const wallGeo = new THREE.BoxGeometry(4, 18, 560);
    const wallMat = new THREE.MeshLambertMaterial({ color: "#b45309" });
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-48, 9, -220);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(48, 9, -220);
    scene.add(rightWall);

    // ------------------------------------------------------------------------
    // FASE 0: LOBBY & PATUNG GARUDA UTAMA DI TENGAH (Z = 0)
    // ------------------------------------------------------------------------
    const lobbyGroup = new THREE.Group();

    // Podium Marmer Patung Garuda
    const podGeo = new THREE.CylinderGeometry(6, 7.5, 2.5, 16);
    const podMat = new THREE.MeshLambertMaterial({ color: "#e2e8f0" });
    const podium = new THREE.Mesh(podGeo, podMat);
    podium.position.set(0, 1.25, 0);
    lobbyGroup.add(podium);

    // Patung Garuda Emas Megah
    const garudaMat = new THREE.MeshLambertMaterial({ color: "#facc15" });
    const bodyG = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.5, 1.6), garudaMat);
    bodyG.position.set(0, 4.25, 0);
    lobbyGroup.add(bodyG);

    // Sayap Garuda Kiri & Kanan
    const wingGeo = new THREE.BoxGeometry(3.6, 1.6, 0.4);
    const leftWing = new THREE.Mesh(wingGeo, garudaMat);
    leftWing.position.set(-3.2, 4.8, 0);
    leftWing.rotation.z = Math.PI / 8;
    lobbyGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, garudaMat);
    rightWing.position.set(3.2, 4.8, 0);
    rightWing.rotation.z = -Math.PI / 8;
    lobbyGroup.add(rightWing);

    // Kepala Garuda
    const headG = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.4), garudaMat);
    headG.position.set(0, 6.4, 0.4);
    lobbyGroup.add(headG);

    // Paruh Garuda
    const beakG = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 4), new THREE.MeshLambertMaterial({ color: "#ea580c" }));
    beakG.rotation.x = Math.PI / 2;
    beakG.position.set(0, 6.2, 1.3);
    lobbyGroup.add(beakG);

    scene.add(lobbyGroup);

    // NPC PAK GURU VIRTUAL DI LOBBY (Dekat Z = +6)
    const guruGroup = new THREE.Group();
    const guruBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.6, 0.8), new THREE.MeshLambertMaterial({ color: "#0284c7" })); // Baju Biru Pendidik
    guruBody.position.y = 2.2;
    guruGroup.add(guruBody);

    const guruHead = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), new THREE.MeshLambertMaterial({ color: "#fed7aa" }));
    guruHead.position.y = 3.45;
    guruGroup.add(guruHead);

    const guruPeci = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.4, 0.95), new THREE.MeshLambertMaterial({ color: "#0f172a" })); // Peci Hitam
    guruPeci.position.y = 3.95;
    guruGroup.add(guruPeci);

    // Label Pak Guru
    const guruCanvas = document.createElement("canvas");
    guruCanvas.width = 300;
    guruCanvas.height = 64;
    const gCtx = guruCanvas.getContext("2d")!;
    gCtx.fillStyle = "#ffffff";
    gCtx.font = "bold 26px sans-serif";
    gCtx.textAlign = "center";
    gCtx.fillText("👨‍🏫 Pak Guru Virtual", 150, 42);
    const guruTex = new THREE.CanvasTexture(guruCanvas);
    const guruSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: guruTex }));
    guruSprite.position.set(0, 4.8, 0);
    guruSprite.scale.set(3.2, 0.7, 1);
    guruGroup.add(guruSprite);

    guruGroup.position.set(-4, 0, 8);
    scene.add(guruGroup);

    // 5 PILAR BELAJAR BEBAS DI SEKELILING LOBBY
    const pilarColors = ["#facc15", "#f97316", "#22c55e", "#ef4444", "#eab308"];
    const pilarCoords = [
      { x: -14, z: 2, sila: 1 },
      { x: -9, z: -8, sila: 2 },
      { x: 0, z: -14, sila: 3 },
      { x: 9, z: -8, sila: 4 },
      { x: 14, z: 2, sila: 5 },
    ];

    pilarCoords.forEach((p, idx) => {
      const pGroup = new THREE.Group();
      const pMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.1, 5, 8),
        new THREE.MeshLambertMaterial({ color: pilarColors[idx] })
      );
      pMesh.position.y = 2.5;
      pGroup.add(pMesh);

      // Kristal / Simbol Mengapung di Atas Pilar
      const gemMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.0),
        new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: pilarColors[idx] })
      );
      gemMesh.position.y = 5.8;
      pGroup.add(gemMesh);

      pGroup.position.set(p.x, 0, p.z);
      scene.add(pGroup);
    });

    // ------------------------------------------------------------------------
    // FASE 1: ZONA 1 "CAHAYA KETUHANAN" (Z = -50 s/d Z = -90)
    // ------------------------------------------------------------------------
    const z1House = new THREE.Mesh(
      new THREE.BoxGeometry(16, 10, 14),
      new THREE.MeshLambertMaterial({ color: "#bae6fd" }) // Kuil Putih Langit
    );
    z1House.position.set(16, 5, -70);
    scene.add(z1House);

    // 5 Objek Simbol Kepercayaan di Zona 1
    const z1SymbolsMeshes: THREE.Mesh[] = [];
    const z1SymbolPositions = [
      { x: -5, z: -55, id: 1 }, // Lentera
      { x: 4, z: -62, id: 2 },  // Kitab
      { x: -3, z: -70, id: 3 }, // Bunga
      { x: 5, z: -78, id: 4 },  // Lonceng
      { x: -2, z: -85, id: 5 }, // Kubah
    ];

    z1SymbolPositions.forEach((pos) => {
      const symMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.8),
        new THREE.MeshLambertMaterial({ color: "#facc15", emissive: "#eab308" })
      );
      symMesh.position.set(pos.x, 1.4, pos.z);
      symMesh.castShadow = true;
      scene.add(symMesh);
      z1SymbolsMeshes.push(symMesh);
    });

    // ------------------------------------------------------------------------
    // FASE 2: ZONA 2 "RANTAI KEMANUSIAAN" (Z = -120 s/d Z = -160)
    // ------------------------------------------------------------------------
    // Desa Rumah Warga
    const z2House = new THREE.Mesh(
      new THREE.BoxGeometry(14, 8, 12),
      new THREE.MeshLambertMaterial({ color: "#fed7aa" })
    );
    z2House.position.set(-18, 4, -140);
    scene.add(z2House);

    // NPC Doni Jatuh Sepeda (Z = -128)
    const doniGroup = new THREE.Group();
    const doniBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.4), new THREE.MeshLambertMaterial({ color: "#ea580c" }));
    doniBody.position.y = 0.35;
    doniGroup.add(doniBody);
    doniGroup.position.set(3, 0, -128);
    scene.add(doniGroup);

    // NPC Ibu Siti Bawa Belanjaan (Z = -142)
    const sitiGroup = new THREE.Group();
    const sitiBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.7), new THREE.MeshLambertMaterial({ color: "#ec4899" }));
    sitiBody.position.y = 1.8;
    sitiGroup.add(sitiBody);
    sitiGroup.position.set(-4, 0, -142);
    scene.add(sitiGroup);

    // NPC Rian Korban Bullying (Z = -156)
    const rianGroup = new THREE.Group();
    const rianBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.7), new THREE.MeshLambertMaterial({ color: "#6366f1" }));
    rianBody.position.y = 1.8;
    rianGroup.add(rianBody);
    rianGroup.position.set(2, 0, -156);
    scene.add(rianGroup);

    // ------------------------------------------------------------------------
    // FASE 3: ZONA 3 "POHON PERSATUAN" (Z = -190 s/d Z = -230)
    // ------------------------------------------------------------------------
    // Pohon Beringin Raksasa di Tengah
    const beringinGroup = new THREE.Group();
    const trunkMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.8, 12, 12), new THREE.MeshLambertMaterial({ color: "#78350f" }));
    trunkMesh.position.y = 6;
    beringinGroup.add(trunkMesh);
    const crownMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(7.5), new THREE.MeshLambertMaterial({ color: "#15803d" }));
    crownMesh.position.y = 14;
    beringinGroup.add(crownMesh);
    beringinGroup.position.set(0, 0, -210);
    scene.add(beringinGroup);

    // 3 Daun Persatuan Tersembunyi (Z = -198, -212, -225)
    const leafMeshes: THREE.Mesh[] = [];
    const leafPositions = [
      { x: -9, z: -198, id: 1 },
      { x: 8, z: -212, id: 2 },
      { x: -7, z: -225, id: 3 },
    ];
    leafPositions.forEach((lp) => {
      const lMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), new THREE.MeshLambertMaterial({ color: "#22c55e", emissive: "#16a34a" }));
      lMesh.position.set(lp.x, 1.5, lp.z);
      scene.add(lMesh);
      leafMeshes.push(lMesh);
    });

    // ------------------------------------------------------------------------
    // FASE 4: ZONA 4 "RUANG MUSYAWARAH" (Z = -260 s/d Z = -300)
    // ------------------------------------------------------------------------
    const balaiDesa = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 16), new THREE.MeshLambertMaterial({ color: "#fecaca" }));
    balaiDesa.position.set(16, 4.5, -280);
    scene.add(balaiDesa);

    // Meja Bundar Musyawarah di Depan Balai
    const tableMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 1.2, 16), new THREE.MeshLambertMaterial({ color: "#b91c1c" }));
    tableMesh.position.set(0, 0.6, -280);
    scene.add(tableMesh);

    // ------------------------------------------------------------------------
    // FASE 5: ZONA 5 "TIMBANGAN KEADILAN" (Z = -330 s/d Z = -370)
    // ------------------------------------------------------------------------
    // Monumen Timbangan Emas Raksasa
    const scaleGroup = new THREE.Group();
    const scalePole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 9, 8), new THREE.MeshLambertMaterial({ color: "#ca8a04" }));
    scalePole.position.y = 4.5;
    scaleGroup.add(scalePole);
    const scaleBeam = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 0.4), new THREE.MeshLambertMaterial({ color: "#eab308" }));
    scaleBeam.position.y = 8.5;
    scaleGroup.add(scaleBeam);
    scaleGroup.position.set(0, 0, -350);
    scene.add(scaleGroup);

    // ------------------------------------------------------------------------
    // FASE 6: MISI AKBAR "SELAMATKAN NEGERI GARUDA" (Z = -410 s/d Z = -450)
    // ------------------------------------------------------------------------
    // Lapangan Altar Garuda Agung
    const akbarAltar = new THREE.Mesh(new THREE.CylinderGeometry(10, 12, 3, 24), new THREE.MeshLambertMaterial({ color: "#1e1b4b" }));
    akbarAltar.position.set(0, 1.5, -430);
    scene.add(akbarAltar);

    // Garuda Raksasa di Altar Akhir
    const megaGaruda = lobbyGroup.clone();
    megaGaruda.scale.set(2.2, 2.2, 2.2);
    megaGaruda.position.set(0, 3, -430);
    scene.add(megaGaruda);

    // ------------------------------------------------------------------------
    // KARAKTER SISWA SD MERAH PUTIH INDONESIA
    // ------------------------------------------------------------------------
    const playerGroup = new THREE.Group();

    // Badan: Kemeja Putih Seragam SD
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.7), new THREE.MeshLambertMaterial({ color: "#ffffff" }));
    torsoMesh.position.y = 2.15;
    torsoMesh.castShadow = true;
    playerGroup.add(torsoMesh);

    // Dasi Merah SD
    const tieMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.9, 0.08), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
    tieMesh.position.set(0, 2.15, 0.38);
    playerGroup.add(tieMesh);

    // Tas Ransel Oranye di Punggung
    const backpackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.45), new THREE.MeshLambertMaterial({ color: "#f97316" }));
    backpackMesh.position.set(0, 2.2, -0.45);
    playerGroup.add(backpackMesh);

    // Kepala Siswa SD
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), new THREE.MeshLambertMaterial({ color: "#fed7aa" }));
    headMesh.position.y = 3.35;
    playerGroup.add(headMesh);

    // Topi Merah Putih SD
    const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.35, 0.92), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
    capTop.position.y = 3.95;
    playerGroup.add(capTop);

    const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.45), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
    capVisor.position.set(0, 3.82, 0.55);
    playerGroup.add(capVisor);

    // Lengan & Tangan
    const sleeveGeo = new THREE.BoxGeometry(0.48, 0.6, 0.48);
    const handGeo = new THREE.BoxGeometry(0.44, 0.7, 0.44);
    const sleeveMat = new THREE.MeshLambertMaterial({ color: "#ffffff" });
    const handMat = new THREE.MeshLambertMaterial({ color: "#fed7aa" });

    const leftArm = new THREE.Group();
    const lSlv = new THREE.Mesh(sleeveGeo, sleeveMat);
    lSlv.position.y = 0.3;
    const lHnd = new THREE.Mesh(handGeo, handMat);
    lHnd.position.y = -0.3;
    leftArm.add(lSlv);
    leftArm.add(lHnd);
    leftArm.position.set(-0.95, 2.15, 0);
    playerGroup.add(leftArm);

    const rightArm = new THREE.Group();
    const rSlv = lSlv.clone();
    const rHnd = lHnd.clone();
    rightArm.add(rSlv);
    rightArm.add(rHnd);
    rightArm.position.set(0.95, 2.15, 0);
    playerGroup.add(rightArm);

    // Kaki: Celana Merah SD + Sepatu Hitam
    const pantsGeo = new THREE.BoxGeometry(0.55, 0.75, 0.55);
    const shoeGeo = new THREE.BoxGeometry(0.56, 0.35, 0.65);
    const pantsMat = new THREE.MeshLambertMaterial({ color: "#dc2626" });
    const shoeMat = new THREE.MeshLambertMaterial({ color: "#0f172a" });

    const leftLeg = new THREE.Group();
    const lPnt = new THREE.Mesh(pantsGeo, pantsMat);
    lPnt.position.y = 0.35;
    const lSh = new THREE.Mesh(shoeGeo, shoeMat);
    lSh.position.set(0, -0.45, 0.05);
    leftLeg.add(lPnt);
    leftLeg.add(lSh);
    leftLeg.position.set(-0.35, 0.7, 0);
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Group();
    const rPnt = lPnt.clone();
    const rSh = lSh.clone();
    rightLeg.add(rPnt);
    rightLeg.add(rSh);
    rightLeg.position.set(0.35, 0.7, 0);
    playerGroup.add(rightLeg);

    // Label Nama
    const nameCanvas = document.createElement("canvas");
    nameCanvas.width = 340;
    nameCanvas.height = 64;
    const nCtx = nameCanvas.getContext("2d")!;
    nCtx.fillStyle = "#ffffff";
    nCtx.font = "bold 26px sans-serif";
    nCtx.textAlign = "center";
    nCtx.fillText("🎒 Penjelajah Muda Pancasila", 170, 42);
    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex }));
    nameSprite.position.set(0, 4.6, 0);
    nameSprite.scale.set(3.6, 0.75, 1);
    playerGroup.add(nameSprite);

    playerGroup.position.set(0, 0, 6);
    scene.add(playerGroup);

    // ------------------------------------------------------------------------
    // ANIMATION & GAME LOOP
    // ------------------------------------------------------------------------
    let animId: number;
    let vy = 0;
    let isJumping = false;
    let walkAnim = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      const keys = keysRef.current;
      const speed = keys.sprint ? 15 : 9.5;

      let moveX = 0;
      let moveZ = 0;

      if (keys.forward) moveZ -= 1;
      if (keys.backward) moveZ += 1;
      if (keys.left) moveX -= 1;
      if (keys.right) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        const len = Math.hypot(moveX, moveZ);
        moveX /= len;
        moveZ /= len;

        playerGroup.position.x += moveX * speed * delta;
        playerGroup.position.z += moveZ * speed * delta;

        // Batasi arena
        playerGroup.position.x = Math.max(-38, Math.min(38, playerGroup.position.x));
        playerGroup.position.z = Math.max(-460, Math.min(18, playerGroup.position.z));

        const targetRot = Math.atan2(moveX, moveZ);
        playerGroup.rotation.y = targetRot + Math.PI;

        walkAnim += delta * (keys.sprint ? 16 : 10);
        const swing = Math.sin(walkAnim) * 0.6;
        leftLeg.rotation.x = swing;
        rightLeg.rotation.x = -swing;
        leftArm.rotation.x = -swing;
        rightArm.rotation.x = swing;
      } else {
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
      }

      // Gravitasi & Lompatan
      if (keys.jump && !isJumping) {
        vy = 9.8;
        isJumping = true;
        playJumpSound();
      }

      if (isJumping) {
        vy -= 22 * delta;
        playerGroup.position.y += vy * delta;
        if (playerGroup.position.y <= 0) {
          playerGroup.position.y = 0;
          vy = 0;
          isJumping = false;
        }
      }

      // Simpan Posisi Player ke Ref untuk Interaksi ProximityPrompt
      playerPosRef.current = {
        x: playerGroup.position.x,
        y: playerGroup.position.y,
        z: playerGroup.position.z,
      };

      // Efek rotasi objek kristal mengapung
      z1SymbolsMeshes.forEach((m) => (m.rotation.y += delta * 1.5));
      leafMeshes.forEach((m) => (m.rotation.y += delta * 2.0));

      // KAMERA THIRD-PERSON PERSPECTIVE
      const camTargetX = playerGroup.position.x;
      const camTargetY = playerGroup.position.y + 4.5;
      const camTargetZ = playerGroup.position.z + 8.5;

      camera.position.x += (camTargetX - camera.position.x) * 0.12;
      camera.position.y += (camTargetY - camera.position.y) * 0.12;
      camera.position.z += (camTargetZ - camera.position.z) * 0.12;
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.8, playerGroup.position.z - 3);

      // Responsif Viewport Size
      const { w, h } = getViewportSize();
      if (
        renderer.domElement.clientWidth !== w ||
        renderer.domElement.clientHeight !== h
      ) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }

      renderer.render(scene, camera);
    };

    renderer.render(scene, camera);
    animate();

    // Event Listeners Resize & Keyboard
    const handleResize = () => {
      const { w, h } = getViewportSize();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") keysRef.current.forward = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") keysRef.current.backward = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keysRef.current.left = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keysRef.current.right = true;
      if (e.key === " ") {
        e.preventDefault();
        keysRef.current.jump = true;
      }
      if (e.key === "Shift") {
        keysRef.current.sprint = true;
        setIsSprinting(true);
        playDashSound();
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        // Cek Interaksi ProximityPrompt Berdasarkan Posisi Pemain
        const pz = playerPosRef.current.z;
        const px = playerPosRef.current.x;

        // Dekat Pak Guru di Lobby
        if (Math.abs(pz - 8) < 4 && Math.abs(px - (-4)) < 4) {
          setShowGuruPrompt(true);
        }
        // Dekat 5 Pilar Belajar Bebas di Lobby
        else if (pz > -18 && pz < 10) {
          pilarCoords.forEach((pc) => {
            if (Math.abs(pz - pc.z) < 3.5 && Math.abs(px - pc.x) < 3.5) {
              const matchedPilar = pilarMateriList.find((item) => item.sila === pc.sila);
              if (matchedPilar) setSelectedPilar(matchedPilar);
            }
          });
        }
        // Zona 1: Simbol Kepercayaan
        if (pz <= -50 && pz >= -90) {
          z1SymbolPositions.forEach((sp) => {
            if (Math.abs(pz - sp.z) < 4.5 && Math.abs(px - sp.x) < 4.5) {
              triggerZona1Prompt(sp.id);
            }
          });
        }
        // Zona 2: Tolong Warga
        else if (pz <= -120 && pz >= -160) {
          if (Math.abs(pz - (-128)) < 4.5) triggerZona2Prompt("doni");
          if (Math.abs(pz - (-142)) < 4.5) triggerZona2Prompt("ibu_siti");
          if (Math.abs(pz - (-156)) < 4.5) triggerZona2Prompt("rian_bullying");
        }
        // Zona 3: Daun Persatuan
        else if (pz <= -190 && pz >= -230) {
          leafPositions.forEach((lp) => {
            if (Math.abs(pz - lp.z) < 4.5 && Math.abs(px - lp.x) < 4.5) {
              triggerZona3Prompt(lp.id);
            }
          });
        }
        // Zona 4: Balai Musyawarah
        else if (pz <= -260 && pz >= -300) {
          if (Math.abs(pz - (-280)) < 7) triggerZona4Prompt();
        }
        // Zona 5: Kasus Keadilan
        else if (pz <= -330 && pz >= -370) {
          if (Math.abs(pz - (-345)) < 5) triggerZona5Prompt(1);
          if (Math.abs(pz - (-355)) < 5) triggerZona5Prompt(2);
          if (Math.abs(pz - (-365)) < 5) triggerZona5Prompt(3);
        }
        // Misi Akbar
        else if (pz <= -410 && pz >= -450) {
          for (let i = 1; i <= 5; i++) {
            if (!akbarCrystalsDone.includes(i)) {
              triggerMisiAkbarPrompt(i);
              break;
            }
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") keysRef.current.forward = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") keysRef.current.backward = false;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keysRef.current.left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keysRef.current.right = false;
      if (e.key === " ") keysRef.current.jump = false;
      if (e.key === "Shift") {
        keysRef.current.sprint = false;
        setIsSprinting(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (mount && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [
    mountEl,
    gameType,
    isOpen,
    pilarMateriList,
    triggerZona1Prompt,
    triggerZona2Prompt,
    triggerZona3Prompt,
    triggerZona4Prompt,
    triggerZona5Prompt,
    triggerMisiAkbarPrompt,
    akbarCrystalsDone,
  ]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="negeri-garuda-title"
      >
        {/* TOP HUD BAR */}
        <header className="h-14 bg-slate-900/95 border-b-2 border-yellow-400 text-white px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-lg z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-xl shadow-md shrink-0">
              🦅
            </span>
            <div className="min-w-0">
              <h2 id="negeri-garuda-title" className="font-black text-sm sm:text-base text-yellow-300 truncate tracking-wide">
                NEGERI GARUDA: PETUALANGAN 5 SILA & MISI AKBAR
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                Fase: <b className="text-emerald-400 uppercase">{currentZone.replace("_", " ")}</b> • Materi: {resolvedTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Papan Skor Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowScoreboard((v) => !v);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-full text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>📊</span>
              <span className="hidden sm:inline">Papan Skor</span>
            </button>

            {/* Skor Prestasi */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-full border border-yellow-400/50">
              <span className="text-xs font-black text-yellow-300">
                🪙 {adventureScore} Poin
              </span>
            </div>

            {/* Toggle Suara Musik */}
            <button
              type="button"
              onClick={() => {
                if (bgmEnabled) {
                  stopAdventureBgm();
                  setBgmEnabled(false);
                } else {
                  startAdventureBgm();
                  setBgmEnabled(true);
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                bgmEnabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300"
              }`}
            >
              <span>{bgmEnabled ? "🔊" : "🔇"}</span>
              <span className="hidden md:inline">{bgmEnabled ? "ON" : "OFF"}</span>
            </button>

            {/* Tombol Keluar */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                stopAdventureBgm();
                onClose();
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-1.5 rounded-full text-xs shadow-md transition hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>✕</span>
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {/* CONTAINER ARENA FULLSCREEN */}
        <div className="flex-1 w-full relative overflow-hidden flex flex-col items-center justify-center bg-slate-900">
          {/* THREE.JS 3D CANVAS MOUNT */}
          <div ref={setMountEl} className="absolute inset-0 w-full h-full block" />

          {/* OVERLAY AWAL MULAI PETUALANGAN DI LOBBY */}
          {!gameStarted && (
            <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center text-5xl shadow-2xl border-4 border-white animate-bounce">
                🦅
              </div>
              <div className="space-y-2 max-w-lg">
                <h3 className="font-black text-2xl sm:text-3xl text-yellow-300 tracking-wide">
                  SELAMAT DATANG DI NEGERI GARUDA! 🇮🇩
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Jadilah <b>Penjelajah Muda Pancasila</b>! Jelajahi 5 Zona luhur bangsa, bantu warga desa, pimpin musyawarah mufakat, tegakkan keadilan, dan selamatkan Negeri Garuda dalam <b>Misi Akbar</b> gotong royong!
                </p>
                <div className="bg-slate-900/90 p-3 rounded-2xl border border-yellow-400/30 text-xs text-yellow-200 flex items-center justify-center gap-4">
                  <span>🎮 <b>WASD / Panah</b>: Jalan</span>
                  <span>•</span>
                  <span>🟡 <b>Spasi</b>: Lompat</span>
                  <span>•</span>
                  <span>⚡ <b>Shift</b>: Lari</span>
                  <span>•</span>
                  <span>🎯 <b>E</b>: Aksi / Bicara</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setGameStarted(true);
                  startAdventureBgm();
                }}
                className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-base sm:text-lg py-4 px-10 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition border-4 border-white flex items-center gap-3 cursor-pointer"
              >
                <span>▶️ MULAI PETUALANGAN NEGERI GARUDA 🎵</span>
              </button>
            </div>
          )}

          {/* HUD PROGRESS 5 ZONA & MISI AKBAR DI ATAS */}
          <div className="absolute top-3 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between gap-1 sm:gap-2 bg-slate-900/85 backdrop-blur-md p-2 rounded-2xl border border-yellow-400/40">
            {[
              { id: "lobby", label: "Lobby Garuda", icon: "🏛️" },
              { id: "zona1", label: "Zona 1: Cahaya Ketuhanan", icon: "⭐" },
              { id: "zona2", label: "Zona 2: Rantai Kemanusiaan", icon: "⛓️" },
              { id: "zona3", label: "Zona 3: Pohon Persatuan", icon: "🌳" },
              { id: "zona4", label: "Zona 4: Ruang Musyawarah", icon: "🐂" },
              { id: "zona5", label: "Zona 5: Timbangan Keadilan", icon: "🌾" },
              { id: "misi_akbar", label: "Misi Akbar Garuda", icon: "🤝" },
            ].map((z, idx) => (
              <div
                key={z.id}
                className={`flex-1 py-1.5 px-1.5 rounded-xl text-center text-[10px] sm:text-xs font-black transition flex items-center justify-center gap-1 ${
                  currentZone === z.id
                    ? "bg-yellow-400 text-slate-950 ring-2 ring-yellow-300 animate-pulse"
                    : idx < ["lobby", "zona1", "zona2", "zona3", "zona4", "zona5", "misi_akbar", "tamat"].indexOf(currentZone)
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <span>{z.icon}</span>
                <span className="hidden xl:inline">{z.label}</span>
              </div>
            ))}
          </div>

          {/* NOTIFIKASI AKSI DI TENGAH ATAS */}
          {activeNotification && (
            <div className="absolute top-18 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 max-w-xl bg-slate-900/95 border-2 border-yellow-400 p-3.5 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in text-white text-xs sm:text-sm font-bold backdrop-blur-md">
              {activeNotification}
            </div>
          )}

          {/* DIALOG POPUP INTERAKSI / SOAL KONTEKSTUAL (PROXIMITY PROMPT 'E') */}
          {dialogState && dialogState.isOpen && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900 border-4 border-yellow-400 rounded-3xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl relative">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-yellow-400/20 border border-yellow-400 flex items-center justify-center text-3xl">
                    {dialogState.characterAvatar}
                  </span>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-yellow-300">
                      {dialogState.title}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Bicara dengan: <b>{dialogState.characterName}</b>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-xs sm:text-sm leading-relaxed text-slate-100 font-medium">
                  "{dialogState.question}"
                </div>

                <div className="space-y-2 pt-1">
                  {dialogState.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (opt.isCorrect) {
                          dialogState.onSuccess?.();
                          setDialogState(null);
                        } else {
                          playOofSound();
                          setActiveNotification(`💡 Penjelasan: ${opt.explanation}`);
                          setTimeout(() => setActiveNotification(null), 3500);
                        }
                      }}
                      className="w-full text-left bg-slate-800 hover:bg-yellow-400/20 hover:border-yellow-400 border border-slate-700 p-3 rounded-xl transition text-xs sm:text-sm font-semibold flex items-start gap-2.5 cursor-pointer text-slate-200 hover:text-white"
                    >
                      <span className="w-6 h-6 rounded-lg bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                        {opt.id}
                      </span>
                      <span>{opt.text}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDialogState(null)}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Tutup Dialog
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* POPUP INFORMASI 5 PILAR BELAJAR BEBAS DI LOBBY */}
          {selectedPilar && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900 border-4 border-yellow-400 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-yellow-400/20 border border-yellow-400 flex items-center justify-center text-3xl">
                    {selectedPilar.simbol}
                  </span>
                  <div>
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                      Area Belajar Bebas Sila ke-{selectedPilar.sila}
                    </span>
                    <h3 className="font-black text-base text-white">
                      {selectedPilar.judul}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-200">
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                    <b className="text-yellow-300 block mb-1">📖 Makna & Nilai Luhur:</b>
                    <p>{selectedPilar.penjelasan}</p>
                  </div>
                  <div className="bg-emerald-950/50 p-3.5 rounded-2xl border border-emerald-500/40">
                    <b className="text-emerald-300 block mb-1">🌱 Contoh Aksi Nyata Pelajar:</b>
                    <p>{selectedPilar.contohAksi}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPilar(null)}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  ✓ Mengerti & Lanjutkan Petualangan
                </button>
              </div>
            </div>
          )}

          {/* POPUP SALAM PAK GURU VIRTUAL DI LOBBY */}
          {showGuruPrompt && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900 border-4 border-sky-400 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-3xl">
                    👨‍🏫
                  </span>
                  <div>
                    <h3 className="font-black text-base text-sky-300">
                      Pak Guru Virtual Menyambutmu!
                    </h3>
                    <p className="text-xs text-slate-300">
                      Pemandu Petualangan Negeri Garuda
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-xs sm:text-sm leading-relaxed text-slate-200 space-y-2">
                  <p>
                    "Halo Penjelajah Muda yang cerdas dan berbudi luhur! Selamat datang di <b>Negeri Garuda</b>."
                  </p>
                  <p>
                    "Di sini kamu akan berpetualang menelusuri 5 Zona Pancasila. Setiap zona memiliki tantangan sikap nyata yang harus kamu selesaikan untuk membuka zona berikutnya."
                  </p>
                  <p className="text-yellow-300 font-bold">
                    "Tekan 'E' saat berada di dekat objek atau warga untuk berinteraksi. Selamat berjuang!"
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGuruPrompt(false)}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Siap, Pak Guru! Mulai Petualangan 🚀
                </button>
              </div>
            </div>
          )}

          {/* POPUP PAPAN SKOR KELAS */}
          {showScoreboard && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900 border-4 border-indigo-400 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <h3 className="font-black text-base text-indigo-300">
                      Papan Skor Penjelajah Teladan
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScoreboard(false)}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { rank: "🥇", name: "Budi Santoso", score: "180 Poin", badge: "Pancasila Sejati" },
                    { rank: "🥈", name: "Siti Rahma", score: "165 Poin", badge: "Ksatria Kemanusiaan" },
                    { rank: "🥉", name: "Edo Pratama", score: "150 Poin", badge: "Pemimpin Musyawarah" },
                    { rank: "4", name: "Kamu (Siswa)", score: `${adventureScore} Poin`, badge: "Penjelajah Aktif", highlight: true },
                    { rank: "5", name: "Dayu Kemala", score: "120 Poin", badge: "Penegak Keadilan" },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl flex items-center justify-between border ${
                        s.highlight
                          ? "bg-yellow-400/20 border-yellow-400 font-bold text-yellow-300"
                          : "bg-slate-800/80 border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center">{s.rank}</span>
                        <span>{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">{s.badge}</span>
                        <span className="font-black text-white">{s.score}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowScoreboard(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  Tutup Papan Skor
                </button>
              </div>
            </div>
          )}

          {/* SELEBRASI AKHIR KETIKA MISI AKBAR TAMAT */}
          {currentZone === "tamat" && (
            <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95 text-center">
              <div className="bg-slate-900 border-4 border-yellow-400 rounded-3xl max-w-lg w-full p-8 text-white space-y-5 shadow-2xl">
                <div className="w-24 h-24 rounded-full bg-yellow-400/20 border-3 border-yellow-400 flex items-center justify-center text-5xl mx-auto animate-bounce">
                  🏆
                </div>
                <div className="space-y-2">
                  <h3 className="font-black text-2xl text-yellow-300">
                    SELAMAT! CAHAYA NEGERI GARUDA TELAH PULIH! 🇮🇩
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Kamu telah menyelesaikan seluruh petualangan 5 Sila dan memimpin gotong royong Misi Akbar! Nilai-nilai luhur Pancasila kini hidup nyata dalam tindakanmu.
                  </p>
                </div>

                <div className="p-4 bg-yellow-400/10 border border-yellow-400/50 rounded-2xl space-y-1">
                  <div className="text-xs text-yellow-300 uppercase tracking-widest font-black">
                    Lencana Kehormatan Tertinggi:
                  </div>
                  <div className="text-lg font-black text-white">
                    🎖️ PENJELAJAH PANCASILA SEJATI
                  </div>
                  <div className="text-xs text-emerald-400 font-bold pt-1">
                    🪙 Total Skor Aksi: {adventureScore} Poin • +50 Poin Prestasi Pelajar!
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setCurrentZone("lobby");
                    setAdventureScore(0);
                    setZona1Found([]);
                    setZona2Helped([]);
                    setZona3Leaves([]);
                    setZona4MusyawarahDone(false);
                    setZona5CasesDone([]);
                    setAkbarCrystalsDone([]);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-black py-3 rounded-full text-sm shadow-xl transition cursor-pointer"
                >
                  🔄 Mainkan Petualangan dari Awal (Lobby)
                </button>
              </div>
            </div>
          )}

          {/* VIRTUAL CONTROLLER DI LAYAR */}
          <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between pointer-events-none">
            {/* D-Pad WASD */}
            <div className="grid grid-cols-3 gap-1.5 pointer-events-auto">
              <div />
              <button
                type="button"
                onMouseDown={() => (keysRef.current.forward = true)}
                onMouseUp={() => (keysRef.current.forward = false)}
                onTouchStart={() => (keysRef.current.forward = true)}
                onTouchEnd={() => (keysRef.current.forward = false)}
                className="w-12 h-12 rounded-xl bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-950 text-white border border-yellow-400/60 font-black text-lg shadow-lg flex items-center justify-center cursor-pointer active:scale-90"
              >
                ▲
              </button>
              <div />
              <button
                type="button"
                onMouseDown={() => (keysRef.current.left = true)}
                onMouseUp={() => (keysRef.current.left = false)}
                onTouchStart={() => (keysRef.current.left = true)}
                onTouchEnd={() => (keysRef.current.left = false)}
                className="w-12 h-12 rounded-xl bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-950 text-white border border-yellow-400/60 font-black text-lg shadow-lg flex items-center justify-center cursor-pointer active:scale-90"
              >
                ◀
              </button>
              <button
                type="button"
                onMouseDown={() => (keysRef.current.backward = true)}
                onMouseUp={() => (keysRef.current.backward = false)}
                onTouchStart={() => (keysRef.current.backward = true)}
                onTouchEnd={() => (keysRef.current.backward = false)}
                className="w-12 h-12 rounded-xl bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-950 text-white border border-yellow-400/60 font-black text-lg shadow-lg flex items-center justify-center cursor-pointer active:scale-90"
              >
                ▼
              </button>
              <button
                type="button"
                onMouseDown={() => (keysRef.current.right = true)}
                onMouseUp={() => (keysRef.current.right = false)}
                onTouchStart={() => (keysRef.current.right = true)}
                onTouchEnd={() => (keysRef.current.right = false)}
                className="w-12 h-12 rounded-xl bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-950 text-white border border-yellow-400/60 font-black text-lg shadow-lg flex items-center justify-center cursor-pointer active:scale-90"
              >
                ▶
              </button>
            </div>

            {/* Tombol Interaksi 'E', Sprint, dan Jump */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  // Memicu tombol E
                  const event = new KeyboardEvent("keydown", { key: "e" });
                  window.dispatchEvent(event);
                }}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-sm shadow-xl flex items-center gap-2 cursor-pointer border-2 border-white"
              >
                <span>🎯</span>
                <span>INTERAKSI (E)</span>
              </button>

              <button
                type="button"
                onMouseDown={() => {
                  keysRef.current.sprint = true;
                  setIsSprinting(true);
                  playDashSound();
                }}
                onMouseUp={() => {
                  keysRef.current.sprint = false;
                  setIsSprinting(false);
                }}
                onTouchStart={() => {
                  keysRef.current.sprint = true;
                  setIsSprinting(true);
                  playDashSound();
                }}
                onTouchEnd={() => {
                  keysRef.current.sprint = false;
                  setIsSprinting(false);
                }}
                className={`px-4 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  isSprinting
                    ? "bg-amber-500 text-slate-950 ring-2 ring-yellow-300"
                    : "bg-slate-900/80 hover:bg-slate-800 text-yellow-300 border border-yellow-400/50"
                }`}
              >
                <span>⚡</span>
                <span>SPRINT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  keysRef.current.jump = true;
                  setTimeout(() => {
                    keysRef.current.jump = false;
                  }, 120);
                }}
                className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-orange-500 text-slate-950 font-black text-sm py-3 px-6 rounded-2xl shadow-xl transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border-2 border-white"
              >
                <span>🟡</span>
                <span>LOMPAT (SPASI)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
