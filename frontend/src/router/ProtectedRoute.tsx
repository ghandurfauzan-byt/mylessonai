// src/router/ProtectedRoute.tsx
//
// Padanan middleware.ts (Route Guard /dashboard/:path*) pada Tugas 7. Karena
// Vite tidak punya Edge Middleware, proteksi dipindah ke sini: sebuah wrapper
// route yang memverifikasi sesi (GET /api/session, httpOnly cookie tidak bisa
// dibaca langsung oleh JS klien) SEBELUM merender <Outlet /> (rute privat).
// Jika belum terautentikasi, redirect ke /login?auth_error=1&redirect=...,
// SAMA PERSIS dengan query string yang dulu disusun middleware.ts.

import { useSession } from "@/hooks/useSession";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const location = useLocation();
  const { data, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
        Memeriksa sesi…
      </div>
    );
  }

  if (!data?.authenticated) {
    const params = new URLSearchParams();
    params.set("auth_error", "1");
    params.set("redirect", location.pathname);
    return <Navigate to={`/login?${params.toString()}`} replace />;
  }

  // Proteksi Akses Ketat: Siswa dilarang keras membuka rute Meja Guru
  if (data.role === "pelajar" && location.pathname.startsWith("/dashboard/pengajar")) {
    return <Navigate to="/dashboard/pelajar" replace />;
  }

  return <Outlet />;
}
