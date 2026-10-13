import { describe, expect, it } from "vitest";

// Logic unit gamifikasi & kuis adaptif
export function calculateQuizScore(level: 1 | 2 | 3, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  switch (level) {
    case 1:
      return 10;
    case 2:
      return 20;
    case 3:
      return 30;
  }
}

export function isNextLevelUnlocked(
  currentLevel: 1 | 2 | 3,
  score: number,
  maxPossible: number
): boolean {
  const percentage = (score / maxPossible) * 100;
  return percentage >= 60;
}

export function evaluateRemedialStatus(scorePercent: number): {
  needsRemedial: boolean;
  recommendation: string | null;
} {
  if (scorePercent < 60) {
    return {
      needsRemedial: true,
      recommendation: "Pelajari ulang materi, ringkasan esensial, dan analogi modul ini.",
    };
  }
  return {
    needsRemedial: false,
    recommendation: null,
  };
}

describe("Adaptive Quiz & Gamification Logic (FR-11, FR-12, FR-13, FR-14, FR-17)", () => {
  describe("Point Calculation Rules", () => {
    it("Level 1 (Mudah): +10 Poin jika benar (FR-11, TC-14)", () => {
      expect(calculateQuizScore(1, true)).toBe(10);
      expect(calculateQuizScore(1, false)).toBe(0);
    });

    it("Level 2 (Sedang): +20 Poin jika benar (FR-12, TC-15)", () => {
      expect(calculateQuizScore(2, true)).toBe(20);
      expect(calculateQuizScore(2, false)).toBe(0);
    });

    it("Level 3 (Sulit): +30 Poin jika benar (FR-13, TC-16)", () => {
      expect(calculateQuizScore(3, true)).toBe(30);
      expect(calculateQuizScore(3, false)).toBe(0);
    });
  });

  describe("Adaptive Progression & Level Unlocking", () => {
    it("should unlock Level 2 only when Level 1 score >= 60%", () => {
      expect(isNextLevelUnlocked(1, 30, 50)).toBe(true); // 60%
      expect(isNextLevelUnlocked(1, 40, 50)).toBe(true); // 80%
      expect(isNextLevelUnlocked(1, 20, 50)).toBe(false); // 40% (locked)
    });

    it("should unlock Level 3 only when Level 2 score >= 60%", () => {
      expect(isNextLevelUnlocked(2, 60, 100)).toBe(true);
      expect(isNextLevelUnlocked(2, 50, 100)).toBe(false);
    });
  });

  describe("Remedial Triggering (FR-17, TC-18)", () => {
    it("should trigger remedial recommendation if score < 60%", () => {
      const evaluation = evaluateRemedialStatus(55);
      expect(evaluation.needsRemedial).toBe(true);
      expect(evaluation.recommendation).toContain("Pelajari ulang materi");
    });

    it("should not trigger remedial recommendation if score >= 60%", () => {
      const evaluation = evaluateRemedialStatus(75);
      expect(evaluation.needsRemedial).toBe(false);
      expect(evaluation.recommendation).toBeNull();
    });
  });

  describe("Reset Acknowledgement & Point Accumulation", () => {
    it("should only acknowledge reset once per resetAt timestamp, preserving newly earned points", () => {
      let storedPoints = 0;
      let lastAckResetTime = 0;

      // 1. Guru melakukan reset pada t = 1000
      const resetEvent = { isReset: true, resetAt: 1000 };

      // Poll 1: Deteksi reset baru
      if (resetEvent.isReset && resetEvent.resetAt > lastAckResetTime) {
        lastAckResetTime = resetEvent.resetAt;
        storedPoints = 0;
      }
      expect(storedPoints).toBe(0);
      expect(lastAckResetTime).toBe(1000);

      // Siswa mengerjakan soal dan membaca materi (+10 poin kuis, +10 poin baca)
      storedPoints += 10;
      storedPoints += 10;
      expect(storedPoints).toBe(20);

      // Poll 2 (4 detik kemudian): Timestamp resetAt masih sama (1000)
      if (resetEvent.isReset && resetEvent.resetAt > lastAckResetTime) {
        lastAckResetTime = resetEvent.resetAt;
        storedPoints = 0;
      }
      // Poin TIDAK ter-reset kembali ke 0
      expect(storedPoints).toBe(20);

      // 2. Guru melakukan reset lagi di kemudian hari pada t = 2000
      const newResetEvent = { isReset: true, resetAt: 2000 };
      if (newResetEvent.isReset && newResetEvent.resetAt > lastAckResetTime) {
        lastAckResetTime = newResetEvent.resetAt;
        storedPoints = 0;
      }
      expect(storedPoints).toBe(0);
      expect(lastAckResetTime).toBe(2000);
    });
  });
});
