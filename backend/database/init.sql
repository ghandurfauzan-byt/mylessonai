-- ExplainMyLesson AI: Database Initialization Script
-- Auto-executed by MySQL Docker Container on first startup

CREATE DATABASE IF NOT EXISTS explainmylesson_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE explainmylesson_db;

-- 1. Tabel Users (Otentikasi & Profil Pengguna)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('pelajar', 'pengajar') NOT NULL DEFAULT 'pelajar',
    nim_nip VARCHAR(100) NULL,
    avatar VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Classes (Manajemen Kelas Dosen FR-21)
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    teacher_id INT NULL,
    total_students INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Materials (Unggah Modul Publik & Privat FR-04, FR-05)
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    variant ENUM('public', 'private') NOT NULL DEFAULT 'public',
    chapter_code VARCHAR(100) NULL,
    uploader_id INT NULL,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Quiz Attempts & Gamifikasi (FR-11, FR-12, FR-13, FR-14)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    chapter_id VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    score INT NOT NULL,
    points INT NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Notifications (Pusat Notifikasi Bel FR-20)
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'remedial') NOT NULL DEFAULT 'info',
    link VARCHAR(255) NULL,
    target_role ENUM('all', 'pelajar', 'pengajar') NOT NULL DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Akun Default (Bcrypt hash: 'dosen123' & 'secret123')
INSERT INTO users (id, name, email, password_hash, role, nim_nip) VALUES
(1, 'Bpk. Darmawan Lahru Riatma, S.Kom., M.MT', 'darmawan@gmail.com', '$2a$10$WqU2qL3nS8dK4W5v0xN/xO1w9vGq4J.YnK8K0N3J8g2jEw3O7J/m2', 'pengajar', '1991091420200801'),
(2, 'Ghandur Fauzan Ngauf Hisam', 'ghandur@gmail.com', '$2a$10$7Z8q2L4nS9dK5W6v1xN/xO2w0vGq5J.YnK9K1N4J9g3jEw4O8J/m3', 'pelajar', 'V3925024'),
(3, 'Ridho Asykuri', 'ridho@gmail.com', '$2a$10$7Z8q2L4nS9dK5W6v1xN/xO2w0vGq5J.YnK9K1N4J9g3jEw4O8J/m3', 'pelajar', 'V3925015')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Kelas Default
INSERT INTO classes (id, name, subject, code, teacher_id, total_students) VALUES
(1, 'Kelas 4A SD Ceria - Pendidikan Pancasila', 'Pendidikan Pancasila & Kewarganegaraan', 'PKN-4A-2026', 1, 28),
(2, 'Kelas 4B SD Ceria - Bahasa Jawa Unggah-Ungguh', 'Bahasa Daerah Jawa', 'JAWA-4B-2026', 1, 28)
ON DUPLICATE KEY UPDATE name=VALUES(name);
