// frontend/src/components/AdaptiveEduGameModal.tsx
// Game Edukasi Adaptif Multi-Mode:
// 1. 🗺️ Petualangan Desa 3D (Jelajah 5 Pos Misi Checkpoint & Kawan Sekelas Online)
// 2. 🧩 Menjodohkan Kartu Pasangan (Matching Pair Puzzle / Memory Match)
// 3. 🔤 Tebak Kata Ceria (Scrambled Word Challenge dengan Petunjuk Materi)
// 4. 🎲 Ular Tangga Edukasi (30 Petak dengan Dadu Virtual & Kotak Kuis Tantangan)
//
// Fitur Kurikulum Adaptif:
// - Otomatis menyesuaikan materi aktif (Pancasila, Gotong Royong, Basa Jawa, Aksara, Norma, dll.)
// - Terhubung langsung ke API Generator (/api/games/generate)
// - Penjelasan Materi Edukatif Lengkap + Suara Suara Guru Indonesia (Web Speech API)
// - Panduan Cara Bermain di setiap mode game

"use client";

import ModalPortal from "@/components/ModalPortal";
import {
  type AdaptiveGamePackage,
  type GameCheckpoint,
  type MatchingCardPair,
  type TebakKataChallenge,
  type UlarTanggaQuestion,
  fetchAdaptiveGameData,
} from "@/lib/api/gameApi";
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

type ActiveGameMode = "adventure" | "matching" | "tebak_kata" | "ular_tangga";

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
}

export default function AdaptiveEduGameModal({
  isOpen,
  onClose,
  chapter,
  chapterTitle,
}: Props) {
  const addPoints = useUIStore((s) => s.addPoints);
  const activeValidatedModule = useUIStore((s) => s.activeValidatedModule);

  const resolvedTitle = useMemo(
    () => activeValidatedModule?.title || chapterTitle || chapter,
    [activeValidatedModule?.title, chapterTitle, chapter]
  );

  const [activeMode, setActiveMode] = useState<ActiveGameMode>("adventure");
  const [gameData, setGameData] = useState<AdaptiveGamePackage | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [gameScore, setGameScore] = useState(0);
  const [coinsCollectedCount, setCoinsCollectedCount] = useState(0);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  // Penjelasan Materi & Voice Pak Guru
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isGuruSpeaking, setIsGuruSpeaking] = useState(false);

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
  // FETCH ATAU GENERATE DATA GAME SESUAI MATERI AKTIF (API / LOCAL FALLBACK)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingData(true);

    fetchAdaptiveGameData({
      chapterId: activeValidatedModule?.id || chapter,
      chapterTitle: resolvedTitle,
      subject: activeValidatedModule?.subject || "pkn",
      learningGoal: activeValidatedModule?.learningGoal,
      ragSummary: activeValidatedModule?.ragSummary,
    })
      .then((data) => {
        if (!isMounted) return;
        setGameData(data);
        setActiveMode(data.recommendedMode || "adventure");
      })
      .catch(() => {
        // Fallback default safe package
        if (!isMounted) return;
        setGameData({
          chapterId: chapter,
          chapterTitle: resolvedTitle,
          subject: "pkn",
          recommendedMode: "adventure",
          teacherExplanation: {
            summaryText: `Materi Pelajaran: ${resolvedTitle}. Intisari ini dirancang khusus untuk memandu Penjelajah Muda memahami nilai-nilai luhur.`,
            voiceScript: `Halo Penjelajah Cilik! Selamat datang di Game Edukasi materi ${resolvedTitle}. Pahami nilai-nilai luhur dan selesaikan tantangannya untuk meraih bintang prestasi!`,
            points: activeValidatedModule?.ragSummary?.slice(0, 5) || [
              "Pahami intisari materi dengan membaca rangkuman edukatif.",
              "Amalkan perbuatan baik di lingkungan sekolah dan rumah.",
              "Mainkan tantangan kuis untuk meraih poin dan bintang juara!",
            ],
          },
          gameGuides: {
            adventure: "Gunakan WASD atau tombol panah untuk menjelajahi pos desa 3D. Tekan E untuk kuis dan menyapa teman!",
            matching: "Klik dua kartu untuk membalik dan mencocokkan pasangan yang sesuai. Selesaikan secepat mungkin!",
            tebak_kata: "Klik huruf acak untuk menyusun kata kunci konsep materi yang tepat sesuai petunjuk!",
            ular_tangga: "Lempar dadu, manfaatkan tangga, hindari ular, dan jawab kuis di kotak tantangan!",
          },
          adventureCheckpoints: [],
          matchingPairs: [],
          tebakKataChallenges: [],
          ularTangga: { totalTiles: 30, ladders: {}, snakes: {}, quizTiles: {} },
        });
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
      stopGuruVoice();
    };
  }, [isOpen, chapter, resolvedTitle, activeValidatedModule, stopGuruVoice]);

  // Kontrol Background Music
  useEffect(() => {
    if (isOpen && bgmEnabled) {
      startAdventureBgm();
    }
    return () => {
      stopAdventureBgm();
      stopGuruVoice();
    };
  }, [isOpen, bgmEnabled, stopGuruVoice]);

  // ==========================================================================
  // STATE & LOGIC UNTUK GAME MODE 1: PETUALANGAN DESA 3D
  // ==========================================================================
  const [mountEl, setMountEl] = useState<HTMLDivElement | null>(null);
  const [game3dStarted, setGame3dStarted] = useState(false);
  const [visitedPosIds, setVisitedPosIds] = useState<string[]>([]);
  const [active3dPosDialog, setActive3dPosDialog] = useState<GameCheckpoint | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [friendGreetingBubble, setFriendGreetingBubble] = useState<{ name: string; text: string } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [allPosCompleted, setAllPosCompleted] = useState(false);

  const playerPosRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 18 });
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false, jump: false, sprint: false });

  const onlineStudentsList = useMemo<OnlineStudent[]>(() => [
    { id: "siti", name: "Siti Rahma", avatar: "👧", costumeName: "Seragam Pramuka", shirtColor: "#78350f", pantsColor: "#451a03", hatType: "pramuka_beret", x: -2.5, z: -18, speed: 2.2, dir: -1, isOnline: true },
    { id: "budi", name: "Budi Santoso", avatar: "👦", costumeName: "Batik Hijau", shirtColor: "#15803d", pantsColor: "#0f172a", hatType: "hair_black", x: 2.5, z: -70, speed: 2.5, dir: 1, isOnline: true },
    { id: "edo", name: "Edo Pratama", avatar: "🧒", costumeName: "Olahraga Biru", shirtColor: "#0284c7", pantsColor: "#1e293b", hatType: "sport_hair", x: -2.0, z: -130, speed: 2.1, dir: -1, isOnline: true },
    { id: "dayu", name: "Dayu Kemala", avatar: "👧", costumeName: "Batik Ungu", shirtColor: "#7e22ce", pantsColor: "#0f172a", hatType: "hair_ribbon", x: 2.2, z: -190, speed: 2.4, dir: 1, isOnline: true },
  ], []);

  // Interaksi Menyapa Teman Online di Jalan 3D
  const handleGreetClassmate = useCallback((student: OnlineStudent) => {
    playCoinSound();
    playCorrectSound();
    setGameScore((s) => s + 5);
    addPoints(5, `Menyapa teman sekelas: ${student.name}`);
    setFriendGreetingBubble({
      name: student.name,
      text: `👋 "Halo kawan! Semangat belajar materi ${resolvedTitle}! Ayo kumpulkan koin & selesaikan pos misi!"`,
    });
    setActiveNotification(`👋 Kamu menyapa ${student.name}! (+5 Poin Persahabatan!)`);
    setTimeout(() => {
      setFriendGreetingBubble(null);
      setActiveNotification(null);
    }, 4500);
  }, [addPoints, resolvedTitle]);

  // Jawab Soal Pos 3D
  const handleAnswer3dPos = (pos: GameCheckpoint, optId: string) => {
    setSelectedAnswer(optId);
    const chosen = pos.opsi.find((o) => o.id === optId);
    if (!chosen) return;

    if (chosen.benar) {
      playCorrectSound();
      playCoinSound();
      setAnswerFeedback({ isCorrect: true, text: chosen.penjelasan });

      if (!visitedPosIds.includes(pos.id)) {
        const nextVisited = [...visitedPosIds, pos.id];
        setVisitedPosIds(nextVisited);
        setGameScore((s) => s + 25);
        addPoints(25, `Menjawab kuis ${pos.namaPos}`);

        if (nextVisited.length >= (gameData?.adventureCheckpoints.length || 5)) {
          setTimeout(() => {
            playBadgeFanfareSound();
            setAllPosCompleted(true);
            addPoints(50, "Menyelesaikan seluruh pos petualangan");
          }, 1200);
        }
      }
    } else {
      playOofSound();
      setAnswerFeedback({ isCorrect: false, text: chosen.penjelasan });
    }
  };

  // Setup Engine 3D Three.js
  useEffect(() => {
    if (!isOpen || activeMode !== "adventure" || !mountEl) return;

    const mount = mountEl;
    let animId: number;

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

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "default" });
    } catch {
      renderer = new THREE.WebGLRenderer({ antialias: false });
    }
    renderer.setClearColor("#7dd3fc", 1);
    renderer.setSize(initW, initH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    mount.appendChild(renderer.domElement);

    // Pencahayaan
    scene.add(new THREE.AmbientLight("#ffffff", 0.95));
    const hemiLight = new THREE.HemisphereLight("#ffffff", "#445566", 0.85);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight("#fffbeb", 1.4);
    sunLight.position.set(25, 60, 20);
    scene.add(sunLight);

    // Tanah & Jalan
    const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(140, 440), new THREE.MeshLambertMaterial({ color: "#22c55e" }));
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, 0, -150);
    scene.add(groundMesh);

    const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 400), new THREE.MeshLambertMaterial({ color: "#fef08a" }));
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.02, -150);
    scene.add(pathMesh);

    // Gapura Masuk Megah (Z = +14)
    const gapuraGroup = new THREE.Group();
    const pillarMat = new THREE.MeshLambertMaterial({ color: "#991b1b" });
    const goldMat = new THREE.MeshLambertMaterial({ color: "#facc15" });

    const leftPil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8.5, 2.4), pillarMat);
    leftPil.position.set(-6.5, 4.25, 14);
    gapuraGroup.add(leftPil);
    const rightPil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8.5, 2.4), pillarMat);
    rightPil.position.set(6.5, 4.25, 14);
    gapuraGroup.add(rightPil);

    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(15.4, 2.2, 2.4), pillarMat);
    archBeam.position.set(0, 8.6, 14);
    gapuraGroup.add(archBeam);

    const bannerCanvas = document.createElement("canvas");
    bannerCanvas.width = 1024;
    bannerCanvas.height = 256;
    const bCtx = bannerCanvas.getContext("2d")!;
    bCtx.fillStyle = "#7f1d1d";
    bCtx.fillRect(0, 0, 1024, 256);
    bCtx.strokeStyle = "#facc15";
    bCtx.lineWidth = 14;
    bCtx.strokeRect(7, 7, 1010, 242);
    bCtx.fillStyle = "#fef08a";
    bCtx.font = "bold 46px sans-serif";
    bCtx.textAlign = "center";
    bCtx.fillText("★ DESA EDUKASI NUSANTARA ★", 512, 105);
    bCtx.fillStyle = "#ffffff";
    bCtx.font = "bold 28px sans-serif";
    bCtx.fillText(`🇮🇩  ${resolvedTitle.slice(0, 42)}  🇮🇩`, 512, 185);

    const bannerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 2.2),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bannerCanvas) })
    );
    bannerMesh.position.set(0, 8.6, 15.25);
    gapuraGroup.add(bannerMesh);
    scene.add(gapuraGroup);

    // Pak Guru Virtual di Awalan (X = -4.0, Z = +16)
    const guruGroup = new THREE.Group();
    const guruTorso = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.45, 0.68), new THREE.MeshLambertMaterial({ color: "#0284c7" }));
    guruTorso.position.y = 2.15;
    guruGroup.add(guruTorso);

    const guruHead = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), new THREE.MeshLambertMaterial({ color: "#fed7aa" }));
    guruHead.position.y = 3.35;
    guruGroup.add(guruHead);

    const guruPeci = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.44, 0.94), new THREE.MeshLambertMaterial({ color: "#0f172a" }));
    guruPeci.position.y = 3.95;
    guruGroup.add(guruPeci);

    const ringGeo = new THREE.RingGeometry(1.2, 1.6, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: "#facc15", side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.05;
    guruGroup.add(ringMesh);

    const guruCanvas = document.createElement("canvas");
    guruCanvas.width = 340;
    guruCanvas.height = 80;
    const gCtx = guruCanvas.getContext("2d")!;
    gCtx.fillStyle = "#ffffff";
    gCtx.font = "bold 26px sans-serif";
    gCtx.textAlign = "center";
    gCtx.fillText("👨‍🏫 Pak Guru Virtual", 170, 38);
    gCtx.fillStyle = "#facc15";
    gCtx.font = "bold 20px sans-serif";
    gCtx.fillText("Tekan 'E' untuk Suara Guru 🔊", 170, 68);

    const guruSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(guruCanvas) }));
    guruSprite.position.set(0, 4.9, 0);
    guruSprite.scale.set(3.8, 0.9, 1);
    guruGroup.add(guruSprite);

    guruGroup.position.set(-4.0, 0, 16);
    scene.add(guruGroup);

    // Koin Emas di Jalan
    const coinList: { x: number; y: number; z: number; mesh: THREE.Mesh; collected: boolean }[] = [];
    const coinGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.15, 16);
    const coinMat = new THREE.MeshLambertMaterial({ color: "#facc15", emissive: "#ca8a04" });

    for (let cz = 8; cz > -300; cz -= 8) {
      const offsetX = Math.sin(cz * 0.4) * 3.5;
      const cMesh = new THREE.Mesh(coinGeo, coinMat);
      cMesh.rotation.x = Math.PI / 2;
      cMesh.position.set(offsetX, 0.8, cz);
      scene.add(cMesh);
      coinList.push({ x: offsetX, y: 0.8, z: cz, mesh: cMesh, collected: false });
    }

    // Pos Misi Checkpoint (Diambil Dinamis dari gameData)
    interface HotspotItem {
      pos: GameCheckpoint;
      x: number;
      z: number;
      ringMesh: THREE.Mesh;
      beaconMesh: THREE.Mesh;
    }
    const hotspotList: HotspotItem[] = [];
    const checkPoints = gameData?.adventureCheckpoints || [];

    checkPoints.forEach((pos) => {
      const hGroup = new THREE.Group();
      const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(11, 7.5, 9), new THREE.MeshLambertMaterial({ color: pos.warnaKhas }));
      wallMesh.position.y = 3.75;
      hGroup.add(wallMesh);

      const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(8.5, 4.5, 4), new THREE.MeshLambertMaterial({ color: "#92400e" }));
      roofMesh.rotation.y = Math.PI / 4;
      roofMesh.position.y = 9.5;
      hGroup.add(roofMesh);

      hGroup.position.set(pos.xPos, 0, pos.zPos);
      scene.add(hGroup);

      // Titik Misi Checkpoint di Depan Rumah
      const hotspotX = pos.xPos > 0 ? 6.5 : -6.5;
      const spotGroup = new THREE.Group();

      const spotRing = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.2, 32), new THREE.MeshBasicMaterial({ color: "#facc15", side: THREE.DoubleSide }));
      spotRing.rotation.x = -Math.PI / 2;
      spotRing.position.y = 0.05;
      spotGroup.add(spotRing);

      const beaconMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 5, 24, 1, true),
        new THREE.MeshBasicMaterial({ color: pos.warnaKhas, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
      );
      beaconMesh.position.y = 2.5;
      spotGroup.add(beaconMesh);

      const padCanvas = document.createElement("canvas");
      padCanvas.width = 400;
      padCanvas.height = 90;
      const pdCtx = padCanvas.getContext("2d")!;
      pdCtx.fillStyle = "#ffffff";
      pdCtx.font = "bold 26px sans-serif";
      pdCtx.textAlign = "center";
      pdCtx.fillText(`🎯 ${pos.namaPos}`, 200, 36);
      pdCtx.fillStyle = "#facc15";
      pdCtx.font = "bold 20px sans-serif";
      pdCtx.fillText("[ Berdiri di Sini & Tekan 'E' ]", 200, 72);

      const padSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(padCanvas) }));
      padSprite.position.set(0, 3.8, 0);
      padSprite.scale.set(4.2, 1.0, 1);
      spotGroup.add(padSprite);

      spotGroup.position.set(hotspotX, 0, pos.zPos);
      scene.add(spotGroup);

      hotspotList.push({ pos, x: hotspotX, z: pos.zPos, ringMesh: spotRing, beaconMesh });
    });

    // Teman Sekelas Online
    onlineStudentsList.forEach((st) => {
      const stGroup = new THREE.Group();
      const stTorso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.65), new THREE.MeshLambertMaterial({ color: st.shirtColor }));
      stTorso.position.y = 2.15;
      stGroup.add(stTorso);

      const stHead = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), new THREE.MeshLambertMaterial({ color: "#fed7aa" }));
      stHead.position.y = 3.35;
      stGroup.add(stHead);

      const stCanvas = document.createElement("canvas");
      stCanvas.width = 300;
      stCanvas.height = 70;
      const sCtx = stCanvas.getContext("2d")!;
      sCtx.fillStyle = "#ffffff";
      sCtx.font = "bold 24px sans-serif";
      sCtx.textAlign = "center";
      sCtx.fillText(`${st.avatar} ${st.name}`, 150, 34);
      sCtx.font = "bold 18px sans-serif";
      sCtx.fillStyle = "#facc15";
      sCtx.fillText(`[${st.costumeName}] (E: Sapa 👋)`, 150, 60);

      const stSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(stCanvas) }));
      stSprite.position.set(0, 4.6, 0);
      stSprite.scale.set(3.4, 0.8, 1);
      stGroup.add(stSprite);

      stGroup.position.set(st.x, 0, st.z);
      scene.add(stGroup);
      st.mesh = stGroup;
    });

    // Karakter Pemain
    const playerGroup = new THREE.Group();
    const pTorso = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.45, 0.68), new THREE.MeshLambertMaterial({ color: "#ffffff" }));
    pTorso.position.y = 2.15;
    playerGroup.add(pTorso);

    const pPants = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.72, 0.7), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
    pPants.position.y = 1.05;
    playerGroup.add(pPants);

    const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), new THREE.MeshLambertMaterial({ color: "#fed7aa" }));
    pHead.position.y = 3.35;
    playerGroup.add(pHead);

    const pCap = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.35, 0.92), new THREE.MeshLambertMaterial({ color: "#dc2626" }));
    pCap.position.y = 3.92;
    playerGroup.add(pCap);

    playerGroup.position.set(0, 0, 18);
    scene.add(playerGroup);

    // Game Loop
    let vy = 0;
    let isJumping = false;
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
        playerGroup.position.x += (moveX / len) * speed * delta;
        playerGroup.position.z += (moveZ / len) * speed * delta;
        playerGroup.position.x = Math.max(-28, Math.min(28, playerGroup.position.x));
        playerGroup.position.z = Math.max(-320, Math.min(24, playerGroup.position.z));
        playerGroup.rotation.y = Math.atan2(moveX, moveZ) + Math.PI;
      }

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

      // Koin & Pick-up
      coinList.forEach((coin) => {
        if (!coin.collected) {
          coin.mesh.rotation.z += delta * 3.5;
          const dist = Math.hypot(playerGroup.position.x - coin.x, playerGroup.position.z - coin.z);
          if (dist < 1.8 && playerGroup.position.y < 2.0) {
            coin.collected = true;
            scene.remove(coin.mesh);
            playCoinPickupSound();
            setGameScore((s) => s + 5);
            setCoinsCollectedCount((c) => c + 1);
            addPoints(5, "Mengambil koin emas di jalan");
          }
        }
      });

      // Animasi Teman Online
      onlineStudentsList.forEach((st) => {
        if (st.mesh) {
          st.mesh.position.z += st.speed * st.dir * delta;
          if (st.mesh.position.z > 5) st.dir = -1;
          if (st.mesh.position.z < -290) st.dir = 1;
        }
      });

      // Hotspot Ring Anim
      hotspotList.forEach((hp) => {
        hp.ringMesh.rotation.z += delta * 1.5;
        hp.beaconMesh.scale.y = 1 + Math.sin(Date.now() * 0.003) * 0.15;
      });

      // Kamera Third Person
      const camTargetX = playerGroup.position.x;
      const camTargetY = playerGroup.position.y + 4.2;
      const camTargetZ = playerGroup.position.z + 8.5;
      camera.position.x += (camTargetX - camera.position.x) * 0.12;
      camera.position.y += (camTargetY - camera.position.y) * 0.12;
      camera.position.z += (camTargetZ - camera.position.z) * 0.12;
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.6, playerGroup.position.z - 3);

      const { w, h } = getViewportSize();
      if (renderer.domElement.clientWidth !== w || renderer.domElement.clientHeight !== h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }

      renderer.render(scene, camera);
    };

    renderer.render(scene, camera);
    animate();

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

        // Cek Dekat Pak Guru
        if (Math.hypot(px - (-4.0), pz - 16) < 4.8) {
          setShowExplanationModal(true);
          speakGuruVoice(gameData?.teacherExplanation.voiceScript || `Selamat datang di materi ${resolvedTitle}!`);
          return;
        }

        // Cek Dekat Teman Sekelas
        for (const st of onlineStudentsList) {
          if (st.mesh && Math.hypot(px - st.mesh.position.x, pz - st.mesh.position.z) < 4.5) {
            handleGreetClassmate(st);
            return;
          }
        }

        // Cek Dekat Titik Misi Checkpoint
        for (const hp of hotspotList) {
          if (Math.hypot(px - hp.x, pz - hp.z) < 3.8) {
            setActive3dPosDialog(hp.pos);
            setSelectedAnswer(null);
            setAnswerFeedback(null);
            return;
          }
        }

        setActiveNotification("📍 Berdirilah tepat di TITIK MISI bercahaya di depan pos untuk kuis!");
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
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (mount && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isOpen, activeMode, mountEl, gameData, resolvedTitle, onlineStudentsList, handleGreetClassmate, speakGuruVoice]);

  // ==========================================================================
  // STATE & LOGIC UNTUK GAME MODE 2: MENJODOHKAN KARTU (MATCHING PAIRS)
  // ==========================================================================
  interface MatchingCardItem {
    uid: string;
    pairId: string;
    text: string;
    category: string;
    isMatched: boolean;
  }
  const [matchingCards, setMatchingCards] = useState<MatchingCardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchingMoves, setMatchingMoves] = useState(0);
  const [matchingCompleted, setMatchingCompleted] = useState(false);

  // Inisialisasi Kartu Menjodohkan dari gameData
  useEffect(() => {
    if (!gameData?.matchingPairs || gameData.matchingPairs.length === 0) return;
    const cards: MatchingCardItem[] = [];
    gameData.matchingPairs.slice(0, 6).forEach((p, idx) => {
      cards.push({ uid: `${p.id}-term-${idx}`, pairId: p.id, text: p.term, category: p.category, isMatched: false });
      cards.push({ uid: `${p.id}-match-${idx}`, pairId: p.id, text: p.match, category: p.category, isMatched: false });
    });
    // Acak Kartu
    setMatchingCards(cards.sort(() => Math.random() - 0.5));
    setSelectedCards([]);
    setMatchingMoves(0);
    setMatchingCompleted(false);
  }, [gameData]);

  const handleCardClick = (idx: number) => {
    if (selectedCards.length >= 2 || selectedCards.includes(idx) || matchingCards[idx].isMatched) return;

    playClickSound();
    const nextSelected = [...selectedCards, idx];
    setSelectedCards(nextSelected);

    if (nextSelected.length === 2) {
      setMatchingMoves((m) => m + 1);
      const [firstIdx, secondIdx] = nextSelected;
      const first = matchingCards[firstIdx];
      const second = matchingCards[secondIdx];

      if (first.pairId === second.pairId) {
        // Cocok!
        playCorrectSound();
        playCoinSound();
        setGameScore((s) => s + 15);
        addPoints(15, `Menjodohkan kartu cocok: ${first.text}`);

        setTimeout(() => {
          setMatchingCards((prev) => {
            const updated = prev.map((c, i) => (i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c));
            if (updated.every((c) => c.isMatched)) {
              playBadgeFanfareSound();
              setMatchingCompleted(true);
              addPoints(30, "Menyelesaikan seluruh pasangan kartu!");
            }
            return updated;
          });
          setSelectedCards([]);
        }, 500);
      } else {
        // Tidak cocok
        playOofSound();
        setTimeout(() => setSelectedCards([]), 1000);
      }
    }
  };

  // ==========================================================================
  // STATE & LOGIC UNTUK GAME MODE 3: TEBAK KATA CERIA (WORD SCRAMBLE)
  // ==========================================================================
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [assembledLetters, setAssembledLetters] = useState<string[]>([]);
  const [availableTiles, setAvailableTiles] = useState<{ id: number; char: string; used: boolean }[]>([]);
  const [showWordHint, setShowWordHint] = useState(false);
  const [tebakKataFeedback, setTebakKataFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  const currentChallenge: TebakKataChallenge | undefined = gameData?.tebakKataChallenges?.[currentWordIdx];

  useEffect(() => {
    if (!currentChallenge) return;
    setAssembledLetters([]);
    setShowWordHint(false);
    setTebakKataFeedback(null);
    setAvailableTiles(
      currentChallenge.scrambled.map((c, i) => ({ id: i, char: c, used: false }))
    );
  }, [currentChallenge, currentWordIdx]);

  const handlePickLetter = (tileId: number) => {
    const tile = availableTiles.find((t) => t.id === tileId);
    if (!tile || tile.used) return;

    playClickSound();
    setAvailableTiles((prev) => prev.map((t) => (t.id === tileId ? { ...t, used: true } : t)));
    const nextAssembled = [...assembledLetters, tile.char];
    setAssembledLetters(nextAssembled);

    if (currentChallenge && nextAssembled.length === currentChallenge.word.length) {
      const guessedWord = nextAssembled.join("");
      if (guessedWord.toUpperCase() === currentChallenge.word.toUpperCase()) {
        playCorrectSound();
        playCoinSound();
        setGameScore((s) => s + currentChallenge.points);
        addPoints(currentChallenge.points, `Tebak kata berhasil: ${currentChallenge.word}`);
        setTebakKataFeedback({ isCorrect: true, text: `Hebat! ${currentChallenge.explanation}` });
      } else {
        playOofSound();
        setTebakKataFeedback({ isCorrect: false, text: "Susunan huruf belum tepat. Coba atur ulang hurufnya ya!" });
      }
    }
  };

  const handleResetWord = () => {
    if (!currentChallenge) return;
    playClickSound();
    setAssembledLetters([]);
    setTebakKataFeedback(null);
    setAvailableTiles((prev) => prev.map((t) => ({ ...t, used: false })));
  };

  // ==========================================================================
  // STATE & LOGIC UNTUK GAME MODE 4: ULAR TANGGA EDUKASI (SNAKES & LADDERS)
  // ==========================================================================
  const [playerTile, setPlayerTile] = useState(1);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [activeQuizTile, setActiveQuizTile] = useState<UlarTanggaQuestion | null>(null);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizAnswerFeedback, setQuizAnswerFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [ularTanggaFinished, setUlarTanggaFinished] = useState(false);

  const handleRollDice = () => {
    if (isRollingDice || activeQuizTile || ularTanggaFinished) return;
    playClickSound();
    setIsRollingDice(true);

    let rollCount = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 8) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalDice);
        setIsRollingDice(false);

        // Gerakkan Pion
        setPlayerTile((prev) => {
          let next = prev + finalDice;
          if (next >= 30) {
            playBadgeFanfareSound();
            setUlarTanggaFinished(true);
            setGameScore((s) => s + 50);
            addPoints(50, "Mencapai Petak 30 Ular Tangga Edukasi!");
            return 30;
          }

          // Cek Tangga
          if (gameData?.ularTangga.ladders[next]) {
            const ladderEnd = gameData.ularTangga.ladders[next];
            playCorrectSound();
            setActiveNotification(`🪜 TANGGA NAIK! Melesat dari petak ${next} ke ${ladderEnd}!`);
            setTimeout(() => setActiveNotification(null), 3000);
            next = ladderEnd;
          }

          // Cek Ular
          if (gameData?.ularTangga.snakes[next]) {
            const snakeEnd = gameData.ularTangga.snakes[next];
            playOofSound();
            setActiveNotification(`🐍 AWAS RINTANGAN! Terpeleset dari petak ${next} ke ${snakeEnd}!`);
            setTimeout(() => setActiveNotification(null), 3000);
            next = snakeEnd;
          }

          // Cek Kotak Kuis
          if (gameData?.ularTangga.quizTiles[next]) {
            const q = gameData.ularTangga.quizTiles[next];
            setTimeout(() => {
              setActiveQuizTile(q);
              setQuizSelectedOption(null);
              setQuizAnswerFeedback(null);
            }, 500);
          }

          return next;
        });
      }
    }, 80);
  };

  const handleAnswerQuizTile = (optIdx: number) => {
    if (!activeQuizTile) return;
    setQuizSelectedOption(optIdx);

    if (optIdx === activeQuizTile.correctIndex) {
      playCorrectSound();
      playCoinSound();
      setGameScore((s) => s + 20);
      addPoints(20, "Menjawab kuis petak ular tangga dengan benar");
      setQuizAnswerFeedback({ isCorrect: true, text: `Jawaban Tepat! ${activeQuizTile.explanation}` });
    } else {
      playOofSound();
      setQuizAnswerFeedback({ isCorrect: false, text: `Kurang tepat. ${activeQuizTile.explanation}` });
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* ================================================================== */}
        {/* HEADER UTAMA: JUDUL MATERI, PILIHAN MINI GAME, SCORE & KONTROL   */}
        {/* ================================================================== */}
        <header className="bg-slate-900 border-b border-yellow-400/30 text-white px-3 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xl z-20 gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg shrink-0">
              🇮🇩
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-xs sm:text-sm text-yellow-300 truncate">
                  GAME EDUKASI ADAPTIF: {resolvedTitle}
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-2 py-0.2 rounded-full hidden md:inline">
                  Kurikulum Otomatis ⚡
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Mode Aktif:{" "}
                <b className="text-sky-400">
                  {activeMode === "adventure"
                    ? "🗺️ Petualangan Desa 3D"
                    : activeMode === "matching"
                    ? "🧩 Menjodohkan Kartu"
                    : activeMode === "tebak_kata"
                    ? "🔤 Tebak Kata Ceria"
                    : "🎲 Ular Tangga Edukasi"}
                </b>
              </p>
            </div>
          </div>

          {/* TAB SWITCHER MODE GAME */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-2xl border border-slate-700">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveMode("adventure");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeMode === "adventure"
                  ? "bg-amber-500 text-slate-950 font-black shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <span>🗺️</span>
              <span className="hidden sm:inline">Desa 3D</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveMode("matching");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeMode === "matching"
                  ? "bg-sky-500 text-white font-black shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <span>🧩</span>
              <span className="hidden sm:inline">Menjodohkan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveMode("tebak_kata");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeMode === "tebak_kata"
                  ? "bg-emerald-500 text-white font-black shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <span>🔤</span>
              <span className="hidden sm:inline">Tebak Kata</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveMode("ular_tangga");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeMode === "ular_tangga"
                  ? "bg-purple-600 text-white font-black shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <span>🎲</span>
              <span className="hidden sm:inline">Ular Tangga</span>
            </button>
          </div>

          {/* KONTROL SKOR, PENJELASAN & KELUAR */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tombol Penjelasan Materi & Voice */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowExplanationModal(true);
                speakGuruVoice(gameData?.teacherExplanation.voiceScript || `Selamat datang di materi ${resolvedTitle}!`);
              }}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded-2xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer border border-sky-400/40"
            >
              <span>📖</span>
              <span className="hidden md:inline">Penjelasan Materi 🔊</span>
            </button>

            {/* Tombol Panduan Main */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowGuideModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-2xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer border border-amber-400/40"
            >
              <span>🎮</span>
              <span className="hidden md:inline">Panduan Main</span>
            </button>

            {/* Skor Total */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-2xl border border-yellow-400/50">
              <span className="text-xs font-black text-yellow-300">🪙 {gameScore} Poin</span>
            </div>

            {/* BGM Toggle */}
            <button
              type="button"
              onClick={() => setBgmEnabled(!bgmEnabled)}
              className="p-1.5 bg-slate-800 text-slate-300 rounded-xl hover:text-white transition"
              title="Musik Latar"
            >
              {bgmEnabled ? "🔊" : "🔇"}
            </button>

            {/* Tombol Keluar */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                stopGuruVoice();
                stopAdventureBgm();
                onClose();
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-1.5 rounded-2xl text-xs shadow-md transition cursor-pointer"
            >
              ✕ Keluar
            </button>
          </div>
        </header>

        {/* NOTIFIKASI MELAYANG */}
        {activeNotification && (
          <div className="absolute top-16 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 max-w-md bg-slate-900/95 border-2 border-yellow-400 p-3 rounded-2xl shadow-2xl text-center text-white text-xs font-bold backdrop-blur-md">
            {activeNotification}
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW AREA UTAMA BERDASARKAN ACTIVE MODE                           */}
        {/* ================================================================== */}
        <div className="flex-1 w-full relative overflow-hidden flex flex-col items-center justify-center bg-slate-900">
          {/* MODE 1: PETUALANGAN DESA 3D */}
          {activeMode === "adventure" && (
            <div className="w-full h-full relative">
              <div ref={setMountEl} className="absolute inset-0 w-full h-full block" />

              {/* OVERLAY MULAI 3D */}
              {!game3dStarted && (
                <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center text-4xl shadow-2xl border-4 border-white animate-bounce">
                    🎒
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <h3 className="font-black text-xl sm:text-2xl text-yellow-300">
                      JELAJAH DESA 3D: {resolvedTitle}
                    </h3>
                    <p className="text-xs text-slate-200">
                      Temui Pak Guru di dekat gapura untuk mendengar penjelasan suara, kumpulkan koin di jalan desa, sapa kawan sekelas online, dan kunjungi pos checkpoint misi!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setGame3dStarted(true);
                      startAdventureBgm();
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm py-3 px-8 rounded-full shadow-xl transition hover:scale-105 active:scale-95 border-3 border-white cursor-pointer"
                  >
                    ▶️ Masuk ke Jalan Desa 3D
                  </button>
                </div>
              )}

              {/* Balon Sapaan Teman Online */}
              {friendGreetingBubble && (
                <div className="absolute bottom-28 inset-x-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 max-w-md bg-emerald-950/95 border-3 border-emerald-400 p-4 rounded-3xl shadow-2xl text-center text-white space-y-1 backdrop-blur-md">
                  <span className="text-xs text-emerald-400 font-black uppercase tracking-wider block">
                    👋 Sapaan dari {friendGreetingBubble.name}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-100">{friendGreetingBubble.text}</p>
                </div>
              )}

              {/* Controller Layar Sentuh / D-Pad */}
              <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between pointer-events-none">
                <div className="grid grid-cols-3 gap-1.5 pointer-events-auto">
                  <div />
                  <button
                    type="button"
                    onMouseDown={() => (keysRef.current.forward = true)}
                    onMouseUp={() => (keysRef.current.forward = false)}
                    onTouchStart={() => (keysRef.current.forward = true)}
                    onTouchEnd={() => (keysRef.current.forward = false)}
                    className="w-11 h-11 rounded-2xl bg-slate-900/80 text-white border border-yellow-400/60 font-black flex items-center justify-center cursor-pointer active:scale-90"
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
                    className="w-11 h-11 rounded-2xl bg-slate-900/80 text-white border border-yellow-400/60 font-black flex items-center justify-center cursor-pointer active:scale-90"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onMouseDown={() => (keysRef.current.backward = true)}
                    onMouseUp={() => (keysRef.current.backward = false)}
                    onTouchStart={() => (keysRef.current.backward = true)}
                    onTouchEnd={() => (keysRef.current.backward = false)}
                    className="w-11 h-11 rounded-2xl bg-slate-900/80 text-white border border-yellow-400/60 font-black flex items-center justify-center cursor-pointer active:scale-90"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onMouseDown={() => (keysRef.current.right = true)}
                    onMouseUp={() => (keysRef.current.right = false)}
                    onTouchStart={() => (keysRef.current.right = true)}
                    onTouchEnd={() => (keysRef.current.right = false)}
                    className="w-11 h-11 rounded-2xl bg-slate-900/80 text-white border border-yellow-400/60 font-black flex items-center justify-center cursor-pointer active:scale-90"
                  >
                    ▶
                  </button>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const event = new KeyboardEvent("keydown", { key: "e" });
                      window.dispatchEvent(event);
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs shadow-xl flex items-center gap-1.5 cursor-pointer border-2 border-white"
                  >
                    <span>🎯</span>
                    <span>AKSI (E)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      keysRef.current.jump = true;
                      setTimeout(() => (keysRef.current.jump = false), 120);
                    }}
                    className="bg-yellow-400 hover:bg-amber-500 text-slate-950 font-black text-xs py-2.5 px-5 rounded-2xl shadow-xl transition active:scale-95 border-2 border-white cursor-pointer"
                  >
                    🟡 LOMPAT
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: MENJODOHKAN KARTU PASANGAN */}
          {activeMode === "matching" && (
            <div className="w-full max-w-4xl p-4 sm:p-6 flex flex-col items-center space-y-4 overflow-y-auto max-h-full">
              <div className="text-center space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-yellow-300">
                  🧩 MENJODOHKAN KARTU EDUKASI: {resolvedTitle}
                </h3>
                <p className="text-xs text-slate-300">
                  Cocokkan kartu istilah / konsep dengan pasangan definisinya! Total Langkah: <b>{matchingMoves}</b>
                </p>
              </div>

              {/* Grid Kartu */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
                {matchingCards.map((card, idx) => {
                  const isSelected = selectedCards.includes(idx);
                  return (
                    <button
                      key={card.uid}
                      type="button"
                      disabled={card.isMatched}
                      onClick={() => handleCardClick(idx)}
                      className={`p-4 rounded-2xl min-h-[110px] flex flex-col items-center justify-center text-center transition-all duration-300 border-2 cursor-pointer ${
                        card.isMatched
                          ? "bg-emerald-950/70 border-emerald-400 text-emerald-300 opacity-60 scale-95"
                          : isSelected
                          ? "bg-sky-600 border-white text-white scale-105 shadow-xl"
                          : "bg-slate-800/90 hover:bg-slate-700/90 border-slate-600 text-slate-100 hover:border-yellow-400"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-yellow-400 tracking-wider mb-1">
                        {card.category}
                      </span>
                      <span className="text-xs sm:text-sm font-black leading-snug">
                        {card.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {matchingCompleted && (
                <div className="p-4 bg-emerald-900/80 border-2 border-emerald-400 rounded-3xl text-center space-y-2 max-w-md animate-in zoom-in">
                  <div className="text-3xl">🏆</div>
                  <h4 className="font-black text-base text-yellow-300">
                    LUAR BIASA! SEMUA PASANGAN COCOK!
                  </h4>
                  <p className="text-xs text-slate-200">
                    Kamu berhasil menyelesaikan permainan menjodohkan dalam <b>{matchingMoves} langkah</b>!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!gameData?.matchingPairs) return;
                      const cards: MatchingCardItem[] = [];
                      gameData.matchingPairs.slice(0, 6).forEach((p, idx) => {
                        cards.push({ uid: `${p.id}-term-${idx}`, pairId: p.id, text: p.term, category: p.category, isMatched: false });
                        cards.push({ uid: `${p.id}-match-${idx}`, pairId: p.id, text: p.match, category: p.category, isMatched: false });
                      });
                      setMatchingCards(cards.sort(() => Math.random() - 0.5));
                      setSelectedCards([]);
                      setMatchingMoves(0);
                      setMatchingCompleted(false);
                    }}
                    className="bg-yellow-400 hover:bg-amber-500 text-slate-950 font-black text-xs py-2 px-6 rounded-2xl cursor-pointer shadow-md"
                  >
                    🔄 Mainkan Ulang
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: TEBAK KATA CERIA */}
          {activeMode === "tebak_kata" && currentChallenge && (
            <div className="w-full max-w-2xl p-4 sm:p-6 flex flex-col items-center space-y-5 overflow-y-auto max-h-full">
              <div className="text-center space-y-1">
                <span className="text-xs font-black bg-purple-500/20 text-purple-300 px-3 py-0.5 rounded-full border border-purple-500/40">
                  Tantangan {currentWordIdx + 1} dari {gameData?.tebakKataChallenges.length || 1}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-yellow-300">
                  🔤 TEBAK KATA CERIA: {resolvedTitle}
                </h3>
              </div>

              {/* Kartu Petunjuk */}
              <div className="w-full bg-slate-800/90 border-2 border-slate-700 p-5 rounded-3xl text-center space-y-2">
                <span className="text-xs text-yellow-400 font-bold uppercase tracking-widest">
                  Petunjuk Soal:
                </span>
                <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                  "{currentChallenge.clue}"
                </p>
                {showWordHint && (
                  <div className="text-xs text-sky-300 bg-sky-950/60 p-2.5 rounded-xl border border-sky-600/40 animate-in fade-in">
                    💡 Huruf Awal: <b>{currentChallenge.word[0]}</b> • Panjang Kata: <b>{currentChallenge.word.length} huruf</b>
                  </div>
                )}
              </div>

              {/* Slot Jawaban Terangkai */}
              <div className="flex items-center justify-center gap-2 flex-wrap min-h-[56px]">
                {Array.from({ length: currentChallenge.word.length }).map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-yellow-400 flex items-center justify-center text-xl font-black text-yellow-300 shadow-md"
                  >
                    {assembledLetters[i] || ""}
                  </div>
                ))}
              </div>

              {/* Tombol Huruf Acak */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {availableTiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    disabled={tile.used}
                    onClick={() => handlePickLetter(tile.id)}
                    className={`w-12 h-12 rounded-2xl font-black text-lg transition-all shadow-md cursor-pointer border-2 ${
                      tile.used
                        ? "bg-slate-800/50 border-slate-700 text-slate-600 opacity-40 scale-95"
                        : "bg-gradient-to-tr from-amber-400 to-orange-500 border-white text-slate-950 hover:scale-110 active:scale-95"
                    }`}
                  >
                    {tile.char}
                  </button>
                ))}
              </div>

              {/* Feedback Jawaban */}
              {tebakKataFeedback && (
                <div
                  className={`p-4 rounded-2xl text-center text-xs sm:text-sm font-bold border-2 w-full animate-in zoom-in ${
                    tebakKataFeedback.isCorrect
                      ? "bg-emerald-950/90 border-emerald-400 text-emerald-200"
                      : "bg-rose-950/90 border-rose-400 text-rose-200"
                  }`}
                >
                  {tebakKataFeedback.text}
                </div>
              )}

              {/* Tombol Kontrol */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetWord}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs py-2 px-4 rounded-2xl transition cursor-pointer"
                >
                  🔄 Atur Ulang Huruf
                </button>

                <button
                  type="button"
                  onClick={() => setShowWordHint(true)}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2 px-4 rounded-2xl transition cursor-pointer"
                >
                  💡 Minta Petunjuk
                </button>

                {tebakKataFeedback?.isCorrect && (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentWordIdx + 1 < (gameData?.tebakKataChallenges.length || 0)) {
                        setCurrentWordIdx(currentWordIdx + 1);
                      } else {
                        setCurrentWordIdx(0);
                      }
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-2 px-5 rounded-2xl transition cursor-pointer"
                  >
                    Kata Berikutnya ➡️
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MODE 4: ULAR TANGGA EDUKASI */}
          {activeMode === "ular_tangga" && (
            <div className="w-full max-w-4xl p-4 sm:p-6 flex flex-col items-center space-y-4 overflow-y-auto max-h-full">
              <div className="text-center space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-yellow-300">
                  🎲 ULAR TANGGA EDUKASI: {resolvedTitle}
                </h3>
                <p className="text-xs text-slate-300">
                  Posisi Pionmu: <b>Petak #{playerTile}</b> dari 30 • Lempar dadu dan jawab kuis di kotak misteri!
                </p>
              </div>

              {/* Papan 30 Petak (5 Baris x 6 Kolom) */}
              <div className="grid grid-cols-6 gap-2 w-full max-w-2xl bg-slate-800/90 p-4 rounded-3xl border-3 border-purple-500/50 shadow-2xl">
                {Array.from({ length: 30 }).map((_, i) => {
                  const tileNum = 30 - i;
                  const isPlayerHere = playerTile === tileNum;
                  const hasLadder = gameData?.ularTangga.ladders[tileNum];
                  const hasSnake = gameData?.ularTangga.snakes[tileNum];
                  const hasQuiz = gameData?.ularTangga.quizTiles[tileNum];

                  return (
                    <div
                      key={tileNum}
                      className={`h-14 sm:h-16 rounded-2xl p-1.5 flex flex-col justify-between items-center text-center relative border transition-all ${
                        isPlayerHere
                          ? "bg-yellow-400 border-white text-slate-950 font-black shadow-lg ring-2 ring-yellow-400 scale-105 z-10"
                          : tileNum === 30
                          ? "bg-gradient-to-tr from-amber-400 to-yellow-500 border-yellow-300 text-slate-950 font-black"
                          : "bg-slate-900/90 border-slate-700 text-slate-200"
                      }`}
                    >
                      <div className="w-full flex justify-between items-center text-[10px] font-bold">
                        <span>#{tileNum}</span>
                        {hasLadder && <span className="text-emerald-400 text-xs">🪜+{hasLadder}</span>}
                        {hasSnake && <span className="text-rose-400 text-xs">🐍-{hasSnake}</span>}
                        {hasQuiz && <span className="text-sky-300 text-xs font-black">❓</span>}
                        {tileNum === 30 && <span>🏆</span>}
                      </div>

                      {isPlayerHere && (
                        <div className="w-7 h-7 rounded-full bg-slate-950 text-white flex items-center justify-center text-sm shadow-md animate-bounce">
                          🎒
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tombol Lempar Dadu */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={isRollingDice || !!activeQuizTile || ularTanggaFinished}
                  onClick={handleRollDice}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm py-3 px-8 rounded-2xl shadow-xl transition active:scale-95 border-2 border-white cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <span>🎲</span>
                  <span>{isRollingDice ? "Mengocok Dadu..." : "Lempar Dadu"}</span>
                </button>

                {diceValue && (
                  <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white">
                    {diceValue}
                  </div>
                )}
              </div>

              {ularTanggaFinished && (
                <div className="p-4 bg-yellow-400/20 border-2 border-yellow-400 rounded-3xl text-center space-y-1 max-w-md animate-in zoom-in">
                  <div className="text-3xl">🏆</div>
                  <h4 className="font-black text-sm text-yellow-300">
                    SELAMAT! KAMU MENCAPAI PUNCAK PETAK 30!
                  </h4>
                  <p className="text-xs text-slate-200">
                    Kamu berhasil menguasai materi <b>{resolvedTitle}</b> dengan gemilang!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* MODAL POPUP: PENJELASAN MATERI PAK GURU & SUARA AUDIO INDONESIA   */}
        {/* ================================================================== */}
        {showExplanationModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border-3 border-sky-400 rounded-3xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-3xl">
                    👨‍🏫
                  </span>
                  <div>
                    <h3 className="font-black text-base text-sky-300">Penjelasan Materi Pak Guru</h3>
                    <p className="text-xs text-slate-300">{resolvedTitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopGuruVoice();
                    setShowExplanationModal(false);
                  }}
                  className="text-slate-400 hover:text-white px-2 py-1 text-base cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 text-xs sm:text-sm leading-relaxed text-slate-200 space-y-2.5 max-h-64 overflow-y-auto">
                <p className="font-semibold text-yellow-300">
                  {gameData?.teacherExplanation.summaryText}
                </p>
                <div className="space-y-1.5 pt-1">
                  {gameData?.teacherExplanation.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-sky-400 font-bold shrink-0">⭐</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isGuruSpeaking) {
                      stopGuruVoice();
                    } else {
                      speakGuruVoice(gameData?.teacherExplanation.voiceScript || `Materi: ${resolvedTitle}`);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isGuruSpeaking
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-sky-500 hover:bg-sky-600 text-white"
                  }`}
                >
                  <span>{isGuruSpeaking ? "⏹️ Hentikan Suara" : "🔊 Putar Suara Guru"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopGuruVoice();
                    setShowExplanationModal(false);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-5 rounded-xl text-xs cursor-pointer"
                >
                  Siap Mainkan Game 🚀
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL POPUP: PANDUAN CARA BERMAIN SESUAI MODE AKTIF                */}
        {/* ================================================================== */}
        {showGuideModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border-3 border-amber-400 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🎮</span>
                  <h3 className="font-black text-base text-yellow-300">
                    Panduan Bermain:{" "}
                    {activeMode === "adventure"
                      ? "Desa 3D"
                      : activeMode === "matching"
                      ? "Menjodohkan"
                      : activeMode === "tebak_kata"
                      ? "Tebak Kata"
                      : "Ular Tangga"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="text-slate-400 hover:text-white px-2 py-1 text-base cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 text-xs sm:text-sm leading-relaxed text-slate-200">
                {gameData?.gameGuides[activeMode]}
              </div>

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-2xl text-xs transition cursor-pointer"
              >
                Paham, Ayo Mulai! 👍
              </button>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL KUIS POS PETUALANGAN 3D                                      */}
        {/* ================================================================== */}
        {active3dPosDialog && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border-3 border-yellow-400 rounded-3xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
                <span className="w-12 h-12 rounded-2xl bg-yellow-400/20 border border-yellow-400 flex items-center justify-center text-3xl">
                  {active3dPosDialog.tokohAvatar}
                </span>
                <div>
                  <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                    {active3dPosDialog.simbol} Pos #{active3dPosDialog.nomorPos} • {active3dPosDialog.tempat}
                  </span>
                  <h3 className="font-black text-base text-white">{active3dPosDialog.namaPos}</h3>
                  <p className="text-xs text-slate-300">Disambut oleh: <b>{active3dPosDialog.tokohNama}</b></p>
                </div>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-xs sm:text-sm leading-relaxed text-slate-100 font-medium">
                "{active3dPosDialog.pertanyaan}"
              </div>

              <div className="space-y-2">
                {active3dPosDialog.opsi.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleAnswer3dPos(active3dPosDialog, opt.id)}
                    className={`w-full text-left p-3.5 rounded-2xl transition text-xs sm:text-sm font-semibold flex items-start gap-3 cursor-pointer border ${
                      selectedAnswer === opt.id
                        ? opt.benar
                          ? "bg-emerald-600 border-emerald-300 text-white shadow-lg"
                          : "bg-rose-600 border-rose-300 text-white shadow-lg"
                        : "bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs shrink-0">
                      {opt.id}
                    </span>
                    <span>{opt.teks}</span>
                  </button>
                ))}
              </div>

              {answerFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                    answerFeedback.isCorrect
                      ? "bg-emerald-950/90 border-emerald-400 text-emerald-200"
                      : "bg-rose-950/90 border-rose-400 text-rose-200"
                  }`}
                >
                  <b>{answerFeedback.isCorrect ? "✅ Jawaban Benar!" : "❌ Perhatikan lagi:"}</b> {answerFeedback.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActive3dPosDialog(null)}
                  className="bg-yellow-400 hover:bg-amber-500 text-slate-950 font-black py-2 px-6 rounded-2xl text-xs cursor-pointer shadow-md"
                >
                  Lanjut Menjelajah 🚀
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL KUIS PETAK ULAR TANGGA                                       */}
        {/* ================================================================== */}
        {activeQuizTile && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border-3 border-purple-400 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
              <div className="flex items-center gap-2.5 border-b border-slate-700 pb-3">
                <span className="text-2xl">❓</span>
                <h3 className="font-black text-base text-yellow-300">
                  Tantangan Kuis Petak #{activeQuizTile.tileNumber}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-100 font-semibold leading-relaxed bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                "{activeQuizTile.question}"
              </p>

              <div className="space-y-2">
                {activeQuizTile.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAnswerQuizTile(i)}
                    className={`w-full text-left p-3 rounded-2xl text-xs font-semibold transition border cursor-pointer ${
                      quizSelectedOption === i
                        ? i === activeQuizTile.correctIndex
                          ? "bg-emerald-600 border-emerald-300 text-white"
                          : "bg-rose-600 border-rose-300 text-white"
                        : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {quizAnswerFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                    quizAnswerFeedback.isCorrect
                      ? "bg-emerald-950/90 border-emerald-400 text-emerald-200"
                      : "bg-rose-950/90 border-rose-400 text-rose-200"
                  }`}
                >
                  {quizAnswerFeedback.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveQuizTile(null)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-5 rounded-2xl text-xs cursor-pointer shadow-md"
                >
                  Lanjut Main 🎲
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalPortal>
  );
}
