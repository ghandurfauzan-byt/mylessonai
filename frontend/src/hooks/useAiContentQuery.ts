// src/hooks/useAiContentQuery.ts — BARU pada Tugas 8. Padanan langsung dari
// AiContentPanel (dulu ASYNC Server Component) yang kini menjadi Client
// Component murni memakai TanStack Query. queryKey menyertakan `chapter`,
// `mode`, DAN `refreshNonce` — persis fungsi query string `?r=<timestamp>`
// yang dulu memaksa React membongkar ulang <Suspense> pada RefreshAiButton.

import { fetchAiContent } from "@/lib/api/classApi";
import type { AiMode } from "@shared/catalog";
import { useQuery } from "@tanstack/react-query";

export function useAiContentQuery(chapterId: string, mode: AiMode, refreshNonce: string) {
  const isForcedRefresh = Boolean(refreshNonce && refreshNonce !== "0");
  const queryKey = isForcedRefresh
    ? ["ai-content", chapterId, mode, refreshNonce]
    : ["ai-content", chapterId, mode];

  return useQuery({
    queryKey,
    queryFn: () => fetchAiContent(chapterId, mode),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 0,
    refetchOnWindowFocus: false,
  });
}
