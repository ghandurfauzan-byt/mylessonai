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
# GAMBAR 4.1: SWIMLANE DIAGRAM SISTEM (TO-BE)
# -------------------------------------------------------------
def make_gambar_4_1():
    fig, ax = plt.subplots(figsize=(15, 9.5), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 9.5)
    ax.axis('off')
    
    # Title
    ax.text(7.5, 9.15, 'Gambar 4.1 – Swimlane Diagram Sistem Usulan (To-Be) ExplainMyLesson AI',
            ha='center', va='center', fontsize=13, fontweight='bold', color='#0f172a')
    ax.text(7.5, 8.85, 'Alur Integrasi Pengajar, AI RAG & Gamifikasi 3D Three.js, dan Pelajar',
            ha='center', va='center', fontsize=9.5, color='#475569')

    # Swimlane backgrounds
    lanes = [
        ('PENGAJAR (GURU / DOSEN)', 5.9, 2.7, '#eff6ff', '#bfdbfe', '#1d4ed8'),
        ('SISTEM EXPLAINMYLESSON AI (RAG, 3D & AUDIO)', 3.1, 2.7, '#f8fafc', '#cbd5e1', '#0f172a'),
        ('PELAJAR (SISWA)', 0.3, 2.7, '#f0fdf4', '#bbf7d0', '#15803d')
    ]
    
    for title, y, h, bg, border, tcolor in lanes:
        rect = FancyBboxPatch((0.5, y), 14, h, boxstyle='square,pad=0',
                             facecolor=bg, edgecolor=border, linewidth=1.5, zorder=1)
        ax.add_patch(rect)
        # Header banner on left
        h_rect = FancyBboxPatch((0.5, y), 2.2, h, boxstyle='square,pad=0',
                                facecolor=border, edgecolor=border, zorder=2)
        ax.add_patch(h_rect)
        ax.text(1.6, y + h/2, title, ha='center', va='center', rotation=90,
                fontsize=8.5, fontweight='bold', color=tcolor, zorder=3)

    def draw_node(x, y, w, h, text, color='#ffffff', edge='#94a3b8', tcolor='#0f172a', fs=7.5):
        box = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.03,rounding_size=0.08',
                             facecolor=color, edgecolor=edge, linewidth=1.2, zorder=4)
        ax.add_patch(box)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center',
                color=tcolor, fontsize=fs, fontweight='bold', zorder=5, multialignment='center')

    def draw_arrow(x1, y1, x2, y2, color='#475569', label=''):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='-|>', color=color, lw=1.3,
                                    shrinkA=3, shrinkB=3, mutation_scale=11), zorder=6)
        if label:
            ax.text((x1+x2)/2, (y1+y2)/2 + 0.12, label, ha='center', va='center',
                    fontsize=6.5, color=color, fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.1', facecolor='#ffffff', edgecolor='none', alpha=0.9), zorder=7)

    # Lane 1: Pengajar
    draw_node(3.0, 7.3, 1.8, 0.8, 'Mulai:\nUnggah Modul\n(Buku Ajar PDF)', '#dbeafe', '#3b82f6')
    draw_node(5.6, 7.3, 1.8, 0.8, 'Tinjau & Validasi\nRingkasan RAG\nOtomatis', '#dbeafe', '#3b82f6')
    draw_node(10.8, 7.3, 1.8, 0.8, 'Pantau Live\nDashboard Kelas &\nAlert Remedial', '#dbeafe', '#3b82f6')
    draw_node(13.0, 7.3, 1.3, 0.8, 'Ekspor Laporan\n(PDF/Excel)', '#dbeafe', '#3b82f6')

    # Lane 2: Sistem AI
    draw_node(3.0, 4.5, 1.8, 0.8, 'Ekstraksi Teks &\nChunking 500 Karakter\n(Chroma/TF-IDF)', '#ffffff', '#64748b')
    draw_node(5.6, 4.5, 1.8, 0.8, 'Google Gemini LLM:\nRingkasan, Analogi,\nMind Map & Kuis', '#ffffff', '#64748b')
    draw_node(8.2, 4.5, 1.9, 0.8, 'Generate Dunia 3D:\nGapura, 5 Pos Budaya\n& Pak Guru Virtual', '#fef3c7', '#d97706', '#92400e')
    draw_node(10.8, 4.5, 1.8, 0.8, 'Hitung Skor Ganda\n(Skor Game & Kuis)\n& Deteksi Remedial', '#ffffff', '#64748b')

    # Lane 3: Pelajar
    draw_node(3.0, 1.7, 1.8, 0.8, 'Login Pelajar &\nBuka Materi\nPilihan', '#dcfce7', '#22c55e')
    draw_node(5.6, 1.7, 1.8, 0.8, 'Baca Analogi &\nDengar Suara Robot\n(Web Speech API)', '#dcfce7', '#22c55e')
    draw_node(8.2, 1.7, 1.9, 0.8, 'Main Petualangan 3D:\nKoin Emas (+5) &\nKuis 5 Pos (+25)', '#dcfce7', '#22c55e')
    draw_node(10.8, 1.7, 1.8, 0.8, 'Pantau Twin Badges\n& Terima Saran\nRemedial (<60)', '#dcfce7', '#22c55e')
    draw_node(13.0, 1.7, 1.3, 0.8, 'Selesai:\nKuis Lulus &\nPoin Tercatat', '#dcfce7', '#22c55e')

    # Arrows
    draw_arrow(4.8, 7.7, 5.6, 7.7)
    draw_arrow(3.9, 7.3, 3.9, 5.3, label='Upload')
    draw_arrow(4.8, 4.9, 5.6, 4.9)
    draw_arrow(6.5, 5.3, 6.5, 7.3, label='Pratinjau')
    draw_arrow(7.4, 7.7, 8.2, 5.3, label='Validasi Sukses')
    draw_arrow(9.15, 4.5, 9.15, 2.5, label='Inisialisasi Game')
    draw_arrow(3.9, 2.5, 5.6, 2.1)
    draw_arrow(7.4, 2.1, 8.2, 2.1)
    draw_arrow(10.1, 2.1, 10.8, 2.1)
    draw_arrow(11.7, 2.5, 11.7, 4.5, label='Kirim Nilai')
    draw_arrow(11.7, 5.3, 11.7, 7.3, label='Update Statistik')
    draw_arrow(12.6, 7.7, 13.0, 7.7)
    draw_arrow(12.6, 2.1, 13.0, 2.1)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_4_1_swimlane.png'), dpi=300)
    plt.close()
    print('Gambar 4.1 Swimlane generated.')

make_gambar_4_1()
