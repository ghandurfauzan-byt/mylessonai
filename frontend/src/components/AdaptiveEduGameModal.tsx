// frontend/src/components/AdaptiveEduGameModal.tsx
// Game Edukasi 3D Roblox: "Jelajah Suku Nusantara & Desa Pancasila Online"
// Fitur Baru:
// 1. Leaderboard Kelas di Awalan (di samping Gapura Masuk)
// 2. Pak Guru Virtual dengan Voice Suara Penjelasan Nyata (Web Speech API id-ID):
//    - Penjelasan apa itu Pancasila
//    - Makna per Sila (1 s/d 5) dan contoh implementasinya
//    - Arahan cara bermain game petualangan
// 3. Petunjuk Layar Awal mengarahkan pemain ke Pak Guru ("👉 Temui Pak Guru Virtual")
// 4. Fitur Siswa Kelas Online: Teman-teman sekelas muncul saat join dengan kostum berbeda
//    (Pramuka cokelat, Batik hijau, Kaos olahraga biru, Batik ungu)
// 5. Interaksi antar-siswa: Sapa & Dadah ("👋 Hai kawan! Semangat belajar Pancasila!")
// 6. Koin emas di sepanjang jalan pedesaan & 5 Rumah Suku Adat

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
  playOofSound,
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

// Model Suku Nusantara
interface SukuAdat {
  id: string;
  namaSuku: string;
  rumahAdat: string;
  tokohNama: string;
  tokohAvatar: string;
  silaKe: number;
  simbolSila: string;
  zPos: number;
  xPos: number;
  warnaKhas: string;
  pertanyaan: string;
  opsi: {
    id: string;
    teks: string;
    benar: boolean;
    penjelasan: string;
  }[];
}

// Model Koin di Jalan
interface RoadCoin {
  id: number;
  x: number;
  y: number;
  z: number;
  mesh?: THREE.Mesh;
  collected: boolean;
}

// Model Siswa Online (Classmate)
interface OnlineStudent {
  id: string;
  name: string;
  avatar: string;
  costumeName: string;
  shirtColor: string;
  pantsColor: string;
  hatType: "pramuka_beret" | "hair_black" | "sport_hair" | "hair_ribbon";
  x: number;
  z: number;
  speed: number;
  dir: number;
  isOnline: boolean;
  mesh?: THREE.Group;
  leftArm?: THREE.Group;
  rightArm?: THREE.Group;
  leftLeg?: THREE.Group;
  rightLeg?: THREE.Group;
  walkAnim?: number;
  lastGreeting?: string;
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
  const [adventureScore, setAdventureScore] = useState(0);
  const [coinsCollectedCount, setCoinsCollectedCount] = useState(0);
  const [visitedSukuIds, setVisitedSukuIds] = useState<string[]>([]);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [allSukuCompleted, setAllSukuCompleted] = useState(false);

  // Status Panduan Pak Guru
  const [hasTalkedToGuru, setHasTalkedToGuru] = useState(false);
  const [showGuruDialog, setShowGuruDialog] = useState(false);
  const [guruTab, setGuruTab] = useState<"apa_itu" | "makna_sila" | "cara_main">("apa_itu");
  const [isGuruSpeaking, setIsGuruSpeaking] = useState(false);

  // Deteksi Cerdas 1 Materi = 1 Model Game Spesifik:
  // Materi Bahasa/Kosakata/Aksara -> Game Menjodohkan Kartu Pasangan
  // Materi Pancasila/PKn/Gotong Royong/Nilai -> Game Petualangan 3D Desa
  const isMatchingGame = useMemo(() => {
    const title = (activeValidatedModule?.title || chapterTitle || chapter || "").toLowerCase();
    const subj = (activeValidatedModule?.subject || "").toLowerCase();
    return (
      subj.includes("jawa") ||
      title.includes("jawa") ||
      title.includes("aksara") ||
      title.includes("pandhawa") ||
      title.includes("unggah") ||
      chapter.toLowerCase().includes("bjawa")
    );
  }, [activeValidatedModule?.title, activeValidatedModule?.subject, chapterTitle, chapter]);

  // State Game Menjodohkan Kartu (untuk materi Basa Jawa / Kosakata)
  interface MatchCardItem {
    uid: string;
    pairId: string;
    text: string;
    category: string;
    isMatched: boolean;
  }
  const [matchingCards, setMatchingCards] = useState<MatchCardItem[]>([]);
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]);
  const [matchingMoves, setMatchingMoves] = useState(0);
  const [matchingDone, setMatchingDone] = useState(false);

  // Inisialisasi Kartu Menjodohkan
  useEffect(() => {
    if (!isOpen || !isMatchingGame) return;
    const titleLower = resolvedTitle.toLowerCase();
    let pairs = [
      { id: "1", term: "Basa Krama Alus", match: "Matur marang Wong Tuwa", category: "Unggah-Ungguh" },
      { id: "2", term: "Basa Ngoko Lugu", match: "Guneman karo Kanca Sebaya", category: "Unggah-Ungguh" },
      { id: "3", term: "Rukun Agawe Santosa", match: "Crah Agawe Bubrah", category: "Bebasan" },
      { id: "4", term: "Subasita & Trapsila", match: "Tata Krama kang Becik", category: "Budi Pekerti" },
      { id: "5", term: "Tepa Selira", match: "Tenggang Rasa marang Kanca", category: "Budi Pekerti" },
      { id: "6", term: "Mikul Dhuwur", match: "Ngajeni Asmane Wong Tuwa", category: "Bebasan" },
    ];

    if (titleLower.includes("aksara")) {
      pairs = [
        { id: "1", term: "ꦲ (Ha)", match: "Aksara Jawa Ha", category: "Aksara Legena" },
        { id: "2", term: "ꦤ (Na)", match: "Aksara Jawa Na", category: "Aksara Legena" },
        { id: "3", term: "Sandhangan Wulu", match: "Swara 'i' ing Aksara", category: "Sandhangan" },
        { id: "4", term: "Sandhangan Suku", match: "Swara 'u' ing Aksara", category: "Sandhangan" },
        { id: "5", term: "Sandhangan Taling", match: "Swara 'é' ing Aksara", category: "Sandhangan" },
        { id: "6", term: "Aksara Legena", match: "Cacahe Ana 20 Aksara", category: "Dhasar" },
      ];
    } else if (titleLower.includes("pandhawa")) {
      pairs = [
        { id: "1", term: "Raden Puntadewa", match: "Watak Jujur Ora Tau Goroh", category: "Pandhawa" },
        { id: "2", term: "Raden Werkudara", match: "Kendel Mbelani Bebener", category: "Pandhawa" },
        { id: "3", term: "Raden Janaka", match: "Alus Budine lan Sekti", category: "Pandhawa" },
        { id: "4", term: "Nakula & Sadewa", match: "Setya Tuhu Sedulur Kembar", category: "Pandhawa" },
        { id: "5", term: "Pandhawa Lima", match: "Putra Prabu Pandu Dewanata", category: "Silsilah" },
        { id: "6", term: "Perang Baratayuda", match: "Mbelani Kasunyatan lan Adil", category: "Kisah" },
      ];
    }

    const cards: MatchCardItem[] = [];
    pairs.forEach((p, idx) => {
      cards.push({ uid: `${p.id}-term-${idx}`, pairId: p.id, text: p.term, category: p.category, isMatched: false });
      cards.push({ uid: `${p.id}-match-${idx}`, pairId: p.id, text: p.match, category: p.category, isMatched: false });
    });
    setMatchingCards(cards.sort(() => Math.random() - 0.5));
    setSelectedCardIndices([]);
    setMatchingMoves(0);
    setMatchingDone(false);
  }, [isOpen, isMatchingGame, resolvedTitle]);

  const handleMatchCardClick = (idx: number) => {
    if (selectedCardIndices.length >= 2 || selectedCardIndices.includes(idx) || matchingCards[idx].isMatched) return;

    playClickSound();
    const next = [...selectedCardIndices, idx];
    setSelectedCardIndices(next);

    if (next.length === 2) {
      setMatchingMoves((m) => m + 1);
      const [fIdx, sIdx] = next;
      const first = matchingCards[fIdx];
      const second = matchingCards[sIdx];

      if (first.pairId === second.pairId) {
        playCorrectSound();
        playCoinSound();
        setAdventureScore((s) => s + 15);
        addPoints(15, `Menjodohkan kartu cocok: ${first.text}`);

        setTimeout(() => {
          setMatchingCards((prev) => {
            const updated = prev.map((c, i) => (i === fIdx || i === sIdx ? { ...c, isMatched: true } : c));
            if (updated.every((c) => c.isMatched)) {
              playBadgeFanfareSound();
              setMatchingDone(true);
              addPoints(30, "Menyelesaikan seluruh pasangan kartu!");
            }
            return updated;
          });
          setSelectedCardIndices([]);
        }, 500);
      } else {
        playOofSound();
        setTimeout(() => setSelectedCardIndices([]), 1000);
      }
    }
  };

  // Dialog Kuis Rumah Suku
  const [activeSukuDialog, setActiveSukuDialog] = useState<SukuAdat | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // Sapaan Interaksi Teman
  const [friendGreetingBubble, setFriendGreetingBubble] = useState<{ name: string; text: string } | null>(null);

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
  const playerPosRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 18 });

  // --------------------------------------------------------------------------
  // SUARA PENJELASAN PAK GURU (WEB SPEECH SYNTHESIS API - BAHASA INDONESIA)
  // --------------------------------------------------------------------------
  const speakGuruVoice = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) =>
          v.lang.includes("id") ||
          v.lang.includes("ID") ||
          v.name.toLowerCase().includes("indonesia")
      );
      if (idVoice) utterance.voice = idVoice;

      utterance.onstart = () => setIsGuruSpeaking(true);
      utterance.onend = () => setIsGuruSpeaking(false);
      utterance.onerror = () => setIsGuruSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsGuruSpeaking(false);
    }
  }, []);

  const stopGuruVoice = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsGuruSpeaking(false);
    }
  }, []);

  // --------------------------------------------------------------------------
  // DATA 5 SUKU NUSANTARA (JAWABAN DIACAK: B, A, C, B, C)
  // --------------------------------------------------------------------------
  const sukuList: SukuAdat[] = useMemo(() => [
    {
      id: "jawa",
      namaSuku: "Suku Jawa (Rumah Joglo)",
      rumahAdat: "Rumah Adat Joglo",
      tokohNama: "Kakek Raden (Tetua Adat)",
      tokohAvatar: "👴",
      silaKe: 1,
      simbolSila: "⭐",
      zPos: -45,
      xPos: 14,
      warnaKhas: "#38bdf8",
      pertanyaan: "Di desa, ada teman berbeda keyakinan yang sedang menjalankan ibadah doa. Nilai Sila ke-1 mengajarkan kita untuk:",
      opsi: [
        { id: "A", teks: "Bermain petasan di dekat tempat ibadah agar ramai.", benar: false, penjelasan: "Tidak sopan. Tempat ibadah harus dijaga kesucian dan ketenangannya." },
        { id: "B", teks: "Menjaga ketenangan dan menghormati ibadahnya dengan ramah.", benar: true, penjelasan: "Sangat bijak! Sila 1 mengajarkan toleransi dan kerukunan antarumat beragama." },
        { id: "C", teks: "Menyuruhnya berhenti karena berbeda cara berdoanya.", benar: false, penjelasan: "Keliru. Kita tidak boleh memaksakan keyakinan kepada orang lain." },
      ],
    },
    {
      id: "sunda",
      namaSuku: "Suku Sunda (Rumah Panggung)",
      rumahAdat: "Rumah Panggung Sunda",
      tokohNama: "Kang Asep (Pemuda Desa)",
      tokohAvatar: "🧑",
      silaKe: 2,
      simbolSila: "⛓️",
      zPos: -105,
      xPos: -14,
      warnaKhas: "#fb923c",
      pertanyaan: "Kamu melihat seorang kawan jatuh terpeleset di jalan bebatuan dan bukunya berserakan. Sikap kemanusiaanmu:",
      opsi: [
        { id: "A", teks: "Segera menolongnya berdiri dan merapikan buku-bukunya dengan ikhlas.", benar: true, penjelasan: "Luar biasa! Sila 2 mengajarkan tolong-menolong dengan kasih sayang." },
        { id: "B", teks: "Menertawakannya dan membiarkannya menangis sendirian.", benar: false, penjelasan: "Menertawakan kemalangan orang lain bertentangan dengan adab kemanusiaan." },
        { id: "C", teks: "Meminta uang saku dulu baru bersedia menolong.", benar: false, penjelasan: "Menolong sesama harus didasari niat tulus tanpa pamrih." },
      ],
    },
    {
      id: "minang",
      namaSuku: "Suku Minang (Rumah Gadang)",
      rumahAdat: "Rumah Gadang Gonjong",
      tokohNama: "Uda Buyung (Datuk Muda)",
      tokohAvatar: "🤠",
      silaKe: 3,
      simbolSila: "🌳",
      zPos: -165,
      xPos: 14,
      warnaKhas: "#4ade80",
      pertanyaan: "Ada kawan baru yang berasal dari pulau seberang dan logat bicaranya berbeda. Nilai Persatuan Indonesia mengajarkan:",
      opsi: [
        { id: "A", teks: "Menjauhinya dan membentuk kelompok yang hanya dari satu suku saja.", benar: false, penjelasan: "Sikap eksklusif memecah belah persatuan bangsa." },
        { id: "B", teks: "Mengejek logat dan pakaian adat daerah asalnya.", benar: false, penjelasan: "Mengejek budaya daerah kawan melanggar persatuan nasional." },
        { id: "C", teks: "Menyambutnya hangat, mengajaknya bermain rukun: Bhinneka Tunggal Ika!", benar: true, penjelasan: "Bhinneka Tunggal Ika! Perbedaan suku adalah kekayaan pemersatu bangsa." },
      ],
    },
    {
      id: "dayak",
      namaSuku: "Suku Dayak (Rumah Betang)",
      rumahAdat: "Rumah Betang Panjang",
      tokohNama: "Kepala Suku Kaian",
      tokohAvatar: "🧓",
      silaKe: 4,
      simbolSila: "🐂",
      zPos: -225,
      xPos: -14,
      warnaKhas: "#f87171",
      pertanyaan: "Kelasmu sedang menentukan tujuan karya wisata. Banyak usulan yang berbeda-beda. Cara mengambil keputusan terbaik:",
      opsi: [
        { id: "A", teks: "Ketua kelas memaksa semua murid mengikuti kemauan pribadinya.", benar: false, penjelasan: "Pemaksaan kehendak melanggar hak demokrasi Sila 4." },
        { id: "B", teks: "Musyawarah mufakat, mendengarkan semua usulan, dan mengambil keputusan bersama.", benar: true, penjelasan: "Musyawarah mufakat menjunjung tinggi kebijaksanaan dan kebersamaan." },
        { id: "C", teks: "Ribut bertengkar dan membatalkan kegiatan sama sekali.", benar: false, penjelasan: "Pertengkaran merusak kerukunan yang seharusnya dibangun lewat musyawarah." },
      ],
    },
    {
      id: "papua",
      namaSuku: "Suku Papua (Rumah Honai)",
      rumahAdat: "Rumah Adat Honai",
      tokohNama: "Kaka Pace (Sahabat Alam)",
      tokohAvatar: "🧔",
      silaKe: 5,
      simbolSila: "🌾",
      zPos: -285,
      xPos: 14,
      warnaKhas: "#facc15",
      pertanyaan: "Hasil panen kebun sekolah sangat melimpah berkat kerja bakti seluruh siswa. Pembagian yang adil adalah:",
      opsi: [
        { id: "A", teks: "Semua hasil panen dibawa pulang oleh satu orang saja.", benar: false, penjelasan: "Tindakan serakah melanggar keadilan sosial." },
        { id: "B", teks: "Menjual hasil panen secara diam-diam tanpa izin teman-teman.", benar: false, penjelasan: "Tidak jujur dan melanggar hak bersama." },
        { id: "C", teks: "Membagi hasil panen secara merata dan dinikmati bersama seluruh siswa.", benar: true, penjelasan: "Keadilan sosial terwujud nyata! Semua yang bekerja keras berhak menikmati hasil bersama." },
      ],
    },
  ], []);

  // --------------------------------------------------------------------------
  // SISWA ONLINE (KOSTUM BERBEDA DENGAN MODEL ANATOMI SERAGAM)
  // --------------------------------------------------------------------------
  const [onlineStudents, setOnlineStudents] = useState<OnlineStudent[]>([
    {
      id: "siti",
      name: "Siti Rahma",
      avatar: "👧",
      costumeName: "Seragam Pramuka",
      shirtColor: "#78350f", // Cokelat Pramuka
      pantsColor: "#451a03",
      hatType: "pramuka_beret",
      x: -2.5,
      z: -18,
      speed: 2.2,
      dir: -1,
      isOnline: true,
    },
    {
      id: "budi",
      name: "Budi Santoso",
      avatar: "👦",
      costumeName: "Batik Nusantara Hijau",
      shirtColor: "#15803d", // Batik Hijau
      pantsColor: "#0f172a",
      hatType: "hair_black",
      x: 2.5,
      z: -70,
      speed: 2.5,
      dir: 1,
      isOnline: true,
    },
    {
      id: "edo",
      name: "Edo Pratama",
      avatar: "🧒",
      costumeName: "Baju Olahraga Biru",
      shirtColor: "#0284c7", // Biru Olahraga
      pantsColor: "#1e293b",
      hatType: "sport_hair",
      x: -2.0,
      z: -130,
      speed: 2.1,
      dir: -1,
      isOnline: true,
    },
    {
      id: "dayu",
      name: "Dayu Kemala",
      avatar: "👧",
      costumeName: "Batik Nusantara Ungu",
      shirtColor: "#7e22ce", // Ungu Elegan
      pantsColor: "#0f172a",
      hatType: "hair_ribbon",
      x: 2.2,
      z: -190,
      speed: 2.4,
      dir: 1,
      isOnline: true,
    },
  ]);

  // Leaderboard Kelas Real-Time
  const classLeaderboard = useMemo(() => [
    { rank: 1, name: "Siti Rahma", points: 145, avatar: "👧", costume: "Pramuka", status: "Online 🟢" },
    { rank: 2, name: "Budi Santoso", points: 130, avatar: "👦", costume: "Batik Hijau", status: "Online 🟢" },
    { rank: 3, name: "Kamu (Pelajar)", points: adventureScore, avatar: "🎒", costume: "Merah Putih", status: "Online 🟢", isPlayer: true },
    { rank: 4, name: "Edo Pratama", points: 95, avatar: "🧒", costume: "Olahraga Biru", status: "Online 🟢" },
    { rank: 5, name: "Dayu Kemala", points: 80, avatar: "👧", costume: "Batik Ungu", status: "Online 🟢" },
  ].sort((a, b) => b.points - a.points), [adventureScore]);

  // Reset Saat Modal Buka
  useEffect(() => {
    if (isOpen) {
      setGameStarted(false);
      setAdventureScore(0);
      setCoinsCollectedCount(0);
      setVisitedSukuIds([]);
      setActiveNotification(null);
      setActiveSukuDialog(null);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
      setShowLeaderboard(false);
      setAllSukuCompleted(false);
      setHasTalkedToGuru(false);
      setShowGuruDialog(false);
      setGuruTab("apa_itu");
      setFriendGreetingBubble(null);
      stopGuruVoice();
    }
  }, [isOpen, stopGuruVoice]);

  // Kontrol Background Music
  useEffect(() => {
    if (isOpen && gameStarted && bgmEnabled) {
      startAdventureBgm();
    }
    return () => {
      stopAdventureBgm();
      stopGuruVoice();
    };
  }, [isOpen, gameStarted, bgmEnabled, stopGuruVoice]);

  // Sapa Teman Sekelas (Interaksi Dadah Online)
  const handleGreetClassmate = useCallback((student: OnlineStudent) => {
    playCoinSound();
    playCorrectSound();
    setAdventureScore((s) => s + 5);
    addPoints(5, `Menyapa teman sekelas: ${student.name}`);

    setFriendGreetingBubble({
      name: student.name,
      text: `👋 "Halo juga! Senang ketemu di jalan desa! Ayo kumpulkan koin & jelajahi 5 Suku bareng!"`,
    });

    setActiveNotification(`👋 Kamu menyapa ${student.name} (${student.costumeName})! (+5 Poin Persahabatan!)`);
    setTimeout(() => {
      setFriendGreetingBubble(null);
      setActiveNotification(null);
    }, 4500);
  }, [addPoints]);

  // Jawab Pertanyaan Suku
  const handleAnswerSuku = (suku: SukuAdat, optId: string) => {
    setSelectedAnswer(optId);
    const chosen = suku.opsi.find((o) => o.id === optId);
    if (!chosen) return;

    if (chosen.benar) {
      playCorrectSound();
      playCoinSound();
      setAnswerFeedback({ isCorrect: true, text: chosen.penjelasan });

      if (!visitedSukuIds.includes(suku.id)) {
        const nextVisited = [...visitedSukuIds, suku.id];
        setVisitedSukuIds(nextVisited);
        setAdventureScore((s) => s + 25);
        addPoints(25, `Menjawab kuis ${suku.namaSuku}`);

        if (nextVisited.length >= 5) {
          setTimeout(() => {
            playBadgeFanfareSound();
            setAllSukuCompleted(true);
            addPoints(50, "Menyelesaikan seluruh 5 Suku Nusantara");
          }, 1200);
        }
      }
    } else {
      playOofSound();
      setAnswerFeedback({ isCorrect: false, text: chosen.penjelasan });
    }
  };

  // --------------------------------------------------------------------------
  // ENGINE 3D THREE.JS: GAPURA, PAK GURU, LEADERBOARD AWAL, JALUR DESA & SISWA
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || isMatchingGame || !mountEl) return;

    const mount = mountEl;

    // 1. SETUP SCENE, CAMERA, & RENDERER
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#7dd3fc");
    scene.fog = new THREE.FogExp2("#bae6fd", 0.006);

    const getViewportSize = () => {
      const rect = mount.getBoundingClientRect();
      const w = rect.width > 50 ? Math.floor(rect.width) : window.innerWidth;
      const h = rect.height > 50 ? Math.floor(rect.height) : Math.max(300, window.innerHeight - 56);
      return { w, h };
    };

    const { w: initW, h: initH } = getViewportSize();

    const camera = new THREE.PerspectiveCamera(56, initW / initH, 0.1, 1000);
    camera.position.set(0, 4.5, 26);
    camera.lookAt(0, 1.8, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor("#7dd3fc", 1);
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

    // 2. LIGHTING
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.95);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight("#ffffff", "#445566", 0.85);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight("#fffbeb", 1.4);
    sunLight.position.set(25, 60, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 3. TERRAIN LEMBUT DESA
    const groundGeo = new THREE.PlaneGeometry(140, 440);
    const groundMat = new THREE.MeshLambertMaterial({ color: "#22c55e" });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, 0, -150);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Jalan Paving Pedesaan
    const pathGeo = new THREE.PlaneGeometry(12, 400);
    const pathMat = new THREE.MeshLambertMaterial({ color: "#fef08a" });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.02, -150);
    scene.add(pathMesh);

    // ------------------------------------------------------------------------
    // GAPURA MASUK MEGAH (Z = +14) - TULISAN TAJAM & PRESISI
    // ------------------------------------------------------------------------
    const gapuraGroup = new THREE.Group();
    const pillarMat = new THREE.MeshLambertMaterial({ color: "#991b1b" });
    const goldMat = new THREE.MeshLambertMaterial({ color: "#facc15" });

    // Pilar Kiri & Kanan
    const leftPil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8.5, 2.4), pillarMat);
    leftPil.position.set(-6.5, 4.25, 14);
    gapuraGroup.add(leftPil);

    const rightPil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8.5, 2.4), pillarMat);
    rightPil.position.set(6.5, 4.25, 14);
    gapuraGroup.add(rightPil);

    // Ornamen Emas pada Pilar
    const pilGoldL = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 2.6), goldMat);
    pilGoldL.position.set(-6.5, 7.8, 14);
    gapuraGroup.add(pilGoldL);
    const pilGoldR = pilGoldL.clone();
    pilGoldR.position.x = 6.5;
    gapuraGroup.add(pilGoldR);

    // Balok Atas Gapura
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(15.4, 2.2, 2.4), pillarMat);
    archBeam.position.set(0, 8.6, 14);
    gapuraGroup.add(archBeam);

    const archRoof = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.5, 2.8), goldMat);
    archRoof.position.set(0, 9.85, 14);
    gapuraGroup.add(archRoof);

    // Banner Tulisan Gapura Resolusi Tinggi (1024x256)
    const bannerCanvas = document.createElement("canvas");
    bannerCanvas.width = 1024;
    bannerCanvas.height = 256;
    const bCtx = bannerCanvas.getContext("2d")!;

    // Background Mewah Merah Marun & Border Emas
    bCtx.fillStyle = "#7f1d1d";
    bCtx.fillRect(0, 0, 1024, 256);
    bCtx.strokeStyle = "#facc15";
    bCtx.lineWidth = 14;
    bCtx.strokeRect(7, 7, 1010, 242);
    bCtx.strokeStyle = "#ffffff";
    bCtx.lineWidth = 3;
    bCtx.strokeRect(20, 20, 984, 216);

    // Judul Utama Gapura
    bCtx.fillStyle = "#fef08a";
    bCtx.font = "bold 52px sans-serif";
    bCtx.textAlign = "center";
    bCtx.shadowColor = "#ca8a04";
    bCtx.shadowBlur = 10;
    bCtx.fillText("★ DESA PANCASILA NUSANTARA ★", 512, 105);

    // Subjudul Gapura
    bCtx.fillStyle = "#ffffff";
    bCtx.font = "bold 30px sans-serif";
    bCtx.shadowBlur = 0;
    bCtx.fillText("🇮🇩  NEGERI GARUDA • JELAJAH PENGAMALAN 5 SILA  🇮🇩", 512, 185);

    const bannerTexture = new THREE.CanvasTexture(bannerCanvas);
    bannerTexture.anisotropy = 8;

    // Banner Sisi Depan
    const bannerMeshFront = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 2.2),
      new THREE.MeshBasicMaterial({ map: bannerTexture })
    );
    bannerMeshFront.position.set(0, 8.6, 15.25);
    gapuraGroup.add(bannerMeshFront);

    // Banner Sisi Belakang (dibalik agar bisa dibaca dari dalam)
    const bannerMeshBack = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 2.2),
      new THREE.MeshBasicMaterial({ map: bannerTexture })
    );
    bannerMeshBack.position.set(0, 8.6, 12.75);
    bannerMeshBack.rotation.y = Math.PI;
    gapuraGroup.add(bannerMeshBack);

    scene.add(gapuraGroup);

    // ------------------------------------------------------------------------
    // PAPAN SKOR KELAS 3D DI AWALAN (DI KANAN GAPURA: X = +4.5, Z = +16)
    // ------------------------------------------------------------------------
    const lbGroup = new THREE.Group();
    const lbPole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5, 8), new THREE.MeshLambertMaterial({ color: "#78350f" }));
    lbPole1.position.set(-2.2, 2.5, 0);
    lbGroup.add(lbPole1);
    const lbPole2 = lbPole1.clone();
    lbPole2.position.set(2.2, 2.5, 0);
    lbGroup.add(lbPole2);

    const lbCanvas = document.createElement("canvas");
    lbCanvas.width = 512;
    lbCanvas.height = 360;
    const lbCtx = lbCanvas.getContext("2d")!;
    lbCtx.fillStyle = "#1e1b4b";
    lbCtx.fillRect(0, 0, 512, 360);
    lbCtx.strokeStyle = "#facc15";
    lbCtx.lineWidth = 10;
    lbCtx.strokeRect(5, 5, 502, 350);

    lbCtx.fillStyle = "#facc15";
    lbCtx.font = "bold 30px sans-serif";
    lbCtx.textAlign = "center";
    lbCtx.fillText("🏆 PAPAN SKOR KELAS", 256, 45);

    lbCtx.font = "bold 22px sans-serif";
    lbCtx.fillStyle = "#ffffff";
    lbCtx.textAlign = "left";
    lbCtx.fillText("🥇 Siti Rahma: 145 Poin", 40, 110);
    lbCtx.fillText("🥈 Budi Santoso: 130 Poin", 40, 160);
    lbCtx.fillText("🥉 Kamu (Siswa): 0 Poin", 40, 210);
    lbCtx.fillText("4.  Edo Pratama: 95 Poin", 40, 260);
    lbCtx.fillText("5.  Dayu Kemala: 80 Poin", 40, 310);

    const lbBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 3.5),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(lbCanvas) })
    );
    lbBoard.position.set(0, 3.5, 0.05);
    lbGroup.add(lbBoard);

    lbGroup.position.set(4.5, 0, 16);
    scene.add(lbGroup);

    // ------------------------------------------------------------------------
    // BUILDER MODEL ANATOMI HUMANOID SERAGAM (STANDAR KELAS ROBLOX SD)
    // ------------------------------------------------------------------------
    const createHumanoid = (config: {
      shirtColor: string;
      pantsColor: string;
      skinColor?: string;
      hatType: "merah_putih_cap" | "peci_guru" | "pramuka_beret" | "hair_black" | "sport_hair" | "hair_ribbon";
      hasTie?: boolean;
      tieColor?: string;
      hasBackpack?: boolean;
      backpackColor?: string;
      hasGlasses?: boolean;
    }) => {
      const charGroup = new THREE.Group();
      const skin = config.skinColor || "#fed7aa";
      const skinMat = new THREE.MeshLambertMaterial({ color: skin });
      const shirtMat = new THREE.MeshLambertMaterial({ color: config.shirtColor });
      const pantsMat = new THREE.MeshLambertMaterial({ color: config.pantsColor });
      const darkMat = new THREE.MeshLambertMaterial({ color: "#0f172a" });

      // Badan / Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.45, 0.68), shirtMat);
      torso.position.y = 2.15;
      torso.castShadow = true;
      charGroup.add(torso);

      // Dasi jika ada
      if (config.hasTie) {
        const tie = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.85, 0.08),
          new THREE.MeshLambertMaterial({ color: config.tieColor || "#dc2626" })
        );
        tie.position.set(0, 2.15, 0.38);
        charGroup.add(tie);
      }

      // Ransel jika ada
      if (config.hasBackpack) {
        const pack = new THREE.Mesh(
          new THREE.BoxGeometry(1.0, 1.15, 0.42),
          new THREE.MeshLambertMaterial({ color: config.backpackColor || "#f97316" })
        );
        pack.position.set(0, 2.2, -0.45);
        charGroup.add(pack);
      }

      // Kepala
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), skinMat);
      head.position.y = 3.35;
      head.castShadow = true;
      charGroup.add(head);

      // Mata Ceria
      const eyeMat = new THREE.MeshBasicMaterial({ color: "#0f172a" });
      const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.04), eyeMat);
      leftEye.position.set(-0.2, 3.42, 0.44);
      charGroup.add(leftEye);
      const rightEye = leftEye.clone();
      rightEye.position.x = 0.2;
      charGroup.add(rightEye);

      // Senyum Ramah
      const smile = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.06, 0.04),
        new THREE.MeshBasicMaterial({ color: "#e11d48" })
      );
      smile.position.set(0, 3.22, 0.44);
      charGroup.add(smile);

      // Kacamata (khusus Pak Guru)
      if (config.hasGlasses) {
        const frameMat = new THREE.MeshBasicMaterial({ color: "#d97706" });
        const gFrame1 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.06), frameMat);
        gFrame1.position.set(-0.2, 3.42, 0.45);
        charGroup.add(gFrame1);
        const gFrame2 = gFrame1.clone();
        gFrame2.position.x = 0.2;
        charGroup.add(gFrame2);
        const gBridge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.05), frameMat);
        gBridge.position.set(0, 3.42, 0.45);
        charGroup.add(gBridge);
      }

      // Aksesoris Kepala / Topi / Rambut
      if (config.hatType === "merah_putih_cap") {
        const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.35, 0.92), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
        capTop.position.y = 3.92;
        charGroup.add(capTop);
        const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.45), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
        capVisor.position.set(0, 3.82, 0.55);
        charGroup.add(capVisor);
      } else if (config.hatType === "peci_guru") {
        const peci = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.44, 0.94), darkMat);
        peci.position.y = 3.95;
        charGroup.add(peci);
      } else if (config.hatType === "pramuka_beret") {
        const beret = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.3, 0.96), new THREE.MeshLambertMaterial({ color: "#451a03" }));
        beret.position.set(0.06, 3.92, 0);
        charGroup.add(beret);
      } else if (config.hatType === "hair_black") {
        const hair = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.32, 0.92), darkMat);
        hair.position.y = 3.92;
        charGroup.add(hair);
      } else if (config.hatType === "sport_hair") {
        const hair = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.32, 0.92), darkMat);
        hair.position.y = 3.92;
        charGroup.add(hair);
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.12, 0.94), new THREE.MeshLambertMaterial({ color: "#ffffff" }));
        band.position.y = 3.65;
        charGroup.add(band);
      } else if (config.hatType === "hair_ribbon") {
        const hair = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.32, 0.92), darkMat);
        hair.position.y = 3.92;
        charGroup.add(hair);
        const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1), new THREE.MeshLambertMaterial({ color: "#ec4899" }));
        ribbon.position.set(0.48, 3.85, 0.2);
        charGroup.add(ribbon);
      }

      // Lengan Kiri (Pivot pada bahu y = 2.15)
      const leftArm = new THREE.Group();
      const lSlv = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.55, 0.44), shirtMat);
      lSlv.position.y = 0.28;
      const lHnd = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.65, 0.4), skinMat);
      lHnd.position.y = -0.32;
      leftArm.add(lSlv);
      leftArm.add(lHnd);
      leftArm.position.set(-0.92, 2.15, 0);
      charGroup.add(leftArm);

      // Lengan Kanan (Pivot pada bahu y = 2.15)
      const rightArm = new THREE.Group();
      const rSlv = lSlv.clone();
      const rHnd = lHnd.clone();
      rightArm.add(rSlv);
      rightArm.add(rHnd);
      rightArm.position.set(0.92, 2.15, 0);
      charGroup.add(rightArm);

      // Kaki Kiri (Pivot pada pinggul y = 0.72)
      const leftLeg = new THREE.Group();
      const lPnt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.5), pantsMat);
      lPnt.position.y = 0.36;
      const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.35, 0.62), darkMat);
      lShoe.position.set(0, -0.42, 0.05);
      leftLeg.add(lPnt);
      leftLeg.add(lShoe);
      leftLeg.position.set(-0.34, 0.72, 0);
      charGroup.add(leftLeg);

      // Kaki Kanan (Pivot pada pinggul y = 0.72)
      const rightLeg = new THREE.Group();
      const rPnt = lPnt.clone();
      const rShoe = lShoe.clone();
      rightLeg.add(rPnt);
      rightLeg.add(rShoe);
      rightLeg.position.set(0.34, 0.72, 0);
      charGroup.add(rightLeg);

      return {
        group: charGroup,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
      };
    };

    // ------------------------------------------------------------------------
    // PAK GURU VIRTUAL DI AWALAN (DI KIRI GAPURA: X = -4.0, Z = +16)
    // ------------------------------------------------------------------------
    const guruData = createHumanoid({
      shirtColor: "#0284c7",
      pantsColor: "#1e293b",
      hatType: "peci_guru",
      hasTie: true,
      tieColor: "#1e3a8a",
      hasGlasses: true,
    });
    const guruGroup = guruData.group;

    // Lingkaran Emas Penanda di Bawah Kaki Pak Guru
    const ringGeo = new THREE.RingGeometry(1.2, 1.6, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: "#facc15", side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.05;
    guruGroup.add(ringMesh);

    // Label Pak Guru
    const guruCanvas = document.createElement("canvas");
    guruCanvas.width = 340;
    guruCanvas.height = 80;
    const gCtx = guruCanvas.getContext("2d")!;
    gCtx.fillStyle = "#ffffff";
    gCtx.font = "bold 26px sans-serif";
    gCtx.textAlign = "center";
    gCtx.fillText("👨‍🏫 Pak Guru Virtual", 170, 38);
    gCtx.fillStyle = "#facc15";
    gCtx.font = "bold 22px sans-serif";
    gCtx.fillText("Tekan 'E' untuk Suara Guru 🔊", 170, 70);

    const guruSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(guruCanvas) }));
    guruSprite.position.set(0, 5.0, 0);
    guruSprite.scale.set(3.8, 0.9, 1);
    guruGroup.add(guruSprite);

    guruGroup.position.set(-4.0, 0, 16);
    scene.add(guruGroup);

    // ------------------------------------------------------------------------
    // PEPOHONAN RINDANG DI SEPANJANG JALAN
    // ------------------------------------------------------------------------
    const treeGroup = new THREE.Group();
    const trunkMat = new THREE.MeshLambertMaterial({ color: "#78350f" });
    const leafMat = new THREE.MeshLambertMaterial({ color: "#15803d" });

    for (let tz = 12; tz > -320; tz -= 18) {
      const tL = new THREE.Group();
      const trL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 5, 8), trunkMat);
      trL.position.y = 2.5;
      const fL = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6), leafMat);
      fL.position.y = 5.6;
      tL.add(trL);
      tL.add(fL);
      tL.position.set(-8.5 - Math.random() * 3, 0, tz);
      treeGroup.add(tL);

      const tR = new THREE.Group();
      const trR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 5, 8), trunkMat);
      trR.position.y = 2.5;
      const fR = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6), leafMat);
      fR.position.y = 5.6;
      tR.add(trR);
      tR.add(fR);
      tR.position.set(8.5 + Math.random() * 3, 0, tz);
      treeGroup.add(tR);
    }
    scene.add(treeGroup);

    // ------------------------------------------------------------------------
    // KOIN EMAS BERPUTAR DI SEPANJANG JALAN (PICK-UP +5 POIN)
    // ------------------------------------------------------------------------
    const coinList: RoadCoin[] = [];
    const coinGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.15, 16);
    const coinMat = new THREE.MeshLambertMaterial({ color: "#facc15", emissive: "#ca8a04" });

    for (let cz = 8; cz > -300; cz -= 7) {
      const offsetX = Math.sin(cz * 0.4) * 3.5;
      const cMesh = new THREE.Mesh(coinGeo, coinMat);
      cMesh.rotation.x = Math.PI / 2;
      cMesh.position.set(offsetX, 0.8, cz);
      scene.add(cMesh);

      coinList.push({
        id: cz,
        x: offsetX,
        y: 0.8,
        z: cz,
        mesh: cMesh,
        collected: false,
      });
    }

    // ------------------------------------------------------------------------
    // 5 RUMAH ADAT SUKU NUSANTARA, PLANG NAMA DI DEPAN & TITIK MISI BERCAHAYA
    // ------------------------------------------------------------------------
    interface HotspotItem {
      suku: SukuAdat;
      x: number;
      z: number;
      ringMesh: THREE.Mesh;
      beaconMesh: THREE.Mesh;
    }
    const hotspotList: HotspotItem[] = [];

    sukuList.forEach((suku) => {
      const hGroup = new THREE.Group();

      // Dinding Rumah
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(11, 7.5, 9),
        new THREE.MeshLambertMaterial({ color: suku.warnaKhas })
      );
      wallMesh.position.y = 3.75;
      wallMesh.castShadow = true;
      hGroup.add(wallMesh);

      // Atap Khas Adat
      let roofMesh: THREE.Mesh;
      if (suku.id === "minang") {
        roofMesh = new THREE.Mesh(new THREE.ConeGeometry(8, 6, 4), new THREE.MeshLambertMaterial({ color: "#78350f" }));
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.position.y = 9.8;
      } else if (suku.id === "papua") {
        roofMesh = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: "#ca8a04" }));
        roofMesh.position.y = 7.5;
      } else {
        roofMesh = new THREE.Mesh(new THREE.ConeGeometry(8.5, 4.5, 4), new THREE.MeshLambertMaterial({ color: "#92400e" }));
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.position.y = 9.5;
      }
      roofMesh.castShadow = true;
      hGroup.add(roofMesh);

      // Pintu Rumah
      const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.2, 0.2), new THREE.MeshLambertMaterial({ color: "#451a03" }));
      doorMesh.position.set(0, 2.1, suku.xPos > 0 ? -4.51 : 4.51);
      hGroup.add(doorMesh);

      hGroup.position.set(suku.xPos, 0, suku.zPos);
      scene.add(hGroup);

      // ----------------------------------------------------------------------
      // PLANG PAPAN NAMA DI DEPAN RUMAH (BERDIRI DI TANAH DEKAT JALAN)
      // ----------------------------------------------------------------------
      const signX = suku.xPos > 0 ? 8.8 : -8.8;
      const signZ = suku.zPos + (suku.xPos > 0 ? 3.0 : -3.0);
      const signGroup = new THREE.Group();

      const signPole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8), new THREE.MeshLambertMaterial({ color: "#78350f" }));
      signPole1.position.set(-1.2, 1.6, 0);
      signGroup.add(signPole1);

      const signPole2 = signPole1.clone();
      signPole2.position.set(1.2, 1.6, 0);
      signGroup.add(signPole2);

      const signCanvas = document.createElement("canvas");
      signCanvas.width = 512;
      signCanvas.height = 256;
      const sCtx = signCanvas.getContext("2d")!;
      sCtx.fillStyle = "#1e1b4b";
      sCtx.fillRect(0, 0, 512, 256);
      sCtx.strokeStyle = "#facc15";
      sCtx.lineWidth = 10;
      sCtx.strokeRect(5, 5, 502, 246);

      sCtx.fillStyle = "#facc15";
      sCtx.font = "bold 28px sans-serif";
      sCtx.textAlign = "center";
      sCtx.fillText(`${suku.simbolSila} SILA KE-${suku.silaKe} PANCASILA`, 256, 50);

      sCtx.fillStyle = "#ffffff";
      sCtx.font = "bold 34px sans-serif";
      sCtx.fillText(suku.namaSuku, 256, 110);

      sCtx.fillStyle = "#38bdf8";
      sCtx.font = "bold 24px sans-serif";
      sCtx.fillText(suku.rumahAdat, 256, 160);

      sCtx.fillStyle = "#4ade80";
      sCtx.font = "bold 20px sans-serif";
      sCtx.fillText("📍 Titik Misi: Berdiri di Lingkaran & Tekan 'E'", 256, 215);

      const signBoard = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 1.8),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signCanvas), side: THREE.DoubleSide })
      );
      signBoard.position.set(0, 2.2, 0.05);
      signGroup.add(signBoard);

      signGroup.position.set(signX, 0, signZ);
      signGroup.rotation.y = suku.xPos > 0 ? -Math.PI / 2 : Math.PI / 2;
      scene.add(signGroup);

      // ----------------------------------------------------------------------
      // TITIK MISI BERCAHAYA (CHECKPOINT PAD DI DEPAN RUMAH)
      // ----------------------------------------------------------------------
      const hotspotX = suku.xPos > 0 ? 6.5 : -6.5;
      const hotspotZ = suku.zPos;
      const spotGroup = new THREE.Group();

      // Cincin Emas Luar
      const spotRingGeo = new THREE.RingGeometry(1.8, 2.2, 32);
      const spotRingMat = new THREE.MeshBasicMaterial({ color: "#facc15", side: THREE.DoubleSide });
      const spotRing = new THREE.Mesh(spotRingGeo, spotRingMat);
      spotRing.rotation.x = -Math.PI / 2;
      spotRing.position.y = 0.05;
      spotGroup.add(spotRing);

      // Lingkaran Dalam Warna Sila
      const spotDiscGeo = new THREE.CircleGeometry(1.75, 32);
      const spotDiscMat = new THREE.MeshLambertMaterial({ color: suku.warnaKhas, transparent: true, opacity: 0.85 });
      const spotDisc = new THREE.Mesh(spotDiscGeo, spotDiscMat);
      spotDisc.rotation.x = -Math.PI / 2;
      spotDisc.position.y = 0.04;
      spotGroup.add(spotDisc);

      // Sorotan Cahaya Vertikal (Light Beacon)
      const beaconGeo = new THREE.CylinderGeometry(1.5, 1.5, 5, 24, 1, true);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: suku.warnaKhas,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.y = 2.5;
      spotGroup.add(beaconMesh);

      // Label Petunjuk Melayang di Atas Titik
      const padCanvas = document.createElement("canvas");
      padCanvas.width = 380;
      padCanvas.height = 90;
      const pdCtx = padCanvas.getContext("2d")!;
      pdCtx.fillStyle = "#ffffff";
      pdCtx.font = "bold 26px sans-serif";
      pdCtx.textAlign = "center";
      pdCtx.fillText(`🎯 TITIK MISI SILA KE-${suku.silaKe}`, 190, 36);
      pdCtx.fillStyle = "#facc15";
      pdCtx.font = "bold 22px sans-serif";
      pdCtx.fillText("[ Berdiri di Sini & Tekan 'E' ]", 190, 72);

      const padSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(padCanvas) }));
      padSprite.position.set(0, 3.8, 0);
      padSprite.scale.set(4.2, 1.0, 1);
      spotGroup.add(padSprite);

      spotGroup.position.set(hotspotX, 0, hotspotZ);
      scene.add(spotGroup);

      // ----------------------------------------------------------------------
      // TOKOH ADAT 3D: ORANG ASLI DI DEPAN RUMAH DENGAN TULISAN NAMA JELAS
      // ----------------------------------------------------------------------
      let npcShirt = "#78350f";
      let npcPants = "#451a03";
      let npcHat: "peci_guru" | "merah_putih_cap" | "hair_black" | "sport_hair" | "hair_ribbon" = "hair_black";

      if (suku.id === "jawa") {
        npcShirt = "#78350f"; // Beskap Cokelat Jawa
        npcPants = "#451a03";
        npcHat = "peci_guru";
      } else if (suku.id === "sunda") {
        npcShirt = "#1e293b"; // Hitam Pangsi Sunda
        npcPants = "#0f172a";
        npcHat = "hair_black";
      } else if (suku.id === "minang") {
        npcShirt = "#dc2626"; // Merah Adat Minang
        npcPants = "#991b1b";
        npcHat = "merah_putih_cap";
      } else if (suku.id === "dayak") {
        npcShirt = "#ca8a04"; // Rompi Dayak Kuning Emas
        npcPants = "#78350f";
        npcHat = "hair_black";
      } else if (suku.id === "papua") {
        npcShirt = "#d97706"; // Pakaian Khas Papua
        npcPants = "#78350f";
        npcHat = "sport_hair";
      }

      const npcHuman = createHumanoid({
        shirtColor: npcShirt,
        pantsColor: npcPants,
        hatType: npcHat,
      });
      const npcGroup = npcHuman.group;

      // Label Nama Tokoh di Atas Kepala Orang di Depan Rumah
      const npcNameCanvas = document.createElement("canvas");
      npcNameCanvas.width = 440;
      npcNameCanvas.height = 100;
      const npCtx = npcNameCanvas.getContext("2d")!;
      npCtx.fillStyle = "#1e1b4b";
      npCtx.fillRect(0, 0, 440, 100);
      npCtx.strokeStyle = "#facc15";
      npCtx.lineWidth = 6;
      npCtx.strokeRect(3, 3, 434, 94);

      npCtx.fillStyle = "#ffffff";
      npCtx.font = "bold 26px sans-serif";
      npCtx.textAlign = "center";
      npCtx.fillText(`${suku.tokohAvatar} ${suku.tokohNama}`, 220, 42);

      npCtx.fillStyle = "#facc15";
      npCtx.font = "bold 22px sans-serif";
      npCtx.fillText(`[ ${suku.simbolSila} Sila Ke-${suku.silaKe} • Tekan 'E' ]`, 220, 80);

      const npcSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(npcNameCanvas) })
      );
      npcSprite.position.set(0, 4.8, 0);
      npcSprite.scale.set(4.4, 1.0, 1);
      npcGroup.add(npcSprite);

      // Posisikan Tokoh Orang tepat di depan pintu rumah menghadap ke jalan
      const npcX = suku.xPos > 0 ? 7.2 : -7.2;
      npcGroup.position.set(npcX, 0, suku.zPos);
      npcGroup.rotation.y = suku.xPos > 0 ? -Math.PI / 2 : Math.PI / 2;
      scene.add(npcGroup);

      hotspotList.push({
        suku,
        x: hotspotX,
        z: hotspotZ,
        ringMesh: spotRing,
        beaconMesh,
      });
    });

    // ------------------------------------------------------------------------
    // SISWA ONLINE (KOSTUM BERBEDA, MODEL ANATOMI KELAS IDENTIK & KONSISTEN)
    // ------------------------------------------------------------------------
    onlineStudents.forEach((student) => {
      const stData = createHumanoid({
        shirtColor: student.shirtColor,
        pantsColor: student.pantsColor,
        hatType: student.hatType,
      });
      const stGroup = stData.group;

      // Label Nama Siswa & Kostum
      const nameCanvas = document.createElement("canvas");
      nameCanvas.width = 320;
      nameCanvas.height = 74;
      const nCtx = nameCanvas.getContext("2d")!;
      nCtx.fillStyle = "#ffffff";
      nCtx.font = "bold 24px sans-serif";
      nCtx.textAlign = "center";
      nCtx.fillText(`${student.avatar} ${student.name}`, 160, 36);
      nCtx.font = "bold 18px sans-serif";
      nCtx.fillStyle = "#facc15";
      nCtx.fillText(`[${student.costumeName}] (E: Sapa 👋)`, 160, 64);

      const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(nameCanvas) }));
      nameSprite.position.set(0, 4.6, 0);
      nameSprite.scale.set(3.5, 0.8, 1);
      stGroup.add(nameSprite);

      stGroup.position.set(student.x, 0, student.z);
      scene.add(stGroup);

      student.mesh = stGroup;
      student.leftArm = stData.leftArm;
      student.rightArm = stData.rightArm;
      student.leftLeg = stData.leftLeg;
      student.rightLeg = stData.rightLeg;
      student.walkAnim = Math.random() * 10;
    });

    // ------------------------------------------------------------------------
    // KARAKTER UTAMA SISWA (MERAH PUTIH - ANATOMI IDENTIK DENGAN KAWAN SEKELAS)
    // ------------------------------------------------------------------------
    const playerData = createHumanoid({
      shirtColor: "#ffffff",
      pantsColor: "#dc2626",
      hatType: "merah_putih_cap",
      hasTie: true,
      tieColor: "#dc2626",
      hasBackpack: true,
      backpackColor: "#f97316",
    });
    const playerGroup = playerData.group;
    const { leftArm, rightArm, leftLeg, rightLeg } = playerData;

    // Label Pemain
    const playerNameCanvas = document.createElement("canvas");
    playerNameCanvas.width = 300;
    playerNameCanvas.height = 64;
    const pCtx = playerNameCanvas.getContext("2d")!;
    pCtx.fillStyle = "#ffffff";
    pCtx.font = "bold 26px sans-serif";
    pCtx.textAlign = "center";
    pCtx.fillText("🎒 Kamu (Siswa Pelajar)", 150, 42);
    const pNameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(playerNameCanvas) }));
    pNameSprite.position.set(0, 4.6, 0);
    pNameSprite.scale.set(3.4, 0.75, 1);
    playerGroup.add(pNameSprite);

    playerGroup.position.set(0, 0, 18);
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

        playerGroup.position.x = Math.max(-28, Math.min(28, playerGroup.position.x));
        playerGroup.position.z = Math.max(-320, Math.min(24, playerGroup.position.z));

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

      // Gravitasi & Lompat
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

      // Putar Koin Emas & Cek Pick-up di Jalan
      coinList.forEach((coin) => {
        if (!coin.collected && coin.mesh) {
          coin.mesh.rotation.z += delta * 3.5;
          const dist = Math.hypot(
            playerGroup.position.x - coin.x,
            playerGroup.position.z - coin.z
          );

          if (dist < 1.8 && playerGroup.position.y < 2.0) {
            coin.collected = true;
            scene.remove(coin.mesh);
            playCoinPickupSound();
            setAdventureScore((s) => s + 5);
            setCoinsCollectedCount((c) => c + 1);
            addPoints(5, "Mengambil koin di jalan");
          }
        }
      });

      // Animasi Siswa Online Berjalan & Ayunkan Tangan/Kaki
      onlineStudents.forEach((student) => {
        if (student.mesh) {
          student.mesh.position.z += student.speed * student.dir * delta;
          student.mesh.rotation.y = student.dir > 0 ? 0 : Math.PI;

          student.walkAnim = (student.walkAnim || 0) + delta * 9;
          const sSwing = Math.sin(student.walkAnim) * 0.55;
          if (student.leftLeg) student.leftLeg.rotation.x = sSwing;
          if (student.rightLeg) student.rightLeg.rotation.x = -sSwing;
          if (student.leftArm) student.leftArm.rotation.x = -sSwing;
          if (student.rightArm) student.rightArm.rotation.x = sSwing;

          if (student.mesh.position.z > 5) student.dir = -1;
          if (student.mesh.position.z < -290) student.dir = 1;
        }
      });

      // Animasi Denyut Cincin Emas Pak Guru
      ringMesh.rotation.z += delta * 2;

      // Animasi Denyut Titik Misi Checkpoint Rumah Adat
      hotspotList.forEach((hp) => {
        hp.ringMesh.rotation.z += delta * 1.5;
        hp.beaconMesh.scale.y = 1 + Math.sin(Date.now() * 0.003 + hp.suku.silaKe) * 0.15;
      });

      // Kamera Third-Person
      const camTargetX = playerGroup.position.x;
      const camTargetY = playerGroup.position.y + 4.2;
      const camTargetZ = playerGroup.position.z + 8.5;

      camera.position.x += (camTargetX - camera.position.x) * 0.12;
      camera.position.y += (camTargetY - camera.position.y) * 0.12;
      camera.position.z += (camTargetZ - camera.position.z) * 0.12;
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.6, playerGroup.position.z - 3);

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
        playDashSound();
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        const px = playerPosRef.current.x;
        const pz = playerPosRef.current.z;

        // 1. Cek Apakah Dekat dengan Pak Guru Virtual (X = -4.0, Z = +16)
        const distToGuru = Math.hypot(px - (-4.0), pz - 16);
        if (distToGuru < 4.8) {
          setShowGuruDialog(true);
          setHasTalkedToGuru(true);
          setGuruTab("apa_itu");
          // Otomatis bunyikan voice Pak Guru pertama kali
          speakGuruVoice(
            "Halo Penjelajah Muda! Selamat datang di Desa Pancasila Nusantara. Pancasila adalah lima dasar dan pedoman hidup luhur bangsa Indonesia yang menyatukan kita semua dari Sabang sampai Merauke."
          );
          return;
        }

        // 2. Cek Apakah Dekat dengan Teman Sekelas Online
        for (const student of onlineStudents) {
          if (student.mesh) {
            const distToFriend = Math.hypot(px - student.mesh.position.x, pz - student.mesh.position.z);
            if (distToFriend < 4.5) {
              handleGreetClassmate(student);
              return;
            }
          }
        }

        // 3. Cek Apakah Pemain Berdiri di Titik Misi Salah Satu Rumah Suku
        for (const hp of hotspotList) {
          const distToHotspot = Math.hypot(px - hp.x, pz - hp.z);
          if (distToHotspot < 3.8) {
            setActiveSukuDialog(hp.suku);
            setSelectedAnswer(null);
            setAnswerFeedback(null);
            return;
          }
        }

        setActiveNotification("📍 Berdirilah tepat di TITIK MISI bercahaya di depan rumah adat untuk memulai kuis!");
        setTimeout(() => setActiveNotification(null), 3000);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") keysRef.current.forward = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") keysRef.current.backward = false;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keysRef.current.left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keysRef.current.right = false;
      if (e.key === " ") keysRef.current.jump = false;
      if (e.key === "Shift") keysRef.current.sprint = false;
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
      stopGuruVoice();
    };
  }, [
    mountEl,
    isOpen,
    sukuList,
    onlineStudents,
    handleGreetClassmate,
    speakGuruVoice,
    stopGuruVoice,
  ]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-title"
      >
        {/* HUD ATAS MODERN & ROUNDED */}
        <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-yellow-400/40 text-white px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xl z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg shrink-0">
              {isMatchingGame ? "🧩" : "🇮🇩"}
            </span>
            <div className="min-w-0">
              <h2 id="game-title" className="font-black text-sm sm:text-base text-yellow-300 truncate tracking-wide">
                {isMatchingGame
                  ? "TEKA-TEKI MENJODOHKAN BASA JAWA & AKSARA 🧩"
                  : "PETUALANGAN PANCASILA: JELAJAH DESA NUSANTARA ONLINE"}
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                Materi: <b className="text-emerald-400">{resolvedTitle}</b>
                {!isMatchingGame && (
                  <> • Teman Online: <b className="text-emerald-400">4 Siswa 🟢</b></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Papan Skor Kelas (Khusus 3D Petualangan) */}
            {!isMatchingGame && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowLeaderboard(true);
                }}
                className="bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold px-3.5 py-2 rounded-2xl text-xs shadow-md transition hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer border border-indigo-400/40"
              >
                <span>🏆</span>
                <span className="hidden sm:inline">Papan Skor Kelas</span>
              </button>
            )}

            {/* Poin Koin */}
            <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-2xl border border-yellow-400/50 shadow-inner">
              <span className="text-xs font-black text-yellow-300">
                🪙 {adventureScore} Poin
              </span>
              {!isMatchingGame && (
                <span className="text-[10px] bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  ⭐ {coinsCollectedCount} Koin
                </span>
              )}
            </div>

            {/* Progres 5 Suku (Khusus 3D Petualangan) */}
            {!isMatchingGame && (
              <div className="hidden md:flex items-center gap-1 bg-slate-800/90 px-3 py-1.5 rounded-2xl border border-emerald-500/40 text-xs font-bold text-emerald-300">
                <span>🏠</span>
                <span>{visitedSukuIds.length}/5 Suku Selesai</span>
              </div>
            )}

            {/* Tombol Musik */}
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
              className={`p-2 rounded-2xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                bgmEnabled
                  ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300"
              }`}
            >
              <span>{bgmEnabled ? "🔊" : "🔇"}</span>
            </button>

            {/* Tombol Keluar */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                stopAdventureBgm();
                stopGuruVoice();
                onClose();
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-2xl text-xs shadow-md transition hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>✕</span>
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {isMatchingGame ? (
          /* ================================================================ */
          /* MODEL GAME 2: TEKA-TEKI MENJODOHKAN (UNTUK MATERI BASA JAWA / KOSAKATA) */
          /* ================================================================ */
          <div className="flex-1 w-full p-4 sm:p-8 flex flex-col items-center justify-center space-y-6 overflow-y-auto bg-slate-900 select-none">
            {/* Header Belajar */}
            <div className="text-center space-y-2 max-w-xl">
              <span className="text-xs font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/40 px-3.5 py-1 rounded-full inline-block">
                🧩 Mode Game: Menjodohkan Pasangan Kartu Edukasi
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-yellow-300">
                {resolvedTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Pilih dan balik 2 kartu yang memiliki arti atau pasangan yang cocok! Dapatkan <b>+15 Poin</b> untuk setiap pasangan cocok!
              </p>
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isGuruSpeaking) {
                      stopGuruVoice();
                    } else {
                      speakGuruVoice(
                        `Halo kawan! Di materi ${resolvedTitle}, ayo cocokkan pasangan kartu aksara dan kata Basa Jawa dengan artinya yang tepat! Selamat bermain!`
                      );
                    }
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    isGuruSpeaking
                      ? "bg-rose-600 border-rose-400 text-white animate-pulse"
                      : "bg-sky-600 hover:bg-sky-500 border-sky-400/60 text-white"
                  }`}
                >
                  <span>{isGuruSpeaking ? "⏹️ Hentikan Suara" : "🔊 Suara Pak Guru"}</span>
                </button>
                <div className="bg-slate-800 px-3.5 py-1.5 rounded-2xl border border-slate-700 text-xs font-bold text-slate-200">
                  Total Langkah: <b className="text-yellow-400">{matchingMoves}</b>
                </div>
              </div>

              {/* Box Pembekalan Materi Soal Basa Jawa (Sesuai Request User) */}
              <div className="bg-slate-800/90 border-2 border-sky-400/50 rounded-2xl p-3 max-w-xl w-full text-left space-y-1.5 shadow-md">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-500/40">
                  💡 Pemahaman Konsep Basa Jawa
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  <b>Tata Krama Basa:</b> Gunakan <i>Basa Ngoko</i> ketika berbicara dengan kawan sebaya (kanca dolanan), dan gunakan <i>Basa Krama Alus</i> kepada orang tua atau bapak/ibu guru. Tokoh <b>Semar</b> adalah pamomong Punokawan yang berwatak sabar dan bijaksana.
                </p>
              </div>
            </div>

            {/* Grid 12 Kartu (6 Pasang) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 w-full max-w-3xl">
              {matchingCards.map((card, idx) => {
                const isSelected = selectedCardIndices.includes(idx);
                return (
                  <button
                    key={card.uid}
                    type="button"
                    disabled={card.isMatched}
                    onClick={() => handleMatchCardClick(idx)}
                    className={`p-4 rounded-3xl min-h-[110px] sm:min-h-[120px] flex flex-col items-center justify-center text-center transition-all duration-300 border-2 cursor-pointer ${
                      card.isMatched
                        ? "bg-emerald-950/70 border-emerald-400 text-emerald-300 opacity-60 scale-95 shadow-none"
                        : isSelected
                        ? "bg-sky-600 border-white text-white scale-105 shadow-2xl ring-2 ring-yellow-400"
                        : "bg-slate-800 hover:bg-slate-700 border-slate-600 hover:border-yellow-400 text-slate-100 shadow-lg"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-yellow-400 tracking-wider mb-1.5">
                      {card.category}
                    </span>
                    <span className="text-xs sm:text-sm font-black leading-snug">
                      {card.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Popup Kemenangan Menjodohkan */}
            {matchingDone && (
              <div className="p-5 bg-slate-900 border-4 border-yellow-400 rounded-3xl text-center space-y-3 max-w-md animate-in zoom-in shadow-2xl">
                <div className="text-4xl animate-bounce">🏆</div>
                <h4 className="font-black text-lg text-yellow-300">
                  SEMPURNA! SELURUH KARTU TELAH COCOK!
                </h4>
                <p className="text-xs text-slate-200">
                  Kamu berhasil menyelesaikan teka-teki menjodohkan dalam <b>{matchingMoves} langkah</b> dan mendapatkan <b>+30 Poin Prestasi</b>!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMatchingCards((prev) => [...prev].sort(() => Math.random() - 0.5).map((c) => ({ ...c, isMatched: false })));
                    setSelectedCardIndices([]);
                    setMatchingMoves(0);
                    setMatchingDone(false);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-orange-500 text-slate-950 font-black py-2.5 rounded-2xl text-xs cursor-pointer shadow-md transition"
                >
                  🔄 Mainkan Ulang
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ================================================================ */
          /* MODEL GAME 1: PETUALANGAN DESA PANCASILA 3D (ORANG ADAT DI TIAP RUMAH) */
          /* ================================================================ */
          <div className="flex-1 w-full relative overflow-hidden flex flex-col items-center justify-center bg-slate-900">
            {/* THREE.JS CANVAS MOUNT */}
            <div ref={setMountEl} className="absolute inset-0 w-full h-full block" />

          {/* PETUNJUK LAYAR AWAL MENGARAHKAN KE PAK GURU (SESUAI REQUEST) */}
          {!hasTalkedToGuru && gameStarted && (
            <div className="absolute top-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 max-w-lg bg-yellow-400 text-slate-950 p-3 rounded-2xl shadow-2xl text-center animate-bounce font-black text-xs sm:text-sm border-2 border-white flex items-center justify-center gap-2">
              <span>👉</span>
              <span>
                PETUNJUK: Temui <b>Pak Guru Virtual</b> (di sebelah kiri gapura) lalu tekan <b>'E'</b> untuk penjelasan suara & cara bermain!
              </span>
            </div>
          )}

          {/* OVERLAY BRIEFING & PEMBEKALAN MATERI SEBELUM BERMAIN (SESUAI REQUEST USER) */}
          {!gameStarted && (
            <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
              <div className="bg-slate-900/95 border-3 border-yellow-400 rounded-3xl max-w-2xl w-full p-5 sm:p-7 text-white space-y-4 sm:space-y-5 shadow-2xl my-auto">
                {/* Header Briefing */}
                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 font-black text-xs uppercase tracking-wider">
                    <span>📖</span>
                    <span>Pembekalan Materi Sebelum Bermain</span>
                  </div>
                  <h3 className="font-black text-xl sm:text-2xl text-yellow-300 tracking-wide">
                    AYO PAHAMI MATERI &amp; MISI NEGARA GARUDA! 🇮🇩
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl mx-auto">
                    Pahami makna luhur 5 Sila Pancasila di bawah ini agar kamu dapat menerapkan nilai budi pekerti dengan bijak saat menjelajahi <b>5 Rumah Adat Nusantara</b>!
                  </p>
                </div>

                {/* 5 Kartu Pemahaman Materi Per Sila */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 sm:max-h-72 overflow-y-auto pr-1">
                  <div className="bg-sky-950/60 border-2 border-sky-400/70 p-3 rounded-2xl space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <span className="font-black text-xs text-sky-300 uppercase">Sila 1: Ketuhanan (Pos Jawa)</span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      <b>Pemahaman Nilai:</b> Menumbuhkan rasa saling menghormati ketika kawan sedang beribadah, menjaga kesucian dan ketenangan lingkungan tempat ibadah, serta memupuk toleransi beragama.
                    </p>
                  </div>

                  <div className="bg-amber-950/60 border-2 border-amber-400/70 p-3 rounded-2xl space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⛓️</span>
                      <span className="font-black text-xs text-amber-300 uppercase">Sila 2: Kemanusiaan (Pos Sunda)</span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      <b>Pemahaman Nilai:</b> Membiasakan sikap empati dan rasa kemanusiaan, sigap menolong sesama yang sedang kesulitan dengan tulus tanpa pamrih, serta menjauhi perilaku mengejek kawan.
                    </p>
                  </div>

                  <div className="bg-emerald-950/60 border-2 border-emerald-400/70 p-3 rounded-2xl space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌳</span>
                      <span className="font-black text-xs text-emerald-300 uppercase">Sila 3: Persatuan (Pos Minang)</span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      <b>Pemahaman Nilai:</b> Menghayati semangat Bhinneka Tunggal Ika, merangkul kawan dari beragam daerah dan logat bahasa, serta menjaga kekompakan gotong royong di lingkungan sekolah.
                    </p>
                  </div>

                  <div className="bg-rose-950/60 border-2 border-rose-400/70 p-3 rounded-2xl space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🐂</span>
                      <span className="font-black text-xs text-rose-300 uppercase">Sila 4: Musyawarah (Pos Dayak)</span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      <b>Pemahaman Nilai:</b> Mengutamakan musyawarah mufakat dalam mengambil keputusan bersama, mendengarkan saran teman dengan bijak, serta tidak memaksakan pendapat pribadi.
                    </p>
                  </div>

                  <div className="sm:col-span-2 bg-yellow-950/60 border-2 border-yellow-400/70 p-3 rounded-2xl space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌾</span>
                      <span className="font-black text-xs text-yellow-300 uppercase">Sila 5: Keadilan Sosial (Pos Papua)</span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      <b>Pemahaman Nilai:</b> Menjunjung tinggi keadilan sosial bagi seluruh rakyat, membagi hasil kerja sama kelompok secara berimbang dan merata, serta membiasakan sikap tidak serakah.
                    </p>
                  </div>
                </div>

                {/* Kontrol Navigasi Keyboard */}
                <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700 text-[11px] text-yellow-200 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <span>🎮 <b>WASD / Panah</b>: Jalan</span>
                  <span>•</span>
                  <span>🟡 <b>Spasi</b>: Lompat</span>
                  <span>•</span>
                  <span>⚡ <b>Shift</b>: Lari Cepat</span>
                  <span>•</span>
                  <span>🎯 <b>E</b>: Dialog Misi &amp; Sapa Teman</span>
                </div>

                {/* Tombol Aksi: Suara & Mulai */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isGuruSpeaking) {
                        stopGuruVoice();
                      } else {
                        speakGuruVoice(
                          "Halo anak hebat! Sebelum mulai berpetualang di Desa Pancasila, mari kita pahami nilai lima sila ini: Sila satu mengajarkan toleransi dan menghormati sesama dalam beribadah. Sila dua mengajarkan kepedulian dan keikhlasan menolong orang yang sedang kesulitan. Sila tiga merawat persatuan dalam keberagaman Bhinneka Tunggal Ika. Sila empat meneladankan musyawarah mufakat untuk mencapai kesepakatan bersama. Dan sila lima mengajak kita bersikap adil serta menjunjung kebersamaan. Selamat berpetualang dan kumpulkan koin di jalan!"
                        );
                      }
                    }}
                    className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-black text-xs transition border flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                      isGuruSpeaking
                        ? "bg-rose-600 border-rose-400 text-white animate-pulse"
                        : "bg-sky-600 hover:bg-sky-500 border-sky-400 text-white"
                    }`}
                  >
                    <span>{isGuruSpeaking ? "⏹️ Hentikan Suara" : "🔊 Dengarkan Penjelasan Pak Guru"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      stopGuruVoice();
                      setGameStarted(true);
                      startAdventureBgm();
                    }}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs sm:text-sm py-3.5 px-7 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition border-2 border-white flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🚀 SUDAH PAHAM, AYO MULAI PETUALANGAN! 🎵</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFIKASI DI LAYAR */}
          {activeNotification && (
            <div className="absolute top-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 max-w-md bg-slate-900/95 border-2 border-yellow-400 p-3.5 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in text-white text-xs sm:text-sm font-bold backdrop-blur-md">
              {activeNotification}
            </div>
          )}

          {/* BALON INTERAKSI DADAH MENYAPA TEMAN ONLINE */}
          {friendGreetingBubble && (
            <div className="absolute bottom-28 inset-x-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 max-w-md bg-emerald-950/95 border-3 border-emerald-400 p-4 rounded-3xl shadow-2xl text-center animate-in zoom-in-95 text-white space-y-1 backdrop-blur-md">
              <span className="text-xs text-emerald-400 font-black uppercase tracking-wider block">
                👋 Sapaan dari {friendGreetingBubble.name} (Online)
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-100">
                {friendGreetingBubble.text}
              </p>
            </div>
          )}

          {/* DIALOG PAK GURU VIRTUAL DENGAN VOICE SUARA ASLI INDONESIA */}
          {showGuruDialog && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900/95 border-3 border-sky-400 rounded-3xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-3xl shadow-md">
                      👨‍🏫
                    </span>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-sky-300">
                        Pak Guru Virtual
                      </h3>
                      <p className="text-xs text-slate-300">
                        Pemandu Materi & Petualangan Pancasila
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isGuruSpeaking) {
                          stopGuruVoice();
                        } else {
                          if (guruTab === "apa_itu") {
                            speakGuruVoice(
                              "Pancasila adalah lima dasar dan pedoman hidup luhur bangsa Indonesia yang menyatukan kita semua dari Sabang sampai Merauke."
                            );
                          } else if (guruTab === "makna_sila") {
                            speakGuruVoice(
                              "Sila 1 Ketuhanan: saling menghormati ibadah teman. Sila 2 Kemanusiaan: tolong menolong tanpa pamrih. Sila 3 Persatuan: rukun berbeda suku. Sila 4 Kerakyatan: musyawarah mufakat. Sila 5 Keadilan: bersikap adil dan gotong royong."
                            );
                          } else {
                            speakGuruVoice(
                              "Cara mainnya mudah: jalan dengan WASD atau panah, ambil koin emas di jalan, kunjungi 5 rumah suku adat di kiri dan kanan jalan lalu tekan E untuk menjawab kuis dan sapa teman sekelasmu!"
                            );
                          }
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isGuruSpeaking
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-sky-500 hover:bg-sky-600 text-white"
                      }`}
                    >
                      <span>{isGuruSpeaking ? "⏹️ Hentikan Suara" : "🔊 Putar Suara Guru"}</span>
                    </button>
                  </div>
                </div>

                {/* Tab Pilihan Penjelasan Pak Guru */}
                <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-2xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setGuruTab("apa_itu");
                      speakGuruVoice(
                        "Pancasila adalah lima dasar dan pedoman hidup luhur bangsa Indonesia yang menyatukan kita semua dari Sabang sampai Merauke."
                      );
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      guruTab === "apa_itu"
                        ? "bg-sky-500 text-white shadow-md"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    📖 Apa Itu Pancasila?
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGuruTab("makna_sila");
                      speakGuruVoice(
                        "Sila 1 Ketuhanan: saling menghormati ibadah teman. Sila 2 Kemanusiaan: tolong menolong tanpa pamrih. Sila 3 Persatuan: rukun berbeda suku. Sila 4 Kerakyatan: musyawarah mufakat. Sila 5 Keadilan: bersikap adil dan gotong royong."
                      );
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      guruTab === "makna_sila"
                        ? "bg-sky-500 text-white shadow-md"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    ⭐ Makna 5 Sila & Aksi
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGuruTab("cara_main");
                      speakGuruVoice(
                        "Cara mainnya mudah: jalan dengan WASD atau panah, ambil koin emas di jalan, kunjungi 5 rumah suku adat di kiri dan kanan jalan lalu tekan E untuk menjawab kuis dan sapa teman sekelasmu!"
                      );
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      guruTab === "cara_main"
                        ? "bg-sky-500 text-white shadow-md"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    🎮 Cara Main Game
                  </button>
                </div>

                {/* Konten Penjelasan Sesuai Tab */}
                <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 text-xs sm:text-sm leading-relaxed text-slate-200 space-y-2">
                  {guruTab === "apa_itu" && (
                    <div className="space-y-2">
                      <b className="text-yellow-300 block">Pondasi Luhur Bangsa Indonesia:</b>
                      <p>
                        "Pancasila adalah lima dasar dan pedoman hidup luhur bangsa Indonesia yang dirumuskan oleh para pendiri bangsa. Nilai-nilai ini menjadi perekat persatuan di tengah keberagaman ratusan suku bangsa dan budaya Nusantara."
                      </p>
                    </div>
                  )}

                  {guruTab === "makna_sila" && (
                    <div className="space-y-1.5 text-xs">
                      <div>⭐ <b>Sila 1</b>: Menghormati teman beribadah & rukun antarumat beragama.</div>
                      <div>⛓️ <b>Sila 2</b>: Gemar menolong sesama & tidak mengejek teman (anti-bullying).</div>
                      <div>🌳 <b>Sila 3</b>: Bangga bermain rukun dengan teman dari berbagai suku daerah.</div>
                      <div>🐂 <b>Sila 4</b>: Mengutamakan musyawarah mufakat dalam mengambil keputusan bersama.</div>
                      <div>🌾 <b>Sila 5</b>: Bersikap adil, tidak pilih kasih, dan suka gotong royong.</div>
                    </div>
                  )}

                  {guruTab === "cara_main" && (
                    <div className="space-y-2">
                      <b className="text-emerald-300 block">Panduan Petualangan Jelajah:</b>
                      <p>
                        1. <b>Jalan</b> melewati Gapura Nusantara dengan tombol WASD atau Panah.<br />
                        2. <b>Kumpulkan Koin Emas (+5 Poin)</b> yang bertebaran di sepanjang jalan desa.<br />
                        3. <b>Kunjungi 5 Rumah Suku Adat</b> (Jawa, Sunda, Minang, Dayak, Papua) lalu tekan <b>'E'</b> untuk kuis (+25 Poin).<br />
                        4. <b>Sapa Teman Sekelas Online</b> yang sedang berpapasan dengan menekan <b>'E'</b>!
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-slate-400">
                    {isGuruSpeaking ? "🔊 Sedang bersuara..." : "Tekan tombol audio untuk suara"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      stopGuruVoice();
                      setShowGuruDialog(false);
                      setActiveNotification("🚀 Petunjuk selesai! Silakan mulai menjelajahi jalan desa!");
                      setTimeout(() => setActiveNotification(null), 3000);
                    }}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 px-6 rounded-2xl text-xs transition cursor-pointer"
                  >
                    Siap, Pak Guru! Mulai Petualangan 🚀
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DIALOG POPUP KUIS RUMAH SUKU */}
          {activeSukuDialog && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900/95 border-3 border-yellow-400 rounded-3xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-700/80 pb-3">
                  <span className="w-14 h-14 rounded-2xl bg-yellow-400/20 border border-yellow-400 flex items-center justify-center text-3xl shadow-md">
                    {activeSukuDialog.tokohAvatar}
                  </span>
                  <div>
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                      {activeSukuDialog.simbolSila} Sila ke-{activeSukuDialog.silaKe} • {activeSukuDialog.rumahAdat}
                    </span>
                    <h3 className="font-black text-base sm:text-lg text-white">
                      {activeSukuDialog.namaSuku}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Disambut oleh: <b>{activeSukuDialog.tokohNama}</b>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-xs sm:text-sm leading-relaxed text-slate-100 font-medium">
                  "{activeSukuDialog.pertanyaan}"
                </div>

                <div className="space-y-2 pt-1">
                  {activeSukuDialog.opsi.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleAnswerSuku(activeSukuDialog, opt.id)}
                      className={`w-full text-left p-3.5 rounded-2xl transition text-xs sm:text-sm font-semibold flex items-start gap-3 cursor-pointer border ${
                        selectedAnswer === opt.id
                          ? opt.benar
                            ? "bg-emerald-600/30 border-emerald-400 text-emerald-200"
                            : "bg-rose-600/30 border-rose-400 text-rose-200"
                          : "bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-xl bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                        {opt.id}
                      </span>
                      <span>{opt.teks}</span>
                    </button>
                  ))}
                </div>

                {answerFeedback && (
                  <div
                    className={`p-3 rounded-2xl text-xs font-bold animate-in fade-in ${
                      answerFeedback.isCorrect
                        ? "bg-emerald-950/80 border border-emerald-400 text-emerald-300"
                        : "bg-rose-950/80 border border-rose-400 text-rose-300"
                    }`}
                  >
                    {answerFeedback.isCorrect ? "✅ Benar! +25 Poin! " : "❌ Kurang Tepat: "}
                    {answerFeedback.text}
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">
                    {visitedSukuIds.includes(activeSukuDialog.id) ? "✓ Sudah Diselesaikan" : "Belum Selesai"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSukuDialog(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Tutup Dialog
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL PAPAN SKOR KELAS */}
          {showLeaderboard && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900/95 border-3 border-indigo-400 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">🏆</span>
                    <div>
                      <h3 className="font-black text-base text-indigo-300">
                        Papan Skor Siswa Kelas Online
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Peringkat kawan sekelas yang aktif di Petualangan Pancasila
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLeaderboard(false)}
                    className="text-slate-400 hover:text-white text-base px-2 py-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {classLeaderboard.map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl flex items-center justify-between border transition ${
                        s.isPlayer
                          ? "bg-yellow-400/20 border-yellow-400 font-bold text-yellow-300 shadow-md ring-1 ring-yellow-400/60"
                          : "bg-slate-800/80 border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 font-black text-center text-sm">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </span>
                        <span className="text-lg">{s.avatar}</span>
                        <div className="min-w-0">
                          <span className="block font-black text-white">{s.name}</span>
                          <span className="text-[10px] text-slate-400">
                            Kostum: {s.costume} • <span className="text-emerald-400">{s.status}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-yellow-300 block">{s.points} Poin</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowLeaderboard(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-2xl text-xs transition"
                >
                  Tutup Papan Skor
                </button>
              </div>
            </div>
          )}

          {/* SELEBRASI AKHIR KELILING 5 SUKU SELESAI */}
          {allSukuCompleted && (
            <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95 text-center">
              <div className="bg-slate-900 border-4 border-yellow-400 rounded-3xl max-w-lg w-full p-8 text-white space-y-5 shadow-2xl">
                <div className="w-24 h-24 rounded-full bg-yellow-400/20 border-3 border-yellow-400 flex items-center justify-center text-5xl mx-auto animate-bounce">
                  🏆
                </div>
                <div className="space-y-2">
                  <h3 className="font-black text-2xl sm:text-3xl text-yellow-300">
                    SELAMAT! KAMU DUTA PANCASILA NUSANTARA! 🇮🇩
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Kamu telah mengunjungi seluruh 5 Rumah Suku Adat (Jawa, Sunda, Minang, Dayak, Papua) dan mengamalkan nilai-nilai luhur Pancasila bersama kawan sekelas!
                  </p>
                </div>

                <div className="p-4 bg-yellow-400/10 border border-yellow-400/50 rounded-2xl space-y-1">
                  <div className="text-xs text-yellow-300 uppercase tracking-widest font-black">
                    Pencapaian Prestasi Pelajar:
                  </div>
                  <div className="text-lg font-black text-white">
                    🎖️ JUARA PETUALANG PANCASILA KELAS
                  </div>
                  <div className="text-xs text-emerald-400 font-bold pt-1">
                    🪙 Total Skor: {adventureScore} Poin • ⭐ {coinsCollectedCount} Koin Terkumpul • +50 Poin Bonus Web!
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setAllSukuCompleted(false);
                    setVisitedSukuIds([]);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-black py-3 rounded-2xl text-sm shadow-xl transition cursor-pointer"
                >
                  🔄 Keliling Desa Sekali Lagi
                </button>
              </div>
            </div>
          )}

          {/* VIRTUAL CONTROLLER DI LAYAR */}
          <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between pointer-events-none">
            {/* D-Pad Navigasi Lembut */}
            <div className="grid grid-cols-3 gap-1.5 pointer-events-auto">
              <div />
              <button
                type="button"
                onMouseDown={() => (keysRef.current.forward = true)}
                onMouseUp={() => (keysRef.current.forward = false)}
                onTouchStart={() => (keysRef.current.forward = true)}
                onTouchEnd={() => (keysRef.current.forward = false)}
                className="w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-950 text-white border border-yellow-400/60 font-black text-lg shadow-lg flex items-center justify-center cursor-pointer active:scale-90"
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
                className="w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-950 text-white border border-yellow-400/60 font-black text-lg shadow-lg flex items-center justify-center cursor-pointer active:scale-90"
              >
                ◀
              </button>
              <button
                type="button"
                onMouseDown={() => (keysRef.current.backward = true)}
                onMouseUp={() => (keysRef.current.backward = false)}
                onTouchStart={() => (keysRef.current.backward = true)}
                onTouchEnd={() => (keysRef.current.backward = false)}
                className="w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-950 text-white border border-yellow-400/60 font-black text-lg shadow-lg flex items-center justify-center cursor-pointer active:scale-90"
              >
                ▼
              </button>
              <button
                type="button"
                onMouseDown={() => (keysRef.current.right = true)}
                onMouseUp={() => (keysRef.current.right = false)}
                onTouchStart={() => (keysRef.current.right = true)}
                onTouchEnd={() => (keysRef.current.right = false)}
                className="w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-950 text-white border border-yellow-400/60 font-black text-lg shadow-lg flex items-center justify-center cursor-pointer active:scale-90"
              >
                ▶
              </button>
            </div>

            {/* Tombol Interaksi Pill Cantik */}
            <div className="flex items-center gap-2.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  const event = new KeyboardEvent("keydown", { key: "e" });
                  window.dispatchEvent(event);
                }}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 cursor-pointer border-2 border-white"
              >
                <span>🎯</span>
                <span>INTERAKSI (E)</span>
              </button>

              <button
                type="button"
                onMouseDown={() => {
                  keysRef.current.sprint = true;
                  playDashSound();
                }}
                onMouseUp={() => {
                  keysRef.current.sprint = false;
                }}
                onTouchStart={() => {
                  keysRef.current.sprint = true;
                  playDashSound();
                }}
                onTouchEnd={() => {
                  keysRef.current.sprint = false;
                }}
                className="px-4 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-yellow-300 border border-yellow-400/50 font-black text-xs shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
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
                className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm py-3 px-5 sm:px-6 rounded-2xl shadow-xl transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border-2 border-white"
              >
                <span>🟡</span>
                <span>LOMPAT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </ModalPortal>
);
}
