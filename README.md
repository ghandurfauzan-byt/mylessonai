# ExplainMyLesson AI : Sistem Pembelajaran Adaptif Berbasis RAG dan Analitik Pemahaman Pelajar

**Dokumen Spesifikasi & Repositori Proyek Akhir Praktikum Pemrograman Front-End & Backend 2026**  
**Program Studi D3 Teknik Informatika Kampus Madiun — Sekolah Vokasi Universitas Sebelas Maret**

---

### Tim Pengembang & Pengampu
- **Penyusun 1:** Ghandur Fauzan Ngauf Hisam (NIM: V3925024)
- **Penyusun 2:** Ridho Asykuri (NIM: V3925015)
- **Dosen Pengampu:** Darmawan Lahru Riatma, S.Kom., M.MT (NIP: 1991091420200801)
- **Mata Kuliah:** Praktikum Pemrograman Front-End / Manajemen Proyek Teknologi Informasi
- **Versi Dokumen SKPL / SRS:** Version 1.0 Approved (Madiun, 2026)
- **Orkestrasi Docker:** Stack `ghanduraja` (5 Kontainer Aktif di Docker Desktop)

---

## 1. Deskripsi Produk

**ExplainMyLesson AI** adalah platform pembelajaran cerdas berbasis web yang dirancang khusus untuk memecahkan fenomena *cognitive overload* (kelebihan beban kognitif) pada mahasiswa vokasi saat mempelajari buku ajar atau diktat perkuliahan yang tebal (100–300+ halaman). 

Dengan mengintegrasikan arsitektur **Retrieval-Augmented Generation (RAG)** cerdas, materi kuliah tebal diekstraksi ke dalam potongan berukuran optimal (500 karakter). Sistem kemudian secara otomatis memproduksi **Ringkasan Esensial**, **Analogi Konseptual**, **Mind Map Hierarkis**, serta **Contoh Soal Kontekstual**. 

Platform juga dilengkapi **Kuis Adaptif 3-Level** (Mudah, Sedang, Sulit) dengan sistem gamifikasi poin, **Dashboard Analitik Dosen & Mahasiswa**, **Manajemen Kelas**, **Pusat Notifikasi Remedial**, serta **Ekspor Laporan Pemahaman (PDF & Excel/CSV)**.

---

## 2. Arsitektur Containerization Docker (Stack: `ghanduraja`)

Seluruh ekosistem ExplainMyLesson AI telah sepenuhnya di-containerize menggunakan Docker & Docker Compose (`docker-compose.yml`) dengan nama stack **`ghanduraja`**. Sistem berjalan secara modular dan terisolasi dalam 5 service utama di Docker Desktop:

| Service / Container | Docker Image | Port Host:Container | Ukuran Image | Peran dalam Sistem |
| :--- | :--- | :---: | :---: | :--- |
| **`explainmylesson-frontend`** | `explainmylesson-frontend:latest` | `3000:3000` | 1.54 GB | Web Client UI (Next.js App Router Shell & React SPA) |
| **`explainmylesson-backend`** | `explainmylesson-backend:latest` | `4000:4000` | 354 MB | Core API Server (Node.js 20 Alpine + Express + TypeScript) |
| **`explainmylesson-mysql`** | `mysql:8.0` | `3306:3306` | 1.1 GB | Database Relasional Utama + Auto Inisialisasi `init.sql` |
| **`explainmylesson-chromadb`** | `chromadb/chroma:latest` | `8000:8000` | 826 MB | Vector Store Database untuk Chunking Embedding RAG |
| **`explainmylesson-ollama`** | `explainmylesson-ollama:latest` | `11434:11434` | 193 MB | Local Large Language Model (LLM) Inference Engine |

### 🚀 Cara Menjalankan Ekosistem Docker
```bash
# Menjalankan seluruh 5 kontainer sekaligus di latar belakang
docker compose up -d

# Memeriksa status kesehatan dan port seluruh service
docker compose ps

# Memantau log backend Express secara langsung
docker compose logs -f backend
```

---

## 3. Agenda Evaluasi Backend Hari Jumat (Presentasi)

### 3.1 Database
1. **MySQL 8.0 Containerization (`explainmylesson-mysql`):**
   - **Persistent Volume:** Direktori `/var/lib/mysql` dimount ke volume `mysql_data` agar transaksi dan data akun tidak hilang saat kontainer direstart.
   - **Auto-Initialization (`init.sql`):** Berkas `./backend/database/init.sql` dimount secara *read-only* ke `/docker-entrypoint-initdb.d/init.sql` untuk otomatis menginisialisasi database `explainmylesson_db` dengan encoding `utf8mb4_unicode_ci`.
   - **Skema 5 Tabel Inti:**
     - `users`: Otentikasi, Bcrypt hash password, hak akses role (`pelajar`, `pengajar`), dan identitas (NIM/NIP).
     - `classes`: Pengelolaan ruang kelas dosen (FR-21), kode unik kelas, dan relasi foreign key `teacher_id`.
     - `materials`: Modul kuliah publik dan privat (FR-04, FR-05) dengan foreign key `uploader_id`.
     - `quiz_attempts`: Riwayat kuis adaptif level 1-3, perolehan skor, poin gamifikasi, dan status kelulusan (FR-11 s/d FR-14).
     - `notifications`: Sistem lonceng notifikasi pengingat remedial dan info kelas (FR-20).
2. **ChromaDB Vector Store (`explainmylesson-chromadb`):**
   - Menyimpan representasi embedding numerik dari potongan dokumen (*chunked text* 500 karakter) materi kuliah untuk pencarian semantik berkecepatan tinggi dalam pipeline RAG.

### 3.2 Pemrograman Backend (Express.js & TypeScript)
- **Runtime:** Node.js 20 LTS dengan execution engine `tsx` pada port 4000.
- **Type-Safety End-to-End:** Validasi skema runtime menggunakan Zod (`shared/schema.ts`) dengan sinkronisasi tipe statis (`z.infer`) bersama frontend dan mobile.
- **Keamanan Sesi & RBAC:** Menggunakan cookie sesi `httpOnly` dengan masa berlaku 8 jam, proteksi CSRF, sanitasi input XSS, dan hashing password Bcrypt 10 ronde.

### 3.3 Debugging, Testing & Containerization
- **Desain `Dockerfile` Backend:** Berbasis `node:20-alpine` (hanya 354 MB) dengan dependensi produksi efisien (`npm install --omit=dev && npm install -g tsx typescript`).
- **Orkestrasi Dependensi & Healthcheck:** Service `backend` menunggu kondisi `service_healthy` dari MySQL melalui pengecekan `mysqladmin ping` berkala setiap 5 detik.
- **Testing Suite Otomatis:** Menjalankan 52 skenario pengujian dengan Vitest (`npm run test`) pada direktori `tests/` (auth, quiz, shared, system, ui).
- **Prosedur Debugging:**
  - Inspeksi log: `docker compose logs -f backend`
  - Shell kontainer: `docker exec -it explainmylesson-backend sh`
  - Verifikasi query database langsung: `docker exec -it explainmylesson-mysql mysql -u user -ppassword123 explainmylesson_db`

### 3.4 Dokumentasi Spesifikasi API Lengkap Per Fitur
Base URL: `http://localhost:4000/api`

#### A. Otentikasi & Akun Pengguna (FR-01 s/d FR-03, FR-22)
* **POST `/api/login`**
  * *Request Body:* `{"email": "ghandur@gmail.com", "password": "secretpassword123", "role": "pelajar"}`
  * *Response 200 OK:* `{"ok": true, "role": "pelajar", "user": {"id": 2, "name": "Ghandur Fauzan Ngauf Hisam", "email": "ghandur@gmail.com", "nim_nip": "V3925024"}}` (Menyetel cookie sesi `httpOnly`)
  * *Response 401 Error:* `{"error": "Email atau kata sandi tidak valid."}`
* **POST `/api/register`**
  * *Request Body:* `{"name": "Ridho Asykuri", "email": "ridho@gmail.com", "password": "password123", "role": "pelajar", "nim_nip": "V3925015"}`
  * *Response 200 OK:* `{"ok": true, "message": "Pendaftaran berhasil.", "user": {"id": 3, "name": "Ridho Asykuri", "email": "ridho@gmail.com"}}`
* **GET `/api/session`**
  * *Response 200 OK:* `{"authenticated": true, "role": "pelajar"}`
* **POST `/api/logout`**
  * *Response 200 OK:* `{"ok": true, "message": "Sesi telah berakhir."}`

#### B. Materi & Modul Kuliah (FR-04, FR-05, FR-06)
* **GET `/api/materials`**
  * *Response 200 OK:* `{"success": true, "materials": [{"id": "mat-pkn-01", "title": "Pendidikan Pancasila: Menghargai Keragaman", "variant": "public", "chapter_code": "BAB-1-PKN"}]}`
* **POST `/api/materials`**
  * *Request Body:* `{"title": "Bahasa Jawa: Unggah-Ungguh Basa", "fileName": "bahasa_jawa_bab2.pdf", "chapterCode": "BAB-2-JAWA", "variant": "private"}`
  * *Response 201 Created:* `{"success": true, "message": "Materi berhasil diunggah dan diindeks.", "data": {"id": "mat-jawa-02"}}`

#### C. AI Generator & Local LLM (FR-07 s/d FR-10)
* **GET `/api/ai-content?chapter=BAB-1-PKN&mode=summary`**
  * *Response 200 OK:* `{"chapter": "BAB-1-PKN", "summary": "Pancasila mengajarkan toleransi...", "analogy": "Seperti pelangi dengan aneka warna...", "mindMap": [{"title": "Sila 1"}], "sampleQuestions": ["Sebutkan contoh hidup rukun!"]}`
* **POST `/api/llm/generate`** *(Integrasi Container Ollama)*
  * *Request Body:* `{"prompt": "Buat analogi gotong royong", "model": "llama3:latest", "temperature": 0.7}`
  * *Response 200 OK:* `{"success": true, "response": "Gotong royong seperti bermain sepak bola...", "duration_ms": 1340}`

#### D. Kuis Adaptif 3 Level & Gamifikasi Poin (FR-11 s/d FR-14)
* **GET `/api/quiz?level=1`**
  * *Response 200 OK:* `{"level": 1, "questions": [{"id": "q1", "text": "Simbol sila ke-1 Pancasila adalah...", "options": ["Bintang", "Rantai", "Pohon", "Padi"], "answerIndex": 0, "points": 10}]}`
* **POST `/api/students/points`**
  * *Request Body:* `{"studentId": "2", "pointsDelta": 30, "chapterCode": "BAB-1-PKN", "level": 1}`
  * *Response 200 OK:* `{"success": true, "totalPoints": 150, "earnedPoints": 30, "status": "passed"}`

#### E. Kelas, Dashboard Analitik, Notifikasi & Diagnostik (FR-15, FR-18, FR-20, FR-21)
* **GET `/api/classes`** → Mengambil daftar kelas yang diampu pengajar.
* **GET `/api/class-summary` & `/api/students-needing-help`** → Menampilkan rata-rata kelas dan mendeteksi murid butuh bimbingan remedial (nilai < 60).
* **GET `/api/notifications`** → Mengambil daftar notifikasi lonceng pengguna.
* **GET `/api/system/status`** → Diagnostik kesehatan container Docker:
  ```json
  {
    "success": true,
    "docker": { "active": true, "service": "explainmylesson-backend", "environment": "development" },
    "database": { "type": "mysql", "host": "mysql", "name": "explainmylesson_db", "status": "mounted" },
    "vector_store": { "status": "connected", "url": "http://chromadb:8000" },
    "local_llm": { "status": "connected", "url": "http://ollama:11434" }
  }
  ```

### 3.5 Laporan Sementara & Persiapan Mobile (Flutter)
- **Status Kesiapan:** 5 container Docker aktif, REST API stabil, database relasional dan vector store siap melayani query.
- **Persiapan Mobile (Rabu/Kamis):**
  - Mengonfigurasi Java Development Kit (JDK) & Flutter SDK.
  - Penyesuaian endpoint: Android Virtual Device (AVD) menggunakan `http://10.0.2.2:4000/api`, sedangkan HP fisik menggunakan IP lokal jaringan laptop.
  - Batasan fitur: Diprioritaskan pada Autentikasi, Akses Materi & Ringkasan AI, Pengerjaan Kuis, dan Notifikasi.
  - Target akhir: Output file build **`.apk`** mandiri yang siap diinstal dan didemonstrasikan.

---

## 4. Matriks Kebutuhan Fungsional (FR-01 s/d FR-22 — 100% Selesai)

| ID | Fitur | Status | Deskripsi Implementasi |
| :--- | :--- | :---: | :--- |
| **FR-01** | Registrasi Akun | **100%** | Form pendaftaran akun baru dengan format email terbuka dan validasi Zod. |
| **FR-02** | Login Multi-Role | **100%** | Otentikasi dua peran (Pelajar & Pengajar) dengan sesi aman httpOnly. |
| **FR-03** | Logout Sesi | **100%** | Pembersihan sesi pengguna dan pengalihan ke halaman otentikasi. |
| **FR-04** | Upload Materi Publik | **100%** | Dosen dapat mengunggah modul kuliah (PDF < 10MB) untuk seluruh kelas. |
| **FR-05** | Upload Materi Privat | **100%** | Mahasiswa dapat mengunggah catatan belajar pribadi yang terisolasi. |
| **FR-06** | Chunking RAG (500 Karakter) | **100%** | Ekstraksi teks cerdas ke dalam segmen 500 karakter dengan overlap kontekstual. |
| **FR-07** | Ringkasan Esensial AI | **100%** | Peringkasan materi kuliah tebal (200 halaman) menjadi intisari ringkas. |
| **FR-08** | Analogi Dunia Nyata | **100%** | Perumpamaan konsep rumit (mis. DBMS, Queue, Tree) ke analogi sehari-hari. |
| **FR-09** | Mind Map Hierarkis | **100%** | Representasi pohon konsep materi dengan relasi induk-anak visual. |
| **FR-10** | Contoh Soal Kontekstual | **100%** | Generator latihan soal beserta pembahasan komprehensif. |
| **FR-11** | Kuis Level 1: Mudah | **100%** | Soal pilihan ganda pemahaman dasar (+10 Poin, 3x percobaan). |
| **FR-12** | Kuis Level 2: Sedang | **100%** | Soal analitis tingkat menengah (+20 Poin, terbuka setelah L1). |
| **FR-13** | Kuis Level 3: Sulit | **100%** | Soal pemecahan masalah kompleks (+30 Poin, terbuka setelah L2). |
| **FR-14** | Gamifikasi & Level Status | **100%** | Live XP tracker, badge kelulusan, dan status pelajar adaptif. |
| **FR-15** | Dashboard Pengajar | **100%** | Visualisasi analitik rata-rata kelas, grafik per bab, dan identifikasi remedial. |
| **FR-16** | Dashboard Pelajar | **100%** | Pelacakan progres pribadi, skor kuis per bab, dan akumulasi poin. |
| **FR-17** | Rekomendasi Belajar | **100%** | Deteksi otomatis jika skor bab < 60 dengan link langsung ke remedial. |
| **FR-18** | Ekspor Laporan Ganda | **100%** | Unduhan laporan berformat PDF resmi (kop UNS) dan Excel/CSV. |
| **FR-19** | Regenerasi Konten AI | **100%** | Tombol Refresh AI untuk menghasilkan sudut pandang analogi/soal baru. |
| **FR-20** | Pusat Notifikasi Interaktif | **100%** | Notifikasi bel di Navbar dengan riwayat peringatan nilai & remedial. |
| **FR-21** | Manajemen Kelas Dosen | **100%** | Modal CRUD kelas, jumlah mahasiswa, dan pengelolaan mata kuliah. |
| **FR-22** | Profil Pengguna | **100%** | Modal melihat dan memperbarui Nama, Email, NIM/NIP, dan Kata Sandi. |

---

## 5. Struktur Direktori Proyek

```
explainmylesson-ai/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI/CD Pipeline (lint → typecheck → build → test)
├── backend/
│   ├── database/
│   │   └── init.sql           # MySQL Database auto-init schema & seed default
│   ├── ollama-service/        # Docker service untuk Ollama Local LLM
│   ├── server/
│   │   ├── chroma.ts          # Integrasi ChromaDB vector store
│   │   ├── data.ts            # Logika CRUD kelas, profil, laporan CSV & state
│   │   ├── index.ts           # Express API server, route handler REST
│   │   ├── local_llm.ts       # Integrasi local LLM Ollama
│   │   └── session.ts         # Manajemen sesi otentikasi cookie
│   └── Dockerfile             # Dockerfile backend Node.js 20 Alpine
├── frontend/
│   ├── app/                   # Next.js App Router Shell
│   ├── src/
│   │   ├── components/        # React Container & Presentational Components
│   │   ├── hooks/             # TanStack Query custom hooks
│   │   ├── lib/store/         # Zustand Client State Management (useUIStore)
│   │   └── views/             # Pelajar & Pengajar Dashboard Views
│   └── Dockerfile             # Dockerfile frontend Web Next.js
├── shared/
│   ├── catalog.ts             # Katalog materi perkuliahan & RAG knowledge base
│   └── schema.ts              # Skema Zod & tipe TypeScript bersama klien-server
├── tests/
│   ├── auth/security.test.ts        # Bcrypt hash/compare, duplikasi email
│   ├── quiz/gamification.test.ts    # Sistem poin, level adaptif, remedial
│   ├── shared/schema.test.ts        # Validasi Zod schemas
│   ├── system/testcases.test.ts     # TC-01 s/d TC-24 sesuai dokumen SKPL
│   └── ui/design-system.test.ts     # CVA button variants, utilitas desain
├── docker-compose.yml         # Orkestrasi 5 container stack ghanduraja
├── package.json
└── tsconfig.json
```

---

## 6. Kredensial Akun Pengujian Demo

- **Pelajar / Siswa:** Klik tombol *"Masuk sebagai Pelajar"* pada halaman login (atau gunakan email: `ghandur@gmail.com` / kata sandi: `secret123`).
- **Pengajar / Guru:** Klik tombol *"Masuk sebagai Pengajar / Admin"* pada halaman login (atau gunakan email: `darmawan@gmail.com` / kata sandi: `dosen123`).
- **Registrasi Akun Mandiri:** Pendaftaran akun baru menerima format alamat email valid apapun secara terbuka dengan pilihan peran Pelajar atau Pengajar.

---

## 7. Hasil Quality Gate & Verifikasi Standar Industri

| Pengujian | Tool / Engine | Hasil | Status |
| :--- | :--- | :---: | :---: |
| **Strict Type Checking** | TypeScript 5 (`tsc -b --noEmit`) | 0 Error | **PASSED** |
| **Linter & Code Style** | Biome Toolchain (Rust Engine) | 0 Warning / 0 Error | **PASSED** |
| **CI/CD Automation** | GitHub Actions Workflow (`ci.yml`) | Build Succeeded | **PASSED** |
| **SonarQube Metrics** | Static Code Analysis Rules | A Grade (0 Vulnerabilities) | **PASSED** |
| **Pengujian Otomatis Vitest** | Vitest v2 (Unit + Integration + UI) | 52/52 passed (0 failed) | **PASSED** |
| **Pemenuhan SKPL / SRS** | 22 Functional Requirements | 22/22 (100%) | **PASSED** |
| **Pengujian Fungsional** | 24 Test Cases (TC-01 s/d TC-24) | 24/24 (100%) | **PASSED** |
| **Containerization Kesiapan** | Docker Compose Stack (`ghanduraja`) | 5/5 Container Running | **PASSED** |

---

*Madiun, 2026 — Tim Pengembang ExplainMyLesson AI (SV UNS Madiun)*
