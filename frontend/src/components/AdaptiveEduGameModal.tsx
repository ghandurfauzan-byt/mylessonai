// frontend/src/components/AdaptiveEduGameModal.tsx
// Game Edukasi 3D Real Roblox-Style Engine: Jelajah Desa 5 Sila Pancasila & Misi Aksi Nyata Obby
// Menggunakan Three.js 3D WebGL, Kamera Third-Person, Karakter Roblox 3D, Safe Zone, dan Musik BGM

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

// Model Misi Aksi Nyata Pengamalan Pancasila (Bukan Kuis Ganda)
interface SilaActionMission {
  id: number;
  silaNumber: number;
  symbol: string;
  title: string;
  zoneZ: number;
  islandName: string;
  actionTargetName: string;
  actionIcon: string;
  actionPrompt: string;
  instructionText: string;
  successStory: string;
  completed: boolean;
}

// Model Kartu Menjodohkan (Untuk Bahasa Jawa)
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
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);
  const [playerLives, setPlayerLives] = useState(3);
  const [adventureScore, setAdventureScore] = useState(0);
  const [adventureFinished, setAdventureFinished] = useState(false);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  // Deteksi genre otomatis (Matching vs 3D Roblox Adventure)
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

  // --------------------------------------------------------------------------
  // 5 MISI AKSI NYATA PENGAMALAN 5 SILA PANCASILA DI DESA NUSANTARA
  // --------------------------------------------------------------------------
  const initialMissions: SilaActionMission[] = useMemo(() => {
    return [
      {
        id: 1,
        silaNumber: 1,
        symbol: "⭐",
        title: "Sila 1: Toleransi & Rukun Beragama",
        zoneZ: -55,
        islandName: "Desa Rukun: Rumah Ibadah Damai",
        actionTargetName: "Radio Speaker Bising",
        actionIcon: "📻",
        actionPrompt: "🔇 MATIKAN RADIO & HORMATI IBADAH",
        instructionText: "Di depan rumah ibadah desa, temanmu sedang beribadah. Ada radio yang menyala bising. Matikan radio untuk menjaga ketenangan!",
        successStory: "Alhamdulillah & Puji Tuhan! Kamu mengamalkan Sila ke-1: Menghormati teman yang sedang beribadah tanpa mengganggunya.",
        completed: false,
      },
      {
        id: 2,
        silaNumber: 2,
        symbol: "⛓️",
        title: "Sila 2: Tolong-Menolong & Kasih Sayang",
        zoneZ: -125,
        islandName: "Jalan Desa: Pos Kemanusiaan",
        actionTargetName: "Doni Terjatuh Sepeda",
        actionIcon: "🩹",
        actionPrompt: "🩹 OBATI LUKA & BANTU TEMAN BERDIRI",
        instructionText: "Doni tergelincir dari sepedanya di jembatan desa dan lututnya terluka! Ambil kotak P3K dan bantu Doni berdiri.",
        successStory: "Hebat sekali! Kamu mengamalkan Sila ke-2: Gemar menolong sesama manusia yang tertimpa musibah dengan penuh kasih sayang.",
        completed: false,
      },
      {
        id: 3,
        silaNumber: 3,
        symbol: "🌳",
        title: "Sila 3: Persatuan & Cinta Tanah Air",
        zoneZ: -195,
        islandName: "Lapangan Desa: Pos Bhinneka Tunggal Ika",
        actionTargetName: "Tiang Balai Bhinneka",
        actionIcon: "🇮🇩",
        actionPrompt: "🇮🇩 KIBARKAN BENDERA & AJAK MAIN RUKUN",
        instructionText: "Anak-anak desa dari berbagai suku ingin bermain kasti bersama. Kibarkan bendera Merah Putih di tiang balai untuk menyatukan mereka!",
        successStory: "Bhinneka Tunggal Ika! Kamu mengamalkan Sila ke-3: Menjaga kerukunan dan tidak membeda-bedakan suku atau asal daerah teman.",
        completed: false,
      },
      {
        id: 4,
        silaNumber: 4,
        symbol: "🐂",
        title: "Sila 4: Musyawarah & Menghargai Pendapat",
        zoneZ: -265,
        islandName: "Balai Warga: Pos Musyawarah Desa",
        actionTargetName: "Kotak Suara Balai Desa",
        actionIcon: "🗳️",
        actionPrompt: "🗳️ MASUKKAN SUARA & DUKUNG KEPUTUSAN BERSAMA",
        instructionText: "Di Balai Desa sedang diadakan musyawarah pemilihan tujuan karya wisata. Masukkan surat kesepakatan dan dukung hasil musyawarah!",
        successStory: "Sikap pemimpin bijak! Kamu mengamalkan Sila ke-4: Mengutamakan musyawarah mufakat dan menghargai keputusan bersama dengan lapang dada.",
        completed: false,
      },
      {
        id: 5,
        silaNumber: 5,
        symbol: "🌾",
        title: "Sila 5: Gotong Royong & Keadilan Sosial",
        zoneZ: -335,
        islandName: "Lumbung Desa: Pos Gotong Royong",
        actionTargetName: "Kotak Alat Piket Bersama",
        actionIcon: "🧹",
        actionPrompt: "🧹 BAGIKAN TUGAS PIKET SECARA ADIL MERATA",
        instructionText: "Tiba di pos akhir Desa! Mari kerja bakti membersihkan desa dengan membagi alat sapu secara adil dan merata kepada seluruh kawan.",
        successStory: "Keadilan sosial terwujud sempurna! Kamu mengamalkan Sila ke-5: Gemar gotong royong dan bersikap adil tanpa pilih kasih kepada semua teman.",
        completed: false,
      },
    ];
  }, []);

  const [missions, setMissions] = useState<SilaActionMission[]>(initialMissions);
  const [nearbyMission, setNearbyMission] = useState<SilaActionMission | null>(null);

  // Kontrol Background Music
  useEffect(() => {
    if (isOpen && gameStarted && bgmEnabled) {
      startAdventureBgm();
    }
    return () => {
      stopAdventureBgm();
    };
  }, [isOpen, gameStarted, bgmEnabled]);

  // Reset Saat Modal Buka
  useEffect(() => {
    if (isOpen) {
      setMissions(initialMissions);
      setGameStarted(false);
      setPlayerLives(3);
      setAdventureScore(0);
      setAdventureFinished(false);
      setActiveNotification(null);
      setNearbyMission(null);
    }
  }, [isOpen, initialMissions]);

  // --------------------------------------------------------------------------
  // ENGINE 3D ROBLOX THREE.JS
  // --------------------------------------------------------------------------
  const mountRef = useRef<HTMLDivElement | null>(null);

  // State Kontrol Input
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

  // Eksekusi Misi Aksi Nyata
  const triggerMissionAction = useCallback(() => {
    if (!nearbyMission || nearbyMission.completed) return;
    playCorrectSound();
    playCoinSound();
    playRobotAwakeSound();

    const mId = nearbyMission.id;
    setMissions((prev) =>
      prev.map((m) => (m.id === mId ? { ...m, completed: true } : m))
    );

    setAdventureScore((s) => s + 20);
    setActiveNotification(`🎉 ${nearbyMission.successStory}`);

    setTimeout(() => {
      setActiveNotification(null);
    }, 4500);

    // Cek jika 5 misi selesai
    const rem = missions.filter((m) => m.id !== mId && !m.completed);
    if (rem.length === 0) {
      setTimeout(() => {
        setAdventureFinished(true);
        playBadgeFanfareSound();
        addPoints(25);
      }, 1200);
    }
  }, [nearbyMission, missions, addPoints]);

  useEffect(() => {
    if (gameType !== "adventure" || !isOpen) return;

    const mount = mountRef.current;
    if (!mount) return;

    // 1. SETUP SCENE, CAMERA, & RENDERER
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#60a5fa"); // Roblox Bright Sky
    scene.fog = new THREE.FogExp2("#93c5fd", 0.008);

    const getViewportSize = () => {
      const w = mount.clientWidth > 50 ? mount.clientWidth : window.innerWidth;
      const h = mount.clientHeight > 50 ? mount.clientHeight : Math.max(300, window.innerHeight - 56);
      return { w, h };
    };

    const { w: initW, h: initH } = getViewportSize();

    const camera = new THREE.PerspectiveCamera(58, initW / initH, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
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

    // 2. LIGHTING (Terang, Hangat Khas Roblox Sun)
    const hemiLight = new THREE.HemisphereLight("#ffffff", "#445566", 0.9);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight("#fffbeb", 1.4);
    dirLight.position.set(30, 60, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 3. TERRAIN DUNIA ROBLOX (Lantai Rumput Hijau dengan Grid Studs)
    const groundGeo = new THREE.PlaneGeometry(80, 520);
    const groundMat = new THREE.MeshLambertMaterial({ color: "#4ade80" }); // Hijau Rumput Roblox
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, 0, -200);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Jalur Jalan Utama (Brown Dirt Path)
    const pathGeo = new THREE.PlaneGeometry(10, 500);
    const pathMat = new THREE.MeshLambertMaterial({ color: "#fef08a" });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.02, -200);
    scene.add(pathMesh);

    // GARIS SAFE ZONE AWAL (Seperti Screenshot Pengguna!)
    const safeZoneCanvas = document.createElement("canvas");
    safeZoneCanvas.width = 512;
    safeZoneCanvas.height = 128;
    const szCtx = safeZoneCanvas.getContext("2d")!;
    szCtx.fillStyle = "#ef4444";
    szCtx.fillRect(0, 0, 512, 128);
    szCtx.fillStyle = "#ffffff";
    szCtx.font = "bold 44px sans-serif";
    szCtx.textAlign = "center";
    szCtx.fillText("SAFE ZONE", 256, 75);

    const safeZoneTex = new THREE.CanvasTexture(safeZoneCanvas);
    const safeZoneMat = new THREE.MeshBasicMaterial({ map: safeZoneTex });
    const safeZoneGeo = new THREE.PlaneGeometry(16, 4);
    const safeZoneMesh = new THREE.Mesh(safeZoneGeo, safeZoneMat);
    safeZoneMesh.rotation.x = -Math.PI / 2;
    safeZoneMesh.position.set(0, 0.04, -12);
    scene.add(safeZoneMesh);

    // Dinding Pembatas Tebing Kiri & Kanan (Roblox Arena Wall)
    const wallGeo = new THREE.BoxGeometry(4, 18, 520);
    const wallMat = new THREE.MeshLambertMaterial({ color: "#b45309" }); // Cokelat Tebing
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-38, 9, -200);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(38, 9, -200);
    scene.add(rightWall);

    // Awan Rendah Mengapung
    const cloudGroup = new THREE.Group();
    for (let i = 0; i < 18; i++) {
      const cGeo = new THREE.BoxGeometry(10 + Math.random() * 8, 3, 8 + Math.random() * 6);
      const cMat = new THREE.MeshLambertMaterial({ color: "#ffffff", transparent: true, opacity: 0.85 });
      const cMesh = new THREE.Mesh(cGeo, cMat);
      cMesh.position.set((Math.random() - 0.5) * 60, 24 + Math.random() * 8, -Math.random() * 420);
      cloudGroup.add(cMesh);
    }
    scene.add(cloudGroup);

    // Pagar Kayu Pedesaan di Tepi Jalan (Desa Asri)
    const fenceGroup = new THREE.Group();
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6);
    const postMat = new THREE.MeshLambertMaterial({ color: "#78350f" });
    const railGeo = new THREE.BoxGeometry(0.1, 0.15, 6);
    const railMat = new THREE.MeshLambertMaterial({ color: "#92400e" });

    for (let fz = 0; fz > -360; fz -= 6) {
      const pL = new THREE.Mesh(postGeo, postMat);
      pL.position.set(-6, 0.8, fz);
      fenceGroup.add(pL);
      const rL = new THREE.Mesh(railGeo, railMat);
      rL.position.set(-6, 0.9, fz - 3);
      fenceGroup.add(rL);

      const pR = new THREE.Mesh(postGeo, postMat);
      pR.position.set(6, 0.8, fz);
      fenceGroup.add(pR);
      const rR = new THREE.Mesh(railGeo, railMat);
      rR.position.set(6, 0.9, fz - 3);
      fenceGroup.add(rR);
    }
    scene.add(fenceGroup);

    // Pepohonan Pedesaan Nusantara (Pohon Rindang & Kelapa Desa)
    const treeGroup = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 5, 8);
    const trunkMat = new THREE.MeshLambertMaterial({ color: "#78350f" });
    const leavesGeo = new THREE.DodecahedronGeometry(2.4);
    const leavesMat = new THREE.MeshLambertMaterial({ color: "#15803d" });

    for (let tz = -15; tz > -360; tz -= 22) {
      const treeL = new THREE.Group();
      const trL = new THREE.Mesh(trunkGeo, trunkMat);
      trL.position.y = 2.5;
      const lvL = new THREE.Mesh(leavesGeo, leavesMat);
      lvL.position.y = 5.5;
      treeL.add(trL);
      treeL.add(lvL);
      treeL.position.set(-14 - Math.random() * 6, 0, tz);
      treeGroup.add(treeL);

      const treeR = new THREE.Group();
      const trR = new THREE.Mesh(trunkGeo, trunkMat);
      trR.position.y = 2.5;
      const lvR = new THREE.Mesh(leavesGeo, leavesMat);
      lvR.position.y = 5.5;
      treeR.add(trR);
      treeR.add(lvR);
      treeR.position.set(22 + Math.random() * 6, 0, tz);
      treeGroup.add(treeR);
    }
    scene.add(treeGroup);

    // 4. MEMBUAT 5 RUMAH 3D BESAR DI TIAP ZONA SILA PANCASILA
    const houseConfigs = [
      { z: -55, color: "#38bdf8", roof: "#facc15", name: "Rumah Ibadah & Toleransi ⭐" },
      { z: -125, color: "#fed7aa", roof: "#f97316", name: "Rumah Peduli Kemanusiaan ⛓️" },
      { z: -195, color: "#86efac", roof: "#15803d", name: "Balai Budaya Bhinneka 🌳" },
      { z: -265, color: "#fecaca", roof: "#dc2626", name: "Balai Desa Musyawarah 🐂" },
      { z: -335, color: "#fef08a", roof: "#eab308", name: "Lumbung Keadilan Bersama 🌾" },
    ];

    houseConfigs.forEach((hc) => {
      const hGroup = new THREE.Group();
      // Badan Rumah
      const bGeo = new THREE.BoxGeometry(12, 9, 10);
      const bMat = new THREE.MeshLambertMaterial({ color: hc.color });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.y = 4.5;
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      hGroup.add(bMesh);

      // Atap Segitiga Limas
      const rGeo = new THREE.ConeGeometry(9.5, 5, 4);
      const rMat = new THREE.MeshLambertMaterial({ color: hc.roof });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.position.y = 11.5;
      rMesh.rotation.y = Math.PI / 4;
      rMesh.castShadow = true;
      hGroup.add(rMesh);

      // Pintu Kayu
      const dGeo = new THREE.BoxGeometry(2.4, 4.5, 0.4);
      const dMat = new THREE.MeshLambertMaterial({ color: "#78350f" });
      const dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.set(0, 2.25, 5.1);
      hGroup.add(dMesh);

      // Jendela Kiri & Kanan
      const wGeo = new THREE.BoxGeometry(2, 2, 0.3);
      const wMat = new THREE.MeshLambertMaterial({ color: "#bae6fd" });
      const winL = new THREE.Mesh(wGeo, wMat);
      winL.position.set(-3.5, 5, 5.1);
      const winR = winL.clone();
      winR.position.set(3.5, 5, 5.1);
      hGroup.add(winL);
      hGroup.add(winR);

      // Posisi di sisi jalan
      hGroup.position.set(12, 0, hc.z);
      scene.add(hGroup);
    });

    // 5. OBJEK MISI AKSI NYATA INTERAKTIF DI DEKAT TIAP RUMAH
    const targetMeshes: THREE.Mesh[] = [];

    // Target 1: Radio Speaker (Z = -55)
    const radioGeo = new THREE.BoxGeometry(1.6, 1.2, 0.8);
    const radioMat = new THREE.MeshLambertMaterial({ color: "#475569" });
    const radioMesh = new THREE.Mesh(radioGeo, radioMat);
    radioMesh.position.set(2, 0.8, -55);
    radioMesh.castShadow = true;
    scene.add(radioMesh);
    targetMeshes.push(radioMesh);

    // Target 2: Sepeda & Doni (Z = -125)
    const doniGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const doniMat = new THREE.MeshLambertMaterial({ color: "#f97316" });
    const doniMesh = new THREE.Mesh(doniGeo, doniMat);
    doniMesh.position.set(2, 0.7, -125);
    scene.add(doniMesh);
    targetMeshes.push(doniMesh);

    // Target 3: Tiang Bendera Bhinneka (Z = -195)
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 7, 8);
    const poleMat = new THREE.MeshLambertMaterial({ color: "#f8fafc" });
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.position.set(2, 3.5, -195);
    scene.add(poleMesh);
    // Bendera Merah Putih
    const flagGeo = new THREE.BoxGeometry(2.5, 1.4, 0.1);
    const flagMat = new THREE.MeshLambertMaterial({ color: "#ef4444" });
    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(3.2, 5.5, -195);
    scene.add(flagMesh);
    targetMeshes.push(poleMesh);

    // Target 4: Kotak Suara Balai Desa (Z = -265)
    const ballotGeo = new THREE.BoxGeometry(1.6, 2, 1.6);
    const ballotMat = new THREE.MeshLambertMaterial({ color: "#f8fafc" });
    const ballotMesh = new THREE.Mesh(ballotGeo, ballotMat);
    ballotMesh.position.set(2, 1, -265);
    scene.add(ballotMesh);
    targetMeshes.push(ballotMesh);

    // Target 5: Kotak Alat Piket Bersama (Z = -335)
    const piketGeo = new THREE.BoxGeometry(2, 1.5, 1.5);
    const piketMat = new THREE.MeshLambertMaterial({ color: "#ca8a04" });
    const piketMesh = new THREE.Mesh(piketGeo, piketMat);
    piketMesh.position.set(2, 0.75, -335);
    scene.add(piketMesh);
    targetMeshes.push(piketMesh);

    // 6. RINTANGAN OBBY ROBLOX (Duri Tajam & Lava di Antar Pulau)
    const obstacleList = [
      { z: -85, type: "spikes" },
      { z: -155, type: "lava" },
      { z: -225, type: "spikes" },
      { z: -295, type: "lava" },
    ];

    obstacleList.forEach((obs) => {
      if (obs.type === "spikes") {
        for (let x = -4; x <= 4; x += 1.6) {
          const sGeo = new THREE.ConeGeometry(0.6, 1.8, 4);
          const sMat = new THREE.MeshLambertMaterial({ color: "#dc2626" });
          const sMesh = new THREE.Mesh(sGeo, sMat);
          sMesh.position.set(x, 0.9, obs.z);
          scene.add(sMesh);
        }
      } else {
        const lGeo = new THREE.BoxGeometry(10, 0.2, 5);
        const lMat = new THREE.MeshBasicMaterial({ color: "#ea580c" });
        const lMesh = new THREE.Mesh(lGeo, lMat);
        lMesh.position.set(0, 0.05, obs.z);
        scene.add(lMesh);
      }
    });

    // 7. KARAKTER 3D ROBLOX: ANAK SD INDONESIA (SERAGAM MERAH PUTIH + TOPI SD + RANSEL SEKOLAH)
    const playerGroup = new THREE.Group();

    // Badan Kotak: Kemeja Putih Seragam SD
    const torsoGeo = new THREE.BoxGeometry(1.3, 1.5, 0.7);
    const torsoMat = new THREE.MeshLambertMaterial({ color: "#ffffff" }); // Kemeja Putih SD
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.y = 2.15;
    torsoMesh.castShadow = true;
    playerGroup.add(torsoMesh);

    // Dasi Merah SD Khas Siswa Indonesia
    const tieGeo = new THREE.BoxGeometry(0.22, 0.9, 0.08);
    const tieMat = new THREE.MeshLambertMaterial({ color: "#dc2626" }); // Merah Dasi SD
    const tieMesh = new THREE.Mesh(tieGeo, tieMat);
    tieMesh.position.set(0, 2.15, 0.38);
    playerGroup.add(tieMesh);

    // Saku Kemeja SD di Dada Kiri
    const pocketGeo = new THREE.BoxGeometry(0.28, 0.32, 0.06);
    const pocketMat = new THREE.MeshLambertMaterial({ color: "#e2e8f0" });
    const pocketMesh = new THREE.Mesh(pocketGeo, pocketMat);
    pocketMesh.position.set(-0.35, 2.35, 0.38);
    playerGroup.add(pocketMesh);

    // Tas Ransel Sekolah 3D di Punggung
    const backpackGeo = new THREE.BoxGeometry(1.0, 1.2, 0.45);
    const backpackMat = new THREE.MeshLambertMaterial({ color: "#f97316" }); // Ransel Oranye Ceria
    const backpackMesh = new THREE.Mesh(backpackGeo, backpackMat);
    backpackMesh.position.set(0, 2.2, -0.45);
    backpackMesh.castShadow = true;
    playerGroup.add(backpackMesh);

    // Tali Ransel di Bahu Kiri & Kanan
    const strapGeo = new THREE.BoxGeometry(0.12, 1.3, 0.1);
    const strapMat = new THREE.MeshLambertMaterial({ color: "#ea580c" });
    const strapL = new THREE.Mesh(strapGeo, strapMat);
    strapL.position.set(-0.4, 2.2, 0.36);
    const strapR = strapL.clone();
    strapR.position.set(0.4, 2.2, 0.36);
    playerGroup.add(strapL);
    playerGroup.add(strapR);

    // Kepala Kotak Roblox
    const headGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    const headMat = new THREE.MeshLambertMaterial({ color: "#fed7aa" }); // Warna kulit ramah
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 3.35;
    headMesh.castShadow = true;
    playerGroup.add(headMesh);

    // Rambut Hitam Anak SD
    const hairGeo = new THREE.BoxGeometry(0.88, 0.3, 0.88);
    const hairMat = new THREE.MeshLambertMaterial({ color: "#1e293b" });
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.y = 3.75;
    playerGroup.add(hairMesh);

    // Topi Merah-Putih Siswa SD (Bagian Atas Merah, Bagian Bawah Putih)
    const capTopGeo = new THREE.BoxGeometry(0.92, 0.35, 0.92);
    const capTopMat = new THREE.MeshLambertMaterial({ color: "#dc2626" }); // Merah Topi SD
    const capTopMesh = new THREE.Mesh(capTopGeo, capTopMat);
    capTopMesh.position.y = 3.95;
    playerGroup.add(capTopMesh);

    // Pet / Lidah Topi SD di Depan
    const visorGeo = new THREE.BoxGeometry(0.85, 0.08, 0.45);
    const visorMat = new THREE.MeshLambertMaterial({ color: "#dc2626" });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 3.82, 0.55);
    playerGroup.add(visorMesh);

    // Lengan Kiri & Kanan (Lengan Baju Putih + Tangan Kuning)
    const sleeveGeo = new THREE.BoxGeometry(0.5, 0.6, 0.5);
    const sleeveMat = new THREE.MeshLambertMaterial({ color: "#ffffff" }); // Lengan Putih

    const handGeo = new THREE.BoxGeometry(0.45, 0.7, 0.45);
    const handMat = new THREE.MeshLambertMaterial({ color: "#fed7aa" });

    // Lengan Kiri
    const leftArm = new THREE.Group();
    const lSleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    lSleeve.position.y = 0.35;
    const lHand = new THREE.Mesh(handGeo, handMat);
    lHand.position.y = -0.3;
    leftArm.add(lSleeve);
    leftArm.add(lHand);
    leftArm.position.set(-0.95, 2.15, 0);
    playerGroup.add(leftArm);

    // Lengan Kanan
    const rightArm = new THREE.Group();
    const rSleeve = lSleeve.clone();
    const rHand = lHand.clone();
    rightArm.add(rSleeve);
    rightArm.add(rHand);
    rightArm.position.set(0.95, 2.15, 0);
    playerGroup.add(rightArm);

    // Kaki Kiri & Kanan: Celana Merah SD + Kaos Kaki Putih + Sepatu Hitam
    const pantsGeo = new THREE.BoxGeometry(0.55, 0.75, 0.55);
    const pantsMat = new THREE.MeshLambertMaterial({ color: "#dc2626" }); // Celana Merah SD

    const sockGeo = new THREE.BoxGeometry(0.52, 0.35, 0.52);
    const sockMat = new THREE.MeshLambertMaterial({ color: "#ffffff" }); // Kaos Kaki Putih

    const shoeGeo = new THREE.BoxGeometry(0.56, 0.35, 0.65);
    const shoeMat = new THREE.MeshLambertMaterial({ color: "#0f172a" }); // Sepatu Hitam

    // Kaki Kiri
    const leftLeg = new THREE.Group();
    const lPants = new THREE.Mesh(pantsGeo, pantsMat);
    lPants.position.y = 0.35;
    const lSock = new THREE.Mesh(sockGeo, sockMat);
    lSock.position.y = -0.15;
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
    lShoe.position.set(0, -0.45, 0.05);
    leftLeg.add(lPants);
    leftLeg.add(lSock);
    leftLeg.add(lShoe);
    leftLeg.position.set(-0.35, 0.7, 0);
    playerGroup.add(leftLeg);

    // Kaki Kanan
    const rightLeg = new THREE.Group();
    const rPants = lPants.clone();
    const rSock = lSock.clone();
    const rShoe = lShoe.clone();
    rightLeg.add(rPants);
    rightLeg.add(rSock);
    rightLeg.add(rShoe);
    rightLeg.position.set(0.35, 0.7, 0);
    playerGroup.add(rightLeg);

    // Label Nama Di Atas Karakter
    const nameCanvas = document.createElement("canvas");
    nameCanvas.width = 320;
    nameCanvas.height = 64;
    const nCtx = nameCanvas.getContext("2d")!;
    nCtx.fillStyle = "#ffffff";
    nCtx.font = "bold 26px sans-serif";
    nCtx.textAlign = "center";
    nCtx.fillText("🎒 Budi (Siswa SD Pancasila)", 160, 42);

    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameSpriteMat = new THREE.SpriteMaterial({ map: nameTex });
    const nameSprite = new THREE.Sprite(nameSpriteMat);
    nameSprite.position.set(0, 4.6, 0);
    nameSprite.scale.set(3.5, 0.75, 1);
    playerGroup.add(nameSprite);

    playerGroup.position.set(0, 0, 0);
    scene.add(playerGroup);

    // 8. GAME LOOP, FISIKA & KONTROL ROBLOX 3D
    let animId: number;
    let vy = 0;
    let isJumping = false;
    let walkAnim = 0;

    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      const keys = keysRef.current;
      const speed = keys.sprint ? 14 : 9;

      let moveX = 0;
      let moveZ = 0;

      if (keys.forward) moveZ -= 1;
      if (keys.backward) moveZ += 1;
      if (keys.left) moveX -= 1;
      if (keys.right) moveX += 1;

      // Normalisasi arah
      if (moveX !== 0 || moveZ !== 0) {
        const len = Math.hypot(moveX, moveZ);
        moveX /= len;
        moveZ /= len;

        playerGroup.position.x += moveX * speed * delta;
        playerGroup.position.z += moveZ * speed * delta;

        // Batasi arena
        playerGroup.position.x = Math.max(-28, Math.min(28, playerGroup.position.x));
        playerGroup.position.z = Math.max(-380, Math.min(5, playerGroup.position.z));

        // Rotasi karakter menghadap arah jalan
        const targetRot = Math.atan2(moveX, moveZ);
        playerGroup.rotation.y = targetRot + Math.PI;

        // Animasi ayunan kaki dan tangan
        walkAnim += delta * (keys.sprint ? 16 : 10);
        const swing = Math.sin(walkAnim) * 0.6;
        leftLeg.rotation.x = swing;
        rightLeg.rotation.x = -swing;
        leftArm.rotation.x = -swing;
        rightArm.rotation.x = swing;
      } else {
        // Reset pose diam
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
      }

      // Gravitasi & Lompat
      if (keys.jump && !isJumping) {
        vy = 9.5;
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

      // Cek Rintangan Obby (Duri / Lava)
      for (const obs of obstacleList) {
        if (
          Math.abs(playerGroup.position.z - obs.z) < 2.2 &&
          Math.abs(playerGroup.position.x) < 5 &&
          playerGroup.position.y < 0.6
        ) {
          playOofSound();
          // Mundur ke zona aman
          playerGroup.position.z += 8;
          setPlayerLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) return 3;
            return nextL;
          });
          break;
        }
      }

      // Cek Jarak dengan Misi Aksi Nyata
      let curNearby: SilaActionMission | null = null;
      for (const m of missions) {
        if (Math.abs(playerGroup.position.z - m.zoneZ) < 5 && Math.abs(playerGroup.position.x - 2) < 4) {
          curNearby = m;
          break;
        }
      }
      setNearbyMission(curNearby);

      // KAMERA THIRD-PERSON (Mengikuti Karakter Roblox Seperti Foto Pengguna!)
      const camTargetX = playerGroup.position.x;
      const camTargetY = playerGroup.position.y + 4.2;
      const camTargetZ = playerGroup.position.z + 8.5;

      camera.position.x += (camTargetX - camera.position.x) * 0.12;
      camera.position.y += (camTargetY - camera.position.y) * 0.12;
      camera.position.z += (camTargetZ - camera.position.z) * 0.12;
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.6, playerGroup.position.z - 3);

      // Auto-update canvas viewport size jika ada perubahan dimensi layar
      const { w, h } = getViewportSize();
      if (
        renderer.domElement.width === 0 ||
        renderer.domElement.height === 0 ||
        Math.abs(renderer.domElement.clientWidth - w) > 10 ||
        Math.abs(renderer.domElement.clientHeight - h) > 10
      ) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mount) return;
      const { w, h } = getViewportSize();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", handleResize);

    // Keyboard Handler
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
        triggerMissionAction();
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
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [gameType, isOpen, missions, triggerMissionAction]);

  // --------------------------------------------------------------------------
  // GAME MENJODOHKAN (UNTUK BAHASA JAWA)
  // --------------------------------------------------------------------------
  const matchingPairs: MatchingPair[] = useMemo(() => {
    return [
      { id: "1", left: "Semar", right: "Kuncung Putih & Bapak Bijaksana", hint: "Tokoh paling sepuh" },
      { id: "2", left: "Gareng", right: "Sikil Jinjit & Tangan Ceko", hint: "Waspada lan ngati-ati" },
      { id: "3", left: "Petruk", right: "Irung Dawa & Seneng Guyon", hint: "Awak dhuwur langsing" },
      { id: "4", left: "Bagong", right: "Awak Bunder Lemu & Jujur", hint: "Anak bungsu Semar" },
    ];
  }, []);

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

  if (!isOpen) return null;

  return (
    <ModalPortal>
      {/* CONTAINER FULLSCREEN 100vw x 100vh */}
      <div
        className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="roblox-game-title"
      >
        {/* HUD TOP BAR ROBLOX 3D */}
        <header className="h-14 bg-slate-900/95 border-b-2 border-yellow-400 text-white px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-lg z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-xl shadow-md shrink-0">
              {gameType === "adventure" ? "🎒" : "🧩"}
            </span>
            <div className="min-w-0">
              <h2 id="roblox-game-title" className="font-black text-sm sm:text-base text-yellow-300 truncate tracking-wide">
                {gameType === "adventure"
                  ? "PETUALANGAN DI DESA PANCASILA: PENGAMALAN SISWA SD MERAH PUTIH"
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

            {/* Skor Prestasi */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-full border border-yellow-400/50">
              <span className="text-xs font-black text-yellow-300">
                🪙 {gameType === "adventure" ? adventureScore : matchingScore} Poin Sila
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
            // DUNIA 3D ROBLOX THREE.JS (REAL 3D PERSPECTIVE)
            // =========================================================
            adventureFinished ? (
              <div className="text-center py-8 px-6 bg-slate-900/95 border-4 border-yellow-400 rounded-3xl shadow-2xl max-w-lg space-y-4 animate-in zoom-in-95 z-30 text-white">
                <div className="w-24 h-24 bg-yellow-400/20 rounded-full mx-auto flex items-center justify-center text-5xl shadow-inner border-2 border-yellow-400 animate-bounce">
                  🏆
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-2xl text-yellow-300">
                    SELAMAT! KAMU SISWA TELADAN DESA PANCASILA! 🇮🇩
                  </h3>
                  <p className="text-sm font-medium text-slate-300">
                    Kamu berhasil memahami dan mempraktikkan seluruh pengamalan 5 Sila Pancasila dalam perjalanan di Desa Nusantara!
                  </p>
                </div>
                <div className="inline-flex items-center gap-3 bg-yellow-400/20 text-yellow-300 font-black px-5 py-2.5 rounded-2xl border border-yellow-400 text-sm">
                  <span>⭐ Poin Prestasi: +25 Poin</span>
                  <span>•</span>
                  <span>Skor Aksi: {adventureScore} Poin 🪙</span>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setMissions(initialMissions);
                      setAdventureScore(0);
                      setAdventureFinished(false);
                      setGameStarted(true);
                      startAdventureBgm();
                    }}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-3 px-8 rounded-full shadow-lg transition text-sm cursor-pointer"
                  >
                    🔄 Main Jelajah Desa dari Awal
                  </button>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                {/* THREE.JS 3D CANVAS MOUNT */}
                <div ref={mountRef} className="absolute inset-0 w-full h-full block" />

                {/* OVERLAY AWAL MULAI MAIN (UN-MUTE AUDIO) */}
                {!gameStarted && (
                  <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center text-5xl shadow-2xl border-4 border-white animate-bounce">
                      🎒
                    </div>
                    <div className="space-y-2 max-w-md">
                      <h3 className="font-black text-2xl text-yellow-300 tracking-wide">
                        PETUALANGAN DI DESA PANCASILA 🇮🇩
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        Ayo berpetualang sebagai <b>Siswa SD Berseragam Merah Putih</b>! Menjelajahi pedesaan asri nusantara, mengunjungi pos-pos warga desa, dan memahami pengamalan 5 Sila Pancasila lewat aksi nyata langsung.
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
                      <span>▶️ MULAI JELAJAH DESA (DENGAN MUSIK 🎵)</span>
                    </button>
                  </div>
                )}

                {/* HUD PROGRESS 5 SILA DI ATAS */}
                <div className="absolute top-3 inset-x-4 sm:inset-x-12 z-20 flex items-center justify-between gap-1.5 sm:gap-3 bg-slate-900/85 backdrop-blur-md p-2.5 rounded-2xl border border-yellow-400/40">
                  {missions.map((m) => (
                    <div
                      key={m.id}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-center text-xs font-black transition flex items-center justify-center gap-1.5 ${
                        m.completed
                          ? "bg-emerald-600 text-white shadow-sm"
                          : nearbyMission?.id === m.id
                          ? "bg-yellow-400 text-slate-950 ring-2 ring-yellow-300 animate-pulse"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <span>{m.symbol}</span>
                      <span className="hidden md:inline">Sila {m.silaNumber}</span>
                      {m.completed && <span>✓</span>}
                    </div>
                  ))}
                </div>

                {/* NOTIFIKASI AKSI BERHASIL DI LAYAR */}
                {activeNotification && (
                  <div className="absolute top-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 max-w-lg bg-emerald-950/90 border-2 border-emerald-400 p-4 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in text-white text-xs sm:text-sm font-bold backdrop-blur-md">
                    {activeNotification}
                  </div>
                )}

                {/* TOMBOL POPUP AKSI NYATA SAAT DI DEKAT OBJEK MISI */}
                {nearbyMission && !nearbyMission.completed && (
                  <div className="absolute bottom-28 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 max-w-md w-full bg-slate-900/95 border-3 border-yellow-400 p-4 rounded-3xl shadow-2xl animate-bounce text-white space-y-2.5 text-center">
                    <div className="text-xs font-black text-yellow-300 uppercase tracking-wider">
                      🎯 Misi Aksi Nyata Sila {nearbyMission.silaNumber} ({nearbyMission.symbol})
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-200">
                      {nearbyMission.instructionText}
                    </p>
                    <button
                      type="button"
                      onClick={triggerMissionAction}
                      className="w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-black py-3 px-6 rounded-2xl text-sm shadow-xl transition cursor-pointer border-2 border-white"
                    >
                      {nearbyMission.actionPrompt} (TEKAN 'E')
                    </button>
                  </div>
                )}

                {/* KONTROL ON-SCREEN VIRTUAL CONTROLLER ROBLOX DI BAWAH */}
                <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between pointer-events-none">
                  {/* D-Pad Navigasi 3D (Maju, Mundur, Kiri, Kanan, Sprint) */}
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

                  {/* Tombol Aksi Nyata & Lompat Roblox */}
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSprinting((s) => {
                          const next = !s;
                          keysRef.current.sprint = next;
                          playDashSound();
                          return next;
                        });
                      }}
                      className={`h-12 px-3 sm:px-4 rounded-xl border font-black text-xs shadow-lg transition active:scale-90 flex items-center gap-1 cursor-pointer ${
                        isSprinting
                          ? "bg-amber-400 text-slate-950 border-white ring-2 ring-yellow-300"
                          : "bg-slate-900/80 text-yellow-300 border-yellow-400/60 hover:bg-slate-800"
                      }`}
                    >
                      <span>⚡</span>
                      <span className="hidden sm:inline">SPRINT</span>
                    </button>

                    {nearbyMission && !nearbyMission.completed && (
                      <button
                        type="button"
                        onClick={triggerMissionAction}
                        className="h-12 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs shadow-xl transition active:scale-90 flex items-center gap-1 cursor-pointer border-2 border-white animate-pulse"
                      >
                        <span>🖐️</span>
                        <span>AKSI SILA</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onMouseDown={() => (keysRef.current.jump = true)}
                      onMouseUp={() => (keysRef.current.jump = false)}
                      onTouchStart={() => (keysRef.current.jump = true)}
                      onTouchEnd={() => (keysRef.current.jump = false)}
                      className="h-12 px-6 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition active:scale-90 flex items-center gap-1.5 cursor-pointer border-2 border-white"
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
            // GAME MENJODOHKAN (BASA JAWA)
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
                            onClick={() => {
                              if (isDone) return;
                              playClickSound();
                              setSelectedLeft(pair.id);
                            }}
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
                            onClick={() => {
                              if (!selectedLeft) return;
                              if (isDone) return;
                              if (selectedLeft === pair.id) {
                                playCorrectSound();
                                playCoinSound();
                                const updated = [...matchedIds, pair.id];
                                setMatchedIds(updated);
                                setSelectedLeft(null);
                                setMatchingScore((prev) => prev + 10);
                                if (updated.length === matchingPairs.length) {
                                  setMatchingFinished(true);
                                  playBadgeFanfareSound();
                                  addPoints(25);
                                }
                              } else {
                                playOofSound();
                                setSelectedLeft(null);
                              }
                            }}
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
