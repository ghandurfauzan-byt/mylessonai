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
  // 5 MISI AKSI NYATA PENGAMALAN 5 SILA PANCASILA (ROLEPLAY AKSI ROBLOX)
  // --------------------------------------------------------------------------
  const initialMissions: SilaActionMission[] = useMemo(() => {
    return [
      {
        id: 1,
        silaNumber: 1,
        symbol: "⭐",
        title: "Toleransi Tempat Ibadah",
        zoneZ: -55,
        islandName: "Pulau Bintang (Sila 1)",
        actionTargetName: "Radio Speaker Bising",
        actionIcon: "📻",
        actionPrompt: "🔇 MATIKAN RADIO & JAGA KETENANGAN",
        instructionText: "Di dekat rumah ibadah kawan, ada radio speaker yang menyala bising. Matikan volumenya agar kawan bisa beribadah khusyuk!",
        successStory: "Alhamdulillah / Puji Tuhan! Kamu mematikan suara bising sehingga Samuel & Siti bisa beribadah dengan damai dan khusyuk.",
        completed: false,
      },
      {
        id: 2,
        silaNumber: 2,
        symbol: "⛓️",
        title: "Kemanusiaan & Pertolongan",
        zoneZ: -125,
        islandName: "Pulau Rantai (Sila 2)",
        actionTargetName: "Doni Terjatuh Sepeda",
        actionIcon: "🩹",
        actionPrompt: "🩹 OBATI LUKA & BANTU DONI BERDIRI",
        instructionText: "Doni terjatuh dari sepedanya di jembatan bebatuan dan lututnya terluka! Ambil kotak P3K dan bantu Doni berdiri.",
        successStory: "Luar biasa berbudi pekerti! Kamu sigap mengobati luka Doni dan membantunya bangun dengan penuh kasih sayang.",
        completed: false,
      },
      {
        id: 3,
        silaNumber: 3,
        symbol: "🌳",
        title: "Persatuan Bhinneka Tunggal Ika",
        zoneZ: -195,
        islandName: "Pulau Beringin (Sila 3)",
        actionTargetName: "Tiang Balai Bhinneka",
        actionIcon: "🇮🇩",
        actionPrompt: "🇮🇩 KIBARKAN BENDERA & AJAK MAIN BERSAMA",
        instructionText: "Ada teman-teman dari berbagai suku yang belum rukun membentuk tim kasti. Kibarkan bendera Merah Putih di balai untuk menyatukan mereka!",
        successStory: "Bhinneka Tunggal Ika! Seluruh anak dari Sabang sampai Merauke kini bersatu gembira bermain bersama tanpa membeda-bedakan.",
        completed: false,
      },
      {
        id: 4,
        silaNumber: 4,
        symbol: "🐂",
        title: "Musyawarah Mufakat",
        zoneZ: -265,
        islandName: "Pulau Banteng (Sila 4)",
        actionTargetName: "Kotak Suara Balai Desa",
        actionIcon: "🗳️",
        actionPrompt: "🗳️ MASUKKAN SUARA & DUKUNG KEPUTUSAN KELAS",
        instructionText: "Di Balai Desa sedang diadakan musyawarah pemilihan tujuan karya wisata. Masukkan surat kesepakatan dan dukung keputusan bersama!",
        successStory: "Sikap pemimpin bijak! Kamu menerima hasil mufakat dengan lapang dada dan menghormati keputusan musyawarah bersama.",
        completed: false,
      },
      {
        id: 5,
        silaNumber: 5,
        symbol: "🌾",
        title: "Keadilan Gotong Royong",
        zoneZ: -335,
        islandName: "Pulau Padi & Kapas (Sila 5)",
        actionTargetName: "Kotak Alat Piket Bersama",
        actionIcon: "🧹",
        actionPrompt: "🧹 BAGIKAN TUGAS PIKET SECARA ADIL MERATA",
        instructionText: "Tiba di pos akhir Lumbung Keadilan! Bagikan alat sapu dan tugas piket secara merata kepada seluruh anggota regu piket.",
        successStory: "Keadilan sosial terwujud sempurna! Semua anak mendapat tugas yang seimbang dan adil tanpa ada yang diberatkan.",
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

    const camera = new THREE.PerspectiveCamera(
      58,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

    // 7. KARAKTER 3D ROBLOX AVATAR (Mirip Persis Foto Roblox Pengguna!)
    const playerGroup = new THREE.Group();

    // Badan Kotak (Torso)
    const torsoGeo = new THREE.BoxGeometry(1.3, 1.5, 0.7);
    const torsoMat = new THREE.MeshLambertMaterial({ color: "#2563eb" }); // Baju Biru
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.y = 2.15;
    torsoMesh.castShadow = true;
    playerGroup.add(torsoMesh);

    // Jaket Hitam Luaran (Vest)
    const vestGeo = new THREE.BoxGeometry(1.36, 1.4, 0.76);
    const vestMat = new THREE.MeshLambertMaterial({ color: "#0f172a" }); // Jaket Gelap
    const vestMesh = new THREE.Mesh(vestGeo, vestMat);
    vestMesh.position.y = 2.15;
    playerGroup.add(vestMesh);

    // Kepala Kotak Roblox
    const headGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    const headMat = new THREE.MeshLambertMaterial({ color: "#fed7aa" }); // Warna kulit
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 3.35;
    headMesh.castShadow = true;
    playerGroup.add(headMesh);

    // Rambut Cokelat Khas Roblox (Bacon Hair Style!)
    const hairGeo = new THREE.BoxGeometry(0.95, 0.45, 0.95);
    const hairMat = new THREE.MeshLambertMaterial({ color: "#854d0e" });
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.y = 3.85;
    playerGroup.add(hairMesh);

    // Lengan Kiri & Kanan (Kotak dengan Tangan Putih C-shape)
    const armGeo = new THREE.BoxGeometry(0.5, 1.3, 0.5);
    const armMat = new THREE.MeshLambertMaterial({ color: "#0f172a" });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.95, 2.15, 0);
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.95, 2.15, 0);
    playerGroup.add(rightArm);

    // Kaki Kiri & Kanan (Celana Hitam + Sepatu Putih)
    const legGeo = new THREE.BoxGeometry(0.55, 1.4, 0.55);
    const legMat = new THREE.MeshLambertMaterial({ color: "#1e293b" }); // Celana Hitam
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.35, 0.7, 0);
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.35, 0.7, 0);
    playerGroup.add(rightLeg);

    // Sepatu Putih
    const shoeGeo = new THREE.BoxGeometry(0.56, 0.35, 0.65);
    const shoeMat = new THREE.MeshLambertMaterial({ color: "#f8fafc" });
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.35, 0.18, 0.05);
    playerGroup.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.35, 0.18, 0.05);
    playerGroup.add(rightShoe);

    // Label Nama Di Atas Karakter
    const nameCanvas = document.createElement("canvas");
    nameCanvas.width = 256;
    nameCanvas.height = 64;
    const nCtx = nameCanvas.getContext("2d")!;
    nCtx.fillStyle = "#ffffff";
    nCtx.font = "bold 26px sans-serif";
    nCtx.textAlign = "center";
    nCtx.fillText("⭐ Petualang SD", 128, 42);

    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameSpriteMat = new THREE.SpriteMaterial({ map: nameTex });
    const nameSprite = new THREE.Sprite(nameSpriteMat);
    nameSprite.position.set(0, 4.4, 0);
    nameSprite.scale.set(3, 0.75, 1);
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

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
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
              {gameType === "adventure" ? "🕹️" : "🧩"}
            </span>
            <div className="min-w-0">
              <h2 id="roblox-game-title" className="font-black text-sm sm:text-base text-yellow-300 truncate tracking-wide">
                {gameType === "adventure"
                  ? "DUNIA 3D ROBLOX: JELAJAH DESA 5 SILA & OBBY AKSI NYATA"
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
                    SELAMAT! KAMU JUARA 5 AKSI PANCASILA!
                  </h3>
                  <p className="text-sm font-medium text-slate-300">
                    Kamu berhasil melakukan 5 aksi pengamalan nyata dan menuntaskan rintangan obby di Dunia 3D Roblox!
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
                    🔄 Main Petualangan 3D dari Awal
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative">
                {/* OVERLAY AWAL MULAI MAIN (UN-MUTE AUDIO) */}
                {!gameStarted && (
                  <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center text-5xl shadow-2xl border-4 border-white animate-bounce">
                      🕹️
                    </div>
                    <div className="space-y-2 max-w-md">
                      <h3 className="font-black text-2xl text-yellow-300 tracking-wide">
                        DUNIA 3D ROBLOX: AKSI PANCASILA
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        Jelajahi desa 3D dengan karakter Roblox! Bukan sekadar menjawab kuis, kamu akan langsung mempraktikkan <b>5 Aksi Nyata Pengamalan Pancasila</b> di rumah-rumah warga dan melompati rintangan obby!
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
                      <span>▶️ MULAI MAIN 3D (DENGAN MUSIK 🎵)</span>
                    </button>
                  </div>
                )}

                {/* THREE.JS 3D CANVAS MOUNT */}
                <div ref={mountRef} className="w-full h-full block" />

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
