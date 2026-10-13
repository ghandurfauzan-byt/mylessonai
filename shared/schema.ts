// shared/schema.ts
//
// Skema validasi Zod BERSAMA — dipakai baik oleh Client (src/, Vite bundle)
// maupun Server (server/, Express + Node). Pada arsitektur Next.js App Router
// (Tugas 6-7) file ini bernama lib/schema.ts dan "ikut jalan" di kedua sisi
// karena Next.js men-transpile app/ & lib/ dalam satu proses build yang sama.
//
// Pada arsitektur Vite + Express (Tugas 8) TIDAK ADA proses build tunggal
// yang otomatis menggabungkan client & server, sehingga file ini dipindahkan
// ke folder shared/ di root proyek dan di-alias dari KEDUA sisi:
//   - vite.config.ts   -> alias "@shared" -> "./shared" (dibundel Esbuild/Rolldown
//                         ke dalam chunk klien)
//   - server/tsconfig  -> path relatif "../shared/schema" (dieksekusi langsung
//                         oleh Node lewat tsx/esbuild-register, TIDAK di-bundle)
//
// "Never trust the client" tetap berlaku: Route Handler Express di
// server/index.ts memvalidasi ULANG body request dengan skema yang SAMA
// PERSIS dipakai UploadModal.tsx untuk validasi UX instan di klien.

import { z } from "zod";

export const MaterialUploadSchema = z.object({
  title: z.string().trim().min(5, "Judul minimal 5 karakter."),
  fileName: z
    .string()
    .toLowerCase()
    .refine((name) => name.endsWith(".pdf"), "Format file harus PDF."),
  chapter: z.string().optional(),
});

export type MaterialUploadInput = z.infer<typeof MaterialUploadSchema>;

export const QuizAnswerSchema = z.object({
  level: z.number().int().min(1).max(3),
  questionId: z.string(),
  selectedOption: z.number().int().min(0),
});

export type QuizAnswerInput = z.infer<typeof QuizAnswerSchema>;

// --- Skema RUNTIME VALIDATION untuk data yang mengalir lewat TanStack ------
// Query (Server State). Pada Tugas 8, SEMUA entitas server (termasuk yang
// dulunya dibaca langsung oleh Server Component: ClassSummary, ChapterProgress,
// StudentsNeedingHelp, AiContent) kini lewat HTTP fetch + validasi Zod di sini,
// karena Vite adalah SPA murni tanpa RSC (lihat README.md, bagian Migrasi).

// Entitas: Soal Kuis (GET /api/quiz?level=) ---------------------------------
export const QuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  options: z.array(z.string()).min(2, "Soal minimal punya 2 opsi jawaban"),
  correctOption: z.number().int().min(0),
  hint: z.string(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const QuizQuestionsResponseSchema = z.object({
  level: z.number().int(),
  questions: z.array(QuestionSchema),
});
export type QuizQuestionsResponse = z.infer<typeof QuizQuestionsResponseSchema>;

// Entitas: Materi/Modul ter-upload (GET/POST /api/materials) ----------------
export const MaterialSchema = z.object({
  id: z.string(),
  title: z.string().min(5),
  fileName: z.string(),
  variant: z.enum(["private", "public"]),
  chapter: z.string().optional(),
  indexedAt: z.string(),
});
export type Material = z.infer<typeof MaterialSchema>;

export const MaterialsResponseSchema = z.array(MaterialSchema);

export const CreateMaterialSchema = MaterialUploadSchema.extend({
  variant: z.enum(["private", "public"]),
});
export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>;

// Entitas: Ringkasan Kelas (GET /api/class-summary) --------------------------
export const ClassSummarySchema = z.object({
  totalStudents: z.number().int(),
  averageComprehension: z.number(),
  activeModules: z.number().int(),
  studentsNeedingIntervention: z.number().int(),
  modulesNote: z.string().optional(),
});
export type ClassSummary = z.infer<typeof ClassSummarySchema>;

// Entitas: Progres per Bab (GET /api/chapter-progress) ----------------------
export const ChapterProgressSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  percent: z.number(),
  tone: z.enum(["high", "good", "warning"]),
});
export type ChapterProgress = z.infer<typeof ChapterProgressSchema>;
export const ChapterProgressResponseSchema = z.array(ChapterProgressSchema);

// Entitas: Pelajar Perlu Bimbingan (GET /api/students-needing-help) ---------
export const StudentHelpSchema = z.object({
  id: z.string(),
  name: z.string(),
  chapter: z.string(),
  score: z.number().int(),
  outOf: z.number().int(),
});
export type StudentHelp = z.infer<typeof StudentHelpSchema>;
export const StudentsNeedingHelpResponseSchema = z.array(StudentHelpSchema);

// Entitas: Konten AI (GET /api/ai-content?chapter=&mode=) -------------------
export const AiContentSchema = z.object({
  title: z.string(),
  body: z.array(z.string()),
});
export type AiContent = z.infer<typeof AiContentSchema>;

// Entitas: Sesi Login (GET /api/session, POST /api/login) -------------------
export const RoleSchema = z.enum(["pelajar", "pengajar"]);
export type Role = z.infer<typeof RoleSchema>;

export const SessionResponseSchema = z.object({
  authenticated: z.boolean(),
  role: RoleSchema.optional(),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

// Entitas: Registrasi Akun Pengguna (POST /api/register - FR-01) -------------
export const RegisterInputSchema = z.object({
  name: z.string().trim().min(2, "Nama lengkap minimal 2 karakter."),
  email: z.string().trim().email("Format alamat email tidak valid."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
  role: RoleSchema,
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

/**
 * Helper untuk verifikasi domain email institusi (FR-01, SKPL).
 * Mendeteksi akun kampus seperti *.ac.id, *.edu, student.uns.ac.id, staff.uns.ac.id.
 */
export function isInstitutionalEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return (
    domain.endsWith(".ac.id") ||
    domain.endsWith(".edu") ||
    domain === "student.uns.ac.id" ||
    domain === "staff.uns.ac.id"
  );
}

export const StudentWeaknessSchema = z.object({
  chapterId: z.string(),
  chapterName: z.string(),
  subject: z.string(),
  score: z.number(),
  outOf: z.number(),
  status: z.enum(["remedial", "tuntas"]),
  message: z.string(),
});
export type StudentWeakness = z.infer<typeof StudentWeaknessSchema>;

// Entitas: Profil Pengguna (GET/PUT /api/profile - FR-22) -------------------
export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  role: RoleSchema,
  nimNip: z.string().optional(),
  institution: z.string().optional(),
  points: z.number().optional(),
  weakness: StudentWeaknessSchema.optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UpdateProfileInputSchema = z.object({
  name: z.string().trim().min(2, "Nama lengkap minimal 2 karakter."),
  email: z.string().trim().email("Format email tidak valid."),
  nimNip: z.string().trim().optional(),
  institution: z.string().trim().optional(),
  password: z.string().min(6, "Kata sandi baru minimal 6 karakter.").optional().or(z.literal("")),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

// Entitas: Manajemen Kelas Pengajar (GET/POST/DELETE /api/classes - FR-21) ---
export const ClassRoomSchema = z.object({
  id: z.string(),
  name: z.string().min(3),
  code: z.string().min(2),
  semester: z.string(),
  academicYear: z.string(),
  studentCount: z.number().int(),
  modulesCount: z.number().int(),
});
export type ClassRoom = z.infer<typeof ClassRoomSchema>;
export const ClassRoomListResponseSchema = z.array(ClassRoomSchema);

export const CreateClassRoomSchema = z.object({
  name: z.string().trim().min(3, "Nama kelas/mata kuliah minimal 3 karakter."),
  code: z.string().trim().min(2, "Kode kelas minimal 2 karakter."),
  semester: z.string().trim().default("Ganjil"),
  academicYear: z.string().trim().default("2025/2026"),
});
export type CreateClassRoomInput = z.infer<typeof CreateClassRoomSchema>;

// Entitas: Notifikasi Rekomendasi Adaptif (GET /api/notifications - FR-20) ---
export const NotificationItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(["warning", "info", "success"]),
  link: z.string(),
  isRead: z.boolean(),
  createdAt: z.string(),
  targetRole: z.enum(["pelajar", "pengajar", "all"]).optional(),
  icon: z.string().optional(),
});
export type NotificationItem = z.infer<typeof NotificationItemSchema>;
export const NotificationListResponseSchema = z.array(NotificationItemSchema);
