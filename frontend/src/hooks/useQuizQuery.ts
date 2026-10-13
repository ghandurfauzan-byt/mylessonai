// src/hooks/useQuizQuery.ts — tidak berubah dari Tugas 7, kecuali `initialData`
// yang dulu di-pre-fetch di Server Component kini di-pre-fetch lewat
// queryClient.prefetchQuery di KuisAdaptifPage.tsx sebelum render (lihat
// README.md § Migrasi untuk detail penggantian pola RSC pre-fetch).

import { fetchQuestionsByLevel } from "@/lib/api/quizApi";
import type { Question } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export const quizQuestionsQueryKey = (level: number) => ["quiz", level] as const;

export function useQuizQuestionsQuery(level: number, initialData?: Question[]) {
  return useQuery({
    queryKey: quizQuestionsQueryKey(level),
    queryFn: () => fetchQuestionsByLevel(level),
    initialData,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    enabled: level >= 1 && level <= 3,
    retry: 1,
  });
}
