// src/hooks/useMaterialsQuery.ts — tidak berubah dari Tugas 7.

import { createMaterial, fetchMaterials } from "@/lib/api/materialsApi";
import type { CreateMaterialInput } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const MATERIALS_QUERY_KEY = ["materials"] as const;

export function useMaterialsQuery() {
  return useQuery({
    queryKey: MATERIALS_QUERY_KEY,
    queryFn: fetchMaterials,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

export function useCreateMaterialMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMaterialInput) => createMaterial(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
    },
  });
}
