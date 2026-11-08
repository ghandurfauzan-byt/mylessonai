// frontend/src/components/AdaptiveEduGameModal.tsx
// Game Edukasi 3D Roblox: "Jelajah Suku Nusantara & Desa Pancasila"
// Fitur Utama:
// 1. Gapura Masuk Megah (Gapura Nusantara Tradisional) di titik awal
// 2. Jalur pedesaan asri dengan pepohonan rindang, kelapa, bunga, dan lentera
// 3. Koin Emas & Bintang Pancasila berputar di sepanjang jalan yang bisa diambil (Pick-up +5 Poin)
// 4. Suasana multiplayer kelas: Teman-teman sekelas (NPC siswa) yang sedang berjalan & menjelajah bersama
// 5. Rumah Adat 5 Suku Nusantara (Suku Jawa, Sunda, Minang, Dayak, Papua)
//    - Di setiap suku ada tokoh adat yang menyapa dan memberi pertanyaan edukatif seputar Pancasila
// 6. UI Modern Elegan & Rounded (Glassmorphism, Pill Buttons, Animasi Ceria - Tidak Kaku / Kotak-kotak)
// 7. Papan Skor Kelas (Leaderboard Siswa) yang interaktif dan dinamis

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

// Model Teman Sekelas
interface Classmate {
  name: string;
  avatar: string;
  x: number;
  z: number;
  speed: number;
  dir: number;
  mesh?: THREE.Group;
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
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [allSukuCompleted, setAllSukuCompleted] = useState(false);

  // Dialog State untuk Kuis di Rumah Suku
  const [activeSukuDialog, setActiveSukuDialog] = useState<SukuAdat | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

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
  const playerPosRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 12 });

  // --------------------------------------------------------------------------
  // DATA 5 SUKU NUSANTARA (1 SUKU UNTUK 1 SILA PANCASILA)
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
        { id: "A", teks: "Menjaga ketenangan dan menghormati ibadahnya dengan ramah.", benar: true, penjelasan: "Sangat bijak! Sila 1 mengajarkan toleransi dan kerukunan antarumat beragama." },
        { id: "B", teks: "Menyuruhnya berhenti karena berbeda cara berdoanya.", benar: false, penjelasan: "Keliru. Kita tidak boleh memaksakan keyakinan kepada orang lain." },
        { id: "C", teks: "Bermain petasan di dekat tempat ibadah.", benar: false, penjelasan: "Tidak sopan. Tempat ibadah harus dijaga kesucian dan ketenangannya." },
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
        { id: "A", teks: "Menyambutnya hangat, mengajaknya bermain rukun: Bhinneka Tunggal Ika!", benar: true, penjelasan: "Bhinneka Tunggal Ika! Perbedaan suku adalah kekayaan pemersatu bangsa." },
        { id: "B", teks: "Menjauhinya dan membentuk kelompok yang hanya dari satu suku saja.", benar: false, penjelasan: "Sikap eksklusif memecah belah persatuan bangsa." },
        { id: "C", teks: "Mengejek logat dan pakaian adat daerah asalnya.", benar: false, penjelasan: "Mengejek budaya daerah kawan melanggar persatuan nasional." },
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
        { id: "A", teks: "Musyawarah mufakat, mendengarkan semua usulan, dan mengambil keputusan bersama.", benar: true, penjelasan: "Musyawarah mufakat menjunjung tinggi kebijaksanaan dan kebersamaan." },
        { id: "B", teks: "Ketua kelas memaksa semua murid mengikuti kemauan pribadinya.", benar: false, penjelasan: "Pemaksaan kehendak melanggar hak demokrasi Sila 4." },
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
        { id: "A", teks: "Membagi hasil panen secara merata dan dinikmati bersama seluruh siswa.", benar: true, penjelasan: "Keadilan sosial terwujud nyata! Semua yang bekerja keras berhak menikmati hasil bersama." },
        { id: "B", teks: "Semua hasil panen dibawa pulang oleh satu orang saja.", benar: false, penjelasan: "Tindakan serakah melanggar keadilan sosial." },
        { id: "C", teks: "Menjual hasil panen secara diam-diam tanpa izin teman-teman.", benar: false, penjelasan: "Tidak jujur dan melanggar hak bersama." },
      ],
    },
  ], []);

  // Leaderboard Kelas Simulasi
  const classLeaderboard = useMemo(() => [
    { rank: 1, name: "Siti Rahma", points: 145, avatar: "👧", badge: "Pancasila Juara" },
    { rank: 2, name: "Budi Santoso", points: 130, avatar: "👦", badge: "Ksatria Suku" },
    { rank: 3, name: "Kamu (Penjelajah)", points: adventureScore, avatar: "🎒", badge: "Penjelajah Aktif", isPlayer: true },
    { rank: 4, name: "Edo Pratama", points: 95, avatar: "🧒", badge: "Duta Toleransi" },
    { rank: 5, name: "Dayu Kemala", points: 80, avatar: "👧", badge: "Sahabat Desa" },
    { rank: 6, name: "Beni Nugraha", points: 65, avatar: "👦", badge: "Pengelana Rukun" },
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
      setShowGuideModal(false);
      setAllSukuCompleted(false);
    }
  }, [isOpen]);

  // Kontrol Background Music
  useEffect(() => {
    if (isOpen && gameStarted && bgmEnabled) {
      startAdventureBgm();
    }
    return () => {
      stopAdventureBgm();
    };
  }, [isOpen, gameStarted, bgmEnabled]);

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
        addPoints(25, `Menjawab soal di ${suku.namaSuku}`);

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
  // ENGINE 3D THREE.JS: DUNIA DESA SUKU NUSANTARA
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !mountEl) return;

    const mount = mountEl;

    // 1. SETUP SCENE, CAMERA, & RENDERER
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#7dd3fc"); // Langit Biru Sejuk Tropis
    scene.fog = new THREE.FogExp2("#bae6fd", 0.006);

    const getViewportSize = () => {
      const rect = mount.getBoundingClientRect();
      const w = rect.width > 50 ? Math.floor(rect.width) : window.innerWidth;
      const h = rect.height > 50 ? Math.floor(rect.height) : Math.max(300, window.innerHeight - 56);
      return { w, h };
    };

    const { w: initW, h: initH } = getViewportSize();

    const camera = new THREE.PerspectiveCamera(56, initW / initH, 0.1, 1000);
    camera.position.set(0, 4.5, 20);
    camera.lookAt(0, 1.8, 12);

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

    // 2. LIGHTING (Terang, Alami & Hangat)
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.95);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight("#ffffff", "#445566", 0.85);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight("#fffbeb", 1.4);
    sunLight.position.set(25, 60, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // 3. TERRAIN LEMBUT DESA (Rumput Hijau Subur & Jalan Paving Alami)
    const groundGeo = new THREE.PlaneGeometry(140, 420);
    const groundMat = new THREE.MeshLambertMaterial({ color: "#22c55e" }); // Hijau Segar
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, 0, -150);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Jalur Jalan Paving Pedesaan (Beige Batu Halus)
    const pathGeo = new THREE.PlaneGeometry(12, 380);
    const pathMat = new THREE.MeshLambertMaterial({ color: "#fef08a" });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.02, -150);
    scene.add(pathMesh);

    // ------------------------------------------------------------------------
    // GAPURA MASUK MEGAH (GAPURA NUSANTARA MERAH BATA & EMAS) DI Z = +14
    // ------------------------------------------------------------------------
    const gapuraGroup = new THREE.Group();
    const pillarMat = new THREE.MeshLambertMaterial({ color: "#b91c1c" }); // Merah Bata Megah
    const goldMat = new THREE.MeshLambertMaterial({ color: "#facc15" });

    // Pilar Kiri
    const leftPil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8, 2.4), pillarMat);
    leftPil.position.set(-6.5, 4, 14);
    gapuraGroup.add(leftPil);

    const leftTop = new THREE.Mesh(new THREE.ConeGeometry(2.0, 3, 4), goldMat);
    leftTop.position.set(-6.5, 9.5, 14);
    leftTop.rotation.y = Math.PI / 4;
    gapuraGroup.add(leftTop);

    // Pilar Kanan
    const rightPil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8, 2.4), pillarMat);
    rightPil.position.set(6.5, 4, 14);
    gapuraGroup.add(rightPil);

    const rightTop = new THREE.Mesh(new THREE.ConeGeometry(2.0, 3, 4), goldMat);
    rightTop.position.set(6.5, 9.5, 14);
    rightTop.rotation.y = Math.PI / 4;
    gapuraGroup.add(rightTop);

    // Balok Atas Penghubung Gapura
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(15, 1.8, 2.2), pillarMat);
    archBeam.position.set(0, 8.2, 14);
    gapuraGroup.add(archBeam);

    // Banner Tulisan Gapura
    const bannerCanvas = document.createElement("canvas");
    bannerCanvas.width = 512;
    bannerCanvas.height = 128;
    const bCtx = bannerCanvas.getContext("2d")!;
    bCtx.fillStyle = "#facc15";
    bCtx.fillRect(0, 0, 512, 128);
    bCtx.fillStyle = "#1e1b4b";
    bCtx.font = "bold 38px sans-serif";
    bCtx.textAlign = "center";
    bCtx.fillText("DESA PANCASILA NUSANTARA", 256, 75);

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const bannerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 2.4),
      new THREE.MeshBasicMaterial({ map: bannerTex })
    );
    bannerMesh.position.set(0, 8.2, 15.15);
    gapuraGroup.add(bannerMesh);

    scene.add(gapuraGroup);

    // ------------------------------------------------------------------------
    // PEPOHONAN RINDANG & KELAPA DI SEPANJANG JALAN
    // ------------------------------------------------------------------------
    const treeGroup = new THREE.Group();
    const trunkMat = new THREE.MeshLambertMaterial({ color: "#78350f" });
    const leafMat = new THREE.MeshLambertMaterial({ color: "#15803d" });

    for (let tz = 10; tz > -320; tz -= 18) {
      // Pohon Kiri
      const tL = new THREE.Group();
      const trL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 5, 8), trunkMat);
      trL.position.y = 2.5;
      const fL = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6), leafMat);
      fL.position.y = 5.6;
      tL.add(trL);
      tL.add(fL);
      tL.position.set(-8.5 - Math.random() * 3, 0, tz);
      treeGroup.add(tL);

      // Pohon Kanan
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

    for (let cz = 5; cz > -300; cz -= 7) {
      const offsetX = (Math.sin(cz * 0.4) * 3.5);
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
    // 5 RUMAH ADAT SUKU NUSANTARA (JAWA, SUNDA, MINANG, DAYAK, PAPUA)
    // ------------------------------------------------------------------------
    sukuList.forEach((suku) => {
      const hGroup = new THREE.Group();

      // Badan Rumah
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(11, 7.5, 9),
        new THREE.MeshLambertMaterial({ color: suku.warnaKhas })
      );
      wallMesh.position.y = 3.75;
      wallMesh.castShadow = true;
      hGroup.add(wallMesh);

      // Atap Khas Rumah Adat
      let roofMesh: THREE.Mesh;
      if (suku.id === "minang") {
        // Atap Gonjong Runcing Minang
        roofMesh = new THREE.Mesh(
          new THREE.ConeGeometry(8, 6, 4),
          new THREE.MeshLambertMaterial({ color: "#78350f" })
        );
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.position.y = 9.8;
      } else if (suku.id === "papua") {
        // Atap Bulat Melengkung Honai
        roofMesh = new THREE.Mesh(
          new THREE.SphereGeometry(6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshLambertMaterial({ color: "#ca8a04" })
        );
        roofMesh.position.y = 7.5;
      } else {
        // Atap Limas Tradisional Joglo/Sunda/Dayak
        roofMesh = new THREE.Mesh(
          new THREE.ConeGeometry(8.5, 4.5, 4),
          new THREE.MeshLambertMaterial({ color: "#92400e" })
        );
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.position.y = 9.5;
      }
      roofMesh.castShadow = true;
      hGroup.add(roofMesh);

      // Papan Nama Suku Mengapung di Depan Rumah
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 360;
      labelCanvas.height = 96;
      const lCtx = labelCanvas.getContext("2d")!;
      lCtx.fillStyle = "#ffffff";
      lCtx.fillRect(0, 0, 360, 96);
      lCtx.fillStyle = "#1e1b4b";
      lCtx.font = "bold 26px sans-serif";
      lCtx.textAlign = "center";
      lCtx.fillText(`${suku.simbolSila} ${suku.namaSuku}`, 180, 42);
      lCtx.font = "bold 20px sans-serif";
      lCtx.fillStyle = "#b91c1c";
      lCtx.fillText("Tekan 'E' untuk Kuis", 180, 76);

      const labelTex = new THREE.CanvasTexture(labelCanvas);
      const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex }));
      labelSprite.position.set(0, 8.5, 6);
      labelSprite.scale.set(5.5, 1.4, 1);
      hGroup.add(labelSprite);

      // NPC Tokoh Suku Berdiri di Depan Pintu
      const npcGroup = new THREE.Group();
      const nBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.7), new THREE.MeshLambertMaterial({ color: suku.warnaKhas }));
      nBody.position.y = 1.9;
      npcGroup.add(nBody);

      const nHead = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), new THREE.MeshLambertMaterial({ color: "#fed7aa" }));
      nHead.position.y = 3.0;
      npcGroup.add(nHead);

      npcGroup.position.set(0, 0, 5.5);
      hGroup.add(npcGroup);

      hGroup.position.set(suku.xPos, 0, suku.zPos);
      scene.add(hGroup);
    });

    // ------------------------------------------------------------------------
    // TEMAN-TEMAN SEKELAS (SIMULASI SISWA KELAS BERJALAN DI JALAN)
    // ------------------------------------------------------------------------
    const classmatesData: Classmate[] = [
      { name: "Siti Rahma", avatar: "👧", x: -2, z: -20, speed: 2.2, dir: -1 },
      { name: "Budi Santoso", avatar: "👦", x: 2.5, z: -60, speed: 2.5, dir: 1 },
      { name: "Edo Pratama", avatar: "🧒", x: -1.8, z: -120, speed: 2.0, dir: -1 },
      { name: "Dayu Kemala", avatar: "👧", x: 2.2, z: -180, speed: 2.4, dir: 1 },
      { name: "Beni Nugraha", avatar: "👦", x: -2.2, z: -240, speed: 2.1, dir: -1 },
    ];

    classmatesData.forEach((cm) => {
      const cmGroup = new THREE.Group();
      const cBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.6), new THREE.MeshLambertMaterial({ color: "#ffffff" }));
      cBody.position.y = 1.8;
      cmGroup.add(cBody);

      const cHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshLambertMaterial({ color: "#fed7aa" }));
      cHead.position.y = 2.9;
      cmGroup.add(cHead);

      // Label Nama Siswa
      const nameCanvas = document.createElement("canvas");
      nameCanvas.width = 250;
      nameCanvas.height = 64;
      const nCtx = nameCanvas.getContext("2d")!;
      nCtx.fillStyle = "#ffffff";
      nCtx.font = "bold 24px sans-serif";
      nCtx.textAlign = "center";
      nCtx.fillText(`${cm.avatar} ${cm.name}`, 125, 42);
      const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(nameCanvas) }));
      nameSprite.position.set(0, 3.8, 0);
      nameSprite.scale.set(3.0, 0.7, 1);
      cmGroup.add(nameSprite);

      cmGroup.position.set(cm.x, 0, cm.z);
      scene.add(cmGroup);
      cm.mesh = cmGroup;
    });

    // ------------------------------------------------------------------------
    // KARAKTER UTAMA SISWA (ROBLOX 3D SERAGAM SD MERAH PUTIH)
    // ------------------------------------------------------------------------
    const playerGroup = new THREE.Group();

    // Torso Kemeja Putih SD
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.7), new THREE.MeshLambertMaterial({ color: "#ffffff" }));
    torsoMesh.position.y = 2.15;
    playerGroup.add(torsoMesh);

    // Dasi Merah
    const tieMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.9, 0.08), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
    tieMesh.position.set(0, 2.15, 0.38);
    playerGroup.add(tieMesh);

    // Tas Ransel Oranye
    const backpackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.45), new THREE.MeshLambertMaterial({ color: "#f97316" }));
    backpackMesh.position.set(0, 2.2, -0.45);
    playerGroup.add(backpackMesh);

    // Kepala & Topi SD
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), new THREE.MeshLambertMaterial({ color: "#fed7aa" }));
    headMesh.position.y = 3.35;
    playerGroup.add(headMesh);

    const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.35, 0.92), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
    capTop.position.y = 3.95;
    playerGroup.add(capTop);

    const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.45), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
    capVisor.position.set(0, 3.82, 0.55);
    playerGroup.add(capVisor);

    // Lengan Kiri & Kanan
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
    rightArm.add(lSlv.clone());
    rightArm.add(lHnd.clone());
    rightArm.position.set(0.95, 2.15, 0);
    playerGroup.add(rightArm);

    // Kaki Merah SD + Sepatu Hitam
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

    // Label Nama Pemain
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

    playerGroup.position.set(0, 0, 12);
    scene.add(playerGroup);

    // ------------------------------------------------------------------------
    // GAME LOOP: GERAKAN PEMAIN, ANIMASI TEMAN, DAN KOIN PICK-UP
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

        // Batasi arena jalan
        playerGroup.position.x = Math.max(-28, Math.min(28, playerGroup.position.x));
        playerGroup.position.z = Math.max(-320, Math.min(22, playerGroup.position.z));

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

      // 1. Putar Koin Emas & Cek Pick-up di Jalan
      coinList.forEach((coin) => {
        if (!coin.collected && coin.mesh) {
          coin.mesh.rotation.z += delta * 3.5;

          // Jarak tabrakan pick-up (radius 1.8 stud)
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

      // 2. Animasi Teman Sekelas Berjalan Santai di Jalan
      classmatesData.forEach((cm) => {
        if (cm.mesh) {
          cm.mesh.position.z += cm.speed * cm.dir * delta;
          if (cm.mesh.position.z > 0) cm.dir = -1;
          if (cm.mesh.position.z < -290) cm.dir = 1;
        }
      });

      // 3. Kamera Third-Person Halus
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

        // Cek apakah pemain dekat dengan salah satu dari 5 Rumah Suku
        for (const suku of sukuList) {
          const dist = Math.hypot(px - suku.xPos, pz - suku.zPos);
          if (dist < 12) {
            setActiveSukuDialog(suku);
            setSelectedAnswer(null);
            setAnswerFeedback(null);
            return;
          }
        }

        // Jika tidak di dekat suku, beri notifikasi petunjuk
        setActiveNotification("💡 Jalan mendekat ke Rumah Adat Suku lalu tekan 'E' untuk menjawab kuis!");
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
    };
  }, [mountEl, isOpen, sukuList, addPoints]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-title"
      >
        {/* HUD ATAS MODERN & ROUNDED (TIDAK KOTAK KAKU) */}
        <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-yellow-400/40 text-white px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xl z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg shrink-0">
              🇮🇩
            </span>
            <div className="min-w-0">
              <h2 id="game-title" className="font-black text-sm sm:text-base text-yellow-300 truncate tracking-wide">
                JELAJAH 5 SUKU NUSANTARA: PETUALANGAN PANCASILA
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                Materi: <b className="text-emerald-400">{resolvedTitle}</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Papan Skor Kelas (Leaderboard) */}
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

            {/* Progres 5 Suku */}
            <div className="hidden md:flex items-center gap-1 bg-slate-800/90 px-3 py-1.5 rounded-2xl border border-emerald-500/40 text-xs font-bold text-emerald-300">
              <span>🏠</span>
              <span>{visitedSukuIds.length}/5 Suku Selesai</span>
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

          {/* OVERLAY AWAL MULAI MAIN (CERIA & MODERN) */}
          {!gameStarted && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center text-5xl shadow-2xl border-4 border-white animate-bounce">
                🎒
              </div>
              <div className="space-y-2 max-w-lg">
                <h3 className="font-black text-2xl sm:text-3xl text-yellow-300 tracking-wide">
                  AYO JELAJAH DESA PANCASILA! 🇮🇩
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Masuklah lewat <b>Gapura Nusantara</b> bersama teman-teman sekelasmu! Kumpulkan koin emas di sepanjang jalan pedesaan, kunjungi <b>5 Rumah Suku Adat</b>, dan jawab pertanyaan pengamalan Pancasila!
                </p>
                <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-yellow-400/40 text-xs text-yellow-200 flex flex-wrap items-center justify-center gap-3">
                  <span>🎮 <b>WASD / Panah</b>: Jalan</span>
                  <span>•</span>
                  <span>🟡 <b>Spasi</b>: Lompat</span>
                  <span>•</span>
                  <span>⚡ <b>Shift</b>: Sprint Lari</span>
                  <span>•</span>
                  <span>🎯 <b>E</b>: Kuis Rumah Suku</span>
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

          {/* DIALOG POPUP KUIS RUMAH SUKU (MODERN GLASSMORPHISM & ROUNDED PILL) */}
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

                {/* Feedback Penjelasan */}
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

          {/* MODAL PAPAN SKOR KELAS (LEADERBOARD SISWA SATU KELAS) */}
          {showLeaderboard && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900/95 border-3 border-indigo-400 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">🏆</span>
                    <div>
                      <h3 className="font-black text-base text-indigo-300">
                        Papan Skor Siswa Kelas
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Peringkat kawan sekelas di Petualangan Pancasila
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
                          <span className="text-[10px] text-slate-400">{s.badge}</span>
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
                <span>KUIS SUKU (E)</span>
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
