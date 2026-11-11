# -*- coding: utf-8 -*-
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch

OUT_DIR = r'D:\ghandur rido 1\skpl_assets\diagrams'
os.makedirs(OUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# GAMBAR 4.2: FLOWCHART LOGIKA FITUR UTAMA
# -------------------------------------------------------------
def make_gambar_4_2():
    fig, ax = plt.subplots(figsize=(11, 14), dpi=300)
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 14)
    ax.axis('off')

    ax.text(5.5, 13.5, 'Gambar 4.2 – Flowchart Logika RAG Pipeline, Validasi Kurikulum & 3D Gamification',
            ha='center', va='center', fontsize=12, fontweight='bold', color='#0f172a')
    ax.text(5.5, 13.15, 'Alur Ekstraksi Teks, Reasoning Gemini AI, Validasi Pengajar, hingga Inisialisasi Game Edukasi',
            ha='center', va='center', fontsize=8.5, color='#475569')

    def draw_box(x, y, w, h, text, color='#f1f5f9', edge='#64748b', tcolor='#0f172a', fs=7.5, shape='rect'):
        if shape == 'round':
            p = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.03,rounding_size=0.15',
                               facecolor=color, edgecolor=edge, linewidth=1.5, zorder=3)
        elif shape == 'diamond':
            verts = [(x + w/2, y + h), (x + w, y + h/2), (x + w/2, y), (x, y + h/2)]
            p = patches.Polygon(verts, closed=True, facecolor=color, edgecolor=edge, linewidth=1.5, zorder=3)
        else:
            p = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.03,rounding_size=0.04',
                               facecolor=color, edgecolor=edge, linewidth=1.5, zorder=3)
        ax.add_patch(p)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center',
                color=tcolor, fontsize=fs, fontweight='bold', zorder=4, multialignment='center')

    def draw_arr(x1, y1, x2, y2, label='', color='#334155'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='-|>', color=color, lw=1.4,
                                    shrinkA=3, shrinkB=3, mutation_scale=10), zorder=5)
        if label:
            ax.text((x1+x2)/2 + 0.35, (y1+y2)/2, label, ha='center', va='center',
                    fontsize=7, color=color, fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.1', facecolor='#ffffff', edgecolor='none', alpha=0.9), zorder=6)

    # Start
    draw_box(4.0, 12.3, 3.0, 0.6, 'MULAI (Start)', '#dcfce7', '#16a34a', '#14532d', shape='round')
    # Step 1: Upload PDF
    draw_box(3.5, 11.2, 4.0, 0.7, 'Pengajar Mengunggah Modul Ajar (PDF)\n(Misal: PKn, Basa Jawa, Sejarah)', '#eff6ff', '#3b82f6')
    # Decision: File Valid?
    draw_box(3.5, 9.8, 4.0, 0.9, 'Apakah Format PDF &\nUkuran <= 20MB Valid?', '#fef3c7', '#d97706', shape='diamond', fs=7)
    # Reject box
    draw_box(0.5, 9.9, 2.2, 0.7, 'Tampilkan Notifikasi Error\nFormat Tidak Didukung', '#fee2e2', '#dc2626', '#7f1d1d', fs=7)
    # Step 2: Extraction & Chunking
    draw_box(3.5, 8.4, 4.0, 0.8, 'Sistem Ekstraksi Teks Bersih &\nPecah Menjadi Chunks 500 Karakter', '#eff6ff', '#3b82f6')
    # Step 3: Semantic Indexing
    draw_box(3.5, 7.2, 4.0, 0.8, 'Indexing Vektor & Prompt Construction\n(RAG Context Embedding)', '#eff6ff', '#3b82f6')
    # Step 4: LLM Generation
    draw_box(3.5, 6.0, 4.0, 0.8, 'Google Gemini LLM Generasi:\nRingkasan, Analogi Anak, Mind Map & Soal Kuis', '#fdf4ff', '#a855f7', '#581c87')
    # Step 5: Teacher Curates
    draw_box(3.5, 4.8, 4.0, 0.8, 'Pengajar Meninjau, Mengedit, &\nMenyetujui Validasi Modul Kurikulum', '#eff6ff', '#3b82f6')
    # Step 6: 3D Init
    draw_box(3.5, 3.6, 4.0, 0.8, 'Sistem Inisialisasi Desa 3D Three.js:\n5 Pos Budaya, Gapura, & Pak Guru Virtual', '#fef9c3', '#ca8a04', '#713f12')
    # Step 7: Student Play
    draw_box(3.5, 2.4, 4.0, 0.8, 'Pelajar Masuki Desa, Simak Suara Guru,\nAmbil Koin (+5) & Jawab Kuis Pos (+25)', '#dcfce7', '#16a34a', '#14532d')
    # Step 8: Analytics
    draw_box(3.5, 1.2, 4.0, 0.8, 'Sinkronisasi Dual Badges (Game & Kuis),\nUpdate Dashboard Kelas & Alert Remedial', '#eff6ff', '#3b82f6')
    # End
    draw_box(4.0, 0.2, 3.0, 0.6, 'SELESAI (End)', '#dcfce7', '#16a34a', '#14532d', shape='round')

    # Arrows
    draw_arr(5.5, 12.3, 5.5, 11.9)
    draw_arr(5.5, 11.2, 5.5, 10.7)
    draw_arr(5.5, 9.8, 5.5, 9.2, label='Ya')
    draw_arr(3.5, 10.25, 2.7, 10.25, label='Tidak')
    # Loop error back to upload
    ax.annotate('', xy=(3.5, 11.55), xytext=(1.6, 10.6),
                arrowprops=dict(arrowstyle='-|>', color='#dc2626', lw=1.2, linestyle='--'), zorder=5)
    draw_arr(5.5, 8.4, 5.5, 8.0)
    draw_arr(5.5, 7.2, 5.5, 6.8)
    draw_arr(5.5, 6.0, 5.5, 5.6)
    draw_arr(5.5, 4.8, 5.5, 4.4)
    draw_arr(5.5, 3.6, 5.5, 3.2)
    draw_arr(5.5, 2.4, 5.5, 2.0)
    draw_arr(5.5, 1.2, 5.5, 0.8)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_4_2_flowchart.png'), dpi=300)
    plt.close()
    print('Gambar 4.2 Flowchart generated.')

# -------------------------------------------------------------
# GAMBAR 4.3: DIAGRAM KONTEKS
# -------------------------------------------------------------
def make_gambar_4_3():
    fig, ax = plt.subplots(figsize=(13, 9), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 9)
    ax.axis('off')

    ax.text(6.5, 8.6, 'Gambar 4.3 – Diagram Konteks (Context Diagram / DFD Level 0 Boundary)',
            ha='center', va='center', fontsize=12, fontweight='bold', color='#0f172a')
    ax.text(6.5, 8.25, 'Interaksi Batas Sistem ExplainMyLesson AI dengan Seluruh Entitas Eksternal',
            ha='center', va='center', fontsize=8.5, color='#475569')

    # Center Process 0.0
    center_circle = patches.Circle((6.5, 4.5), 1.6, facecolor='#1e3a8a', edgecolor='#0284c7', linewidth=2.5, zorder=3)
    ax.add_patch(center_circle)
    ax.text(6.5, 4.85, '0.0\nSISTEM UTAMA\nEXPLAINMYLESSON AI', ha='center', va='center',
            color='#ffffff', fontsize=9, fontweight='bold', zorder=4)
    ax.text(6.5, 3.95, 'Platform Pembelajaran Adaptif\nRAG, 3D Tiga Dimensi & Analitik', ha='center', va='center',
            color='#93c5fd', fontsize=6.8, zorder=4)

    def draw_entity(x, y, w, h, title, icon=''):
        box = FancyBboxPatch((x, y), w, h, boxstyle='square,pad=0',
                             facecolor='#f8fafc', edgecolor='#334155', linewidth=1.8, zorder=3)
        ax.add_patch(box)
        ax.text(x + w/2, y + h/2, f'{icon} {title}' if icon else title, ha='center', va='center',
                color='#0f172a', fontsize=8.5, fontweight='bold', zorder=4)

    def draw_data_flow(x1, y1, x2, y2, label, label_up=True):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='-|>', color='#475569', lw=1.2,
                                    shrinkA=3, shrinkB=3, mutation_scale=10), zorder=5)
        offset = 0.15 if label_up else -0.15
        ax.text((x1+x2)/2, (y1+y2)/2 + offset, label, ha='center', va='center',
                fontsize=6.5, color='#1e293b', fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.1', facecolor='#ffffff', edgecolor='#cbd5e1', alpha=0.9), zorder=6)

    # 4 Entities
    draw_entity(0.5, 5.8, 2.5, 1.4, 'PENGAJAR\n(Guru / Dosen)', '👨‍🏫')
    draw_entity(0.5, 1.8, 2.5, 1.4, 'PELAJAR\n(Siswa / Mahasiswa)', '🎒')
    draw_entity(10.0, 5.8, 2.5, 1.4, 'GOOGLE GEMINI\nLLM API ENGINE', '🤖')
    draw_entity(10.0, 1.8, 2.5, 1.4, 'WEB SPEECH API\nBROWSER SYNTHESIS', '🔊')

    # Flows: Pengajar <-> Sistem
    draw_data_flow(3.0, 6.8, 5.1, 5.3, '1. Modul PDF & Validasi Kurikulum')
    draw_data_flow(5.1, 4.8, 3.0, 6.1, '2. Live Monitor & Rekap Nilai (PDF/Excel)', label_up=False)

    # Flows: Pelajar <-> Sistem
    draw_data_flow(3.0, 2.8, 5.1, 3.9, '3. Input Kuis, Sapa Teman, Navigasi 3D')
    draw_data_flow(5.1, 3.5, 3.0, 2.1, '4. Ringkasan, Skor Ganda & Arahan Guru', label_up=False)

    # Flows: Sistem <-> Gemini LLM
    draw_data_flow(7.8, 5.3, 10.0, 6.8, '5. Kirim Chunk 500 Char + Prompt RAG')
    draw_data_flow(10.0, 6.1, 7.8, 4.8, '6. Output Ringkasan, Analogi, & Kuis', label_up=False)

    # Flows: Sistem <-> Web Speech API
    draw_data_flow(7.8, 3.9, 10.0, 2.8, '7. Naskah Suara (id-ID / jv-ID)')
    draw_data_flow(10.0, 2.1, 7.8, 3.5, '8. Gelombang Audio Narasi Virtual', label_up=False)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_4_3_diagram_konteks.png'), dpi=300)
    plt.close()
    print('Gambar 4.3 Diagram Konteks generated.')

# -------------------------------------------------------------
# GAMBAR 4.4: DFD LEVEL 0
# -------------------------------------------------------------
def make_gambar_4_4():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 10)
    ax.axis('off')

    ax.text(7.5, 9.6, 'Gambar 4.4 – Data Flow Diagram (DFD) Level 0 ExplainMyLesson AI',
            ha='center', va='center', fontsize=13, fontweight='bold', color='#0f172a')
    ax.text(7.5, 9.25, 'Dekomposisi 6 Proses Utama, 5 Data Store, dan Aliran Data Antara Pengajar & Pelajar',
            ha='center', va='center', fontsize=8.5, color='#475569')

    def draw_proc(x, y, w, h, num, name):
        box = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.03,rounding_size=0.15',
                             facecolor='#eff6ff', edgecolor='#2563eb', linewidth=1.5, zorder=3)
        ax.add_patch(box)
        ax.text(x + w/2, y + h*0.7, f'Proses {num}', ha='center', va='center',
                color='#1d4ed8', fontsize=7.5, fontweight='bold', zorder=4)
        ax.text(x + w/2, y + h*0.35, name, ha='center', va='center',
                color='#0f172a', fontsize=7.2, fontweight='bold', zorder=4, multialignment='center')

    def draw_store(x, y, w, h, d_id, name):
        # Open-ended rect (data store standard)
        box = FancyBboxPatch((x, y), w, h, boxstyle='square,pad=0',
                             facecolor='#fefce8', edgecolor='#ca8a04', linewidth=1.3, zorder=3)
        ax.add_patch(box)
        # Vertical line for ID
        ax.plot([x + 0.6, x + 0.6], [y, y + h], color='#ca8a04', lw=1.3, zorder=4)
        ax.text(x + 0.3, y + h/2, d_id, ha='center', va='center',
                color='#854d0e', fontsize=7.5, fontweight='bold', zorder=4)
        ax.text(x + 0.7 + (w-0.7)/2, y + h/2, name, ha='center', va='center',
                color='#0f172a', fontsize=7, fontweight='bold', zorder=4)

    def draw_ent(x, y, w, h, name):
        box = FancyBboxPatch((x, y), w, h, boxstyle='square,pad=0',
                             facecolor='#f8fafc', edgecolor='#334155', linewidth=1.5, zorder=3)
        ax.add_patch(box)
        ax.text(x + w/2, y + h/2, name, ha='center', va='center',
                color='#0f172a', fontsize=8, fontweight='bold', zorder=4, multialignment='center')

    # Entities
    draw_ent(0.5, 6.8, 1.8, 1.2, 'PENGAJAR\n(Guru)')
    draw_ent(0.5, 1.8, 1.8, 1.2, 'PELAJAR\n(Siswa)')
    draw_ent(12.7, 4.5, 1.8, 1.2, 'GEMINI AI\nENGINE')

    # 6 Processes
    draw_proc(3.2, 7.8, 2.5, 1.0, '1.0', 'Autentikasi &\nManajemen Akun')
    draw_proc(6.5, 7.8, 2.6, 1.0, '2.0', 'Ekstraksi Modul &\nChunking 500 Char')
    draw_proc(9.8, 7.8, 2.5, 1.0, '3.0', 'Generasi Konten\nRAG & Narasi Audio')
    draw_proc(3.2, 4.3, 2.5, 1.0, '4.0', 'Petualangan 3D\n& Interaksi Desa')
    draw_proc(6.5, 4.3, 2.6, 1.0, '5.0', 'Evaluasi Kuis &\nDual Scoring')
    draw_proc(9.8, 4.3, 2.5, 1.0, '6.0', 'Analitik Kelas &\nDeteksi Remedial')

    # 5 Data Stores
    draw_store(3.2, 1.8, 2.5, 0.7, 'D1', 'Users (Auth DB)')
    draw_store(6.5, 6.3, 2.6, 0.7, 'D2', 'Modul & Chunks Store')
    draw_store(6.5, 2.8, 2.6, 0.7, 'D3', 'Game Sessions (Koin/3D)')
    draw_store(9.8, 6.3, 2.5, 0.7, 'D4', 'Quiz Results & Submissions')
    draw_store(9.8, 1.8, 2.5, 0.7, 'D5', 'Remedial & Analytics')

    # Arrows (Sample flows for DFD precision)
    def arr(x1, y1, x2, y2, color='#475569'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='-|>', color=color, lw=1.2,
                                    shrinkA=2, shrinkB=2, mutation_scale=9), zorder=5)

    arr(2.3, 7.5, 3.2, 8.2) # Pengajar -> Auth
    arr(2.3, 2.5, 3.2, 2.2) # Pelajar -> D1 / Auth
    arr(4.45, 7.8, 4.45, 2.5) # Auth <-> D1
    arr(2.3, 7.2, 6.5, 8.1) # Pengajar -> Upload Modul
    arr(7.8, 7.8, 7.8, 7.0) # Proc 2.0 -> D2 Modul
    arr(9.1, 8.3, 9.8, 8.3) # Proc 2.0 -> Proc 3.0
    arr(12.3, 8.3, 12.7, 5.5) # Proc 3.0 <-> Gemini
    arr(11.0, 7.8, 11.0, 7.0) # Proc 3.0 -> D4
    arr(2.3, 2.2, 3.2, 4.6) # Pelajar -> Game 3D
    arr(4.45, 4.3, 4.45, 3.5) # Game 3D <-> D3 Game
    arr(5.7, 4.8, 6.5, 4.8) # Game 3D -> Kuis
    arr(7.8, 4.3, 7.8, 3.5) # Kuis -> D4 / D3
    arr(9.1, 4.8, 9.8, 4.8) # Kuis -> Analitik
    arr(11.0, 4.3, 11.0, 2.5) # Analitik -> D5
    arr(9.8, 4.5, 2.3, 7.0) # Analitik -> Pengajar Dashboard

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_4_4_dfd_level_0.png'), dpi=300)
    plt.close()
    print('Gambar 4.4 DFD Level 0 generated.')

make_gambar_4_2()
make_gambar_4_3()
make_gambar_4_4()
