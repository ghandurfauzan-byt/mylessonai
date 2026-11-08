// frontend/src/components/AdaptiveEduGameModal.tsx
// Game Edukasi 3D Real Roblox-Style Engine: "Petualangan Pancasila: Jelajah Negeri Garuda"
// Mengimplementasikan Spesifikasi Lengkap & Blueprint Roblox Studio:
// - FASE 0: Lobby (Patung Garuda Emas 20 stud, 5 Pilar Mode Belajar, NPC Pak Guru Virtual, Papan Skor, Portal Zona 1)
// - FASE 1: Zona 1 "Cahaya Ketuhanan" (5 Objek: Lilin Iman, Kitab Suci, Bunga Persembahan, Dupa, Lentera + Gerbang Terkunci)
// - FASE 2: Zona 2 "Rantai Kemanusiaan" (3 NPC: Adi jatuh sepeda, Bu Sari belanjaan, Rina anti-bullying)
// - FASE 3: Zona 3 "Pohon Persatuan" (Scavenger Hunt 3 Daun Persatuan: Gua, Bukit, Batu + Cutscene Damai 3 Suku)
// - FASE 4: Zona 4 "Ruang Musyawarah" (Balai Desa, Meja Bundar, 4 NPC Andi/Budi/Citra/Dina, Mufakat & Mini-Quiz)
// - FASE 5: Zona 5 "Timbangan Keadilan" (Hakim Cilik: 3 Kasus Keadilan Sosial - Tugas Kelompok, Fasilitas Kelas B, Hak Karya)
// - FASE 6: Misi Akbar "Selamatkan Negeri Garuda" (5 Kristal Sila Gotong Royong, Garuda Emas Menyala, Gelar Juara)
// - Sistem Pendukung: 📖 "Buku Catatan", 🎖️ 6 Lencana Badges, Sistem Skor Terhubung dengan Poin Web Pelajar

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

// Fase Zona Petualangan Sesuai Blueprint
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

// Catatan Riwayat Belajar untuk GUI Buku Catatan
interface NoteRecord {
  id: string;
  zona: string;
  namaObjek: string;
  soal: string;
  jawabanUser: string;
  isCorrect: boolean;
  penjelasan: string;
  waktu: string;
}

// Badge Prestasi Sesuai Blueprint
interface GameBadge {
  id: string;
  name: string;
  symbol: string;
  desc: string;
  unlocked: boolean;
}

interface DialogModalState {
  isOpen: boolean;
  title: string;
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

  const [resolvedTitle, setResolvedTitle] = useState<string>(
    activeValidatedModule?.title || chapterTitle || chapter
  );
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentZone, setCurrentZone] = useState<GameZonePhase>("lobby");
  const [adventureScore, setAdventureScore] = useState(0);
  const [isSprinting, setIsSprinting] = useState(false);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  // Progresi Game Sesuai Blueprint
  const [zona1DoneCount, setZona1DoneCount] = useState<string[]>([]);
  const [zona2DoneCount, setZona2DoneCount] = useState<string[]>([]);
  const [zona3Leaves, setZona3Leaves] = useState<string[]>([]);
  const [zona4MusyawarahDone, setZona4MusyawarahDone] = useState(false);
  const [zona5CasesDone, setZona5CasesDone] = useState<string[]>([]);
  const [akbarCrystalsDone, setAkbarCrystalsDone] = useState<number[]>([]);

  // Sistem Pendukung: Buku Catatan Pelajar
  const [notebookNotes, setNotebookNotes] = useState<NoteRecord[]>([]);
  const [showNotebook, setShowNotebook] = useState(false);

  // Sistem Pendukung: Badges Penghargaan
  const [badges, setBadges] = useState<GameBadge[]>([
    { id: "b1", name: "Penjelajah Cahaya", symbol: "🌟", desc: "Menyelesaikan Zona 1: Cahaya Ketuhanan", unlocked: false },
    { id: "b2", name: "Penjelajah Kemanusiaan", symbol: "🔗", desc: "Menolong 3 warga di Zona 2: Rantai Kemanusiaan", unlocked: false },
    { id: "b3", name: "Penjelajah Persatuan", symbol: "🌳", desc: "Menemukan 3 Daun Persatuan di Zona 3", unlocked: false },
    { id: "b4", name: "Penjelajah Musyawarah", symbol: "🗣️", desc: "Memimpin mufakat di Zona 4: Ruang Musyawarah", unlocked: false },
    { id: "b5", name: "Penjelajah Keadilan", symbol: "⚖️", desc: "Memutuskan 3 kasus di Zona 5: Timbangan Keadilan", unlocked: false },
    { id: "b6", name: "Penjelajah Pancasila Sejati", symbol: "🦅", desc: "Menyelamatkan Negeri Garuda dalam Misi Akbar", unlocked: false },
  ]);
  const [showBadgesModal, setShowBadgesModal] = useState(false);

  // Dialog State untuk Interaksi ProximityPrompt
  const [dialogState, setDialogState] = useState<DialogModalState | null>(null);
  const [selectedPilar, setSelectedPilar] = useState<PilarBelajar | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showGuruPrompt, setShowGuruPrompt] = useState(false);
  const [cutsceneText, setCutsceneText] = useState<string | null>(null);

  // Mount Element Ref Callback untuk Three.js
  const [mountEl, setMountEl] = useState<HTMLDivElement | null>(null);

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
  const playerPosRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 8 });

  // --------------------------------------------------------------------------
  // DATA 5 PILAR MODE BELAJAR (KEMENDIKBUD KURIKULUM MERDEKA)
  // --------------------------------------------------------------------------
  const pilarMateriList: PilarBelajar[] = useMemo(() => [
    {
      sila: 1,
      simbol: "⭐",
      judul: "Sila ke-1: Ketuhanan Yang Maha Esa",
      penjelasan: "Percaya dan takwa kepada Tuhan Yang Maha Esa sesuai agama masing-masing, serta menjunjung tinggi toleransi dan kerukunan antarumat beragama.",
      contohAksi: "Menghormati teman yang sedang beribadah, tidak memaksakan agama kepada orang lain, dan selalu berdoa sebelum belajar.",
    },
    {
      sila: 2,
      simbol: "🔗",
      judul: "Sila ke-2: Kemanusiaan Yang Adil dan Beradab",
      penjelasan: "Mengakui persamaan derajat, hak, dan kewajiban setiap manusia, gemar melakukan kegiatan kemanusiaan, dan membela kebenaran.",
      contohAksi: "Menolong teman yang tertimpa musibah/terjatuh, membantu orang tua membawa barang, serta berani membela teman dari ejekan (anti-bullying).",
    },
    {
      sila: 3,
      simbol: "🌳",
      judul: "Sila ke-3: Persatuan Indonesia",
      penjelasan: "Menempatkan persatuan, kesatuan, serta kepentingan bangsa dan negara di atas kepentingan pribadi atau golongan dengan semboyan Bhinneka Tunggal Ika.",
      contohAksi: "Bermain rukun dengan teman dari berbagai suku bangsa, mencintai produk dalam negeri, dan bangga berbangsa Indonesia.",
    },
    {
      sila: 4,
      simbol: "🐂",
      judul: "Sila ke-4: Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan dalam Permusyawaratan/Perwakilan",
      penjelasan: "Mengutamakan musyawarah dalam mengambil keputusan untuk kepentingan bersama dengan diliputi oleh semangat kekeluargaan.",
      contohAksi: "Memilih ketua kelas lewat musyawarah mufakat, menghargai pendapat kawan yang berbeda, dan menerima hasil keputusan bersama dengan lapang dada.",
    },
    {
      sila: 5,
      simbol: "🌾",
      judul: "Sila ke-5: Keadilan Sosial bagi Seluruh Rakyat Indonesia",
      penjelasan: "Mengembangkan sikap adil terhadap sesama, menghormati hak orang lain, suka memberi pertolongan, suka bekerja keras, dan gotong royong.",
      contohAksi: "Membagi tugas piket kebersihan secara merata, antre dengan tertib di kantin/perpustakaan, dan tidak bergaya hidup boros.",
    },
  ], []);

  // Unlock Badge Helper
  const unlockBadge = useCallback((badgeId: string) => {
    setBadges((prev) =>
      prev.map((b) => (b.id === badgeId ? { ...b, unlocked: true } : b))
    );
  }, []);

  // Tambah Catatan ke Buku Catatan
  const addNote = useCallback((note: Omit<NoteRecord, "waktu">) => {
    const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setNotebookNotes((prev) => [{ ...note, waktu: timeStr }, ...prev]);
  }, []);

  // Kontrol Background Music
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
      setZona1DoneCount([]);
      setZona2DoneCount([]);
      setZona3Leaves([]);
      setZona4MusyawarahDone(false);
      setZona5CasesDone([]);
      setAkbarCrystalsDone([]);
      setDialogState(null);
      setSelectedPilar(null);
      setShowScoreboard(false);
      setShowGuruPrompt(false);
      setShowNotebook(false);
      setShowBadgesModal(false);
      setCutsceneText(null);
    }
  }, [isOpen]);

  // --------------------------------------------------------------------------
  // INTERAKSI ZONA SESUAI BLUEPRINT DETAIL
  // --------------------------------------------------------------------------

  // ZONA 1: 5 Objek Simbol Kepercayaan
  const triggerZona1Prompt = useCallback((objId: string) => {
    if (zona1DoneCount.includes(objId)) {
      setActiveNotification("✨ Objek ini sudah menyala terang!");
      setTimeout(() => setActiveNotification(null), 2500);
      return;
    }

    const objDataMap: Record<string, { title: string; q: string; opt: any[]; desc: string }> = {
      lilin: {
        title: "Lilin Iman (Dekat Masjid Mini)",
        desc: "Sikap toleransi beragama sesuai Sila ke-1.",
        q: "Temanmu sedang beribadah dengan khusyuk. Apa yang kamu lakukan?",
        opt: [
          { id: "A", text: "Menunggu dengan tenang tanpa membuat keributan.", isCorrect: true, explanation: "Sikap toleransi beragama sesuai Sila ke-1." },
          { id: "B", text: "Mengajaknya mengobrol dan bercanda.", isCorrect: false, explanation: "Mengganggu teman yang sedang beribadah melanggar nilai toleransi." },
          { id: "C", text: "Berisik di dekat tempat ibadah.", isCorrect: false, explanation: "Kita wajib menjaga ketenangan di sekitar rumah ibadah." },
        ],
      },
      kitab: {
        title: "Kitab Suci (Dekat Gereja Mini)",
        desc: "Sila ke-1 menjamin kebebasan memeluk agama.",
        q: "Agamamu berbeda dengan teman sebangkumu di kelas. Sikapmu?",
        opt: [
          { id: "A", text: "Saling menghormati dan tetap berteman akrab.", isCorrect: true, explanation: "Sila ke-1 menjamin kebebasan dan kerukunan beragama." },
          { id: "B", text: "Menjauhinya dan enggan belajar kelompok bersamanya.", isCorrect: false, explanation: "Perbedaan agama tidak boleh memecah belah pertemanan." },
          { id: "C", text: "Memaksa temanmu untuk mengikuti agamamu.", isCorrect: false, explanation: "Tidak boleh ada paksaan dalam beragama di Indonesia." },
        ],
      },
      bunga: {
        title: "Bunga Persembahan (Dekat Pura Mini)",
        desc: "Menghormati perayaan hari besar keagamaan.",
        q: "Hari raya temanmu berbeda denganmu. Sikap terpujimu adalah:",
        opt: [
          { id: "A", text: "Mengucapkan selamat dengan tulus dan menjaga suasana damai.", isCorrect: true, explanation: "Saling menghormati perayaan keagamaan memperkokoh persaudaraan." },
          { id: "B", text: "Tidak peduli dan mengabaikannya sama sekali.", isCorrect: false, explanation: "Sebagai sahabat, kita harus menunjukkan empati dan keramahan." },
          { id: "C", text: "Mengejek tradisi perayaannya.", isCorrect: false, explanation: "Mengejek tradisi agama lain adalah perbuatan yang tercela." },
        ],
      },
      dupa: {
        title: "Dupa Kedamaian (Dekat Vihara Mini)",
        desc: "Pancasila menjamin kebebasan beribadah seluruh warga.",
        q: "Bagaimana sikap Pancasila terhadap kebebasan beragama?",
        opt: [
          { id: "A", text: "Menjamin kemerdekaan tiap warga untuk memeluk agamanya.", isCorrect: true, explanation: "Pasal 29 UUD 1945 & Sila 1 menjamin kebebasan beragama." },
          { id: "B", text: "Melarang kegiatan ibadah di tempat umum.", isCorrect: false, explanation: "Negara melindungi dan menjamin kebebasan beribadah." },
          { id: "C", text: "Memaksa semua orang menganut satu agama saja.", isCorrect: false, explanation: "Indonesia adalah negara majemuk yang mengakui keberagaman." },
        ],
      },
      lentera: {
        title: "Lentera Kerukunan (Dekat Kelenteng Mini)",
        desc: "Percaya dan takwa kepada Tuhan Yang Maha Esa.",
        q: "Sila ke-1 mengajarkan seluruh anak bangsa untuk...",
        opt: [
          { id: "A", text: "Percaya & takwa kepada Tuhan serta menjaga kerukunan hidup.", isCorrect: true, explanation: "Itulah butir utama pengamalan Sila pertama." },
          { id: "B", text: "Mengabaikan nilai agama dalam kehidupan sehari-hari.", isCorrect: false, explanation: "Nilai keagamaan menjadi pondasi moral bangsa." },
          { id: "C", text: "Menghina keyakinan yang berbeda.", isCorrect: false, explanation: "Sila ke-1 tegas menolak segala bentuk penistaan keyakinan." },
        ],
      },
    };

    const curData = objDataMap[objId] ?? objDataMap["lilin"]!;

    setDialogState({
      isOpen: true,
      title: curData.title,
      characterName: "Pemuka Agama Nusantara",
      characterAvatar: "👳‍♂️",
      question: curData.q,
      options: curData.opt,
      onSuccess: () => {
        playCoinSound();
        playCorrectSound();
        addPoints(10, `Menjawab ${curData.title}`);
        addNote({
          id: `z1_${objId}`,
          zona: "Zona 1 - Cahaya Ketuhanan",
          namaObjek: curData.title,
          soal: curData.q,
          jawabanUser: curData.opt[0]?.text ?? "",
          isCorrect: true,
          penjelasan: curData.desc,
        });

        setZona1DoneCount((prev) => {
          const next = [...prev, objId];
          if (next.length >= 5) {
            playBadgeFanfareSound();
            unlockBadge("b1");
            setCurrentZone("zona2");
            setActiveNotification("🎉 5 Objek Menyala! Gerbang Zona 2 'Rantai Kemanusiaan' Terbuka! (+50 Poin Bonus!)");
            addPoints(50, "Menyelesaikan Zona 1");
            setAdventureScore((s) => s + 60);
          } else {
            setActiveNotification(`✨ Objek ${curData.title} Menyala! (${next.length}/5 Objek Selesai)`);
            setAdventureScore((s) => s + 10);
          }
          return next;
        });
      },
    });
  }, [zona1DoneCount, addPoints, addNote, unlockBadge]);

  // ZONA 2: 3 NPC Warga yang Butuh Pertolongan
  const triggerZona2Prompt = useCallback((npcId: string) => {
    if (zona2DoneCount.includes(npcId)) {
      setActiveNotification("❤️ Warga ini sudah kamu bantu dengan penuh kasih sayang!");
      setTimeout(() => setActiveNotification(null), 2500);
      return;
    }

    if (npcId === "adi") {
      setDialogState({
        isOpen: true,
        title: "Tolong Adi (Anak Terjatuh dari Sepeda)",
        characterName: "Adi",
        characterAvatar: "🚲",
        question: "Aduh, kakiku sakit sekali setelah tergelincir dari sepeda... Bisakah kamu membantuku?",
        options: [
          { id: "A", text: "Segera membantunya berdiri dan mengambilkan perban/P3K.", isCorrect: true, explanation: "Sila ke-2 mengajarkan kita gemar tolong-menolong sesama manusia." },
          { id: "B", text: "Tertawa terbahak-bahak melihatnya jatuh.", isCorrect: false, explanation: "Menertawakan orang yang celaka tidak beradab dan melukai perasaannya." },
          { id: "C", text: "Pergi meninggalkannya begitu saja.", isCorrect: false, explanation: "Mengabaikan orang yang butuh pertolongan bertentangan dengan kemanusiaan." },
        ],
        onSuccess: () => {
          playCorrectSound();
          addPoints(15, "Menolong Adi berdiri");
          addNote({
            id: "z2_adi",
            zona: "Zona 2 - Rantai Kemanusiaan",
            namaObjek: "Adi Terjatuh",
            soal: "Adi terjatuh dari sepeda dan kakinya sakit.",
            jawabanUser: "Segera membantunya berdiri dan mengambilkan perban/P3K.",
            isCorrect: true,
            penjelasan: "Sila ke-2 mengajarkan tolong-menolong sesama manusia dengan penuh empati.",
          });
          setZona2DoneCount((prev) => {
            const next = [...prev, "adi"];
            if (next.length >= 3) {
              playBadgeFanfareSound();
              unlockBadge("b2");
              setCurrentZone("zona3");
              setActiveNotification("🎉 3 Warga Tertolong! Gerbang Zona 3 'Pohon Persatuan' Terbuka! (+50 Poin Bonus!)");
              addPoints(50, "Menyelesaikan Zona 2");
              setAdventureScore((s) => s + 65);
            } else {
              setActiveNotification(`🩹 Kamu menunjukkan sikap kemanusiaan! (${next.length}/3 Warga)`);
              setAdventureScore((s) => s + 15);
            }
            return next;
          });
        },
      });
    } else if (npcId === "bu_sari") {
      setDialogState({
        isOpen: true,
        title: "Bantu Bu Sari (Ibu Belanjaan Berat)",
        characterName: "Bu Sari",
        characterAvatar: "👵",
        question: "Barang belanjaanku dari pasar berat sekali. Maukah kamu membantuku membawanya sampai ke rumah?",
        options: [
          { id: "A", text: "Membawakan kantong belanjaan Bu Sari sampai ke rumahnya dengan ikhlas.", isCorrect: true, explanation: "Meringankan beban orang tua tanpa pamrih adalah wujud adab luhur." },
          { id: "B", text: "Abaikan saja karena sedang asyik bermain.", isCorrect: false, explanation: "Kita harus peka dan peduli terhadap kesusahan orang di sekitar kita." },
          { id: "C", text: "Minta bayaran uang baru mau membantu.", isCorrect: false, explanation: "Tolong-menolong antarmanusia harus ikhlas tanpa mengharap imbalan." },
        ],
        onSuccess: () => {
          playCorrectSound();
          addPoints(15, "Membantu Bu Sari membawa belanjaan");
          addNote({
            id: "z2_sari",
            zona: "Zona 2 - Rantai Kemanusiaan",
            namaObjek: "Bu Sari Belanjaan",
            soal: "Bu Sari membawa belanjaan berat dari pasar.",
            jawabanUser: "Membawakan kantong belanjaan sampai ke rumah dengan ikhlas.",
            isCorrect: true,
            penjelasan: "Membantu orang lain secara sukarela mempererat rasa kemanusiaan.",
          });
          setZona2DoneCount((prev) => {
            const next = [...prev, "bu_sari"];
            if (next.length >= 3) {
              playBadgeFanfareSound();
              unlockBadge("b2");
              setCurrentZone("zona3");
              setActiveNotification("🎉 3 Warga Tertolong! Gerbang Zona 3 'Pohon Persatuan' Terbuka! (+50 Poin Bonus!)");
              addPoints(50, "Menyelesaikan Zona 2");
              setAdventureScore((s) => s + 65);
            } else {
              setActiveNotification(`🧺 Belanjaan Bu Sari sampai di rumah! (${next.length}/3 Warga)`);
              setAdventureScore((s) => s + 15);
            }
            return next;
          });
        },
      });
    } else if (npcId === "rina") {
      setDialogState({
        isOpen: true,
        title: "Tegur Penindas & Bela Rina (Anti-Bullying)",
        characterName: "Rina",
        characterAvatar: "😢",
        question: "Mereka mengejekku karena aku memakai kacamata tebal... Aku sedih sekali.",
        options: [
          { id: "A", text: "Menegur pengejek dengan sopan & tegas, lalu mengajak Rina bermain bersama.", isCorrect: true, explanation: "Kamu membela kemanusiaan yang adil dan beradab! Semua anak punya martabat setara." },
          { id: "B", text: "Ikut mengejek kacamata Rina agar ditertawakan teman.", isCorrect: false, explanation: "Bullying merusak persaudaraan dan melanggar hak asasi manusia." },
          { id: "C", text: "Diam saja dan pura-pura tidak melihat.", isCorrect: false, explanation: "Membiarkan ketidakadilan terjadi sama dengan mendukungnya." },
        ],
        onSuccess: () => {
          playCorrectSound();
          addPoints(15, "Membela Rina dari bullying");
          addNote({
            id: "z2_rina",
            zona: "Zona 2 - Rantai Kemanusiaan",
            namaObjek: "Bela Rina (Anti-Bullying)",
            soal: "Rina diejek karena memakai kacamata tebal.",
            jawabanUser: "Menegur pengejek dan mengajak Rina bermain bersama.",
            isCorrect: true,
            penjelasan: "Menghormati martabat sesama manusia dan menjauhi perundungan (anti-bullying).",
          });
          setZona2DoneCount((prev) => {
            const next = [...prev, "rina"];
            if (next.length >= 3) {
              playBadgeFanfareSound();
              unlockBadge("b2");
              setCurrentZone("zona3");
              setActiveNotification("🎉 3 Warga Tertolong! Gerbang Zona 3 'Pohon Persatuan' Terbuka! (+50 Poin Bonus!)");
              addPoints(50, "Menyelesaikan Zona 2");
              setAdventureScore((s) => s + 65);
            } else {
              setActiveNotification(`🛡️ Kamu membela kemanusiaan yang adil dan beradab! (${next.length}/3 Warga)`);
              setAdventureScore((s) => s + 15);
            }
            return next;
          });
        },
      });
    }
  }, [zona2DoneCount, addPoints, addNote, unlockBadge]);

  // ZONA 3: Scavenger Hunt 3 Daun Persatuan
  const triggerZona3Prompt = useCallback((leafId: string) => {
    if (zona3Leaves.includes(leafId)) {
      setActiveNotification("🍃 Daun Persatuan ini sudah kamu amankan!");
      setTimeout(() => setActiveNotification(null), 2500);
      return;
    }

    const leafMap: Record<string, { title: string; q: string; opt: any[]; desc: string }> = {
      gua: {
        title: "Daun Persatuan I (Di Dalam Gua)",
        desc: "Semboyan persatuan bangsa Indonesia adalah Bhinneka Tunggal Ika.",
        q: "Apa semboyan persatuan bangsa Indonesia yang dicengkeram Garuda Pancasila?",
        opt: [
          { id: "A", text: "Bhinneka Tunggal Ika (Berbeda-beda tetapi tetap satu jua).", isCorrect: true, explanation: "Semboyan persatuan Indonesia adalah Bhinneka Tunggal Ika." },
          { id: "B", text: "Tut Wuri Handayani.", isCorrect: false, explanation: "Itu semboyan pendidikan nasional." },
          { id: "C", text: "Garuda Pancasila Akulah Pendukungmu.", isCorrect: false, explanation: "Itu lirik lagu nasional, bukan semboyan resmi persatuan." },
        ],
      },
      bukit: {
        title: "Daun Persatuan II (Di Atas Bukit)",
        desc: "Cinta tanah air dan rela berkorban demi persatuan bangsa.",
        q: "Sikap yang paling mencerminkan pengamalan Sila ke-3 adalah...",
        opt: [
          { id: "A", text: "Cinta tanah air dan rela berkorban demi persatuan bangsa.", isCorrect: true, explanation: "Cinta tanah air adalah esensi luhur dari Sila ke-3." },
          { id: "B", text: "Mementingkan kepentingan suku sendiri di atas negara.", isCorrect: false, explanation: "Sikap egois kedaerahan merusak persatuan nasional." },
          { id: "C", text: "Acuh tak acuh terhadap keutuhan NKRI.", isCorrect: false, explanation: "Seluruh warga wajib menjaga keutuhan tanah air." },
        ],
      },
      batu: {
        title: "Daun Persatuan III (Di Balik Batu)",
        desc: "Persatuan sangat penting karena Indonesia beragam suku dan budaya.",
        q: "Mengapa persatuan sangat penting bagi kelangsungan bangsa Indonesia?",
        opt: [
          { id: "A", text: "Karena Indonesia terdiri dari ribuan pulau dan ratusan suku yang majemuk.", isCorrect: true, explanation: "Hanya dengan bersatu bangsa kita bisa kuat dan maju." },
          { id: "B", text: "Karena terpaksa oleh aturan hukum saja.", isCorrect: false, explanation: "Persatuan lahir dari rasa persaudaraan tulus seluruh rakyat." },
          { id: "C", text: "Sebenarnya persatuan tidak terlalu penting.", isCorrect: false, explanation: "Tanpa persatuan, bangsa kita akan mudah terpecah belah." },
        ],
      },
    };

    const lData = leafMap[leafId] ?? leafMap["gua"]!;

    setDialogState({
      isOpen: true,
      title: lData.title,
      characterName: "Tetua Suku Nusantara",
      characterAvatar: "🌳",
      question: lData.q,
      options: lData.opt,
      onSuccess: () => {
        playCoinSound();
        playCorrectSound();
        addPoints(10, `Mengambil ${lData.title}`);
        addNote({
          id: `z3_${leafId}`,
          zona: "Zona 3 - Pohon Persatuan",
          namaObjek: lData.title,
          soal: lData.q,
          jawabanUser: lData.opt[0]?.text ?? "",
          isCorrect: true,
          penjelasan: lData.desc,
        });

        setZona3Leaves((prev) => {
          const next = [...prev, leafId];
          if (next.length >= 3) {
            // Cutscene Damai 3 Suku
            playBadgeFanfareSound();
            unlockBadge("b3");
            setCurrentZone("zona4");
            setCutsceneText(
              "🌳 Suku A, B, dan C saling bersalaman rukun: 'Kita berbeda suku, tapi kita satu Indonesia! Bhinneka Tunggal Ika! Mari bergotong royong bersama!' Pohon Beringin menyala gemilang!"
            );
            setTimeout(() => setCutsceneText(null), 6000);
            setActiveNotification("🎉 3 Daun Diserahkan! 3 Suku Berdamai! Gerbang Zona 4 Terbuka! (+50 Poin Bonus!)");
            addPoints(50, "Menyelesaikan Zona 3");
            setAdventureScore((s) => s + 60);
          } else {
            setActiveNotification(`🍃 Daun Persatuan ${lData.title} Didapatkan! (${next.length}/3 Daun)`);
            setAdventureScore((s) => s + 10);
          }
          return next;
        });
      },
    });
  }, [zona3Leaves, addPoints, addNote, unlockBadge]);

  // ZONA 4: Ruang Musyawarah Mufakat Balai Desa
  const triggerZona4Prompt = useCallback(() => {
    if (zona4MusyawarahDone) {
      setActiveNotification("🗳️ Musyawarah Mufakat telah sukses disepakati!");
      setTimeout(() => setActiveNotification(null), 2500);
      return;
    }

    setDialogState({
      isOpen: true,
      title: "Ruang Musyawarah: Pimpin Musyawarah Class Meeting",
      characterName: "Andi, Budi, Citra, Dina (4 Siswa)",
      characterAvatar: "🗣️",
      question: "Andi ingin ke pantai, Budi usul di sekolah hemat biaya, Citra ingin di taman kota, Dina ingin di aula sekolah. Langkah musyawarah yang bijak adalah:",
      options: [
        { id: "A", text: "Dengarkan semua usulan, rangkum kelebihan tiap usulan, dan sepakati 'Pekan Ceria di Sekolah & Taman' secara mufakat.", isCorrect: true, explanation: "Musyawarah mufakat menghargai pendapat semua peserta secara adil dan bijaksana." },
        { id: "B", text: "Putuskan sendiri secara sepihak tanpa mendengarkan siapa pun.", isCorrect: false, explanation: "Keputusan sepihak mencerminkan sikap egois dan otoriter." },
        { id: "C", text: "Pilih usulan teman terdekat saja dan abaikan usulan siswa lain.", isCorrect: false, explanation: "Pilih kasih dalam musyawarah merusak semangat kekeluargaan." },
      ],
      onSuccess: () => {
        playBadgeFanfareSound();
        unlockBadge("b4");
        setZona4MusyawarahDone(true);
        setCurrentZone("zona5");
        addPoints(50, "Memimpin Musyawarah Mufakat");
        addNote({
          id: "z4_musyawarah",
          zona: "Zona 4 - Ruang Musyawarah",
          namaObjek: "Meja Musyawarah Balai Desa",
          soal: "Andi, Budi, Citra, dan Dina memiliki usulan class meeting yang berbeda.",
          jawabanUser: "Dengarkan semua usulan, rangkum, dan sepakati mufakat bersama.",
          isCorrect: true,
          penjelasan: "Sila ke-4 mengutamakan musyawarah mufakat dan menghargai perbedaan pendapat.",
        });
        setActiveNotification("🎉 Musyawarah Berhasil! Semua Siswa Puas! Gerbang Zona 5 'Timbangan Keadilan' Terbuka! (+50 Poin Bonus!)");
        setAdventureScore((s) => s + 50);
      },
    });
  }, [zona4MusyawarahDone, addPoints, addNote, unlockBadge]);

  // ZONA 5: Timbangan Keadilan (Mini-Game Hakim Cilik 3 Kasus)
  const triggerZona5Prompt = useCallback((caseKey: string) => {
    if (zona5CasesDone.includes(caseKey)) {
      setActiveNotification("⚖️ Kasus Keadilan ini sudah kamu putuskan secara bijak!");
      setTimeout(() => setActiveNotification(null), 2500);
      return;
    }

    const caseMap: Record<string, { title: string; q: string; opt: any[]; desc: string }> = {
      tugas: {
        title: "Kasus 1: Pembagian Tugas Kelompok (Di Sekolah)",
        desc: "Setiap orang dapat tugas seimbang sesuai kemampuannya.",
        q: "Kelompokmu punya 3 tugas: presentasi, laporan, dan dekorasi. Ada 3 anggota. Pembagian yang adil adalah:",
        opt: [
          { id: "A", text: "Setiap orang mendapat 1 tugas seimbang sesuai kemampuan dan saling membantu.", isCorrect: true, explanation: "Adil! Setiap anggota berkontribusi setara bagi kelompok." },
          { id: "B", text: "Semua tugas dikerjakan oleh ketua seorang diri.", isCorrect: false, explanation: "Tidak adil membebankan seluruh pekerjaan pada satu orang." },
          { id: "C", text: "Satu orang santai tanpa tugas tetapi tetap dapat nilai tinggi.", isCorrect: false, explanation: "Curang dan melanggar prinsip keadilan sosial." },
        ],
      },
      fasilitas: {
        title: "Kasus 2: Pemerataan Fasilitas Sekolah (Di Kantor)",
        desc: "Fasilitas diberikan kepada yang belum pernah mendapatkannya agar merata.",
        q: "Ada dana bantuan komputer untuk 1 kelas. Kelas A sudah dapat tahun lalu, Kelas B belum pernah. Ke mana dana diberikan?",
        opt: [
          { id: "A", text: "Kelas B, agar terjadi pemerataan fasilitas belajar yang adil.", isCorrect: true, explanation: "Adil! Pemerataan akses pendidikan bagi seluruh anak." },
          { id: "B", text: "Kelas A lagi, karena siswanya dianggap lebih pintar.", isCorrect: false, explanation: "Diskriminasi! Seluruh siswa berhak mendapat fasilitas setara." },
          { id: "C", text: "Disimpan saja dan tidak dibelikan apa-apa.", isCorrect: false, explanation: "Dana harus digunakan demi kemaslahatan bersama." },
        ],
      },
      karya: {
        title: "Kasus 3: Pengakuan Hak Cipta Hasil Kerja (Di Pameran)",
        desc: "Mengakui karya bersama secara jujur tanpa klaim sepihak.",
        q: "Karya robot kelompokmu dipamerkan di mall. Satu anak mengaku itu murni buatannya sendiri. Sikap adilmu:",
        opt: [
          { id: "A", text: "Klarifikasi dengan santun kepada dewan juri bahwa itu hasil karya bersama.", isCorrect: true, explanation: "Adil! Menghormati dan melindungi hak setiap anggota kelompok." },
          { id: "B", text: "Diamkan saja karena malas ribut.", isCorrect: false, explanation: "Mendiamkan ketidakjujuran merugikan kawan lainnya." },
          { id: "C", text: "Ikut-ikutan mengaku itu buatanmu sendiri.", isCorrect: false, explanation: "Tidak jujur dan melanggar moralitas Sila ke-5." },
        ],
      },
    };

    const cData = caseMap[caseKey] ?? caseMap["tugas"]!;

    setDialogState({
      isOpen: true,
      title: cData.title,
      characterName: "Hakim Cilik Keadilan",
      characterAvatar: "⚖️",
      question: cData.q,
      options: cData.opt,
      onSuccess: () => {
        playCoinSound();
        playCorrectSound();
        addPoints(15, `Memutuskan ${cData.title}`);
        addNote({
          id: `z5_${caseKey}`,
          zona: "Zona 5 - Timbangan Keadilan",
          namaObjek: cData.title,
          soal: cData.q,
          jawabanUser: cData.opt[0]?.text ?? "",
          isCorrect: true,
          penjelasan: cData.desc,
        });

        setZona5CasesDone((prev) => {
          const next = [...prev, caseKey];
          if (next.length >= 3) {
            playBadgeFanfareSound();
            unlockBadge("b5");
            setCurrentZone("misi_akbar");
            setActiveNotification("🎉 3 Kasus Diputuskan Adil! Gerbang MISI AKBAR 'Selamatkan Negeri Garuda' Terbuka! (+50 Poin Bonus!)");
            addPoints(50, "Menyelesaikan Zona 5");
            setAdventureScore((s) => s + 65);
          } else {
            setActiveNotification(`⚖️ Keputusan Kasus ${cData.title} Ditegakkan Adil! (${next.length}/3 Kasus)`);
            setAdventureScore((s) => s + 15);
          }
          return next;
        });
      },
    });
  }, [zona5CasesDone, addPoints, addNote, unlockBadge]);

  // FASE 6: MISI AKBAR — SELAMATKAN NEGERI GARUDA
  const triggerMisiAkbarPrompt = useCallback((crystalIndex: number) => {
    if (akbarCrystalsDone.includes(crystalIndex)) {
      setActiveNotification("💎 Kristal ini telah terpasang bercahaya di Altar Garuda!");
      setTimeout(() => setActiveNotification(null), 2500);
      return;
    }

    const crystalActions: Record<number, { title: string; q: string; opt: any[]; desc: string }> = {
      1: {
        title: "Kristal 1 (Sila 1): Berdiri di Zona Doa",
        desc: "Ketuhanan yang Maha Esa - Doa bersama bagi kedamaian bangsa.",
        q: "Berdirilah hening di zona doa selama 3 detik. Serukan doa untuk kedamaian seluruh rakyat Indonesia!",
        opt: [
          { id: "A", text: "Semoga Tuhan Yang Maha Esa senantiasa menjaga kedamaian dan persatuan Indonesia!", isCorrect: true, explanation: "Doa tulusmu membangkitkan Cahaya Ketuhanan di Altar Garuda." },
          { id: "B", text: "Saya tidak peduli dengan kedamaian sesama.", isCorrect: false, explanation: "Nilai Sila 1 mengajarkan kepedulian religius terhadap sesama." },
        ],
      },
      2: {
        title: "Kristal 2 (Sila 2): Tolong Rekan yang Terjatuh",
        desc: "Kemanusiaan yang Adil dan Beradab - Uluran tangan penyelamat.",
        q: "Seorang kawan penjelajah terpeleset di tangga altar. Tindakan kemanusiaanmu:",
        opt: [
          { id: "A", text: "Mengulurkan tangan dengan sigap dan membantunya naik ke pelataran altar.", isCorrect: true, explanation: "Uluran tanganmu mengaktifkan Kristal Rantai Kemanusiaan!" },
          { id: "B", text: "Menyalahkannya karena kurang hati-hati.", isCorrect: false, explanation: "Bukan menyalahkan, namun menolong adalah sikap mulia." },
        ],
      },
      3: {
        title: "Kristal 3 (Sila 3): Susun Puzzle Bendera Merah Putih",
        desc: "Persatuan Indonesia - Berkibarlah Sang Saka Merah Putih.",
        q: "Susun warna bendera kebangsaan kita secara benar dan kokoh di puncak tiang altar:",
        opt: [
          { id: "A", text: "Merah di bagian atas (keberanian) dan Putih di bagian bawah (kesucian).", isCorrect: true, explanation: "Sang Merah Putih berkibar megah menyatukan seluruh nusantara!" },
          { id: "B", text: "Putih di atas dan Merah di bawah.", isCorrect: false, explanation: "Susunan warna bendera Indonesia adalah Merah di atas, Putih di bawah." },
        ],
      },
      4: {
        title: "Kristal 4 (Sila 4): Soal Cepat Musyawarah",
        desc: "Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan.",
        q: "Apa inti utama dari musyawarah mufakat?",
        opt: [
          { id: "A", text: "Mencapai kesepakatan bersama yang mengutamakan kepentingan umum secara bijak.", isCorrect: true, explanation: "Mufakat melambangkan kebijaksanaan kepemimpinan bangsa." },
          { id: "B", text: "Pihak yang suaranya paling keras berhak menang mutlak.", isCorrect: false, explanation: "Musyawarah mengedepankan akal sehat dan hati nurani." },
        ],
      },
      5: {
        title: "Kristal 5 (Sila 5): Bagikan 5 Koin Merata ke 5 Rekan",
        desc: "Keadilan Sosial - Berbagi berkah tanpa membedakan teman.",
        q: "Ada 5 koin emas gotong royong dan 5 rekan penjelajah. Bagaimana pembagian yang adil?",
        opt: [
          { id: "A", text: "Setiap rekan mendapatkan masing-masing 1 koin emas secara adil dan merata.", isCorrect: true, explanation: "Sempurna! Keadilan sosial terwujud nyata bagi seluruh rakyat." },
          { id: "B", text: "Semua 5 koin diambil sendiri oleh ketua penjelajah.", isCorrect: false, explanation: "Itu ketamakan yang melanggar nilai Sila ke-5." },
        ],
      },
    };

    const curC = crystalActions[crystalIndex] ?? crystalActions[1]!;

    setDialogState({
      isOpen: true,
      title: curC.title,
      characterName: "Garuda Emas Nusantara",
      characterAvatar: "🦅",
      question: curC.q,
      options: curC.opt,
      onSuccess: () => {
        playCoinSound();
        playRobotAwakeSound();
        addPoints(20, `Memasang ${curC.title}`);
        addNote({
          id: `akbar_${crystalIndex}`,
          zona: "Misi Akbar - Selamatkan Negeri Garuda",
          namaObjek: curC.title,
          soal: curC.q,
          jawabanUser: curC.opt[0]?.text ?? "",
          isCorrect: true,
          penjelasan: curC.desc,
        });

        setAkbarCrystalsDone((prev) => {
          const next = [...prev, crystalIndex];
          if (next.length >= 5) {
            playBadgeFanfareSound();
            unlockBadge("b6");
            setCurrentZone("tamat");
            addPoints(100, "Menyelesaikan Misi Akbar Negeri Garuda");
            setActiveNotification("🏆 PANCASILA HIDUP DALAM DIRIMU! SELURUH CAHAYA GARUDA TELAH PULIH! (+100 Poin Akbar!)");
            setAdventureScore((s) => s + 120);
          } else {
            setActiveNotification(`💎 Kristal ${crystalIndex}/5 Berhasil Disematkan! Cahaya Garuda Semakin Terang!`);
            setAdventureScore((s) => s + 20);
          }
          return next;
        });
      },
    });
  }, [akbarCrystalsDone, addPoints, addNote, unlockBadge]);

  // --------------------------------------------------------------------------
  // ENGINE 3D THREE.JS UNTUK LOBBY & 5 ZONA & MISI AKBAR
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !mountEl) return;

    const mount = mountEl;

    // 1. SETUP SCENE, CAMERA, & RENDERER
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#87CEEB"); // Langit Biru Cerah (#87CEEB sesuai blueprint)
    scene.fog = new THREE.FogExp2("#93c5fd", 0.006);

    const getViewportSize = () => {
      const rect = mount.getBoundingClientRect();
      const w = rect.width > 50 ? Math.floor(rect.width) : (mount.clientWidth > 50 ? mount.clientWidth : window.innerWidth);
      const h = rect.height > 50 ? Math.floor(rect.height) : (mount.clientHeight > 50 ? mount.clientHeight : Math.max(300, window.innerHeight - 56));
      return { w, h };
    };

    const { w: initW, h: initH } = getViewportSize();

    const camera = new THREE.PerspectiveCamera(58, initW / initH, 0.1, 1000);
    camera.position.set(0, 4.5, 16);
    camera.lookAt(0, 1.8, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor("#87CEEB", 1);
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

    // 2. LIGHTING (Terang & Hangat Sesuai Blueprint)
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

    // 3. TERRAIN BESAR (Rumput Hijau #228B22 + Jalur Batu Kuning Emas)
    const groundGeo = new THREE.PlaneGeometry(120, 580);
    const groundMat = new THREE.MeshLambertMaterial({ color: "#228B22" });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, 0, -220);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Jalur Jalan Utama Desa
    const pathGeo = new THREE.PlaneGeometry(12, 560);
    const pathMat = new THREE.MeshLambertMaterial({ color: "#fef08a" });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.02, -220);
    scene.add(pathMesh);

    // Tebing Pembatas Kiri & Kanan
    const wallGeo = new THREE.BoxGeometry(4, 20, 580);
    const wallMat = new THREE.MeshLambertMaterial({ color: "#b45309" });
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-54, 10, -220);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(54, 10, -220);
    scene.add(rightWall);

    // ------------------------------------------------------------------------
    // FASE 0: LOBBY & PATUNG GARUDA (TINGGI 20 STUD SESUAI BLUEPRINT)
    // ------------------------------------------------------------------------
    const lobbyGroup = new THREE.Group();
    const podMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 8.5, 3, 16),
      new THREE.MeshLambertMaterial({ color: "#e2e8f0" })
    );
    podMesh.position.set(0, 1.5, 0);
    lobbyGroup.add(podMesh);

    // Model Garuda Emas 20 Stud
    const garudaGoldMat = new THREE.MeshLambertMaterial({ color: "#FFD700", emissive: "#b45309" });
    const gBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 4.5, 1.8), garudaGoldMat);
    gBody.position.set(0, 5.2, 0);
    lobbyGroup.add(gBody);

    const gLeftWing = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.8, 0.4), garudaGoldMat);
    gLeftWing.position.set(-3.6, 5.8, 0);
    gLeftWing.rotation.z = Math.PI / 8;
    lobbyGroup.add(gLeftWing);

    const gRightWing = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.8, 0.4), garudaGoldMat);
    gRightWing.position.set(3.6, 5.8, 0);
    gRightWing.rotation.z = -Math.PI / 8;
    lobbyGroup.add(gRightWing);

    const gHead = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.5), garudaGoldMat);
    gHead.position.set(0, 8.0, 0.4);
    lobbyGroup.add(gHead);

    const gBeak = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 4), new THREE.MeshLambertMaterial({ color: "#ea580c" }));
    gBeak.rotation.x = Math.PI / 2;
    gBeak.position.set(0, 7.8, 1.4);
    lobbyGroup.add(gBeak);

    scene.add(lobbyGroup);

    // NPC PAK GURU VIRTUAL (Kemeja Batik Biru + Peci Hitam)
    const guruGroup = new THREE.Group();
    const guruB = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.6, 0.8), new THREE.MeshLambertMaterial({ color: "#0284c7" }));
    guruB.position.y = 2.2;
    guruGroup.add(guruB);

    const guruH = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), new THREE.MeshLambertMaterial({ color: "#fed7aa" }));
    guruH.position.y = 3.45;
    guruGroup.add(guruH);

    const guruP = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.4, 0.95), new THREE.MeshLambertMaterial({ color: "#0f172a" }));
    guruP.position.y = 3.95;
    guruGroup.add(guruP);

    // Label Pak Guru
    const guruCanvas = document.createElement("canvas");
    guruCanvas.width = 300;
    guruCanvas.height = 64;
    const gCtx = guruCanvas.getContext("2d")!;
    gCtx.fillStyle = "#ffffff";
    gCtx.font = "bold 26px sans-serif";
    gCtx.textAlign = "center";
    gCtx.fillText("👨‍🏫 Pak Guru Virtual", 150, 42);
    const guruSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(guruCanvas) }));
    guruSprite.position.set(0, 4.8, 0);
    guruSprite.scale.set(3.2, 0.7, 1);
    guruGroup.add(guruSprite);

    guruGroup.position.set(-4, 0, 8);
    scene.add(guruGroup);

    // 5 PILAR MODE BELAJAR (SILINDER 8 STUD SESUAI BLUEPRINT)
    const pilarColors = ["#FFD700", "#f97316", "#22c55e", "#ef4444", "#eab308"];
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
    const z1House = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 14), new THREE.MeshLambertMaterial({ color: "#bae6fd" }));
    z1House.position.set(16, 5, -70);
    scene.add(z1House);

    const z1SymbolPositions = [
      { x: -5, z: -55, id: "lilin" },
      { x: 4, z: -62, id: "kitab" },
      { x: -3, z: -70, id: "bunga" },
      { x: 5, z: -78, id: "dupa" },
      { x: -2, z: -85, id: "lentera" },
    ];

    const z1Meshes: THREE.Mesh[] = [];
    z1SymbolPositions.forEach((sp) => {
      const symMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.8),
        new THREE.MeshLambertMaterial({ color: "#FFD700", emissive: "#eab308" })
      );
      symMesh.position.set(sp.x, 1.4, sp.z);
      scene.add(symMesh);
      z1Meshes.push(symMesh);
    });

    // ------------------------------------------------------------------------
    // FASE 2: ZONA 2 "RANTAI KEMANUSIAAN" (Z = -120 s/d Z = -160)
    // ------------------------------------------------------------------------
    const z2House = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 12), new THREE.MeshLambertMaterial({ color: "#fed7aa" }));
    z2House.position.set(-18, 4, -140);
    scene.add(z2House);

    // Adi Terjatuh Sepeda (Z = -128)
    const doniGroup = new THREE.Group();
    const doniB = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.4), new THREE.MeshLambertMaterial({ color: "#ea580c" }));
    doniB.position.y = 0.35;
    doniGroup.add(doniB);
    doniGroup.position.set(3, 0, -128);
    scene.add(doniGroup);

    // Bu Sari Bawa Belanjaan (Z = -142)
    const sitiGroup = new THREE.Group();
    const sitiB = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.7), new THREE.MeshLambertMaterial({ color: "#ec4899" }));
    sitiB.position.y = 1.8;
    sitiGroup.add(sitiB);
    sitiGroup.position.set(-4, 0, -142);
    scene.add(sitiGroup);

    // Rina Anti-Bullying (Z = -156)
    const rianGroup = new THREE.Group();
    const rianB = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.7), new THREE.MeshLambertMaterial({ color: "#6366f1" }));
    rianB.position.y = 1.8;
    rianGroup.add(rianB);
    rianGroup.position.set(2, 0, -156);
    scene.add(rianGroup);

    // ------------------------------------------------------------------------
    // FASE 3: ZONA 3 "POHON PERSATUAN" (POHON BERINGIN 40 STUD SESUAI BLUEPRINT)
    // ------------------------------------------------------------------------
    const beringinGroup = new THREE.Group();
    const trunkMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 4.0, 14, 12), new THREE.MeshLambertMaterial({ color: "#78350f" }));
    trunkMesh.position.y = 7;
    beringinGroup.add(trunkMesh);
    const crownMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(8.5), new THREE.MeshLambertMaterial({ color: "#15803d" }));
    crownMesh.position.y = 16;
    beringinGroup.add(crownMesh);
    beringinGroup.position.set(0, 0, -210);
    scene.add(beringinGroup);

    // 3 Daun Persatuan: Gua (Z = -198), Bukit (Z = -212), Batu (Z = -225)
    const leafPositions = [
      { x: -9, z: -198, id: "gua" },
      { x: 8, z: -212, id: "bukit" },
      { x: -7, z: -225, id: "batu" },
    ];
    const leafMeshes: THREE.Mesh[] = [];
    leafPositions.forEach((lp) => {
      const lMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), new THREE.MeshLambertMaterial({ color: "#22c55e", emissive: "#16a34a" }));
      lMesh.position.set(lp.x, 1.5, lp.z);
      scene.add(lMesh);
      leafMeshes.push(lMesh);
    });

    // ------------------------------------------------------------------------
    // FASE 4: ZONA 4 "RUANG MUSYAWARAH" (BALAI DESA & MEJA BUNDAR)
    // ------------------------------------------------------------------------
    const balaiDesa = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 16), new THREE.MeshLambertMaterial({ color: "#fecaca" }));
    balaiDesa.position.set(16, 4.5, -280);
    scene.add(balaiDesa);

    const tableMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 1.2, 16), new THREE.MeshLambertMaterial({ color: "#b91c1c" }));
    tableMesh.position.set(0, 0.6, -280);
    scene.add(tableMesh);

    // ------------------------------------------------------------------------
    // FASE 5: ZONA 5 "TIMBANGAN KEADILAN" (MONUMEN TIMBANGAN EMAS)
    // ------------------------------------------------------------------------
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
    // FASE 6: MISI AKBAR (GARUDA RAKSASA & ALTARE)
    // ------------------------------------------------------------------------
    const akbarAltar = new THREE.Mesh(new THREE.CylinderGeometry(10, 12, 3, 24), new THREE.MeshLambertMaterial({ color: "#1e1b4b" }));
    akbarAltar.position.set(0, 1.5, -430);
    scene.add(akbarAltar);

    const megaGaruda = lobbyGroup.clone();
    megaGaruda.scale.set(2.4, 2.4, 2.4);
    megaGaruda.position.set(0, 3, -430);
    scene.add(megaGaruda);

    // ------------------------------------------------------------------------
    // KARAKTER SISWA SD MERAH PUTIH INDONESIA
    // ------------------------------------------------------------------------
    const playerGroup = new THREE.Group();

    // Torso Putih SD + Dasi Merah
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.7), new THREE.MeshLambertMaterial({ color: "#ffffff" }));
    torsoMesh.position.y = 2.15;
    playerGroup.add(torsoMesh);

    const tieMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.9, 0.08), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
    tieMesh.position.set(0, 2.15, 0.38);
    playerGroup.add(tieMesh);

    const backpackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.45), new THREE.MeshLambertMaterial({ color: "#f97316" }));
    backpackMesh.position.set(0, 2.2, -0.45);
    playerGroup.add(backpackMesh);

    // Kepala + Topi Merah Putih
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), new THREE.MeshLambertMaterial({ color: "#fed7aa" }));
    headMesh.position.y = 3.35;
    playerGroup.add(headMesh);

    const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.35, 0.92), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
    capTop.position.y = 3.95;
    playerGroup.add(capTop);

    const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.45), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
    capVisor.position.set(0, 3.82, 0.55);
    playerGroup.add(capVisor);

    // Lengan & Kaki
    const leftArm = new THREE.Group();
    const lSlv = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.6, 0.48), new THREE.MeshLambertMaterial({ color: "#ffffff" }));
    lSlv.position.y = 0.3;
    const lHnd = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.7, 0.44), new THREE.MeshLambertMaterial({ color: "#fed7aa" }));
    lHnd.position.y = -0.3;
    leftArm.add(lSlv);
    leftArm.add(lHnd);
    leftArm.position.set(-0.95, 2.15, 0);
    playerGroup.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.add(lSlv.clone());
    rightArm.add(lHnd.clone());
    rightArm.position.set(0.95, 2.15, 0);
    playerGroup.add(rightArm);

    const leftLeg = new THREE.Group();
    const lPnt = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.55), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
    lPnt.position.y = 0.35;
    const lSh = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.35, 0.65), new THREE.MeshLambertMaterial({ color: "#0f172a" }));
    lSh.position.set(0, -0.45, 0.05);
    leftLeg.add(lPnt);
    leftLeg.add(lSh);
    leftLeg.position.set(-0.35, 0.7, 0);
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.add(lPnt.clone());
    rightLeg.add(lSh.clone());
    rightLeg.position.set(0.35, 0.7, 0);
    playerGroup.add(rightLeg);

    // Label Penjelajah
    const nameCanvas = document.createElement("canvas");
    nameCanvas.width = 340;
    nameCanvas.height = 64;
    const nCtx = nameCanvas.getContext("2d")!;
    nCtx.fillStyle = "#ffffff";
    nCtx.font = "bold 26px sans-serif";
    nCtx.textAlign = "center";
    nCtx.fillText("🎒 Penjelajah Pancasila", 170, 42);
    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(nameCanvas) }));
    nameSprite.position.set(0, 4.6, 0);
    nameSprite.scale.set(3.6, 0.75, 1);
    playerGroup.add(nameSprite);

    playerGroup.position.set(0, 0, 8);
    scene.add(playerGroup);

    // ------------------------------------------------------------------------
    // GAME LOOP
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

        // Batasi batas arena
        playerGroup.position.x = Math.max(-42, Math.min(42, playerGroup.position.x));
        playerGroup.position.z = Math.max(-460, Math.min(22, playerGroup.position.z));

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

      playerPosRef.current = {
        x: playerGroup.position.x,
        y: playerGroup.position.y,
        z: playerGroup.position.z,
      };

      // Efek rotasi mengapung kristal & daun
      z1Meshes.forEach((m) => (m.rotation.y += delta * 1.5));
      leafMeshes.forEach((m) => (m.rotation.y += delta * 2.0));

      // Third-person camera tracking
      const camTargetX = playerGroup.position.x;
      const camTargetY = playerGroup.position.y + 4.5;
      const camTargetZ = playerGroup.position.z + 8.5;

      camera.position.x += (camTargetX - camera.position.x) * 0.12;
      camera.position.y += (camTargetY - camera.position.y) * 0.12;
      camera.position.z += (camTargetZ - camera.position.z) * 0.12;
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.8, playerGroup.position.z - 3);

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
        const pz = playerPosRef.current.z;
        const px = playerPosRef.current.x;

        // Dekat Pak Guru di Lobby
        if (Math.abs(pz - 8) < 4 && Math.abs(px - (-4)) < 4) {
          setShowGuruPrompt(true);
        }
        // Dekat 5 Pilar Mode Belajar
        else if (pz > -18 && pz < 10) {
          pilarCoords.forEach((pc) => {
            if (Math.abs(pz - pc.z) < 3.5 && Math.abs(px - pc.x) < 3.5) {
              const matchedPilar = pilarMateriList.find((item) => item.sila === pc.sila);
              if (matchedPilar) setSelectedPilar(matchedPilar);
            }
          });
        }
        // Zona 1: 5 Objek
        if (pz <= -50 && pz >= -90) {
          z1SymbolPositions.forEach((sp) => {
            if (Math.abs(pz - sp.z) < 4.5 && Math.abs(px - sp.x) < 4.5) {
              triggerZona1Prompt(sp.id);
            }
          });
        }
        // Zona 2: 3 Warga
        else if (pz <= -120 && pz >= -160) {
          if (Math.abs(pz - (-128)) < 4.5) triggerZona2Prompt("adi");
          if (Math.abs(pz - (-142)) < 4.5) triggerZona2Prompt("bu_sari");
          if (Math.abs(pz - (-156)) < 4.5) triggerZona2Prompt("rina");
        }
        // Zona 3: 3 Daun Persatuan
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
        // Zona 5: 3 Kasus Keadilan
        else if (pz <= -330 && pz >= -370) {
          if (Math.abs(pz - (-345)) < 5) triggerZona5Prompt("tugas");
          if (Math.abs(pz - (-355)) < 5) triggerZona5Prompt("fasilitas");
          if (Math.abs(pz - (-365)) < 5) triggerZona5Prompt("karya");
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
        {/* TOP HUD BAR ROBLOX */}
        <header className="h-14 bg-slate-900/95 border-b-2 border-yellow-400 text-white px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-lg z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-xl shadow-md shrink-0">
              🦅
            </span>
            <div className="min-w-0">
              <h2 id="negeri-garuda-title" className="font-black text-sm sm:text-base text-yellow-300 truncate tracking-wide">
                PETUALANGAN PANCASILA: JELAJAH NEGERI GARUDA
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                Fase: <b className="text-emerald-400 uppercase">{currentZone.replace("_", " ")}</b> • Materi: {resolvedTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Tombol 📖 Buku Catatan Pelajar */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowNotebook(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-full text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>📖</span>
              <span className="hidden sm:inline">Buku Catatan ({notebookNotes.length})</span>
            </button>

            {/* Tombol 🎖️ Badges Penghargaan */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowBadgesModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-full text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🎖️</span>
              <span className="hidden sm:inline">
                Badges ({badges.filter((b) => b.unlocked).length}/6)
              </span>
            </button>

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
                  ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
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
                  Jadilah <b>Penjelajah Muda Pancasila</b>! Jelajahi 5 Zona luhur bangsa, bantu warga desa, kumpulkan daun persatuan, pimpin musyawarah mufakat, tegakkan keadilan, dan pulihkan cahaya Garuda dalam <b>Misi Akbar</b> gotong royong!
                </p>
                <div className="bg-slate-900/90 p-3 rounded-2xl border border-yellow-400/30 text-xs text-yellow-200 flex items-center justify-center gap-4">
                  <span>🎮 <b>WASD / Panah</b>: Gerak</span>
                  <span>•</span>
                  <span>🟡 <b>Spasi</b>: Lompat</span>
                  <span>•</span>
                  <span>⚡ <b>Shift</b>: Sprint</span>
                  <span>•</span>
                  <span>🎯 <b>E</b>: Interaksi ProximityPrompt</span>
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
                <span>▶️ MULAI JELAJAH NEGERI GARUDA (DENGAN MUSIK 🎵)</span>
              </button>
            </div>
          )}

          {/* HUD PROGRESS 5 ZONA & MISI AKBAR DI ATAS */}
          <div className="absolute top-3 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between gap-1 sm:gap-2 bg-slate-900/85 backdrop-blur-md p-2 rounded-2xl border border-yellow-400/40">
            {[
              { id: "lobby", label: "Lobby Garuda", icon: "🏛️" },
              { id: "zona1", label: "Zona 1: Cahaya Ketuhanan", icon: "⭐" },
              { id: "zona2", label: "Zona 2: Rantai Kemanusiaan", icon: "🔗" },
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

          {/* NOTIFIKASI DI LAYAR */}
          {activeNotification && (
            <div className="absolute top-18 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 max-w-xl bg-slate-900/95 border-2 border-yellow-400 p-3.5 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in text-white text-xs sm:text-sm font-bold backdrop-blur-md">
              {activeNotification}
            </div>
          )}

          {/* CUTSCENE BANNER (ZONA 3 POHON BERINGIN) */}
          {cutsceneText && (
            <div className="absolute inset-x-8 bottom-24 z-40 bg-emerald-950/95 border-4 border-emerald-400 p-5 rounded-3xl text-center text-white text-sm sm:text-base font-black shadow-2xl animate-in fade-in zoom-in-95 backdrop-blur-md">
              {cutsceneText}
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
                      Pilar Mode Belajar Sila ke-{selectedPilar.sila}
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
                    "Selamat datang, Penjelajah Muda! Negeri Garuda kehilangan cahayanya. Tugasmu memulihkannya!"
                  </p>
                  <p>
                    "Ada 5 zona yang harus kamu lewati. Setiap zona mengajarkan satu sila Pancasila. Tekan <b>E</b> di dekat objek atau warga untuk berinteraksi. Selamat berpetualang!"
                  </p>
                  <p className="text-yellow-300 font-bold">
                    "Butuh bantuan belajar? Coba baca 5 pilar di sebelahku!"
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

          {/* MODAL 📖 BUKU CATATAN PELAJAR (SESUAI BLUEPRINT) */}
          {showNotebook && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900 border-4 border-emerald-400 rounded-3xl max-w-xl w-full p-6 text-white space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">📖</span>
                    <div>
                      <h3 className="font-black text-base text-emerald-300">
                        Buku Catatan Penjelajah Pancasila
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Daftar soal, jawaban, dan penjelasan nilai yang telah kamu selesaikan
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotebook(false)}
                    className="text-slate-400 hover:text-white text-base px-2 py-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  {notebookNotes.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 space-y-2">
                      <span className="text-4xl block">📝</span>
                      <p>Buku catatanmu masih kosong.</p>
                      <p className="text-[11px]">Jelajahi zona dan selesaikan tantangan untuk mencatat nilai-nilai luhur!</p>
                    </div>
                  ) : (
                    notebookNotes.map((n, i) => (
                      <div
                        key={i}
                        className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-emerald-400">{n.zona}</span>
                          <span className="text-[10px] text-slate-400">{n.waktu}</span>
                        </div>
                        <div className="font-bold text-white text-xs">
                          {n.namaObjek}: "{n.soal}"
                        </div>
                        <div className="text-slate-300">
                          <b>Jawabanmu:</b> {n.jawabanUser}
                        </div>
                        <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl text-emerald-300 text-[11px]">
                          💡 <b>Penjelasan:</b> {n.penjelasan}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNotebook(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Tutup Buku Catatan
                </button>
              </div>
            </div>
          )}

          {/* MODAL 🎖️ BADGES PENGHARGAAN (SESUAI BLUEPRINT) */}
          {showBadgesModal && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900 border-4 border-amber-400 rounded-3xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🎖️</span>
                    <div>
                      <h3 className="font-black text-base text-amber-300">
                        Lencana Penghargaan Petualangan
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Koleksi 6 badge kehormatan pengamalan Pancasila
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBadgesModal(false)}
                    className="text-slate-400 hover:text-white text-base px-2 py-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      className={`p-3 rounded-2xl border flex items-center gap-3 ${
                        b.unlocked
                          ? "bg-amber-400/20 border-yellow-400 text-yellow-200"
                          : "bg-slate-800/50 border-slate-700/60 opacity-60 text-slate-400"
                      }`}
                    >
                      <span className="text-3xl">{b.unlocked ? b.symbol : "🔒"}</span>
                      <div className="min-w-0">
                        <h4 className="font-black text-xs text-white truncate">
                          {b.name}
                        </h4>
                        <p className="text-[10px] text-slate-300 leading-tight">
                          {b.desc}
                        </p>
                        <span className="text-[9px] font-bold block mt-0.5 text-amber-400">
                          {b.unlocked ? "✓ Berhasil Diraih" : "Terkunci"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowBadgesModal(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Tutup Lencana
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
                    { rank: "🥇", name: "Budi Santoso", score: "480 Poin", badge: "Pancasila Sejati" },
                    { rank: "🥈", name: "Siti Rahma", score: "420 Poin", badge: "Ksatria Kemanusiaan" },
                    { rank: "🥉", name: "Edo Pratama", score: "360 Poin", badge: "Pemimpin Musyawarah" },
                    { rank: "4", name: "Kamu (Siswa)", score: `${adventureScore} Poin`, badge: "Penjelajah Aktif", highlight: true },
                    { rank: "5", name: "Dayu Kemala", score: "290 Poin", badge: "Penegak Keadilan" },
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
                  <h3 className="font-black text-2xl sm:text-3xl text-yellow-300">
                    PANCASILA HIDUP DALAM DIRIMU! 🇮🇩
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Kamu telah menyelesaikan seluruh petualangan 5 Sila dan memimpin gotong royong memulihkan Negeri Garuda!
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
                    🪙 Total Skor Akhir: {adventureScore} Poin • +100 Poin Prestasi Pelajar!
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setCurrentZone("lobby");
                    setAdventureScore(0);
                    setZona1DoneCount([]);
                    setZona2DoneCount([]);
                    setZona3Leaves([]);
                    setZona4MusyawarahDone(false);
                    setZona5CasesDone([]);
                    setAkbarCrystalsDone([]);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-black py-3 rounded-full text-sm shadow-xl transition cursor-pointer"
                >
                  🔄 Kembali ke Lobby Negeri Garuda
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
