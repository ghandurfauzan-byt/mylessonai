// frontend/src/lib/api/gameApi.ts
// Client API untuk Generator Game Adaptif Otomatis

export interface GameOption {
  id: string;
  teks: string;
  benar: boolean;
  penjelasan: string;
}

export interface GameCheckpoint {
  id: string;
  namaPos: string;
  tempat: string;
  tokohNama: string;
  tokohAvatar: string;
  nomorPos: number;
  simbol: string;
  zPos: number;
  xPos: number;
  warnaKhas: string;
  pertanyaan: string;
  opsi: GameOption[];
}

export interface MatchingCardPair {
  id: string;
  term: string;
  match: string;
  category: string;
  hint: string;
}

export interface TebakKataChallenge {
  id: string;
  word: string;
  scrambled: string[];
  clue: string;
  explanation: string;
  points: number;
}

export interface UlarTanggaQuestion {
  tileNumber: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AdaptiveGamePackage {
  chapterId: string;
  chapterTitle: string;
  subject: string;
  recommendedMode: "adventure" | "matching" | "tebak_kata" | "ular_tangga";
  teacherExplanation: {
    summaryText: string;
    voiceScript: string;
    points: string[];
  };
  gameGuides: {
    adventure: string;
    matching: string;
    tebak_kata: string;
    ular_tangga: string;
  };
  adventureCheckpoints: GameCheckpoint[];
  matchingPairs: MatchingCardPair[];
  tebakKataChallenges: TebakKataChallenge[];
  ularTangga: {
    totalTiles: number;
    ladders: Record<number, number>;
    snakes: Record<number, number>;
    quizTiles: Record<number, UlarTanggaQuestion>;
  };
}

export async function fetchAdaptiveGameData(params: {
  chapterId?: string;
  chapterTitle?: string;
  subject?: string;
  learningGoal?: string;
  ragSummary?: string[];
}): Promise<AdaptiveGamePackage> {
  const res = await fetch("/api/games/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Gagal memuat data game adaptif (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}
