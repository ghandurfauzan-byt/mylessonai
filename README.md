# ExplainMyLesson AI — Containerization Docker Stack (`ghanduraja`)

**Repositori & Dokumentasi Evaluasi Backend & Containerization (Docker)**  
**Program Studi D3 Teknik Informatika Kampus Madiun — Sekolah Vokasi Universitas Sebelas Maret (UNS)**

---

### Tim Pengembang & Pengampu
- **Penyusun 1:** Ghandur Fauzan Ngauf Hisam (NIM: V3925024)
- **Penyusun 2:** Ridho Asykuri (NIM: V3925015)
- **Dosen Pengampu:** Darmawan Lahru Riatma, S.Kom., M.MT (NIP: 1991091420200801)
- **Mata Kuliah:** Evaluasi Praktikum Backend & Containerization
- **Nama Stack Docker:** `ghanduraja` (5 Kontainer Aktif di Docker Desktop)

---

## 1. Ekosistem 5 Kontainer Docker (Docker Desktop)

Seluruh komponen sistem ExplainMyLesson AI telah sepenuhnya dikemas dan dijalankan menggunakan Docker & Docker Compose (`docker-compose.yml`) dalam satu bridge network:

| Nama Container | Docker Image | Port Host:Container | Ukuran Image | Peran dalam Sistem |
| :--- | :--- | :---: | :---: | :--- |
| **`explainmylesson-backend`** | `explainmylesson-backend:latest` | `4000:4000` | 354 MB | Express.js API Server (Node.js 20 Alpine + TypeScript) |
| **`explainmylesson-frontend`** | `explainmylesson-frontend:latest` | `3000:3000` | 1.54 GB | Web Client UI (Next.js / React) |
| **`explainmylesson-mysql`** | `mysql:8.0` | `3306:3306` | 1.1 GB | Relational Database Server (Persistent Volume + `init.sql`) |
| **`explainmylesson-chromadb`** | `chromadb/chroma:latest` | `8000:8000` | 826 MB | Vector Store Database untuk RAG (*Retrieval-Augmented Generation*) |
| **`explainmylesson-ollama`** | `explainmylesson-ollama:latest` | `11434:11434` | 193 MB | Local Large Language Model (LLM) Inference Engine |

---

## 2. Cara Menjalankan Ekosistem Docker

```bash
# 1. Menjalankan seluruh 5 kontainer di latar belakang
docker compose up -d

# 2. Memeriksa status kesehatan kontainer
docker compose ps

# 3. Memantau output log backend secara real-time
docker compose logs -f backend

# 4. Menghentikan seluruh kontainer
docker compose down
```

---

## 3. Evaluasi Backend Sesuai Agenda Presentasi

### 3.1 Database (MySQL 8.0 & ChromaDB)
1. **Relational Database (`explainmylesson-mysql`):**
   - **Persistent Volume:** Direktori `/var/lib/mysql` dimount ke volume `mysql_data` sehingga data transaksi, user, dan kuis tetap aman di host.
   - **Inisialisasi Otomatis:** Berkas `./backend/database/init.sql` dimount secara *read-only* ke `/docker-entrypoint-initdb.d/init.sql` untuk otomatis menyiapkan database `explainmylesson_db` (utf8mb4).
   - **Skema 5 Tabel:** `users`, `classes`, `materials`, `quiz_attempts`, dan `notifications`.
2. **Vector Database (`explainmylesson-chromadb`):**
   - Menyimpan embedding vektor potongan modul perkuliahan (500 karakter) untuk pencarian semantik lokal cepat dalam pipeline RAG.

### 3.2 Pemrograman Backend (Express.js & TypeScript)
- Berbasis Node.js 20 LTS dan TypeScript (`tsx backend/server/index.ts`) pada port 4000.
- **Dual Authentication:** Mendukung cookie sesi HTTP-Only (`uns_session`) dan Authorization header (`Bearer <token>`) yang tersinkronisasi dengan `localStorage` browser.
- **Validasi Skema:** Validasi runtime berbasis Zod (`shared/schema.ts`).

### 3.3 Debugging & Testing
- **Dockerfile Backend:** Menggunakan multi-stage `node:20-alpine` yang ringan dan efisien (354 MB).
- **Healthcheck MySQL:** Pemeriksaan otomatis menggunakan perintah `mysqladmin ping` setiap 5 detik.
- **Perintah Debugging:**
  ```bash
  # Masuk ke shell container backend
  docker exec -it explainmylesson-backend sh

  # Akses database MySQL langsung di dalam container
  docker exec -it explainmylesson-mysql mysql -u user -ppassword123 explainmylesson_db
  ```

---

## 4. Dokumentasi Endpoint API

Base URL: `http://localhost:4000/api`

* **POST `/api/login`** → Login akun (`email`, `password`, `role`).
* **GET `/api/session`** → Verifikasi sesi login aktif.
* **GET `/api/materials`** → Mengambil daftar modul materi pembelajaran.
* **POST `/api/materials`** → Unggah berkas modul ajar baru.
* **GET `/api/ai-content?chapter=BAB-1-PKN&mode=summary`** → Ekstraksi ringkasan, analogi, mind map, dan latihan soal dari AI.
* **POST `/api/llm/generate`** → Query langsung ke container Ollama (`llama3`).
* **GET `/api/quiz?level=1`** → Mengambil soal kuis pilihan ganda adaptif.
* **POST `/api/students/points`** → Rekam perolehan skor dan poin kuis siswa.
* **GET `/api/system/status`** → Diagnostik kesehatan container Docker:
  ```json
  {
    "success": true,
    "docker": { "active": true, "service": "explainmylesson-backend" },
    "database": { "type": "mysql", "host": "mysql", "status": "mounted" },
    "vector_store": { "status": "connected", "url": "http://chromadb:8000" },
    "local_llm": { "status": "connected", "url": "http://ollama:11434" }
  }
  ```

---

## 5. Laporan Sementara & Persiapan Mobile (Flutter)

1. **Status Sistem:** 5 container Docker beroperasi 100% stabil di Docker Desktop.
2. **Koneksi Klien Mobile (Flutter):**
   - Emulator Android (AVD) mengakses backend melalui `http://10.0.2.2:4000/api`.
   - Perangkat fisik (HP) mengakses IP lokal jaringan laptop via USB Debugging.
3. **Target Luaran:** Output berkas instalasi mandiri Android berupa build **APK**.

---

*Madiun, 2026 — Tim Pengembang ExplainMyLesson AI (SV UNS Madiun)*
