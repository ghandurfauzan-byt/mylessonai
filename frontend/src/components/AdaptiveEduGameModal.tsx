// frontend/src/components/AdaptiveEduGameModal.tsx
// Game Edukasi 3D Roblox-Style: Petualangan Menjelajah Rumah Warga & Rintangan Obby 5 Sila Pancasila
// 100% Gratis, Instan, Tanpa Login Eksternal, Full-Screen + Musik BGM + Sound Effects Lengkap

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

// Model Rumah Warga Pancasila
interface VillageHouse {
  id: number;
  silaNumber: number;
  worldX: number;
  houseTitle: string;
  islandName: string;
  symbol: string;
  residentName: string;
  residentAvatar: string;
  roofColor: string;
  wallColor: string;
  story: string;
  question: string;
  options: {
    text: string;
    isRight: boolean;
    explanation: string;
    points: number;
  }[];
  visited?: boolean;
}

// Model Rintangan (Spikes / Lava Obby)
interface ObbyObstacle {
  id: number;
  x: number;
  width: number;
  type: "spikes" | "lava";
  label: string;
}

// Model Koin Emas Pancasila
interface GameCoin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

// Model Floating Text / Partikel Visual
interface ParticleEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
}

// Model Kartu Menjodohkan (Bahasa Jawa)
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
  const [gameStarted, setGameStarted] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);
  const [playerLives, setPlayerLives] = useState(3);

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
  // SISTEM GAME 3D ROBLOX: PETUALANGAN RUMAH WARGA & RINTANGAN OBBY
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
  const [activeHouse, setActiveHouse] = useState<VillageHouse | null>(null);
  const [nearbyHouse, setNearbyHouse] = useState<VillageHouse | null>(null);
  const [selectedHouseOption, setSelectedHouseOption] = useState<number | null>(null);
  const [houseFeedback, setHouseFeedback] = useState<string | null>(null);
  const [adventureScore, setAdventureScore] = useState(0);
  const [adventureFinished, setAdventureFinished] = useState(false);
  const [particles, setParticles] = useState<ParticleEffect[]>([]);

  // 5 RUMAH WARGA PANCASILA DI 5 PULAU
  const initialHouses: VillageHouse[] = useMemo(() => {
    return [
      {
        id: 1,
        silaNumber: 1,
        worldX: 340,
        houseTitle: "Rumah Damai Toleransi",
        islandName: "Pulau Bintang (Sila 1)",
        symbol: "⭐",
        residentName: "Keluarga Samuel & Siti",
        residentAvatar: "👦👧",
        roofColor: "#facc15",
        wallColor: "#38bdf8",
        story: "Tok tok tok! Pintu terbuka ramah. Samuel baru saja selesai beribadah hari Minggu, dan teman-teman mengajaknya bermain bola.",
        question: "Di samping rumah ibadah teman yang sedang beribadah khusyuk, sikap yang paling mulia adalah?",
        options: [
          {
            text: "Menjaga ketenangan dan tidak berteriak-teriak bising di dekat tempat ibadah.",
            isRight: true,
            explanation: "Tepat sekali! Sila 1 mengajarkan rasa saling menghormati dan toleransi beragama.",
            points: 15,
          },
          {
            text: "Sengaja menyalakan petasan di depan tempat ibadah.",
            isRight: false,
            explanation: "Tidak baik. Mengganggu ketenangan orang beribadah melanggar nilai toleransi.",
            points: 0,
          },
        ],
      },
      {
        id: 2,
        silaNumber: 2,
        worldX: 880,
        houseTitle: "Rumah Peduli Kemanusiaan",
        islandName: "Pulau Rantai (Sila 2)",
        symbol: "⛓️",
        residentName: "Doni & Nenek Sinta",
        residentAvatar: "👵🚲",
        roofColor: "#f97316",
        wallColor: "#fed7aa",
        story: "Pintu kayu terbuka. Nenek Sinta sedang merawat Doni yang lututnya terluka setelah terjatuh dari sepeda di jembatan bebatuan.",
        question: "Saat melihat teman atau tetangga jatuh sakit dan membutuhkan pertolongan, tindakanmu?",
        options: [
          {
            text: "Segera menolong, menjenguk, dan membantu membawakan obat atau keperluannya.",
            isRight: true,
            explanation: "Hebat! Sila ke-2 mengajarkan cinta kasih dan kepedulian terhadap sesama manusia.",
            points: 15,
          },
          {
            text: "Mengejek lukanya dan mengunggahnya ke media sosial untuk ditertawakan.",
            isRight: false,
            explanation: "Sangat tidak terpuji. Kita harus memperlakukan orang lain dengan adil dan beradab.",
            points: 0,
          },
        ],
      },
      {
        id: 3,
        silaNumber: 3,
        worldX: 1420,
        houseTitle: "Balai Budaya Bhinneka",
        islandName: "Pulau Beringin (Sila 3)",
        symbol: "🌳",
        residentName: "Kawan Bhinneka Nusantara",
        residentAvatar: "🤝🇮🇩",
        roofColor: "#22c55e",
        wallColor: "#86efac",
        story: "Pintu balai terbuka lebar. Warga desa dari berbagai suku (Jawa, Sunda, Batak, Papua) sedang berkumpul menyambut siswa pindahan baru.",
        question: "Ada kawan baru pindahan yang logat bicaranya berbeda dan belum fasih bahasa setempat. Sikapmu?",
        options: [
          {
            text: "Menyambutnya dengan ramah, mengajaknya bermain bersama, dan membantunya beradaptasi.",
            isRight: true,
            explanation: "Bintang lima! Sila ke-3 menyatukan seluruh anak bangsa tanpa membeda-bedakan asal-usul.",
            points: 15,
          },
          {
            text: "Menjauhinya dan menolak satu kelompok karena beda daerah.",
            isRight: false,
            explanation: "Salah. Membeda-bedakan suku bertentangan dengan semboyan Bhinneka Tunggal Ika.",
            points: 0,
          },
        ],
      },
      {
        id: 4,
        silaNumber: 4,
        worldX: 1960,
        houseTitle: "Balai Desa Musyawarah",
        islandName: "Pulau Banteng (Sila 4)",
        symbol: "🐂",
        residentName: "Pak RT & Ketua Murid",
        residentAvatar: "🏛️📋",
        roofColor: "#ef4444",
        wallColor: "#fecaca",
        story: "Di balai desa, warga sedang duduk melingkar bermusyawarah mufakat menentukan jadwal kerja bakti.",
        question: "Jika pendapat pribadimu kalah suara dalam keputusan musyawarah bersama kelas, sikapmu?",
        options: [
          {
            text: "Menerima hasil keputusan musyawarah dengan lapang dada dan ikut melaksanakannya dengan ikhlas.",
            isRight: true,
            explanation: "Sangat bijaksana! Sila ke-4 mengutamakan kepentingan bersama di atas kehendak pribadi.",
            points: 15,
          },
          {
            text: "Marah-marah dan merusak fasilitas balai pertemuan.",
            isRight: false,
            explanation: "Tidak baik. Keputusan musyawarah wajib dihormati oleh seluruh peserta.",
            points: 0,
          },
        ],
      },
      {
        id: 5,
        silaNumber: 5,
        worldX: 2500,
        houseTitle: "Lumbung Keadilan Warga",
        islandName: "Pulau Padi & Kapas (Sila 5)",
        symbol: "🌾",
        residentName: "Regu Gotong Royong",
        residentAvatar: "⚖️📦",
        roofColor: "#eab308",
        wallColor: "#fef08a",
        story: "Tiba di lumbung akhir! Warga sedang membagikan paket sembako dan bantuan secara adil dan merata kepada seluruh warga.",
        question: "Bagaimana cara membagi giliran tugas piket kebersihan kelas yang paling adil?",
        options: [
          {
            text: "Membagi jadwal merata: semua anak (laki-laki maupun perempuan) mendapat tugas seimbang.",
            isRight: true,
            explanation: "Sempurna! Sila ke-5 menegakkan keadilan sosial tanpa pilih kasih.",
            points: 15,
          },
          {
            text: "Menyerahkan semua beban piket hanya kepada anak yang tidak berani menolak.",
            isRight: false,
            explanation: "Sangat tidak adil. Keadilan harus ditegakkan untuk kebaikan bersama.",
            points: 0,
          },
        ],
      },
    ];
  }, []);

  // DAFTAR RINTANGAN OBBY DI JALANAN ANTAR RUMAH
  const obstacles: ObbyObstacle[] = useMemo(() => {
    return [
      { id: 1, x: 490, width: 34, type: "spikes", label: "Duri 🔺" },
      { id: 2, x: 730, width: 34, type: "spikes", label: "Duri 🔺" },
      { id: 3, x: 1040, width: 44, type: "lava", label: "Lava 🔥" },
      { id: 4, x: 1280, width: 34, type: "spikes", label: "Duri 🔺" },
      { id: 5, x: 1580, width: 44, type: "lava", label: "Lava 🔥" },
      { id: 6, x: 1820, width: 34, type: "spikes", label: "Duri 🔺" },
      { id: 7, x: 2120, width: 44, type: "lava", label: "Lava 🔥" },
      { id: 8, x: 2360, width: 34, type: "spikes", label: "Duri 🔺" },
    ];
  }, []);

  // 24 KOIN EMAS PANCASILA
  const initialCoins: GameCoin[] = useMemo(() => {
    const list: GameCoin[] = [];
    const spots = [
      { x: 180, y: 310 }, { x: 250, y: 310 }, { x: 420, y: 240 }, { x: 490, y: 200 },
      { x: 620, y: 310 }, { x: 710, y: 240 }, { x: 980, y: 310 }, { x: 1040, y: 200 },
      { x: 1180, y: 310 }, { x: 1260, y: 250 }, { x: 1520, y: 310 }, { x: 1580, y: 210 },
      { x: 1720, y: 310 }, { x: 1800, y: 250 }, { x: 2060, y: 310 }, { x: 2120, y: 200 },
      { x: 2280, y: 310 }, { x: 2360, y: 240 }, { x: 2600, y: 260 }, { x: 2660, y: 210 },
    ];
    spots.forEach((s, idx) => list.push({ id: idx + 1, x: s.x, y: s.y, collected: false }));
    return list;
  }, []);

  const [houses, setHouses] = useState<VillageHouse[]>(initialHouses);
  const [coins, setCoins] = useState<GameCoin[]>(initialCoins);

  // Background Music
  useEffect(() => {
    if (isOpen && gameStarted && bgmEnabled) {
      startAdventureBgm();
    }
    return () => {
      stopAdventureBgm();
    };
  }, [isOpen, gameStarted, bgmEnabled]);

  // Reset State Game
  useEffect(() => {
    if (isOpen) {
      setHouses(initialHouses);
      setCoins(initialCoins);
      setParticles([]);
      setGameStarted(false);
      setPlayerLives(3);
      setNearbyHouse(null);
      setPlayerState({
        x: 100,
        y: 350,
        vy: 0,
        isJumping: false,
        facing: "right",
        animFrame: 0,
      });
      setCameraX(0);
      setActiveHouse(null);
      setSelectedHouseOption(null);
      setHouseFeedback(null);
      setAdventureScore(0);
      setAdventureFinished(false);
    }
  }, [isOpen, initialHouses, initialCoins, chapter]);

  const spawnParticle = (x: number, y: number, text: string, color = "#fbbf24") => {
    setParticles((prev) => [
      ...prev.slice(-10),
      { id: Date.now() + Math.random(), x, y, text, color, opacity: 1 },
    ]);
  };

  // Gerakan Melompat (Roblox Jump)
  const jumpPlayer = useCallback(() => {
    if (activeHouse || !gameStarted) return;
    setPlayerState((prev) => {
      if (prev.isJumping) return prev;
      playJumpSound();
      return { ...prev, vy: -14.5, isJumping: true };
    });
  }, [activeHouse, gameStarted]);

  // Gerakan Kiri/Kanan
  const movePlayerH = useCallback(
    (dx: number, dir: "left" | "right") => {
      if (activeHouse || !gameStarted) return;
      const actualDx = isSprinting ? dx * 1.6 : dx;

      setPlayerState((prev) => {
        const nx = Math.max(40, Math.min(2720, prev.x + actualDx));

        // Cek apakah sedang berada di dekat rumah warga
        let foundHouse: VillageHouse | null = null;
        for (const h of houses) {
          if (Math.abs(nx - h.worldX) < 65) {
            foundHouse = h;
            break;
          }
        }
        setNearbyHouse(foundHouse);

        return {
          ...prev,
          x: nx,
          facing: dir,
          animFrame: prev.animFrame + 1,
        };
      });
    },
    [activeHouse, gameStarted, isSprinting, houses]
  );

  // Aksi Mengetuk Pintu Rumah
  const knockAndEnterHouse = useCallback(() => {
    if (!nearbyHouse || activeHouse) return;
    playKnockDoorSound();
    playRobotAwakeSound();
    setActiveHouse(nearbyHouse);
    setSelectedHouseOption(null);
    setHouseFeedback(null);
    spawnParticle(nearbyHouse.worldX, 260, "TOK TOK TOK! 🚪", "#fde047");
  }, [nearbyHouse, activeHouse]);

  // Loop Fisika, Gravitasi, Rintangan Obby & Koin
  useEffect(() => {
    if (gameType !== "adventure" || !isOpen || !gameStarted) return;

    const gravity = 0.8;
    const groundY = 350;
    const springs = [540, 1100, 1660, 2220];

    const interval = setInterval(() => {
      setPlayerState((prev) => {
        let nextY = prev.y + prev.vy;
        let nextVy = prev.vy + gravity;
        let isJumping = true;

        // 1. Cek Spring Bouncer Pelontar
        for (const sx of springs) {
          if (Math.abs(prev.x - sx) < 28 && prev.y >= 335) {
            playSpringJumpSound();
            spawnParticle(prev.x, prev.y - 20, "BOING! 🌀", "#38bdf8");
            return { ...prev, vy: -21, isJumping: true };
          }
        }

        // 2. CEK TABRAKAN DENGAN RINTANGAN (SPIKES / LAVA OBBY)
        for (const obs of obstacles) {
          if (Math.abs(prev.x - obs.x) < 22 && prev.y >= 335) {
            playOofSound();
            spawnParticle(prev.x, prev.y - 30, "ADUH! 💥 OOF!", "#ef4444");

            // Respawn ke titik aman sebelum rintangan
            const safeX = Math.max(80, prev.x - 70);
            setPlayerLives((lives) => {
              const nextLives = lives - 1;
              if (nextLives <= 0) {
                spawnParticle(safeX, 300, "❤️❤️❤️ HATI PULIH!", "#10b981");
                return 3;
              }
              return nextLives;
            });

            return {
              ...prev,
              x: safeX,
              y: groundY,
              vy: -6,
              isJumping: false,
            };
          }
        }

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

      // Deteksi Memungut Koin Emas
      setPlayerState((p) => {
        setCoins((prevCoins) => {
          let updated = false;
          const next = prevCoins.map((coin) => {
            if (!coin.collected) {
              const dist = Math.hypot(p.x - coin.x, p.y - 35 - coin.y);
              if (dist < 32) {
                updated = true;
                playCoinPickupSound();
                setAdventureScore((s) => s + 5);
                spawnParticle(coin.x, coin.y - 10, "+5 Koin 🪙", "#fde047");
                return { ...coin, collected: true };
              }
            }
            return coin;
          });
          return updated ? next : prevCoins;
        });

        // Kamera dinamis mengikuti posisi X karakter
        setCameraX((cam) => {
          const targetCam = Math.max(0, p.x - 350);
          return cam + (targetCam - cam) * 0.16;
        });

        return p;
      });

      // Animasi partikel melayang
      setParticles((prev) =>
        prev
          .map((pt) => ({ ...pt, y: pt.y - 1.5, opacity: pt.opacity - 0.04 }))
          .filter((pt) => pt.opacity > 0)
      );
    }, 24);

    return () => clearInterval(interval);
  }, [gameType, isOpen, gameStarted, obstacles]);

  // Keyboard Event Listener
  useEffect(() => {
    if (gameType !== "adventure" || !isOpen || !gameStarted) return;

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
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        knockAndEnterHouse();
      } else if (e.key === "Shift") {
        setIsSprinting(true);
        playDashSound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsSprinting(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameType, isOpen, gameStarted, movePlayerH, jumpPlayer, knockAndEnterHouse]);

  // -------------------------------------------------------------
  // RENDER CANVAS 3D ROBLOX: DESA PANCASILA, RUMAH WARGA & OBBY
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

      // 1. Langit 3D Cerah
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, "#0284c7");
      skyGrad.addColorStop(0.65, "#7dd3fc");
      skyGrad.addColorStop(1, "#f0fdf4");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Matahari 3D
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(W - 140, 80, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(254, 240, 138, 0.45)";
      ctx.beginPath();
      ctx.arc(W - 140, 80, 75, 0, Math.PI * 2);
      ctx.fill();

      // Awan Roblox Mengapung
      const drawCloud = (cx: number, cy: number, scale = 1) => {
        const sx = ((cx - cameraX * 0.1) % (W + 300)) - 100;
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.beginPath();
        ctx.arc(sx, cy, 24 * scale, 0, Math.PI * 2);
        ctx.arc(sx + 26 * scale, cy - 8 * scale, 30 * scale, 0, Math.PI * 2);
        ctx.arc(sx + 56 * scale, cy, 24 * scale, 0, Math.PI * 2);
        ctx.fill();
      };
      drawCloud(120, 70, 1.1);
      drawCloud(540, 95, 0.9);
      drawCloud(960, 60, 1.2);
      drawCloud(1400, 85, 1.0);
      drawCloud(1900, 70, 1.1);

      // Pegunungan Roblox 3D Parallax
      const drawMountain = (mx: number, my: number, mw: number, mh: number, color: string) => {
        const screenX = mx - cameraX * 0.25;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(screenX, my);
        ctx.lineTo(screenX + mw / 2, my - mh);
        ctx.lineTo(screenX + mw, my);
        ctx.fill();
      };
      drawMountain(100, 350, 480, 210, "#93c5fd");
      drawMountain(500, 350, 520, 250, "#60a5fa");
      drawMountain(980, 350, 560, 230, "#93c5fd");
      drawMountain(1500, 350, 600, 270, "#60a5fa");
      drawMountain(2050, 350, 520, 240, "#93c5fd");

      // 2. MENGGAMBAR 5 PULAU DESA PANCASILA
      const draw3DIsland = (
        islandX: number,
        width: number,
        topColor: string,
        dirtColor: string
      ) => {
        const sx = islandX - cameraX;
        const topY = 350;
        const depth = 110;

        ctx.fillStyle = topColor;
        ctx.fillRect(sx, topY, width, 18);
        ctx.fillStyle = dirtColor;
        ctx.fillRect(sx, topY + 18, width, depth);

        ctx.strokeStyle = "rgba(0,0,0,0.12)";
        ctx.lineWidth = 2;
        for (let bx = 0; bx < width; bx += 32) {
          ctx.beginPath();
          ctx.moveTo(sx + bx, topY);
          ctx.lineTo(sx + bx, topY + 18 + depth);
          ctx.stroke();
        }
      };

      draw3DIsland(60, 480, "#22c55e", "#15803d");
      draw3DIsland(640, 460, "#eab308", "#854d0e");
      draw3DIsland(1200, 460, "#16a34a", "#14532d");
      draw3DIsland(1760, 460, "#ef4444", "#991b1b");
      draw3DIsland(2320, 460, "#eab308", "#713f12");

      // 3. Jembatan Gantung Kayu & Pegas Bouncer
      const drawBridgeAndSpring = (bx: number, bw: number, springX: number) => {
        const sx = bx - cameraX;
        ctx.fillStyle = "#78350f";
        ctx.fillRect(sx, 355, bw, 5);
        ctx.fillStyle = "#b45309";
        for (let px = 0; px < bw; px += 22) {
          ctx.fillRect(sx + px, 350, 16, 12);
        }

        const spx = springX - cameraX;
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(spx - 14, 346, 28, 6);
        ctx.fillStyle = "#facc15";
        ctx.fillRect(spx - 10, 340, 20, 6);
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🌀", spx, 335);
      };

      drawBridgeAndSpring(540, 100, 540);
      drawBridgeAndSpring(1100, 100, 1100);
      drawBridgeAndSpring(1660, 100, 1660);
      drawBridgeAndSpring(2220, 100, 2220);

      // 4. MENGGAMBAR RINTANGAN OBBY (DURI & LAVA ROBLOX)
      obstacles.forEach((obs) => {
        const ox = obs.x - cameraX;
        if (obs.type === "spikes") {
          // Duri Segitiga Tajam
          ctx.fillStyle = "#dc2626";
          for (let sp = -14; sp <= 14; sp += 10) {
            ctx.beginPath();
            ctx.moveTo(ox + sp, 350);
            ctx.lineTo(ox + sp + 5, 332);
            ctx.lineTo(ox + sp + 10, 350);
            ctx.fill();
          }
          ctx.fillStyle = "#fef08a";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("AWAS DURI! ⚠️", ox + 5, 324);
        } else {
          // Kolam Lava Berpijar Panas
          ctx.fillStyle = "#f97316";
          ctx.fillRect(ox - 16, 348, 36, 10);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(ox - 12, 350, 28, 8);
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🔥", ox + 2, 344);
        }
      });

      // 5. MENGGAMBAR 5 RUMAH WARGA PANCASILA YANG MEGAH
      houses.forEach((house) => {
        const hx = house.worldX - cameraX;
        const ground = 350;

        // Dinding Rumah 3D
        ctx.fillStyle = house.wallColor;
        ctx.fillRect(hx - 45, ground - 90, 90, 90);
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.lineWidth = 3;
        ctx.strokeRect(hx - 45, ground - 90, 90, 90);

        // Atap Segitiga 3D
        ctx.fillStyle = house.roofColor;
        ctx.beginPath();
        ctx.moveTo(hx - 58, ground - 90);
        ctx.lineTo(hx, ground - 145);
        ctx.lineTo(hx + 58, ground - 90);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.stroke();

        // Pintu Rumah Kayu (Terbuka jika dikunjungi)
        ctx.fillStyle = house.visited ? "#22c55e" : "#78350f";
        ctx.fillRect(hx - 14, ground - 50, 28, 50);
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(hx + 8, ground - 25, 3, 0, Math.PI * 2); // Kenop pintu
        ctx.fill();

        // Jendela Kaca Rumah
        ctx.fillStyle = "#bae6fd";
        ctx.fillRect(hx - 36, ground - 75, 16, 16);
        ctx.fillRect(hx + 20, ground - 75, 16, 16);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hx - 36, ground - 75, 16, 16);
        ctx.strokeRect(hx + 20, ground - 75, 16, 16);

        // Papan Nama Rumah & Simbol Sila di Puncak Atap
        ctx.font = "32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(house.symbol, hx, ground - 150);

        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = "#0f172a";
        ctx.fillText(`🏠 ${house.houseTitle}`, hx, ground - 105);

        // Avatar Tuan Rumah Menunggu di Depan Pintu
        ctx.font = "24px sans-serif";
        ctx.fillText(house.residentAvatar, hx, ground - 56);

        // Indikator Status Rumah
        if (house.visited) {
          ctx.fillStyle = "#16a34a";
          ctx.font = "bold 13px sans-serif";
          ctx.fillText("✓ TELAH DIKUNJUNGI", hx, ground - 185);
        } else if (Math.abs(playerState.x - house.worldX) < 65) {
          // Efek Berkedip: Tombol Ketuk Pintu Muncul
          const pulse = Math.sin(Date.now() * 0.008) * 3;
          ctx.fillStyle = "#facc15";
          ctx.font = "bold 13px sans-serif";
          ctx.fillText("👉 TEKAN 'E' / KETUK PINTU 🚪", hx, ground - 185 + pulse);
        }
      });

      // Garis Finish Tropi Emas Juara
      const finishSx = 2690 - cameraX;
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(finishSx, 260, 14, 90);
      ctx.font = "48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🏆", finishSx + 7, 235);
      ctx.font = "bold 13px sans-serif";
      ctx.fillStyle = "#78350f";
      ctx.fillText("GARIS FINISH JUARA!", finishSx + 7, 195);

      // 6. MENGGAMBAR KOIN EMAS PANCASILA
      const coinBob = Math.sin(Date.now() * 0.006) * 4;
      coins.forEach((coin) => {
        if (coin.collected) return;
        const cx = coin.x - cameraX;
        const cy = coin.y + coinBob;
        ctx.fillStyle = "rgba(250, 204, 21, 0.4)";
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🪙", cx, cy + 6);
      });

      // 7. MENGGAMBAR KARAKTER UTAMA 3D ROBLOX
      const px = playerState.x - cameraX;
      const py = playerState.y;

      // Efek Asap Sprint
      if (isSprinting && !playerState.isJumping) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.beginPath();
        ctx.arc(px - (playerState.facing === "right" ? 22 : -22), 350, 8, 0, Math.PI * 2);
        ctx.arc(px - (playerState.facing === "right" ? 34 : -34), 348, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bayangan 3D
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      const shadowSize = Math.max(8, 22 - (350 - py) * 0.15);
      ctx.ellipse(px, 352, shadowSize, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Kaki Kotak Merah SD
      const legSwing = Math.sin(playerState.animFrame * (isSprinting ? 0.6 : 0.4)) * 6;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(px - 10, py - 20 + (playerState.isJumping ? -4 : legSwing), 8, 20);
      ctx.fillRect(px + 2, py - 20 + (playerState.isJumping ? -4 : -legSwing), 8, 20);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(px - 11, py - 3, 9, 5);
      ctx.fillRect(px + 1, py - 3, 9, 5);

      // Kemeja Putih Kotak SD
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px - 14, py - 46, 28, 26);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(px - 2, py - 44, 4, 16); // Dasi

      // Lengan
      ctx.fillStyle = "#fed7aa";
      ctx.fillRect(px - 20, py - 44 - legSwing, 6, 18);
      ctx.fillRect(px + 14, py - 44 + legSwing, 6, 18);

      // Kepala Kotak Roblox
      ctx.fillStyle = "#fed7aa";
      ctx.fillRect(px - 11, py - 68, 22, 22);

      // Topi Merah Petualang SD
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(px - 13, py - 73, 26, 7);
      ctx.fillRect(px - 10, py - 81, 20, 9);

      // Wajah Senyum Roblox
      ctx.fillStyle = "#0f172a";
      const eyeDir = playerState.facing === "right" ? 2 : -2;
      ctx.fillRect(px - 5 + eyeDir, py - 60, 3, 4);
      ctx.fillRect(px + 3 + eyeDir, py - 60, 3, 4);
      ctx.beginPath();
      ctx.arc(px + eyeDir, py - 54, 4, 0, Math.PI, false);
      ctx.stroke();

      // Label Nama Pemain
      ctx.fillStyle = "#15803d";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(isSprinting ? "⚡ Petualang (Sprint)" : "⭐ Petualang", px, py - 88);

      // 8. PARTIKEL VISUAL
      particles.forEach((pt) => {
        const sx = pt.x - cameraX;
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.opacity);
        ctx.fillStyle = pt.color;
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(pt.text, sx, pt.y);
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [playerState, cameraX, houses, obstacles, coins, particles, isSprinting, gameType]);

  // Handler Pilihan Dialog Rumah
  const handleSelectHouseOption = (optIdx: number) => {
    if (!activeHouse || selectedHouseOption !== null) return;
    setSelectedHouseOption(optIdx);

    const opt = activeHouse.options[optIdx];
    if (!opt) return;

    if (opt.isRight) {
      playCorrectSound();
      playCoinSound();
      setAdventureScore((prev) => prev + opt.points);
      setHouseFeedback(`🎉 TEPAT SEKALI! ${opt.explanation}`);

      setHouses((prev) =>
        prev.map((h) => (h.id === activeHouse.id ? { ...h, visited: true } : h))
      );
    } else {
      playWrongSound();
      setHouseFeedback(`💡 CATATAN BELAJAR: ${opt.explanation}`);
    }
  };

  const handleCloseHouseDialogue = () => {
    playClickSound();
    setActiveHouse(null);
    setSelectedHouseOption(null);
    setHouseFeedback(null);

    // Cek apakah 5 rumah telah dikunjungi
    const remaining = houses.filter((h) => !h.visited);
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
              {gameType === "adventure" ? "🏘️" : "🧩"}
            </span>
            <div className="min-w-0">
              <h2 id="roblox-game-title" className="font-black text-sm sm:text-base text-yellow-300 truncate tracking-wide">
                {gameType === "adventure"
                  ? "PETUALANGAN ROBLOX: JELAJAH RUMAH WARGA PANCASILA & OBBY"
                  : "TEKA-TEKI MENJODOHKAN KARTU CERIA"}
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                Materi: {resolvedTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Status Nyawa / Hati Pemain */}
            {gameType === "adventure" && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 px-3 py-1.5 rounded-full border border-rose-500/50">
                <span className="text-xs font-black text-rose-400">
                  {"❤️".repeat(playerLives)}
                </span>
                <span className="text-[11px] font-bold text-slate-300 ml-1">Nyawa</span>
              </div>
            )}

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
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/50"
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
            // GAME 3D ROBLOX ADVENTURE: RUMAH WARGA & RINTANGAN OBBY
            // =========================================================
            adventureFinished ? (
              <div className="text-center py-8 px-6 bg-slate-900/95 border-4 border-yellow-400 rounded-3xl shadow-2xl max-w-lg space-y-4 animate-in zoom-in-95 z-30 text-white">
                <div className="w-24 h-24 bg-yellow-400/20 rounded-full mx-auto flex items-center justify-center text-5xl shadow-inner border-2 border-yellow-400 animate-bounce">
                  🏆
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-2xl text-yellow-300">
                    SELAMAT! KAMU JUARA DESA PANCASILA!
                  </h3>
                  <p className="text-sm font-medium text-slate-300">
                    Kamu berhasil melewati seluruh rintangan obby dan mengunjungi 5 Rumah Warga Pancasila!
                  </p>
                </div>
                <div className="inline-flex items-center gap-3 bg-yellow-400/20 text-yellow-300 font-black px-5 py-2.5 rounded-2xl border border-yellow-400 text-sm">
                  <span>⭐ Poin Prestasi: +25 Poin</span>
                  <span>•</span>
                  <span>Skor Koin: {adventureScore} Koin 🪙</span>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setHouses(initialHouses);
                      setCoins(initialCoins);
                      setPlayerLives(3);
                      setPlayerState({
                        x: 100,
                        y: 350,
                        vy: 0,
                        isJumping: false,
                        facing: "right",
                        animFrame: 0,
                      });
                      setCameraX(0);
                      setActiveHouse(null);
                      setSelectedHouseOption(null);
                      setHouseFeedback(null);
                      setAdventureScore(0);
                      setAdventureFinished(false);
                      setGameStarted(true);
                      startAdventureBgm();
                    }}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-3 px-8 rounded-full shadow-lg transition text-sm cursor-pointer"
                  >
                    🔄 Main Petualangan dari Awal
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center">
                {/* OVERLAY AWAL MULAI MAIN (UN-MUTE AUDIO) */}
                {!gameStarted && (
                  <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center text-5xl shadow-2xl border-4 border-white animate-bounce">
                      🏘️
                    </div>
                    <div className="space-y-2 max-w-md">
                      <h3 className="font-black text-2xl text-yellow-300 tracking-wide">
                        JELAJAH RUMAH WARGA & RINTANGAN OBBY
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        Berjalan-jalan mengunjungi 5 Rumah Warga Pancasila 🏠, ketuk pintu mereka 🚪, lompati rintangan duri & lava obby ⚠️, dan kumpulkan semua koin emas 🪙!
                      </p>
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
                      <span>▶️ MULAI JELAJAH (DENGAN MUSIK 🎵)</span>
                    </button>
                  </div>
                )}

                {/* CANVAS UTAMA LAYAR PENUH */}
                <canvas
                  ref={canvasRef}
                  width={1100}
                  height={560}
                  className="w-full h-full object-cover block cursor-crosshair"
                />

                {/* PROGRESS BAR 5 RUMAH DI ATAS CANVAS */}
                <div className="absolute top-3 inset-x-4 sm:inset-x-12 z-20 flex items-center justify-between gap-1.5 sm:gap-3 bg-slate-900/85 backdrop-blur-md p-2.5 rounded-2xl border border-yellow-400/40">
                  {houses.map((h) => (
                    <div
                      key={h.id}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-center text-xs font-black transition flex items-center justify-center gap-1.5 ${
                        h.visited
                          ? "bg-emerald-600 text-white shadow-sm"
                          : Math.abs(playerState.x - h.worldX) < 160
                          ? "bg-yellow-400 text-slate-950 ring-2 ring-yellow-300 animate-pulse"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <span>{h.symbol}</span>
                      <span className="hidden md:inline">Rumah {h.silaNumber}</span>
                      {h.visited && <span>✓</span>}
                    </div>
                  ))}
                </div>

                {/* TOMBOL POPUP INTERAKSI KETUK PINTU KETIKA MENDEKATI RUMAH */}
                {nearbyHouse && !activeHouse && (
                  <div className="absolute bottom-24 z-30 animate-bounce">
                    <button
                      type="button"
                      onClick={knockAndEnterHouse}
                      className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-black px-6 py-3 rounded-full text-sm sm:text-base shadow-2xl border-2 border-white flex items-center gap-2 cursor-pointer transition hover:scale-105 active:scale-95"
                    >
                      <span>🚪</span>
                      <span>KETUK PINTU &amp; KUNJUNGI RUMAH (E)</span>
                    </button>
                  </div>
                )}

                {/* MODAL DIALOG DIDALAM RUMAH WARGA */}
                {activeHouse && (
                  <div className="absolute inset-x-4 sm:inset-x-auto sm:w-[560px] bottom-20 z-30 bg-slate-900/95 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border-3 border-yellow-400 shadow-2xl animate-in slide-in-from-bottom-6 text-white space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{activeHouse.residentAvatar}</span>
                        <div>
                          <div className="text-xs font-black text-yellow-400 uppercase tracking-wide">
                            {activeHouse.houseTitle} • {activeHouse.islandName}
                          </div>
                          <div className="font-black text-base text-white">
                            Tuan Rumah: {activeHouse.residentName}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs bg-yellow-400 text-slate-950 font-black px-3 py-1 rounded-full">
                        Sila {activeHouse.silaNumber} {activeHouse.symbol}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed">
                      📖 {activeHouse.story}
                    </p>

                    <div className="p-3 bg-yellow-400/10 rounded-2xl border border-yellow-400/30">
                      <p className="text-xs sm:text-sm font-bold text-yellow-300">
                        ❓ {activeHouse.question}
                      </p>
                    </div>

                    {/* PILIHAN JAWABAN */}
                    <div className="space-y-2 pt-1">
                      {activeHouse.options.map((opt, idx) => {
                        const isSelected = selectedHouseOption === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={selectedHouseOption !== null}
                            onClick={() => handleSelectHouseOption(idx)}
                            className={`w-full text-left p-3.5 rounded-2xl border-2 text-xs sm:text-sm font-bold transition flex items-start gap-2.5 cursor-pointer ${
                              isSelected
                                ? opt.isRight
                                  ? "bg-emerald-600 border-white text-white"
                                  : "bg-rose-600 border-white text-white"
                                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs shrink-0 font-black">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* FEEDBACK & TOMBOL LANJUT BERJALAN */}
                    {houseFeedback && (
                      <div className="pt-2 space-y-3">
                        <div className="p-3 bg-slate-800/90 rounded-2xl text-xs sm:text-sm font-medium border border-slate-700 text-slate-200">
                          {houseFeedback}
                        </div>
                        <button
                          type="button"
                          onClick={handleCloseHouseDialogue}
                          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-black py-2.5 px-5 rounded-2xl shadow-lg transition text-xs sm:text-sm cursor-pointer"
                        >
                          Pamit &amp; Lanjut Berjalan ke Rumah Berikutnya ➡️
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* KONTROL ON-SCREEN TOUCH & MOUSE (ROBLOX CONTROLLER DI SUDUT BAWAH) */}
                <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between pointer-events-none">
                  {/* D-Pad Navigasi Kiri / Kanan & Sprint Dash */}
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => movePlayerH(-28, "left")}
                      className="w-14 sm:w-16 h-14 rounded-2xl bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-950 text-white border-2 border-yellow-400/60 font-black text-xl shadow-xl transition active:scale-90 flex items-center justify-center cursor-pointer backdrop-blur-md"
                      aria-label="Jalan Kiri"
                    >
                      ◀
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSprinting((prev) => !prev);
                        playDashSound();
                      }}
                      className={`h-14 px-3 sm:px-4 rounded-2xl border-2 font-black text-xs sm:text-sm shadow-xl transition active:scale-90 flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
                        isSprinting
                          ? "bg-amber-400 text-slate-950 border-white ring-2 ring-yellow-300"
                          : "bg-slate-900/80 text-yellow-300 border-yellow-400/60 hover:bg-slate-800"
                      }`}
                      aria-label="Sprint Dash"
                    >
                      <span>⚡</span>
                      <span className="hidden sm:inline">{isSprinting ? "LARI CEPAT ON" : "LARI CEPAT"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => movePlayerH(28, "right")}
                      className="w-14 sm:w-16 h-14 rounded-2xl bg-slate-900/80 hover:bg-yellow-400 hover:text-slate-950 text-white border-2 border-yellow-400/60 font-black text-xl shadow-xl transition active:scale-90 flex items-center justify-center cursor-pointer backdrop-blur-md"
                      aria-label="Jalan Kanan"
                    >
                      ▶
                    </button>
                  </div>

                  {/* Tombol Ketuk Pintu (saat dekat) & Loncat Roblox */}
                  <div className="flex items-center gap-2 pointer-events-auto">
                    {nearbyHouse && (
                      <button
                        type="button"
                        onClick={knockAndEnterHouse}
                        className="h-14 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs sm:text-sm shadow-2xl transition active:scale-90 flex items-center gap-1.5 cursor-pointer border-2 border-white animate-pulse"
                      >
                        <span>🚪</span>
                        <span>KETUK PINTU</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={jumpPlayer}
                      className="h-14 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-950 font-black text-sm sm:text-base shadow-2xl transition active:scale-90 flex items-center gap-2 cursor-pointer border-2 border-white"
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
