# Backend Laravel 11 — ExplainMyLesson AI (REST API v1)

Modul backend ini menyediakan endpoint REST API v1 untuk menghubungkan React.js Frontend dengan Laravel 11.

## Daftar Endpoint yang Sudah Disediakan:
1. GET  /api/v1/landing/stats — Metrik publik landing page
2. POST /api/v1/auth/register — Registrasi akun baru (Pelajar / Pengajar)
3. POST /api/v1/auth/login    — Login email/password & 1-Click Quick Demo Login
4. GET  /api/v1/auth/session  — Verifikasi sesi aktif JWT untuk Protected Route
5. POST /api/v1/auth/logout   — Logout & blacklist token JWT

## Cara Menjalankan di Komputer:
1. Masuk ke folder backend laravel
   cd laravel-backend
2. Jalankan migrasi database
   php artisan migrate
3. Jalankan server lokal Laravel
   php artisan serve
Server Laravel akan aktif di http://127.0.0.1:8000.
