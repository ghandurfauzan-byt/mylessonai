// src/lib/soundEffects.ts — Efek Suara Arcade Interaktif Berbasis Web Audio API

import {
  isSpeaking,
  startSpeaking,
  stopSpeaking,
} from "./speechService";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  // Jika context sebelumnya closed (karena tab tertidur/idle), buat instance baru
  if (audioCtx && audioCtx.state === "closed") {
    audioCtx = null;
  }

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      try {
        audioCtx = new AudioContextClass();
      } catch {
        audioCtx = null;
      }
    }
  }

  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// User-gesture auto-unlocker untuk browser modern (Chrome Autoplay Policy)
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    try {
      if (audioCtx && audioCtx.state === "suspended") {
        void audioCtx.resume();
      }
    } catch {}
  };
  window.addEventListener("click", unlockAudio, { passive: true, capture: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true, capture: true });
}

let lastClickTime = 0;

/**
 * Suara Klik Tombol Bubbly Lucu & Renyah (Seperti Gelembung Pop Game Nintendo/Mario)
 * Dibuat lebih lantang, empuk, dan ceria saat ditekan
 */
export function playClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = Date.now();
    // Debounce 40ms agar klik ganda instan tidak tumpang tindih berisik
    if (now - lastClickTime < 40) return;
    lastClickTime = now;

    const startTime = ctx.currentTime;

    // 1. Nada pop ceria naik cepat (520Hz -> 1350Hz) - lebih lantang dan berkarakter
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(520, startTime);
    osc.frequency.exponentialRampToValueAtTime(1350, startTime + 0.055);

    gain.gain.setValueAtTime(0.01, startTime);
    gain.gain.linearRampToValueAtTime(0.38, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.13);

    // 2. Click snap renyah di awal (menambah kesan tactile / tombol empuk ditekan)
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = "triangle";
    snapOsc.frequency.setValueAtTime(1600, startTime);
    snapOsc.frequency.exponentialRampToValueAtTime(700, startTime + 0.035);

    snapGain.gain.setValueAtTime(0.25, startTime);
    snapGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.045);

    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);

    snapOsc.start(startTime);
    snapOsc.stop(startTime + 0.05);
  } catch {
    // Ignore audio errors gracefully
  }
}

/**
 * Suara Jawaban Benar RAME! (Fanfare Selebrasi Kemenangan Ceria + Lonceng Emas)
 */
export function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;

    // 1. Arpeggio Cepat Tangga Nada Mayor Ceria (C5, E5, G5, C6, E6, G6)
    const fanfareNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    fanfareNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.065);

      gain.gain.setValueAtTime(0.001, startTime + idx * 0.065);
      gain.gain.linearRampToValueAtTime(0.3, startTime + idx * 0.065 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.065 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.065);
      osc.stop(startTime + idx * 0.065 + 0.24);
    });

    // 2. Kilau Lonceng Emas Berdenting Panjang di Puncak
    const chimeTimes = [0.25, 0.38, 0.52];
    chimeTimes.forEach((t) => {
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = "sine";
      chimeOsc.frequency.setValueAtTime(2093, startTime + t); // C7
      chimeGain.gain.setValueAtTime(0.18, startTime + t);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, startTime + t + 0.35);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);

      chimeOsc.start(startTime + t);
      chimeOsc.stop(startTime + t + 0.38);
    });

    // 3. Akord Kemenangan Harmonis C-Major Penutup
    const chordNotes = [523.25, 659.25, 783.99, 1046.5];
    chordNotes.forEach((f) => {
      const chordOsc = ctx.createOscillator();
      const chordGain = ctx.createGain();
      chordOsc.type = "sine";
      chordOsc.frequency.setValueAtTime(f, startTime + 0.42);

      chordGain.gain.setValueAtTime(0.01, startTime + 0.42);
      chordGain.gain.linearRampToValueAtTime(0.16, startTime + 0.45);
      chordGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);

      chordOsc.connect(chordGain);
      chordGain.connect(ctx.destination);

      chordOsc.start(startTime + 0.42);
      chordOsc.stop(startTime + 0.92);
    });
  } catch {
    // Ignore
  }
}

/**
 * Suara Jawaban Salah Menarik & Keras!
 * Kombinasi:
 * 1. Double Buzzer "TET-TET!" Game Show Arcade (Punchy & Renyah)
 * 2. Slide Meluncur Kartun Jenaka "Wobble Boing"
 * 3. Bass "Womp-womp" Lucu
 */
export function playWrongSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;

    // --- 1. DOUBLE BUZZER "TET-TET!" (Game Show Style, Lantang & Keras) ---
    const buzzerTimes = [0, 0.12];
    buzzerTimes.forEach((delayTime) => {
      const t = startTime + delayTime;

      // Nada rendah & nada harmoni untuk karakter game show retro
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(155, t); // Eb3

      osc2.type = "square";
      osc2.frequency.setValueAtTime(116, t); // Bb2

      // Volume lantang & renyah
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.42, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.095);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(t);
      osc1.stop(t + 0.1);
      osc2.start(t);
      osc2.stop(t + 0.1);
    });

    // --- 2. KARTUN SLIDE "BOING-WOMP" (Jenaka, Lucu & Menghibur) ---
    const slideTime = startTime + 0.22;
    const slideOsc = ctx.createOscillator();
    const slideGain = ctx.createGain();

    slideOsc.type = "triangle";
    // Meluncur turun dari 320Hz ke 130Hz
    slideOsc.frequency.setValueAtTime(320, slideTime);
    slideOsc.frequency.exponentialRampToValueAtTime(120, slideTime + 0.28);

    slideGain.gain.setValueAtTime(0.01, slideTime);
    slideGain.gain.linearRampToValueAtTime(0.38, slideTime + 0.02);
    slideGain.gain.exponentialRampToValueAtTime(0.001, slideTime + 0.3);

    slideOsc.connect(slideGain);
    slideGain.connect(ctx.destination);

    slideOsc.start(slideTime);
    slideOsc.stop(slideTime + 0.32);

    // --- 3. BASS "WOMP" PENUTUP LUCU ---
    const wompTime = startTime + 0.45;
    const wompOsc = ctx.createOscillator();
    const wompGain = ctx.createGain();

    wompOsc.type = "sine";
    wompOsc.frequency.setValueAtTime(110, wompTime);
    wompOsc.frequency.exponentialRampToValueAtTime(65, wompTime + 0.25);

    wompGain.gain.setValueAtTime(0.35, wompTime);
    wompGain.gain.exponentialRampToValueAtTime(0.001, wompTime + 0.28);

    wompOsc.connect(wompGain);
    wompGain.connect(ctx.destination);

    wompOsc.start(wompTime);
    wompOsc.stop(wompTime + 0.3);
  } catch {
    // Ignore audio error gracefully
  }
}

/**
 * Suara Hujan Koin Emas RAME! (Cascade Triple Clink Ding-Ding-DING!)
 */
export function playCoinSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const coinPitches = [987.77, 1318.51, 1760.0, 2093.0]; // B5 -> E6 -> A6 -> C7

    coinPitches.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.075);

      gain.gain.setValueAtTime(0.001, startTime + idx * 0.075);
      gain.gain.linearRampToValueAtTime(0.24, startTime + idx * 0.075 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.075 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.075);
      osc.stop(startTime + idx * 0.075 + 0.3);
    });
  } catch {
    // Ignore
  }
}

/**
 * Suara Robot Menyala (Chirp Ceria Futuristik BEEP-BOOP-READY!)
 */
export function playRobotAwakeSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const robotBeeps = [587.33, 880.0, 1174.66, 1760.0]; // D5, A5, D6, A6

    robotBeeps.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.06);

      gain.gain.setValueAtTime(0.01, startTime + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.2, startTime + idx * 0.06 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.06 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.06);
      osc.stop(startTime + idx * 0.06 + 0.14);
    });
  } catch {
    // Ignore
  }
}

/**
 * Suara Fanfare Megah & Denting Kristal Lencana Prestasi!
 * Nada bergelombang mayor ceria untuk selebrasi raihan medali / lencana
 */
export function playBadgeFanfareSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    // Nada melodi fanfare bersemangat: G4 -> C5 -> E5 -> G5 -> C6 (Akord Kemenangan)
    const melody = [392.0, 523.25, 659.25, 783.99, 1046.5];
    melody.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

      gain.gain.setValueAtTime(0.01, startTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.35, startTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.08);
      osc.stop(startTime + idx * 0.08 + 0.38);
    });

    // Sentuhan lonceng ajaib berkilau di akhir
    const sparkles = [1567.98, 2093.0, 2637.02];
    sparkles.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = startTime + 0.38 + idx * 0.07;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.42);
    });
  } catch {
    // Ignore
  }
}

/**
 * Membacakan panduan cara mendapatkan lencana & pesan motivasi ramah anak
 * Dibuat tahan banting terhadap bug Chrome, jeda audio, dan pembersihan emoji
 */
export function speakBadgeMotivation(text: string, onEnd?: () => void) {
  startSpeaking({
    text,
    rate: 0.95,
    pitch: 1.15,
    onEnd,
    onError: onEnd,
  });
}

/**
 * Hentikan suara ucapan
 */
export function stopBadgeSpeech() {
  stopSpeaking();
}

export { isSpeaking, startSpeaking, stopSpeaking };

