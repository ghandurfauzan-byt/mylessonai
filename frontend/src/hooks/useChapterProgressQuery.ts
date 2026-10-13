// src/hooks/useChapterProgressQuery.ts — BARU pada Tugas 8.

import { fetchChapterProgress } from "@/lib/api/classApi";
import { useQuery } from "@tanstack/react-query";

export function useChapterProgressQuery() {
  return useQuery({
    queryKey: ["chapter-progress"],
    queryFn: fetchChapterProgress,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
  });
}
