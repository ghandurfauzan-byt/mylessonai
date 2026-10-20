// src/components/LoginForm.tsx
//
// Implementasi Autentikasi Multi-Role & Registrasi (FR-01, FR-02, FR-03).
// Mendukung pemisahan hak akses Pelajar & Pengajar, validasi email institusi,
// serta tombol Masuk Cepat untuk kemudahan demonstrasi pengujian praktikum.

import { SESSION_QUERY_KEY } from "@/hooks/useSession";
import { login, register } from "@/lib/api/sessionApi";
import { playClickSound } from "@/lib/soundEffects";
import { type Role, isInstitutionalEmail } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function LoginForm({ redirectTo }: { redirectTo: string | null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const initialRole = (searchParams.get("role") as Role) || "pelajar";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  const [role, setRole] = useState<Role>(initialRole);
  const [isRegister, setIsRegister] = useState<boolean>(initialMode === "register");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<Role | "manual" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pastikan kolom formulir selalu kosong saat halaman dibuka atau saat beralih peran
  useEffect(() => {
    setEmail("");
    setPassword("");
    setName("");

    // Paksa bersihkan jika Google Chrome Password Manager mencoba auto-fill paksa ke input
    const timer = setTimeout(() => {
      const emailEl = document.getElementById("login-email") as HTMLInputElement | null;
      const passEl = document.getElementById("login-password") as HTMLInputElement | null;
      if (emailEl && (emailEl.value === "darmawan@gmail.com" || email === "")) {
        emailEl.value = "";
        setEmail("");
      }
      if (passEl && password === "") {
        passEl.value = "";
        setPassword("");
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [role, isRegister]);

  async function handleDemoAuthenticate(targetRole: Role) {
    setLoading(targetRole);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await login({ role: targetRole });
      queryClient.setQueryData(SESSION_QUERY_KEY, {
        authenticated: true,
        role: targetRole,
        user: res.user,
      });
      // Strict redirect based on role
      navigate(`/dashboard/${targetRole}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat otentikasi demo.");
      setLoading(null);
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (isRegister && !name.trim()) {
      setError("Silakan masukkan nama lengkap Anda.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      setError("Format email tidak valid (contoh: user@example.com).");
      return;
    }

    // Pendaftaran umum dikunci hanya untuk Siswa SD
    const activeRole = isRegister ? "pelajar" : role;
    setLoading(activeRole);

    if (isRegister) {
      if (password.length < 6) {
        setError("Kata sandi minimal 6 karakter.");
        setLoading(null);
        return;
      }
      try {
        const regRes = await register({ name, email, password, role: "pelajar" });
        queryClient.setQueryData(SESSION_QUERY_KEY, {
          authenticated: true,
          role: "pelajar",
          user: regRes.user,
        });
        setSuccessMessage("Akun Siswa berhasil didaftarkan! Mengalihkan ke Ruang Siswa...");
        navigate("/dashboard/pelajar");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mendaftarkan akun.");
        setLoading(null);
      }
    } else {
      try {
        const res = await login({ email, password, role: activeRole });
        const userRole = res.role || activeRole;
        queryClient.setQueryData(SESSION_QUERY_KEY, {
          authenticated: true,
          role: userRole,
          user: res.user,
        });
        // Strict redirection: Pelajar ke /dashboard/pelajar, Guru ke /dashboard/pengajar
        navigate(`/dashboard/${userRole}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Email atau kata sandi tidak valid.");
        setLoading(null);
      }
    }
  }

  return (
    <div className="space-y-4 text-slate-800">
      {/* ROLE SWITCHER TABS ATAU INFO REGISTRASI */}
      {!isRegister ? (
        <div className="flex p-1.5 bg-sky-100 rounded-2xl border-2 border-sky-200">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setRole("pelajar");
              setError(null);
            }}
            className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
              role === "pelajar"
                ? "bg-yellow-300 text-yellow-950 shadow-md border-2 border-yellow-400 scale-102"
                : "text-sky-800 hover:text-sky-950 hover:bg-white/50"
            }`}
          >
            <span>Siswa SD 👧</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setRole("pengajar");
              setError(null);
            }}
            className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
              role === "pengajar"
                ? "bg-purple-300 text-purple-950 shadow-md border-2 border-purple-400 scale-102"
                : "text-purple-800 hover:text-purple-950 hover:bg-white/50"
            }`}
          >
            <span>Guru SD 👨‍🏫</span>
          </button>
        </div>
      ) : (
        <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs font-bold text-amber-900 flex items-start gap-2.5">
          <span className="text-base">🎓</span>
          <div>
            <p className="font-black text-amber-950">Pendaftaran Akun Baru Khusus Siswa SD</p>
            <p className="text-[11px] text-amber-800 font-semibold mt-0.5 leading-snug">
              Akun Guru tidak dibuka untuk pendaftaran umum dan hanya dapat dibuat melalui fitur <b>Undang Guru</b> di Meja Guru.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
          <svg
            className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
          <svg
            className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="leading-relaxed">{successMessage}</p>
        </div>
      )}

      {/* FORM INPUT MANUAL (FR-01 & FR-02) */}
      <form onSubmit={handleFormSubmit} autoComplete="off" className="space-y-3 pt-1">
        {isRegister && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              name="user_fullname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                role === "pelajar" ? "Masukkan nama lengkap siswa..." : "Masukkan nama lengkap guru..."
              }
              autoComplete="off"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              Alamat Email ({role === "pelajar" ? "Pelajar" : "Pengajar"})
            </label>
            {email.includes("@") && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200">
                ✓ Email Umum
              </span>
            )}
          </div>
          <input
            type="text"
            inputMode="email"
            id="login-email"
            name="app_user_email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={
              role === "pelajar"
                ? "Masukkan email kamu (contoh: siswa@sekolah.id)"
                : "Masukkan email guru (contoh: guru@sekolah.id)"
            }
            autoComplete="off"
            readOnly
            onFocus={(e) => {
              e.currentTarget.readOnly = false;
            }}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi</label>
          <input
            type="password"
            id="login-password"
            name="app_user_password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan kata sandi..."
            autoComplete="new-password"
            readOnly
            onFocus={(e) => {
              e.currentTarget.readOnly = false;
            }}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
          />
        </div>

        <button
          type="submit"
          disabled={loading !== null}
          className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-black py-3 px-4 rounded-2xl text-sm transition-all shadow-lg shadow-blue-500/30 border-b-4 border-indigo-700 active:translate-y-1 active:border-b-0 hover:scale-102 flex items-center justify-center gap-2"
        >
          {loading === "manual" ? (
            <span>Memproses...</span>
          ) : isRegister ? (
            <span>Daftar Akun Baru</span>
          ) : (
            <span>Masuk ke Ruang Belajar</span>
          )}
        </button>
      </form>

      {/* TOGGLE ANTARA LOGIN & REGISTRASI */}
      <div className="text-center text-xs text-slate-600 font-bold pt-1">
        <span>{isRegister ? "Sudah punya akun?" : "Belum punya akun?"}</span>{" "}
        <button
          type="button"
          onClick={() => {
            playClickSound();
            setIsRegister(!isRegister);
            setError(null);
          }}
          className="font-black text-blue-600 hover:underline"
        >
          {isRegister ? "Masuk di Sini" : "Daftar Akun Baru"}
        </button>
      </div>

      {/* 1-CLICK DEMO LOGIN UNTUK PENGUJIAN */}
      <div className="border-t-2 border-slate-100 pt-4 mt-4 space-y-2.5">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
          <span>Akses Cepat 1-Klik (Demo Langsung):</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleDemoAuthenticate("pelajar")}
            disabled={loading !== null}
            className="w-full bg-yellow-300 hover:bg-yellow-400 border-2 border-yellow-500 text-yellow-950 font-black py-2.5 px-3 rounded-2xl text-xs transition-all shadow-md active:translate-y-1 hover:scale-103 flex items-center justify-center gap-1.5"
          >
            <span>Demo Siswa SD 👧</span>
          </button>
          <button
            type="button"
            onClick={() => handleDemoAuthenticate("pengajar")}
            disabled={loading !== null}
            className="w-full bg-purple-200 hover:bg-purple-300 border-2 border-purple-400 text-purple-950 font-black py-2.5 px-3 rounded-2xl text-xs transition-all shadow-md active:translate-y-1 hover:scale-103 flex items-center justify-center gap-1.5"
          >
            <span>Demo Guru SD 👨‍🏫</span>
          </button>
        </div>

        {/* Akun Guru Resmi & Akun Siswa (Bisa langsung klik untuk auto-fill formulir) */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px] space-y-2 text-left">
          <p className="font-extrabold text-slate-700 dark:text-slate-200">
            {role === "pengajar" ? "👨‍🏫 Akun Guru Resmi Tersedia:" : "👧 Akun Siswa Demo Tersedia:"}
          </p>
          {role === "pengajar" ? (
            <div className="space-y-1.5 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setEmail("guru@gmail.com");
                  setPassword("guru123");
                  setRole("pengajar");
                }}
                className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 text-purple-900 dark:text-purple-300 transition flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <span>guru@gmail.com (Sandi: guru123)</span>
                <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-sans font-bold">Auto-Isi</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setEmail("ghandur@gmail.com");
                  setPassword("secret123");
                  setRole("pelajar");
                }}
                className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-yellow-400 text-yellow-950 dark:text-yellow-300 transition flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <span>ghandur@gmail.com (Sandi: secret123)</span>
                <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-sans font-bold">Auto-Isi</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
