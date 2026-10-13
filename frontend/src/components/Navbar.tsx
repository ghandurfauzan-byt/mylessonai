import NotificationCenter from "@/components/NotificationCenter";
import { SESSION_QUERY_KEY } from "@/hooks/useSession";
import { logout } from "@/lib/api/sessionApi";
import { useUIStore } from "@/lib/store/useUIStore";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar({ role }: { role: "pelajar" | "pengajar" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isTeacher = role === "pengajar";

  const themeMode = useUIStore((s) => s.themeMode);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const openProfileModal = useUIStore((s) => s.openProfileModal);

  async function handleLogout() {
    await logout();
    await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    navigate("/login");
  }

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Institution Info */}
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="flex items-center space-x-2.5 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-0.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1px] shadow-sm shadow-blue-500/20 group-hover:shadow-blue-500/40 transition">
              <div className="w-full h-full bg-white dark:bg-slate-800 rounded-[11px] flex items-center justify-center">
                <svg
                  className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Logo ExplainMyLesson</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition block leading-tight">
                  ExplainMyLesson
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                  EdTech AI
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                Platform Pembelajaran Adaptif
              </span>
            </div>
          </Link>

          <span
            className={`hidden sm:inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              isTeacher
                ? "bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                : "bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-800"
            }`}
          >
            {isTeacher ? "👨‍🏫 Guru SD" : "👧 Siswa SD"}
          </span>
        </div>

        {/* Navigation & Controls: Khusus Pelajar hanya tampil Ruang Siswa, Khusus Guru Meja Guru */}
        <nav className="flex items-center space-x-2 sm:space-x-2.5">
          {!isTeacher ? (
            <Link
              to="/dashboard/pelajar"
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                location.pathname.startsWith("/dashboard/pelajar")
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Ruang Siswa 👧
            </Link>
          ) : (
            <Link
              to="/dashboard/pengajar"
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                location.pathname.startsWith("/dashboard/pengajar")
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Meja Guru 👨‍🏫
            </Link>
          )}

          {/* Pusat Notifikasi Rekomendasi (FR-20) - Hanya tampil di Halaman Siswa */}
          {location.pathname.startsWith("/dashboard/pelajar") && (
            <NotificationCenter role="pelajar" />
          )}

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ganti tema"
            title={themeMode === "light" ? "Ganti ke Mode Gelap" : "Ganti ke Mode Terang"}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
          >
            {themeMode === "light" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <title>Tema Gelap</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <title>Tema Terang</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            )}
          </button>

          {/* Profile Modal Trigger (FR-22) */}
          <button
            type="button"
            onClick={openProfileModal}
            aria-label="Lihat dan edit profil pengguna"
            title="Klik untuk melihat profil saya"
            className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 hover:scale-105 transition active:scale-95 ${
              isTeacher
                ? "bg-purple-600 ring-purple-100 dark:ring-purple-900"
                : "bg-blue-600 ring-blue-100 dark:ring-blue-900"
            }`}
          >
            {isTeacher ? "DS" : "PL"}
          </button>

          {/* Logout (FR-03) */}
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-xl transition shadow-2xs"
          >
            Keluar
          </button>
        </nav>
      </div>
    </header>
  );
}
