# -*- coding: utf-8 -*-
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch

OUT_DIR = r'D:\\ghandur rido 1\\skpl_assets\\diagrams'
os.makedirs(OUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# GAMBAR 5.1: ARSITEKTUR SISTEM (THREE-TIER ARCHITECTURE)
# -------------------------------------------------------------
def make_gambar_5_1():
    fig, ax = plt.subplots(figsize=(15, 11), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 11)
    ax.axis('off')

    ax.text(7.5, 10.6, 'Gambar 5.1 – Arsitektur Sistem (Three-Tier Architecture) ExplainMyLesson AI',
            ha='center', va='center', fontsize=13, fontweight='bold', color='#0f172a')
    ax.text(7.5, 10.25, 'Struktur Tiga Lapisan Terkini: Next.js Client Tier, Node.js Express Application Tier, & Multi-Container Data Tier',
            ha='center', va='center', fontsize=8.5, color='#475569')

    tiers = [
        ('1. CLIENT TIER (PRESENTATION LAYER)', 7.0, 3.0, '#eff6ff', '#bfdbfe', '#1d4ed8'),
        ('2. APPLICATION TIER (BUSINESS LOGIC LAYER)', 3.6, 3.1, '#f8fafc', '#cbd5e1', '#0f172a'),
        ('3. DATA & EXTERNAL SERVICE TIER', 0.2, 3.1, '#fefce8', '#fef08a', '#854d0e')
    ]

    for title, y, h, bg, border, tcolor in tiers:
        box = FancyBboxPatch((0.5, y), 14.0, h, boxstyle='square,pad=0',
                             facecolor=bg, edgecolor=border, lw=1.5, zorder=1)
        ax.add_patch(box)
        h_box = FancyBboxPatch((0.5, y + h - 0.45), 14.0, 0.45, boxstyle='square,pad=0',
                               facecolor=border, edgecolor=border, zorder=2)
        ax.add_patch(h_box)
        ax.text(0.8, y + h - 0.22, title, ha='left', va='center',
                fontsize=8.5, fontweight='bold', color=tcolor, zorder=3)

    def draw_card(x, y, w, h, title, items, color='#ffffff', edge='#94a3b8', fs=7):
        box = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.02,rounding_size=0.08',
                             facecolor=color, edgecolor=edge, lw=1.3, zorder=3)
        ax.add_patch(box)
        # title
        ax.text(x + w/2, y + h - 0.25, title, ha='center', va='center',
                fontsize=7.8, fontweight='bold', color='#0f172a', zorder=4)
        ax.plot([x + 0.1, x + w - 0.1], [y + h - 0.45, y + h - 0.45], color=edge, lw=0.8, zorder=4)
        curr_y = y + h - 0.65
        for item in items:
            ax.text(x + 0.15, curr_y, item, ha='left', va='center', fontsize=fs, color='#334155', zorder=4)
            curr_y -= 0.22

    # Tier 1 Components
    draw_card(0.8, 7.2, 4.0, 2.3, 'Next.js App & React SPA',
              ['• Next.js App Router Shell', '• React 18 SPA State Management', '• Tailwind CSS Responsive Design', '• Zustand UI / Game State Store'])
    draw_card(5.2, 7.2, 4.4, 2.3, 'Three.js 3D Virtual World',
              ['• Three.js WebGL Canvas Engine', '• Gapura & 5 Rumah Pos Budaya', '• Pak Guru Virtual 3D Avatar', '• Teman Sekelas Online & Interaksi'])
    draw_card(10.0, 7.2, 4.2, 2.3, 'Audio & Adaptive UI Engine',
              ['• Web Speech API (id-ID & jv-ID)', '• Twin Badges: Skor Game & Kuis', '• Roadmap Stepper Linimasa Sejarah', '• Minigames: Kartu, Ular Tangga'])

    # Tier 2 Components
    draw_card(0.8, 3.8, 4.0, 2.4, 'API Router & Security Tier',
              ['• Express.js REST API Server', '• TypeScript Strict Typing', '• JWT Authentication Token Guard', '• Bcrypt Password Hashing Service'])
    draw_card(5.2, 3.8, 4.4, 2.4, 'RAG & Pedagogical Engine',
              ['• PDF Text Clean Extraction', '• 500-Character Semantic Chunking', '• Concept Analogizer for Kids', '• Contextual Quiz Generator'])
    draw_card(10.0, 3.8, 4.2, 2.4, 'Analytics & Gamification',
              ['• Dual Scoring Calculator', '• Automatic Remedial Detection (<60)', '• Classroom Mastery Gauges', '• Multi-format Export (PDF/CSV/Excel)'])

    # Tier 3 Components
    draw_card(0.8, 0.4, 4.0, 2.4, 'Relational Database',
              ['• MySQL 8.0 / MariaDB', '• Tabel Users, Modules, Chapters', '• Relasi Foreign Key & Indeks', '• ACID Transactional Guarantees'])
    draw_card(5.2, 0.4, 4.4, 2.4, 'Structured JSON Persistence',
              ['• users_db.json (User Accounts)', '• student_submissions.json (Hasil Kuis)', '• validated_modules.json (Kurikulum)', '• Atomic File Write & Sync'])
    draw_card(10.0, 0.4, 4.2, 2.4, 'External AI & Cloud Stack',
              ['• Google Gemini REST API LLM', '• Docker Compose Multi-Container', '• Nginx Reverse Proxy / SSL TLS', '• Web Speech Synthesis Voices'])

    # Inter-tier arrows
    def draw_arr(x1, y1, x2, y2, label=''):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='<|-|>', color='#2563eb', lw=1.5,
                                    shrinkA=3, shrinkB=3, mutation_scale=10), zorder=5)
        if label:
            ax.text((x1+x2)/2 + 0.5, (y1+y2)/2, label, ha='center', va='center',
                    fontsize=7, fontweight='bold', color='#1d4ed8',
                    bbox=dict(boxstyle='round,pad=0.1', facecolor='#ffffff', edgecolor='#bfdbfe', alpha=0.9), zorder=6)

    draw_arr(2.8, 7.2, 2.8, 6.2, 'JSON / REST API')
    draw_arr(7.4, 7.2, 7.4, 6.2, 'HTTP State Sync')
    draw_arr(12.1, 7.2, 12.1, 6.2, 'Realtime Data')

    draw_arr(2.8, 3.8, 2.8, 2.8, 'SQL Queries')
    draw_arr(7.4, 3.8, 7.4, 2.8, 'Read / Write')
    draw_arr(12.1, 3.8, 12.1, 2.8, 'Prompt / Token')

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_5_1_arsitektur_sistem.png'), dpi=300)
    plt.close()
    print('Gambar 5.1 Arsitektur Sistem generated.')

# -------------------------------------------------------------
# GAMBAR 6.1: ERD (CONCEPTUAL DATA MODEL)
# -------------------------------------------------------------
def make_gambar_6_1():
    fig, ax = plt.subplots(figsize=(15, 11), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 11)
    ax.axis('off')

    ax.text(7.5, 10.6, 'Gambar 6.1 – Entity Relationship Diagram (ERD / CDM) ExplainMyLesson AI',
            ha='center', va='center', fontsize=13, fontweight='bold', color='#0f172a')
    ax.text(7.5, 10.25, 'Model Data Konseptual: Hubungan Entitas Pengguna, Modul Ajar, Chunks RAG, Sesi 3D, Kuis & Remedial',
            ha='center', va='center', fontsize=8.5, color='#475569')

    def draw_entity(x, y, w, h, name, attrs, color='#eff6ff', edge='#2563eb'):
        box = FancyBboxPatch((x, y), w, h, boxstyle='square,pad=0',
                             facecolor=color, edgecolor=edge, lw=1.4, zorder=3)
        ax.add_patch(box)
        h_box = FancyBboxPatch((x, y + h - 0.45), w, 0.45, boxstyle='square,pad=0',
                               facecolor=edge, edgecolor=edge, zorder=4)
        ax.add_patch(h_box)
        ax.text(x + w/2, y + h - 0.22, name, ha='center', va='center',
                fontsize=8, fontweight='bold', color='#ffffff', zorder=5)

        curr_y = y + h - 0.65
        for a in attrs:
            is_pk = '(PK)' in a
            is_fk = '(FK)' in a
            col = '#b91c1c' if is_pk else ('#1d4ed8' if is_fk else '#334155')
            ax.text(x + 0.12, curr_y, a, ha='left', va='center',
                    fontsize=6.8, fontweight='bold' if (is_pk or is_fk) else 'normal', color=col, zorder=5)
            curr_y -= 0.22

    def draw_rel(x1, y1, x2, y2, card1='', card2='', label=''):
        ax.plot([x1, x2], [y1, y2], color='#334155', lw=1.3, zorder=2)
        if card1:
            ax.text(x1 + 0.15, y1 - 0.15, card1, fontsize=7.2, fontweight='bold', color='#0f172a', zorder=5)
        if card2:
            ax.text(x2 - 0.25, y2 - 0.15, card2, fontsize=7.2, fontweight='bold', color='#0f172a', zorder=5)
        if label:
            ax.text((x1+x2)/2, (y1+y2)/2 + 0.12, label, ha='center', va='center',
                    fontsize=6.5, color='#475569', zorder=5)

    # 1. USERS
    draw_entity(0.6, 6.8, 3.2, 2.7, 'USERS',
                ['id_user (PK)', 'nama', 'email (UNIQUE)', 'password_hash', 'role (pengajar/pelajar)', 'created_at'])

    # 2. MODULES
    draw_entity(5.8, 6.8, 3.4, 2.7, 'MODULES',
                ['id_module (PK)', 'id_pengajar (FK)', 'title', 'subject', 'file_path', 'is_validated', 'created_at'])

    # 3. CHAPTERS
    draw_entity(11.0, 6.8, 3.4, 2.7, 'CHAPTERS',
                ['id_chapter (PK)', 'id_module (FK)', 'chapter_title', 'order_index', 'summary_text', 'briefing_guru'])

    # 4. CHUNKS (RAG)
    draw_entity(11.0, 2.2, 3.4, 2.7, 'CHUNKS',
                ['id_chunk (PK)', 'id_chapter (FK)', 'chunk_content (500)', 'char_count', 'embedding_vector', 'created_at'])

    # 5. GAME_SESSIONS
    draw_entity(0.6, 2.2, 3.2, 2.7, 'GAME_SESSIONS',
                ['id_session (PK)', 'id_pelajar (FK)', 'id_chapter (FK)', 'skor_game', 'koin_emas', 'visited_pos'])

    # 6. QUIZ_SUBMISSIONS
    draw_entity(5.8, 2.2, 3.4, 2.7, 'QUIZ_SUBMISSIONS',
                ['id_submission (PK)', 'id_pelajar (FK)', 'id_chapter (FK)', 'skor_kuis', 'jawaban_benar', 'total_soal'])

    # Lines
    draw_rel(3.8, 8.1, 5.8, 8.1, '1', '1..*', 'mengunggah')
    draw_rel(9.2, 8.1, 11.0, 8.1, '1', '1..*', 'memiliki')
    draw_rel(12.7, 6.8, 12.7, 4.9, '1', '1..*', 'dipecah')
    draw_rel(2.2, 6.8, 2.2, 4.9, '1', '0..*', 'memulai')
    draw_rel(7.5, 6.8, 7.5, 4.9, '1', '0..*', 'dinilai')
    draw_rel(3.8, 3.5, 5.8, 3.5, '1', '1', 'sinkron skor ganda')

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_6_1_erd.png'), dpi=300)
    plt.close()
    print('Gambar 6.1 ERD generated.')

# -------------------------------------------------------------
# GAMBAR 6.2: PDM (PHYSICAL DATA MODEL)
# -------------------------------------------------------------
def make_gambar_6_2():
    fig, ax = plt.subplots(figsize=(15, 11), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 11)
    ax.axis('off')

    ax.text(7.5, 10.6, 'Gambar 6.2 – Physical Data Model (PDM / Skema Database Fisik) ExplainMyLesson AI',
            ha='center', va='center', fontsize=13, fontweight='bold', color='#0f172a')
    ax.text(7.5, 10.25, 'Spesifikasi Tabel Relasional SQL Lengkap dengan Tipe Data, Constraints, dan Foreign Keys',
            ha='center', va='center', fontsize=8.5, color='#475569')

    def draw_table(x, y, w, h, name, cols, color='#ffffff', edge='#334155'):
        box = FancyBboxPatch((x, y), w, h, boxstyle='square,pad=0',
                             facecolor=color, edgecolor=edge, lw=1.4, zorder=3)
        ax.add_patch(box)
        h_box = FancyBboxPatch((x, y + h - 0.45), w, 0.45, boxstyle='square,pad=0',
                               facecolor=edge, edgecolor=edge, zorder=4)
        ax.add_patch(h_box)
        ax.text(x + w/2, y + h - 0.22, f'Table: {name}', ha='center', va='center',
                fontsize=8, fontweight='bold', color='#ffffff', zorder=5)

        curr_y = y + h - 0.65
        for col_name, col_type, col_con in cols:
            is_pk = 'PK' in col_con
            is_fk = 'FK' in col_con
            c_color = '#b91c1c' if is_pk else ('#1d4ed8' if is_fk else '#0f172a')
            ax.text(x + 0.12, curr_y, col_name, ha='left', va='center',
                    fontsize=6.5, fontweight='bold' if (is_pk or is_fk) else 'normal', color=c_color, zorder=5)
            ax.text(x + w*0.48, curr_y, col_type, ha='left', va='center',
                    fontsize=6.2, color='#475569', zorder=5)
            ax.text(x + w*0.78, curr_y, col_con, ha='left', va='center',
                    fontsize=6.2, fontweight='bold', color=c_color, zorder=5)
            curr_y -= 0.22

    # 1. users
    draw_table(0.6, 6.8, 3.8, 2.8, 'users', [
        ('id_user', 'INT(11)', 'PK, AUTO_INC'),
        ('nama', 'VARCHAR(100)', 'NOT NULL'),
        ('email', 'VARCHAR(150)', 'UNIQUE, NOT NULL'),
        ('password_hash', 'VARCHAR(255)', 'NOT NULL'),
        ('role', 'ENUM(usr,adm)', 'DEFAULT usr'),
        ('created_at', 'DATETIME', 'DEFAULT NOW')
    ])

    # 2. modules
    draw_table(5.6, 6.8, 4.0, 2.8, 'modules', [
        ('id_module', 'VARCHAR(64)', 'PK'),
        ('id_pengajar', 'INT(11)', 'FK -> users'),
        ('title', 'VARCHAR(200)', 'NOT NULL'),
        ('subject', 'VARCHAR(100)', 'NOT NULL'),
        ('file_path', 'VARCHAR(255)', 'NOT NULL'),
        ('is_validated', 'TINYINT(1)', 'DEFAULT 0'),
        ('created_at', 'DATETIME', 'DEFAULT NOW')
    ])

    # 3. chapters
    draw_table(10.6, 6.8, 3.8, 2.8, 'chapters', [
        ('id_chapter', 'VARCHAR(64)', 'PK'),
        ('id_module', 'VARCHAR(64)', 'FK -> modules'),
        ('chapter_title', 'VARCHAR(200)', 'NOT NULL'),
        ('order_index', 'INT', 'NOT NULL'),
        ('summary_text', 'TEXT', 'NULL'),
        ('briefing_guru', 'TEXT', 'NULL')
    ])

    # 4. game_sessions
    draw_table(0.6, 2.0, 3.8, 2.8, 'game_sessions', [
        ('id_session', 'VARCHAR(64)', 'PK'),
        ('id_pelajar', 'INT(11)', 'FK -> users'),
        ('id_chapter', 'VARCHAR(64)', 'FK -> chapters'),
        ('skor_game', 'INT', 'DEFAULT 0'),
        ('koin_emas', 'INT', 'DEFAULT 0'),
        ('visited_pos', 'JSON', 'NULL')
    ])

    # 5. quiz_submissions
    draw_table(5.6, 2.0, 4.0, 2.8, 'quiz_submissions', [
        ('id_submission', 'VARCHAR(64)', 'PK'),
        ('id_pelajar', 'INT(11)', 'FK -> users'),
        ('id_chapter', 'VARCHAR(64)', 'FK -> chapters'),
        ('skor_kuis', 'DECIMAL(5,2)', 'DEFAULT 0.00'),
        ('jawaban_benar', 'INT', 'NOT NULL'),
        ('total_soal', 'INT', 'NOT NULL')
    ])

    # 6. remedial_alerts
    draw_table(10.6, 2.0, 3.8, 2.8, 'remedial_alerts', [
        ('id_alert', 'VARCHAR(64)', 'PK'),
        ('id_pelajar', 'INT(11)', 'FK -> users'),
        ('id_chapter', 'VARCHAR(64)', 'FK -> chapters'),
        ('skor_terakhir', 'DECIMAL(5,2)', 'NOT NULL'),
        ('status', 'ENUM(pen,res)', 'DEFAULT pen'),
        ('created_at', 'DATETIME', 'DEFAULT NOW')
    ])

    # Connectors
    ax.annotate('', xy=(5.6, 8.2), xytext=(4.4, 8.2),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=1.3, mutation_scale=9), zorder=5)
    ax.annotate('', xy=(10.6, 8.2), xytext=(9.6, 8.2),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=1.3, mutation_scale=9), zorder=5)
    ax.annotate('', xy=(2.5, 4.8), xytext=(2.5, 6.8),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=1.3, mutation_scale=9), zorder=5)
    ax.annotate('', xy=(7.6, 4.8), xytext=(7.6, 6.8),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=1.3, mutation_scale=9), zorder=5)
    ax.annotate('', xy=(12.5, 4.8), xytext=(12.5, 6.8),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=1.3, mutation_scale=9), zorder=5)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_6_2_pdm.png'), dpi=300)
    plt.close()
    print('Gambar 6.2 PDM generated.')

make_gambar_5_1()
make_gambar_6_1()
make_gambar_6_2()
