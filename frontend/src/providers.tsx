// src/providers.tsx
//
// Padanan app/providers.tsx pada Tugas 7. Pada Next.js App Router, file ini
// WAJIB "use client" karena Root Layout-nya sendiri adalah Server Component.
// Pada Vite SPA, SELURUH pohon komponen sudah berjalan di klien sejak awal
// (tidak ada RSC), sehingga direktif "use client" tidak lagi relevan — namun
// tanggung jawab komponen ini (wiring QueryClientProvider & ThemeSync) TETAP
// SAMA PERSIS.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { useUIStore } from "./lib/store/useUIStore";

function ThemeSync() {
  const themeMode = useUIStore((s) => s.themeMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", themeMode === "dark");
  }, [themeMode]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      {children}
    </QueryClientProvider>
  );
}
