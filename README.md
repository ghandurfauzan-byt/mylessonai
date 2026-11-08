# ExplainMyLesson AI — Platform Pembelajaran Cerdas & Adaptif Berbasis RAG & Containerization Docker

**Dokumen Spesifikasi, Arsitektur Front-End, Back-End & Repositori Resmi**  
**Program Studi D3 Teknik Informatika Kampus Madiun — Sekolah Vokasi Universitas Sebelas Maret (UNS)**

---

### Tim Pengembang & Pengampu
- **Penyusun 1:** Ghandur Fauzan Ngauf Hisam (NIM: V3925024)
- **Penyusun 2:** Ridho Asykuri (NIM: V3925015)
- **Dosen Pengampu:** Darmawan Lahru Riatma, S.Kom., M.MT (NIP: 1991091420200801)
- **Mata Kuliah:** Praktikum Pemrograman Front-End & Evaluasi Backend
- **Nama Stack Docker:** `ghanduraja` (5 Kontainer Terintegrasi di Docker Desktop)

---

## 1. Tentang Aplikasi: Web Ini Ngapain Aja?

**ExplainMyLesson AI** adalah platform pembelajaran cerdas adaptif berbasis kecerdasan buatan (AI) yang dirancang khusus untuk memecahkan masalah kelebihan beban belajar (*cognitive overload*) pada siswa/mahasiswa saat mempelajari buku ajar atau modul perkuliahan yang sangat tebal (100–300+ halaman, seperti PKn, Bahasa Jawa, maupun buku ajar vokasi).

### 🌟 Fitur & Peran Utama Web:
1. **Peringkasan Materi Cerdas (RAG AI Pipeline):**
   * Mengubah modul tebal menjadi **Ringkasan Adaptif** yang singkat dan padat.
   * Membuat **Analogi Dunia Nyata** (perumpamaan konsep rumit menjadi cerita sehari-hari yang mudah dibayangkan anak).
   * Membentuk **Mind Map Konsep Hierarkis** visual.
   * Menyusun **Contoh Soal Kontekstual** lengkap dengan pembahasan.
2. **Robot Pintar Bersuara (Audio Dongeng Interaktif):**
   * Dilengkapi fitur Text-to-Speech (TTS) bersuara ceria yang mendongengkan ringkasan materi secara lisan kepada siswa.
3. **Kuis Adaptif 3-Level & Gamifikasi:**
   * Tantangan kuis interaktif dengan 3 tingkat kesulitan:
     * **Level 1 (Mudah):** Uji pemahaman dasar (+10 Poin XP).
     * **Level 2 (Sedang):** Uji analitis (+20 Poin XP, terbuka setelah Level 1 tuntas).
     * **Level 3 (Sulit):** Uji pemecahan masalah (+30 Poin XP, terbuka setelah Level 2 tuntas).
   * Papan peringkat, perolehan koin prestasi, dan lencana (*badge*) kelulusan materi.
4. **Dua Ruang Pengguna (Multi-Role):**
   * 🎓 **Ruang Siswa / Pelajar (`/dashboard/pelajar`):** Tempat siswa membaca modul, mendengarkan dongeng robot cerdas, mengerjakan kuis adaptif, melihat progres belajar, dan memantau poin prestasi.
   * 👨‍🏫 **Meja Guru / Pengajar (`/dashboard/pengajar`):** Tempat guru/dosen mengunggah modul kuliah (PDF), melihat grafik analitik nilai rata-rata kelas, mendeteksi otomatis siswa yang butuh bimbingan remedial (nilai < 60), mengelola data kelas, serta mengekspor laporan pemahaman (PDF & Excel/CSV).

---

## 2. Teknologi Front-End (Bahasa, Framework, & Cara Kerja)

Front-end dibangun secara modern dengan performa tinggi, tampilan responsif mobile-first, dan interaktivitas yang mulus:

* **Bahasa Pemrograman:** **TypeScript (Strict Mode)** dan **JavaScript Modern (ES2024+)**.
* **Framework Utama:** **Next.js (App Router Shell)** yang membungkus **React 18 SPA (Single Page Application)**.
  * *Mengapa SPA + CSR?* Halaman kuis dan dashboard membutuhkan navigasi instan tanpa refresh halaman (*zero-reload*), animasi interaktif, timer soal, dan responsivitas suara yang sangat cepat.
* **Styling & Tampilan:**
  * **Tailwind CSS v3:** Utility-first CSS untuk desain modern bertema ramah anak (SD Pintar) dengan warna dinamis, kartu interaktif, dan dukungan responsif HP/tablet/laptop.
  * **Radix UI Primitives (Shadcn UI):** Komponen modal portal, dialog, dan dropdown yang aksesibel (WAI-ARIA).
  * **Lucide React Icons:** Set ikon visual cerah untuk navigasi dan tombol aksi.
* **Manajemen State (State Management):**
  * **Client UI State:** Dikelola menggunakan **Zustand** (`src/lib/store/useUIStore.ts`) untuk mengatur tema, saldo koin prestasi, status buka-tutup modal, dan kontrol suara robot.
  * **Server State & Caching:** Dikelola menggunakan **TanStack Query v5 (React Query)** untuk auto-caching data API, sinkronisasi sesi latar belakang, dan revalidasi data kuis.
* **Audio Engine:** **Web Speech Synthesis API** terintegrasi dengan aksen bahasa Indonesia ceria untuk narasi materi.
* **Routing:** **React Router v6** dengan penjaga rute khusus (**`ProtectedRoute.tsx`**) yang memverifikasi sesi login sebelum mengizinkan masuk ke dashboard.
* **Kontainer Docker:** Dikemas dalam image `explainmylesson-frontend:latest` (port `3000:3000`) berbasis `node:20-alpine`.

---

## 3. Teknologi Back-End (Bahasa, Framework, Database, & AI)

Back-end bertanggung jawab menangani pemrosesan data, autentikasi aman, transaksi basis data, integrasi vector store, dan orkestrasi model AI:

* **Bahasa Pemrograman:** **TypeScript** di atas runtime **Node.js 20 LTS (Alpine Linux)**.
* **Framework:** **Express.js API Server** (berjalan pada port `4000:4000`).
* **Validasi Skema (End-to-End Type Safety):**
  * Menggunakan pustaka **Zod** (`shared/schema.ts`). Skema data yang sama dipakai bersama oleh frontend dan backend sehingga mencegah kesalahan format payload request/response.
* **Sistem Keamanan & Autentikasi (Dual Authentication):**
  * **HTTP-Only Cookies:** Cookie sesi `uns_session` dengan masa aktif 8 jam, `SameSite=Lax`, dan proteksi anti-XSS.
  * **Bearer Token JWT:** Token otentikasi disimpan di `localStorage` klien dan dikirim via header `Authorization: Bearer <token>` untuk kompatibilitas penuh dengan Web dan Mobile Android.
  * **Password Encryption:** Hashing password menggunakan algoritma **Bcrypt** dengan salt 10 putaran (`bcryptjs`).
* **Database Relasional (RDBMS):**
  * **MySQL Server 8.0** (`explainmylesson-mysql`, port 3306) di dalam container Docker dengan persistent volume `mysql_data` agar data tidak hilang.
  * Skrip inisialisasi otomatis (`backend/database/init.sql`) yang otomatis membuat tabel saat pertama kali dijalankan.
* **AI & Retrieval-Augmented Generation (RAG):**
  * **Text Chunking:** Memotong dokumen tebal menjadi potongan 500 karakter dengan overlap kontekstual.
  * **Vector Database:** **ChromaDB** (`explainmylesson-chromadb`, port 8000) untuk menyimpan embedding numerik dan melakukan pencarian kemiripan semantik (*semantic similarity search*).
  * **Local LLM Engine:** **Ollama** (`explainmylesson-ollama`, port 11434, model Llama3) yang memproses inferensi AI lokal secara gratis tanpa tergantung kuota API cloud luar.
* **Kontainer Docker:** Dikemas dalam image `explainmylesson-backend:latest` (port `4000:4000`, hanya 354 MB).

---

## 4. Ekosistem 5 Kontainer Docker (Stack: `ghanduraja`)

Seluruh service saling terhubung dalam satu jaringan bridge lokal Docker Desktop:

| Nama Container | Docker Image | Port Binding | Ukuran | Fungsi Utama |
| :--- | :--- | :---: | :---: | :--- |
| **`explainmylesson-frontend`** | `explainmylesson-frontend:latest` | `3000:3000` | 1.54 GB | Web Interface UI (Next.js App Router / React) |
| **`explainmylesson-backend`** | `explainmylesson-backend:latest` | `4000:4000` | 354 MB | Express.js TypeScript API Core Server |
| **`explainmylesson-mysql`** | `mysql:8.0` | `3306:3306` | 1.1 GB | Database MySQL 8.0 + Auto Inisialisasi `init.sql` |
| **`explainmylesson-chromadb`** | `chromadb/chroma:latest` | `8000:8000` | 826 MB | Vector Store Database untuk RAG Chunking |
| **`explainmylesson-ollama`** | `explainmylesson-ollama:latest` | `11434:11434` | 193 MB | Local LLM Engine (Llama3 AI Service) |

### 🚀 Cara Menjalankan dengan Docker:
```bash
# 1. Jalankan seluruh container sekaligus
docker compose up -d

# 2. Cek status container
docker compose ps

# 3. Pantau log backend secara langsung
docker compose logs -f backend
```

---

## 5. Matriks Kebutuhan Fungsional (FR-01 s/d FR-22 — 100% Selesai)

| ID | Fitur | Status | Deskripsi Implementasi pada Web |
| :--- | :--- | :---: | :--- |
| **FR-01** | Registrasi Akun | **100%** | Pendaftaran mandiri siswa dengan validasi Zod dan hashing password Bcrypt. |
| **FR-02** | Login Multi-Role | **100%** | Pemisahan hak akses Siswa/Pelajar dan Guru/Pengajar (dilengkapi tombol 1-Klik Demo). |
| **FR-03** | Logout Sesi | **100%** | Pembersihan token dan cookie sesi serta redirect otomatis ke halaman login. |
| **FR-04** | Upload Materi Publik | **100%** | Guru dapat mengunggah modul ajar (PDF) yang langsung dapat diakses seluruh kelas. |
| **FR-05** | Upload Materi Privat | **100%** | Siswa dapat mengunggah catatan belajar mandiri yang hanya bisa dilihat sendiri. |
| **FR-06** | Chunking Teks RAG | **100%** | Pemotongan otomatis materi kuliah ke segmen 500 karakter sebelum diindeks ke ChromaDB. |
| **FR-07** | Ringkasan Esensial AI | **100%** | Meringkas materi puluhan halaman menjadi poin-poin inti yang mudah dimengerti. |
| **FR-08** | Analogi Dunia Nyata | **100%** | AI menjelaskan materi dengan perumpamaan cerita ramah anak (contoh: gotong royong diibaratkan bermain bola). |
| **FR-09** | Mind Map Hierarkis | **100%** | Visualisasi pohon konsep hubungan antar materi pembelajaran. |
| **FR-10** | Contoh Soal Kontekstual | **100%** | Pembuatan bank latihan soal otomatis beserta kunci dan pembahasannya. |
| **FR-11** | Kuis Level 1: Mudah | **100%** | Soal pilihan ganda pemahaman dasar (+10 Poin XP, 3 kali kesempatan). |
| **FR-12** | Kuis Level 2: Sedang | **100%** | Soal pilihan ganda tingkat analitis (+20 Poin XP, terbuka setelah Level 1 lolos). |
| **FR-13** | Kuis Level 3: Sulit | **100%** | Soal pemecahan masalah kompleks (+30 Poin XP, terbuka setelah Level 2 lolos). |
| **FR-14** | Gamifikasi & Poin XP | **100%** | Papan skor live, akumulasi koin, dan lencana juara kelas. |
| **FR-15** | Dashboard Pengajar | **100%** | Grafik analitik rata-rata pemahaman siswa per bab dan rekap hasil kuis. |
| **FR-16** | Dashboard Pelajar | **100%** | Halaman progres pribadi siswa, modul aktif, dan riwayat capaian kuis. |
| **FR-17** | Rekomendasi Belajar | **100%** | Deteksi otomatis jika nilai siswa < 60 disertai saran remedial langsung. |
| **FR-18** | Ekspor Laporan Ganda | **100%** | Mengunduh rekap nilai dan data kelas dalam bentuk berkas PDF resmi dan Excel/CSV. |
| **FR-19** | Regenerasi Konten AI | **100%** | Tombol *"Refresh AI"* untuk membuat ulang analogi atau soal dengan sudut pandang baru. |
| **FR-20** | Pusat Notifikasi Interaktif | **100%** | Notifikasi lonceng di navbar dengan riwayat info kelas dan pengingat remedial. |
| **FR-21** | Manajemen Kelas Guru | **100%** | Modal CRUD untuk membuat kelas baru, menambah mata pelajaran, dan melihat jumlah murid. |
| **FR-22** | Profil Pengguna | **100%** | Modal untuk melihat dan memperbarui Nama, Email, NIM/NIP, dan Kata Sandi. |

---

## 6. Kredensial Akun untuk Uji Coba

* **Akun Siswa / Pelajar:**
  * Tombol cepat: Klik **"Masuk sebagai Pelajar"** di halaman login.
  * Atau email: `ghandur@gmail.com` | Password: `secret123`
* **Akun Guru / Pengajar:**
  * Tombol cepat: Klik **"Masuk sebagai Pengajar / Admin"** di halaman login.
  * Atau email: `darmawan@gmail.com` | Password: `dosen123`

---

*Madiun, 2026 — Tim Pengembang ExplainMyLesson AI (D3 Teknik Informatika SV UNS Madiun)*
