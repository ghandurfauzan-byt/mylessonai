// src/lib/api/quizApi.ts — tidak berubah dari Tugas 7 selain lokasi impor skema.

import { type Question, QuizQuestionsResponseSchema } from "@shared/schema";

export async function fetchQuestionsByLevel(level: number): Promise<Question[]> {
  const response = await fetch(`/api/quiz?level=${level}`);
  const rawData = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(rawData?.error ?? "Gagal memuat soal kuis.");
  }

  const parsed = QuizQuestionsResponseSchema.parse(rawData);
  return parsed.questions;
}
