// frontend/src/components/AdaptiveEduGameModal.tsx
// Game Edukasi 3D Roblox-Style Adventure & Interactive Matching (FULLSCREEN + BGM + LONG ROUTE)
// 100% Gratis, Instan, Tanpa Login Eksternal, Layar Penuh dengan 5 Pulau Sila Pancasila

"use client";

import ModalPortal from "@/components/ModalPortal";
import {
  playBadgeFanfareSound,
  playClickSound,
  playCoinSound,
  playCorrectSound,
  playJumpSound,
  playRobotAwakeSound,
  playWrongSound,
  startAdventureBgm,
  stopAdventureBgm,
} from "@/lib/soundEffects";
import { useUIStore } from "@/lib/store/useUIStore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chapter: string;
  chapterTitle?: string;
}

// Model Quest di Sepanjang Rute 5 Pulau Sila
interface SilaQuest {
  silaNumber: number;
  worldX: number;
  islandName: string;
  silaTitle: string;
  symbol: string;
  npcName: string;
  npcAvatar: string;
  story: string;
  question: string;
  options: {
    text: string;
    isRight: boolean;
    explanation: string;
    points: number;
  }[];
  completed?: boolean;
}

// Model Kartu Menjodohkan
interface MatchingPair {
  id: string;
  left: string;
  right: string;
  hint: string;
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
  const [dynamicSummary, setDynamicSummary] = useState<string[]>([]);
  const [bgmEnabled, setBgmEnabled] = useState(true);

  // Ambil intisari materi modul
  useEffect(() => {
    let isMounted = true;
    const fetchContent = async () => {
      try {
        const res = await fetch(`/api/content?chapter=${encodeURIComponent(chapter)}&mode=cerita`);
        const json = await res.json();
        if (isMounted && json && json.body && Array.isArray(json.body)) {
          setDynamicSummary(json.body);
          if (json.title) {
            setResolvedTitle(json.title.replace("Ringkasan Modul & Pengamalan: ", ""));
          }
        }
      } catch {
        if (isMounted && activeValidatedModule?.ragSummary) {
          setDynamicSummary(activeValidatedModule.ragSummary);
          setResolvedTitle(activeValidatedModule.title);
        }
      }
    };
    fetchContent();
    return () => {
      isMounted = false;
    };
  }, [chapter, activeValidatedModule]);

  // Deteksi genre otomatis (Matching vs 3D Roblox Adventure)
  const isMatchingGenre = useMemo(() => {
    const c = (chapter || "").toLowerCase();
    const t = (resolvedTitle || "").toLowerCase();
    const s = dynamicSummary.join(" ").toLowerCase();
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
      t.includes("pandhawa") ||
      t.includes("kosakata") ||
      s.includes("aksara") ||
      s.includes("krama")
    );
  }, [chapter, resolvedTitle, dynamicSummary]);

  const gameType: "adventure" | "matching" = isMatchingGenre ? "matching" : "adventure";

  // --------------------------------------------------------------------------
  // BAGIAN 1: SISTEM GAME 3D ROBLOX-STYLE PETUALANGAN 5 PULAU SILA
  // --------------------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // State Karakter Roblox
  const [playerState, setPlayerState] = useState<{
    x: number;
    y: number;
    vy: number;
    isJumping: boolean;
    facing: "left" | "right";
    animFrame: number;
  }>({
    x: 100,
    y: 350,
    vy: 0,
    isJumping: false,
    facing: "right",
    animFrame: 0,
  });

  const [cameraX, setCameraX] = useState(0);
  const [activeQuest, setActiveQuest] = useState<SilaQuest | null>(null);
  const [selectedQuestOption, setSelectedQuestOption] = useState<number | null>(null);
  const [questFeedback, setQuestFeedback] = useState<string | null>(null);
  const [adventureScore, setAdventureScore] = useState(0);
  const [adventureFinished, setAdventureFinished] = useState(false);

  // 5 PULAU PANJANG DENGAN MISI PER SILA PANCASILA
  const initialQuests: SilaQuest[] = useMemo(() => {
    return [
      {
        silaNumber: 1,
        worldX: 360,
        islandName: "Pulau Bintang Toleransi (Sila 1)",
        silaTitle: "Ketuhanan Yang Maha Esa",
        symbol: "⭐",
        npcName: "Samuel & Siti",
        npcAvatar: "👦👧",
        story: "Di taman doa keberagaman, Samuel hendak melaksanakan ibadah hari Minggu.",
        question: "Teman-temanmu sedang asyik bermain sepak bola di dekat tempat ibadah. Sikapmu?",
        options: [
          {
            text: "Mengecilkan suara permainan dan menghormati teman yang sedang beribadah dengan tenang.",
            isRight: true,
            explanation: "Bagus sekali! Sila 1 mengajarkan toleransi dan saling menghormati antarumat beragama.",
            points: 10,
          },
          {
            text: "Berteriak keras di depan tempat ibadah karena merasa sedang bermain di tempat umum.",
            isRight: false,
            explanation: "Kurang terpuji. Kita harus selalu menghargai ketenangan orang yang beribadah.",
            points: 0,
          },
        ],
      },
      {
        silaNumber: 2,
        worldX: 860,
        islandName: "Pulau Rantai Kemanusiaan (Sila 2)",
        silaTitle: "Kemanusiaan yang Adil dan Beradab",
        symbol: "⛓️",
        npcName: "Doni Terjatuh",
        npcAvatar: "🚲",
        story: "Doni tergelincir dari sepedanya di jembatan berbatu dan lututnya terluka.",
        question: "Doni menangis kesakitan dan bukunya berserakan di jalan. Tindakanmu?",
        options: [
          {
            text: "Segera menghampiri, membantu Doni berdiri, dan mengantarkannya ke ruang UKS.",
            isRight: true,
            explanation: "Hebat! Sila ke-2 mengajarkan cinta kasih dan tolong-menolong sesama manusia.",
            points: 10,
          },
          {
            text: "Menertawakan Doni lalu melanjutkan lari meninggalkan dia sendirian.",
            isRight: false,
            explanation: "Tidak baik. Jangan menertawakan kawan yang tertimpa musibah.",
            points: 0,
          },
        ],
      },
      {
        silaNumber: 3,
        worldX: 1360,
        islandName: "Pulau Pohon Beringin Persatuan (Sila 3)",
        silaTitle: "Persatuan Indonesia",
        symbol: "🌳",
        npcName: "Kawan Bhinneka",
        npcAvatar: "🤝",
        story: "Ada siswa baru pindahan dari luar pulau yang belum mempunyai kelompok bermain kasti.",
        question: "Sebagian temanmu ragu mengajaknya karena logat bicaranya berbeda. Sikapmu?",
        options: [
          {
            text: "Mengajaknya masuk ke dalam regu kasti dengan ramah dan gembira tanpa membeda-bedakan suku.",
            isRight: true,
            explanation: "Bintang 5! Sila ke-3 mengajarkan persatuan dan kerukunan seluruh anak Indonesia.",
            points: 10,
          },
          {
            text: "Menjauhinya dan membentuk kelompok bermain khusus yang sesuku saja.",
            isRight: false,
            explanation: "Salah. Membeda-bedakan teman bertentangan dengan semboyan Bhinneka Tunggal Ika.",
            points: 0,
          },
        ],
      },
      {
        silaNumber: 4,
        worldX: 1860,
        islandName: "Pulau Kepala Banteng Musyawarah (Sila 4)",
        silaTitle: "Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan dalam Permusyawaratan/Perwakilan",
        symbol: "🐂",
        npcName: "Wali Kelas & Ketua Murid",
        npcAvatar: "🏛️",
        story: "Di Balai Kelas, sedang diadakan pemilihan tujuan karya wisata sekolah.",
        question: "Pendapat pilihan tempatmu berbeda dengan hasil keputusan musyawarah suara terbanyak.",
        options: [
          {
            text: "Menerima hasil keputusan musyawarah dengan ikhlas, lapang dada, dan ikut mendukung penuh.",
            isRight: true,
            explanation: "Bijak sekali! Sila ke-4 menjunjung tinggi musyawarah mufakat dan menghargai keputusan bersama.",
            points: 10,
          },
          {
            text: "Marah-marah dan mogok tidak mau ikut karena usulmu tidak terpilih.",
            isRight: false,
            explanation: "Kurang dewasa. Keputusan bersama hasil musyawarah harus kita hormati bersama.",
            points: 0,
          },
        ],
      },
      {
        silaNumber: 5,
        worldX: 2360,
        islandName: "Pulau Padi & Kapas Keadilan (Sila 5)",
        silaTitle: "Keadilan Sosial bagi Seluruh Rakyat Indonesia",
        symbol: "🌾",
        npcName: "Regu Piket Sekolah",
        npcAvatar: "⚖️",
        story: "Tiba di pos akhir Pulau Kemakmuran, regu piket sedang membagi tugas membersihkan kelas.",
        question: "Bagaimana cara membagi tugas piket kebersihan kelas yang paling adil?",
        options: [
          {
            text: "Membagi tugas secara merata: semua anak mendapat bagian (menyapu, mengepel, mengelap kaca) secara adil.",
            isRight: true,
            explanation: "Sempurna! Sila ke-5 mewujudkan keadilan sosial dan tidak membebani satu orang saja.",
            points: 10,
          },
          {
            text: "Menyuruh siswa yang paling pendiam mengerjakan semua tugas sementara yang lain bermain.",
            isRight: false,
            explanation: "Sangat tidak adil. Keadilan harus dirasakan oleh semua anggota kelompok.",
            points: 0,
          },
        ],
      },
    ];
  }, []);

  const [quests, setQuests] = useState<SilaQuest[]>(initialQuests);

  // Kontrol Background Music Ceria
  useEffect(() => {
    if (isOpen) {
      if (bgmEnabled) {
        startAdventureBgm();
      }
    }
    return () => {
      stopAdventureBgm();
    };
  }, [isOpen, bgmEnabled]);

  // Reset Game Petualangan
  useEffect(() => {
    setQuests(initialQuests);
    setPlayerState({
      x: 100,
      y: 350,
      vy: 0,
      isJumping: false,
      facing: "right",
      animFrame: 0,
    });
    setCameraX(0);
    setActiveQuest(null);
    setSelectedQuestOption(null);
    setQuestFeedback(null);
    setAdventureScore(0);
    setAdventureFinished(false);
  }, [initialQuests, chapter]);

  // Gerakan Melompat (Roblox Jump)
  const jumpPlayer = useCallback(() => {
    if (activeQuest) return;
    setPlayerState((prev) => {
      if (prev.isJumping) return prev;
      playJumpSound();
      return { ...prev, vy: -14, isJumping: true };
    });
  }, [activeQuest]);

  // Gerakan Kiri/Kanan
  const movePlayerH = useCallback(
    (dx: number, dir: "left" | "right") => {
      if (activeQuest) return;

      setPlayerState((prev) => {
        const nx = Math.max(40, Math.min(2700, prev.x + dx));

        // Cek proximity quest
        for (const q of quests) {
          if (Math.abs(nx - q.worldX) < 45 && !q.completed) {
            setActiveQuest(q);
            setSelectedQuestOption(null);
            setQuestFeedback(null);
            playRobotAwakeSound();
            break;
          }
        }

        return {
          ...prev,
          x: nx,
          facing: dir,
          animFrame: prev.animFrame + 1,
        };
      });
    },
    [activeQuest, quests]
  );

  // Loop Fisika & Gravitasi Lompatan
  useEffect(() => {
    if (gameType !== "adventure" || !isOpen) return;

    const gravity = 0.8;
    const groundY = 350;

    const interval = setInterval(() => {
      setPlayerState((prev) => {
        if (!prev.isJumping && prev.y === groundY) return prev;

        let nextY = prev.y + prev.vy;
        let nextVy = prev.vy + gravity;
        let isJumping = true;

        if (nextY >= groundY) {
          nextY = groundY;
          nextVy = 0;
          isJumping = false;
        }

        return {
          ...prev,
          y: nextY,
          vy: nextVy,
          isJumping,
        };
      });

      // Kamera dinamis mengikuti posisi X karakter (Third-Person Tracking)
      setPlayerState((p) => {
        setCameraX((cam) => {
          const targetCam = Math.max(0, p.x - 350);
          return cam + (targetCam - cam) * 0.15;
        });
        return p;
      });
    }, 24);

    return () => clearInterval(interval);
  }, [gameType, isOpen]);

  // Keyboard Event Listener (Panah, WASD, Spasi untuk Lompat)
  useEffect(() => {
    if (gameType !== "adventure" || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        movePlayerH(18, "right");
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        movePlayerH(-18, "left");
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === " " || e.key === "W") {
        e.preventDefault();
        jumpPlayer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameType, isOpen, movePlayerH, jumpPlayer]);

  // -------------------------------------------------------------
  // RENDER CANVASS 3D ROBLOX-STYLE GRAPHICS ENGINE
  // -------------------------------------------------------------
  useEffect(() => {
    if (gameType !== "adventure") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const W = canvas.width;
      const H = canvas.height;

      // 1. Langit 3D Roblox (Gradient Sky + Cloud Mesh)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, "#38bdf8"); // Cerah Roblox Sky
      skyGrad.addColorStop(0.65, "#bae6fd");
      skyGrad.addColorStop(1, "#f0fdf4");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Matahari 3D
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(W - 120, 90, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(254, 240, 138, 0.4)";
      ctx.beginPath();
      ctx.arc(W - 120, 90, 65, 0, Math.PI * 2);
      ctx.fill();

      // Pegunungan 3D di Latar Belakang (Parallax)
      const drawMountain = (mx: number, my: number, mw: number, mh: number, color: string) => {
        const screenX = mx - cameraX * 0.2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(screenX, my);
        ctx.lineTo(screenX + mw / 2, my - mh);
        ctx.lineTo(screenX + mw, my);
        ctx.fill();
      };

      drawMountain(100, 350, 450, 220, "#93c5fd");
      drawMountain(450, 350, 500, 260, "#60a5fa");
      drawMountain(900, 350, 550, 240, "#93c5fd");
      drawMountain(1400, 350, 600, 280, "#60a5fa");
      drawMountain(1900, 350, 500, 250, "#93c5fd");

      // 2. MENGGAMBAR 5 PULAU BESAR 3D BLOCKY VOXEL PLATFORMS
      const draw3DBlockyIsland = (
        islandX: number,
        width: number,
        name: string,
        symbol: string,
        bgColor: string,
        sideColor: string
      ) => {
        const sx = islandX - cameraX;
        const topY = 350;
        const depth = 90;

        // Muka Atas Blok 3D
        ctx.fillStyle = bgColor;
        ctx.fillRect(sx, topY, width, 18);

        // Muka Samping / Tebing Blok 3D
        ctx.fillStyle = sideColor;
        ctx.fillRect(sx, topY + 18, width, depth);

        // Grid Voxel Lines (Roblox Block Texture)
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 2;
        for (let bx = 0; bx < width; bx += 30) {
          ctx.beginPath();
          ctx.moveTo(sx + bx, topY);
          ctx.lineTo(sx + bx, topY + 18 + depth);
          ctx.stroke();
        }

        // Teks Label Pulau Sila Melayang
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${symbol} ${name}`, sx + width / 2, topY - 140);

        // Tiang Obby Monumen Simbol 3D Berputar
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(sx + width / 2 - 8, topY - 95, 16, 95);

        // Icon Simbol Raksasa Melayang
        ctx.font = "40px sans-serif";
        ctx.fillText(symbol, sx + width / 2, topY - 105);
      };

      // 5 Pulau Sila
      draw3DBlockyIsland(60, 460, "Sila 1: Bintang Toleransi", "⭐", "#4ade80", "#15803d");
      draw3DBlockyIsland(620, 460, "Sila 2: Rantai Kemanusiaan", "⛓️", "#fbbf24", "#b45309");
      draw3DBlockyIsland(1180, 460, "Sila 3: Pohon Beringin Persatuan", "🌳", "#22c55e", "#166534");
      draw3DBlockyIsland(1740, 460, "Sila 4: Kepala Banteng Musyawarah", "🐂", "#f87171", "#991b1b");
      draw3DBlockyIsland(2300, 460, "Sila 5: Padi & Kapas Keadilan", "🌾", "#eab308", "#854d0e");

      // 3. Jembatan Gantung Kayu 3D Antar Pulau (Suspension Bridges)
      const draw3DBridge = (bx: number, bw: number) => {
        const sx = bx - cameraX;
        ctx.fillStyle = "#78350f"; // Tali
        ctx.fillRect(sx, 355, bw, 4);
        ctx.fillStyle = "#d97706"; // Papan kayu
        for (let px = 0; px < bw; px += 20) {
          ctx.fillRect(sx + px, 350, 14, 12);
        }
      };

      draw3DBridge(520, 100);
      draw3DBridge(1080, 100);
      draw3DBridge(1640, 100);
      draw3DBridge(2200, 100);

      // Garis Finish Tropi Emas di Pulau 5
      const finishSx = 2650 - cameraX;
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(finishSx, 260, 12, 90);
      ctx.font = "44px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🏆", finishSx + 6, 240);
      ctx.font = "bold 14px sans-serif";
      ctx.fillStyle = "#78350f";
      ctx.fillText("GARIS FINISH JUARA!", finishSx + 6, 200);

      // 4. MENGGAMBAR NPCs / KAWAN DI TIAP PULAU SILA
      quests.forEach((q) => {
        const qx = q.worldX - cameraX;
        const qy = 350;

        // Efek Aura Zona Sila
        ctx.fillStyle = q.completed ? "rgba(34, 197, 94, 0.25)" : "rgba(250, 204, 21, 0.4)";
        ctx.beginPath();
        ctx.arc(qx, qy - 25, 32, 0, Math.PI * 2);
        ctx.fill();

        // Karakter NPC (Blok Roblox NPC)
        ctx.font = "32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(q.npcAvatar, qx, qy - 10);

        // Tanda Status Melayang
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = q.completed ? "#16a34a" : "#dc2626";
        ctx.fillText(q.completed ? "✓ SELESAI" : "! MISI", qx, qy - 48);

        // Nama NPC
        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.fillText(q.npcName, qx, qy + 14);
      });

      // 5. MENGGAMBAR KARAKTER UTAMA 3D ROBLOX AVATAR
      const px = playerState.x - cameraX;
      const py = playerState.y;

      // Bayangan 3D di Tanah
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      const shadowSize = Math.max(8, 22 - (350 - py) * 0.15);
      ctx.ellipse(px, 352, shadowSize, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Celana Putih Roblox (Dua Kaki Kotak)
      const legSwing = Math.sin(playerState.animFrame * 0.4) * 5;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px - 10, py - 20 + (playerState.isJumping ? -4 : legSwing), 8, 20); // Kaki Kiri
      ctx.fillRect(px + 2, py - 20 + (playerState.isJumping ? -4 : -legSwing), 8, 20); // Kaki Kanan
      // Sepatu Hitam
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(px - 11, py - 3, 9, 5);
      ctx.fillRect(px + 1, py - 3, 9, 5);

      // Badan Kotak Baju Merah Roblox
      ctx.fillStyle = "#ef4444"; // Merah SD
      ctx.fillRect(px - 14, py - 46, 28, 26);
      // Dasi Merah
      ctx.fillStyle = "#b91c1c";
      ctx.fillRect(px - 2, py - 44, 4, 16);

      // Tangan Kotak Berayun
      ctx.fillStyle = "#fca5a5";
      ctx.fillRect(px - 20, py - 44 - legSwing, 6, 18);
      ctx.fillRect(px + 14, py - 44 + legSwing, 6, 18);

      // Kepala Kotak Khas Roblox
      ctx.fillStyle = "#fed7aa"; // Kulit cerah
      ctx.fillRect(px - 11, py - 68, 22, 22);

      // Topi Merah Petualang SD
      ctx.fillStyle = "#b91c1c";
      ctx.fillRect(px - 13, py - 73, 26, 7);
      ctx.fillRect(px - 10, py - 81, 20, 9);

      // Wajah Senyum Roblox (Classic Roblox Smile)
      ctx.fillStyle = "#0f172a";
      const eyeDir = playerState.facing === "right" ? 2 : -2;
      ctx.fillRect(px - 5 + eyeDir, py - 60, 3, 4); // Mata Kiri
      ctx.fillRect(px + 3 + eyeDir, py - 60, 3, 4); // Mata Kanan
      // Senyum
      ctx.beginPath();
      ctx.arc(px + eyeDir, py - 54, 4, 0, Math.PI, false);
      ctx.stroke();

      // Label Nama Pemain Melayang
      ctx.fillStyle = "#15803d";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Kamu (Petualang SD)", px, py - 88);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [playerState, cameraX, quests, gameType]);

  // Handler Pilihan Dialog Quest
  const handleSelectQuestOption = (optIdx: number) => {
    if (!activeQuest || selectedQuestOption !== null) return;
    setSelectedQuestOption(optIdx);

    const opt = activeQuest.options[optIdx];
    if (!opt) return;

    if (opt.isRight) {
      playCorrectSound();
      playCoinSound();
      setAdventureScore((prev) => prev + opt.points);
      setQuestFeedback(`🎉 TEPAT SEKALI! ${opt.explanation}`);

      setQuests((prev) =>
        prev.map((q) => (q.silaNumber === activeQuest.silaNumber ? { ...q, completed: true } : q))
      );
    } else {
      playWrongSound();
      setQuestFeedback(`💡 CATATAN BELAJAR: ${opt.explanation}`);
    }
  };

  const handleCloseQuestDialogue = () => {
    playClickSound();
    setActiveQuest(null);
    setSelectedQuestOption(null);
    setQuestFeedback(null);

    // Cek apakah 5 pulau sudah selesai
    const remaining = quests.filter((q) => !q.completed);
    if (remaining.length === 0) {
      setAdventureFinished(true);
      playBadgeFanfareSound();
      addPoints(25);
    }
  };

  // --------------------------------------------------------------------------
  // BAGIAN 2: GAME MENJODOHKAN (BASA JAWA) DENGAN SOUND & MUSIK CERIA
  // --------------------------------------------------------------------------
  const matchingPairs: MatchingPair[] = useMemo(() => {
    const c = (chapter || "").toLowerCase();
    const t = (resolvedTitle || "").toLowerCase();

    if (c.includes("punokawan") || t.includes("punokawan")) {
      return [
        { id: "1", left: "Semar", right: "Kuncung Putih & Bapak Bijaksana", hint: "Tokoh paling sepuh" },
        { id: "2", left: "Gareng", right: "Sikil Jinjit & Tangan Ceko", hint: "Waspada lan ngati-ati" },
        { id: "3", left: "Petruk", right: "Irung Dawa & Seneng Guyon", hint: "Awak dhuwur langsing" },
        { id: "4", left: "Bagong", right: "Awak Bunder Lemu & Jujur", hint: "Anak bungsu Semar" },
      ];
    }

    if (c.includes("pandhawa") || t.includes("pandhawa")) {
      return [
        { id: "1", left: "Puntadewa", right: "Pambarep Pandhawa, Jujur & Getih Putih", hint: "Ratu ing Amarta" },
        { id: "2", left: "Werkudara", right: "Gagah Gedhe, Kuku Pancanaka, Jujur", hint: "Satria ing Jodhipati" },
        { id: "3", left: "Janaka (Arjuna)", right: "Pinter Manah & Bagus Rupane", hint: "Satria ing Madukara" },
        { id: "4", left: "Nakula & Sadewa", right: "Satria Kembar, Setya & Pinter Ngrumat Jaran", hint: "Satria kembar" },
      ];
    }

    if (c.includes("unggah") || t.includes("unggah")) {
      return [
        { id: "1", left: "Mangan (Ngoko)", right: "Dahar (Krama Inggil)", hint: "Kanggo Bapak / Ibu Guru" },
        { id: "2", left: "Turu (Ngoko)", right: "Sare (Krama Inggil)", hint: "Kanggo Istirahat wengi" },
        { id: "3", left: "Lunga (Ngoko)", right: "Tindak (Krama Inggil)", hint: "Menyang kantor / sekolah" },
        { id: "4", left: "Tuku (Ngoko)", right: "Mundhut (Krama Inggil)", hint: "Tuku barang ing toko" },
        { id: "5", left: "Kowe (Ngoko)", right: "Panjenengan (Krama Inggil)", hint: "Sebutan kurmat" },
      ];
    }

    return [
      { id: "1", left: "ꦲ (Ha)", right: "Hana / Caraka (Bunyi H / A)", hint: "Aksara kapisan" },
      { id: "2", left: "ꦤ (Na)", right: "Nata / Nampa (Bunyi N)", hint: "Aksara kapindho" },
      { id: "3", left: "ꦕ (Ca)", right: "Catur / Cara (Bunyi C)", hint: "Aksara katelu" },
      { id: "4", left: "ꦫ (Ra)", right: "Rasa / Ratu (Bunyi R)", hint: "Aksara kapapat" },
      { id: "5", left: "ꦏ (Ka)", right: "Karya / Kayu (Bunyi K)", hint: "Aksara kalima" },
    ];
  }, [chapter, resolvedTitle]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [matchingScore, setMatchingScore] = useState(0);
  const [matchingFinished, setMatchingFinished] = useState(false);
  const [shuffledRights, setShuffledRights] = useState<MatchingPair[]>([]);

  useEffect(() => {
    if (gameType === "matching") {
      const copy = [...matchingPairs].sort(() => Math.random() - 0.5);
      setShuffledRights(copy);
      setMatchedIds([]);
      setSelectedLeft(null);
      setMatchingScore(0);
      setMatchingFinished(false);
    }
  }, [gameType, matchingPairs]);

  const handleLeftCardClick = (id: string) => {
    if (matchedIds.includes(id)) return;
    playClickSound();
    setSelectedLeft(id);
  };

  const handleRightCardClick = (id: string) => {
    if (!selectedLeft) {
      playWrongSound();
      return;
    }
    if (matchedIds.includes(id)) return;

    if (selectedLeft === id) {
      playCorrectSound();
      playCoinSound();
      const updated = [...matchedIds, id];
      setMatchedIds(updated);
      setSelectedLeft(null);
      setMatchingScore((prev) => prev + 10);

      if (updated.length === matchingPairs.length) {
        setMatchingFinished(true);
        playBadgeFanfareSound();
        addPoints(25);
      }
    } else {
      playWrongSound();
      setSelectedLeft(null);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      {/* FULLSCREEN TOTAL: LAYAR PENUH 100vw x 100vh */}
      <div
        className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="roblox-game-title"
      >
        {/* HUD TOP BAR ROBLOX EDITION */}
        <header className="h-14 bg-slate-900/95 border-b-2 border-yellow-400 text-white px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-lg z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-xl shadow-md shrink-0">
              {gameType === "adventure" ? "🗺️" : "🧩"}
            </span>
            <div className="min-w-0">
              <h2 id="roblox-game-title" className="font-black text-sm sm:text-base text-yellow-300 truncate tracking-wide">
                {gameType === "adventure"
                  ? "PETUALANGAN 3D ROBLOX: JELAJAH 5 PULAU PANCASILA"
                  : "TEKA-TEKI MENJODOHKAN KARTU CERIA"}
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                Materi: {resolvedTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Skor Koin & Poin */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-full border border-yellow-400/50">
              <span className="text-xs font-black text-yellow-300">
                🪙 {gameType === "adventure" ? adventureScore : matchingScore} Koin
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-black text-emerald-400">
                ⭐ +25 Poin
              </span>
            </div>

            {/* Toggle Suara Musik BGM */}
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
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                bgmEnabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300"
              }`}
            >
              <span>{bgmEnabled ? "🔊" : "🔇"}</span>
              <span className="hidden sm:inline">Musik: {bgmEnabled ? "ON" : "OFF"}</span>
            </button>

            {/* Tombol Keluar Layar Penuh */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                stopAdventureBgm();
                onClose();
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-1.5 rounded-full text-xs shadow-md transition hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>✕</span>
              <span>Keluar Game</span>
            </button>
          </div>
        </header>

        {/* CONTAINER ARENA FULLSCREEN */}
        <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col items-center justify-center bg-slate-900">
          {gameType === "adventure" ? (
            // =========================================================
            // GAME 3D ROBLOX ADVENTURE CANVAS (5 SILA LONG ROUTE)
            // =========================================================
            adventureFinished ? (
              <div className="text-center py-8 px-6 bg-slate-900/95 border-4 border-yellow-400 rounded-3xl shadow-2xl max-w-lg space-y-4 animate-in zoom-in-95 z-30 text-white">
                <div className="w-24 h-24 bg-yellow-400/20 rounded-full mx-auto flex items-center justify-center text-5xl shadow-inner border-2 border-yellow-400 animate-bounce">
                  🏆
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-2xl text-yellow-300">
                    SELAMAT! KAMU JUARA 5 SILA PANCASILA!
                  </h3>
                  <p className="text-sm font-medium text-slate-300">
                    Kamu berhasil menuntaskan seluruh rute petualangan dari Sila ke-1 sampai Sila ke-5!
                  </p>
                </div>
                <div className="inline-flex items-center gap-3 bg-yellow-400/20 text-yellow-300 font-black px-5 py-2.5 rounded-2xl border border-yellow-400 text-sm">
                  <span>⭐ Poin Prestasi: +25 Poin</span>
                  <span>•</span>
                  <span>Skor Koin: {adventureScore} Koin</span>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setQuests(initialQuests);
                      setPlayerState({
                        x: 100,
                        y: 350,
                        vy: 0,
                        isJumping: false,
                        facing: "right",
                        animFrame: 0,
                      });
                      setCameraX(0);
                      setActiveQuest(null);
                      setSelectedQuestOption(null);
                      setQuestFeedback(null);
                      setAdventureScore(0);
                      setAdventureFinished(false);
                    }}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-3 px-8 rounded-full shadow-lg transition text-sm cursor-pointer"
                  >
                    🔄 Main Petualangan dari Awal
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center">
                {/* CANVAS UTAMA LAYAR PENUH */}
                <canvas
                  ref={canvasRef}
                  width={1100}
                  height={560}
                  className="w-full h-full object-cover block cursor-crosshair"
                />

                {/* PROGRESS BAR 5 SILA DI ATAS CANVAS */}
                <div className="absolute top-3 inset-x-4 sm:inset-x-12 z-20 flex items-center justify-between gap-1.5 sm:gap-3 bg-slate-900/80 backdrop-blur-md p-2.5 rounded-2xl border border-yellow-400/40">
                  {quests.map((q) => (
                    <div
                      key={q.silaNumber}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-center text-xs font-black transition flex items-center justify-center gap-1.5 ${
                        q.completed
                          ? "bg-emerald-600 text-white shadow-sm"
                          : Math.abs(playerState.x - q.worldX) < 180
                          ? "bg-yellow-400 text-slate-950 ring-2 ring-yellow-300 animate-pulse"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <span>{q.symbol}</span>
                      <span className="hidden md:inline">Sila {q.silaNumber}</span>
                      {q.completed && <span>✓</span>}
                    </div>
                  ))}
                </div>

                {/* POPUP TANTANGAN DIALOG KETIKA MENEMUI NPC DI PULAU */}
                {activeQuest && (
                  <div className="absolute inset-x-4 sm:inset-x-auto sm:w-[540px] bottom-24 sm:bottom-20 z-30 bg-slate-900/95 backdrop-blur-xl p-5 rounded-3xl border-3 border-yellow-400 shadow-2xl animate-in slide-in-from-bottom-6 text-white space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{activeQuest.npcAvatar}</span>
                        <div>
                          <div className="text-xs font-black text-yellow-400 uppercase tracking-wide">
                            {activeQuest.islandName}
                          </div>
                          <div className="font-black text-base text-white">
                            {activeQuest.npcName}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs bg-yellow-400 text-slate-950 font-black px-3 py-1 rounded-full">
                        Misi Sila {activeQuest.silaNumber}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed">
                      {activeQuest.question}
                    </p>

                    {/* Opsi Pilihan */}
                    <div className="space-y-2 pt-1">
                      {activeQuest.options.map((opt, oIdx) => {
                        const isSelected = selectedQuestOption === oIdx;
                        let btnStyle =
                          "border-slate-700 bg-slate-800/80 hover:border-yellow-400 hover:bg-slate-800";
                        if (isSelected) {
                          btnStyle = opt.isRight
                            ? "bg-emerald-600 border-emerald-400 text-white"
                            : "bg-rose-600 border-rose-400 text-white";
                        }
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={selectedQuestOption !== null}
                            onClick={() => handleSelectQuestOption(oIdx)}
                            className={`w-full text-left p-3 rounded-2xl border-2 font-medium text-xs sm:text-sm transition flex items-start gap-3 cursor-pointer ${btnStyle}`}
                          >
                            <span className="w-6 h-6 rounded-lg bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {oIdx === 0 ? "A" : "B"}
                            </span>
                            <span className="flex-1 leading-snug">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback dan Lanjut */}
                    {questFeedback && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-700">
                        <p className="text-xs font-bold text-yellow-200">
                          {questFeedback}
                        </p>
                        <button
                          type="button"
                          onClick={handleCloseQuestDialogue}
                          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-black py-2.5 px-5 rounded-2xl shadow-lg transition text-xs sm:text-sm cursor-pointer"
                        >
                          Lanjut Petualangan ke Pulau Berikutnya ➡️
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* KONTROL ON-SCREEN TOUCH & MOUSE (ROBLOX CONTROLLER DI SUDUT BAWAH) */}
                <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between pointer-events-none">
                  {/* D-Pad Navigasi Kiri / Kanan */}
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => movePlayerH(-28, "left")}
                      className="w-16 h-14 rounded-2xl bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-950 text-white border-2 border-yellow-400/60 font-black text-xl shadow-xl transition active:scale-90 flex items-center justify-center cursor-pointer backdrop-blur-md"
                      aria-label="Jalan Kiri"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      onClick={() => movePlayerH(28, "right")}
                      className="w-16 h-14 rounded-2xl bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-950 text-white border-2 border-yellow-400/60 font-black text-xl shadow-xl transition active:scale-90 flex items-center justify-center cursor-pointer backdrop-blur-md"
                      aria-label="Jalan Kanan"
                    >
                      ▶
                    </button>
                  </div>

                  {/* Tombol Loncat Roblox (Jump Button) */}
                  <div className="pointer-events-auto">
                    <button
                      type="button"
                      onClick={jumpPlayer}
                      className="h-14 px-7 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-950 font-black text-sm sm:text-base shadow-2xl transition active:scale-90 flex items-center gap-2 cursor-pointer border-2 border-white"
                      aria-label="Lompat"
                    >
                      <span>🦘</span>
                      <span>LOMPAT (SPASI)</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            // =========================================================
            // GAME MENJODOHKAN (BASA JAWA) DENGAN MUSIK & SOUND
            // =========================================================
            <div className="w-full max-w-4xl p-6 sm:p-10 flex flex-col items-center justify-center text-white space-y-6">
              {matchingFinished ? (
                <div className="text-center py-8 space-y-4 animate-in zoom-in-95 bg-slate-900/95 p-8 rounded-3xl border-3 border-emerald-400 shadow-2xl">
                  <div className="w-24 h-24 bg-emerald-500/20 rounded-full mx-auto flex items-center justify-center text-5xl shadow-inner border-2 border-emerald-400">
                    🎉
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-2xl text-emerald-400">
                      Pinter Banget! Semua Pasangan Cocok!
                    </h3>
                    <p className="text-sm font-medium text-slate-300">
                      Kamu berhasil mencocokkan seluruh kartu untuk materi {resolvedTitle}!
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-3 bg-emerald-500/20 text-emerald-300 font-black px-5 py-2 rounded-2xl border border-emerald-400 text-sm">
                    <span>⭐ Poin Prestasi: +25 Poin</span>
                    <span>•</span>
                    <span>Skor Cocok: {matchingScore} Koin</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        const copy = [...matchingPairs].sort(() => Math.random() - 0.5);
                        setShuffledRights(copy);
                        setMatchedIds([]);
                        setSelectedLeft(null);
                        setMatchingScore(0);
                        setMatchingFinished(false);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-8 rounded-full shadow-lg transition text-sm cursor-pointer"
                    >
                      🔄 Mainkan Lagi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <div className="text-center text-xs sm:text-sm font-bold text-yellow-300 bg-slate-800/80 p-3 rounded-2xl border border-yellow-400/40">
                    👉 Klik 1 kartu di sebelah <b>Kiri</b>, lalu klik pasangan artinya di sebelah <b>Kanan</b>!
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {/* KOLOM KIRI */}
                    <div className="space-y-3">
                      <div className="text-center font-black text-xs sm:text-sm text-yellow-300 bg-yellow-950/60 border border-yellow-500/40 py-2 rounded-xl">
                        Simbol / Istilah
                      </div>
                      {matchingPairs.map((pair) => {
                        const isDone = matchedIds.includes(pair.id);
                        const isSelected = selectedLeft === pair.id;
                        return (
                          <button
                            key={pair.id}
                            type="button"
                            disabled={isDone}
                            onClick={() => handleLeftCardClick(pair.id)}
                            className={`w-full p-4 rounded-2xl border-2 font-bold text-sm sm:text-base text-left transition cursor-pointer ${
                              isDone
                                ? "bg-slate-800/40 text-slate-500 border-slate-800 line-through opacity-50"
                                : isSelected
                                ? "bg-yellow-400 text-slate-950 border-white scale-102 ring-4 ring-yellow-300 shadow-xl"
                                : "bg-slate-800/90 text-white border-slate-700 hover:border-yellow-400 hover:bg-slate-800"
                            }`}
                          >
                            <span className="font-black text-base sm:text-lg">{pair.left}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* KOLOM KANAN */}
                    <div className="space-y-3">
                      <div className="text-center font-black text-xs sm:text-sm text-sky-300 bg-sky-950/60 border border-sky-500/40 py-2 rounded-xl">
                        Pasangan Arti / Penjelasan
                      </div>
                      {shuffledRights.map((pair) => {
                        const isDone = matchedIds.includes(pair.id);
                        return (
                          <button
                            key={pair.id}
                            type="button"
                            disabled={isDone}
                            onClick={() => handleRightCardClick(pair.id)}
                            className={`w-full p-4 rounded-2xl border-2 font-bold text-xs sm:text-sm text-left transition cursor-pointer ${
                              isDone
                                ? "bg-emerald-950/30 text-emerald-500 border-emerald-900 line-through opacity-50"
                                : "bg-slate-800/90 text-white border-slate-700 hover:border-sky-400 hover:bg-slate-800"
                            }`}
                          >
                            <span>{pair.right}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
