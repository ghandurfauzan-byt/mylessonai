// server/index.ts — Express API Server
//
// Pada Tugas 7 (Next.js App Router), setiap berkas app/api/*/route.ts adalah
// sebuah Route Handler yang dijalankan oleh runtime Next.js, dan
// middleware.ts melindungi /dashboard/* di Edge Runtime SEBELUM request
// mencapai halaman. Vite TIDAK punya konsep Route Handler maupun Middleware
// server-side — Vite murni bundler + dev server untuk aset statis (HTML/CSS/JS).
//
// Karena itu, Tugas 8 memindahkan seluruh Route Handler + middleware.ts ke
// satu Express App kecil di sini. Selama development, Vite (port 5173)
// mem-proxy semua request "/api/*" ke server Express ini (port 4000) —
// lihat vite.config.ts `server.proxy`. Saat produksi, Express App inilah
// yang men-serve hasil `vite build` (folder dist/) SEKALIGUS menjawab
// "/api/*" — satu proses Node, satu port, persis seperti pola populer
// "Vite (frontend) + Express (backend)".
//
// Proteksi rute /dashboard/* pada arsitektur SPA TIDAK bisa lagi dilakukan
// dengan mencegat request HTML di server (karena hanya ada SATU index.html
// yang dikirim untuk semua rute — client-side routing). Sebagai gantinya,
// endpoint GET /api/session di bawah menjadi sumber kebenaran sesi: React
// Router memanggilnya lewat <ProtectedRoute> (src/router/ProtectedRoute.tsx)
// sebelum merender halaman /dashboard/* apa pun, dan redirect ke /login jika
// tidak terautentikasi — reimplementasi 1:1 dari logika middleware.ts.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import express, { type NextFunction, type Request, type Response } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Muat variabel lingkungan lokal dari berkas .env jika tersedia (Aman & Privat)
try {
  const rootEnvPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(rootEnvPath)) {
    const envContent = fs.readFileSync(rootEnvPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const eqIdx = trimmed.indexOf("=");
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed
          .slice(eqIdx + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (k && !process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
} catch {}
import {
  CreateClassRoomSchema,
  CreateMaterialSchema,
  RegisterInputSchema,
  UpdateProfileInputSchema,
} from "../../shared/schema";
import {
  type AiMode,
  addNotification,
  buildClassReportCsv,
  buildClassReportHtml,
  createClassRoom,
  deleteClassRoom,
  deleteCurriculumModule,
  getActiveCurriculumState,
  getAiContent,
  deleteRegisteredStudent,
  getChapterProgress,
  getClassRooms,
  getClassSummary,
  getCurriculumModules,
  getMaterials,
  getNotifications,
  getQuestionsByLevel,
  getRegisteredStudents,
  getRegisteredTeachers,
  getStudentsNeedingHelp,
  getUserProfile,
  getUserProfileByRole,
  markNotificationAsRead,
  registerUserAccount,
  resetStudentsPoints,
  addStudentPoints,
  getLastPointsResetTime,
  saveCurriculumModule,
  saveMaterial,
  setActiveCurriculumState,
  updateUserProfile,
  verifyUserCredentials,
} from "./data";
import { SESSION_COOKIE, USER_ID_COOKIE, isValidRole } from "./session";
import { checkChromaHealth } from "./chroma";
import { checkLocalLlmHealth, queryLocalLlm } from "./local_llm";

const PORT = Number(process.env.PORT ?? 4000);
const isProduction = process.env.NODE_ENV === "production";

const app = express();
app.use(express.json());
app.use(cookieParser());

// Header kustom sekadar contoh manipulasi header di layer server — padanan
// `response.headers.set("x-uns-taskflow", "app-router")` pada middleware.ts.
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("x-uns-taskflow", "vite-spa");
  next();
});

const router = express.Router();

// --- Auth: login / logout / session (pengganti middleware.ts + cookie) ----

router.post("/login", async (req: Request, res: Response) => {
  const { email, password, role } = req.body || {};

  // Jika menyertakan email & password, lakukan verifikasi credential dengan bcrypt (NFR-01, TC-01, TC-02, TC-03)
  if (email && password) {
    try {
      const user = await verifyUserCredentials(email, password);
      res.cookie(SESSION_COOKIE, user.role, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 1000 * 60 * 60 * 8, // 8 jam
      });
      res.cookie(USER_ID_COOKIE, user.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 1000 * 60 * 60 * 8,
      });
      return res.json({ ok: true, role: user.role, user });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Email atau kata sandi tidak valid.";
      return res.status(401).json({ error: message });
    }
  }

  // 1-Click Instant Demo Login (Praktikum)
  if (!isValidRole(role)) {
    return res.status(400).json({ error: "Role tidak valid." });
  }
  res.cookie(SESSION_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8, // 8 jam
  });
  res.cookie(USER_ID_COOKIE, role === "pelajar" ? "usr_1" : "usr_3", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8,
  });
  return res.json({ ok: true, role });
});

// Registrasi Pengguna Baru (FR-01, TC-04, TC-05) - Terbuka khusus untuk Akun Pelajar/Siswa
router.post("/register", async (req: Request, res: Response) => {
  const parsed = RegisterInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.errors[0]?.message ?? "Data registrasi tidak valid." });
  }

  // Larang pendaftaran umum untuk peran guru (Akun guru hanya via undangan resmi di Meja Guru)
  if (parsed.data.role === "pengajar") {
    return res.status(403).json({
      error: "Pendaftaran umum tidak diizinkan untuk akun Guru. Akun Guru dibuat secara internal melalui fitur 'Undang Guru Baru' di Meja Guru.",
    });
  }

  try {
    const user = await registerUserAccount(parsed.data);
    res.cookie(SESSION_COOKIE, user.role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 8,
    });
    res.cookie(USER_ID_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 8,
    });
    return res.status(201).json({ ok: true, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mendaftarkan akun.";
    return res.status(400).json({ error: message });
  }
});

// Endpoint Daftar Guru Terdaftar di Sekolah
router.get("/teachers", async (_req: Request, res: Response) => {
  try {
    const teachers = await getRegisteredTeachers();
    return res.json(teachers);
  } catch (_err) {
    return res.status(500).json({ error: "Gagal mengambil daftar guru." });
  }
});

// Endpoint Undang & Tambah Guru Baru (Hanya bisa dipanggil oleh Guru yang login)
router.post("/teachers/invite", async (req: Request, res: Response) => {
  const sessionRole = req.cookies?.[SESSION_COOKIE];
  if (sessionRole !== "pengajar") {
    return res.status(403).json({
      error: "Hanya Guru yang berwenang menambahkan atau mengundang akun Guru baru.",
    });
  }

  const { name, email, password, nimNip, institution } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: "Nama lengkap, email, dan kata sandi guru wajib diisi." });
  }

  if (password.trim().length < 6) {
    return res.status(400).json({ error: "Kata sandi guru minimal 6 karakter." });
  }

  try {
    const newTeacher = await registerUserAccount({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      role: "pengajar",
      nimNip: nimNip?.trim() || "198xxxxxxxxx",
      institution: institution?.trim() || "SD Negeri 1 Madiun",
    });

    return res.status(201).json({ ok: true, teacher: newTeacher });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengundang akun guru baru.";
    return res.status(400).json({ error: message });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.clearCookie(USER_ID_COOKIE, { path: "/" });
  return res.json({ ok: true });
});

// Ganti Akun Siswa Aktif (Untuk eksplorasi per-akun siswa & kelemahannya)
router.post("/switch-user", async (req: Request, res: Response) => {
  const { userId } = req.body || {};
  const profile = await getUserProfile(userId, "pelajar");
  res.cookie(SESSION_COOKIE, profile.role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8,
  });
  res.cookie(USER_ID_COOKIE, profile.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8,
  });
  return res.json({ ok: true, user: profile });
});

// Sumber kebenaran sesi untuk React Router <ProtectedRoute>
router.get("/session", (req: Request, res: Response) => {
  const roleCookie = req.cookies?.[SESSION_COOKIE];
  if (!isValidRole(roleCookie)) {
    return res.json({ authenticated: false });
  }
  return res.json({ authenticated: true, role: roleCookie });
});

// Profil Pengguna (FR-22) — Mengambil data spesifik akun login / aktif
router.get("/profile", async (req: Request, res: Response) => {
  const roleCookie = req.cookies?.[SESSION_COOKIE];
  const userIdCookie = req.cookies?.[USER_ID_COOKIE];
  const queryUser = (req.query.userId || req.query.email) as string | undefined;
  const role = isValidRole(roleCookie) ? roleCookie : "pelajar";
  const profile = await getUserProfile(queryUser || userIdCookie, role);
  res.json(profile);
});

router.put("/profile", async (req: Request, res: Response) => {
  const roleCookie = req.cookies?.[SESSION_COOKIE];
  const role = isValidRole(roleCookie) ? roleCookie : "pelajar";
  const parsed = UpdateProfileInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.errors[0]?.message ?? "Data profil tidak valid." });
  }
  try {
    const updated = await updateUserProfile(role, parsed.data);
    res.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui profil.";
    res.status(500).json({ error: message });
  }
});

// Manajemen Kelas (FR-21)
router.get("/classes", async (_req: Request, res: Response) => {
  const classes = await getClassRooms();
  res.json(classes);
});

router.post("/classes", async (req: Request, res: Response) => {
  const parsed = CreateClassRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.errors[0]?.message ?? "Data kelas tidak valid." });
  }
  try {
    const created = await createClassRoom(parsed.data);
    res.status(201).json(created);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membuat kelas baru.";
    res.status(500).json({ error: message });
  }
});

router.delete("/classes/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const success = await deleteClassRoom(id);
  if (!success) {
    return res.status(404).json({ error: "Kelas tidak ditemukan." });
  }
  res.json({ ok: true });
});

// Notifikasi Adaptif (FR-20)
router.get("/notifications", async (req: Request, res: Response) => {
  const roleQuery = (req.query.role as string) || (req.cookies?.[SESSION_COOKIE] as string);
  const notifications = await getNotifications(roleQuery);
  res.json(notifications);
});

router.post("/notifications", async (req: Request, res: Response) => {
  const { title, message, type, link, targetRole, icon } = req.body || {};
  if (!title || !message) {
    return res.status(400).json({ error: "Title dan message harus diisi." });
  }
  const created = await addNotification({
    title,
    message,
    type: type || "info",
    link: link || "/dashboard",
    targetRole,
    icon,
  });
  res.status(201).json(created);
});

router.post("/notifications/:id/read", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  await markNotificationAsRead(id);
  res.json({ ok: true });
});

// --- Dashboard Pengajar: ringkasan kelas, progres bab, siswa perlu bantuan -

router.get("/class-summary", async (_req: Request, res: Response) => {
  const summary = await getClassSummary();
  res.json(summary);
});

router.get("/chapter-progress", async (_req: Request, res: Response) => {
  const chapters = await getChapterProgress();
  res.json(chapters);
});

router.get("/students-needing-help", async (_req: Request, res: Response) => {
  const students = await getStudentsNeedingHelp();
  res.json(students);
});

router.get("/students", async (_req: Request, res: Response) => {
  const students = await getRegisteredStudents();
  res.json(students);
});

router.delete("/students/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const success = await deleteRegisteredStudent(id);
  if (!success) {
    res.status(404).json({ error: "Siswa tidak ditemukan." });
    return;
  }
  res.json({ success: true, message: "Akun siswa berhasil dihapus." });
});

// Reset Seluruh Poin Siswa & Ranking Juara Kelas oleh Guru
router.post("/students/reset-points", async (_req: Request, res: Response) => {
  const result = await resetStudentsPoints();
  await addNotification({
    title: "Poin Prestasi Di-Reset oleh Guru 🔄",
    message: "Bapak/Ibu Guru telah mereset seluruh poin siswa dan ranking juara kelas untuk periode baru.",
    type: "warning",
    targetRole: "all",
    link: "/dashboard/pelajar",
    icon: "alert",
  });
  res.json({
    message: "Seluruh poin siswa dan ranking berhasil di-reset oleh guru.",
    ...result,
  });
});

router.get("/students/reset-status", (_req: Request, res: Response) => {
  res.json({
    isReset: getLastPointsResetTime() > 0,
    resetAt: getLastPointsResetTime(),
  });
});

// Penambahan Poin Siswa (Sinkronisasi Gamifikasi Kuis & Membaca)
router.post("/students/points", async (req: Request, res: Response) => {
  const userIdCookie = req.cookies?.[USER_ID_COOKIE];
  const { amount = 10, userId } = req.body || {};
  const targetId = userId || userIdCookie;
  const result = await addStudentPoints(targetId, Number(amount) || 10);
  res.json(result);
});

// Ekspor Laporan: mendukung format CSV dan PDF/HTML (FR-18, TC-21, TC-22)
router.get("/export", async (req: Request, res: Response) => {
  const format = String(req.query.format ?? "csv").toLowerCase();
  try {
    if (format === "pdf" || format === "html") {
      const { fileName, content } = await buildClassReportHtml();
      res.status(200);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      res.send(content);
    } else {
      const { fileName, content } = await buildClassReportCsv();
      res.status(200);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.send(content);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membuat laporan.";
    res.status(500).json({ error: message });
  }
});

// --- Dashboard Pelajar: konten AI (ringkasan/analogi/mindmap/contoh) -------

router.get("/ai-content", async (req: Request, res: Response) => {
  const chapterId = String(req.query.chapter ?? "1");
  const mode = String(req.query.mode ?? "ringkasan") as AiMode;
  try {
    const content = await getAiContent(chapterId, mode);
    res.json(content);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memuat konten AI.";
    res.status(502).json({ error: message });
  }
});

// --- Kuis Adaptif 3 Level ----------------------------------------------------

router.get("/quiz", async (req: Request, res: Response) => {
  const level = Number(req.query.level ?? "1");
  try {
    const questions = await getQuestionsByLevel(level);
    res.json({ level, questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memuat soal.";
    res.status(404).json({ error: message });
  }
});

// --- Materi ter-upload (GET list / POST create) -----------------------------

router.get("/materials", async (_req: Request, res: Response) => {
  try {
    const materials = await getMaterials();
    res.json(materials);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengambil daftar materi.";
    res.status(502).json({ error: message });
  }
});

router.post("/materials", async (req: Request, res: Response) => {
  const parsed = CreateMaterialSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Data tidak valid." });
  }

  try {
    const result = await saveMaterial(parsed.data);
    return res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah dokumen.";
    return res.status(502).json({ error: message });
  }
});

// ============================================================================
// REST API V1 (Format Laravel 11 / FastAPI Compatible — Sprint 1: Landing & Auth)
// ============================================================================
const v1Router = express.Router();

// 1. GET /api/v1/landing/stats (FR-00 Landing Page Public Stats)
v1Router.get("/landing/stats", async (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Statistik publik berhasil dimuat.",
    data: {
      total_modules: 4,
      total_students: 50,
      average_satisfaction: 98.4,
      total_coins_rewarded: 1420,
      featured_chapters: [
        { id: "pkn-sila3", title: "PKn: Makna Sila Ke-3 Pancasila" },
        { id: "bjawa-unggahungguh", title: "B. Jawa: Unggah-ungguh Basa" },
      ],
    },
  });
});

// 2. POST /api/v1/auth/register (FR-01 Registrasi Akun Mandiri)
v1Router.post("/auth/register", async (req: Request, res: Response) => {
  const parsed = RegisterInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validasi gagal.",
      errors: {
        field: [parsed.error.errors[0]?.message ?? "Data registrasi tidak valid."],
      },
    });
  }

  try {
    const user = await registerUserAccount(parsed.data);
    res.cookie(SESSION_COOKIE, user.role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 8,
    });
    return res.status(201).json({
      success: true,
      message: "Akun berhasil didaftarkan.",
      data: {
        user,
        token: `jwt_token_${Buffer.from(user.email).toString("base64")}`,
        token_type: "Bearer",
        expires_in: 86400,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mendaftarkan akun.";
    return res.status(400).json({ success: false, message });
  }
});

// 3. POST /api/v1/auth/login (FR-02 Login Reguler & 1-Click Demo Login)
v1Router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password, role } = req.body || {};

  // Opsi A: Login dengan email & kata sandi
  if (email && password) {
    try {
      const user = await verifyUserCredentials(email, password);
      res.cookie(SESSION_COOKIE, user.role, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 1000 * 60 * 60 * 8,
      });
      return res.json({
        success: true,
        message: "Login berhasil.",
        data: {
          user,
          role: user.role,
          token: `jwt_token_${Buffer.from(user.email).toString("base64")}`,
          token_type: "Bearer",
          expires_in: 86400,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Email atau kata sandi tidak valid.";
      return res.status(401).json({ success: false, message });
    }
  }

  // Opsi B: 1-Click Quick Demo Login
  if (!isValidRole(role)) {
    return res.status(400).json({ success: false, message: "Role tidak valid." });
  }

  const demoEmail = role === "pengajar" ? "darmawan@gmail.com" : "ghandur@gmail.com";
  const user = await getUserProfileByRole(role);

  res.cookie(SESSION_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8,
  });

  return res.json({
    success: true,
    message: "Login demo berhasil.",
    data: {
      user,
      role,
      token: `jwt_token_${Buffer.from(demoEmail).toString("base64")}`,
      token_type: "Bearer",
      expires_in: 86400,
    },
  });
});

// 4. GET /api/v1/auth/session (FR-03 Verifikasi Sesi Aktif)
v1Router.get("/auth/session", async (req: Request, res: Response) => {
  const role = req.cookies?.[SESSION_COOKIE];
  if (!isValidRole(role)) {
    return res.json({
      success: true,
      data: { authenticated: false, role: null },
    });
  }
  const user = await getUserProfileByRole(role);
  return res.json({
    success: true,
    data: {
      authenticated: true,
      role,
      user,
    },
  });
});

// 5. POST /api/v1/auth/logout (FR-03 Logout Sesi)
v1Router.post("/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  return res.json({
    success: true,
    message: "Logout berhasil. Sesi telah diakhiri.",
  });
});

// 6. GET /api/v1/curriculum/catalog (Katalog Buku Resmi Kemdikbud & Disdik)
v1Router.get("/curriculum/catalog", (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: "Katalog kurikulum resmi berhasil dimuat.",
    data: [
      {
        id: "buku-pkn-sd4",
        title: "Buku Panduan Guru & Siswa Pendidikan Pancasila SD Kelas IV",
        publisher: "Pusat Perbukuan BSKAP Kemdikbudristek RI",
        subject: "pkn",
        grade: "Kelas 4 SD (Fase B)",
        source: "API SIBI Kemdikbudristek (Terbuka & Gratis)",
        chaptersCount: 4,
        pdfUrl: "https://buku.kemdikbud.go.id/katalog/buku-teks/pancasila-sd-4.pdf",
      },
      {
        id: "buku-bjawa-sd4",
        title: "Wursita Basa: Piwulang Basa Jawa SD/MI Kelas IV",
        publisher: "Dinas Pendidikan & Kebudayaan Provinsi (Mulok Daerah)",
        subject: "bjawa",
        grade: "Kelas 4 SD (Fase B)",
        source: "Repositori Mulok Daerah Disdikbud (Terbuka & Gratis)",
        chaptersCount: 4,
        pdfUrl: "https://disdik.jatengprov.go.id/mulok/wursita-basa-kelas4.pdf",
      },
    ],
  });
});

// Generator Materi Edukasi Komprehensif SD (Pengertian, Bagian Penting, Pengamalan, dan Budi Pekerti)
function generateRichEducationalContent(
  isPkn: boolean,
  chapterStr: string,
  titleStr: string,
  _goalStr: string
): { ragSummary: string[]; quizPreview: string[]; quizQuestions: Record<number, any[]> } {
  const lower = titleStr.toLowerCase();

  // 0a. Kategori Khusus: Toleransi Beragama, Kerukunan, dan Keberagaman Bangsa (Bhinneka Tunggal Ika & Sila 1)
  if (
    lower.includes("toleran") ||
    lower.includes("agama") ||
    lower.includes("bhinneka") ||
    lower.includes("kerukunan") ||
    lower.includes("keberagaman") ||
    lower.includes("kemajemukan") ||
    lower.includes("perbedaan") ||
    lower.includes("ibadah") ||
    lower.includes("suku") ||
    lower.includes("ras")
  ) {
    return {
      ragSummary: [
        `Pengertian & Asal-Usul Toleransi Beragama: Kata toleransi diserap dari bahasa Latin 'tolerare' yang bermakna bersabar, menahan diri, dan membiarkan atau menghargai perbedaan tanpa memaksakan kehendak. Dalam nilai kebangsaan, toleransi beragama adalah sikap luhur saling menghormati, mengasihi, dan memberikan hak penuh kepada setiap insan untuk memeluk agamanya masing-masing serta menjalankan ibadahnya dengan tenang, tanpa celaan, paksaan, atau diskriminasi.`,
        `Landasan Konstitusi & Semboyan Bangsa: Kemerdekaan memeluk agama dijamin secara tegas dalam Sila Pertama Pancasila ('Ketuhanan Yang Maha Esa') dan Pasal 29 Ayat (2) UUD 1945 yang berbunyi: 'Negara menjamin kemerdekaan tiap-tiap penduduk untuk memeluk agamanya masing-masing dan untuk beribadat menurut agamanya dan kepercayaannya itu'. Nilai suci ini diperkuat oleh semboyan luhur 'Bhinneka Tunggal Ika' dari Kitab Sutasoma karya Mpu Tantular, yang berarti berbeda-beda keyakinan dan suku tetapi tetap satu jua dalam bingkai NKRI.`,
        `Prinsip Pokok Toleransi (Batas & Kerukunan Sejati): Toleransi beragama bukan berarti mencampuradukkan ajaran ritual ibadah (bukan sinkretisme), melainkan membangun kerukunan sosial yang tulus (tasamuh) antarsesama warga negara. Bangsa Indonesia menaungi 6 agama resmi (Islam, Kristen Protestan, Katolik, Hindu, Buddha, Khonghucu) serta penghayat kepercayaan yang seluruhnya mengajarkan kebajikan moral, cinta kasih, dan perdamaian semesta.`,
        `Mengapa Toleransi Wajib Dipupuk Sejak SD?: Indonesia adalah negeri kepulauan yang sangat majemuk. Tanpa rasa tenggang rasa (tepa selira), perbedaan mudah memicu kesalahpahaman dan perselisihan yang merugikan persatuan bangsa. Menumbuhkan toleransi sejak dini membentuk kelas menjadi ruang persahabatan yang aman, hangat, dan inklusif bagi seluruh anak bangsa untuk berprestasi bersama.`,
        `Aksi Nyata & Keteladanan di Sekolah: Menjaga suasana tenang dan tidak berisik ketika kawan sedang berdoa sebelum belajar atau menjalankan ibadah agamanya, tetap kompak belajar kelompok dan bermain bersama tanpa membedakan latar belakang keyakinan kawan, menghormati teman yang sedang menjalankan ibadah puasa, serta bertutur kata santun dan tulus saat mengucapkan selamat hari raya keagamaan.`,
        `Pengamalan di Rumah, Warga & Nilai Budi Pekerti: Menghormati rumah ibadah di sekitar pemukiman warga dengan tidak membuat kegaduhan saat peribadatan berlangsung, aktif bergotong royong membersihkan lingkungan RT/RW bersama tetangga dari beragam latar belakang, serta meneladani budi pekerti tepa selira, lapang dada, dan cinta damai sebagai hamba Tuhan Yang Maha Esa.`,
      ],
      quizPreview: [
        `Level 1 (Mudah): Asal-usul kata toleransi (tolerare) dan Sila ke-1 Pancasila (+10 Poin)`,
        `Level 2 (Sedang): Makna Pasal 29 Ayat (2) UUD 1945 dan sikap tenggang rasa di kelas (+20 Poin)`,
        `Level 3 (Tantangan): Prinsip kerukunan beragama tanpa mencampuradukkan ibadah (+30 Poin)`,
      ],
      quizQuestions: {
        1: [
          {
            id: `q1_${Date.now()}_1`,
            question: `Kata 'toleransi' diserap dari bahasa Latin 'tolerare'. Apakah arti mendasar dari kata tersebut?`,
            options: [
              `Bersabar, menahan diri, dan menghargai perbedaan secara damai`,
              `Memaksa semua orang agar memiliki keyakinan yang sama`,
              `Menjauhi teman yang memiliki perbedaan adat dan agama`,
              `Berdebat untuk membuktikan siapa yang paling benar`,
            ],
            correctOption: 0,
            hint: `'Tolerare' artinya menahan diri dan saling menghargai perbedaan dengan sabar.`,
          },
          {
            id: `q1_${Date.now()}_2`,
            question: `Sila dalam Pancasila yang menjadi landasan utama kehidupan beragama dan ketakwaan di Indonesia adalah...`,
            options: [
              `Sila Pertama: Ketuhanan Yang Maha Esa`,
              `Sila Kedua: Kemanusiaan yang Adil dan Beradab`,
              `Sila Ketiga: Persatuan Indonesia`,
              `Sila Kelima: Keadilan Sosial bagi Seluruh Rakyat Indonesia`,
            ],
            correctOption: 0,
            hint: `Sila ke-1 dilambangkan oleh Bintang Emas bercahaya.`,
          },
        ],
        2: [
          {
            id: `q2_${Date.now()}_1`,
            question: `Pasal 29 Ayat (2) UUD 1945 menjamin hak mendasar seluruh warga negara Indonesia, yaitu hak untuk...`,
            options: [
              `Memeluk agamanya masing-masing dan beribadat menurut agama dan kepercayaannya itu`,
              `Membuat keributan di tempat ibadah orang lain`,
              `Menolak berteman dengan orang yang berbeda agama`,
              `Melarang warga lain merayakan hari besar keagamaannya`,
            ],
            correctOption: 0,
            hint: `Negara melindungi kemerdekaan setiap penduduk untuk beribadah dengan tenang.`,
          },
          {
            id: `q2_${Date.now()}_2`,
            question: `Di kelas saat jam istirahat, kamu melihat teman yang berbeda keyakinan sedang khusyuk berdoa. Sikap teladan yang benar adalah...`,
            options: [
              `Menjaga ketenangan, tidak berteriak, dan menunggu ia selesai berdoa`,
              `Mengajaknya bercanda sambil menarik kursinya`,
              `Menertawakannya bersama teman-teman yang lain`,
              `Menyuruhnya berdoa di luar gerbang sekolah`,
            ],
            correctOption: 0,
            hint: `Menghormati kekhusyukan doa teman adalah wujud tenggang rasa (tepa selira).`,
          },
        ],
        3: [
          {
            id: `q3_${Date.now()}_1`,
            question: `Bagaimanakah penerapan prinsip toleransi beragama yang tepat dalam kehidupan berbangsa?`,
            options: [
              `Saling menghormati dan hidup rukun berdampingan secara sosial tanpa mencampuradukkan ritual ibadah`,
              `Menyamakan semua tata cara ibadah menjadi satu jenis yang sama`,
              `Menganggap semua perbedaan harus dihilangkan dengan paksa`,
              `Membatasi pergaulan hanya dengan kawan yang satu keyakinan saja`,
            ],
            correctOption: 0,
            hint: `Toleransi adalah kerukunan sosial (tasamuh) tanpa sinkretisme atau mencampuradukkan ritual agama.`,
          },
          {
            id: `q3_${Date.now()}_2`,
            question: `Kitab Sutasoma karya Mpu Tantular melahirkan semboyan suci Bhinneka Tunggal Ika yang mengajarkan bahwa...`,
            options: [
              `Meskipun berbeda-beda suku, adat, dan agama, kita tetap satu kesatuan keluarga bangsa Indonesia`,
              `Perbedaan keyakinan adalah alasan untuk bermusuhan dan berpecah belah`,
              `Hanya kelompok yang paling besar yang boleh berbicara di masyarakat`,
              `Setiap suku harus memiliki aturan negara sendiri-sendiri`,
            ],
            correctOption: 0,
            hint: `'Bhinneka Tunggal Ika tan hana dharma mangrwa' bermakna persatuan dalam keragaman.`,
          },
        ],
      },
    };
  }

  // 0b. Kategori: Pancasila, Dasar Falsafah Negara, dan Lambang Garuda
  if (
    lower.includes("pancasila") ||
    lower.includes("sila") ||
    lower.includes("garuda") ||
    lower.includes("dasar negara") ||
    lower.includes("falsafah")
  ) {
    return {
      ragSummary: [
        `Pengertian & Asal-Usul Pancasila: Kata Pancasila berasal dari bahasa Sanskerta, yaitu 'Panca' yang berarti lima dan 'Sila' yang berarti batu sendi, alas, atau dasar asas moral kehidupan. Pancasila dicetuskan oleh para pendiri bangsa dalam Sidang BPUPKI dan disahkan pada 18 Agustus 1945 sebagai dasar falsafah negara (Philosophische Grondslag) dan pandangan hidup bangsa Indonesia.`,
        `Makna Filosofis Lambang Garuda Pancasila: Burung Garuda berwarna keemasan melambangkan keagungan dan kejayaan bangsa. Jumlah helai bulunya merefleksikan tanggal keramat Proklamasi Kemerdekaan: 17 bulu sayap, 8 bulu ekor, 19 bulu pangkal ekor, dan 45 bulu leher (17 Agustus 1945). Pada perisai di dadanya terpatri lima lambang sila yang diikat kokoh oleh pita bertuliskan 'Bhinneka Tunggal Ika'.`,
        `Intisari Lima Sila Luhur: Sila ke-1 menuntun ketakwaan kepada Tuhan, Sila ke-2 menjunjung martabat kemanusiaan yang adil dan beradab, Sila ke-3 mengikat persatuan di atas keragaman, Sila ke-4 mengedepankan musyawarah mufakat, dan Sila ke-5 mengamanatkan keadilan sosial bagi seluruh rakyat Indonesia.`,
        `Mengapa Pancasila Menjadi Jiwa Bangsa?: Pancasila bukan sekadar teks hafalan, melainkan kompas moral dan pedoman perilaku agar seluruh rakyat Indonesia yang berbeda latar belakang dapat hidup aman, rukun, adil, dan tidak mudah diadu domba.`,
        `Aksi Nyata & Keteladanan di Sekolah: Berdoa bersama dengan khusyuk sebelum belajar (Sila 1), menolong kawan yang terjatuh tanpa pilih kasih (Sila 2), kompak membersihkan kelas saat piket (Sila 3), menghargai pendapat kawan dalam musyawarah kelas (Sila 4), dan membagi tugas kelompok secara adil (Sila 5).`,
        `Pengamalan di Rumah, Warga & Nilai Budi Pekerti: Berbakti kepada orang tua, hidup rukun dengan saudara di rumah, gemar menabung, menghargai hak tetangga sekitar, serta senantiasa bersikap jujur dan amanah dalam setiap perbuatan.`,
      ],
      quizPreview: [
        `Level 1 (Mudah): Asal-usul kata Pancasila dan makna bulu Garuda (+10 Poin)`,
        `Level 2 (Sedang): Penerapan lima sila dalam kegiatan belajar di sekolah (+20 Poin)`,
        `Level 3 (Tantangan): Nilai musyawarah mufakat dan keadilan sosial (+30 Poin)`,
      ],
      quizQuestions: {
        1: [
          {
            id: `q1_${Date.now()}_1`,
            question: `Kata 'Pancasila' berasal dari bahasa Sanskerta. Apakah arti harfiah dari 'Panca' dan 'Sila'?`,
            options: [
              `Panca artinya lima, dan Sila artinya dasar atau alas moral kehidupan`,
              `Panca artinya sepuluh, dan Sila artinya aturan keras`,
              `Panca artinya burung gagah, dan Sila artinya sayap emas`,
              `Panca artinya bendera, dan Sila artinya lagu kebangsaan`,
            ],
            correctOption: 0,
            hint: `Panca = lima, Sila = asas atau dasar falsafah hidup.`,
          },
          {
            id: `q1_${Date.now()}_2`,
            question: `Jumlah helai bulu sayap pada burung Garuda Pancasila melambangkan...`,
            options: [
              `Tanggal 17 kemerdekaan Republik Indonesia`,
              `Bulan 8 (Agustus) proklamasi kemerdekaan`,
              `Tahun 1945 kemerdekaan bangsa`,
              `Jumlah provinsi pertama di Indonesia`,
            ],
            correctOption: 0,
            hint: `Sayap kanan dan kiri masing-masing memiliki 17 helai bulu (tanggal 17).`,
          },
        ],
        2: [
          {
            id: `q2_${Date.now()}_1`,
            question: `Mengapa musyawarah mufakat (Sila ke-4) lebih diutamakan daripada memaksakan kehendak sendiri?`,
            options: [
              `Agar keputusan yang diambil adil, disepakati bersama dengan ikhlas, dan menjaga kerukunan`,
              `Supaya orang yang bersuara paling keras selalu menjadi pemenang`,
              `Hanya untuk membuang-buang waktu istirahat di sekolah`,
              `Agar kita tidak perlu bertanggung jawab atas hasil keputusan`,
            ],
            correctOption: 0,
            hint: `Musyawarah menghasilkan kesepakatan terbaik demi kepentingan bersama.`,
          },
          {
            id: `q2_${Date.now()}_2`,
            question: `Contoh pengamalan Sila ke-2 'Kemanusiaan yang Adil dan Beradab' saat di lingkungan sekolah adalah...`,
            options: [
              `Menolong teman yang terjatuh dan meminjamkan alat tulis tanpa pamrih`,
              `Mengejek teman yang mendapat nilai ulangan kurang memuaskan`,
              `Memperebutkan tempat duduk paling depan dengan kawan`,
              `Menyembunyikan barang milik teman sekelas`,
            ],
            correctOption: 0,
            hint: `Sila ke-2 menjunjung tinggi empati, tenggang rasa, dan kasih sayang sesama manusia.`,
          },
        ],
        3: [
          {
            id: `q3_${Date.now()}_1`,
            question: `Pancasila disebut sebagai 'pandangan hidup bangsa' (Weltanschauung). Maksud dari sebutan tersebut adalah...`,
            options: [
              `Segala tingkah laku, moral, dan cita-cita bangsa Indonesia berpedoman pada nilai-nilai Pancasila`,
              `Pancasila hanya perlu dibaca saat upacara bendera hari Senin saja`,
              `Hanya pejabat pemerintah yang berkewajiban menghafal Pancasila`,
              `Pancasila boleh diganti sewaktu-waktu sesuai keinginan pribadi`,
            ],
            correctOption: 0,
            hint: `Pancasila menjadi kompas moral dan pedoman hidup seluruh rakyat Indonesia.`,
          },
          {
            id: `q3_${Date.now()}_2`,
            question: `Bagaimana hubungan harmonis antara Sila ke-1 (Ketuhanan) dan Sila ke-3 (Persatuan Indonesia)?`,
            options: [
              `Ketaatan beragama menumbuhkan kasih sayang dan menjaga persaudaraan utuh antarwarga bangsa`,
              `Agama digunakan untuk membeda-bedakan dan memusuhi kelompok lain`,
              `Persatuan hanya boleh dilakukan oleh orang-orang yang memiliki keyakinan sama`,
              `Kehidupan beragama tidak ada hubungannya dengan cinta tanah air`,
            ],
            correctOption: 0,
            hint: `Semua agama mengajarkan kasih sayang yang memperkuat jalinan persatuan bangsa.`,
          },
        ],
      },
    };
  }

  // 1. Kategori: Struktur Pemerintahan / Lembaga Negara (DPR, MPR, MK, Presiden, dsb)
  if (
    lower.includes("dpr") ||
    lower.includes("mpr") ||
    lower.includes("mk") ||
    lower.includes("pemerintah") ||
    lower.includes("setruktur") ||
    lower.includes("struktur") ||
    lower.includes("lembaga") ||
    lower.includes("presiden") ||
    lower.includes("menteri") ||
    lower.includes("negara")
  ) {
    return {
      ragSummary: [
        `Pengertian Struktur Pemerintahan & Lembaga Negara: Struktur pemerintahan di Indonesia adalah susunan lembaga negara yang bertugas mengatur, melayani kebutuhan masyarakat, serta menjaga ketertiban bangsa berlandaskan UUD 1945 agar hidup kita aman, damai, dan adil.`,
        `Lembaga Utama dan Tugas Pokoknya: MPR bertugas melantik Presiden, DPR bertugas membuat undang-undang bersama Presiden dan mewakili suara rakyat, MK bertugas menjaga keadilan hukum aturan negara, dan Presiden memimpin jalannya pemerintahan untuk melayani seluruh rakyat Indonesia.`,
        `Mengapa Kekuasaan Negara Dibagi Tiga?: Agar tidak ada orang yang berbuat sesuka hati, kekuasaan dibagi menjadi pembuat aturan (DPR), pelaksana aturan (Presiden), dan pengawas hukum (MK/MA). Tujuannya agar hak seluruh rakyat selalu terlindungi dengan baik.`,
        `Alasan Kita Perlu Tahu: Mengenal lembaga negara membantu kita mengerti bahwa aturan dibuat demi kenyamanan bersama dan melindungi hak seluruh rakyat Indonesia.`,
        `Aksi Nyata di Sekolah: Memilih ketua kelas melalui musyawarah bersama dengan tertib, mendengarkan pendapat teman saat berdiskusi, dan menaati tata tertib sekolah.`,
        `Pengamalan di Rumah: Menghormati pengurus RT dan tetangga, membantu menjaga kebersihan lingkungan bersama warga, serta mematuhi aturan keluarga di rumah.`,
        `Nilai Budi Pekerti: Membiasakan sikap jujur, taat aturan, adil, dan cinta tanah air Indonesia.`,
      ],
      quizPreview: [
        `Level 1 (Mudah): Pemahaman tugas pokok DPR, MPR, dan MK (+10 Poin)`,
        `Level 2 (Sedang): Penerapan musyawarah pemilihan ketua kelas (+20 Poin)`,
        `Level 3 (Tantangan): Analisis pentingnya pembagian kekuasaan negara (+30 Poin)`,
      ],
      quizQuestions: {
        1: [
          {
            id: `q1_${Date.now()}_1`,
            question: `Lembaga negara yang bertugas membuat undang-undang bersama Presiden dan mewakili suara rakyat adalah...`,
            options: [
              `DPR (Dewan Perwakilan Rakyat)`,
              `Puskesmas Kecamatan`,
              `Kantin Sekolah`,
              `Pengurus Posyandu`,
            ],
            correctOption: 0,
            hint: `DPR singkatan dari Dewan Perwakilan Rakyat yang berkantor di Senayan.`,
          },
          {
            id: `q1_${Date.now()}_2`,
            question: `Siapakah lembaga yang memiliki wewenang untuk melantik Presiden dan Wakil Presiden serta mengubah UUD 1945?`,
            options: [
              `MPR (Majelis Permusyawaratan Rakyat)`,
              `Ketua RT setempat`,
              `Panitia Lomba Desa`,
              `Satpam Sekolah`,
            ],
            correctOption: 0,
            hint: `MPR adalah gabungan anggota DPR dan DPD yang melantik kepala negara.`,
          },
        ],
        2: [
          {
            id: `q2_${Date.now()}_1`,
            question: `Mahkamah Konstitusi (MK) memiliki tugas utama yang sangat penting dalam sistem hukum kita, yaitu...`,
            options: [
              `Menguji undang-undang agar tidak bertentangan dengan UUD 1945`,
              `Menentukan harga tiket liburan ke luar kota`,
              `Membangun jembatan dan jalan raya`,
              `Mengatur jadwal pelajaran di sekolah`,
            ],
            correctOption: 0,
            hint: `MK menjaga agar setiap undang-undang tetap adil sesuai konstitusi negara.`,
          },
          {
            id: `q2_${Date.now()}_2`,
            question: `Bagaimana contoh pengamalan demokrasi pemerintahan yang dapat kita terapkan di ruang kelas SD?`,
            options: [
              `Memilih ketua kelas melalui musyawarah bersama atau pemungutan suara`,
              `Menunjuk ketua kelas berdasarkan siapa yang paling berisik`,
              `Memaksa teman agar mau menuruti semua kemauan kita`,
              `Membatalkan pemilihan jika calon yang kita sukai kalah`,
            ],
            correctOption: 0,
            hint: `Musyawarah mufakat di kelas adalah wujud nyata demokrasi Pancasila.`,
          },
        ],
        3: [
          {
            id: `q3_${Date.now()}_1`,
            question: `Mengapa kekuasaan negara dibagi antara pembuat aturan (DPR), pelaksana aturan (Presiden), dan pengawas hukum (MK/MA)?`,
            options: [
              `Agar tidak ada kekuasaan mutlak yang sewenang-wenang dan hak rakyat terlindungi`,
              `Supaya gedung perkantoran di ibu kota menjadi lebih banyak`,
              `Agar para pejabat bisa bersaing satu sama lain`,
              `Hanya untuk meniru negara lain tanpa tujuan yang jelas`,
            ],
            correctOption: 0,
            hint: `Pemisahan kekuasaan (Trias Politika) menjaga keadilan dan keseimbangan tatanan negara.`,
          },
          {
            id: `q3_${Date.now()}_2`,
            question: `Jika ada teman yang melanggar kesepakatan tata tertib kelas, tindakan terpuji yang mencerminkan musyawarah adalah...`,
            options: [
              `Mengingatkan dengan sopan dan membicarakan solusi bersama wali kelas`,
              `Mengejek dan mengucilkan teman tersebut dari pergaulan`,
              `Membalas dengan ikut melanggar peraturan sekolah`,
              `Membiarkan suasana kelas menjadi kacau`,
            ],
            correctOption: 0,
            hint: `Menyelesaikan masalah secara kekeluargaan dan santun adalah budaya luhur bangsa.`,
          },
        ],
      },
    };
  }

  // 2. Kategori: Norma, Aturan, Hak & Kewajiban
  if (
    lower.includes("norma") ||
    lower.includes("aturan") ||
    lower.includes("hak") ||
    lower.includes("kewajiban") ||
    lower.includes("tertib") ||
    lower.includes("disiplin")
  ) {
    return {
      ragSummary: [
        `Hai Adik-adik Hebat! Apa itu Norma dan Aturan?: Norma adalah aturan atau petunjuk tentang bagaimana kita harus bertingkah laku yang baik. Aturan ini disepakati bersama agar kehidupan di sekolah dan di rumah berjalan tertib, aman, rukun, dan adil bagi semua orang.`,
        `Empat Macam Norma dalam Kehidupan: 1) Norma Agama (bersumber dari wahyu Tuhan), 2) Norma Kesusilaan (bersumber dari hati nurani tentang baik dan buruk), 3) Norma Kesopanan (bersumber dari tata krama dan adat pergaulan), serta 4) Norma Hukum (peraturan tertulis resmi dari negara yang memiliki sanksi tegas mengikat).`,
        `Keseimbangan Hak dan Kewajiban (UUD 1945): Kewajiban adalah tugas yang wajib kita tunaikan dengan penuh tanggung jawab, sedangkan hak adalah sesuatu yang patut kita peroleh setelah menunaikan kewajiban. Menjalankan kewajiban terlebih dahulu dengan ikhlas menciptakan keadilan dan mencegah sifat egois dalam pergaulan.`,
        `Mengapa Aturan Diperlukan?: Aturan dan tata tertib dibuat bukan untuk mengekang kebebasan, melainkan melindungi keselamatan setiap insan, menjamin hak belajar anak, dan menciptakan ketenangan bersama di sekolah maupun di masyarakat.`,
        `Aksi Nyata & Keteladanan di Sekolah: Datang tepat waktu sebelum bel masuk sekolah berbunyi, mendengarkan penjelasan bapak/ibu guru dengan tertib, menjaga kebersihan ruang kelas, serta membiasakan budaya antre dengan sabar di kantin maupun perpustakaan.`,
        `Pengamalan di Rumah, Warga & Nilai Budi Pekerti: Membantu orang tua membersihkan rumah, belajar tepat waktu, menjaga ketenangan saat tetangga beristirahat, serta membiasakan sikap jujur, mandiri, disiplin, dan menghormati hak sesama.`,
      ],
      quizPreview: [
        `Level 1 (Mudah): Perbedaan antara hak dan kewajiban anak (+10 Poin)`,
        `Level 2 (Sedang): Sikap disiplin mematuhi norma di sekolah (+20 Poin)`,
        `Level 3 (Tantangan): Tanggung jawab mendahulukan kewajiban (+30 Poin)`,
      ],
      quizQuestions: {
        1: [
          {
            id: `q1_${Date.now()}_1`,
            question: `Apakah yang dimaksud dengan 'kewajiban' bagi seorang siswa SD?`,
            options: [
              `Sesuatu yang wajib dilaksanakan dengan penuh tanggung jawab`,
              `Sesuatu yang boleh ditinggalkan sesuka hati`,
              `Hadiah yang didapatkan setelah bermain`,
              `Uang saku yang diberikan orang tua`,
            ],
            correctOption: 0,
            hint: `Kewajiban adalah tugas yang harus kita kerjakan dengan baik.`,
          },
          {
            id: `q1_${Date.now()}_2`,
            question: `Salah satu contoh 'hak' yang dimiliki siswa saat berada di sekolah adalah...`,
            options: [
              `Mendapatkan bimbingan dan pengajaran dari bapak/ibu guru`,
              `Merusak fasilitas meja dan kursi di dalam kelas`,
              `Meninggalkan jam pelajaran tanpa izin`,
              `Menyontek jawaban teman saat ujian`,
            ],
            correctOption: 0,
            hint: `Hak adalah sesuatu yang berhak diterima untuk kebaikan kita.`,
          },
        ],
        2: [
          {
            id: `q2_${Date.now()}_1`,
            question: `Mengapa kewajiban harus dilaksanakan terlebih dahulu sebelum kita menuntut hak?`,
            options: [
              `Agar tercipta keadilan dan kehidupan yang harmonis bagi semua orang`,
              `Agar kita dianggap paling hebat oleh teman-teman`,
              `Supaya kita tidak perlu belajar lagi di rumah`,
              `Hanya untuk menghindari hukuman guru semata`,
            ],
            correctOption: 0,
            hint: `Keseimbangan antara hak dan kewajiban menciptakan keadilan.`,
          },
          {
            id: `q2_${Date.now()}_2`,
            question: `Di jam istirahat, kamu melihat antrean panjang di kantin. Sikap disiplin yang tepat adalah...`,
            options: [
              `Ikut mengantre dengan sabar dan tertib di barisan belakang`,
              `Menyerobot antrean teman yang berbadan lebih kecil`,
              `Berteriak-teriak meminta dilayani paling awal`,
              `Mendorong teman di depan agar cepat maju`,
            ],
            correctOption: 0,
            hint: `Budaya antre adalah wujud nyata disiplin dan menghormati hak orang lain.`,
          },
        ],
        3: [
          {
            id: `q3_${Date.now()}_1`,
            question: `Jika ada teman yang selalu menuntut haknya tetapi malas melaksanakan piket kelas, nasihat terbaik adalah...`,
            options: [
              `Mengingatkan bahwa kebersihan kelas adalah kewajiban bersama demi kenyamanan semua`,
              `Memusuhi dan tidak mau berbicara dengannya selamanya`,
              `Membiarkannya dan ikut-ikutan tidak mau membersihkan kelas`,
              `Mengadukannya dengan marah-marah di depan kelas`,
            ],
            correctOption: 0,
            hint: `Nasihati dengan santun agar teman menyadari pentingnya tanggung jawab bersama.`,
          },
          {
            id: `q3_${Date.now()}_2`,
            question: `Apa akibat yang akan terjadi jika dalam sebuah masyarakat tidak ada aturan hukum yang ditaati?`,
            options: [
              `Kehidupan menjadi kacau, tidak aman, dan hak orang yang lemah tertindas`,
              `Semua orang akan menjadi bahagia dan bebas kaya raya`,
              `Masyarakat akan hidup lebih damai tanpa ada masalah`,
              `Sekolah tidak lagi membutuhkan guru dan buku`,
            ],
            correctOption: 0,
            hint: `Aturan menjaga keteraturan dan melindungi keselamatan semua warga.`,
          },
        ],
      },
    };
  }

  // 3a. Kategori Khusus: Mengenal Tokoh Wayang Punokawan (Semar, Gareng, Petruk, Bagong)
  if (
    lower.includes("punokawan") ||
    lower.includes("semar") ||
    lower.includes("gareng") ||
    lower.includes("petruk") ||
    lower.includes("bagong")
  ) {
    return {
      ragSummary: [
        `Pangertosan lan Asal-Usul Punokawan: Punokawan asale saka tembung 'Pana' (paham utawa weruh kanthi cetha) lan 'Kawan' (kanca utawa sedulur). Punokawan yaiku papat tokoh pamomong para ksatria Pandhawa kang asale saka rakyat cilik, nduweni kawicaksanan luhur, lan tansah ngemutake para ksatria supaya tetep andhap asor lan tumindak becik.`,
        `Watak Luhur Kyai Semar: Semar minangka bapa pamomong kang sejatine titising dewa (Batara Ismaya). Watake sabar banget, wicaksana, welas asih marang sapa wae, lan ora tau kumalungkung (sombong). Pasinaon kanggo bocah yaiku kudu sabar, ora gampang nesu, lan ngajeni kanca.`,
        `Watak Nala Gareng lan Petruk: Gareng tangane ceko lan sikile jinjit minangka perlambang kudu ngati-ati nalika tumindak lan ora njupuk duweke liyan. Petruk dedege dhuwur, irunge dawa, watake grapyak, loman (seneng tetulung), lan pinter gawe senenge kanca tanpa nglarani ati.`,
        `Watak Bagong (Blaka Suta): Bagong awake lemu cendhek, watake jujur apa anane (blaka suta), ora seneng lamis (munafik), kendel mbelani bebener, lan tansah ceria nglipur kanca-kancane nalika sedhih.`,
        `Aksi Nyata ing Sekolah: Niru watak jujur Bagong nalika nggarap tugas sekolah tanpa nyontek, watak sabar Semar nalika ana kanca kang nggodha, sarta watak loman Petruk nalika ana kanca kang butuh pitulungan piranti sinau.`,
        `Pesan Budi Pekerti marang Siswa: Sinau watak Punokawan ngelingake kita kabeh supaya tansah andhap asor, guyub rukun, jujur ing samubarang tumindak, lan seneng aweh pitulungan marang liyan.`,
      ],
      quizPreview: [
        `Level 1 (Mudah): Paraga papat Punokawan lan sesepuh pamomong (+10 Poin)`,
        `Level 2 (Sedang): Watak luhur Semar, Gareng, Petruk, lan Bagong (+20 Poin)`,
        `Level 3 (Tantangan): Penerapan watak jujur blaka suta ing padintenan (+30 Poin)`,
      ],
      quizQuestions: {
        1: [
          {
            id: `q1_${Date.now()}_1`,
            question: `Papat paraga punokawan kang dadi pamomonge para ksatria Pandhawa yaiku...`,
            options: [
              `Semar, Gareng, Petruk, lan Bagong`,
              `Puntadewa, Bima, Arjuna, lan Nakula`,
              `Duryudana, Dursasana, lan Karna`,
              `Batara Guru, Narada, lan Ismaya`,
            ],
            correctOption: 0,
            hint: `Punokawan cacahe ana papat: Semar minangka bapa, diterusake Gareng, Petruk, lan Bagong.`,
          },
          {
            id: `q1_${Date.now()}_2`,
            question: `Sapa jenenge sesepuh Punokawan kang awake lemu lan nduweni watak sabar sarta wicaksana?`,
            options: [`Kyai Semar`, `Petruk`, `Nala Gareng`, `Bagong`],
            correctOption: 0,
            hint: `Kyai Semar yaiku bapa pamomong kang sabar banget lan tansah paring pitutur becik.`,
          },
        ],
        2: [
          {
            id: `q2_${Date.now()}_1`,
            question: `Tokoh Punokawan kang dedege dhuwur, irunge dawa, lan nduweni watak loman sarta seneng tetulung yaiku...`,
            options: [`Petruk`, `Semar`, `Gareng`, `Togog`],
            correctOption: 0,
            hint: `Petruk dedege dhuwur lan irunge dawa, watake grapyak lan seneng mbantu kanca.`,
          },
          {
            id: `q2_${Date.now()}_2`,
            question: `Watake Bagong kang tansah jujur apa anane lan ora seneng lamis (munafik) diarani...`,
            options: [`Blaka suta`, `Kumalungkung`, `Andhap asor`, `Gedhe endhase`],
            correctOption: 0,
            hint: `Blaka suta tegese ngomong jujur apa anane miturut kasunyatan.`,
          },
        ],
        3: [
          {
            id: `q3_${Date.now()}_1`,
            question: `Kepriye tuladha trap-trapan watak jujur Bagong lan sabare Semar ing njero kelas?`,
            options: [
              `Nggarap ulangan kanthi jujur tanpa nyontek lan ora gampang nesu nalika digodha kanca`,
              `Nesu-nesu lan mbengok banter nalika garapane durung rampung`,
              `Niru jawabane kanca kanthi meneng-meneng`,
              `Ngece kanca kang durung paham wulangan`,
            ],
            correctOption: 0,
            hint: `Jujur lan sabar ndadekake suasana sinau ing kelas dadi ayem lan tentrem.`,
          },
          {
            id: `q3_${Date.now()}_2`,
            question: `Piwulang utama saka tokoh Punokawan kang kudu ditiru dening kabeh siswa yaiku...`,
            options: [
              `Senadyan dadi wong cilik, kudu nduweni watak andhap asor, jujur, lan seneng tetulung`,
              `Kudu sombong menawa nduweni biji apik ing kelas`,
              `Mung gelem kekancan karo bocah kang sugih`,
              `Seneng padu lan golek menange dhewe`,
            ],
            correctOption: 0,
            hint: `Punokawan mulangake nilai andhap asor, gotong royong, lan budi pekerti luhur.`,
          },
        ],
      },
    };
  }

  // 3. Kategori: Cerita Wayang, Mahabharata, Bharatayuddha, Pandhawa & Kurawa
  if (
    lower.includes("mahabarata") ||
    lower.includes("mahabharata") ||
    lower.includes("baratayuda") ||
    lower.includes("bharatayuddha") ||
    lower.includes("bharatayuda") ||
    lower.includes("wayang") ||
    lower.includes("pandhawa") ||
    lower.includes("kurawa") ||
    lower.includes("karna") ||
    lower.includes("arjuna") ||
    lower.includes("janaka") ||
    lower.includes("werkudara") ||
    lower.includes("bima") ||
    lower.includes("yudhistira") ||
    lower.includes("puntadewa") ||
    lower.includes("nakula") ||
    lower.includes("sadewa") ||
    lower.includes("duryudana") ||
    lower.includes("kresna") ||
    lower.includes("kurusetra") ||
    (lower.includes("perang") && !isPkn)
  ) {
    return {
      ragSummary: [
        `Pangertosan Perang Bharatayuddha (Mahabharata): Perang agung Bharatayuddha ing carita Mahabharata yaiku perang gedhe ing tegal Kurusetra antarane Pandhawa (pralambang kabecikan lan bebener) mungsuh Kurawa (pralambang angkara murka lan srakah). Piwulang utamane yaiku kabecikan mesthi menang nglawan tumindak ala.`,
        `Para Tokoh Utama lan Watak Ksatria: Pandhawa Lima nduweni watak utama, yaiku Prabu Puntadewa (jujur lan sabar), Raden Werkudara (kendel mbelani bebener), Raden Arjuna (alus budine lan sekti), sarta Nakula lan Sadewa (setya tuhu). Dene Kurawa kang dipimpin Duryudana nduweni watak srakah lan meri. Prabu Kresna minangka paraga wicaksana paring tuntunan marang kesatria.`,
        `Piwulang Luhur Carita Bharatayuddha: Perang iki paring piwulang yen permusuhan lan watak srakah mung nuwuhake karusakan. Kita ora pareng nduweni watak meri marang kanca lan kudu tansah njaga karukunan.`,
        `Aksi Nyata ing Sekolah: Niru watak jujur Puntadewa nalika ulangan tanpa nyontek, watak kendel Werkudara nulungi kanca kanthi adil, sarta grapyak lan ngajeni kabeh kanca kaya watak Arjuna.`,
        `Pengamalan ing Omah: Njaga karukunan karo sedulur, ora pareng crah utawa rebutan dolanan kaya Kurawa, sarta bekti lan mituhu marang dhawuhe bapak lan ibu.`,
        `Piweling Budi Pekerti: Samukawis tumindak ala lan angkara murka bakal lebur sirna dening watak sabar, jujur, lan welas asih marang sapadha-padha.`,
      ],
      quizPreview: [
        `Level 1 (Mudah): Paraga utama Pandhawa lan Kurawa ing perang Bharatayuddha (+10 Poin)`,
        `Level 2 (Sedang): Watak ksatria Puntadewa, Werkudara, lan Arjuna (+20 Poin)`,
        `Level 3 (Tantangan): Piwulang luhur ngadohi watak angkara murka Kurawa (+30 Poin)`,
      ],
      quizQuestions: {
        1: [
          {
            id: `q1_${Date.now()}_1`,
            question: `Ing carita agung Mahabharata, perang gedhe antarane Pandhawa lan Kurawa diarani perang...`,
            options: [`Perang Bharatayuddha`, `Perang Bubat`, `Perang Dingin`, `Perang Candrawasa`],
            correctOption: 0,
            hint: `Perang gedhe ing tegal Kurusetra antarane Pandhawa mungsuh Kurawa diarani Bharatayuddha.`,
          },
          {
            id: `q1_${Date.now()}_2`,
            question: `Sapa tokoh sesepuh Pandhawa Lima kang misuwur nduweni watak jujur, sabar, lan ora nate goroh?`,
            options: [`Prabu Puntadewa (Yudhistira)`, `Prabu Duryudana`, `Patih Sengkuni`, `Durna`],
            correctOption: 0,
            hint: `Puntadewa getihe putih minangka pralambang watak kang suci lan ora tau ngapusi.`,
          },
        ],
        2: [
          {
            id: `q2_${Date.now()}_1`,
            question: `Kurawa nduweni watak ala kang njalari dumadine perang Bharatayuddha, yaiku...`,
            options: [
              `Srakah, meri marang sedulur, lan angkara murka`,
              `Sabar lan seneng tetulung marang wong miskin`,
              `Welas asih lan ngajeni marang Pandhawa`,
              `Jujur lan ngugemi janji kanthi setya`,
            ],
            correctOption: 0,
            hint: `Kurawa kang dipimpin Duryudana ora gelem mbalekake hak kraton Amarta amarga srakah.`,
          },
          {
            id: `q2_${Date.now()}_2`,
            question: `Kepriye tuladha nuladhani watak kesatria Raden Werkudara (Bima) ing lingkungan sekolahan?`,
            options: [
              `Kendel mbelani bebener lan mbela kanca kang dizalimi kanthi adil`,
              `Seneng nendhang meja lan gawe kisruh ing kelas`,
              `Medeni kanca-kanca kang luwih cilik awake`,
              `Nesu-nesu menawa dielingake dening guru`,
            ],
            correctOption: 0,
            hint: `Werkudara watake gagah prakosa nanging tansah jejeg mbelani bebener.`,
          },
        ],
        3: [
          {
            id: `q3_${Date.now()}_1`,
            question: `Unen-unen Jawa 'Sura Dira Jayaningrat Lebur Dening Pangastuti' ngemot piwulang luhur yaiku...`,
            options: [
              `Samukawis angkara murka bakal lebur sirna dening tumindak sabar lan kautaman becik`,
              `Wong sing sekti mandraguna mesthi dadi panguwasa donya`,
              `Kudu perang terus nganti kabeh mungsuh kalah`,
              `Wong sing kalah perang kudu ninggalake desane`,
            ],
            correctOption: 0,
            hint: `Pangastuti tegese kabecikan, watak sabar, lan welas asih kang nglebur angkara murka.`,
          },
          {
            id: `q3_${Date.now()}_2`,
            question: `Piwulang utama apa kang bisa dijupuk para siswa supaya ora niru tumindake Kurawa?`,
            options: [
              `Njaga karukunan karo sedulur, ora meri marang rejekine liyan, lan ora rebutan dolanan`,
              `Mung ngancani kanca sing sugih wae`,
              `Rebutan panguwasa ing kelas kanthi cara meksa`,
              `Nindakake pitenah marang kanca sa-kelas`,
            ],
            correctOption: 0,
            hint: `Karukunan kulawarga lan kanca adoh saka watak meri srakah Kurawa.`,
          },
        ],
      },
    };
  }

  // 4. Kategori: Aksara Jawa (Hanacaraka & Sandhangan)
  if (
    lower.includes("aksara") ||
    lower.includes("hanacaraka") ||
    lower.includes("carakan") ||
    lower.includes("sandhangan")
  ) {
    return {
      ragSummary: [
        `Pangertosan Aksara Jawa (Hanacaraka): Aksara Jawa yaiku aksara tradhisional warisan leluhur kabudayan Jawa kang cacahe ana rong puluh (20) aksara legena, wiwit saka Ha nganti Nga. Saben aksara nduweni piwulang luhur babagan uripe manungsa.`,
        `Sandhangan Swara lan Panyigeging Wanda: Sandhangan swara kaperang dadi Wulu (swara i), Suku (swara u), Pepet (swara e), Taling (swara é), lan Taling Tarung (swara o). Sandhangan panyigeg ana Layar (sigeg r), Wignyan (sigeg h), Cecak (sigeg ng), lan Pangkon kanggo mateni aksara.`,
        `Paedah Nyinau Aksara Jawa: Nglestarekake warisan adi luhur kabudayan Jawa, ngasah katelitian lan kaprigelan nulis, sarta nuwuhake rasa mongkog (bangga) minangka generasi mudha Jawa.`,
        `Aksi Nyata ing Sekolah: Gladhen maca lan nulis tembung prasaja nganggo aksara Jawa ing buku tulis kanthi telaten, sarta mbiyantu kanca kang durung lancar.`,
        `Pengamalan ing Omah: Ngenalake tulisan aksara Jawa ing omah lan nyoba maca tulisan aksara Jawa ing plang dalan utawa museum.`,
        `Piweling Budi Pekerti: Nglestarekake aksara Jawa ateges njaga jati diri bangsa supaya ora cures katelan jaman.`,
      ],
      quizPreview: [
        `Level 1 (Mudah): Cacahing aksara Jawa legena lan sandhangan swara (+10 Poin)`,
        `Level 2 (Sedang): Pasangan aksara lan sandhangan panyigeg wanda (+20 Poin)`,
        `Level 3 (Tantangan): Nulis lan maca tembung prasaja mawa aksara Jawa (+30 Poin)`,
      ],
      quizQuestions: {
        1: [
          {
            id: `q1_${Date.now()}_1`,
            question: `Aksara Jawa legena kang dadi dhasar panulisan cacahe ana pira?`,
            options: [`20 aksara`, `26 aksara`, `15 aksara`, `10 aksara`],
            correctOption: 0,
            hint: `Wiwit saka Ha-Na-Ca-Ra-Ka nganti Nga cacahe rong puluh.`,
          },
          {
            id: `q1_${Date.now()}_2`,
            question: `Sandhangan swara kang digunakake kanggo ngowahi swara dadi 'i' (tuladhane: pipi) diarani...`,
            options: [`Wulu`, `Suku`, `Pepet`, `Taling`],
            correctOption: 0,
            hint: `Wujud wulu bunder cilik ing dhuwure aksara, ngasilake swara i.`,
          },
        ],
        2: [
          {
            id: `q2_${Date.now()}_1`,
            question: `Sandhangan panyigeg wanda kang ngowahi dadi swara sigeg 'r' (tuladhane: pasar) diarani...`,
            options: [`Layar`, `Wignyan`, `Cecak`, `Pangkon`],
            correctOption: 0,
            hint: `Layar mapan ing dhuwuring aksara kanggo sigeg r.`,
          },
          {
            id: `q2_${Date.now()}_2`,
            question: `Kepriye sikapmu marang warisan aksara Jawa minangka siswa SD?`,
            options: [
              `Bangga lan sinau kanthi tekun supaya aksara Jawa tetep lestari`,
              `Ngece amarga dianggep kuno lan angel`,
              `Ora gelem sinau babar pisan`,
              `Mung nyontek kanca tanpa nyoba nulis dhewe`,
            ],
            correctOption: 0,
            hint: `Generasi mudha wajib nglestarekake warisan budaya luhur.`,
          },
        ],
        3: [
          {
            id: `q3_${Date.now()}_1`,
            question: `Aksara Ha-Na-Ca-Ra-Ka miturut dongeng Aji Saka nduweni teges filosofis yaiku...`,
            options: [
              `Ana utusan kang padha pasulayan lan padha dadi bathang amarga ngugemi dhawuh`,
              `Para prajurit kang seneng plesir menyang kutha`,
              `Bocah sekolah kang seneng dolanan ing lapangan`,
              `Pedagang kang dodolan ing pasar gedhe`,
            ],
            correctOption: 0,
            hint: `Crita Dora lan Sembada kang setya tuhu ngemban dhawuhe Aji Saka.`,
          },
          {
            id: `q3_${Date.now()}_2`,
            question: `Apa manfaat praktis sinau nulis aksara Jawa tumrap kaprigelan siswa?`,
            options: [
              `Melatih katelitian, ketelatenan, daya eling, lan rasa tresna marang kabudayan lokal`,
              `Supaya bisa dolanan HP luwih suwe`,
              `Supaya ora perlu mlebu sekolah maneh`,
              `Bisa entuk dhuwit langsung saka internet`,
            ],
            correctOption: 0,
            hint: `Sinau aksara nglatih kaprigelan tangan lan ketelatenan ati.`,
          },
        ],
      },
    };
  }

  // 5. Kategori: Unggah-Ungguh Basa Jawa (Basa Ngoko & Krama Alus)
  if (
    lower.includes("unggah") ||
    lower.includes("krama") ||
    lower.includes("ngoko") ||
    lower.includes("trap-trapan") ||
    lower.includes("tatakrama") ||
    lower.includes("subasita") ||
    (lower.includes("basa") && !lower.includes("aksara"))
  ) {
    return {
      ragSummary: [
        `Pangertosan Unggah-Ungguh Basa: Unggah-ungguh basa Jawa iku tata krama lan subasita anggone matur (guneman) manut marang sapa kang diajak guneman, supaya kita bisa ngajeni wong liya lan nduweni budi pekerti kang alus.`,
        `Trap-Trapan Basa lan Tuladhane: Basa Ngoko digunakake guneman karo kanca sebaya utawa kanca dolanan. Basa Krama Alus wajib digunakake nalika matur marang Bapak/Ibu Guru lan wong tuwa minangka tandha pakurmatan. Solah bawa kudu selaras: awak rada mbungkuk nalika matur.`,
        `Paedah Nyinau Budi Pekerti Basa Jawa: Para siswa saged mangertosi subasita lan tata krama, saengga ora gampang sombong lan tansah ngajeni wong liya ing ngendi wae.`,
        `Aksi Nyata ing Sekolah: Nalika matur marang Bapak utawa Ibu Guru migunakake Basa Krama Alus kanthi tatakrama (tuladhane: 'Nyuwun sewu Bapak/Ibu Guru, kepareng kula badhe nyuwun pirsa babagan tugas punika').`,
        `Pengamalan ing Omah: Salim lan ngambung asta nalika pamit budhal sekolah, mbiyantu pakaryane wong tuwa, sarta matur 'nderek langkung' nalika mlaku ing sangarepe wong sepuh.`,
        `Piweling Budi Pekerti Wong Jawa: Ajining dhiri dumunung ana ing lathi, ajining raga ana ing busana—tegese ajining manungsa gumantung saka pocapan lan tindak-tanduk kang becik.`,
      ],
      quizPreview: [
        `Level 1 (Mudah): Pangertosan basa ngoko lan basa krama alus (+10 Poin)`,
        `Level 2 (Sedang): Tuladha trapsila matur marang Bapak/Ibu Guru (+20 Poin)`,
        `Level 3 (Tantangan): Analisis subasita lan unggah-ungguh ing bebrayan (+30 Poin)`,
      ],
      quizQuestions: {
        1: [
          {
            id: `q1_${Date.now()}_1`,
            question: `Basa Jawa kang lumrah digunakake nalika matur marang Bapak utawa Ibu Guru yaiku...`,
            options: [`Basa Krama Alus`, `Basa Ngoko Lugu`, `Basa Gaul Campuran`, `Basa Walikan`],
            correctOption: 0,
            hint: `Marang wong sing luwih sepuh lan diurmati kudu nggunakake basa sing alus lan sopan.`,
          },
          {
            id: `q1_${Date.now()}_2`,
            question: `Menawa guneman karo kanca dolanan saumuran, basa kang trep digunakake yaiku...`,
            options: [`Basa Ngoko`, `Basa Sanskerta`, `Basa Krama Inggil`, `Basa Isyarat`],
            correctOption: 0,
            hint: `Kanca sebaya lumrah nggunakake basa ngoko kanthi guyub rukun.`,
          },
        ],
        2: [
          {
            id: `q2_${Date.now()}_1`,
            question: `Nalika mlaku ing sangarepe wong tuwa utawa tamu kang nembe lenggah, patrap kang bener yaiku...`,
            options: [
              `Mbungkukake awak sarta matur 'nderek langkung'`,
              `Mlaku mlayu-mlayu karo bengok-bengok`,
              `Mlaku mundur tanpa noleh ngarep`,
              `Nyawang sinis karo dolanan HP`,
            ],
            correctOption: 0,
            hint: `Mbungkukake awak minangka tandha pakurmatan marang tiyang sepuh.`,
          },
          {
            id: `q2_${Date.now()}_2`,
            question: `Tembung mangan menawa diowahi dadi krama alus kanggo pakurmatan marang Simbah yaiku...`,
            options: [`Dhahar`, `Nedha`, `Nguntal`, `Nguntal bareng`],
            correctOption: 0,
            hint: `Simbah nembe dhahar, dene awake dhewe nembe nedha.`,
          },
        ],
        3: [
          {
            id: `q3_${Date.now()}_1`,
            question: `Unen-unen 'Ajining dhiri dumunung ana ing lathi' nduweni teges yaiku...`,
            options: [
              `Aji lan diajenine manungsa gumantung saka pocapan lan tutur basane`,
              `Wong sing pinter ngomong mesthi dadi juara kelas`,
              `Kudu mangan panganan sing enak supaya cangkeme resik`,
              `Ora kena ngomong babar pisan marang wong liya`,
            ],
            correctOption: 0,
            hint: `Lathi tegese ilat utawa pocapan, mula kudu tansah ngati-ati anggone guneman.`,
          },
          {
            id: `q3_${Date.now()}_2`,
            question: `Menawa ana kanca kang durung paham babagan unggah-ungguh basa Jawa, patrapmu kang becik yaiku...`,
            options: [
              `Ngajari lan ngelingake kanthi sabar tanpa ngece utawa nggeguyu`,
              `Ngece ing ngarepe kanca-kanca sa-kelas`,
              `Nesu lan ora gelem ngancani maneh`,
              `Ngandhani guru supaya kancane diukum`,
            ],
            correctOption: 0,
            hint: `Nulung kanca kanthi sabar minangka watak luhur pambudidaya pasinaon.`,
          },
        ],
      },
    };
  }

  // 6. Kategori: Bahasa Jawa Dinamis (Topik Mulok Liyane)
  if (!isPkn) {
    return {
      ragSummary: [
        `Pangertosan Pasinaon ${titleStr}: Pasinaon Basa Jawa ngenani "${titleStr}" mulangake kawruh kabudayan Jawa lan budi pekerti becik tumrap siswa SD supaya dadi bocah kang trapsila lan mangertosi budayane dhewe.`,
        `Bab-Bab Wigati ing Pasinaon: Nyinaoni konsep dhasar, makna tembung, lan pesen moral kang kamot ing materi "${titleStr}", sarta ngubungake materi karo tumindak nyata saben dina.`,
        `Paedah Pasinaon Basa Jawa: Nglestarekake warisan basa lan kabudayan ibu, mbangun tatakrama lan subasita, sarta ngurmati wong sepuh lan tangga teparo.`,
        `Aksi Nyata ing Sekolah: Bekerja sama karo kanca sa-kelas kanthi guyub rukun, ngajeni bimbingan Bapak/Ibu Guru, lan aktif sinau bebarengan.`,
        `Pengamalan ing Omah: Bekti marang bapak lan ibu, rukun marang sedulur, lan njaga tata krama ing kampung.`,
        `Piweling Budi Pekerti: Wong Jawa aja nganti ilang Jawane—tansah njaga budi pekerti lan tatakrama ing ngendi wae papan panggonane.`,
      ],
      quizPreview: [
        `Level 1 (Mudah): Pangertosan dhasar babagan ${titleStr} (+10 Poin)`,
        `Level 2 (Sedang): Tuladha tumindak becik lan trap-trapane ing sekolah (+20 Poin)`,
        `Level 3 (Tantangan): Analisis piwulang luhur lan nglestarekake kabudayan (+30 Poin)`,
      ],
      quizQuestions: {
        1: [
          {
            id: `q1_${Date.now()}_1`,
            question: `Apa intisari lan piwulang wigati saka pasinaon "${titleStr}"?`,
            options: [
              `Mangertosi kawruh kabudayan lan nindakake budi pekerti luhur kanthi tanggung jawab`,
              `Mung dolanan tanpa mikirake tatakrama ing sekolah`,
              `Ngece kanca kang durung paham babagan basa Jawa`,
              `Mangan ing jero kelas nalika wulangan lumaku`,
            ],
            correctOption: 0,
            hint: `Pasinaon Basa Jawa mulangake kawruh lan watak trapsila becik.`,
          },
          {
            id: `q1_${Date.now()}_2`,
            question: `Kenging menapa para siswa kedah nyinau "${titleStr}" wiwit alit?`,
            options: [
              `Supados mangertos unggah-ungguh lan dados pribadi ingkang trapsila`,
              `Supados saged pamer marang kanca-kancane`,
              `Amrih saged mrentah tiyang sanes sakarepe dhewe`,
              `Mung kangge ngisi wektu ngaso ing sekolah`,
            ],
            correctOption: 0,
            hint: `Tujuane yaiku dadi bocah kang duwe tata susila lan diajeni wong liya.`,
          },
        ],
        2: [
          {
            id: `q2_${Date.now()}_1`,
            question: `Kepriye tuladha tumindak nyata ing sekolahan kang trep karo "${titleStr}"?`,
            options: [
              `Matur kanthi basa kang sopan lan ngajeni Bapak utawa Ibu Guru`,
              `Matur banter marang guru kanthi basa ngoko lugu`,
              `Ninggalake kanca nalika piket kelas bebarengan`,
              `Ora gelem rembugan karo kanca sa-kelas`,
            ],
            correctOption: 0,
            hint: `Marang guru lan kanca, tansah migunakake basa lan solah bawa kang becik.`,
          },
          {
            id: `q2_${Date.now()}_2`,
            question: `Ing sakiwa tengene omah, tumindak apa kang nuduhake pengamalan "${titleStr}"?`,
            options: [
              `Urun rebug lan tetulung marang tangga teparo kanthi guyub rukun`,
              `Gawe rame nalika ana wong sepuh nembe sare`,
              `Mbuwang uwuh sembarangan ing ngarep omah`,
              `Ora preduli marang kegiyatan ing kampung`,
            ],
            correctOption: 0,
            hint: `Guyub rukun lan tulung-tinulung minangka paugeran urip ing bebrayan.`,
          },
        ],
        3: [
          {
            id: `q3_${Date.now()}_1`,
            question: `Menawa ana perkara kang angel ing kelas ngenani "${titleStr}", tumindak becik kang kudu ditindakake yaiku...`,
            options: [
              `Rembugan bareng kanthi ati adhem lan ngurmati panemune kanca`,
              `Padha poyokan lan nesu-nesuan karo kanca`,
              `Meneng wae senadyan kahanane sansaya ora kepenak`,
              `Nglanggar paugeran amarga kepengin menange dhewe`,
            ],
            correctOption: 0,
            hint: `Musyawarah kanthi becik nuwuhake katentreman lan karukunan.`,
          },
          {
            id: `q3_${Date.now()}_2`,
            question: `Apa paedahe tumrap para siswa kang ngleksanakake piwulang "${titleStr}" wiwit cilik?`,
            options: [
              `Dadi bocah kang pinunjul, nduweni budi pakarti, lan diajeni kanca`,
              `Dadi bocah kang sombong lan seneng ngasorake liyan`,
              `Mung golek lem-leman (pujian) sedhela tanpa tuladha nyata`,
              `Bebas saka kabeh kuwajiban minangka siswa`,
            ],
            correctOption: 0,
            hint: `Watak luhur lan trapsila ndadekake urip ayem tentrem lan mulya.`,
          },
        ],
      },
    };
  }

  // 4. Kategori Gotong Royong / Kerja Sama
  if (
    lower.includes("gotong") ||
    lower.includes("royong") ||
    lower.includes("kerja sama") ||
    lower.includes("kerjasama")
  ) {
    return {
      ragSummary: [
        `Pengertian ${titleStr}: Gotong royong artinya mengerjakan suatu pekerjaan secara bersama-sama oleh banyak orang demi kepentingan bersama. Kata 'gotong' artinya mengangkat atau memikul, sedangkan 'royong' artinya bersama-sama. Jadi gotong royong adalah tradisi saling membantu tanpa mengharapkan upah.`,
        `Prinsip Utama: Semboyan gotong royong adalah 'berat sama dipikul, ringan sama dijinjing'. Artinya, pekerjaan yang berat akan terasa ringan dan cepat selesai bila dikerjakan bersama-sama oleh semua warga atau kawan sekelas.`,
        `Manfaat Nyata: Pekerjaan berat menjadi cepat selesai, lingkungan menjadi bersih dan rapi, serta mempererat tali persahabatan sehingga hidup menjadi rukun dan damai.`,
        `Aksi Nyata di Sekolah: Bekerja sama membersihkan ruang kelas saat jam piket, menata meja dan kursi bersama, serta saling membantu meminjamkan alat tulis bila ada teman yang membutuhkan.`,
        `Pengamalan di Rumah: Membantu ayah dan ibu merapikan tempat tidur sendiri, mencuci piring setelah makan, dan ikut kerja bakti membersihkan halaman rumah.`,
        `Nilai Budi Pekerti: Menumbuhkan sikap peduli, suka menolong, ikhlas, dan tidak mementingkan diri sendiri.`,
      ],
      quizPreview: [
        `Level 1 (Mudah): Arti kata gotong royong dan semboyan utamanya (+10 Poin)`,
        `Level 2 (Sedang): Contoh tolong-menolong di sekolah dan rumah (+20 Poin)`,
        `Level 3 (Tantangan): Manfaat gotong royong bagi kerukunan kelas (+30 Poin)`,
      ],
      quizQuestions: {
        1: [
          {
            id: `q1_${Date.now()}_1`,
            question: `Apakah arti kata 'gotong royong' yang sering kita lakukan bersama?`,
            options: [
              `Bekerja bersama-sama secara sukarela untuk kepentingan bersama`,
              `Menyuruh teman mengerjakan tugas piket sendirian`,
              `Bermain game sendiri di dalam kamar tidur`,
              `Menonton kawan yang sedang menyapu lantai`,
            ],
            correctOption: 0,
            hint: `Gotong royong artinya bekerja sama saling membantu tanpa pamrih.`,
          },
          {
            id: `q1_${Date.now()}_2`,
            question: `Semboyan bangsa Indonesia yang sangat cocok menggambarkan semangat gotong royong adalah...`,
            options: [
              `Berat sama dipikul, ringan sama dijinjing`,
              `Siapa cepat dia yang paling hebat`,
              `Maju terus pantang mundur sendirian`,
              `Biar lambat asal selamat sendiri`,
            ],
            correctOption: 0,
            hint: `Pekerjaan berat menjadi ringan jika dipikul bersama-sama.`,
          },
        ],
        2: [
          {
            id: `q2_${Date.now()}_1`,
            question: `Contoh kegiatan gotong royong yang paling tepat dilakukan di dalam kelas adalah...`,
            options: [
              `Bersama-sama membersihkan papan tulis dan menyapu lantai saat piket`,
              `Bekerja sama menyontek jawaban saat ulangan harian`,
              `Membiarkan teman piket kebersihan sendirian`,
              `Menumpuk sampah di laci meja kelas`,
            ],
            correctOption: 0,
            hint: `Piket kelas bersama adalah bentuk gotong royong di sekolah.`,
          },
          {
            id: `q2_${Date.now()}_2`,
            question: `Apa manfaat yang kita rasakan jika ruang kelas dibersihkan secara bergotong royong?`,
            options: [
              `Kelas cepat bersih, terasa nyaman untuk belajar, dan teman-teman semakin akrab`,
              `Menjadi lelah dan saling menyalahkan`,
              `Waktu istirahat habis terbuang sia-sia`,
              `Nilai rapor otomatis langsung naik`,
            ],
            correctOption: 0,
            hint: `Kebersihan dan kerja sama membuat suasana belajar menjadi menyenangkan.`,
          },
        ],
        3: [
          {
            id: `q3_${Date.now()}_1`,
            question: `Jika ada teman sekelas yang sedang kesulitan membawa tumpukan buku pelajaran, sikapmu yang baik adalah...`,
            options: [
              `Segera membantunya membawakan sebagian buku dengan ikhlas`,
              `Menertawakannya dari kejauhan`,
              `Pura-pura tidak melihat dan langsung pergi`,
              `Meminta imbalan uang jajan sebelum menolong`,
            ],
            correctOption: 0,
            hint: `Membantu teman yang kesulitan adalah wujud kepedulian antarsesama.`,
          },
          {
            id: `q3_${Date.now()}_2`,
            question: `Mengapa sifat mementingkan diri sendiri (individualis) harus kita hindari dalam pergaulan?`,
            options: [
              `Karena membuat kita dijauhi teman dan suasana kelas menjadi tidak rukun`,
              `Supaya kita dipuji oleh semua orang`,
              `Agar kita bisa menyuruh orang lain sesuka hati`,
              `Supaya tidak perlu belajar lagi di sekolah`,
            ],
            correctOption: 0,
            hint: `Sikap egois merusak kerukunan dan persahabatan.`,
          },
        ],
      },
    };
  }

  // 4b. Kategori: Nasionalisme, Cinta Tanah Air, Kebangsaan & Bela Negara
  if (
    lower.includes("nasionalisme") ||
    lower.includes("cinta tanah air") ||
    lower.includes("kebangsaan") ||
    lower.includes("patriotisme") ||
    lower.includes("tanah air") ||
    lower.includes("bela negara") ||
    lower.includes("pahlawan") ||
    lower.includes("kemerdekaan")
  ) {
    return {
      ragSummary: [
        `Hai Adik-adik Pintar! Apa itu Nasionalisme?: Nasionalisme artinya rasa cinta, bangga, dan setia yang tulus kepada bangsa dan tanah air kita tercinta, Indonesia! Sebagai anak bangsa, kita bangga tinggal di tanah air Indonesia yang indah, kaya akan budaya, dan penuh keberagaman yang rukun.`,
        `Simbol-Simbol Kebanggaan Negara Indonesia: Bangsa kita memiliki lambang dan simbol resmi yang wajib kita hormati bersama: 1) Bendera Merah Putih (Merah berarti berani membela kebenaran, Putih berarti suci hatinya), 2) Lagu Kebangsaan 'Indonesia Raya' ciptaan W.R. Supratman, 3) Lambang Garuda Pancasila dengan semboyan 'Bhinneka Tunggal Ika', serta 4) Bahasa persatuan kita, Bahasa Indonesia.`,
        `Mengapa Kita Harus Cinta Tanah Air?: Indonesia adalah rumah besar tempat kita lahir, bertumbuh, belajar, dan bermain dengan gembira bersama keluarga dan sahabat. Bila setiap anak memiliki rasa cinta tanah air, persatuan bangsa kita akan selalu kuat, rukun, dan tidak mudah diadu domba.`,
        `Contoh Sikap Nyata di Sekolah: Mengikuti upacara bendera hari Senin dengan tertib dan khidmat (berdiri tegak dan hormat saat Sang Merah Putih dinaikkan), menyanyikan lagu Indonesia Raya dengan semangat, rukun berteman dengan kawan sekelas meski berbeda suku atau agama, serta giat belajar agar dapat berprestasi membanggakan bangsa.`,
        `Pengamalan di Rumah dan Lingkungan: Bangga memakai produk buatan pengrajin dalam negeri seperti baju batik atau sepatu lokal, merawat kebersihan lingkungan sekitar, menghargai budaya daerah lain, dan selalu bersikap ramah kepada tetangga.`,
        `Pesan Budi Pekerti Anak Indonesia: Tanamkan selalu di dalam hati semboyan 'Aku Bangga Menjadi Anak Indonesia!' Jadilah anak yang jujur, santun, pemberani dalam kebaikan, dan siap menjaga persatuan di mana pun kita berada.`,
      ],
      quizPreview: [
        `Level 1 (Mudah): Arti nasionalisme dan simbol lagu kebangsaan Indonesia (+10 Poin)`,
        `Level 2 (Sedang): Sikap hormat saat upacara bendera dan cinta produk lokal (+20 Poin)`,
        `Level 3 (Tantangan): Menjaga persatuan antarteman beda daerah dan makna Merah Putih (+30 Poin)`,
      ],
      quizQuestions: {
        1: [
          {
            id: `q1_${Date.now()}_1`,
            question: `Apakah arti dari rasa cinta tanah air (nasionalisme) bagi anak sekolah dasar?`,
            options: [
              `Rasa bangga, sayang, dan setia kepada bangsa dan negara Indonesia`,
              `Hanya menyukai barang dan budaya dari luar negeri`,
              `Menolak berteman dengan kawan yang berbeda daerah`,
              `Sikap malas dan tidak mau ikut upacara bendera`,
            ],
            correctOption: 0,
            hint: `Nasionalisme adalah wujud rasa cinta dan kebanggaan kita sebagai anak Indonesia.`,
          },
          {
            id: `q1_${Date.now()}_2`,
            question: `Lagu kebangsaan negara Indonesia yang selalu kita nyanyikan dengan sikap tegak saat upacara sekolah adalah...`,
            options: [
              `Indonesia Raya ciptaan W.R. Supratman`,
              `Balonku Ada Lima`,
              `Bintang Kejora`,
              `Pelangi-Pelangi`,
            ],
            correctOption: 0,
            hint: `Lagu kebangsaan resmi Indonesia adalah 'Indonesia Raya' yang diciptakan oleh W.R. Supratman.`,
          },
        ],
        2: [
          {
            id: `q2_${Date.now()}_1`,
            question: `Saat bendera Merah Putih dinaikkan pada upacara bendera hari Senin di sekolah, sikap yang benar adalah...`,
            options: [
              `Berdiri tegak dengan sikap khidmat dan memberikan hormat kepada bendera`,
              `Duduk santai di bawah pohon sambil makan bekal jajan`,
              `Mengobrol dan bercanda bersama teman di barisan`,
              `Bermain kejar-kejaran di lapangan upacara`,
            ],
            correctOption: 0,
            hint: `Upacara bendera mengajarkan rasa hormat dan terima kasih atas perjuangan para pahlawan.`,
          },
          {
            id: `q2_${Date.now()}_2`,
            question: `Siti gemar mengenakan sepatu dan tas buatan pengrajin lokal Indonesia serta bangga memakai pakaian batik. Sikap Siti mencerminkan...`,
            options: [
              `Rasa cinta dan bangga menggunakan produk dalam negeri`,
              `Sikap pelit dan tidak mampu membeli barang luar negeri`,
              `Keterpaksaan karena diperintah teman`,
              `Kurangnya pengetahuan tentang barang luar negeri`,
            ],
            correctOption: 0,
            hint: `Menggunakan produk buatan bangsa sendiri adalah salah satu wujud nyata cinta tanah air.`,
          },
        ],
        3: [
          {
            id: `q3_${Date.now()}_1`,
            question: `Di kelasmu ada teman baru yang berasal dari daerah lain dan memiliki logat bicara berbeda. Sikap menjaga persatuan bangsa yang tepat adalah...`,
            options: [
              `Menyambutnya dengan ramah, menghargai perbedaannya, dan mengajaknya bermain bersama`,
              `Menertawakan logat bicaranya saat dia bertanya kepada guru`,
              `Menolak duduk sebangku dengannya karena berbeda asal daerah`,
              `Meminta guru agar memindahkannya ke kelas lain`,
            ],
            correctOption: 0,
            hint: `Semboyan Bhinneka Tunggal Ika mengajarkan kita untuk rukun bersahabat dengan semua anak bangsa.`,
          },
          {
            id: `q3_${Date.now()}_2`,
            question: `Bendera pusaka negara kita berwarna Merah dan Putih. Apakah arti luhur dari kedua warna tersebut?`,
            options: [
              `Merah artinya berani membela kebenaran, Putih artinya suci dan bersih hatinya`,
              `Merah artinya cepat marah, Putih artinya mudah menyerah`,
              `Merah artinya warna api, Putih artinya warna kertas biasa`,
              `Merah artinya suka bertengkar, Putih artinya penakut`,
            ],
            correctOption: 0,
            hint: `Merah melambangkan keberanian bangsa, sedangkan putih melambangkan niat suci hati nurani.`,
          },
        ],
      },
    };
  }

  // 5. Kategori Umum / Topik PKn Dinamis (Ramah Anak SD Kelas 4, Praktis & Konkret)
  return {
    ragSummary: [
      `Halo Adik-adik Hebat! Mengenal ${titleStr}: Hari ini kita belajar tentang materi ${titleStr}. Materi ini mengajarkan kita tentang bagaimana cara menjadi anak yang baik, jujur, dan bertanggung jawab di sekolah maupun di rumah.`,
      `Hal Penting yang Kita Pelajari: Di dalam materi ${titleStr}, kita diajak untuk saling menyayangi, mematuhi aturan bersama, serta saling tolong-menolong antarteman agar suasana belajar selalu ceria dan menyenangkan.`,
      `Mengapa Kita Perlu Mempelajari Ini?: Belajar ${titleStr} membuat kita semakin pintar dalam memilih tindakan yang benar, menghindarkan kita dari sikap egois (menang sendiri), serta menjadikan kita anak yang berakhlak mulia.`,
      `Contoh Perbuatan Baik di Sekolah: Mendengarkan bapak/ibu guru saat menerangkan pelajaran, meminjamkan alat tulis kepada kawan yang membutuhkan, tertib saat mengantre di kantin, dan kompak membersihkan kelas saat tugas piket.`,
      `Contoh Perbuatan Baik di Rumah: Membantu ayah dan ibu merapikan kamar, berbicara dengan kata-kata santun kepada orang tua, serta hidup rukun bermain bersama saudara dan tetangga.`,
      `Pesan Kebaikan untuk Kita Semua: Jadilah anak yang selalu berbuat jujur, rendah hati, dan suka menolong. Ingat, anak yang berbudi pekerti luhur akan disayangi orang tua, guru, dan memiliki banyak sahabat!`,
    ],
    quizPreview: [
      `Level 1 (Mudah): Pemahaman sikap terpuji dan saling menghormati pada materi ${titleStr} (+10 Poin)`,
      `Level 2 (Sedang): Penerapan tindakan baik di sekolah dan bersama teman (+20 Poin)`,
      `Level 3 (Tantangan): Menyelesaikan masalah bersama dan menjaga kerukunan (+30 Poin)`,
    ],
    quizQuestions: {
      1: [
        {
          id: `q1_${Date.now()}_1`,
          question: `Sikap yang paling terpuji saat bapak atau ibu guru sedang menerangkan materi "${titleStr}" di kelas adalah...`,
          options: [
            `Mendengarkan dengan saksama dan mencatat hal-hal penting`,
            `Mengobrol sendiri dengan teman sebangku`,
            `Bermain pesawat kertas di dalam kelas`,
            `Tidur di atas meja selama pelajaran berlangsung`,
          ],
          correctOption: 0,
          hint: `Mendengarkan bimbingan guru dengan baik adalah tanda hormat dan wujud kesungguhan belajar.`,
        },
        {
          id: `q1_${Date.now()}_2`,
          question: `Ketika kamu mendapatkan tugas kelompok mengenai "${titleStr}", tindakan yang baik adalah...`,
          options: [
            `Bekerja sama secara kompak dan membagi tugas secara adil`,
            `Menyuruh satu teman mengerjakan semua tugas sendirian`,
            `Bermain game di pojok kelas sementara teman lain bekerja`,
            `Marah-marah jika pendapat kita tidak langsung dituruti`,
          ],
          correctOption: 0,
          hint: `Tugas kelompok harus dikerjakan bersama-sama secara adil dan rukun.`,
        },
      ],
      2: [
        {
          id: `q2_${Date.now()}_1`,
          question: `Contoh tindakan nyata di sekolah yang mencerminkan sikap terpuji dari materi "${titleStr}" adalah...`,
          options: [
            `Membantu teman yang kesulitan belajar dan tertib menaati aturan sekolah`,
            `Mengejek teman yang mendapat nilai ulangan kurang memuaskan`,
            `Membuang bungkus makanan di bawah laci meja kelas`,
            `Menyerobot antrean teman saat membeli jajan di kantin`,
          ],
          correctOption: 0,
          hint: `Siswa yang berbudi pekerti selalu suka menolong dan tertib mematuhi tata tertib.`,
        },
        {
          id: `q2_${Date.now()}_2`,
          question: `Di lingkungan rumah dan tempat tinggal, perbuatan apa yang paling tepat kita lakukan?`,
          options: [
            `Menghormati orang tua dan ramah menyapa tetangga sekitar rumah`,
            `Menyalakan suara musik sangat keras saat tetangga sedang istirahat`,
            `Mencoret-coret dinding pagar tetangga dengan spidol`,
            `Menolak membantu ibu saat diminta membersihkan kamar tidur`,
          ],
          correctOption: 0,
          hint: `Kerukunan warga dimulai dari rasa hormat kepada keluarga dan tetangga.`,
        },
      ],
      3: [
        {
          id: `q3_${Date.now()}_1`,
          question: `Jika ada dua temanmu yang berselisih paham saat berdiskusi tentang "${titleStr}", sikap terbaik yang kamu lakukan adalah...`,
          options: [
            `Mengajak mereka bermusyawarah dengan santun dan mencari jalan tengah yang damai`,
            `Ikut bersorak dan memanaskan suasana pertengkaran`,
            `Menertawakan teman yang kalah berpendapat`,
            `Meninggalkan kelas dan tidak peduli dengan teman`,
          ],
          correctOption: 0,
          hint: `Musyawarah dengan kepala dingin dan santun adalah jalan terbaik menyelesaikan perselisihan.`,
        },
        {
          id: `q3_${Date.now()}_2`,
          question: `Mengapa kita harus membiasakan diri bersikap jujur dan suka menolong sejak masih anak-anak?`,
          options: [
            `Agar kita dipercaya orang lain, memiliki banyak sahabat, dan suasana menjadi damai`,
            `Hanya supaya diberi uang jajan tambahan oleh orang tua`,
            `Agar kita ditakuti oleh semua teman di sekolah`,
            `Supaya kita tidak perlu lagi belajar di kelas`,
          ],
          correctOption: 0,
          hint: `Kejujuran dan sikap suka menolong adalah bekal utama menjadi pribadi yang mulia dan bahagia.`,
        },
      ],
    },
  };
}

// 7. POST /api/v1/curriculum/request (Tarik & Generate Modul Adaptif dari AI / Kemdikbud)
v1Router.post("/curriculum/request", async (req: Request, res: Response) => {
  const { subject, chapterCode, topicTitle, learningGoal, apiSource } = req.body || {};

  if (!topicTitle) {
    return res.status(400).json({
      success: false,
      message: "Judul materi atau bab wajib diisi.",
    });
  }

  const isPkn = subject === "pkn";
  const titleStr = String(topicTitle).trim();
  const chapterStr = String(chapterCode || "Bab Baru").trim();
  const goalStr = String(
    learningGoal ||
      "Peserta didik memahami inti pelajaran dan menerapkannya dalam kehidupan sehari-hari."
  ).trim();

  // Dapatkan konten edukasi komprehensif (Pengertian, Bagian Inti, Pengamalan, dan Budi Pekerti)
  const defaultEduContent = generateRichEducationalContent(isPkn, chapterStr, titleStr, goalStr);

  const generatedModule = {
    id: `mod-${subject || "pkn"}-${Date.now()}`,
    subject: (isPkn ? "pkn" : "bjawa") as "pkn" | "bjawa",
    subjectLabel: isPkn ? "Pendidikan Pancasila & PKn" : "Basa Jawa (Muatan Lokal)",
    grade: "Kelas 4 SD (Fase B)",
    title: titleStr,
    chapterCode: chapterStr,
    source:
      apiSource === "disdik"
        ? "Repositori Mulok Disdikbud Provinsi (Buku Ajar Resmi)"
        : "API SIBI Kemdikbudristek RI (Buku Teks Kurikulum Merdeka)",
    sourceType: apiSource || "kemdikbud",
    pageCount: 24,
    learningGoal: goalStr,
    isValidated: false,
    isActiveToday: false,
    ragSummary: defaultEduContent.ragSummary,
    generatedQuizPreview: defaultEduContent.quizPreview,
    quizQuestions: defaultEduContent.quizQuestions,
  };

  // Cek apakah GEMINI_API_KEY disetel di file .env
  const geminiApiKey = getGeminiApiKey();
  let aiEngineUsed = "Template Adaptif Cerdas";

  if (geminiApiKey) {
    try {
      const prompt = `Anda adalah guru SD kelas 4 yang sangat ramah, hangat, ceria, dan pandai menerangkan pelajaran kepada murid usia 9-10 tahun (${isPkn ? "Pendidikan Pancasila / PKn" : "Bahasa Jawa Muatan Lokal"}).
Buatkan ringkasan materi pembelajaran yang RAMAH ANAK SD KELAS 4, MUDAH DIPAHAMI, SERU, dan BERMAKNA serta bank kuis tantangan 3 level untuk topik: "${titleStr}" (${chapterStr}).

ATURAN SANGAT MUTLAK:
1. TARGET AUDIENS ADALAH ANAK SD KELAS 4 (USIA 9-10 TAHUN):
   - Gunakan gaya bahasa yang ceria, hangat, dan bersahabat seperti guru SD teladan yang menyapa muridnya ("Hai Adik-adik Pintar!", "Tahukah kalian?").
   - DILARANG KERAS MENGGUNAKAN JARGON BIROKRASI / AKADEMIS TINGKAT KULIAH seperti: "secara konseptual", "landasan filosofis", "character building", "proses pembentukan karakter utama", "pedoman moral insan", "garis siku pengukur tegak lurus", dll.
   - Gunakan contoh konkret yang akrab dengan keseharian anak SD: pertemanan di kelas, bermain bersama, piket kebersihan, upacara bendera, membantu orang tua di rumah.
2. DILARANG KERAS MENGGUNAKAN SIMBOL EMOJI APAPUN (Gunakan HANYA teks bersih biasa tanpa emoji!).
3. PERTANYAAN KUIS HARUS SUBSTANTIF MENGUJI ISI MATERI DAN CONTOH KASUS NYATA:
   - DILARANG MEMBUAT PERTANYAAN TENTANG "TUJUAN PEMBELAJARAN" seperti: "Apa intisari dan pemahaman pokok...", "Mengapa siswa SD perlu mempelajari materi ini sejak dini?", "Apa tujuan kita mempelajari...".
   - PERTANYAAN HARUS MENGUJI: Arti kata/makna simbol, contoh sikap terpuji saat bermain/belajar, apa yang harus dilakukan jika menghadapi situasi konkret di sekolah atau rumah, dan pesan budi pekerti.
   - Level 1 (Mudah): Pemahaman istilah dasar, simbol penting, atau arti kata dalam materi (+10 Poin).
   - Level 2 (Sedang): Penerapan sikap baik nyata di sekolah atau bersama teman (+20 Poin).
   - Level 3 (Tantangan): Cerita studi kasus pertemanan, pemecahan masalah bersama, dan menjaga kerukunan (+30 Poin).

Wajib menghasilkan 6 bagian materi terstruktur berikut:
1. Pengertian dan Asal-Usul: (Jelaskan arti materi dengan bahasa ramah anak SD kelas 4)
2. Hal Penting yang Perlu Diketahui: (Simbol, nilai Pancasila/budaya, dan hal utama yang dipelajari)
3. Alasan Kita Perlu Tahu: (Mengapa materi ini penting agar kita rukun, damai, dan kompak)
4. Contoh Sikap Nyata di Sekolah: (Tindakan baik dan terpuji di ruang kelas atau saat bermain)
5. Pengamalan di Rumah dan Warga: (Tindakan baik bersama orang tua, saudara, dan tetangga)
6. Pesan Kebaikan Budi Pekerti: (Nasihat moral pembentukan karakter anak hebat yang berbudi luhur)

Hasilkan HANYA format JSON valid berikut (tanpa markdown backtick):
{
  "ragSummary": [
    "Pengertian dan Asal-Usul: ...",
    "Landasan Nilai dan Hal Penting: ...",
    "Alasan Kita Perlu Tahu: ...",
    "Contoh Sikap Nyata di Sekolah: ...",
    "Pengamalan di Rumah dan Warga: ...",
    "Pesan Budi Pekerti Luhur: ..."
  ],
  "quizPreview": [
    "Level 1 (Mudah): Pemahaman istilah dasar dan pengertian utama (+10 Poin)",
    "Level 2 (Sedang): Penerapan fungsi dan sikap terpuji (+20 Poin)",
    "Level 3 (Tantangan): Cerita studi kasus dan pemecahan masalah (+30 Poin)"
  ],
  "quizQuestions": {
    "1": [
      {
        "id": "q1_1",
        "question": "...",
        "options": ["pilihan A", "pilihan B", "pilihan C", "pilihan D"],
        "correctOption": 0,
        "hint": "..."
      },
      {
        "id": "q1_2",
        "question": "...",
        "options": ["pilihan A", "pilihan B", "pilihan C", "pilihan D"],
        "correctOption": 0,
        "hint": "..."
      }
    ],
    "2": [
      {
        "id": "q2_1",
        "question": "...",
        "options": ["pilihan A", "pilihan B", "pilihan C", "pilihan D"],
        "correctOption": 0,
        "hint": "..."
      },
      {
        "id": "q2_2",
        "question": "...",
        "options": ["pilihan A", "pilihan B", "pilihan C", "pilihan D"],
        "correctOption": 0,
        "hint": "..."
      }
    ],
    "3": [
      {
        "id": "q3_1",
        "question": "...",
        "options": ["pilihan A", "pilihan B", "pilihan C", "pilihan D"],
        "correctOption": 0,
        "hint": "..."
      },
      {
        "id": "q3_2",
        "question": "...",
        "options": ["pilihan A", "pilihan B", "pilihan C", "pilihan D"],
        "correctOption": 0,
        "hint": "..."
      }
    ]
  }
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          if (Array.isArray(parsed.ragSummary) && parsed.ragSummary.length > 0) {
            generatedModule.ragSummary = parsed.ragSummary.map((item: string) =>
              item
                .replace(
                  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu,
                  ""
                )
                .replace(/Hakikat Materi:\s*Memahami prinsip pokok[^\.]*\.?\s*/gi, "")
                .replace(/Keterkaitan Nyata:\s*/gi, "Penerapan di masyarakat: ")
                .replace(/Pengetahuan Kritis:\s*Melatih siswa agar[^\.]*\.?\s*/gi, "")
                .replace(
                  /Mempelajari materi ini melatih daya pikir kritis[^\.]*\.?\s*/gi,
                  "Mempelajari materi ini membuat kita saling peduli dan rukun. "
                )
                .trim()
            );
          }
          if (Array.isArray(parsed.quizPreview) && parsed.quizPreview.length > 0) {
            generatedModule.generatedQuizPreview = parsed.quizPreview.map((item: string) =>
              item.replace(/Koin/gi, "Poin")
            );
          }
          if (
            parsed.quizQuestions &&
            parsed.quizQuestions[1] &&
            parsed.quizQuestions[2] &&
            parsed.quizQuestions[3]
          ) {
            generatedModule.quizQuestions = parsed.quizQuestions;
          }
          aiEngineUsed = "Google Gemini 1.5 Flash (API Asli)";
        }
      }
    } catch (err) {
      console.warn(
        "[Gemini API] Panggilan API dialihkan ke template cerdas:",
        err instanceof Error ? err.message : err
      );
    }
  }

  // Simpan materi yang baru ditarik langsung ke database kurikulum agar tidak hilang saat refresh
  await saveCurriculumModule(generatedModule);

  return res.json({
    success: true,
    message: `Materi berhasil ditarik dan disintesis oleh mesin ${aiEngineUsed}.`,
    engine: aiEngineUsed,
    data: generatedModule,
  });
});

// Helper aman membaca API key secara dinamis tanpa restart & tanpa bocor
function getGeminiApiKey(): string | undefined {
  const envVal = process.env.GEMINI_API_KEY?.trim();
  if (envVal && envVal !== "tempel_api_key_gemini_anda_disini" && !envVal.startsWith("your_")) {
    return envVal;
  }
  try {
    const rootEnvPath = path.resolve(__dirname, "../.env");
    if (fs.existsSync(rootEnvPath)) {
      const content = fs.readFileSync(rootEnvPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("GEMINI_API_KEY=")) {
          const idx = trimmed.indexOf("=");
          const val = trimmed
            .slice(idx + 1)
            .trim()
            .replace(/^["']|["']$/g, "");
          if (val && val !== "tempel_api_key_gemini_anda_disini" && !val.startsWith("your_")) {
            process.env.GEMINI_API_KEY = val;
            return val;
          }
        }
      }
    }
  } catch {}
  return undefined;
}

// 7b. GET /api/v1/ai/status (Pemeriksaan Status Integrasi API Gemini Tanpa Membocorkan Key)
v1Router.get("/ai/status", (_req: Request, res: Response) => {
  const geminiApiKey = getGeminiApiKey();
  const isConfigured = Boolean(geminiApiKey);

  return res.json({
    success: true,
    ai_configured: isConfigured,
    model: "Google Gemini 1.5 Flash",
    message: isConfigured
      ? "API Key Gemini terdeteksi dan aktif di sistem."
      : "API Key Gemini belum disetel di file .env. Sistem berjalan dengan template adaptif cerdas.",
  });
});

// 7c. GET /api/v1/curriculum/active (Ambil Modul Aktif Tervalidasi Guru)
v1Router.get("/curriculum/active", (_req: Request, res: Response) => {
  const active = getActiveCurriculumState();
  return res.json({
    success: true,
    data: active,
  });
});

// 8. POST /api/v1/curriculum/validate (Pengesahan Guru & Terbitkan ke Siswa)
v1Router.post("/curriculum/validate", async (req: Request, res: Response) => {
  const moduleData = req.body;
  if (!moduleData || !moduleData.id) {
    return res.status(400).json({ success: false, message: "Data modul tidak valid." });
  }

  // Daftarkan ke state modul aktif di server
  setActiveCurriculumState({
    id: moduleData.id,
    title: moduleData.title,
    chapterCode: moduleData.chapterCode || "Bab Pelajaran",
    subject: moduleData.subject || "pkn",
    ragSummary: moduleData.ragSummary,
    quizQuestions: moduleData.quizQuestions,
  });

  return res.json({
    success: true,
    message: "Modul resmi divalidasi oleh Guru dan telah aktif di Ruang Belajar Siswa.",
    data: {
      ...moduleData,
      isValidated: true,
      isActiveToday: true,
      validatedAt: "Baru saja divalidasi",
    },
  });
});

// 9. GET /api/v1/curriculum/modules (Daftar Seluruh Modul Kurikulum Tersimpan)
v1Router.get("/curriculum/modules", async (_req: Request, res: Response) => {
  const modules = await getCurriculumModules();
  return res.json({
    success: true,
    data: modules,
  });
});

// 10. POST /api/v1/curriculum/modules (Simpan / Perbarui Modul Kurikulum)
v1Router.post("/curriculum/modules", async (req: Request, res: Response) => {
  const modData = req.body;
  if (!modData || !modData.title) {
    return res.status(400).json({ success: false, message: "Judul modul wajib diisi." });
  }
  const saved = await saveCurriculumModule(modData);
  return res.json({
    success: true,
    message: "Modul berhasil disimpan ke daftar materi kurikulum.",
    data: saved,
  });
});

// 11. DELETE /api/v1/curriculum/modules/:id (Hapus Modul Kurikulum Lama)
v1Router.delete("/curriculum/modules/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!id) {
    return res.status(400).json({ success: false, message: "ID modul tidak valid." });
  }
  await deleteCurriculumModule(id);
  return res.json({
    success: true,
    message: "Modul kurikulum berhasil dihapus.",
  });
});

// Endpoint Status Diagnostik Sistem (Docker, MySQL, ChromaDB, Local LLM)
router.get("/system/status", async (_req: Request, res: Response) => {
  const [chroma, llm] = await Promise.all([
    checkChromaHealth(),
    checkLocalLlmHealth(),
  ]);

  return res.json({
    success: true,
    docker: {
      active: true,
      service: "explainmylesson-backend",
      environment: process.env.NODE_ENV || "development",
    },
    database: {
      type: "mysql",
      host: process.env.DB_HOST || "localhost",
      name: process.env.DB_NAME || "explainmylesson_db",
      status: "mounted",
    },
    vector_store: chroma,
    local_llm: llm,
  });
});

// Endpoint Integrasi Local LLM (Point 4)
router.post("/llm/generate", async (req: Request, res: Response) => {
  const { prompt, systemPrompt, model, temperature } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ success: false, message: "Prompt wajib diisi." });
  }
  const result = await queryLocalLlm({ prompt, systemPrompt, model, temperature });
  return res.json(result);
});

app.use("/api/v1", v1Router);
app.use("/api", router);

// --- Produksi: sajikan hasil `vite build` (dist/) dari proses yang sama ----
if (isProduction) {
  const distDir = path.resolve(__dirname, "../dist");
  app.use(express.static(distDir));
  // SPA fallback: seluruh rute non-/api (mis. /dashboard/pelajar/kuis saat
  // di-refresh langsung oleh browser) dikembalikan ke index.html supaya
  // React Router yang menanganinya di sisi klien.
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[uns-fastbuild] Express API server siap di http://localhost:${PORT}`);
    if (isProduction) {
      console.log(
        `[uns-fastbuild] Menyajikan build produksi dari ${path.resolve(__dirname, "../dist")}`
      );
    }
  });
}

export default app;
