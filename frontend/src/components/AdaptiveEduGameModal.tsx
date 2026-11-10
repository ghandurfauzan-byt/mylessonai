// frontend/src/components/AdaptiveEduGameModal.tsx
// Game Edukasi 3D Petualangan: "Jelajah Suku Nusantara & Desa Pancasila Online"
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

// Helper Canvas Text Auto-Scale: Mencegah Teks Terpotong di Plang & Gapura
function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxFontSize: number,
  options?: {
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    shadowColor?: string;
    shadowBlur?: number;
  }
): number {
  const fontFamily = options?.fontFamily || "sans-serif";
  const fontWeight = options?.fontWeight || "bold";
  const color = options?.color || "#ffffff";
  const align = options?.align || "center";
  const baseline = options?.baseline || "middle";

  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (options?.shadowColor) {
    ctx.shadowColor = options.shadowColor;
    ctx.shadowBlur = options.shadowBlur || 4;
  } else {
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = color;

  let fontSize = maxFontSize;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  let textWidth = ctx.measureText(text).width;

  while (textWidth > maxWidth && fontSize > 11) {
    fontSize -= 1;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    textWidth = ctx.measureText(text).width;
  }

  ctx.fillText(text, x, y);
  ctx.restore();
  return fontSize;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chapter: string;
  chapterTitle?: string;
  studentName?: string;
}

// Model Suku Adat & Pos Pembelajaran Desa
interface SukuAdat {
  id: string;
  namaPos: string;
  namaSuku: string;
  rumahAdat: string;
  tokohNama: string;
  tokohAvatar: string;
  guruNama: string;
  subMateri: string;
  penjelasanGuru: string;
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
  studentName = "Ghandur Fauzan (Siswa)",
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

  // Skor Kawan Sekelas Online Dinamis (Multiplayer)
  const [peerScores, setPeerScores] = useState<{ [id: string]: number }>({
    siti: 145,
    budi: 130,
    edo: 95,
    dayu: 80,
  });

  // Chat Kelas Online Interaktif & Riwayat Percakapan
  interface ChatMessage {
    id: string;
    sender: string;
    avatar: string;
    text: string;
    time: string;
    isPlayer?: boolean;
  }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", sender: "Siti Rahma", avatar: "👧", text: "Halo semua! Semangat belajar Pancasila bareng Pak Guru! 👋", time: "Baru saja" },
    { id: "2", sender: "Budi Santoso", avatar: "👦", text: "Keren banget ada 5 rumah suku adat dan koin emas di sepanjang jalan! 🪙", time: "Baru saja" },
    { id: "3", sender: "Edo Pratama", avatar: "🧒", text: "Ayo balapan kumpulkan koin dan selesaikan seluruh kuisnya! 🏃", time: "Baru saja" },
  ]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [customChatInput, setCustomChatInput] = useState("");

  // Ref Animasi Dadah & Interaksi Teman Online
  
  // Tipe & State Emot Gerakan Tubuh (Emot Gerakan Tubuh)
  type MovementEmote = "none" | "wave" | "dance" | "cheer" | "bow" | "sit" | "flip";
  const [activeEmote, setActiveEmote] = useState<MovementEmote>("none");
  const activeEmoteRef = useRef<MovementEmote>("none");
  const emoteStartTimeRef = useRef(0);
  const [showEmoteMenu, setShowEmoteMenu] = useState(false);
  const emoteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPlayerWavingRef = useRef(false);
  const greetedStudentIdRef = useRef<string | null>(null);
  const waveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref Update Papan Skor 3D Real-Time di Dekat Gapura
  const lbUpdateRef = useRef<((data: any[]) => void) | null>(null);


  // Status Panduan Pak Guru
  const [hasTalkedToGuru, setHasTalkedToGuru] = useState(false);
  const [showGuruDialog, setShowGuruDialog] = useState(false);
  const [guruTab, setGuruTab] = useState<"apa_itu" | "makna_sila" | "cara_main">("apa_itu");
  const [isGuruSpeaking, setIsGuruSpeaking] = useState(false);

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
  // DATA 5 POS MATERI EDUKASI (DINAMIS MENYESUAIKAN MATERI DASHBOARD SISWA)
  // TIAP POS MEMILIKI PENUNGGU PAK GURU, NAMA POS, DAN SUB-MATERI TERTENTU
  // --------------------------------------------------------------------------
  const sukuList: SukuAdat[] = useMemo(() => {
    const rawTitle = (activeValidatedModule?.title || chapterTitle || chapter || "").toLowerCase();
    const rawChapter = (chapter || activeValidatedModule?.id || "").toLowerCase();

    // 1. MATERI BAB 2: GOTONG ROYONG
    if (rawChapter.includes("gotong") || rawTitle.includes("gotong")) {
      return [
        {
          id: "gotong_pos1",
          namaPos: "Pos 1: Nilai Luhur Gotong Royong",
          namaSuku: "Suku Jawa (Rumah Joglo)",
          rumahAdat: "Rumah Adat Joglo",
          tokohNama: "Kakek Raden (Tetua Adat)",
          tokohAvatar: "👴",
          guruNama: "Pak Guru Subroto",
          subMateri: "Arti & Nilai Kebersamaan",
          penjelasanGuru: "Gotong royong adalah tradisi mulia asli bangsa Indonesia di mana semua warga saling bahu-membahu tanpa memandang perbedaan.",
          silaKe: 1,
          simbolSila: "🤝",
          zPos: -45,
          xPos: 14,
          warnaKhas: "#38bdf8",
          pertanyaan: "Gotong royong merupakan warisan budaya asli bangsa Indonesia. Nilai utama dari gotong royong adalah:",
          opsi: [
            { id: "A", teks: "Bekerja sendiri-sendiri agar cepat selesai tanpa diganggu.", benar: false, penjelasan: "Gotong royong justru mengutamakan kebersamaan dan kerja sama." },
            { id: "B", teks: "Bekerja bersama secara sukarela dan saling membantu demi kepentingan bersama.", benar: true, penjelasan: "Hebat! Gotong royong menumbuhkan persaudaraan dan meringankan beban bersama." },
            { id: "C", teks: "Hanya membantu jika diberi imbalan uang saku yang banyak.", benar: false, penjelasan: "Gotong royong dilakukan dengan tulus ikhlas tanpa pamrih." },
          ],
        },
        {
          id: "gotong_pos2",
          namaPos: "Pos 2: Piket Kebersihan Kelas",
          namaSuku: "Suku Sunda (Rumah Panggung)",
          rumahAdat: "Rumah Panggung Sunda",
          tokohNama: "Kang Asep (Pemuda Desa)",
          tokohAvatar: "🧑",
          guruNama: "Pak Guru Rahman",
          subMateri: "Kerja Sama di Sekolah",
          penjelasanGuru: "Di sekolah, gotong royong terwujud lewat regu piket kelas. Membersihkan papan tulis, menyapu, dan merapikan meja bersama.",
          silaKe: 2,
          simbolSila: "🧹",
          zPos: -105,
          xPos: -14,
          warnaKhas: "#fb923c",
          pertanyaan: "Saat jam pulang sekolah, giliran kelompokmu yang bertugas piket kebersihan kelas. Sikap gotong royong yang tepat:",
          opsi: [
            { id: "A", teks: "Membagi tugas dengan adil (ada yang menyapu, mengepel, membuang sampah) dan bekerja kompak.", benar: true, penjelasan: "Tepat sekali! Pembagian tugas yang adil membuat piket kelas selesai lebih cepat dan bersih." },
            { id: "B", teks: "Langsung lari pulang diam-diam dan menitipkan tugas ke teman lain.", benar: false, penjelasan: "Melarikan diri dari tanggung jawab piket merugikan teman sekelompok." },
            { id: "C", teks: "Hanya berdiri memerintah teman tanpa mau memegang sapu.", benar: false, penjelasan: "Gotong royong menuntut keterlibatan aktif semua anggota." },
          ],
        },
        {
          id: "gotong_pos3",
          namaPos: "Pos 3: Kerja Bakti Lingkungan",
          namaSuku: "Suku Minang (Rumah Gadang)",
          rumahAdat: "Rumah Gadang Gonjong",
          tokohNama: "Uda Buyung (Datuk Muda)",
          tokohAvatar: "🤠",
          guruNama: "Pak Guru Darmawan",
          subMateri: "Membersihkan Lingkungan RT/Desa",
          penjelasanGuru: "Kerja bakti di lingkungan tempat tinggal mempererat silaturahmi tetangga dan mencegah bencana seperti banjir atau sarang nyamuk.",
          silaKe: 3,
          simbolSila: "🏡",
          zPos: -165,
          xPos: 14,
          warnaKhas: "#4ade80",
          pertanyaan: "Di hari Minggu pagi, warga desa mengadakan kerja bakti membersihkan selokan. Peran anak sekolah yang paling tepat:",
          opsi: [
            { id: "A", teks: "Mengunci kamar dan bermain game sepanjang hari.", benar: false, penjelasan: "Kita harus belajar peduli pada lingkungan sekitar tempat tinggal." },
            { id: "B", teks: "Menonton saja sambil menertawakan tetangga yang berkeringat.", benar: false, penjelasan: "Menertawakan orang yang bekerja sangat tidak sopan." },
            { id: "C", teks: "Ikut membantu tugas ringan, seperti mengumpulkan daun kering dan membagikan air minum.", benar: true, penjelasan: "Luar biasa! Kontribusi sekecil apa pun sangat berarti dalam kerja bakti." },
          ],
        },
        {
          id: "gotong_pos4",
          namaPos: "Pos 4: Tolong-Menolong Ikhlas",
          namaSuku: "Suku Dayak (Rumah Betang)",
          rumahAdat: "Rumah Betang Panjang",
          tokohNama: "Kepala Suku Kaian",
          tokohAvatar: "🧓",
          guruNama: "Pak Guru Triyono",
          subMateri: "Membantu Kawan Tertimpa Musibah",
          penjelasanGuru: "Ketika kawan atau saudara kita tertimpa musibah, kita segera mengulurkan tangan membantu donasi atau penghiburan.",
          silaKe: 4,
          simbolSila: "❤️",
          zPos: -225,
          xPos: -14,
          warnaKhas: "#f87171",
          pertanyaan: "Seorang kawan sekelas kehilangan buku paket dan alat tulisnya karena kebanjiran. Wujud solidaritas gotong royong kelas:",
          opsi: [
            { id: "A", teks: "Menyalahkan dia mengapa rumahnya terkena banjir.", benar: false, penjelasan: "Korban musibah butuh dukungan, bukan disalahkan." },
            { id: "B", teks: "Mengumpulkan sumbangan sukarela dan berbagi alat tulis bersamanya.", benar: true, penjelasan: "Budi pekerti luhur! Solidaritas meringankan beban teman yang sedang kesulitan." },
            { id: "C", teks: "Membiarkannya dihukum guru saat pelajaran dimulai.", benar: false, penjelasan: "Sikap acuh tak acuh melanggar nilai kemanusiaan gotong royong." },
          ],
        },
        {
          id: "gotong_pos5",
          namaPos: "Pos 5: Berat Sama Dipikul",
          namaSuku: "Suku Papua (Rumah Honai)",
          rumahAdat: "Rumah Adat Honai",
          tokohNama: "Kaka Pace (Sahabat Alam)",
          tokohAvatar: "🧔",
          guruNama: "Pak Guru Sukardi",
          subMateri: "Manfaat Nyata Kebersamaan",
          penjelasanGuru: "Pepatah 'Berat sama dipikul, ringan sama dijinjing' mengajarkan bahwa hal yang mustahil dikerjakan sendiri akan mudah jika bersatu.",
          silaKe: 5,
          simbolSila: "⚖️",
          zPos: -285,
          xPos: 14,
          warnaKhas: "#facc15",
          pertanyaan: "Arti peribahasa 'Berat sama dipikul, ringan sama dijinjing' dalam gotong royong adalah:",
          opsi: [
            { id: "A", teks: "Tugas berat diserahkan ke orang tua saja, tugas ringan untuk anak-anak.", benar: false, penjelasan: "Peribahasa ini berbicara tentang kebersamaan dalam suka dan duka." },
            { id: "B", teks: "Pekerjaan sulit maupun mudah diselesaikan bersama-sama dengan penuh tanggung jawab.", benar: true, penjelasan: "Tepat sekali! Persatuan membuat pekerjaan berat terasa ringan." },
            { id: "C", teks: "Barang yang berat harus ditinggal, hanya barang ringan yang dibawa.", benar: false, penjelasan: "Arti harfiah keliru. Makna aslinya adalah tentang solidaritas bersama." },
          ],
        },
      ];
    }

    // 2. MATERI BAB 3: NORMA & ATURAN
    if (rawChapter.includes("norma") || rawTitle.includes("norma") || rawTitle.includes("aturan")) {
      return [
        {
          id: "norma_pos1",
          namaPos: "Pos 1: Norma Agama & Ibadah",
          namaSuku: "Suku Jawa (Rumah Joglo)",
          rumahAdat: "Rumah Adat Joglo",
          tokohNama: "Kakek Raden (Tetua Adat)",
          tokohAvatar: "👴",
          guruNama: "Pak Guru Zainuddin",
          subMateri: "Pedoman dari Tuhan YME",
          penjelasanGuru: "Norma agama adalah aturan hidup yang bersumber dari wahyu Tuhan Yang Maha Esa. Mengajarkan kebaikan dan toleransi antarumat beragama.",
          silaKe: 1,
          simbolSila: "⭐",
          zPos: -45,
          xPos: 14,
          warnaKhas: "#38bdf8",
          pertanyaan: "Contoh pengamalan norma agama dalam pergaulan di sekolah setiap hari adalah:",
          opsi: [
            { id: "A", teks: "Mengejek kawan yang sedang berdoa sebelum belajar.", benar: false, penjelasan: "Menghormati doa teman adalah cerminan norma agama." },
            { id: "B", teks: "Rajin beribadah sesuai keyakinan dan menghormati teman yang berbeda cara ibadahnya.", benar: true, penjelasan: "Sangat baik! Norma agama menanamkan ketaatan dan saling menghargai." },
            { id: "C", teks: "Memaksa kawan lain mengikuti keyakinan kita.", benar: false, penjelasan: "Agama tidak boleh dipaksakan kepada orang lain." },
          ],
        },
        {
          id: "norma_pos2",
          namaPos: "Pos 2: Norma Kesusilaan",
          namaSuku: "Suku Sunda (Rumah Panggung)",
          rumahAdat: "Rumah Panggung Sunda",
          tokohNama: "Kang Asep (Pemuda Desa)",
          tokohAvatar: "🧑",
          guruNama: "Pak Guru Arif",
          subMateri: "Suara Hati & Kejujuran",
          penjelasanGuru: "Norma kesusilaan bersumber dari hati nurani manusia. Sanksinya adalah rasa penyesalan, gelisah, atau malu jika berbuat curang.",
          silaKe: 2,
          simbolSila: "💡",
          zPos: -105,
          xPos: -14,
          warnaKhas: "#fb923c",
          pertanyaan: "Saat ulangan harian, kamu melihat ada teman yang membuka catatan sontekan. Sikap kesusilaanmu:",
          opsi: [
            { id: "A", teks: "Tetap percaya diri mengerjakan dengan jujur dan tidak ikut-ikutan mencontek.", benar: true, penjelasan: "Luar biasa! Kejujuran adalah mahkota pelajar sejati berhati bersih." },
            { id: "B", teks: "Ikut meminta jawaban dari contekan tersebut agar nilai tinggi.", benar: false, penjelasan: "Mencontek mencoreng hati nurani dan melanggar kejujuran." },
            { id: "C", teks: "Meminta imbalan agar tidak melaporkan ke pengawas.", benar: false, penjelasan: "Tindakan memeras sangat dilarang dan merusak integritas." },
          ],
        },
        {
          id: "norma_pos3",
          namaPos: "Pos 3: Norma Kesopanan",
          namaSuku: "Suku Minang (Rumah Gadang)",
          rumahAdat: "Rumah Gadang Gonjong",
          tokohNama: "Uda Buyung (Datuk Muda)",
          tokohAvatar: "🤠",
          guruNama: "Pak Guru Bambang",
          subMateri: "Tata Krama & Santun Berbicara",
          penjelasanGuru: "Norma kesopanan lahir dari pergaulan masyarakat. Biasakan 3 kata ajaib: Tolong, Maaf, dan Terima Kasih kepada siapa pun.",
          silaKe: 3,
          simbolSila: "🗣️",
          zPos: -165,
          xPos: 14,
          warnaKhas: "#4ade80",
          pertanyaan: "Ketika berpapasan dengan Bapak atau Ibu Guru di koridor sekolah, sikap sopan santun yang benar adalah:",
          opsi: [
            { id: "A", teks: "Berpura-pura tidak melihat dan langsung membuang muka.", benar: false, penjelasan: "Kurang beradab terhadap pendidik." },
            { id: "B", teks: "Berlari kencang sambil berteriak di depan guru.", benar: false, penjelasan: "Tidak menjaga ketenangan dan tata krama koridor." },
            { id: "C", teks: "Mengucapkan salam ramah, tersenyum, dan mengangguk dengan hormat.", benar: true, penjelasan: "Santun sekali! Menghormati guru mendatangkan keberkahan ilmu." },
          ],
        },
        {
          id: "norma_pos4",
          namaPos: "Pos 4: Tata Tertib Sekolah",
          namaSuku: "Suku Dayak (Rumah Betang)",
          rumahAdat: "Rumah Betang Panjang",
          tokohNama: "Kepala Suku Kaian",
          tokohAvatar: "🧓",
          guruNama: "Pak Guru Wijaya",
          subMateri: "Kedisiplinan di Lingkungan Belajar",
          penjelasanGuru: "Tata tertib sekolah dibuat agar suasana belajar aman, tertib, dan nyaman. Contohnya datang tepat waktu dan berseragam rapi.",
          silaKe: 4,
          simbolSila: "⏰",
          zPos: -225,
          xPos: -14,
          warnaKhas: "#f87171",
          pertanyaan: "Mengapa setiap siswa wajib mematuhi tata tertib dan aturan yang berlaku di sekolah?",
          opsi: [
            { id: "A", teks: "Agar proses belajar mengajar berjalan teratur, aman, dan tercipta kedisiplinan.", benar: true, penjelasan: "Tepat sekali! Disiplin sekolah membentuk pribadi berprestasi." },
            { id: "B", teks: "Hanya untuk menyenangkan hati kepala sekolah semata.", benar: false, penjelasan: "Aturan dibuat demi keselamatan dan kenyamanan seluruh murid." },
            { id: "C", teks: "Supaya guru bisa memberikan hukuman setiap hari.", benar: false, penjelasan: "Tujuan tata tertib adalah pembinaan, bukan mencari kesalahan." },
          ],
        },
        {
          id: "norma_pos5",
          namaPos: "Pos 5: Hak & Kewajiban Seimbang",
          namaSuku: "Suku Papua (Rumah Honai)",
          rumahAdat: "Rumah Adat Honai",
          tokohNama: "Kaka Pace (Sahabat Alam)",
          tokohAvatar: "🧔",
          guruNama: "Pak Guru Nugroho",
          subMateri: "Menunaikan Tugas Sebelum Menuntut Hak",
          penjelasanGuru: "Sebagai pelajar, kita punya hak mendapatkan bimbingan ilmu. Namun kewajiban belajar dan mematuhi tata tertib harus ditunaikan terlebih dahulu.",
          silaKe: 5,
          simbolSila: "⚖️",
          zPos: -285,
          xPos: 14,
          warnaKhas: "#facc15",
          pertanyaan: "Hubungan yang tepat antara Hak dan Kewajiban bagi seorang murid adalah:",
          opsi: [
            { id: "A", teks: "Menuntut hak sebanyak-banyaknya tanpa mau mengerjakan kewajiban belajar.", benar: false, penjelasan: "Sikap menuntut hak tanpa kewajiban tidak bertanggung jawab." },
            { id: "B", teks: "Menjalankan kewajiban dengan ikhlas terlebih dahulu, baru kemudian menuntut hak secara seimbang.", benar: true, penjelasan: "Pintar! Keseimbangan hak dan kewajiban menciptakan keadilan dan kedamaian." },
            { id: "C", teks: "Murid hanya memiliki kewajiban dan tidak memiliki hak sama sekali.", benar: false, penjelasan: "Setiap anak berhak dilindungi dan mendapatkan pengajaran terbaik." },
          ],
        },
      ];
    }

    // 3. MATERI BAB 4: BHINNEKA TUNGGAL IKA
    if (rawChapter.includes("bhinneka") || rawTitle.includes("bhinneka") || rawTitle.includes("keragaman")) {
      return [
        {
          id: "bhinneka_pos1",
          namaPos: "Pos 1: Rumah Adat Sabang-Merauke",
          namaSuku: "Suku Jawa (Rumah Joglo)",
          rumahAdat: "Rumah Adat Joglo",
          tokohNama: "Kakek Raden (Tetua Adat)",
          tokohAvatar: "👴",
          guruNama: "Pak Guru Iskandar",
          subMateri: "Kekayaan Arsitektur Tradisional",
          penjelasanGuru: "Setiap suku memiliki rumah adat yang dirancang menyesuaikan iklim dan kearifan lokal daerahnya, seperti Joglo, Gadang, Tongkonan, dan Honai.",
          silaKe: 1,
          simbolSila: "🏛️",
          zPos: -45,
          xPos: 14,
          warnaKhas: "#38bdf8",
          pertanyaan: "Rumah adat Honai khas Papua memiliki atap berbentuk kubah jerami. Fungsi utamanya adalah:",
          opsi: [
            { id: "A", teks: "Sebagai tempat memelihara burung cendrawasih.", benar: false, penjelasan: "Honai adalah tempat tinggal keluarga." },
            { id: "B", teks: "Menahan hawa dingin pegunungan dan melindungi keluarga dari hujan serta angin malam.", benar: true, penjelasan: "Benar sekali! Desain Honai sangat cerdas beradaptasi dengan iklim lembah pegunungan Papua." },
            { id: "C", teks: "Tempat menyimpan kendaraan bermotor.", benar: false, penjelasan: "Masyarakat pedalaman membangun Honai sebagai tempat tinggal adat." },
          ],
        },
        {
          id: "bhinneka_pos2",
          namaPos: "Pos 2: Busana Adat Nusantara",
          namaSuku: "Suku Sunda (Rumah Panggung)",
          rumahAdat: "Rumah Panggung Sunda",
          tokohNama: "Kang Asep (Pemuda Desa)",
          tokohAvatar: "🧑",
          guruNama: "Pak Guru Teuku Umar",
          subMateri: "Kain Tenun, Batik & Kebaya",
          penjelasanGuru: "Pakaian adat daerah seperti Batik Jawa, Songket Minang, Tenun Ikat NTT, dan Ulos Batak adalah mahakarya seni yang diakui dunia.",
          silaKe: 2,
          simbolSila: "👘",
          zPos: -105,
          xPos: -14,
          warnaKhas: "#fb923c",
          pertanyaan: "Saat upacara peringatan Hari Kartini atau Hari Sumpah Pemuda, kita dianjurkan memakai pakaian adat daerah. Tujuannya adalah:",
          opsi: [
            { id: "A", teks: "Mengenal, melestarikan, dan bangga akan warisan kebudayaan luhur bangsa.", benar: true, penjelasan: "Sangat benar! Memakai pakaian adat menumbuhkan kecintaan terhadap identitas budaya." },
            { id: "B", teks: "Memamerkan kekayaan keluarga kepada teman sekelas.", benar: false, penjelasan: "Bukan ajang pamer, melainkan bentuk edukasi pelestarian budaya." },
            { id: "C", teks: "Mengejek pakaian daerah lain yang bentuknya berbeda.", benar: false, penjelasan: "Semua pakaian adat daerah bernilai seni tinggi dan patut dihormati." },
          ],
        },
        {
          id: "bhinneka_pos3",
          namaPos: "Pos 3: Harmoni Musik & Tarian Daerah",
          namaSuku: "Suku Minang (Rumah Gadang)",
          rumahAdat: "Rumah Gadang Gonjong",
          tokohNama: "Uda Buyung (Datuk Muda)",
          tokohAvatar: "🤠",
          guruNama: "Pak Guru Nyoman",
          subMateri: "Gamelan, Angklung & Tari Tradisional",
          penjelasanGuru: "Dari Sabang sampai Merauke terdapat tarian daerah memukau seperti Tari Saman Aceh, Tari Piring Minang, Tari Jaipong, hingga Tari Pendet Bali.",
          silaKe: 3,
          simbolSila: "🎵",
          zPos: -165,
          xPos: 14,
          warnaKhas: "#4ade80",
          pertanyaan: "Alat musik Angklung asal Jawa Barat telah diakui UNESCO sebagai warisan dunia. Ciri khas memainkannya adalah:",
          opsi: [
            { id: "A", teks: "Ditiup dengan kencang menggunakan bambu kecil.", benar: false, penjelasan: "Angklung dimainkan dengan cara digoyangkan atau digetarkan." },
            { id: "B", teks: "Digoyang dan digetarkan sehingga menghasilkan paduan bunyi merdu berkolaborasi bersama.", benar: true, penjelasan: "Hebat! Angklung melambangkan kebersamaan karena membutuhkan kerja sama banyak orang untuk menciptakan lagu." },
            { id: "C", teks: "Dipukul dengan palu besi yang berat.", benar: false, penjelasan: "Memukul angklung dengan palu besi akan merusak bilah bambu." },
          ],
        },
        {
          id: "bhinneka_pos4",
          namaPos: "Pos 4: Bahasa Daerah Pemersatu",
          namaSuku: "Suku Dayak (Rumah Betang)",
          rumahAdat: "Rumah Betang Panjang",
          tokohNama: "Kepala Suku Kaian",
          tokohAvatar: "🧓",
          guruNama: "Pak Guru Frans",
          subMateri: "Kekayaan Ratusan Bahasa Daerah",
          penjelasanGuru: "Indonesia memiliki lebih dari 700 bahasa daerah. Semua dirangkul dan dipersatukan oleh Bahasa Nasional, yaitu Bahasa Indonesia.",
          silaKe: 4,
          simbolSila: "🗣️",
          zPos: -225,
          xPos: -14,
          warnaKhas: "#f87171",
          pertanyaan: "Peran utama Bahasa Indonesia di tengah keberagaman ratusan bahasa daerah suku nusantara adalah sebagai:",
          opsi: [
            { id: "A", teks: "Bahasa persatuan nasional yang menghubungkan komunikasi antarwarga dari berbagai daerah.", benar: true, penjelasan: "Tepat sekali! Bahasa Indonesia mempersatukan komunikasi seluruh rakyat Indonesia." },
            { id: "B", teks: "Bahasa yang digunakan untuk menghapus semua bahasa daerah.", benar: false, penjelasan: "Bahasa daerah tetap wajib dilestarikan sebagai kekayaan bangsa." },
            { id: "C", teks: "Bahasa rahasia yang hanya boleh dipelajari oleh guru.", benar: false, penjelasan: "Bahasa Indonesia adalah milik seluruh tumpah darah Indonesia." },
          ],
        },
        {
          id: "bhinneka_pos5",
          namaPos: "Pos 5: Semboyan Bhinneka Tunggal Ika",
          namaSuku: "Suku Papua (Rumah Honai)",
          rumahAdat: "Rumah Adat Honai",
          tokohNama: "Kaka Pace (Sahabat Alam)",
          tokohAvatar: "🧔",
          guruNama: "Pak Guru Yohan",
          subMateri: "Berbeda Namun Tetap Satu Jua",
          penjelasanGuru: "Bhinneka Tunggal Ika diambil dari Kitab Sutasoma karya Mpu Tantular. Mengingatkan bahwa perbedaan bukan pemecah, melainkan kekuatan terindah bangsa kita.",
          silaKe: 5,
          simbolSila: "🇮🇩",
          zPos: -285,
          xPos: 14,
          warnaKhas: "#facc15",
          pertanyaan: "Sikap yang paling mencerminkan semboyan Bhinneka Tunggal Ika di lingkungan pergaulan kelas adalah:",
          opsi: [
            { id: "A", teks: "Memilih teman bermain hanya yang berasal dari satu daerah asal yang sama.", benar: false, penjelasan: "Sikap membeda-bedakan bertentangan dengan Bhinneka Tunggal Ika." },
            { id: "B", teks: "Berteman akrab dan saling menghargai dengan semua kawan tanpa memandang latar belakang suku atau agama.", benar: true, penjelasan: "Luar biasa! Inilah cerminan sejati generasi penerus bangsa yang toleran dan beradab." },
            { id: "C", teks: "Mengejek tradisi daerah lain yang belum pernah kita ketahui.", benar: false, penjelasan: "Kita harus belajar menghormati setiap tradisi daerah nusantara." },
          ],
        },
      ];
    }

    // 4. MATERI DEFAULT (BAB 1: MAKNA SILA KE-3 PANCASILA & PENGAMALAN 5 SILA)
    // TERTAMPIL OTOMATIS SESUAI DASHBOARD SISWA SAAT MEMILIH BAB 1 / SILA KE-3
    return [
      {
        id: "sila3_pos1",
        namaPos: "Pos 1: Pohon Beringin Luhur",
        namaSuku: "Suku Jawa (Rumah Joglo)",
        rumahAdat: "Rumah Adat Joglo",
        tokohNama: "Kakek Raden (Tetua Adat)",
        tokohAvatar: "👴",
        guruNama: "Pak Guru Haryanto",
        subMateri: "Makna Lambang Sila Ke-3",
        penjelasanGuru: "Pohon beringin melambangkan naungan dan tempat berteduh. Akar tunggangnya yang kokoh ke dalam tanah mencerminkan persatuan bangsa yang tak tergoyahkan.",
        silaKe: 1,
        simbolSila: "🌳",
        zPos: -45,
        xPos: 14,
        warnaKhas: "#38bdf8",
        pertanyaan: "Lambang pohon beringin pada Sila ke-3 Pancasila 'Persatuan Indonesia' memiliki makna luhur yaitu:",
        opsi: [
          { id: "A", teks: "Menunjukkan bahwa pohon beringin merupakan pohon terbesar di hutan rimba.", benar: false, penjelasan: "Bukan tentang ukuran pohon, melainkan makna simbolis perlindungan dan persatuan." },
          { id: "B", teks: "Sebagai tempat berteduh yang menaungi seluruh rakyat Indonesia dalam persatuan yang kokoh.", benar: true, penjelasan: "Sangat bijak! Pohon beringin melambangkan bangsa besar yang rukun dan terlindungi." },
          { id: "C", teks: "Tanda bahwa semua siswa harus menanam pohon di dalam kelas.", benar: false, penjelasan: "Makna pohon beringin adalah persatuan seluruh rakyat Indonesia." },
        ],
      },
      {
        id: "sila3_pos2",
        namaPos: "Pos 2: Rukun di Lingkungan Sekolah",
        namaSuku: "Suku Sunda (Rumah Panggung)",
        rumahAdat: "Rumah Panggung Sunda",
        tokohNama: "Kang Asep (Pemuda Desa)",
        tokohAvatar: "🧑",
        guruNama: "Pak Guru Joko",
        subMateri: "Menghargai Keberagaman Teman",
        penjelasanGuru: "Pengamalan Sila ke-3 di sekolah diwujudkan dengan tidak membeda-bedakan teman, tidak mengejek (anti-bullying), dan selalu kompak saat belajar bersama.",
        silaKe: 2,
        simbolSila: "🤝",
        zPos: -105,
        xPos: -14,
        warnaKhas: "#fb923c",
        pertanyaan: "Ada murid baru pindahan dari daerah lain yang logat bicaranya berbeda. Sikap persatuan yang benar adalah:",
        opsi: [
          { id: "A", teks: "Mengajaknya berkenalan, bermain bersama, dan membantunya mengenal lingkungan sekolah.", benar: true, penjelasan: "Luar biasa! Sikap ramah dan terbuka merajut persaudaraan di sekolah." },
          { id: "B", teks: "Menirukan logat bicaranya untuk ditertawakan teman sekelas.", benar: false, penjelasan: "Mengejek dialek teman melanggar adab kesopanan dan merusak persatuan." },
          { id: "C", teks: "Menjauhinya dan melarang teman lain mendekatinya.", benar: false, penjelasan: "Mengucilkan teman bertentangan keras dengan nilai Pancasila." },
        ],
      },
      {
        id: "sila3_pos3",
        namaPos: "Pos 3: Cinta Produk Tanah Air",
        namaSuku: "Suku Minang (Rumah Gadang)",
        rumahAdat: "Rumah Gadang Gonjong",
        tokohNama: "Uda Buyung (Datuk Muda)",
        tokohAvatar: "🤠",
        guruNama: "Pak Guru Slamet",
        subMateri: "Bangga Karya Anak Bangsa",
        penjelasanGuru: "Cinta tanah air tercermin dari kebiasaan kita bangga memakai sepatu buatan Indonesia, mengenakan kain batik, dan mencintai makanan khas nusantara.",
        silaKe: 3,
        simbolSila: "🇮🇩",
        zPos: -165,
        xPos: 14,
        warnaKhas: "#4ade80",
        pertanyaan: "Bentuk nyata cinta tanah air yang dapat dilakukan siswa sekolah dasar dalam kehidupan sehari-hari:",
        opsi: [
          { id: "A", teks: "Selalu menuntut dibelikan barang luar negeri yang harganya sangat mahal.", benar: false, penjelasan: "Gaya hidup konsumtif barang impor kurang mendukung produk lokal." },
          { id: "B", teks: "Bangga memakai batik dan mencintai hasil karya produk buatan bangsa sendiri.", benar: true, penjelasan: "Hebat! Mencintai produk dalam negeri memperkuat perekonomian bangsa." },
          { id: "C", teks: "Malu menyanyikan lagu nasional saat upacara bendera hari Senin.", benar: false, penjelasan: "Lagu nasional wajib dinyanyikan dengan khidmat dan rasa bangga." },
        ],
      },
      {
        id: "sila3_pos4",
        namaPos: "Pos 4: Kepentingan Bersama",
        namaSuku: "Suku Dayak (Rumah Betang)",
        rumahAdat: "Rumah Betang Panjang",
        tokohNama: "Kepala Suku Kaian",
        tokohAvatar: "🧓",
        guruNama: "Pak Guru Hendra",
        subMateri: "Rela Berkorban Demi Kelompok",
        penjelasanGuru: "Sila ke-3 mengajarkan kita untuk rela mengorbankan waktu bermain sejenak demi menuntaskan tugas kelompok atau kerja bakti demi kepentingan kelas.",
        silaKe: 4,
        simbolSila: "🛡️",
        zPos: -225,
        xPos: -14,
        warnaKhas: "#f87171",
        pertanyaan: "Ketika kelompok belajarmu sedang menyelesaikan tugas presentasi bersama, tindakan yang mencerminkan persatuan:",
        opsi: [
          { id: "A", teks: "Meninggalkan teman kelompok untuk jajan dan bermain bola sendiri.", benar: false, penjelasan: "Meninggalkan tanggung jawab kelompok adalah sikap egois." },
          { id: "B", teks: "Bekerja sama menyumbangkan ide, membantu menulis, dan saling menyemangati hingga selesai.", benar: true, penjelasan: "Sangat bertanggung jawab! Mengutamakan tugas bersama menjamin keberhasilan kelompok." },
          { id: "C", teks: "Menuntut namanya ditulis paling atas padahal tidak ikut mengerjakan tugas.", benar: false, penjelasan: "Tidak jujur dan merugikan teman yang sudah bekerja keras." },
        ],
      },
      {
        id: "sila3_pos5",
        namaPos: "Pos 5: Garuda Perekat Bangsa",
        namaSuku: "Suku Papua (Rumah Honai)",
        rumahAdat: "Rumah Adat Honai",
        tokohNama: "Kaka Pace (Sahabat Alam)",
        tokohAvatar: "🧔",
        guruNama: "Pak Guru Wayan",
        subMateri: "Semboyan Bhinneka Tunggal Ika",
        penjelasanGuru: "Burung Garuda Pancasila mencengkeram pita bertuliskan 'Bhinneka Tunggal Ika'. Artinya: Berbeda-beda tetapi tetap satu jua. Keberagaman adalah kekuatan kita!",
        silaKe: 5,
        simbolSila: "🦅",
        zPos: -285,
        xPos: 14,
        warnaKhas: "#facc15",
        pertanyaan: "Mengapa persatuan bangsa sangat penting bagi kemajuan Negara Kesatuan Republik Indonesia?",
        opsi: [
          { id: "A", teks: "Tanpa persatuan, bangsa kita mudah diadu domba dan pembangunan akan terhambat.", benar: true, penjelasan: "Tepat sekali! 'Bersatu kita teguh, bercerai kita runtuh' adalah kunci kejayaan Indonesia." },
          { id: "B", teks: "Agar semua penduduk Indonesia memiliki nama dan hobi yang sama persis.", benar: false, penjelasan: "Persatuan menghargai keberagaman, bukan memaksakan keseragaman." },
          { id: "C", teks: "Hanya untuk memenuhi syarat pelajaran di sekolah saja.", benar: false, penjelasan: "Persatuan adalah pondasi hidup berbangsa dan bernegara." },
        ],
      },
    ];
  }, [chapter, activeValidatedModule, chapterTitle]);

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

    // Leaderboard Kelas Real-Time Dinamis (Otomatis Berubah saat Siswa Bermain & Raih Poin)
  const classLeaderboard = useMemo(() => {
    const list = [
      { rank: 1, name: "Siti Rahma", points: peerScores.siti ?? 145, avatar: "👧", costume: "Pramuka", status: "Online 🟢" },
      { rank: 2, name: "Budi Santoso", points: peerScores.budi ?? 130, avatar: "👦", costume: "Batik Hijau", status: "Online 🟢" },
      { rank: 3, name: `${studentName} (Kamu)`, points: adventureScore, avatar: "🎒", costume: "Merah Putih", status: "Online 🟢", isPlayer: true },
      { rank: 4, name: "Edo Pratama", points: peerScores.edo ?? 95, avatar: "🧒", costume: "Olahraga Biru", status: "Online 🟢" },
      { rank: 5, name: "Dayu Kemala", points: peerScores.dayu ?? 80, avatar: "👧", costume: "Batik Ungu", status: "Online 🟢" },
    ];
    list.sort((a, b) => b.points - a.points);
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [adventureScore, peerScores, studentName]);

  // Sinkronkan Papan Skor 3D di Samping Gapura Masuk setiap ada perubahan skor
  useEffect(() => {
    if (lbUpdateRef.current) {
      lbUpdateRef.current(classLeaderboard);
    }
  }, [classLeaderboard]);


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

  // Sinkronkan Judul Materi Aktif dari Dashboard Siswa
  useEffect(() => {
    setResolvedTitle(activeValidatedModule?.title || chapterTitle || chapter);
  }, [activeValidatedModule, chapterTitle, chapter]);

  
  // Simulasi Siswa Kelas Online Bergerak, Mengumpulkan Poin & Chatting (Online)
  useEffect(() => {
    if (!isOpen || !gameStarted) return;

    const interval = setInterval(() => {
      const peers = [
        { id: "siti", name: "Siti Rahma", avatar: "👧", pos: "Pos 1 (Suku Jawa)" },
        { id: "budi", name: "Budi Santoso", avatar: "👦", pos: "Pos 3 (Suku Minang)" },
        { id: "edo", name: "Edo Pratama", avatar: "🧒", pos: "Pos 2 (Suku Sunda)" },
        { id: "dayu", name: "Dayu Kemala", avatar: "👧", pos: "Pos 4 (Suku Dayak)" },
      ];
      const randomPeer = peers[Math.floor(Math.random() * peers.length)];
      const isQuizEvent = Math.random() > 0.45;

      if (isQuizEvent) {
        setPeerScores((prev) => ({
          ...prev,
          [randomPeer.id]: (prev[randomPeer.id] || 80) + 25,
        }));
        setActiveNotification(`🎉 ${randomPeer.name} baru saja tuntas di ${randomPeer.pos} (+25 Poin)!`);
        setChatMessages((prev) => [
          {
            id: String(Date.now()),
            sender: randomPeer.name,
            avatar: randomPeer.avatar,
            text: `Hore! Aku baru saja menyelesaikan materi di ${randomPeer.pos}! 🌟`,
            time: "Baru saja",
          },
          ...prev.slice(0, 20),
        ]);
      } else {
        setPeerScores((prev) => ({
          ...prev,
          [randomPeer.id]: (prev[randomPeer.id] || 80) + 10,
        }));
        setChatMessages((prev) => [
          {
            id: String(Date.now()),
            sender: randomPeer.name,
            avatar: randomPeer.avatar,
            text: "Koin emas di sepanjang jalan desa banyak banget! 🪙",
            time: "Baru saja",
          },
          ...prev.slice(0, 20),
        ]);
      }

      setTimeout(() => {
        setActiveNotification(null);
      }, 3500);
    }, 14000);

    return () => clearInterval(interval);
  }, [isOpen, gameStarted]);

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



    // Fungsi Memicu Emot Gerakan Tubuh Karakter (Terpisah dari Chat)
  const triggerMovementEmote = useCallback(
    (emote: MovementEmote) => {
      activeEmoteRef.current = emote;
      setActiveEmote(emote);
      emoteStartTimeRef.current = Date.now();
      setShowEmoteMenu(false);

      if (emote === "wave") {
        isPlayerWavingRef.current = true;
        playCoinSound();
        playDashSound();
        setActiveNotification("👋 Kamu melambaikan tangan!");

        // Cek teman terdekat jika ada yang bisa membalas sapaan
        const px = playerPosRef.current.x;
        const pz = playerPosRef.current.z;
        for (const st of onlineStudents) {
          if (st.mesh && Math.hypot(px - st.mesh.position.x, pz - st.mesh.position.z) < 12) {
            greetedStudentIdRef.current = st.id;
            setAdventureScore((s) => s + 5);
            addPoints(5, `Menyapa kawan: ${st.name}`);
            setFriendGreetingBubble({
              name: st.name,
              text: `👋 "Halo ${studentName}! Senang ketemu kamu di desa! Ayo kumpulkan koin & jelajahi 5 Suku bareng!"`,
            });
            break;
          }
        }
      } else if (emote === "dance") {
        playBadgeFanfareSound();
        setActiveNotification("💃 Kamu berjoget riang di tengah desa!");
      } else if (emote === "cheer") {
        playCorrectSound();
        setActiveNotification("🙌 Hore! Kamu bersorak gembira merayakan persatuan!");
      } else if (emote === "bow") {
        playClickSound();
        setActiveNotification("🙏 Kamu menunduk hormat dengan santun!");
      } else if (emote === "sit") {
        playDashSound();
        setActiveNotification("🧘 Kamu duduk santai di rumput pedesaan!");
      } else if (emote === "flip") {
        playJumpSound();
        setActiveNotification("🤸 Salto! Kamu melompat akrobatik!");
      }

      if (emoteTimeoutRef.current) clearTimeout(emoteTimeoutRef.current);
      if (emote !== "sit") {
        emoteTimeoutRef.current = setTimeout(() => {
          activeEmoteRef.current = "none";
          setActiveEmote("none");
          isPlayerWavingRef.current = false;
          greetedStudentIdRef.current = null;
          setFriendGreetingBubble(null);
          setActiveNotification(null);
        }, 3500);
      }
    },
    [addPoints, onlineStudents, studentName]
  );



    // Sapa Teman Sekelas (Interaksi Dadah Online Online)
  const handleGreetClassmate = useCallback((student: OnlineStudent) => {
    triggerMovementEmote("wave");
  }, [triggerMovementEmote]);

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
    if (!isOpen || !mountEl) return;

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
    renderer.shadowMap.type = THREE.PCFShadowMap;

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    mount.appendChild(renderer.domElement);

    // 2. LIGHTING INDAH PEDESAAN
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

    // Jalan Paving Pedesaan Hangat
    const pathGeo = new THREE.PlaneGeometry(12, 400);
    const pathMat = new THREE.MeshLambertMaterial({ color: "#fef08a" });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.02, -150);
    scene.add(pathMesh);

    // Pembatas Batu Tepi Jalan Kiri & Kanan (Curbs)
    const curbGeo = new THREE.BoxGeometry(0.35, 0.22, 400);
    const curbMat = new THREE.MeshLambertMaterial({ color: "#94a3b8" });
    const curbLeft = new THREE.Mesh(curbGeo, curbMat);
    curbLeft.position.set(-6.15, 0.11, -150);
    scene.add(curbLeft);
    const curbRight = curbLeft.clone();
    curbRight.position.x = 6.15;
    scene.add(curbRight);

    // Tiang Lampu Lentera Pedesaan Hangat di Pinggir Jalan
    const lanternZPositions = [10, -45, -105, -165, -225, -285];
    lanternZPositions.forEach((lz, lIdx) => {
      const lampGroup = new THREE.Group();
      const poleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 4.2, 8),
        new THREE.MeshLambertMaterial({ color: "#334155" })
      );
      poleMesh.position.y = 2.1;
      lampGroup.add(poleMesh);

      const lampHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.65, 0.55),
        new THREE.MeshLambertMaterial({ color: "#fef08a", emissive: "#facc15" })
      );
      lampHead.position.set(0, 4.3, 0);
      lampGroup.add(lampHead);

      const lampCap = new THREE.Mesh(
        new THREE.ConeGeometry(0.48, 0.35, 4),
        new THREE.MeshLambertMaterial({ color: "#1e293b" })
      );
      lampCap.rotation.y = Math.PI / 4;
      lampCap.position.set(0, 4.75, 0);
      lampGroup.add(lampCap);

      const pLight = new THREE.PointLight("#fef08a", 0.9, 12);
      pLight.position.set(0, 4.3, 0);
      lampGroup.add(pLight);

      lampGroup.position.set(lIdx % 2 === 0 ? -5.8 : 5.8, 0, lz);
      scene.add(lampGroup);
    });

    // Taman Bunga Berwarna-warni di Sepanjang Jalan Desa
    const flowerColors = ["#f43f5e", "#fb923c", "#facc15", "#38bdf8", "#ec4899", "#a855f7"];
    for (let fz = 8; fz > -300; fz -= 14) {
      const fGroup = new THREE.Group();
      const col = flowerColors[Math.abs(Math.floor(fz)) % flowerColors.length];
      for (let i = 0; i < 4; i++) {
        const flMesh = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.22),
          new THREE.MeshLambertMaterial({ color: col })
        );
        flMesh.position.set((Math.random() - 0.5) * 1.2, 0.22, (Math.random() - 0.5) * 1.2);
        fGroup.add(flMesh);
      }
      fGroup.position.set(fz % 2 === 0 ? -7.2 : 7.2, 0, fz);
      scene.add(fGroup);
    }

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

        // Banner Tulisan Gapura Resolusi Tinggi (1200x280) - Anti Terpotong
    const bannerCanvas = document.createElement("canvas");
    bannerCanvas.width = 1200;
    bannerCanvas.height = 280;
    const bCtx = bannerCanvas.getContext("2d")!;

    // Background Mewah Merah Marun & Border Emas
    bCtx.fillStyle = "#7f1d1d";
    bCtx.fillRect(0, 0, 1200, 280);
    bCtx.strokeStyle = "#facc15";
    bCtx.lineWidth = 14;
    bCtx.strokeRect(7, 7, 1186, 266);
    bCtx.strokeStyle = "#ffffff";
    bCtx.lineWidth = 3;
    bCtx.strokeRect(20, 20, 1160, 240);

    // Judul Utama Gapura Auto-Fitted (Jamin Tidak Terpotong)
    drawFittedText(bCtx, "★ DESA PANCASILA NUSANTARA ★", 600, 95, 1120, 52, {
      color: "#fef08a",
      shadowColor: "#ca8a04",
      shadowBlur: 10,
    });

    // Subjudul Gapura Auto-Fitted
    drawFittedText(
      bCtx,
      `🇮🇩  ${resolvedTitle.toUpperCase()} • JELAJAH PENGAMALAN 5 SILA  🇮🇩`,
      600,
      190,
      1120,
      30,
      { color: "#ffffff" }
    );

    const bannerTexture = new THREE.CanvasTexture(bannerCanvas);
    bannerTexture.anisotropy = 8;

    // Banner Sisi Depan
    const bannerMeshFront = new THREE.Mesh(
      new THREE.PlaneGeometry(13.2, 2.3),
      new THREE.MeshBasicMaterial({ map: bannerTexture })
    );
    bannerMeshFront.position.set(0, 8.6, 15.25);
    gapuraGroup.add(bannerMeshFront);

    // Banner Sisi Belakang
    const bannerMeshBack = new THREE.Mesh(
      new THREE.PlaneGeometry(13.2, 2.3),
      new THREE.MeshBasicMaterial({ map: bannerTexture })
    );
    bannerMeshBack.position.set(0, 8.6, 12.75);
    bannerMeshBack.rotation.y = Math.PI;
    gapuraGroup.add(bannerMeshBack);

    scene.add(gapuraGroup);

        // ------------------------------------------------------------------------
    // PAPAN SKOR KELAS 3D DINAMIS (DI KANAN GAPURA: X = +4.5, Z = +16)
    // OTOMATIS BERUBAH SECARA REAL-TIME SESUAI SKOR SISWA & TEMAN KELAS ONLINE
    // ------------------------------------------------------------------------
    const lbGroup = new THREE.Group();
    const lbPole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5.2, 8), new THREE.MeshLambertMaterial({ color: "#78350f" }));
    lbPole1.position.set(-2.5, 2.6, 0);
    lbGroup.add(lbPole1);
    const lbPole2 = lbPole1.clone();
    lbPole2.position.set(2.5, 2.6, 0);
    lbGroup.add(lbPole2);

    const lbCanvas = document.createElement("canvas");
    lbCanvas.width = 640;
    lbCanvas.height = 440;
    const lbCtx = lbCanvas.getContext("2d")!;
    const lbTexture = new THREE.CanvasTexture(lbCanvas);
    lbTexture.anisotropy = 8;

    const redraw3DLeaderboard = (data: Array<{ rank: number; name: string; points: number; avatar: string; isPlayer?: boolean }>) => {
      lbCtx.fillStyle = "#0f172a";
      lbCtx.fillRect(0, 0, 640, 440);
      lbCtx.strokeStyle = "#facc15";
      lbCtx.lineWidth = 10;
      lbCtx.strokeRect(5, 5, 630, 430);
      lbCtx.strokeStyle = "#38bdf8";
      lbCtx.lineWidth = 2;
      lbCtx.strokeRect(14, 14, 612, 412);

      // Header Papan Skor Kelas
      drawFittedText(lbCtx, "🏆 PAPAN SKOR KELAS ONLINE", 320, 44, 590, 32, {
        color: "#facc15",
        shadowColor: "#ca8a04",
        shadowBlur: 8,
      });
      drawFittedText(lbCtx, "Desa Pancasila • Peringkat Live Siswa 🟢", 320, 80, 580, 20, {
        color: "#38bdf8",
      });

      // 5 Baris Siswa Teratas
      const sorted = [...data].sort((a, b) => b.points - a.points).slice(0, 5);
      sorted.forEach((item, idx) => {
        const y = 126 + idx * 58;
        const isPlayer = item.isPlayer;

        if (isPlayer) {
          lbCtx.fillStyle = "rgba(234, 179, 8, 0.28)";
          lbCtx.fillRect(24, y - 22, 592, 50);
          lbCtx.strokeStyle = "#facc15";
          lbCtx.lineWidth = 3;
          lbCtx.strokeRect(24, y - 22, 592, 50);
        } else {
          lbCtx.fillStyle = idx % 2 === 0 ? "rgba(30, 41, 59, 0.75)" : "rgba(15, 23, 42, 0.75)";
          lbCtx.fillRect(24, y - 22, 592, 50);
        }

        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
        const textColor = isPlayer ? "#fef08a" : "#ffffff";
        const label = `${medal} ${item.name}`;

        drawFittedText(lbCtx, label, 42, y + 3, 420, 24, {
          align: "left",
          color: textColor,
          fontWeight: isPlayer ? "900" : "bold",
        });

        drawFittedText(lbCtx, `${item.points} Poin`, 596, y + 3, 140, 24, {
          align: "right",
          color: isPlayer ? "#facc15" : "#38bdf8",
          fontWeight: "bold",
        });
      });

      lbTexture.needsUpdate = true;
    };

    lbUpdateRef.current = redraw3DLeaderboard;
    redraw3DLeaderboard(classLeaderboard);

    const lbBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 3.6),
      new THREE.MeshBasicMaterial({ map: lbTexture, side: THREE.DoubleSide })
    );
    lbBoard.position.set(0, 3.6, 0.05);
    lbGroup.add(lbBoard);

    lbGroup.position.set(4.5, 0, 16);
    scene.add(lbGroup);

    // ------------------------------------------------------------------------
    // BUILDER MODEL ANATOMI HUMANOID SERAGAM (STANDAR KELAS SD)
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
        torso,
        head,
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
    // ------------------------------------------------------------------------
    // 5 RUMAH ADAT POS PEMBELAJARAN: PENUNGGU PAK GURU, PLANG NAMA & TITIK MISI
    // ------------------------------------------------------------------------
    interface HotspotItem {
      suku: SukuAdat;
      x: number;
      z: number;
      guruX: number;
      guruZ: number;
      ringMesh: THREE.Mesh;
      beaconMesh: THREE.Mesh;
    }
    const hotspotList: HotspotItem[] = [];

    sukuList.forEach((suku, sIdx) => {
      const hGroup = new THREE.Group();

      // Dinding Rumah
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(11, 7.5, 9),
        new THREE.MeshLambertMaterial({ color: suku.warnaKhas })
      );
      wallMesh.position.y = 3.75;
      wallMesh.castShadow = true;
      hGroup.add(wallMesh);

      // Atap Khas Adat Nusantara
      let roofMesh: THREE.Mesh;
      if (suku.id.includes("minang") || suku.namaSuku.includes("Minang")) {
        roofMesh = new THREE.Mesh(new THREE.ConeGeometry(8, 6, 4), new THREE.MeshLambertMaterial({ color: "#78350f" }));
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.position.y = 9.8;
      } else if (suku.id.includes("papua") || suku.namaSuku.includes("Papua")) {
        roofMesh = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: "#ca8a04" }));
        roofMesh.position.y = 7.5;
      } else {
        roofMesh = new THREE.Mesh(new THREE.ConeGeometry(8.5, 4.5, 4), new THREE.MeshLambertMaterial({ color: "#92400e" }));
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.position.y = 9.5;
      }
      roofMesh.castShadow = true;
      hGroup.add(roofMesh);

      // Pintu Rumah Kayu
      const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.2, 0.2), new THREE.MeshLambertMaterial({ color: "#451a03" }));
      doorMesh.position.set(0, 2.1, suku.xPos > 0 ? -4.51 : 4.51);
      hGroup.add(doorMesh);

      // Jendela Rumah Berpijar Hangat (Kiri & Kanan Pintu)
      const winGeo = new THREE.PlaneGeometry(1.6, 1.4);
      const winMat = new THREE.MeshBasicMaterial({ color: "#fef08a" });
      const winLeft = new THREE.Mesh(winGeo, winMat);
      winLeft.position.set(-2.8, 3.8, suku.xPos > 0 ? -4.52 : 4.52);
      if (suku.xPos <= 0) winLeft.rotation.y = Math.PI;
      hGroup.add(winLeft);

      const winRight = new THREE.Mesh(winGeo, winMat);
      winRight.position.set(2.8, 3.8, suku.xPos > 0 ? -4.52 : 4.52);
      if (suku.xPos <= 0) winRight.rotation.y = Math.PI;
      hGroup.add(winRight);

      // Anak Tangga Masuk Teras Rumah
      const stepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.3, 1.2),
        new THREE.MeshLambertMaterial({ color: "#64748b" })
      );
      stepMesh.position.set(0, 0.15, suku.xPos > 0 ? -5.1 : 5.1);
      hGroup.add(stepMesh);

      // Letakkan Rumah agak ke belakang agar halaman depan lega dan terbuka
      const houseX = suku.xPos > 0 ? 17.5 : -17.5;
      hGroup.position.set(houseX, 0, suku.zPos);
      scene.add(hGroup);

      // ----------------------------------------------------------------------
      // PLANG PAPAN NAMA POS DI DEPAN RUMAH (DIMAJUKAN KE HALAMAN DEKAT JALAN)
      // JAUH DARI TEMBOK RUMAH, MENGHADAP JALAN SECARA JELAS
      // ----------------------------------------------------------------------
      const signX = suku.xPos > 0 ? 7.2 : -7.2;
      const signZ = suku.zPos - (suku.xPos > 0 ? 2.6 : -2.6);
      const signGroup = new THREE.Group();

      const signPole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8), new THREE.MeshLambertMaterial({ color: "#78350f" }));
      signPole1.position.set(-1.2, 1.6, 0);
      signGroup.add(signPole1);

      const signPole2 = signPole1.clone();
      signPole2.position.set(1.2, 1.6, 0);
      signGroup.add(signPole2);

            const signCanvas = document.createElement("canvas");
      signCanvas.width = 720;
      signCanvas.height = 360;
      const sCtx = signCanvas.getContext("2d")!;
      sCtx.fillStyle = "#1e1b4b";
      sCtx.fillRect(0, 0, 720, 360);
      sCtx.strokeStyle = "#facc15";
      sCtx.lineWidth = 12;
      sCtx.strokeRect(6, 6, 708, 348);
      sCtx.strokeStyle = "#ffffff";
      sCtx.lineWidth = 2;
      sCtx.strokeRect(16, 16, 688, 328);

      drawFittedText(sCtx, `🏷️ ${suku.namaPos.toUpperCase()}`, 360, 55, 660, 34, { color: "#facc15" });
      drawFittedText(sCtx, `📚 Materi: ${suku.subMateri}`, 360, 130, 660, 28, { color: "#ffffff" });
      drawFittedText(sCtx, `👨‍🏫 Penunggu: ${suku.guruNama}`, 360, 205, 660, 26, { color: "#38bdf8" });
      drawFittedText(sCtx, "📍 Berdiri di Titik Misi & Tekan 'E' untuk Kuis", 360, 280, 660, 24, { color: "#4ade80" });

      const signBoard = new THREE.Mesh(
        new THREE.PlaneGeometry(4.0, 2.0),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signCanvas), side: THREE.DoubleSide })
      );
      signBoard.position.set(0, 2.2, 0.05);
      signGroup.add(signBoard);

      signGroup.position.set(signX, 0, signZ);
      // Diputar miring menghadap jalan agar terbaca jelas oleh pemain
      signGroup.rotation.y = suku.xPos > 0 ? -Math.PI * 0.42 : Math.PI * 0.42;
      scene.add(signGroup);

      // ----------------------------------------------------------------------
      // PENUNGGU PAK GURU 3D HUMANOID (DIMAJUKAN KE HALAMAN DEPAN, TIDAK NEMPEL TEMBOK)
      // ----------------------------------------------------------------------
      const guruTeacherColors = [
        { shirt: "#0284c7", tie: "#1e3a8a" },
        { shirt: "#15803d", tie: "#14532d" },
        { shirt: "#b45309", tie: "#78350f" },
        { shirt: "#7e22ce", tie: "#581c87" },
        { shirt: "#0f766e", tie: "#134e4a" },
      ];
      const tCol = guruTeacherColors[sIdx % guruTeacherColors.length];

      const guruPosData = createHumanoid({
        shirtColor: tCol.shirt,
        pantsColor: "#1e293b",
        hatType: "peci_guru",
        hasTie: true,
        tieColor: tCol.tie,
        hasGlasses: true,
      });
      const guruPosGroup = guruPosData.group;

      // Lingkaran Emas Penanda di Bawah Kaki Pak Guru Penunggu Pos
      const gRingGeo = new THREE.RingGeometry(0.9, 1.25, 32);
      const gRingMat = new THREE.MeshBasicMaterial({ color: "#facc15", side: THREE.DoubleSide });
      const gRingMesh = new THREE.Mesh(gRingGeo, gRingMat);
      gRingMesh.rotation.x = -Math.PI / 2;
      gRingMesh.position.y = 0.05;
      guruPosGroup.add(gRingMesh);

      // 3D Floating Sprite Label Overhead Pak Guru Penunggu Pos
      const gpCanvas = document.createElement("canvas");
      gpCanvas.width = 420;
      gpCanvas.height = 96;
      const gpCtx = gpCanvas.getContext("2d")!;
      gpCtx.fillStyle = "#1e1b4b";
      gpCtx.fillRect(0, 0, 420, 96);
      gpCtx.strokeStyle = "#facc15";
      gpCtx.lineWidth = 6;
      gpCtx.strokeRect(3, 3, 414, 90);
      gpCtx.fillStyle = "#ffffff";
      gpCtx.font = "bold 24px sans-serif";
      gpCtx.textAlign = "center";
      gpCtx.fillText(`👨‍🏫 ${suku.guruNama}`, 210, 36);
      gpCtx.fillStyle = "#38bdf8";
      gpCtx.font = "bold 18px sans-serif";
      gpCtx.fillText(`Penunggu: ${suku.namaPos}`, 210, 62);
      gpCtx.fillStyle = "#4ade80";
      gpCtx.font = "bold 16px sans-serif";
      gpCtx.fillText("[ Tekan 'E' untuk Dialog & Kuis ]", 210, 85);

      const gpSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gpCanvas) }));
      gpSprite.position.set(0, 5.0, 0);
      gpSprite.scale.set(4.0, 0.95, 1);
      guruPosGroup.add(gpSprite);

      // Dimajukan ke samping jalan (X = ±7.2), jauh dari dinding rumah (X = ±17.5)
      const guruPosHostX = suku.xPos > 0 ? 7.2 : -7.2;
      const guruPosHostZ = suku.zPos + (suku.xPos > 0 ? 2.2 : -2.2);
      guruPosGroup.position.set(guruPosHostX, 0, guruPosHostZ);
      guruPosGroup.rotation.y = suku.xPos > 0 ? -Math.PI * 0.42 : Math.PI * 0.42;
      scene.add(guruPosGroup);

      // ----------------------------------------------------------------------
      // TITIK MISI BERCAHAYA (CHECKPOINT PAD DI HALAMAN DEPAN)
      // ----------------------------------------------------------------------
      const hotspotX = suku.xPos > 0 ? 6.2 : -6.2;
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
      padCanvas.width = 400;
      padCanvas.height = 92;
      const pdCtx = padCanvas.getContext("2d")!;
      pdCtx.fillStyle = "#ffffff";
      pdCtx.font = "bold 24px sans-serif";
      pdCtx.textAlign = "center";
      pdCtx.fillText(`🎯 ${suku.namaPos.toUpperCase()}`, 200, 36);
      pdCtx.fillStyle = "#facc15";
      pdCtx.font = "bold 20px sans-serif";
      pdCtx.fillText(`👨‍🏫 Bersama ${suku.guruNama} [Tekan 'E']`, 200, 72);

      const padSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(padCanvas) }));
      padSprite.position.set(0, 4.2, 0);
      padSprite.scale.set(4.2, 1.0, 1);
      spotGroup.add(padSprite);

      spotGroup.position.set(hotspotX, 0, hotspotZ);
      scene.add(spotGroup);

      hotspotList.push({
        suku,
        x: hotspotX,
        z: hotspotZ,
        guruX: guruPosHostX,
        guruZ: guruPosHostZ,
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
    const { torso, head, leftArm, rightArm, leftLeg, rightLeg } = playerData;

        // Label Pemain Auto-Fitted (Menampilkan Nama Siswa Asli)
    const playerNameCanvas = document.createElement("canvas");
    playerNameCanvas.width = 380;
    playerNameCanvas.height = 70;
    const pCtx = playerNameCanvas.getContext("2d")!;
    pCtx.fillStyle = "#1e1b4b";
    pCtx.fillRect(0, 0, 380, 70);
    pCtx.strokeStyle = "#facc15";
    pCtx.lineWidth = 5;
    pCtx.strokeRect(2, 2, 376, 66);
    drawFittedText(pCtx, `🎒 ${studentName} (Kamu)`, 190, 25, 360, 24, { color: "#ffffff" });
    drawFittedText(pCtx, "Siswa SD Online 🟢", 190, 52, 360, 18, { color: "#4ade80" });
    const pNameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(playerNameCanvas) }));
    pNameSprite.position.set(0, 4.6, 0);
    pNameSprite.scale.set(3.8, 0.8, 1);
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

      
      // ANIMASI 3D EMOT GERAKAN TUBUH KARAKTER ()
      const curEmote = activeEmoteRef.current;
      const emoteTime = (Date.now() - emoteStartTimeRef.current) / 1000;

      if (curEmote === "wave" || isPlayerWavingRef.current) {
        // 1. 👋 Wave: Tangan kanan melambai ke atas
        rightArm.rotation.x = -Math.PI * 0.72;
        rightArm.rotation.z = Math.sin(Date.now() * 0.016) * 0.45;
        leftArm.rotation.set(0, 0, 0);
        leftLeg.rotation.set(0, 0, 0);
        rightLeg.rotation.set(0, 0, 0);
        torso.rotation.set(0, 0, 0);
        head.rotation.set(0, 0, 0);
      } else if (curEmote === "dance") {
        // 2. 💃 Dance / Joget: Badan bergoyang riang kiri-kanan & tangan bergantian
        torso.rotation.y = Math.sin(Date.now() * 0.01) * 0.35;
        torso.position.y = 2.15 + Math.abs(Math.sin(Date.now() * 0.012)) * 0.12;
        rightArm.rotation.x = -Math.PI * 0.55 + Math.sin(Date.now() * 0.01) * 0.45;
        rightArm.rotation.z = 0.25;
        leftArm.rotation.x = -Math.PI * 0.55 - Math.sin(Date.now() * 0.01) * 0.45;
        leftArm.rotation.z = -0.25;
        leftLeg.rotation.x = Math.sin(Date.now() * 0.01) * 0.25;
        rightLeg.rotation.x = -Math.sin(Date.now() * 0.01) * 0.25;
        head.rotation.y = Math.sin(Date.now() * 0.01) * 0.2;
      } else if (curEmote === "cheer") {
        // 3. 🙌 Cheer / Hore: Dua tangan diangkat ke atas bersorak gembira
        rightArm.rotation.x = -Math.PI * 0.88;
        rightArm.rotation.z = 0.35 + Math.sin(Date.now() * 0.012) * 0.15;
        leftArm.rotation.x = -Math.PI * 0.88;
        leftArm.rotation.z = -0.35 - Math.sin(Date.now() * 0.012) * 0.15;
        head.rotation.x = -0.25;
        torso.rotation.set(0, 0, 0);
        torso.position.y = 2.15 + Math.abs(Math.sin(Date.now() * 0.012)) * 0.15;
        leftLeg.rotation.set(0, 0, 0);
        rightLeg.rotation.set(0, 0, 0);
      } else if (curEmote === "bow") {
        // 4. 🙏 Bow / Hormat: Badan membungkuk santun ke depan
        torso.rotation.x = 0.42;
        head.rotation.x = 0.25;
        rightArm.rotation.x = -0.3;
        rightArm.rotation.z = -0.35;
        leftArm.rotation.x = -0.3;
        leftArm.rotation.z = 0.35;
        leftLeg.rotation.set(0, 0, 0);
        rightLeg.rotation.set(0, 0, 0);
      } else if (curEmote === "sit") {
        // 5. 🧘 Sit / Duduk: Badan diturunkan ke rumput, kaki terlipat ke depan
        torso.rotation.set(0, 0, 0);
        torso.position.y = 1.35;
        head.rotation.set(0, 0, 0);
        leftLeg.rotation.x = -Math.PI * 0.48;
        rightLeg.rotation.x = -Math.PI * 0.48;
        leftArm.rotation.x = -0.25;
        rightArm.rotation.x = -0.25;
      } else if (curEmote === "flip") {
        // 6. 🤸 Flip / Salto: Putaran vertikal akrobatik 360 derajat
        const progress = Math.min(1, emoteTime / 0.85);
        torso.rotation.x = progress * Math.PI * 2;
        torso.position.y = 2.15 + Math.sin(progress * Math.PI) * 1.8;
        rightArm.rotation.x = -Math.PI * 0.5;
        leftArm.rotation.x = -Math.PI * 0.5;
        leftLeg.rotation.x = 0.3;
        rightLeg.rotation.x = 0.3;
      } else {
        // Berdiri diam normal
        torso.rotation.set(0, 0, 0);
        torso.position.y = 2.15;
        head.rotation.set(0, 0, 0);
        rightArm.rotation.z = 0;
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

          
          // Animasi membalas lambaian jika disapa pemain
          if (greetedStudentIdRef.current === student.id && student.rightArm) {
            student.rightArm.rotation.x = -Math.PI * 0.72;
            student.rightArm.rotation.z = Math.sin(Date.now() * 0.016) * 0.45;
          } else if (student.rightArm) {
            student.rightArm.rotation.z = 0;
          }

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

        // 3. Cek Apakah Pemain Berada di Titik Misi atau Dekat Pak Guru Penunggu Pos
        for (const hp of hotspotList) {
          const distToHotspot = Math.hypot(px - hp.x, pz - hp.z);
          const distToPosGuru = Math.hypot(px - hp.guruX, pz - hp.guruZ);
          if (distToHotspot < 4.2 || distToPosGuru < 4.2) {
            setActiveSukuDialog(hp.suku);
            setSelectedAnswer(null);
            setAnswerFeedback(null);
            speakGuruVoice(
              `Halo murid hebat! Selamat datang di ${hp.suku.namaPos}. ${hp.suku.penjelasanGuru}`
            );
            return;
          }
        }

        setActiveNotification("📍 Dekatilah Pak Guru Penunggu atau berdirilah di Titik Misi untuk belajar & kuis!");
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
              🇮🇩
            </span>
            <div className="min-w-0">
              <h2 id="game-title" className="font-black text-sm sm:text-base text-yellow-300 truncate tracking-wide">
                PETUALANGAN PANCASILA: JELAJAH DESA NUSANTARA ONLINE
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                Materi: <b className="text-emerald-400">{resolvedTitle}</b> • Teman Online: <b className="text-emerald-400">4 Siswa 🟢</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Papan Skor Kelas */}
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

            {/* Poin Koin di Jalan */}
            <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-2xl border border-yellow-400/50 shadow-inner">
              <span className="text-xs font-black text-yellow-300">
                🪙 {adventureScore} Poin
              </span>
              <span className="text-[10px] bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                ⭐ {coinsCollectedCount} Koin
              </span>
            </div>

            {/* Progres 5 Pos Materi */}
            <div className="hidden md:flex items-center gap-1 bg-slate-800/90 px-3 py-1.5 rounded-2xl border border-emerald-500/40 text-xs font-bold text-emerald-300">
              <span>🏠</span>
              <span>{visitedSukuIds.length}/5 Pos Selesai</span>
            </div>

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

        {/* CONTAINER ARENA FULLSCREEN 3D */}
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

          {/* OVERLAY AWAL MULAI MAIN */}
          {!gameStarted && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center text-5xl shadow-2xl border-4 border-white animate-bounce">
                🎒
              </div>
              <div className="space-y-2 max-w-lg">
                <h3 className="font-black text-2xl sm:text-3xl text-yellow-300 tracking-wide">
                  AYO MASUK KE DESA PANCASILA! 🇮🇩
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Teman-teman sekelasmu sudah online! Di awal ada <b>Papan Skor Kelas</b> dan <b>Pak Guru Virtual</b> yang siap menjelaskan materi lewat suara. Kumpulkan koin di jalan dan kunjungi 5 rumah suku adat!
                </p>
                <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-yellow-400/40 text-xs text-yellow-200 flex flex-wrap items-center justify-center gap-3">
                  <span>🎮 <b>WASD / Panah</b>: Jalan</span>
                  <span>•</span>
                  <span>🟡 <b>Spasi</b>: Lompat</span>
                  <span>•</span>
                  <span>⚡ <b>Shift</b>: Sprint Lari</span>
                  <span>•</span>
                  <span>🎯 <b>E</b>: Bicara / Sapa Teman</span>
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
                <span>▶️ MULAI MASUK DESA (DENGAN MUSIK 🎵)</span>
              </button>
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

          {/* DIALOG POPUP POS MATERI & KUIS BERSAMA PENUNGGU PAK GURU (LEBIH RINGKAS & NYAMAN) */}
          {activeSukuDialog && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
              <div className="bg-slate-900/95 border-2 border-yellow-400 rounded-3xl max-w-md w-full p-4 sm:p-4.5 text-white space-y-2.5 shadow-2xl max-h-[92vh] overflow-y-auto">
                {/* Header Pos & Guru Kompak */}
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400 flex items-center justify-center text-2xl shadow shrink-0">
                      {activeSukuDialog.tokohAvatar}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-yellow-400 uppercase tracking-wider block truncate">
                        🏷️ {activeSukuDialog.namaPos}
                      </span>
                      <h3 className="font-black text-sm text-white truncate">
                        {activeSukuDialog.namaSuku}
                      </h3>
                      <p className="text-[11px] text-sky-300 font-semibold truncate">
                        👨‍🏫 {activeSukuDialog.guruNama} • {activeSukuDialog.tokohNama}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (isGuruSpeaking) {
                        stopGuruVoice();
                      } else {
                        speakGuruVoice(
                          `Halo anak hebat! Selamat datang di ${activeSukuDialog.namaPos}. ${activeSukuDialog.penjelasanGuru}`
                        );
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                      isGuruSpeaking
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-sky-500 hover:bg-sky-600 text-white shadow"
                    }`}
                  >
                    <span>{isGuruSpeaking ? "⏹️ Hentikan" : "🔊 Suara Guru"}</span>
                  </button>
                </div>

                {/* Kotak Ringkas Penjelasan Materi dari Pak Guru Penunggu Pos */}
                <div className="bg-sky-950/60 border border-sky-400/50 p-2.5 rounded-2xl space-y-0.5 text-xs leading-relaxed text-slate-100">
                  <div className="text-sky-300 font-black text-[11px] uppercase tracking-wider">
                    💡 Materi: {activeSukuDialog.subMateri}
                  </div>
                  <p className="text-[11px] sm:text-xs text-sky-100 italic">
                    "{activeSukuDialog.penjelasanGuru}"
                  </p>
                </div>

                {/* Soal Kuis Tantangan */}
                <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700 text-xs leading-relaxed text-slate-100 font-medium">
                  <b className="text-yellow-300">🎯 Kuis:</b> "{activeSukuDialog.pertanyaan}"
                </div>

                <div className="space-y-1.5 pt-0.5">
                  {activeSukuDialog.opsi.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleAnswerSuku(activeSukuDialog, opt.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition text-xs font-semibold flex items-start gap-2.5 cursor-pointer border ${
                        selectedAnswer === opt.id
                          ? opt.benar
                            ? "bg-emerald-600/30 border-emerald-400 text-emerald-200"
                            : "bg-rose-600/30 border-rose-400 text-rose-200"
                          : "bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-lg bg-yellow-400 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {opt.id}
                      </span>
                      <span className="leading-snug">{opt.teks}</span>
                    </button>
                  ))}
                </div>

                {answerFeedback && (
                  <div
                    className={`p-2 rounded-xl text-xs font-bold animate-in fade-in ${
                      answerFeedback.isCorrect
                        ? "bg-emerald-950/80 border border-emerald-400 text-emerald-300"
                        : "bg-rose-950/80 border border-rose-400 text-rose-300"
                    }`}
                  >
                    {answerFeedback.isCorrect ? "✅ Benar! +25 Poin! " : "❌ Kurang Tepat: "}
                    {answerFeedback.text}
                  </div>
                )}

                <div className="pt-1 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {visitedSukuIds.includes(activeSukuDialog.id) ? "✓ Sudah Diselesaikan" : "Belum Selesai"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      stopGuruVoice();
                      setActiveSukuDialog(null);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition cursor-pointer"
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
                    Kamu telah mengunjungi seluruh 5 Pos Pembelajaran bersama para penunggu Pak Guru dan menyelesaikan seluruh kuis materi dengan gemilang!
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

          
          {/* ================================================================= */}
          {/* KOLOM CHAT ONLINE DI BAGIAN BAWAH (TERDOKING RAPIH DI BAWAH) */}
          {/* ================================================================= */}
          <div className="absolute bottom-20 left-4 sm:left-8 z-30 pointer-events-auto max-w-sm sm:max-w-md w-[calc(100vw-2rem)] sm:w-96 flex flex-col gap-1.5">
            {/* Jendela Obrolan (Jika Dibuka) */}
            {isChatOpen && (
              <div className="bg-slate-950/95 border-2 border-sky-400 rounded-3xl p-3 shadow-2xl backdrop-blur-md text-white flex flex-col gap-2 animate-in slide-in-from-bottom-3 duration-200">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                  <span className="text-[11px] font-black text-sky-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <span>💬</span> Chat Kelas Online (4 Siswa Aktif)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(false)}
                    className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Pesan Obrolan dengan Scroll Halus */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs pr-1">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-xl text-[11px] leading-relaxed ${
                        msg.isPlayer
                          ? "bg-yellow-400/15 border border-yellow-400/40 text-yellow-200"
                          : "bg-slate-800/80 border border-slate-700/80 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-black text-sky-400 mb-0.5">
                        <span>{msg.avatar} {msg.sender}</span>
                        <span className="text-slate-400 font-normal">{msg.time}</span>
                      </div>
                      <p className="font-semibold">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Baris Input Chat di Bawah */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customChatInput.trim()) return;
                setChatMessages((prev) => [
                  {
                    id: String(Date.now()),
                    sender: studentName,
                    avatar: "🎒",
                    text: customChatInput.trim(),
                    time: "Baru saja",
                    isPlayer: true,
                  },
                  ...prev.slice(0, 25),
                ]);
                setCustomChatInput("");
                setActiveNotification(`💬 Chat terkirim: "${customChatInput.trim()}"`);
                setTimeout(() => setActiveNotification(null), 2500);
              }}
              className="flex items-center gap-1.5 bg-slate-900/95 border border-sky-400/70 p-1.5 rounded-2xl shadow-xl backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-black text-xs flex items-center gap-1 cursor-pointer transition shrink-0"
                title="Buka / Tutup Riwayat Chat"
              >
                <span>💬</span>
                <span className="hidden sm:inline">{isChatOpen ? "Tutup" : "Chat"}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              <input
                type="text"
                value={customChatInput}
                onChange={(e) => setCustomChatInput(e.target.value)}
                onFocus={() => setIsChatOpen(true)}
                placeholder="Ketik pesan chat ke kawan kelas..."
                maxLength={60}
                className="flex-1 min-w-0 bg-transparent px-2 py-1 text-xs text-white placeholder-slate-400 focus:outline-none"
              />

              <button
                type="submit"
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shrink-0 transition active:scale-95"
              >
                Kirim
              </button>
            </form>
          </div>

          {/* ================================================================= */}
          {/* MENU PILIHAN EMOT GERAKAN TUBUH (Petualangan EMOTE WHEEL / POPUP) */}
          {/* ================================================================= */}
          {showEmoteMenu && (
            <div className="absolute bottom-20 right-4 sm:right-8 z-40 bg-slate-950/95 border-2 border-fuchsia-400 p-3.5 rounded-3xl shadow-2xl backdrop-blur-md w-72 text-white animate-in zoom-in-95 space-y-2 pointer-events-auto">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                <span className="text-xs font-black text-fuchsia-300 flex items-center gap-1.5">
                  <span>🎭</span> Pilihan Emot Gerakan Karakter
                </span>
                <button
                  type="button"
                  onClick={() => setShowEmoteMenu(false)}
                  className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-slate-300">
                Pilih gerakan tubuh 3D untuk mengekspresikan diri di desa:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => triggerMovementEmote("wave")}
                  className="p-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/50 text-xs font-bold text-amber-300 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span className="text-lg">👋</span>
                  <span>Dadah / Sapa</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerMovementEmote("dance")}
                  className="p-2.5 rounded-2xl bg-pink-500/20 hover:bg-pink-500/40 border border-pink-400/50 text-xs font-bold text-pink-300 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span className="text-lg">💃</span>
                  <span>Joget Riang</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerMovementEmote("cheer")}
                  className="p-2.5 rounded-2xl bg-sky-500/20 hover:bg-sky-500/40 border border-sky-400/50 text-xs font-bold text-sky-300 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span className="text-lg">🙌</span>
                  <span>Sorak / Hore</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerMovementEmote("bow")}
                  className="p-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-400/50 text-xs font-bold text-emerald-300 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span className="text-lg">🙏</span>
                  <span>Hormat Santun</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerMovementEmote("sit")}
                  className="p-2.5 rounded-2xl bg-teal-500/20 hover:bg-teal-500/40 border border-teal-400/50 text-xs font-bold text-teal-300 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span className="text-lg">🧘</span>
                  <span>Duduk Santai</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerMovementEmote("flip")}
                  className="p-2.5 rounded-2xl bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/50 text-xs font-bold text-purple-300 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span className="text-lg">🤸</span>
                  <span>Salto Putar</span>
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
      </div>
    </ModalPortal>
  );
}
