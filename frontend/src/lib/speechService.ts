// src/lib/speechService.ts — Engine Suara & Text-To-Speech Anti-Macet untuk Google Chrome & Browser Modern
//
// Mengatasi 4 bug mendasar SpeechSynthesis di Chromium/Chrome/Edge:
// 1. Bug Instant-Cancel: Memanggil speak() di tick yang sama setelah cancel() membuat Chrome membatalkan audio baru (diatasi dengan jeda aman 120ms).
// 2. Bug Freeze 15 Detik: Chrome otomatis membeku jika teks dibaca >15 detik (diatasi dengan keepalive pause/resume ping setiap 6 detik).
// 3. Bug Garbage Collection: Objek utterance terhapus dari memori saat diputar (diatasi dengan activeUtterance global).
// 4. Bug Suara Tak Bersuara: getVoices() lambat dimuat / tidak ada suara Bahasa Indonesia di Windows (diatasi dengan fallback suara default sistem).

export type SpeechOptions = {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: unknown) => void;
};

// Referensi persisten global agar Garbage Collector Chrome tidak memutus audio di tengah jalan
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechTimeoutId: ReturnType<typeof setTimeout> | null = null;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

// Inisialisasi & caching suara sistem
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const updateVoices = () => {
    try {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        cachedVoices = list;
      }
    } catch {
      // Ignore
    }
  };

  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

/**
 * Mendapatkan daftar suara terbaik untuk Bahasa Indonesia atau fallback sistem
 */
export function getBestVoice(): { voice: SpeechSynthesisVoice | null; lang: string } {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { voice: null, lang: "id-ID" };
  }

  const liveVoices = window.speechSynthesis.getVoices();
  const voices = liveVoices && liveVoices.length > 0 ? liveVoices : cachedVoices;
  if (!voices || voices.length === 0) {
    return { voice: null, lang: "id-ID" };
  }

  // 1. Prioritaskan suara Indonesia berkualitas tinggi / Natural
  const premiumIdVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith("id") &&
      (v.name.includes("Natural") ||
        v.name.includes("Gadis") ||
        v.name.includes("Google") ||
        v.name.includes("Ardi") ||
        v.name.includes("Andika") ||
        v.name.includes("Indonesian"))
  );
  if (premiumIdVoice) return { voice: premiumIdVoice, lang: premiumIdVoice.lang || "id-ID" };

  // 2. Suara bahasa Indonesia standar
  const anyIdVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith("id") ||
      v.lang.toLowerCase().includes("id-id") ||
      v.name.toLowerCase().includes("indonesia")
  );
  if (anyIdVoice) return { voice: anyIdVoice, lang: anyIdVoice.lang || "id-ID" };

  // 3. Fallback suara default sistem jika pack bahasa Indonesia belum terpasang di OS Windows
  const defaultVoice = voices.find((v) => v.default) || voices[0];
  if (defaultVoice) {
    return { voice: defaultVoice, lang: defaultVoice.lang || "id-ID" };
  }

  return { voice: null, lang: "id-ID" };
}

/**
 * Membersihkan teks dari emoji dan karakter aneh agar engine suara tidak tersedak
 */
export function sanitizeSpeechText(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/["“”«»]/g, "")
    .replace(/[\*\#\@\_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Memecah teks panjang menjadi potongan kalimat alami (max ~120 karakter)
 */
export function splitIntoSentences(text: string): string[] {
  const clean = sanitizeSpeechText(text);
  if (!clean) return [];

  const rawParts = clean.split(/(?<=[.!?;\n])\s+/);
  const chunks: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.length > 140) {
      const subParts = trimmed.split(/(?<=[,])\s+/);
      for (const sub of subParts) {
        const subTrim = sub.trim();
        if (subTrim) chunks.push(subTrim);
      }
    } else {
      chunks.push(trimmed);
    }
  }

  return chunks.length > 0 ? chunks : [clean];
}

/**
 * Menghentikan seluruh pemutaran suara yang sedang berjalan dan membersihkan antrean
 */
export function stopSpeaking(): void {
  if (speechTimeoutId) {
    clearTimeout(speechTimeoutId);
    speechTimeoutId = null;
  }

  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }

  activeUtterance = null;

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * Memutar suara teks dengan engine tahan banting terhadap macet di Chrome
 */
export function startSpeaking(options: SpeechOptions): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    options.onError?.(new Error("SpeechSynthesis tidak didukung di peramban ini."));
    options.onEnd?.();
    return;
  }

  // 1. Bersihkan timeout & timer sebelumnya
  if (speechTimeoutId) {
    clearTimeout(speechTimeoutId);
    speechTimeoutId = null;
  }
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }

  // 2. Batalkan antrean lama dan bangunkan engine jika tertidur
  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {}

  const cleanText = sanitizeSpeechText(options.text);
  if (!cleanText) {
    options.onEnd?.();
    return;
  }

  // 3. Buat objek utterance
  const utterance = new SpeechSynthesisUtterance(cleanText);
  activeUtterance = utterance; // Simpan di memori global agar bebas dari Garbage Collection Chrome

  const { voice, lang } = getBestVoice();
  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = lang || "id-ID";
  utterance.rate = options.rate ?? 0.95;
  utterance.pitch = options.pitch ?? 1.15;
  utterance.volume = options.volume ?? 1.0;

  utterance.onstart = () => {
    options.onStart?.();

    // Keepalive ping setiap 6 detik untuk mencegah bug cutoff 15 detik Chromium
    if (keepAliveTimer) clearInterval(keepAliveTimer);
    keepAliveTimer = setInterval(() => {
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }
      } catch {}
    }, 6000);
  };

  utterance.onend = () => {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
    activeUtterance = null;
    options.onEnd?.();
  };

  utterance.onerror = (event) => {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
    activeUtterance = null;

    const isInterrupted =
      (event as unknown as { error?: string })?.error === "interrupted" ||
      (event as unknown as { error?: string })?.error === "canceled";

    if (!isInterrupted) {
      options.onError?.(event);
    }
    options.onEnd?.();
  };

  // 4. Jeda aman 120ms setelah cancel() agar C++ audio thread browser selesai mereset buffer sebelum speak()
  speechTimeoutId = setTimeout(() => {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      activeUtterance = null;
      options.onError?.(err);
      options.onEnd?.();
    }
  }, 120);
}

/**
 * Mengecek apakah browser sedang memutar suara TTS
 */
export function isSpeaking(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return window.speechSynthesis.speaking && activeUtterance !== null;
}
