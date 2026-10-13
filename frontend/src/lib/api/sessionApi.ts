// src/lib/api/sessionApi.ts
//
// Lapisan akses REST API sisi klien untuk sesi login. GET /api/session adalah
// pengganti middleware.ts: dipanggil oleh <ProtectedRoute> setiap kali rute
// /dashboard/* dikunjungi, karena SPA tidak punya cara mencegat request di
// server sebelum HTML dikirim (hanya ada satu index.html untuk semua rute).

import {
  type RegisterInput,
  type Role,
  type SessionResponse,
  SessionResponseSchema,
  type UpdateProfileInput,
  type UserProfile,
  UserProfileSchema,
} from "@shared/schema";

export async function fetchLandingStats(): Promise<{
  success: boolean;
  data: {
    total_modules: number;
    total_students: number;
    average_satisfaction: number;
    total_coins_rewarded: number;
  };
}> {
  const response = await fetch("/api/v1/landing/stats");
  return response.json();
}

export async function fetchSession(): Promise<SessionResponse> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch("/api/v1/auth/session", {
    credentials: "same-origin",
    headers,
  });
  const rawData = await response.json().catch(() => null);
  if (rawData?.success && rawData?.data) {
    return SessionResponseSchema.parse(rawData.data);
  }
  return SessionResponseSchema.parse(rawData);
}

export type LoginPayload = { role: Role } | { email: string; password: string; role?: Role };

export async function login(
  payload: LoginPayload
): Promise<{ ok: true; role: Role; user?: UserProfile }> {
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
  });
  const resData = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      resData?.message ??
        resData?.error ??
        "Gagal masuk. Periksa kembali email dan kata sandi Anda."
    );
  }
  if (resData?.data?.token && typeof window !== "undefined") {
    localStorage.setItem("auth_token", resData.data.token);
  }
  return {
    ok: true,
    role: resData.data?.role ?? resData.role,
    user: resData.data?.user ?? resData.user,
  };
}

export async function register(data: RegisterInput): Promise<{ ok: true; user: UserProfile }> {
  const response = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "same-origin",
  });
  const resData = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(resData?.message ?? resData?.error ?? "Gagal mendaftarkan akun.");
  }
  if (resData?.data?.token && typeof window !== "undefined") {
    localStorage.setItem("auth_token", resData.data.token);
  }
  return {
    ok: true,
    user: resData.data?.user ?? resData.user,
  };
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
  await fetch("/api/v1/auth/logout", { method: "POST", credentials: "same-origin" });
}

export async function fetchProfile(): Promise<UserProfile> {
  const response = await fetch("/api/profile", { credentials: "same-origin" });
  const rawData = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error("Gagal memuat profil pengguna.");
  }
  return UserProfileSchema.parse(rawData);
}

export async function updateProfile(data: UpdateProfileInput): Promise<UserProfile> {
  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "same-origin",
  });
  const rawData = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(rawData?.error ?? "Gagal memperbarui profil.");
  }
  return UserProfileSchema.parse(rawData);
}
