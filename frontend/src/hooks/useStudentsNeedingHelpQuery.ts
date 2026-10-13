// src/hooks/useStudentsNeedingHelpQuery.ts — BARU pada Tugas 8.

import { fetchStudentsNeedingHelp } from "@/lib/api/classApi";
import { useQuery } from "@tanstack/react-query";

export function useStudentsNeedingHelpQuery() {
  return useQuery({
    queryKey: ["students-needing-help"],
    queryFn: fetchStudentsNeedingHelp,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
  });
}
