// server/session.ts
//
// Helper autentikasi sederhana berbasis cookie httpOnly, dikonsumsi oleh
// server/index.ts (Route Handler login/logout/session, pengganti
// middleware.ts Next.js). Cocok untuk lingkungan praktikum — bukan
// implementasi produksi.

export const SESSION_COOKIE = "uns_session";
export const USER_ID_COOKIE = "uns_user_id";

export type Role = "pelajar" | "pengajar";

export function isValidRole(value: string | undefined): value is Role {
  return value === "pelajar" || value === "pengajar";
}
