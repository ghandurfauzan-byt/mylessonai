// src/hooks/useClassSummaryQuery.ts — BARU pada Tugas 8 (lihat lib/api/classApi.ts).
// staleTime pendek karena data ini "ringkasan real-time" dashboard pengajar.

import { fetchClassSummary } from "@/lib/api/classApi";
import { useQuery } from "@tanstack/react-query";

export function useClassSummaryQuery() {
  return useQuery({
    queryKey: ["class-summary"],
    queryFn: fetchClassSummary,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });
}
