// src/hooks/useSession.ts
//
// Entitas Server State: Sesi Login. staleTime 0 secara sengaja — status
// login/logout harus selalu diverifikasi ulang ke server saat <ProtectedRoute>
// dievaluasi (bukan dipercaya dari cache lama), karena ini adalah gerbang
// keamanan, bukan sekadar data tampilan.

import { fetchSession } from "@/lib/api/sessionApi";
import { useQuery } from "@tanstack/react-query";

export const SESSION_QUERY_KEY = ["session"] as const;

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 0,
    refetchOnWindowFocus: false,
  });
}
