// frontend/src/components/AdaptiveEduGameModal.tsx
// Game Edukasi Interaktif Multi-Model:
// 1. Model Petualangan 3D: Jelajah Desa & Pos Tematik (Materi Panjang, PKn, Gotong Royong, Norma, Bhinneka, Kemendikbud)
// 2. Model Teka-Teki Menjodohkan: Memory Match Pasangan Kata / Aksara Jawa / Unggah-Ungguh
// 3. Model Tebak Kata & Tokoh Ceria: Tebak Tokoh Punokawan & Pandhawa Lima dengan Petunjuk Seru

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

// Model Pos Tematik / Suku Adat Petualangan 3D
interface PosTematik {
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

// Model Item Tebak Kata & Tokoh
interface WordGuessItem {
  id: string;
  targetWord: string; // e.g. "SEMAR"
  clue: string;
  avatar: string;
  category: string;
  explanation: string;
}

export default function AdaptiveEduGameModal({
  isOpen,
  onClose,
  chapter,
  chapterTitle,
}: Props) {
  const addPoints = useUIStore((s) => s.addPoints);
  const activeValidatedModule = useUIStore((s) => s.activeValidatedModule);

  // Judul Materi Dinamis
  const resolvedTitle = useMemo(() => {
    return activeValidatedModule?.title || chapterTitle || chapter;
  }, [activeValidatedModule?.title, chapterTitle, chapter]);

  // Penentuan Otomatis Model Game (1 Materi = 1 Model Game Spesifik)
  type GameType = "adventure" | "matching" | "word_guess";
  const resolvedGameType: GameType = useMemo(() => {
    const rawTitle = (activeValidatedModule?.title || chapterTitle || chapter || "").toLowerCase();
    const chLower = (activeValidatedModule?.id || chapter || "").toLowerCase();
    const subjLower = (activeValidatedModule?.subject || "").toLowerCase();

    // 1. Modul Tokoh / Karakter / Kata Singkat -> Tebak Kata & Tokoh
    if (
      chLower.includes("punokawan") ||
      rawTitle.includes("punokawan") ||
      chLower.includes("pandhawa") ||
      rawTitle.includes("pandhawa") ||
      rawTitle.includes("tokoh") ||
      rawTitle.includes("tebak kata") ||
      rawTitle.includes("pahlawan")
    ) {
      return "word_guess";
    }

    // 2. Modul Pasangan Kata / Aksara / Bahasa -> Menjodohkan Kartu (Memory Match)
    if (
      chLower.includes("aksara") ||
      rawTitle.includes("aksara") ||
      chLower.includes("unggah") ||
      rawTitle.includes("unggah") ||
      rawTitle.includes("jodoh") ||
      rawTitle.includes("pasangan") ||
      rawTitle.includes("kosakata") ||
      (subjLower === "bjawa" && !chLower.includes("punokawan") && !chLower.includes("pandhawa"))
    ) {
      return "matching";
    }

    // 3. Modul Panjang / Nilai Luhur / Kewarganegaraan / Kemendikbud -> Petualangan 3D Jelajah Desa
    return "adventure";
  }, [activeValidatedModule?.title, activeValidatedModule?.id, activeValidatedModule?.subject, chapterTitle, chapter]);

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

  // Voice Speech Synthesis Suara Pak Guru
  const speakGuruVoice = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const idVoice =
        voices.find((v) => v.lang.includes("id") || v.lang.includes("ID")) ||
        voices.find((v) => v.name.includes("Indonesian")) ||
        voices[0];
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
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {}
    setIsGuruSpeaking(false);
  }, []);

  // Briefing Materi & Suara Pak Guru Dinamis sesuai Materi Aktif
  const guruBriefing = useMemo(() => {
    const rawTitle = resolvedTitle.toLowerCase();
    const idLower = (activeValidatedModule?.id || chapter || "").toLowerCase();

    // Materi Gotong Royong
    if (idLower.includes("gotongroyong") || rawTitle.includes("gotong royong")) {
      return {
        topicName: "Gotong Royong di Sekolah",
        tabTitleIntisari: "Nilai Kerja Sama",
        apaItuText:
          "Gotong royong adalah tradisi luhur bangsa Indonesia untuk bekerja bersama-sama, saling membantu dan tolong menolong demi mencapai tujuan bersama dengan ikhlas dan gembira.",
        intisariText:
          "1. Piket Kelas: ruang belajar cepat bersih bila dikerjakan bersama.\n2. Tolong Teman: membantu kawan yang kesulitan tanpa pamrih.\n3. Semboyan: Berat sama dipikul, ringan sama dijinjing.\n4. Musyawarah Regu: membagi tugas secara adil dan rukun.\n5. Merawat Lingkungan: menjaga fasilitas sekolah agar tetap asri.",
        caraMainText:
          "Cara mainnya seru: jalankan karakter dengan WASD atau tombol panah, kumpulkan koin emas di sepanjang jalan, kunjungi 5 Pos Gotong Royong di kiri dan kanan jalan, lalu tekan tombol Tantangan Kuis di titik bercahaya!",
      };
    }

    // Materi Norma & Aturan Sekolah
    if (idLower.includes("norma") || rawTitle.includes("norma") || rawTitle.includes("aturan")) {
      return {
        topicName: "Norma & Aturan Sekolah",
        tabTitleIntisari: "5 Norma Sekolah",
        apaItuText:
          "Norma sekolah adalah tata tertib dan aturan bersama yang disepakati untuk menciptakan suasana belajar yang aman, tertib, disiplin, dan saling menghormati di lingkungan sekolah.",
        intisariText:
          "1. Disiplin Waktu: hadir di kelas sebelum bel masuk berbunyi.\n2. Seragam Lengkap: berpakaian rapi sesuai jadwal upacara.\n3. Budaya 5S: Senyum, Salam, Sapa, Sopan, dan Santun.\n4. Budaya Antre: sabar menunggu giliran di kantin.\n5. Menjaga Fasilitas: merawat buku perpustakaan dan kebersihan kelas.",
        caraMainText:
          "Gunakan tombol WASD atau panah keyboard untuk menjelajah, pungut koin emas, dekati papan nama di depan pos norma, dan masuki lingkaran bercahaya untuk menyelesaikan tantangan kuis!",
      };
    }

    // Materi Bhinneka Tunggal Ika
    if (idLower.includes("bhinneka") || rawTitle.includes("bhinneka") || rawTitle.includes("keragaman")) {
      return {
        topicName: "Bhinneka Tunggal Ika",
        tabTitleIntisari: "5 Keragaman Nusantara",
        apaItuText:
          "Bhinneka Tunggal Ika adalah semboyan pemersatu bangsa yang berarti 'Berbeda-beda tetapi tetap satu jua'. Indonesia kaya akan aneka suku, budaya, dan bahasa yang saling melengkapi.",
        intisariText:
          "1. Keragaman Suku: rukun berteman dari Sabang sampai Merauke.\n2. Bahasa Ibu & Indonesia: lestarikan bahasa daerah, junjung bahasa persatuan.\n3. Rumah & Busana Adat: bangga warisan budaya bangsa.\n4. Toleransi Budaya: menghormati perayaan adat teman.\n5. Sumpah Pemuda: satu nusa, satu bangsa, satu bahasa Indonesia.",
        caraMainText:
          "Kendalikan karaktermu melintasi desa adat, pungut koin emas, jumpai teman-teman sekelas dan kunjungi 5 Pos Keragaman Nusantara untuk menjawab tantangan!",
      };
    }

    // Modul Validasi Kemendikbud (Jika memiliki ringkasan/ragSummary)
    if (activeValidatedModule && activeValidatedModule.ragSummary) {
      return {
        topicName: activeValidatedModule.title,
        tabTitleIntisari: "Intisari Materi",
        apaItuText: `Materi "${activeValidatedModule.title}" dirancang khusus oleh Guru dan Kemendikbud untuk memperdalam wawasan serta karakter luhur para siswa.`,
        intisariText: activeValidatedModule.ragSummary.slice(0, 320) + "...",
        caraMainText:
          "Jelajahi setiap pos tematik di sepanjang rute desa, kumpulkan koin emas di jalan, dan dekati titik bercahaya di depan tiap pos untuk menguji pemahamanmu!",
      };
    }

    // Default: Makna Sila Pancasila (pkn-sila3)
    return {
      topicName: "Pancasila & Nilai Luhur Bangsa",
      tabTitleIntisari: "Makna 5 Sila",
      apaItuText:
        "Pancasila adalah lima dasar dan pedoman hidup luhur bangsa Indonesia yang menyatukan kita semua dari Sabang sampai Merauke dalam kedamaian dan keadilan.",
      intisariText:
        "Sila 1 Ketuhanan: saling menghormati ibadah teman.\nSila 2 Kemanusiaan: tolong menolong tanpa pamrih.\nSila 3 Persatuan: rukun berbeda suku bangsa.\nSila 4 Kerakyatan: musyawarah mufakat.\nSila 5 Keadilan: bersikap adil dan gotong royong.",
      caraMainText:
        "Cara mainnya mudah: jalan dengan tombol WASD atau panah, kumpulkan koin emas di jalan, kunjungi 5 rumah suku adat di kiri dan kanan jalan, lalu injak titik bercahaya untuk menjawab kuis dan sapa teman sekelasmu!",
    };
  }, [resolvedTitle, activeValidatedModule, chapter]);

  // ==========================================================================
  // MODEL GAME 1: PETUALANGAN 3D DESA (DATA 5 POS TEMATIK DINAMIS)
  // ==========================================================================
  const sukuList: PosTematik[] = useMemo(() => {
    const rawTitle = resolvedTitle.toLowerCase();
    const idLower = (activeValidatedModule?.id || chapter || "").toLowerCase();

    // 1. Modul Validasi Kemendikbud dengan Kuis bawaan
    const rawQuiz = (activeValidatedModule as any)?.quizQuestions;
    const questionsArray: any[] = Array.isArray(rawQuiz)
      ? rawQuiz
      : rawQuiz && typeof rawQuiz === "object"
        ? Object.values(rawQuiz).flat()
        : [];
    if (questionsArray.length >= 3) {
      const qList = questionsArray.slice(0, 5);
      const avatars = ["🧑", "👩", "👴", "🧕", "👦"];
      const names = ["Kak Budi", "Bu Guru Dewi", "Kakek Wardi", "Kak Salma", "Kak Dayu"];
      const colors = ["#38bdf8", "#fb923c", "#4ade80", "#a855f7", "#f59e0b"];
      const zPositions = [-45, -105, -165, -225, -285];
      const xPositions = [14, -14, 14, -14, 14];

      return qList.map((q: any, idx: number) => {
        // Acak letak jawaban agar tidak melulu pilihan A
        const rawOpts = (q.options || []).map((optText: string, oIdx: number) => ({
          id: String.fromCharCode(65 + oIdx),
          teks: optText,
          benar: oIdx === (q.correctAnswerIndex ?? 0),
          penjelasan: q.explanation || "Pemahaman materi yang sangat tepat!",
        }));
        const shuffled = [...rawOpts].sort(() => 0.5 - ((idx * 3 + 1) % 5) / 10);
        const relettered = shuffled.map((o, sIdx) => ({
          ...o,
          id: String.fromCharCode(65 + sIdx),
        }));

        return {
          id: `pos-kemdikbud-${idx + 1}`,
          namaSuku: `Pos ${idx + 1}: ${q.question.slice(0, 24)}...`,
          rumahAdat: `Balai Edukasi Pos ${idx + 1}`,
          tokohNama: names[idx % names.length],
          tokohAvatar: avatars[idx % avatars.length],
          silaKe: idx + 1,
          simbolSila: ["🎯", "💡", "📚", "🌟", "🏆"][idx % 5],
          zPos: zPositions[idx % zPositions.length],
          xPos: xPositions[idx % xPositions.length],
          warnaKhas: colors[idx % colors.length],
          pertanyaan: q.question,
          opsi: relettered,
        };
      });
    }

    // 2. Modul Gotong Royong
    if (idLower.includes("gotongroyong") || rawTitle.includes("gotong royong")) {
      return [
        {
          id: "pos-1",
          namaSuku: "Pos Piket Bersih Kelas",
          rumahAdat: "Balai Piket Kelas Berseri",
          tokohNama: "Kak Budi (Ketua Regu Piket)",
          tokohAvatar: "👦",
          silaKe: 1,
          simbolSila: "🧹",
          zPos: -45,
          xPos: 14,
          warnaKhas: "#38bdf8",
          pertanyaan: "Saat jadwal piket kebersihan kelas tiba, bagaimana sikap gotong royong yang patut dilakukan?",
          opsi: [
            { id: "A", teks: "Pulang diam-diam agar terhindar dari tugas menyapu lantai.", benar: false, penjelasan: "Meninggalkan tanggung jawab piket merugikan teman sekelompok." },
            { id: "B", teks: "Membagi tugas menyapu, merapikan bangku, dan membuang sampah bersama kawan.", benar: true, penjelasan: "Sangat bagus! Gotong royong membuat tugas piket selesai lebih cepat dan kelas menjadi bersih." },
            { id: "C", teks: "Menyuruh satu kawan saja yang membersihkan seluruh ruangan kelas.", benar: false, penjelasan: "Piket adalah kerja sama regu, tidak boleh dibebankan pada satu orang." },
          ],
        },
        {
          id: "pos-2",
          namaSuku: "Pos Tolong Kawan",
          rumahAdat: "Balai Sahabat Peduli",
          tokohNama: "Siti Rahma (Duta Kebaikan)",
          tokohAvatar: "👧",
          silaKe: 2,
          simbolSila: "🤝",
          zPos: -105,
          xPos: -14,
          warnaKhas: "#fb923c",
          pertanyaan: "Teman sebangkumu lupa membawa alat mewarnai saat pelajaran seni. Apa tindakan gotong royongmu?",
          opsi: [
            { id: "A", teks: "Berbagi krayon dan meminjamkannya dengan ikhlas.", benar: true, penjelasan: "Sangat terpuji! Saling membantu meringankan beban kawan tanpa pamrih." },
            { id: "B", teks: "Menyembunyikan krayon agar kawan ditegur oleh guru.", benar: false, penjelasan: "Sikap egois merusak rasa persahabatan di kelas." },
            { id: "C", teks: "Menyewakan krayon dengan memungut uang saku kawan.", benar: false, penjelasan: "Menolong sesama teman harus tulus dan tanpa motif komersial." },
          ],
        },
        {
          id: "pos-3",
          namaSuku: "Pos Filosofi Gotong Royong",
          rumahAdat: "Rumah Kearifan Nusantara",
          tokohNama: "Kakek Marto (Tetua Desa)",
          tokohAvatar: "👴",
          silaKe: 3,
          simbolSila: "⚖️",
          zPos: -165,
          xPos: 14,
          warnaKhas: "#4ade80",
          pertanyaan: "Apa arti dari semboyan luhur 'Berat sama dipikul, ringan sama dijinjing'?",
          opsi: [
            { id: "A", teks: "Pekerjaan berat hanya dikerjakan oleh orang tua saja.", benar: false, penjelasan: "Bukan itu maknanya; semboyan ini mengajarkan kebersamaan di segala keadaan." },
            { id: "B", teks: "Hanya bersedia bekerja sama jika dijanjikan hadiah uang.", benar: false, penjelasan: "Gotong royong didasari keikhlasan hati, bukan pamrih imbalan." },
            { id: "C", teks: "Suka dan duka dihadapi bersama, pekerjaan berat menjadi ringan jika dilakukan bersama-sama.", benar: true, penjelasan: "Tepat sekali! Semboyan ini adalah intisari dari kekuatan gotong royong bangsa kita." },
          ],
        },
        {
          id: "pos-4",
          namaSuku: "Pos Musyawarah Regu",
          rumahAdat: "Balai Rembug Warga",
          tokohNama: "Kang Asep (Koordinator Regu)",
          tokohAvatar: "🧑",
          silaKe: 4,
          simbolSila: "🗣️",
          zPos: -225,
          xPos: -14,
          warnaKhas: "#a855f7",
          pertanyaan: "Dalam kelompok kerja bakti kebun, terjadi perbedaan pendapat tentang jenis tanaman yang mau ditanam. Solusi terbaik adalah:",
          opsi: [
            { id: "A", teks: "Memaksa seluruh anggota menuruti pilihan pribadi kita.", benar: false, penjelasan: "Memaksakan kehendak dapat memicu perpecahan regu." },
            { id: "B", teks: "Musyawarah bersama dengan kepala dingin hingga mencapai mufakat yang disepakati bersama.", benar: true, penjelasan: "Sempurna! Musyawarah mufakat menjamin keharmonisan dan hasil yang terbaik." },
            { id: "C", teks: "Marah dan keluar dari kelompok kerja bakti.", benar: false, penjelasan: "Merajuk tidak menyelesaikan masalah dan merusak kerja tim." },
          ],
        },
        {
          id: "pos-5",
          namaSuku: "Pos Taman Sekolah Asri",
          rumahAdat: "Pendopo Hijau Lestari",
          tokohNama: "Ibu Guru Endang (Pemandu Lingkungan)",
          tokohAvatar: "👩",
          silaKe: 5,
          simbolSila: "🌱",
          zPos: -285,
          xPos: 14,
          warnaKhas: "#f59e0b",
          pertanyaan: "Seluruh siswa telah bergotong royong merawat taman sekolah hingga berbunga asri. Bagaimana cara menjaga hasilnya?",
          opsi: [
            { id: "A", teks: "Memetik bunga secara liar untuk dibawa pulang ke rumah.", benar: false, penjelasan: "Memetik bunga merusak keindahan taman yang dirawat bersama." },
            { id: "B", teks: "Menyiram tanaman bergantian secara teratur dan tidak menginjak rumput taman.", benar: true, penjelasan: "Keren! Merawat fasilitas bersama adalah wujud nyata pelestarian hasil gotong royong." },
            { id: "C", teks: "Membiarkan rumput liar tumbuh kembali tanpa dipedulikan.", benar: false, penjelasan: "Taman harus terus dirawat agar tetap asri dan nyaman dinikmati bersama." },
          ],
        },
      ];
    }

    // 3. Modul Norma & Aturan Sekolah
    if (idLower.includes("norma") || rawTitle.includes("norma") || rawTitle.includes("aturan")) {
      return [
        {
          id: "pos-1",
          namaSuku: "Pos Disiplin Waktu",
          rumahAdat: "Balai Ketertiban Sekolah",
          tokohNama: "Pak Satpam Wardi (Penjaga Gerbang)",
          tokohAvatar: "👮",
          silaKe: 1,
          simbolSila: "⏰",
          zPos: -45,
          xPos: 14,
          warnaKhas: "#38bdf8",
          pertanyaan: "Bel tanda masuk sekolah berbunyi pukul 07.00 pagi. Menurut norma ketertiban sekolah, tindakan yang benar adalah:",
          opsi: [
            { id: "A", teks: "Sengaja jalan santai dan datang terlambat pukul 07.30.", benar: false, penjelasan: "Datang terlambat mengganggu ketenangan belajar teman di kelas." },
            { id: "B", teks: "Tiba di kelas 15 menit sebelum bel masuk agar siap belajar dengan tenang.", benar: true, penjelasan: "Bagus sekali! Disiplin waktu melatih rasa tanggung jawab dan kemandirian." },
            { id: "C", teks: "Membolos dan bermain di tempat lain.", benar: false, penjelasan: "Membolos adalah pelanggaran tata tertib sekolah." },
          ],
        },
        {
          id: "pos-2",
          namaSuku: "Pos Seragam Rapi",
          rumahAdat: "Balai Kerapian Siswa",
          tokohNama: "Bu Guru Hartini (Pembina Kesiswaan)",
          tokohAvatar: "👩",
          silaKe: 2,
          simbolSila: "👔",
          zPos: -105,
          xPos: -14,
          warnaKhas: "#fb923c",
          pertanyaan: "Saat upacara bendera hari Senin, tata tertib seragam sekolah mengharuskan siswa mengenakan:",
          opsi: [
            { id: "A", teks: "Seragam merah putih lengkap dengan topi, dasi, dan ikat pinggang rapi.", benar: true, penjelasan: "Tepat sekali! Memakai seragam lengkap mencerminkan rasa hormat pada upacara bendera." },
            { id: "B", teks: "Baju kaos bebas dan memakai sandal jepit santai.", benar: false, penjelasan: "Tidak sesuai dengan peraturan resmi seragam upacara." },
            { id: "C", teks: "Meninggalkan dasi dan topi di rumah tanpa alasan yang jelas.", benar: false, penjelasan: "Kelengkapan atribut upacara adalah kewajiban norma berpakaian sekolah." },
          ],
        },
        {
          id: "pos-3",
          namaSuku: "Pos Budaya 5S",
          rumahAdat: "Balai Sopan Santun",
          tokohNama: "Kak Dian (Duta Ramah Sekolah)",
          tokohAvatar: "🧕",
          silaKe: 3,
          simbolSila: "🙏",
          zPos: -165,
          xPos: 14,
          warnaKhas: "#4ade80",
          pertanyaan: "Ketika berpapasan dengan bapak/ibu guru di koridor sekolah, penerapan norma sopan santun 5S adalah:",
          opsi: [
            { id: "A", teks: "Pura-pura tidak melihat dan berlari kencang melewati guru.", benar: false, penjelasan: "Kurang sopan dan tidak menghargai kehadiran guru." },
            { id: "B", teks: "Berteriak riuh dari kejauhan sambil mengejek kawan.", benar: false, penjelasan: "Berteriak di koridor sekolah mengganggu kegiatan belajar mengajar." },
            { id: "C", teks: "Tersenyum ramah, menyapa, dan mengucapkan salam dengan penuh hormat.", benar: true, penjelasan: "Sangat terpuji! Senyum, Salam, Sapa, Sopan, dan Santun adalah ciri pelajar berkarakter mulia." },
          ],
        },
        {
          id: "pos-4",
          namaSuku: "Pos Antre Kantin",
          rumahAdat: "Pojok Kejujuran Kantin",
          tokohNama: "Bu Likah (Pengelola Kantin Sehat)",
          tokohAvatar: "👵",
          silaKe: 4,
          simbolSila: "🚶",
          zPos: -225,
          xPos: -14,
          warnaKhas: "#a855f7",
          pertanyaan: "Saat jam istirahat kantin sangat ramai. Norma antre mengajarkan kita untuk:",
          opsi: [
            { id: "A", teks: "Menyerobot antrean kawan yang lebih kecil badannya.", benar: false, penjelasan: "Menyerobot antrean melanggar hak kawan yang sudah mengantre lebih dahulu." },
            { id: "B", teks: "Berbaris rapi menunggu giliran dilayani dengan sabar dan tertib.", benar: true, penjelasan: "Mantap! Budaya antre mencerminkan sikap adil, tertib, dan beradab." },
            { id: "C", teks: "Mendorong teman di depan agar pesanannya cepat diselesaikan.", benar: false, penjelasan: "Mendorong teman berisiko menimbulkan tumpahan makanan atau kecelakaan kecil." },
          ],
        },
        {
          id: "pos-5",
          namaSuku: "Pos Merawat Fasilitas",
          rumahAdat: "Perpustakaan & Ruang Baca",
          tokohNama: "Pak Joko (Pustakawan Sekolah)",
          tokohAvatar: "🧑‍🏫",
          silaKe: 5,
          simbolSila: "📚",
          zPos: -285,
          xPos: 14,
          warnaKhas: "#f59e0b",
          pertanyaan: "Di perpustakaan sekolah terdapat buku bacaan bersama. Norma pemanfaatan fasilitas bersama mewajibkan kita:",
          opsi: [
            { id: "A", teks: "Mencoret-coret lembar buku dengan spidol atau melipatnya kasar.", benar: false, penjelasan: "Merusak buku perpustakaan merugikan kawan lain yang ingin membaca." },
            { id: "B", teks: "Membaca dengan tenang, menjaga buku tetap bersih, dan mengembalikannya ke rak semula.", benar: true, penjelasan: "Sempurna! Merawat fasilitas bersama mencerminkan kecintaan pada ilmu pengetahuan." },
            { id: "C", teks: "Membawa pulang buku tanpa dicatat oleh petugas perpustakaan.", benar: false, penjelasan: "Membawa buku tanpa izin melanggar peraturan peminjaman buku perpustakaan." },
          ],
        },
      ];
    }

    // 4. Modul Bhinneka Tunggal Ika
    if (idLower.includes("bhinneka") || rawTitle.includes("bhinneka") || rawTitle.includes("keragaman")) {
      return [
        {
          id: "pos-1",
          namaSuku: "Pos Keragaman Suku Bangsa",
          rumahAdat: "Balai Persaudaraan Nusantara",
          tokohNama: "Kak Wayan (Pelajar dari Bali)",
          tokohAvatar: "👦",
          silaKe: 1,
          simbolSila: "🇮🇩",
          zPos: -45,
          xPos: 14,
          warnaKhas: "#38bdf8",
          pertanyaan: "Indonesia memiliki ratusan suku bangsa yang beragam. Sikap terbaik atas keragaman ini adalah:",
          opsi: [
            { id: "A", teks: "Hanya mau berteman akrab dengan teman yang sesuku saja.", benar: false, penjelasan: "Sikap eksklusif membatasi pertemanan dan merusak persatuan." },
            { id: "B", teks: "Bangga dan menghargai semua suku sebagai saudara sebangsa setanah air.", benar: true, penjelasan: "Bagus sekali! Keragaman suku adalah kekayaan pemersatu bangsa Indonesia." },
            { id: "C", teks: "Menganggap budaya suku sendiri yang paling hebat dibanding yang lain.", benar: false, penjelasan: "Sikap etnosentrisme sempit berpotensi memicu perselisihan." },
          ],
        },
        {
          id: "pos-2",
          namaSuku: "Pos Bahasa Daerah & Nasional",
          rumahAdat: "Balai Bahasa & Sastra",
          tokohNama: "Kak Uli (Pelajar dari Batak)",
          tokohAvatar: "👧",
          silaKe: 2,
          simbolSila: "🗣️",
          zPos: -105,
          xPos: -14,
          warnaKhas: "#fb923c",
          pertanyaan: "Bagaimana cara merawat bahasa daerah sekaligus menjunjung Bahasa Indonesia sebagai bahasa persatuan?",
          opsi: [
            { id: "A", teks: "Melestarikan bahasa daerah di rumah, serta memakai Bahasa Indonesia di sekolah dengan santun.", benar: true, penjelasan: "Tepat sekali! Menguasai bahasa daerah melestarikan akar budaya, bahasa nasional menyatukan kita." },
            { id: "B", teks: "Mengejek dialek kawan yang baru pindah dari daerah lain.", benar: false, penjelasan: "Mengejek dialek kawan melukai perasaan dan bertentangan dengan budi pekerti." },
            { id: "C", teks: "Melarang teman berbicara dengan logat daerah asalnya saat istirahat.", benar: false, penjelasan: "Logat daerah kawan adalah ciri khas budaya yang patut dihormati." },
          ],
        },
        {
          id: "pos-3",
          namaSuku: "Pos Rumah & Busana Adat",
          rumahAdat: "Museum Mini Busana Adat",
          tokohNama: "Kak Salma (Pelajar dari Minang)",
          tokohAvatar: "🧕",
          silaKe: 3,
          simbolSila: "👘",
          zPos: -165,
          xPos: 14,
          warnaKhas: "#4ade80",
          pertanyaan: "Saat peringatan Hari Kartini, para siswa mengenakan aneka busana adat Nusantara. Makna luhurnya adalah:",
          opsi: [
            { id: "A", teks: "Saling menyombongkan baju adat siapa yang paling mahal harganya.", benar: false, penjelasan: "Tujuan baju adat bukan untuk pamer, melainkan menghargai budaya luhur." },
            { id: "B", teks: "Mengenal kekayaan budaya busana tradisional dan mempererat persatuan.", benar: true, penjelasan: "Hebat! Melihat ragam busana daerah menyadarkan betapa eloknya Indonesia." },
            { id: "C", teks: "Menolak mengenakan pakaian adat karena menganggapnya kuno.", benar: false, penjelasan: "Pakaian tradisional adalah identitas budaya bangsa yang harus kita banggakan." },
          ],
        },
        {
          id: "pos-4",
          namaSuku: "Pos Toleransi Hari Raya",
          rumahAdat: "Balai Kerukunan Warga",
          tokohNama: "Kak Frans (Pelajar dari NTT)",
          tokohAvatar: "🧑",
          silaKe: 4,
          simbolSila: "🎊",
          zPos: -225,
          xPos: -14,
          warnaKhas: "#a855f7",
          pertanyaan: "Kawan sekelas sedang merayakan hari raya adat di lingkungannya. Sikap toleransi yang patut ditunjukkan adalah:",
          opsi: [
            { id: "A", teks: "Mengucapkan selamat dan menghormati kekhusyukan perayaannya.", benar: true, penjelasan: "Sangat terpuji! Saling menghormati perayaan kawan menumbuhkan kerukunan sejati." },
            { id: "B", teks: "Mengganggu jalannya perayaan adat kawan dengan berbuat bising.", benar: false, penjelasan: "Mengganggu perayaan orang lain adalah tindakan tidak beradab." },
            { id: "C", teks: "Memusuhi teman yang berbeda tradisi perayaannya.", benar: false, penjelasan: "Memusuhi kawan karena perbedaan tradisi merusak keutuhan persaudaraan." },
          ],
        },
        {
          id: "pos-5",
          namaSuku: "Pos Ikrar Sumpah Pemuda",
          rumahAdat: "Monumen Persatuan Bangsa",
          tokohNama: "Kak Markus (Pelajar dari Papua)",
          tokohAvatar: "👦",
          silaKe: 5,
          simbolSila: "📜",
          zPos: -285,
          xPos: 14,
          warnaKhas: "#f59e0b",
          pertanyaan: "Apa amanat utama peristiwa Sumpah Pemuda 1928 bagi generasi pelajar masa kini?",
          opsi: [
            { id: "A", teks: "Mengutamakan kepentingan golongan sendiri di atas kepentingan bersama.", benar: false, penjelasan: "Ego golongan justru melemahkan keutuhan bangsa kita." },
            { id: "B", teks: "Satu nusa, satu bangsa, dan menjunjung bahasa persatuan Bahasa Indonesia demi kemajuan.", benar: true, penjelasan: "Penuh semangat! Persatuan Pemuda mengikat kita menjadi satu bangsa Indonesia yang kokoh dan maju." },
            { id: "C", teks: "Mencari-cari perbedaan untuk diperdebatkan.", benar: false, penjelasan: "Mencari pertengkaran bertentangan dengan ikrar suci Sumpah Pemuda." },
          ],
        },
      ];
    }

    // 5. Default: Makna Sila Ke-1 s/d Ke-5 Pancasila (pkn-sila3)
    return [
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
        rumahAdat: "Rumah Panjang Betang",
        tokohNama: "Paman Nyoman (Penjaga Hutan)",
        tokohAvatar: "🧔",
        silaKe: 4,
        simbolSila: "🐂",
        zPos: -225,
        xPos: -14,
        warnaKhas: "#a855f7",
        pertanyaan: "Saat memilih ketua kelas, ada dua kawan yang dicalonkan dan pendapat siswa terbagi dua. Musyawarah mufakat menuntun kita untuk:",
        opsi: [
          { id: "A", teks: "Memaksa teman-teman memilih calon yang kita sukai secara sepihak.", benar: false, penjelasan: "Pemaksaan kehendak bertentangan dengan asas demokrasi Pancasila." },
          { id: "B", teks: "Berdiskusi santun, mendengarkan visi misi kedua calon, lalu mufakat bersama.", benar: true, penjelasan: "Hebat! Sila 4 mengutamakan musyawarah untuk mencapai mufakat yang adil." },
          { id: "C", teks: "Berkelahi di lapangan sekolah untuk menentukan pemenangnya.", benar: false, penjelasan: "Kekerasan melanggar hukum dan norma kemanusiaan." },
        ],
      },
      {
        id: "papua",
        namaSuku: "Suku Dani Papua (Rumah Honai)",
        rumahAdat: "Rumah Jerami Honai",
        tokohNama: "Kaka Markus (Pahlawan Ceria)",
        tokohAvatar: "🧒",
        silaKe: 5,
        simbolSila: "🌾",
        zPos: -285,
        xPos: 14,
        warnaKhas: "#f59e0b",
        pertanyaan: "Hasil panen kebun sekolah sangat melimpah berkat kerja bakti seluruh siswa. Pembagian yang adil adalah:",
        opsi: [
          { id: "A", teks: "Semua hasil panen dibawa pulang oleh satu orang saja.", benar: false, penjelasan: "Tindakan serakah melanggar keadilan sosial." },
          { id: "B", teks: "Menjual hasil panen secara diam-diam tanpa izin teman-teman.", benar: false, penjelasan: "Tidak jujur dan melanggar hak bersama." },
          { id: "C", teks: "Membagi hasil panen secara merata dan dinikmati bersama seluruh siswa.", benar: true, penjelasan: "Keadilan sosial terwujud nyata! Semua yang bekerja keras berhak menikmati hasil bersama." },
        ],
      },
    ];
  }, [resolvedTitle, activeValidatedModule, chapter]);

  // ==========================================================================
  // MODEL GAME 2: TEKA-TEKI MENJODOHKAN KARTU (MEMORY MATCH)
  // ==========================================================================
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

  useEffect(() => {
    if (!isOpen || resolvedGameType !== "matching") return;
    const rawTitle = resolvedTitle.toLowerCase();
    const chLower = (activeValidatedModule?.id || chapter || "").toLowerCase();

    let pairs = [
      { id: "1", term: "Mangan", match: "Dhahar (Krama Alus)", category: "Unggah-Ungguh" },
      { id: "2", term: "Turu", match: "Sare (Krama Alus)", category: "Unggah-Ungguh" },
      { id: "3", term: "Lunga", match: "Tindak (Krama Alus)", category: "Unggah-Ungguh" },
      { id: "4", term: "Tuku", match: "Mundhut (Krama Alus)", category: "Unggah-Ungguh" },
      { id: "5", term: "Ndeleng", match: "Mriksani (Krama Alus)", category: "Unggah-Ungguh" },
      { id: "6", term: "Ngombe", match: "Ngunjuk (Krama Alus)", category: "Unggah-Ungguh" },
    ];

    if (chLower.includes("aksara") || rawTitle.includes("aksara")) {
      pairs = [
        { id: "1", term: "ꦲ", match: "Aksara 'Ha'", category: "Aksara Legena" },
        { id: "2", term: "ꦤ", match: "Aksara 'Na'", category: "Aksara Legena" },
        { id: "3", term: "ꦕ", match: "Aksara 'Ca'", category: "Aksara Legena" },
        { id: "4", term: "ꦫ", match: "Aksara 'Ra'", category: "Aksara Legena" },
        { id: "5", term: "ꦏ", match: "Aksara 'Ka'", category: "Aksara Legena" },
        { id: "6", term: "ꦢ", match: "Aksara 'Da'", category: "Aksara Legena" },
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
  }, [isOpen, resolvedGameType, resolvedTitle, activeValidatedModule?.id, chapter]);

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

  // ==========================================================================
  // MODEL GAME 3: TEBAK KATA & TOKOH CERIA (WORD GUESS GAME)
  // ==========================================================================
  const wordGuessList: WordGuessItem[] = useMemo(() => {
    const rawTitle = resolvedTitle.toLowerCase();
    const chLower = (activeValidatedModule?.id || chapter || "").toLowerCase();

    if (chLower.includes("pandhawa") || rawTitle.includes("pandhawa")) {
      return [
        {
          id: "w-1",
          targetWord: "YUDHISTIRA",
          clue: "Pambarepe Pandhawa lima, ratu ing Ngamarta, getihe putih, ora tau ngapusi.",
          avatar: "👑",
          category: "Pandhawa Lima",
          explanation: "Raden Puntadewa utawa Yudhistira kondhang watake jujur, sabar, lan ora nate goroh.",
        },
        {
          id: "w-2",
          targetWord: "BIMA",
          clue: "Pandhawa nomer loro, ksatria ing Jodhipati, awake gagah prakosa, nduwe kuku pancanaka.",
          avatar: "💪",
          category: "Pandhawa Lima",
          explanation: "Raden Werkudara utawa Bima kendhel mbelani bebener lan setya marang janjine.",
        },
        {
          id: "w-3",
          targetWord: "ARJUNA",
          clue: "Pandhawa nomer telu, ksatria Madukara, bagus rupane, alus budine, trampil jemparingan.",
          avatar: "🏹",
          category: "Pandhawa Lima",
          explanation: "Raden Janaka utawa Arjuna dadi tuladha ksatria kang luhur budine lan sekti mandraguna.",
        },
        {
          id: "w-4",
          targetWord: "NAKULA",
          clue: "Sedulur kembar pambarep, ksatria Sawojajar, prigel ngrumat jaran lan tansah setya tuhu.",
          avatar: "🐎",
          category: "Pandhawa Lima",
          explanation: "Raden Nakula lan Sadewa minangka sedulur kembar putra Prabu Pandu Dewanata lan Dewi Madrim.",
        },
        {
          id: "w-5",
          targetWord: "SADEWA",
          clue: "Sedulur kembar ragil, ksatria Baweratalun, pinter nujum lan ngelmu kasampurnan.",
          avatar: "📜",
          category: "Pandhawa Lima",
          explanation: "Raden Sadewa pinter banget babagan ngelmu lan tansah ngabekti marang para sedulure.",
        },
      ];
    }

    // Default: Punokawan (bjawa-punokawan)
    return [
      {
        id: "w-1",
        targetWord: "SEMAR",
        clue: "Lurah Karangdempel, tokoh pambarep Punokawan kang wicaksana, titisane Hyang Ismaya.",
        avatar: "👴",
        category: "Wayang Punokawan",
        explanation: "Kyai Semar Badranaya iku pamong para ksatria kang luhur budi lan kebak kawicaksanan.",
      },
      {
        id: "w-2",
        targetWord: "GARENG",
        clue: "Anak pambarepe Semar, sikile jinjit, tangane ceko, nanging jujur lan grapyak marang sapa wae.",
        avatar: "👦",
        category: "Wayang Punokawan",
        explanation: "Nala Gareng senadyan nduweni kekurangan fisik, atine jujur, pinter guyon, lan ora tau iri.",
      },
      {
        id: "w-3",
        targetWord: "PETRUK",
        clue: "Anak nomer loro Semar, awake dhuwur lencir, irunge dawa, prigel ndhagel ngguyokake ati.",
        avatar: "😄",
        category: "Wayang Punokawan",
        explanation: "Petruk Kantong Bolong pinter cecaturan, lucu, lan seneng aweh pitutur becik kanthi guyonan.",
      },
      {
        id: "w-4",
        targetWord: "BAGONG",
        clue: "Anak ragil Semar, awake lemu bunder, suwarane ageng bindheng, seneng guyon lan polos.",
        avatar: "🤪",
        category: "Wayang Punokawan",
        explanation: "Bagong diciptakake saka ayang-ayange Semar, watake blaka suta, jujur, lan tansah ngregengake swasana.",
      },
    ];
  }, [resolvedTitle, activeValidatedModule?.id, chapter]);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wordGuessMistakes, setWordGuessMistakes] = useState(0);
  const [wordGuessCompleted, setWordGuessCompleted] = useState(false);
  const [showWordSuccessToast, setShowWordSuccessToast] = useState(false);

  const activeWordItem = wordGuessList[currentWordIndex] || wordGuessList[0];
  const targetLetters = useMemo(() => activeWordItem.targetWord.toUpperCase().split(""), [activeWordItem]);
  const isCurrentWordSolved = useMemo(
    () => targetLetters.every((char) => char === " " || guessedLetters.includes(char)),
    [targetLetters, guessedLetters]
  );

  useEffect(() => {
    if (!isOpen || resolvedGameType !== "word_guess") return;
    setCurrentWordIndex(0);
    setGuessedLetters([]);
    setWordGuessMistakes(0);
    setWordGuessCompleted(false);
    setShowWordSuccessToast(false);
  }, [isOpen, resolvedGameType, wordGuessList]);

  const handleGuessLetter = (letter: string) => {
    if (guessedLetters.includes(letter) || isCurrentWordSolved || wordGuessCompleted) return;

    playClickSound();
    const nextGuessed = [...guessedLetters, letter];
    setGuessedLetters(nextGuessed);

    if (targetLetters.includes(letter)) {
      playCorrectSound();
      playCoinSound();
      // Periksa apakah seluruh huruf kata ini sudah tertebak
      const isComplete = targetLetters.every((c) => c === " " || nextGuessed.includes(c));
      if (isComplete) {
        setAdventureScore((s) => s + 15);
        addPoints(15, `Berhasil menebak tokoh: ${activeWordItem.targetWord}`);
        setShowWordSuccessToast(true);

        if (currentWordIndex >= wordGuessList.length - 1) {
          setTimeout(() => {
            playBadgeFanfareSound();
            setWordGuessCompleted(true);
            addPoints(30, "Menuntaskan seluruh tebak tokoh!");
          }, 1200);
        }
      }
    } else {
      playOofSound();
      setWordGuessMistakes((m) => m + 1);
    }
  };

  const handleNextWord = () => {
    playClickSound();
    setShowWordSuccessToast(false);
    setGuessedLetters([]);
    setWordGuessMistakes(0);
    if (currentWordIndex < wordGuessList.length - 1) {
      setCurrentWordIndex((i) => i + 1);
    }
  };

  // ==========================================================================
  // STATE INTERAKSI & HUD
  // ==========================================================================
  const [activeSukuDialog, setActiveSukuDialog] = useState<PosTematik | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
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
    dash: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    dash: false,
  });

  // Hotspot Trigger Suku & Siswa
  interface HotspotItem {
    id: string;
    x: number;
    z: number;
    radius: number;
    label: string;
    sukuData?: PosTematik;
    isGuru?: boolean;
    studentData?: OnlineStudent;
  }
  const [nearHotspot, setNearHotspot] = useState<HotspotItem | null>(null);

  // Siswa Online (Classmate)
  const [onlineStudents, setOnlineStudents] = useState<OnlineStudent[]>([
    {
      id: "siti",
      name: "Siti Rahma",
      avatar: "👧",
      costumeName: "Seragam Pramuka",
      shirtColor: "#78350f",
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
      shirtColor: "#15803d",
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
      shirtColor: "#0284c7",
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
      shirtColor: "#7e22ce",
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
  const classLeaderboard = useMemo(
    () =>
      [
        { rank: 1, name: "Siti Rahma", points: 145, avatar: "👧", costume: "Pramuka", status: "Online 🟢" },
        { rank: 2, name: "Budi Santoso", points: 130, avatar: "👦", costume: "Batik Hijau", status: "Online 🟢" },
        { rank: 3, name: "Kamu (Pelajar)", points: adventureScore, avatar: "🎒", costume: "Merah Putih", status: "Online 🟢", isPlayer: true },
        { rank: 4, name: "Edo Pratama", points: 95, avatar: "🧒", costume: "Olahraga Biru", status: "Online 🟢" },
        { rank: 5, name: "Dayu Kemala", points: 80, avatar: "👧", costume: "Batik Ungu", status: "Online 🟢" },
      ].sort((a, b) => b.points - a.points),
    [adventureScore]
  );

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
      setHasTalkedToGuru(false);
      setShowGuruDialog(false);
      setAllSukuCompleted(false);
      if (bgmEnabled) startAdventureBgm();
    } else {
      stopAdventureBgm();
      stopGuruVoice();
    }
    return () => {
      stopAdventureBgm();
      stopGuruVoice();
    };
  }, [isOpen, bgmEnabled, stopGuruVoice]);

  // Sapa Teman Sekelas
  const handleGreetClassmate = useCallback(
    (student: OnlineStudent) => {
      playCoinSound();
      playCorrectSound();
      setAdventureScore((s) => s + 5);
      addPoints(5, `Menyapa teman sekelas: ${student.name}`);

      setFriendGreetingBubble({
        name: student.name,
        text: `👋 "Halo kawan! Senang sekali ketemu di jalan! Ayo tuntaskan materi ${guruBriefing.topicName} bareng-bareng!"`,
      });

      setActiveNotification(`👋 Kamu menyapa ${student.name} (${student.costumeName})! (+5 Poin Persahabatan!)`);
      setTimeout(() => {
        setFriendGreetingBubble(null);
        setActiveNotification(null);
      }, 4500);
    },
    [addPoints, guruBriefing.topicName]
  );

  // Jawab Pertanyaan Pos Suku
  const handleAnswerSuku = (suku: PosTematik, optId: string) => {
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
            addPoints(50, "Menyelesaikan seluruh 5 Pos Tematik!");
          }, 1200);
        }
      }
    } else {
      playOofSound();
      setAnswerFeedback({ isCorrect: false, text: chosen.penjelasan });
    }
  };

  // ==========================================================================
  // ENGINE 3D THREE.JS: SCENE, PLAYER, GURU, 5 POS & SISWA ONLINE
  // ==========================================================================
  useEffect(() => {
    if (!isOpen || resolvedGameType !== "adventure" || !mountEl) return;

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

    const sunLight = new THREE.DirectionalLight("#fffbeb", 1.25);
    sunLight.position.set(25, 45, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 380;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);

    // 3. TANAH & JALUR DESA
    const groundGeo = new THREE.PlaneGeometry(160, 420);
    const groundMat = new THREE.MeshLambertMaterial({ color: "#86efac" });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -160);
    ground.receiveShadow = true;
    scene.add(ground);

    const roadGeo = new THREE.PlaneGeometry(11, 420);
    const roadMat = new THREE.MeshLambertMaterial({ color: "#d97706" });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, -160);
    road.receiveShadow = true;
    scene.add(road);

    const stoneLineGeo = new THREE.PlaneGeometry(0.35, 420);
    const stoneLineMat = new THREE.MeshBasicMaterial({ color: "#fef3c7" });
    const leftLine = new THREE.Mesh(stoneLineGeo, stoneLineMat);
    leftLine.rotation.x = -Math.PI / 2;
    leftLine.position.set(-5.3, 0.03, -160);
    scene.add(leftLine);

    const rightLine = new THREE.Mesh(stoneLineGeo, stoneLineMat);
    rightLine.rotation.x = -Math.PI / 2;
    rightLine.position.set(5.3, 0.03, -160);
    scene.add(rightLine);

    // 4. GAPURA SELAMAT DATANG DENGAN TEKS DINAMIS
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, 18);

    const postGeo = new THREE.BoxGeometry(1.6, 6.5, 1.6);
    const postMat = new THREE.MeshLambertMaterial({ color: "#991b1b" });
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-6, 3.25, 0);
    leftPost.castShadow = true;
    gateGroup.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(6, 3.25, 0);
    rightPost.castShadow = true;
    gateGroup.add(rightPost);

    const beamGeo = new THREE.BoxGeometry(15, 1.4, 2);
    const beamMat = new THREE.MeshLambertMaterial({ color: "#b91c1c" });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 6.2, 0);
    beam.castShadow = true;
    gateGroup.add(beam);

    const roofGeo = new THREE.ConeGeometry(8.5, 2.2, 4);
    const roofMat = new THREE.MeshLambertMaterial({ color: "#f59e0b" });
    const gateRoof = new THREE.Mesh(roofGeo, roofMat);
    gateRoof.position.set(0, 7.8, 0);
    gateRoof.rotation.y = Math.PI / 4;
    gateRoof.castShadow = true;
    gateGroup.add(gateRoof);

    // Papan Teks Gapura Dinamis
    const canvasGate = document.createElement("canvas");
    canvasGate.width = 1024;
    canvasGate.height = 256;
    const ctxGate = canvasGate.getContext("2d");
    if (ctxGate) {
      ctxGate.fillStyle = "#fef08a";
      ctxGate.fillRect(0, 0, 1024, 256);
      ctxGate.lineWidth = 14;
      ctxGate.strokeStyle = "#991b1b";
      ctxGate.strokeRect(10, 10, 1004, 236);
      ctxGate.font = "bold 52px sans-serif";
      ctxGate.fillStyle = "#991b1b";
      ctxGate.textAlign = "center";
      ctxGate.textBaseline = "middle";
      const gateTitleText = guruBriefing.topicName.length > 28 ? guruBriefing.topicName.slice(0, 26) + "..." : guruBriefing.topicName;
      ctxGate.fillText(`🇮🇩 DESA EDUKASI: ${gateTitleText.toUpperCase()} 🇮🇩`, 512, 128);
    }
    const gateTex = new THREE.CanvasTexture(canvasGate);
    const gateSignMat = new THREE.MeshBasicMaterial({ map: gateTex });
    const gateSignGeo = new THREE.PlaneGeometry(12, 1.3);
    const gateSignFront = new THREE.Mesh(gateSignGeo, gateSignMat);
    gateSignFront.position.set(0, 6.2, 1.05);
    gateGroup.add(gateSignFront);
    scene.add(gateGroup);

    // 5. PAK GURU VIRTUAL DI SAMPING GAPURA
    const guruGroup = new THREE.Group();
    guruGroup.position.set(7.5, 0, 14);

    const guruPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.7, 0.35, 24),
      new THREE.MeshLambertMaterial({ color: "#38bdf8" })
    );
    guruPedestal.position.set(0, 0.17, 0);
    guruGroup.add(guruPedestal);

    const guruBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 1.6, 16),
      new THREE.MeshLambertMaterial({ color: "#1e3a8a" })
    );
    guruBody.position.set(0, 1.4, 0);
    guruBody.castShadow = true;
    guruGroup.add(guruBody);

    const guruTie = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.7, 0.06),
      new THREE.MeshLambertMaterial({ color: "#dc2626" })
    );
    guruTie.position.set(0, 1.45, 0.58);
    guruGroup.add(guruTie);

    const guruHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 16, 16),
      new THREE.MeshLambertMaterial({ color: "#fed7aa" })
    );
    guruHead.position.set(0, 2.5, 0);
    guruHead.castShadow = true;
    guruGroup.add(guruHead);

    const guruPeci = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.5, 0.38, 16),
      new THREE.MeshLambertMaterial({ color: "#0f172a" })
    );
    guruPeci.position.set(0, 2.9, 0);
    guruGroup.add(guruPeci);

    const guruBook = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.65, 0.16),
      new THREE.MeshLambertMaterial({ color: "#fbbf24" })
    );
    guruBook.position.set(0.65, 1.4, 0.3);
    guruBook.rotation.z = -0.3;
    guruGroup.add(guruBook);

    const guruCanvas = document.createElement("canvas");
    guruCanvas.width = 512;
    guruCanvas.height = 128;
    const gctx = guruCanvas.getContext("2d");
    if (gctx) {
      gctx.fillStyle = "#ffffff";
      gctx.roundRect ? gctx.roundRect(0, 0, 512, 128, 20) : gctx.fillRect(0, 0, 512, 128);
      gctx.fill();
      gctx.strokeStyle = "#0284c7";
      gctx.lineWidth = 8;
      gctx.stroke();
      gctx.fillStyle = "#0369a1";
      gctx.font = "bold 38px sans-serif";
      gctx.textAlign = "center";
      gctx.textBaseline = "middle";
      gctx.fillText("👨‍🏫 Pak Guru Virtual (Suara)", 256, 64);
    }
    const guruTex = new THREE.CanvasTexture(guruCanvas);
    const guruLabelMat = new THREE.MeshBasicMaterial({ map: guruTex, transparent: true });
    const guruLabelMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.9), guruLabelMat);
    guruLabelMesh.position.set(0, 3.5, 0);
    guruGroup.add(guruLabelMesh);
    scene.add(guruGroup);

    // 6. PAPAN SKOR / LEADERBOARD AWAL DI SAMPING KIRI GAPURA
    const boardGroup = new THREE.Group();
    boardGroup.position.set(-8.5, 0, 14);

    const bPost1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), new THREE.MeshLambertMaterial({ color: "#78350f" }));
    bPost1.position.set(-1.8, 2, 0);
    boardGroup.add(bPost1);

    const bPost2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), new THREE.MeshLambertMaterial({ color: "#78350f" }));
    bPost2.position.set(1.8, 2, 0);
    boardGroup.add(bPost2);

    const boardCanvas = document.createElement("canvas");
    boardCanvas.width = 512;
    boardCanvas.height = 512;
    const bctx = boardCanvas.getContext("2d");
    if (bctx) {
      bctx.fillStyle = "#0f172a";
      bctx.fillRect(0, 0, 512, 512);
      bctx.strokeStyle = "#eab308";
      bctx.lineWidth = 12;
      bctx.strokeRect(10, 10, 492, 492);

      bctx.fillStyle = "#facc15";
      bctx.font = "bold 32px sans-serif";
      bctx.textAlign = "center";
      bctx.fillText("🏆 SKOR KELAS ONLINE 🏆", 256, 50);

      bctx.font = "bold 24px sans-serif";
      bctx.textAlign = "left";
      bctx.fillStyle = "#f8fafc";
      bctx.fillText("1. Siti Rahma (Pramuka) - 145 Poin", 30, 120);
      bctx.fillText("2. Budi Santoso (Batik)  - 130 Poin", 30, 175);
      bctx.fillStyle = "#38bdf8";
      bctx.fillText("3. Kamu (Pelajar)       - Ayo Main!", 30, 230);
      bctx.fillStyle = "#f8fafc";
      bctx.fillText("4. Edo Pratama (Biru)   - 95 Poin", 30, 285);
      bctx.fillText("5. Dayu Kemala (Ungu)   - 80 Poin", 30, 340);

      bctx.fillStyle = "#a855f7";
      bctx.font = "italic 20px sans-serif";
      bctx.textAlign = "center";
      bctx.fillText("👉 Dekati Pak Guru untuk Arahan!", 256, 430);
    }
    const boardTex = new THREE.CanvasTexture(boardCanvas);
    const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), new THREE.MeshBasicMaterial({ map: boardTex }));
    boardMesh.position.set(0, 2.6, 0.16);
    boardGroup.add(boardMesh);
    scene.add(boardGroup);

    // 7. KARAKTER PEMAIN (PELAJAR MERAH PUTIH)
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 24);

    const playerShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.7, 16),
      new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.35 })
    );
    playerShadow.rotation.x = -Math.PI / 2;
    playerShadow.position.y = 0.02;
    playerGroup.add(playerShadow);

    const bodyMat = new THREE.MeshLambertMaterial({ color: "#ffffff" }); // Baju Putih
    const playerTorso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.4), bodyMat);
    playerTorso.position.y = 1.0;
    playerTorso.castShadow = true;
    playerGroup.add(playerTorso);

    const pantsMat = new THREE.MeshLambertMaterial({ color: "#dc2626" }); // Celana Merah
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.2, 0.6, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.6, 0.24), pantsMat);
    leftLegMesh.position.y = -0.3;
    leftLegMesh.castShadow = true;
    leftLegGroup.add(leftLegMesh);
    playerGroup.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.2, 0.6, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.6, 0.24), pantsMat);
    rightLegMesh.position.y = -0.3;
    rightLegMesh.castShadow = true;
    rightLegGroup.add(rightLegGroup);
    playerGroup.add(rightLegGroup);

    const armMat = new THREE.MeshLambertMaterial({ color: "#ffffff" });
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.48, 1.3, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), armMat);
    leftArmMesh.position.y = -0.3;
    leftArmMesh.castShadow = true;
    leftArmGroup.add(leftArmMesh);
    playerGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.48, 1.3, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), armMat);
    rightArmMesh.position.y = -0.3;
    rightArmMesh.castShadow = true;
    rightArmGroup.add(rightArmMesh);
    playerGroup.add(rightArmGroup);

    const playerHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshLambertMaterial({ color: "#fed7aa" })
    );
    playerHead.position.y = 1.65;
    playerHead.castShadow = true;
    playerGroup.add(playerHead);

    const capMat = new THREE.MeshLambertMaterial({ color: "#dc2626" });
    const playerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.2, 16), capMat);
    playerCap.position.y = 1.95;
    playerGroup.add(playerCap);

    const playerVisor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.25), capMat);
    playerVisor.position.set(0, 1.88, 0.3);
    playerGroup.add(playerVisor);

    const backpack = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.6, 0.25),
      new THREE.MeshLambertMaterial({ color: "#2563eb" })
    );
    backpack.position.set(0, 1.0, -0.3);
    playerGroup.add(backpack);

    scene.add(playerGroup);

    // 8. 5 RUMAH ADAT / BALAI POS TEMATIK DINAMIS
    const hotspotList: HotspotItem[] = [];

    sukuList.forEach((suku) => {
      const hGroup = new THREE.Group();

      const houseWall = new THREE.Mesh(
        new THREE.BoxGeometry(7.5, 5, 7.5),
        new THREE.MeshLambertMaterial({ color: suku.warnaKhas })
      );
      houseWall.position.set(suku.xPos, 2.5, suku.zPos);
      houseWall.castShadow = true;
      houseWall.receiveShadow = true;
      hGroup.add(houseWall);

      const roofCone = new THREE.Mesh(
        new THREE.ConeGeometry(6.2, 3.8, 4),
        new THREE.MeshLambertMaterial({ color: "#78350f" })
      );
      roofCone.position.set(suku.xPos, 6.9, suku.zPos);
      roofCone.rotation.y = Math.PI / 4;
      roofCone.castShadow = true;
      hGroup.add(roofCone);

      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.6, 0.2),
        new THREE.MeshLambertMaterial({ color: "#1c1917" })
      );
      const doorZ = suku.zPos + (suku.xPos > 0 ? -3.8 : 3.8);
      door.position.set(suku.xPos, 1.3, doorZ);
      hGroup.add(door);

      // Papan Nama di Depan Rumah (Dekat Jalan)
      const signGroup = new THREE.Group();
      const signX = suku.xPos > 0 ? suku.xPos - 4.5 : suku.xPos + 4.5;
      const signZ = suku.zPos;
      signGroup.position.set(signX, 0, signZ);

      const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.18), new THREE.MeshLambertMaterial({ color: "#5c2c16" }));
      post1.position.set(-1.2, 1.2, 0);
      signGroup.add(post1);

      const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.18), new THREE.MeshLambertMaterial({ color: "#5c2c16" }));
      post2.position.set(1.2, 1.2, 0);
      signGroup.add(post2);

      const signCanvas = document.createElement("canvas");
      signCanvas.width = 512;
      signCanvas.height = 192;
      const sctx = signCanvas.getContext("2d");
      if (sctx) {
        sctx.fillStyle = "#fef3c7";
        sctx.roundRect ? sctx.roundRect(0, 0, 512, 192, 16) : sctx.fillRect(0, 0, 512, 192);
        sctx.fill();
        sctx.strokeStyle = "#78350f";
        sctx.lineWidth = 10;
        sctx.stroke();

        sctx.fillStyle = "#78350f";
        sctx.font = "bold 32px sans-serif";
        sctx.textAlign = "center";
        sctx.fillText(suku.namaSuku, 256, 60);

        sctx.fillStyle = "#0369a1";
        sctx.font = "bold 26px sans-serif";
        sctx.fillText(`${suku.simbolSila} ${suku.tokohNama}`, 256, 115);

        sctx.fillStyle = "#059669";
        sctx.font = "bold 22px sans-serif";
        sctx.fillText("📍 Injak Titik Misi untuk Soal!", 256, 160);
      }
      const signTex = new THREE.CanvasTexture(signCanvas);
      const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.5), new THREE.MeshBasicMaterial({ map: signTex }));
      signBoard.position.set(0, 1.8, 0.1);
      signGroup.add(signBoard);
      hGroup.add(signGroup);

      // Tokoh NPC 3D Berdiri di Depan Rumah
      const npcX = suku.xPos > 0 ? suku.xPos - 5.5 : suku.xPos + 5.5;
      const npcZ = suku.zPos + 1.2;

      const npcBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.45, 1.3, 16),
        new THREE.MeshLambertMaterial({ color: suku.warnaKhas })
      );
      npcBody.position.set(npcX, 0.9, npcZ);
      npcBody.castShadow = true;
      hGroup.add(npcBody);

      const npcHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 16, 16),
        new THREE.MeshLambertMaterial({ color: "#fed7aa" })
      );
      npcHead.position.set(npcX, 1.85, npcZ);
      npcHead.castShadow = true;
      hGroup.add(npcHead);

      const npcHat = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 0.3, 16),
        new THREE.MeshLambertMaterial({ color: "#eab308" })
      );
      npcHat.position.set(npcX, 2.15, npcZ);
      hGroup.add(npcHat);

      // Titik Misi Bercahaya di Depan Rumah
      const spotX = suku.xPos > 0 ? suku.xPos - 6.5 : suku.xPos + 6.5;
      const spotZ = suku.zPos;

      const missionCircle = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 1.7, 32),
        new THREE.MeshBasicMaterial({ color: "#38bdf8", side: THREE.DoubleSide })
      );
      missionCircle.rotation.x = -Math.PI / 2;
      missionCircle.position.set(spotX, 0.05, spotZ);
      hGroup.add(missionCircle);

      const missionBeacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 3.5, 16),
        new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.35 })
      );
      missionBeacon.position.set(spotX, 1.75, spotZ);
      hGroup.add(missionBeacon);

      scene.add(hGroup);

      hotspotList.push({
        id: suku.id,
        x: spotX,
        z: spotZ,
        radius: 3.2,
        label: suku.namaSuku,
        sukuData: suku,
      });
    });

    // Hotspot Pak Guru
    hotspotList.push({
      id: "guru",
      x: 7.5,
      z: 14,
      radius: 4.2,
      label: "Pak Guru Virtual",
      isGuru: true,
    });

    // 9. SISWA ONLINE BERKELILING DI JALUR DESA
    const studentMeshMap = new Map<string, THREE.Group>();
    const studentArmMap = new Map<string, THREE.Group>();
    const studentLegMap = new Map<string, THREE.Group>();

    onlineStudents.forEach((st) => {
      const sGroup = new THREE.Group();
      sGroup.position.set(st.x, 0, st.z);

      const sBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.75, 0.38),
        new THREE.MeshLambertMaterial({ color: st.shirtColor })
      );
      sBody.position.y = 0.95;
      sBody.castShadow = true;
      sGroup.add(sBody);

      const sLegLGroup = new THREE.Group();
      sLegLGroup.position.set(-0.18, 0.58, 0);
      const sLegL = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.55, 0.22),
        new THREE.MeshLambertMaterial({ color: st.pantsColor })
      );
      sLegL.position.y = -0.27;
      sLegL.castShadow = true;
      sLegLGroup.add(sLegL);
      sGroup.add(sLegLGroup);

      const sLegRGroup = new THREE.Group();
      sLegRGroup.position.set(0.18, 0.58, 0);
      const sLegR = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.55, 0.22),
        new THREE.MeshLambertMaterial({ color: st.pantsColor })
      );
      sLegR.position.y = -0.27;
      sLegR.castShadow = true;
      sLegRGroup.add(sLegR);
      sGroup.add(sLegRGroup);

      const sArmRGroup = new THREE.Group();
      sArmRGroup.position.set(0.45, 1.25, 0);
      const sArmR = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.55, 0.18),
        new THREE.MeshLambertMaterial({ color: st.shirtColor })
      );
      sArmR.position.y = -0.27;
      sArmR.castShadow = true;
      sArmRGroup.add(sArmR);
      sGroup.add(sArmRGroup);

      const sHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 16, 16),
        new THREE.MeshLambertMaterial({ color: "#fed7aa" })
      );
      sHead.position.y = 1.6;
      sHead.castShadow = true;
      sGroup.add(sHead);

      // Name Tag di Atas Kepala Siswa
      const stCanvas = document.createElement("canvas");
      stCanvas.width = 384;
      stCanvas.height = 96;
      const sctx = stCanvas.getContext("2d");
      if (sctx) {
        sctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        sctx.roundRect ? sctx.roundRect(0, 0, 384, 96, 16) : sctx.fillRect(0, 0, 384, 96);
        sctx.fill();
        sctx.strokeStyle = "#38bdf8";
        sctx.lineWidth = 6;
        sctx.stroke();

        sctx.fillStyle = "#ffffff";
        sctx.font = "bold 28px sans-serif";
        sctx.textAlign = "center";
        sctx.textBaseline = "middle";
        sctx.fillText(`${st.avatar} ${st.name}`, 192, 48);
      }
      const stTex = new THREE.CanvasTexture(stCanvas);
      const stMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.65), new THREE.MeshBasicMaterial({ map: stTex, transparent: true }));
      stMesh.position.set(0, 2.3, 0);
      sGroup.add(stMesh);

      scene.add(sGroup);
      studentMeshMap.set(st.id, sGroup);
      studentArmMap.set(st.id, sArmRGroup);
      studentLegMap.set(st.id, sLegLGroup);
    });

    // 10. KOIN EMAS DI JALAN
    const coinList: RoadCoin[] = [];
    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16);
    const coinMat = new THREE.MeshLambertMaterial({ color: "#fbbf24" });

    for (let i = 0; i < 28; i++) {
      const z = 12 - i * 11;
      const x = (i % 3 - 1) * 2.8;
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.position.set(x, 0.7, z);
      coinMesh.rotation.x = Math.PI / 2;
      coinMesh.castShadow = true;
      scene.add(coinMesh);

      coinList.push({
        id: i,
        x,
        y: 0.7,
        z,
        mesh: coinMesh,
        collected: false,
      });
    }

    // 11. KEYBOARD LISTENERS
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") keysRef.current.forward = true;
      if (k === "s" || k === "arrowdown") keysRef.current.backward = true;
      if (k === "a" || k === "arrowleft") keysRef.current.left = true;
      if (k === "d" || k === "arrowright") keysRef.current.right = true;
      if (k === " " && !keysRef.current.jump) {
        keysRef.current.jump = true;
        playJumpSound();
      }
      if (k === "shift") {
        keysRef.current.dash = true;
        playDashSound();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") keysRef.current.forward = false;
      if (k === "s" || k === "arrowdown") keysRef.current.backward = false;
      if (k === "a" || k === "arrowleft") keysRef.current.left = false;
      if (k === "d" || k === "arrowright") keysRef.current.right = false;
      if (k === " ") keysRef.current.jump = false;
      if (k === "shift") keysRef.current.dash = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // 12. GAME LOOP (ANIMASI & PHYSICS)
    let animId: number;
    let lastTime = performance.now();
    let playerVy = 0;
    let isGrounded = true;
    let walkCycle = 0;

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Gerak Siswa Online (Patroli di Jalan)
      onlineStudents.forEach((st) => {
        st.z += st.speed * st.dir * dt;
        if (st.z < -260) {
          st.z = -260;
          st.dir = 1;
        } else if (st.z > 16) {
          st.z = 16;
          st.dir = -1;
        }

        const mesh = studentMeshMap.get(st.id);
        if (mesh) {
          mesh.position.z = st.z;
          mesh.rotation.y = st.dir > 0 ? 0 : Math.PI;

          // Animasi Kaki Siswa
          const legMesh = studentLegMap.get(st.id);
          if (legMesh) {
            legMesh.rotation.x = Math.sin(now * 0.006 * st.speed) * 0.5;
          }
        }
      });

      // Gerak Pemain
      const moveSpeed = keysRef.current.dash ? 11.5 : 7.2;
      let dx = 0;
      let dz = 0;

      if (keysRef.current.forward) dz -= 1;
      if (keysRef.current.backward) dz += 1;
      if (keysRef.current.left) dx -= 1;
      if (keysRef.current.right) dx += 1;

      const isMoving = dx !== 0 || dz !== 0;

      if (isMoving) {
        setGameStarted(true);
        const len = Math.hypot(dx, dz);
        dx = (dx / len) * moveSpeed * dt;
        dz = (dz / len) * moveSpeed * dt;

        playerGroup.position.x += dx;
        playerGroup.position.z += dz;

        // Batasi di Area Desa
        playerGroup.position.x = Math.max(-18, Math.min(18, playerGroup.position.x));
        playerGroup.position.z = Math.max(-305, Math.min(25, playerGroup.position.z));

        playerGroup.rotation.y = Math.atan2(dx, dz);

        // Animasi Jalan (Kaki & Tangan Mengayun)
        walkCycle += dt * (keysRef.current.dash ? 16 : 10);
        leftLegGroup.rotation.x = Math.sin(walkCycle) * 0.6;
        rightLegGroup.rotation.x = -Math.sin(walkCycle) * 0.6;
        leftArmGroup.rotation.x = -Math.sin(walkCycle) * 0.6;
        rightArmGroup.rotation.x = Math.sin(walkCycle) * 0.6;
      } else {
        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0, 0.2);
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0, 0.2);
        leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, 0, 0.2);
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, 0, 0.2);
      }

      // Gravitasi & Lompat
      if (!isGrounded) {
        playerVy -= 26 * dt;
        playerGroup.position.y += playerVy * dt;
        if (playerGroup.position.y <= 0) {
          playerGroup.position.y = 0;
          playerVy = 0;
          isGrounded = true;
        }
      } else if (keysRef.current.jump) {
        playerVy = 8.5;
        isGrounded = false;
        keysRef.current.jump = false;
      }

      // Kamera Mengikuti Pemain (Smooth Lerp)
      const targetCamX = playerGroup.position.x * 0.65;
      const targetCamY = playerGroup.position.y + 4.8;
      const targetCamZ = playerGroup.position.z + 7.8;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.12);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.12);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.12);
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.6, playerGroup.position.z - 2.5);

      // Putar Koin Emas & Deteksi Pickup
      coinList.forEach((coin) => {
        if (!coin.collected && coin.mesh) {
          coin.mesh.rotation.z += 2.5 * dt;
          const dist = Math.hypot(playerGroup.position.x - coin.x, playerGroup.position.z - coin.z);
          if (dist < 1.3 && Math.abs(playerGroup.position.y - coin.y) < 1.4) {
            coin.collected = true;
            coin.mesh.visible = false;
            playCoinPickupSound();
            setAdventureScore((s) => s + 5);
            setCoinsCollectedCount((c) => c + 1);
            addPoints(5, "Mengambil koin emas di jalan pedesaan");
          }
        }
      });

      // Deteksi Kedekatan Hotspot Suku & Pak Guru
      let foundHotspot: HotspotItem | null = null;
      for (const h of hotspotList) {
        const d = Math.hypot(playerGroup.position.x - h.x, playerGroup.position.z - h.z);
        if (d <= h.radius) {
          foundHotspot = h;
          break;
        }
      }

      // Deteksi Kedekatan Siswa Online untuk Interaksi Sapa
      if (!foundHotspot) {
        for (const st of onlineStudents) {
          const d = Math.hypot(playerGroup.position.x - st.x, playerGroup.position.z - st.z);
          if (d <= 2.8) {
            foundHotspot = {
              id: `st-${st.id}`,
              x: st.x,
              z: st.z,
              radius: 2.8,
              label: `Sapa ${st.name} (${st.costumeName})`,
              studentData: st,
            };
            break;
          }
        }
      }

      setNearHotspot(foundHotspot);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      const { w, h } = getViewportSize();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", handleResize);
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [
    mountEl,
    isOpen,
    resolvedGameType,
    sukuList,
    onlineStudents,
    handleGreetClassmate,
    speakGuruVoice,
    stopGuruVoice,
    addPoints,
    guruBriefing,
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
              {resolvedGameType === "word_guess" ? "🔤" : resolvedGameType === "matching" ? "🧩" : "🇮🇩"}
            </span>
            <div className="min-w-0">
              <h2 id="game-title" className="font-black text-sm sm:text-base text-yellow-300 truncate tracking-wide">
                {resolvedGameType === "word_guess"
                  ? "TEBAK KATA & TOKOH CERIA 🔤"
                  : resolvedGameType === "matching"
                    ? "TEKA-TEKI MENJODOHKAN KARTU 🧩"
                    : "PETUALANGAN 3D JELAJAH DESA 🗺️"}
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                Materi: <b className="text-emerald-400">{resolvedTitle}</b>
                {resolvedGameType === "adventure" && (
                  <> • Teman Online: <b className="text-emerald-400">4 Siswa 🟢</b></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Papan Skor Kelas (Khusus 3D Petualangan) */}
            {resolvedGameType === "adventure" && (
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

            {/* Poin & Koin */}
            <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-2xl border border-yellow-400/50 shadow-inner">
              <span className="text-xs font-black text-yellow-300">
                🪙 {adventureScore} Poin
              </span>
              {resolvedGameType === "adventure" && (
                <span className="text-[10px] bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  ⭐ {coinsCollectedCount} Koin
                </span>
              )}
            </div>

            {/* Progres 5 Pos (Khusus 3D Petualangan) */}
            {resolvedGameType === "adventure" && (
              <div className="hidden md:flex items-center gap-1 bg-slate-800/90 px-3 py-1.5 rounded-2xl border border-emerald-500/40 text-xs font-bold text-emerald-300">
                <span>🏠</span>
                <span>{visitedSukuIds.length}/5 Pos Selesai</span>
              </div>
            )}

            {/* Tombol Suara BGM */}
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
              title="Aktifkan / Bisukan Musik Permainan"
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

        {/* ================================================================ */}
        {/* MODEL GAME 3: TEBAK KATA & TOKOH CERIA */}
        {/* ================================================================ */}
        {resolvedGameType === "word_guess" ? (
          <div className="flex-1 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900/90 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 text-center">
              {/* Header Status & Progress */}
              <div className="flex items-center justify-between border-b border-purple-500/30 pb-4">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40">
                  {activeWordItem.category}
                </span>
                <span className="text-xs font-black text-amber-300">
                  Tokoh {currentWordIndex + 1} dari {wordGuessList.length}
                </span>
                <div className="flex items-center gap-1 text-rose-400 text-xs font-bold">
                  <span>Kesalahan:</span>
                  <span className="bg-rose-500/20 px-2 py-0.5 rounded-full text-rose-300">
                    {wordGuessMistakes}x
                  </span>
                </div>
              </div>

              {/* Clue Box */}
              <div className="bg-purple-900/30 border border-purple-400/30 rounded-2xl p-4 sm:p-5 text-left flex items-start gap-4">
                <span className="text-4xl sm:text-5xl shrink-0 p-2 bg-purple-950/60 rounded-2xl border border-purple-500/40 shadow-inner">
                  {activeWordItem.avatar}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-purple-300 tracking-wider">
                      Petunjuk Ciri-Ciri Tokoh:
                    </span>
                    <button
                      type="button"
                      onClick={() => speakGuruVoice(activeWordItem.clue)}
                      className="text-xs bg-purple-600/60 hover:bg-purple-600 text-white px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm transition"
                      title="Dengarkan Petunjuk Pak Guru"
                    >
                      <span>🔊 Baca Petunjuk</span>
                    </button>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white mt-1.5 leading-relaxed">
                    "{activeWordItem.clue}"
                  </p>
                </div>
              </div>

              {/* Letter Slots */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap py-2">
                {targetLetters.map((char, cIdx) => {
                  const isRevealed = guessedLetters.includes(char);
                  return (
                    <div
                      key={cIdx}
                      className={`w-10 h-12 sm:w-13 sm:h-16 rounded-2xl border-3 flex items-center justify-center font-black text-xl sm:text-2xl transition-all duration-300 shadow-md ${
                        isRevealed
                          ? "bg-gradient-to-t from-emerald-600 to-teal-400 border-emerald-300 text-white scale-105 shadow-emerald-500/40"
                          : "bg-slate-800/80 border-purple-400/40 text-transparent"
                      }`}
                    >
                      {isRevealed ? char : "_"}
                    </div>
                  );
                })}
              </div>

              {/* Toast Sukses Per Kata */}
              {showWordSuccessToast && !wordGuessCompleted && (
                <div className="bg-emerald-500/20 border border-emerald-400/50 rounded-2xl p-3 flex items-center justify-between animate-in fade-in zoom-in-95">
                  <div className="text-left">
                    <p className="text-xs font-black text-emerald-300">
                      🎉 Tepat Sekali! Jawabannya adalah {activeWordItem.targetWord}!
                    </p>
                    <p className="text-[11px] text-slate-300 mt-0.5 font-medium">
                      {activeWordItem.explanation}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextWord}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-md hover:scale-105 shrink-0"
                  >
                    Lanjut ➡️
                  </button>
                </div>
              )}

              {/* Victory Screen Seluruh Kata Tuntas */}
              {wordGuessCompleted && (
                <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-2 border-yellow-400 rounded-3xl p-6 text-center space-y-4 animate-in zoom-in">
                  <span className="text-5xl block animate-bounce">🏆</span>
                  <h3 className="text-xl font-black text-yellow-300">
                    Luar Biasa! Semua Tokoh Berhasil Ditebak!
                  </h3>
                  <p className="text-xs text-slate-200">
                    Kamu berhasil menguasai seluruh materi {resolvedTitle} dengan sangat cemerlang!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      onClose();
                    }}
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition"
                  >
                    Kembali ke Dashboard Siswa 👍
                  </button>
                </div>
              )}

              {/* Virtual Keyboard A-Z */}
              {!wordGuessCompleted && !showWordSuccessToast && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-400 mb-3">
                    Pilih huruf untuk menebak nama tokoh:
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                    {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => {
                      const isUsed = guessedLetters.includes(letter);
                      const isCorrect = isUsed && targetLetters.includes(letter);
                      return (
                        <button
                          key={letter}
                          type="button"
                          disabled={isUsed}
                          onClick={() => handleGuessLetter(letter)}
                          className={`w-8 h-9 sm:w-10 sm:h-11 rounded-xl font-black text-xs sm:text-sm transition-all duration-150 ${
                            isCorrect
                              ? "bg-emerald-600 text-white opacity-80 cursor-default"
                              : isUsed
                                ? "bg-slate-800 text-slate-500 opacity-40 cursor-not-allowed"
                                : "bg-purple-600/80 hover:bg-purple-500 text-white hover:scale-105 active:scale-95 shadow-xs cursor-pointer border border-purple-400/30"
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : resolvedGameType === "matching" ? (
          /* ================================================================ */
          /* MODEL GAME 2: TEKA-TEKI MENJODOHKAN KARTU (MEMORY MATCH) */
          /* ================================================================ */
          <div className="flex-1 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-4xl space-y-4">
              <div className="bg-slate-900/90 border border-yellow-400/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧩</span>
                  <div>
                    <h3 className="font-black text-sm text-yellow-300">
                      Teka-Teki Pasangan: {resolvedTitle}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Klik 2 kartu untuk mencocokkan kata dengan pasangannya yang tepat!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
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
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                  >
                    <span>{isGuruSpeaking ? "🛑 Berhenti" : "👨‍🏫 Panduan Pak Guru"}</span>
                  </button>
                  <span className="text-xs bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 font-bold">
                    Langkah: {matchingMoves}
                  </span>
                </div>
              </div>

              {/* Grid 12 Kartu */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
                {matchingCards.map((card, idx) => {
                  const isSelected = selectedCardIndices.includes(idx);
                  const isMatched = card.isMatched;

                  return (
                    <button
                      key={card.uid}
                      type="button"
                      disabled={isMatched}
                      onClick={() => handleMatchCardClick(idx)}
                      className={`h-28 sm:h-32 rounded-2xl p-3 flex flex-col items-center justify-center text-center font-black transition-all duration-300 cursor-pointer border-3 relative shadow-md ${
                        isMatched
                          ? "bg-emerald-600/30 border-emerald-500 text-emerald-300 opacity-60 scale-95"
                          : isSelected
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 border-white text-slate-950 scale-105 shadow-yellow-500/40 ring-4 ring-yellow-300"
                            : "bg-slate-800 hover:bg-slate-700/80 border-slate-600 text-white hover:border-yellow-400 hover:scale-102"
                      }`}
                    >
                      <span className="text-[10px] text-yellow-300/80 uppercase font-black tracking-wider block mb-1">
                        {card.category}
                      </span>
                      <span className="text-xs sm:text-sm leading-snug break-words">
                        {card.text}
                      </span>
                      {isMatched && (
                        <span className="absolute top-1.5 right-1.5 text-xs">✅</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selamat Tuntas Menjodohkan */}
              {matchingDone && (
                <div className="bg-emerald-950/80 border-2 border-emerald-400 rounded-2xl p-5 text-center text-white space-y-2 animate-in zoom-in">
                  <h4 className="font-black text-lg text-emerald-300">
                    🎉 Luar Biasa! Semua Pasangan Kartu Cocok!
                  </h4>
                  <p className="text-xs text-slate-300">
                    Kamu berhasil menyelesaikan permainan dalam {matchingMoves} langkah dan meraih +30 Poin Prestasi!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      onClose();
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs shadow-md transition"
                  >
                    Kembali ke Dashboard Siswa 👍
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* MODEL GAME 1: PETUALANGAN 3D DESA (CANVAS THREE.JS) */
          /* ================================================================ */
          <div className="relative flex-1 w-full h-full overflow-hidden">
            {/* Viewport Three.js */}
            <div ref={setMountEl} className="absolute inset-0 w-full h-full" />

            {/* PETUNJUK LAYAR AWAL: SURUH KE PAK GURU */}
            {!hasTalkedToGuru && (
              <aside
                aria-label="Petunjuk Awal"
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 px-4 py-2.5 rounded-full shadow-2xl border-2 border-white flex items-center gap-2.5 animate-bounce font-black text-xs sm:text-sm"
              >
                <span className="text-lg">👉</span>
                <span>Temui Pak Guru Virtual di sebelah kanan gapura terlebih dahulu!</span>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowGuruDialog(true);
                    setHasTalkedToGuru(true);
                    setGuruTab("apa_itu");
                    speakGuruVoice(guruBriefing.apaItuText);
                  }}
                  className="bg-slate-950 text-yellow-300 px-3 py-1 rounded-full text-xs font-black hover:bg-slate-800 transition ml-1 cursor-pointer"
                >
                  Bicara 💬
                </button>
              </aside>
            )}

            {/* Sapaan Balasan Teman Sekelas */}
            {friendGreetingBubble && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 text-white border-2 border-emerald-400 px-5 py-3 rounded-2xl shadow-2xl max-w-md text-center animate-in fade-in zoom-in-95">
                <p className="text-xs font-black text-emerald-400">
                  {friendGreetingBubble.name} Membalas:
                </p>
                <p className="text-xs font-semibold text-slate-200 mt-1">
                  {friendGreetingBubble.text}
                </p>
              </div>
            )}

            {/* Notifikasi Pop-up */}
            {activeNotification && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 bg-emerald-600 text-white font-black text-xs px-5 py-2.5 rounded-full shadow-2xl border-2 border-white animate-in zoom-in">
                {activeNotification}
              </div>
            )}

            {/* Tombol Interaksi Hotspot Dinamis */}
            {nearHotspot && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (nearHotspot.isGuru) {
                      setShowGuruDialog(true);
                      setHasTalkedToGuru(true);
                      setGuruTab("apa_itu");
                      speakGuruVoice(guruBriefing.apaItuText);
                    } else if (nearHotspot.sukuData) {
                      setActiveSukuDialog(nearHotspot.sukuData);
                      setSelectedAnswer(null);
                      setAnswerFeedback(null);
                    } else if (nearHotspot.studentData) {
                      handleGreetClassmate(nearHotspot.studentData);
                    }
                  }}
                  className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-slate-950 font-black px-6 py-3 rounded-full text-sm shadow-2xl border-3 border-white hover:scale-105 active:scale-95 transition flex items-center gap-2 cursor-pointer animate-pulse"
                >
                  <span className="text-base">
                    {nearHotspot.isGuru ? "👨‍🏫" : nearHotspot.studentData ? "👋" : "🎯"}
                  </span>
                  <span>{nearHotspot.label}</span>
                  <span className="bg-slate-950 text-yellow-300 text-[10px] px-2 py-0.5 rounded-full font-black">
                    Tekan Tombol Ini
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* DIALOG PAK GURU VIRTUAL */}
        {showGuruDialog && (
          <aside
            aria-label="Dialog Pak Guru Virtual"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-slate-900 border-2 border-yellow-400/80 rounded-3xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl p-2 bg-blue-600/30 rounded-2xl border border-blue-400/40">
                    👨‍🏫
                  </span>
                  <div>
                    <h3 className="font-black text-base text-yellow-300">
                      Pak Guru Virtual (Penjelasan Suara Nyata)
                    </h3>
                    <p className="text-xs text-slate-300">
                      Materi: <b className="text-emerald-400">{guruBriefing.topicName}</b>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    stopGuruVoice();
                    setShowGuruDialog(false);
                  }}
                  className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Tab Navigasi Penjelasan Pak Guru */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setGuruTab("apa_itu");
                    speakGuruVoice(guruBriefing.apaItuText);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    guruTab === "apa_itu"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Apa Itu?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setGuruTab("makna_sila");
                    speakGuruVoice(guruBriefing.intisariText.replace(/\\n/g, ". "));
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    guruTab === "makna_sila"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {guruBriefing.tabTitleIntisari}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setGuruTab("cara_main");
                    speakGuruVoice(guruBriefing.caraMainText);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    guruTab === "cara_main"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Cara Main 🗺️
                </button>
              </div>

              {/* Isi Teks Sesuai Tab */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-xs sm:text-sm font-semibold leading-relaxed min-h-[110px] flex items-center">
                {guruTab === "apa_itu" && <p>{guruBriefing.apaItuText}</p>}
                {guruTab === "makna_sila" && (
                  <p className="whitespace-pre-line">{guruBriefing.intisariText}</p>
                )}
                {guruTab === "cara_main" && <p>{guruBriefing.caraMainText}</p>}
              </div>

              {/* Status Suara & Tombol Aksi */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (isGuruSpeaking) {
                      stopGuruVoice();
                    } else {
                      const text =
                        guruTab === "apa_itu"
                          ? guruBriefing.apaItuText
                          : guruTab === "makna_sila"
                            ? guruBriefing.intisariText.replace(/\\n/g, ". ")
                            : guruBriefing.caraMainText;
                      speakGuruVoice(text);
                    }
                  }}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>{isGuruSpeaking ? "🛑 Berhenti Bicara" : "🔊 Putar Ulang Suara"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    stopGuruVoice();
                    setShowGuruDialog(false);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-black transition cursor-pointer"
                >
                  Mulai Jelajah Desa 🚀
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* DIALOG KUIS TANTANGAN POS TEMATIK */}
        {activeSukuDialog && (
          <aside
            aria-label="Dialog Soal Pos Tematik"
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-slate-900 border-2 border-sky-400 rounded-3xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 bg-sky-500/20 rounded-2xl border border-sky-400/40">
                    {activeSukuDialog.tokohAvatar}
                  </span>
                  <div>
                    <h3 className="font-black text-sm text-sky-300">
                      {activeSukuDialog.namaSuku}
                    </h3>
                    <p className="text-xs text-slate-300 font-bold">
                      {activeSukuDialog.tokohNama} • {activeSukuDialog.rumahAdat}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setActiveSukuDialog(null);
                  }}
                  className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <p className="text-xs font-bold text-yellow-300 mb-1">
                  {activeSukuDialog.simbolSila} Misi Tantangan Pos:
                </p>
                <p className="text-sm font-black text-white leading-relaxed">
                  {activeSukuDialog.pertanyaan}
                </p>
              </div>

              {/* Opsi Jawaban (Acak, tidak melulu A) */}
              <div className="space-y-2.5">
                {activeSukuDialog.opsi.map((opt) => {
                  const isChosen = selectedAnswer === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={selectedAnswer !== null}
                      onClick={() => handleAnswerSuku(activeSukuDialog, opt.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border-2 transition font-bold text-xs flex items-center gap-3 cursor-pointer ${
                        isChosen
                          ? opt.benar
                            ? "bg-emerald-600/30 border-emerald-400 text-emerald-200"
                            : "bg-rose-600/30 border-rose-400 text-rose-200"
                          : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:border-sky-400"
                      }`}
                    >
                      <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-600 flex items-center justify-center font-black text-xs shrink-0">
                        {opt.id}
                      </span>
                      <span className="flex-1">{opt.teks}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Jawaban */}
              {answerFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold border leading-relaxed ${
                    answerFeedback.isCorrect
                      ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                      : "bg-rose-950/80 border-rose-500 text-rose-300"
                  }`}
                >
                  <p className="font-black text-sm mb-0.5">
                    {answerFeedback.isCorrect ? "✅ Hebat, Jawabanmu Tepat!" : "❌ Belum Tepat, Coba Pahami Lagi:"}
                  </p>
                  <p>{answerFeedback.text}</p>
                </div>
              )}

              {/* Footer Aksi */}
              {answerFeedback && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setActiveSukuDialog(null);
                    }}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
                  >
                    Lanjut Menjelajah ➡️
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* MODAL LEADERBOARD KELAS ONLINE */}
        {showLeaderboard && (
          <aside
            aria-label="Papan Skor Kelas"
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-slate-900 border-2 border-yellow-400/80 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <h3 className="font-black text-base text-yellow-300">
                    Papan Skor Kelas Online
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowLeaderboard(false);
                  }}
                  className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {classLeaderboard.map((student, idx) => (
                  <div
                    key={student.name}
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      student.isPlayer
                        ? "bg-blue-600/30 border-blue-400 ring-2 ring-blue-400/40"
                        : "bg-slate-800/80 border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 font-black text-sm text-yellow-400">
                        #{idx + 1}
                      </span>
                      <span className="text-xl">{student.avatar}</span>
                      <div>
                        <p className="font-black text-xs text-white">
                          {student.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          Kostum: {student.costume} • {student.status}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-xs text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-400/40">
                      🪙 {student.points} Poin
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowLeaderboard(false);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2 rounded-xl text-xs transition shadow-md cursor-pointer"
                >
                  Tutup ✕
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </ModalPortal>
  );
}
