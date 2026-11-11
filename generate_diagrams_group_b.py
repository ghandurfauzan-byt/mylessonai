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
# GAMBAR 4.5: USE CASE DIAGRAM (LENGKAP INCLUDE / EXTEND)
# -------------------------------------------------------------
def make_gambar_4_5():
    fig, ax = plt.subplots(figsize=(15, 11), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 11)
    ax.axis('off')

    ax.text(7.5, 10.6, 'Gambar 4.5 – Use Case Diagram Sistem ExplainMyLesson AI',
            ha='center', va='center', fontsize=13, fontweight='bold', color='#0f172a')
    ax.text(7.5, 10.25, 'Pemodelan Aktor Pengajar & Pelajar serta Relasi <<include>> dan <<extend>> Terkini',
            ha='center', va='center', fontsize=8.5, color='#475569')

    # System boundary box
    sys_box = FancyBboxPatch((3.2, 0.4), 8.6, 9.6, boxstyle='square,pad=0',
                             facecolor='#f8fafc', edgecolor='#0284c7', linewidth=2, linestyle='--', zorder=1)
    ax.add_patch(sys_box)
    ax.text(7.5, 9.75, 'Batas Sistem: ExplainMyLesson AI Web Platform', ha='center', va='center',
            fontsize=9.5, fontweight='bold', color='#0284c7', zorder=2)

    def draw_actor(x, y, name, role_desc):
        c = patches.Circle((x, y + 0.4), 0.22, facecolor='#ffffff', edgecolor='#1e293b', lw=1.6, zorder=4)
        ax.add_patch(c)
        ax.plot([x, x], [y + 0.18, y - 0.25], color='#1e293b', lw=1.6, zorder=4)
        ax.plot([x - 0.35, x + 0.35], [y + 0.05, y + 0.05], color='#1e293b', lw=1.6, zorder=4)
        ax.plot([x, x - 0.25], [y - 0.25, y - 0.65], color='#1e293b', lw=1.6, zorder=4)
        ax.plot([x, x + 0.25], [y - 0.25, y - 0.65], color='#1e293b', lw=1.6, zorder=4)
        ax.text(x, y - 0.85, name, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#0f172a', zorder=5)
        ax.text(x, y - 1.05, role_desc, ha='center', va='center', fontsize=7, color='#64748b', zorder=5)

    def draw_uc(x, y, w, h, text, color='#ffffff', edge='#2563eb'):
        ellipse = patches.Ellipse((x + w/2, y + h/2), w, h, facecolor=color, edgecolor=edge, lw=1.4, zorder=3)
        ax.add_patch(ellipse)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center',
                fontsize=7.2, fontweight='bold', color='#0f172a', multialignment='center', zorder=4)

    def draw_assoc(x1, y1, x2, y2, color='#334155'):
        ax.plot([x1, x2], [y1, y2], color=color, lw=1.2, zorder=2)

    def draw_rel(x1, y1, x2, y2, text, style='dashed'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='-|>', color='#7c3aed', lw=1.1, linestyle='--',
                                    shrinkA=3, shrinkB=3, mutation_scale=8), zorder=5)
        ax.text((x1+x2)/2, (y1+y2)/2 + 0.12, text, ha='center', va='center',
                fontsize=6.5, color='#7c3aed', fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.1', facecolor='#ffffff', edgecolor='none', alpha=0.9), zorder=6)

    draw_actor(1.6, 7.5, 'PENGAJAR', '(Guru / Dosen)')
    draw_actor(1.6, 2.5, 'PELAJAR', '(Siswa / Murid)')
    draw_actor(13.5, 5.0, 'SISTEM AI', '(Gemini & TTS)')

    draw_uc(4.0, 8.5, 3.2, 0.75, 'Autentikasi & Login Multi-Role')
    draw_uc(4.0, 7.4, 3.2, 0.75, 'Unggah Modul Ajar (PDF)')
    draw_uc(4.0, 6.3, 3.2, 0.75, 'Validasi & Kurasi Modul RAG')
    draw_uc(4.0, 5.2, 3.2, 0.75, 'Pantau Live Dashboard Kelas')
    draw_uc(4.0, 4.1, 3.2, 0.75, 'Ekspor Laporan (PDF/Excel)')

    draw_uc(4.0, 3.0, 3.2, 0.75, 'Akses RAG & Dengar Audio Guru')
    draw_uc(4.0, 1.9, 3.2, 0.75, 'Petualangan 3D Desa Nusantara')
    draw_uc(4.0, 0.8, 3.2, 0.75, 'Kerjakan Kuis Pos Adaptif')

    draw_uc(8.2, 7.4, 3.2, 0.75, 'Ekstraksi & Chunking 500 Char', '#f5f3ff', '#7c3aed')
    draw_uc(8.2, 6.3, 3.2, 0.75, 'Generate Ringkasan & Analogi', '#f5f3ff', '#7c3aed')
    draw_uc(8.2, 5.2, 3.2, 0.75, 'Generate Kuis Pos 5 Budaya', '#f5f3ff', '#7c3aed')
    draw_uc(8.2, 4.1, 3.2, 0.75, 'Sapa Teman Sekelas Online', '#fefce8', '#ca8a04')
    draw_uc(8.2, 3.0, 3.2, 0.75, 'Koleksi Koin Emas (+5 Poin)', '#fefce8', '#ca8a04')
    draw_uc(8.2, 1.9, 3.2, 0.75, 'Peringatan Remedial (<60)', '#fee2e2', '#dc2626')
    draw_uc(8.2, 0.8, 3.2, 0.75, 'Sinkronisasi Twin Badges', '#f0fdf4', '#16a34a')

    draw_assoc(1.9, 7.5, 4.0, 8.8)
    draw_assoc(1.9, 7.5, 4.0, 7.8)
    draw_assoc(1.9, 7.5, 4.0, 6.7)
    draw_assoc(1.9, 7.5, 4.0, 5.6)
    draw_assoc(1.9, 7.5, 4.0, 4.5)

    draw_assoc(1.9, 2.5, 4.0, 8.8)
    draw_assoc(1.9, 2.5, 4.0, 3.4)
    draw_assoc(1.9, 2.5, 4.0, 2.3)
    draw_assoc(1.9, 2.5, 4.0, 1.2)

    draw_assoc(13.2, 5.0, 11.4, 7.8)
    draw_assoc(13.2, 5.0, 11.4, 6.7)
    draw_assoc(13.2, 5.0, 11.4, 5.6)

    draw_rel(7.2, 7.8, 8.2, 7.8, '<<include>>')
    draw_rel(7.2, 6.7, 8.2, 6.7, '<<include>>')
    draw_rel(7.2, 1.2, 8.2, 1.2, '<<include>>')

    draw_rel(8.2, 4.5, 7.2, 2.3, '<<extend>>')
    draw_rel(8.2, 3.4, 7.2, 2.3, '<<extend>>')
    draw_rel(8.2, 2.3, 7.2, 5.6, '<<extend>>')

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_4_5_use_case.png'), dpi=300)
    plt.close()
    print('Gambar 4.5 Use Case generated.')

# -------------------------------------------------------------
# GAMBAR 4.6: ACTIVITY DIAGRAM
# -------------------------------------------------------------
def make_gambar_4_6():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 10)
    ax.axis('off')

    ax.text(7.5, 9.6, 'Gambar 4.6 – Activity Diagram Siklus Pembelajaran 3D Desa Nusantara & Kuis Adaptif',
            ha='center', va='center', fontsize=12.5, fontweight='bold', color='#0f172a')
    ax.text(7.5, 9.25, 'Alur Aktivitas Siswa Berinteraksi dengan Pak Guru Virtual, Eksplorasi Pos Budaya, dan Penilaian Skor Ganda',
            ha='center', va='center', fontsize=8.5, color='#475569')

    lanes = [
        ('PELAJAR (SISWA)', 0.5, 4.5, '#eff6ff', '#bfdbfe'),
        ('FRONTEND (NEXT.JS & THREE.JS 3D CANVAS)', 5.0, 5.0, '#f8fafc', '#cbd5e1'),
        ('BACKEND (EXPRESS API & GEMINI RAG)', 10.0, 4.5, '#f0fdf4', '#bbf7d0')
    ]
    for name, x, w, bg, border in lanes:
        box = FancyBboxPatch((x, 0.5), w, 8.5, boxstyle='square,pad=0',
                             facecolor=bg, edgecolor=border, lw=1.4, zorder=1)
        ax.add_patch(box)
        h_box = FancyBboxPatch((x, 8.4), w, 0.6, boxstyle='square,pad=0',
                              facecolor=border, edgecolor=border, zorder=2)
        ax.add_patch(h_box)
        ax.text(x + w/2, 8.7, name, ha='center', va='center',
                fontsize=8, fontweight='bold', color='#0f172a', zorder=3)

    def draw_act(x, y, w, h, text, color='#ffffff', edge='#3b82f6', fs=7.2):
        box = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.03,rounding_size=0.1',
                             facecolor=color, edgecolor=edge, lw=1.3, zorder=3)
        ax.add_patch(box)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center',
                fontsize=fs, fontweight='bold', color='#0f172a', multialignment='center', zorder=4)

    def draw_arr(x1, y1, x2, y2, color='#334155'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='-|>', color=color, lw=1.3,
                                    shrinkA=3, shrinkB=3, mutation_scale=10), zorder=5)

    start_c = patches.Circle((2.75, 7.8), 0.18, facecolor='#0f172a', edgecolor='none', zorder=4)
    ax.add_patch(start_c)

    draw_act(1.5, 6.6, 2.5, 0.7, 'Buka Halaman Modul &\nKlik Mulai Petualangan 3D')
    draw_act(6.0, 6.6, 3.0, 0.7, 'Tampilkan Overlay Briefing Guru\nSesuai Topik Aktif (Audio id-ID)')
    draw_act(1.5, 5.4, 2.5, 0.7, 'Jalan Melintasi Gapura (WASD)\n& Ambil Koin Emas')
    draw_act(6.0, 5.4, 3.0, 0.7, 'Play Sound Coin (+5 Skor Game)\n& Render Karakter Teman Sekelas')
    draw_act(1.5, 4.2, 2.5, 0.7, 'Dekati Rumah Pos Budaya\n& Tekan Tombol E')
    draw_act(6.0, 4.2, 3.0, 0.7, 'Buka Modal Kuis Materi Pos\n(Pilihan Ganda Kontekstual)')
    draw_act(1.5, 3.0, 2.5, 0.7, 'Pilih Opsi Jawaban Kuis\n& Submit Jawaban')
    draw_act(10.8, 3.0, 2.9, 0.7, 'Koreksi Nilai di Backend\n& Simpan ke Submissions DB')
    draw_act(6.0, 1.8, 3.0, 0.7, 'Tampilkan Feedback Penjelasan Guru,\nUpdate Skor Kuis & Skor Game')
    draw_act(1.5, 1.8, 2.5, 0.7, 'Lihat Twin Badges &\nLanjut Jelajah Pos Berikutnya')

    end_c1 = patches.Circle((2.75, 0.9), 0.22, facecolor='#ffffff', edgecolor='#0f172a', lw=1.5, zorder=4)
    end_c2 = patches.Circle((2.75, 0.9), 0.13, facecolor='#0f172a', edgecolor='none', zorder=5)
    ax.add_patch(end_c1)
    ax.add_patch(end_c2)

    draw_arr(2.75, 7.6, 2.75, 7.3)
    draw_arr(4.0, 6.95, 6.0, 6.95)
    draw_arr(7.5, 6.6, 2.75, 6.1)
    draw_arr(2.75, 5.4, 6.0, 5.75)
    draw_arr(6.0, 5.4, 2.75, 4.9)
    draw_arr(2.75, 4.2, 6.0, 4.55)
    draw_arr(6.0, 4.2, 2.75, 3.7)
    draw_arr(4.0, 3.35, 10.8, 3.35)
    draw_arr(12.25, 3.0, 7.5, 2.5)
    draw_arr(6.0, 2.15, 4.0, 2.15)
    draw_arr(2.75, 1.8, 2.75, 1.15)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_4_6_activity_diagram.png'), dpi=300)
    plt.close()
    print('Gambar 4.6 Activity Diagram generated.')

# -------------------------------------------------------------
# GAMBAR 4.7: SEQUENCE DIAGRAM
# -------------------------------------------------------------
def make_gambar_4_7():
    fig, ax = plt.subplots(figsize=(15, 11), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 11)
    ax.axis('off')

    ax.text(7.5, 10.6, 'Gambar 4.7 – Sequence Diagram Interaksi RAG, Web Speech API & Gamifikasi 3D',
            ha='center', va='center', fontsize=12.5, fontweight='bold', color='#0f172a')
    ax.text(7.5, 10.25, 'Pemodelan Interaksi Berurutan Menggunakan Fragmen UML: LOOP (Login), ALT (RAG vs Fallback), dan OPT (Audio Suara)',
            ha='center', va='center', fontsize=8.5, color='#475569')

    lifelines = [
        ('Pelajar', 1.2),
        ('Next.js Client', 3.8),
        ('Node Express API', 6.8),
        ('Google Gemini API', 9.8),
        ('Web Speech API', 12.0),
        ('MySQL / JSON Store', 14.0)
    ]

    for name, x in lifelines:
        box = FancyBboxPatch((x - 0.9, 9.4), 1.8, 0.6, boxstyle='round,pad=0.02,rounding_size=0.08',
                             facecolor='#eff6ff', edgecolor='#2563eb', lw=1.3, zorder=3)
        ax.add_patch(box)
        ax.text(x, 9.7, name, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#1d4ed8', zorder=4)
        ax.plot([x, x], [0.6, 9.4], color='#94a3b8', lw=1.2, linestyle='--', zorder=1)

    def draw_msg(x1, x2, y, label, is_return=False):
        style = '-|>'
        ls = '--' if is_return else '-'
        ax.annotate('', xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle=style, color='#1e293b', lw=1.2, linestyle=ls,
                                    shrinkA=2, shrinkB=2, mutation_scale=9), zorder=4)
        ax.text((x1+x2)/2, y + 0.12, label, ha='center', va='center',
                fontsize=6.8, color='#0f172a', fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.08', facecolor='#ffffff', edgecolor='none', alpha=0.9), zorder=5)

    def draw_fragment(x, y, w, h, kind, guard=''):
        box = FancyBboxPatch((x, y), w, h, boxstyle='square,pad=0',
                             facecolor='none', edgecolor='#7c3aed', lw=1.4, linestyle='-', zorder=2)
        ax.add_patch(box)
        tag = FancyBboxPatch((x, y + h - 0.4), 0.9, 0.4, boxstyle='square,pad=0',
                             facecolor='#7c3aed', edgecolor='#7c3aed', zorder=3)
        ax.add_patch(tag)
        ax.text(x + 0.45, y + h - 0.2, kind, ha='center', va='center',
                fontsize=7, fontweight='bold', color='#ffffff', zorder=4)
        if guard:
            ax.text(x + 1.1, y + h - 0.2, f'[{guard}]', ha='left', va='center',
                    fontsize=6.8, fontweight='bold', color='#7c3aed', zorder=4)

    draw_fragment(0.6, 7.8, 6.8, 1.4, 'loop', 'Coba Login Max 3x')
    draw_msg(1.2, 3.8, 8.7, '1: Masukkan Kredensial (email, password)')
    draw_msg(3.8, 6.8, 8.4, '2: POST /api/auth/login (Bcrypt verify)')
    draw_msg(6.8, 3.8, 8.0, '3: Return JWT Token & User Role', is_return=True)

    draw_fragment(3.2, 4.6, 11.2, 2.9, 'alt', 'Sukses Gemini AI')
    draw_msg(3.8, 6.8, 7.1, '4: GET /api/rag/content?module=mod-pkn')
    draw_msg(6.8, 9.8, 6.7, '5: Kirim 5 Top Chunks + Prompt Pedagogis')
    draw_msg(9.8, 6.8, 6.3, '6: Return Ringkasan, Analogi, & Soal Pos', is_return=True)
    draw_msg(6.8, 3.8, 5.9, '7: Render Panel AI & Briefing Desa 3D', is_return=True)

    ax.plot([3.2, 14.4], [5.6, 5.6], color='#7c3aed', lw=1.2, linestyle=':', zorder=3)
    ax.text(3.4, 5.4, '[else: Gemini Sibuk / Offline]', fontsize=6.8, fontweight='bold', color='#7c3aed', zorder=4)
    draw_msg(6.8, 3.8, 4.9, '8: Gunakan Modul Lokal Guru & Notifikasi Ramah', is_return=True)

    draw_fragment(0.6, 2.8, 12.0, 1.5, 'opt', 'Pelajar Klik Dengarkan Arahan')
    draw_msg(1.2, 3.8, 3.9, '9: Trigger speakGuruVoice(briefingText)')
    draw_msg(3.8, 12.0, 3.5, '10: Web Speech API Synthesis (id-ID)')
    draw_msg(12.0, 1.2, 3.1, '11: Gelombang Suara Nyata Pak Guru Terdengar', is_return=True)

    draw_msg(1.2, 3.8, 2.3, '12: Selesaikan Kuis Pos & Ambil Koin 3D')
    draw_msg(3.8, 6.8, 1.9, '13: POST /api/student/quiz-submission')
    draw_msg(6.8, 14.0, 1.5, '14: Simpan Skor Kuis & Skor Game')
    draw_msg(14.0, 6.8, 1.1, '15: Response Updated Leaderboard', is_return=True)
    draw_msg(6.8, 3.8, 0.7, '16: Sinkronisasi Twin Badges di Header', is_return=True)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_4_7_sequence_diagram.png'), dpi=300)
    plt.close()
    print('Gambar 4.7 Sequence Diagram generated.')

# -------------------------------------------------------------
# GAMBAR 4.8: CLASS DIAGRAM
# -------------------------------------------------------------
def make_gambar_4_8():
    fig, ax = plt.subplots(figsize=(15, 11), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 11)
    ax.axis('off')

    ax.text(7.5, 10.6, 'Gambar 4.8 – Class Diagram Struktur Objek Sistem ExplainMyLesson AI',
            ha='center', va='center', fontsize=13, fontweight='bold', color='#0f172a')
    ax.text(7.5, 10.25, 'Model Kelas Berorientasi Objek Aktual Merefleksikan Entitas Modul, Sesi 3D, Dual Scoring & Remedial',
            ha='center', va='center', fontsize=8.5, color='#475569')

    def draw_class(x, y, w, h, name, attrs, methods, color='#eff6ff', edge='#2563eb'):
        box = FancyBboxPatch((x, y), w, h, boxstyle='square,pad=0',
                             facecolor=color, edgecolor=edge, lw=1.4, zorder=3)
        ax.add_patch(box)
        h_box = FancyBboxPatch((x, y + h - 0.5), w, 0.5, boxstyle='square,pad=0',
                               facecolor=edge, edgecolor=edge, zorder=4)
        ax.add_patch(h_box)
        ax.text(x + w/2, y + h - 0.25, name, ha='center', va='center',
                fontsize=8, fontweight='bold', color='#ffffff', zorder=5)

        div_y = y + h - 0.5 - (len(attrs) * 0.24 + 0.1)
        ax.plot([x, x + w], [div_y, div_y], color=edge, lw=1.0, zorder=4)

        curr_y = y + h - 0.75
        for a in attrs:
            ax.text(x + 0.12, curr_y, a, ha='left', va='center', fontsize=6.8, color='#1e293b', zorder=5)
            curr_y -= 0.22

        curr_y = div_y - 0.2
        for m in methods:
            ax.text(x + 0.12, curr_y, m, ha='left', va='center', fontsize=6.8, color='#1e293b', zorder=5)
            curr_y -= 0.22

    def draw_rel(x1, y1, x2, y2, card1='', card2='', label=''):
        ax.plot([x1, x2], [y1, y2], color='#334155', lw=1.3, zorder=2)
        if card1:
            ax.text(x1 + 0.15, y1 - 0.15, card1, fontsize=7, fontweight='bold', color='#0f172a', zorder=5)
        if card2:
            ax.text(x2 - 0.25, y2 - 0.15, card2, fontsize=7, fontweight='bold', color='#0f172a', zorder=5)
        if label:
            ax.text((x1+x2)/2, (y1+y2)/2 + 0.12, label, ha='center', va='center',
                    fontsize=6.5, color='#475569', zorder=5)

    draw_class(0.6, 6.8, 3.0, 2.8, 'User',
               ['- id: string', '- name: string', '- email: string', '- role: enum(pengajar,pelajar)', '- passwordHash: string'],
               ['+ login(pass): boolean', '+ getProfile(): object', '+ updatePassword(): void'])

    draw_class(5.8, 6.8, 3.4, 2.8, 'Module',
               ['- id: string', '- title: string', '- subject: string', '- validatedByGuru: boolean', '- originalFilePath: string'],
               ['+ uploadPdf(): void', '+ runRagExtraction(): void', '+ exportReport(): Blob'])

    draw_class(11.0, 6.8, 3.2, 2.8, 'Chapter',
               ['- id: string', '- moduleId: string', '- title: string', '- orderIndex: int', '- summaryText: string'],
               ['+ getBriefingGuru(): object', '+ getPosList(): Pos[]', '+ updateMilestone(): void'])

    draw_class(0.6, 2.2, 3.0, 2.8, 'EduGameSession',
               ['- sessionId: string', '- studentId: string', '- gamePoints: int', '- coinsCollected: int', '- visitedStations: int[]'],
               ['+ collectCoin(val): void', '+ visitStation(id): void', '+ sapaTeman(id): void'])

    draw_class(5.8, 2.2, 3.4, 2.8, 'QuizResult',
               ['- resultId: string', '- studentId: string', '- chapterId: string', '- quizScore: decimal', '- passedStatus: boolean'],
               ['+ submitAnswers(ans): void', '+ calculateGrade(): int', '+ isRemedial(): boolean'])

    draw_class(11.0, 2.2, 3.2, 2.8, 'RemedialRecommendation',
               ['- recId: string', '- studentId: string', '- weakChapterId: string', '- scoreObtained: decimal', '- status: enum'],
               ['+ triggerAlert(): void', '+ generateStudyPlan(): string', '+ markResolved(): void'])

    draw_rel(3.6, 8.2, 5.8, 8.2, '1', '1..*', 'mengelola')
    draw_rel(9.2, 8.2, 11.0, 8.2, '1', '1..*', 'memiliki')
    draw_rel(2.1, 6.8, 2.1, 5.0, '1', '0..*', 'memainkan')
    draw_rel(7.5, 6.8, 7.5, 5.0, '1', '0..*', 'diujikan')
    draw_rel(3.6, 3.6, 5.8, 3.6, '1', '1', 'terhubung')
    draw_rel(9.2, 3.6, 11.0, 3.6, '1', '0..1', 'memicu bila < 60')

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_4_8_class_diagram.png'), dpi=300)
    plt.close()
    print('Gambar 4.8 Class Diagram generated.')

make_gambar_4_5()
make_gambar_4_6()
make_gambar_4_7()
make_gambar_4_8()
