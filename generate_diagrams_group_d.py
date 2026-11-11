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
# GAMBAR 7.1: MOCKUP ANTARMUKA ROLE PELAJAR
# -------------------------------------------------------------
def make_gambar_7_1():
    fig, ax = plt.subplots(figsize=(15, 11), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 11)
    ax.axis('off')

    ax.text(7.5, 10.6, 'Gambar 7.1 – Mockup Antarmuka Terkini Role Pelajar (Dashboard Siswa, Twin Badges & Game 3D)',
            ha='center', va='center', fontsize=12.5, fontweight='bold', color='#0f172a')
    ax.text(7.5, 10.25, 'Visualisasi Dashboard Siswa: Twin Score Badges, Connected Milestone Stepper, & Modal 3D Petualangan Desa Nusantara',
            ha='center', va='center', fontsize=8.5, color='#475569')

    frame = FancyBboxPatch((0.5, 0.4), 14.0, 9.6, boxstyle='round,pad=0.02,rounding_size=0.1',
                           facecolor='#0f172a', edgecolor='#334155', lw=2.0, zorder=1)
    ax.add_patch(frame)

    bar = FancyBboxPatch((0.5, 9.3), 14.0, 0.7, boxstyle='square,pad=0',
                         facecolor='#1e293b', edgecolor='#334155', lw=1.0, zorder=2)
    ax.add_patch(bar)
    ax.add_patch(patches.Circle((0.9, 9.65), 0.1, facecolor='#ef4444', edgecolor='none', zorder=3))
    ax.add_patch(patches.Circle((1.2, 9.65), 0.1, facecolor='#f59e0b', edgecolor='none', zorder=3))
    ax.add_patch(patches.Circle((1.5, 9.65), 0.1, facecolor='#10b981', edgecolor='none', zorder=3))
    ax.text(2.0, 9.65, 'ExplainMyLesson AI – Dashboard Pelajar: Pendidikan Pancasila',
            ha='left', va='center', fontsize=7.5, fontweight='bold', color='#f8fafc', zorder=3)

    nav = FancyBboxPatch((0.8, 8.3), 13.4, 0.9, boxstyle='round,pad=0.02,rounding_size=0.08',
                         facecolor='#1e3a8a', edgecolor='#3b82f6', lw=1.2, zorder=2)
    ax.add_patch(nav)
    ax.text(1.2, 8.75, 'ExplainMyLesson AI', fontsize=8.5, fontweight='bold', color='#ffffff', zorder=3)
    ax.text(3.5, 8.75, 'Modul: Pendidikan Pancasila (Norma & Sila 3)', fontsize=7.2, color='#93c5fd', zorder=3)

    b1 = FancyBboxPatch((8.2, 8.45), 2.2, 0.6, boxstyle='round,pad=0.02,rounding_size=0.15',
                        facecolor='#78350f', edgecolor='#f59e0b', lw=1.2, zorder=3)
    ax.add_patch(b1)
    ax.text(9.3, 8.75, 'Skor Game: 270 Poin', ha='center', va='center',
            fontsize=7, fontweight='bold', color='#fbbf24', zorder=4)

    ax.plot([10.6, 10.6], [8.45, 9.05], color='#60a5fa', lw=1.2, zorder=3)

    b2 = FancyBboxPatch((10.8, 8.45), 2.2, 0.6, boxstyle='round,pad=0.02,rounding_size=0.15',
                        facecolor='#064e3b', edgecolor='#10b981', lw=1.2, zorder=3)
    ax.add_patch(b2)
    ax.text(11.9, 8.75, 'Skor Kuis: 90 / 100', ha='center', va='center',
            fontsize=7, fontweight='bold', color='#6ee7b7', zorder=4)

    stepper_card = FancyBboxPatch((0.8, 6.0), 13.4, 2.1, boxstyle='round,pad=0.02,rounding_size=0.08',
                                  facecolor='#1e293b', edgecolor='#475569', lw=1.2, zorder=2)
    ax.add_patch(stepper_card)
    ax.text(1.2, 7.85, 'JALUR REL PETA WAKTU (Connected Milestone Stepper)',
            fontsize=8, fontweight='bold', color='#fde047', zorder=3)
    ax.text(12.5, 7.85, '[Jalur Rel Waktu]  [Pita Berurutan]',
            ha='right', fontsize=7, color='#94a3b8', zorder=3)

    ax.plot([1.8, 13.2], [7.1, 7.1], color='#334155', lw=3.0, zorder=3)
    ax.plot([1.8, 7.5], [7.1, 7.1], color='#eab308', lw=3.0, zorder=4)

    milestones = [
        (1.8, '1', '1945', 'BPUPKI', True),
        (3.7, '2', '1945', 'Panitia 9', True),
        (5.6, '3', '1945', 'Piagam Jkt', True),
        (7.5, '4', '1950', 'Garuda', True),
        (9.4, '5', '1928', 'Sumpah Pemuda', False),
        (11.3, '6', '1945', 'Merah Putih', False),
        (13.2, '7', '1365', 'Bhinneka', False)
    ]
    for mx, num, year, mlabel, active in milestones:
        m_col = '#eab308' if active else '#334155'
        t_col = '#0f172a' if active else '#cbd5e1'
        c = patches.Circle((mx, 7.1), 0.28, facecolor=m_col, edgecolor='#fef08a' if active else '#475569',
                           lw=1.5, zorder=5)
        ax.add_patch(c)
        ax.text(mx, 7.1, num, ha='center', va='center', fontsize=7.5, fontweight='bold', color=t_col, zorder=6)
        ax.text(mx, 7.55, year, ha='center', va='center', fontsize=6.2, fontweight='bold', color='#fde047', zorder=6)
        ax.text(mx, 6.55, mlabel, ha='center', va='center', fontsize=6.5, color='#e2e8f0', zorder=6)

    game_card = FancyBboxPatch((0.8, 0.7), 13.4, 5.0, boxstyle='round,pad=0.02,rounding_size=0.08',
                               facecolor='#0369a1', edgecolor='#38bdf8', lw=1.5, zorder=2)
    ax.add_patch(game_card)

    ground = FancyBboxPatch((1.0, 0.9), 13.0, 3.2, boxstyle='square,pad=0',
                            facecolor='#14532d', edgecolor='#166534', zorder=3)
    ax.add_patch(ground)
    path = patches.Polygon([(7.5, 4.1), (8.5, 4.1), (11.0, 0.9), (4.0, 0.9)],
                           facecolor='#78350f', edgecolor='#92400e', zorder=4)
    ax.add_patch(path)

    gapura = FancyBboxPatch((5.8, 3.2), 3.4, 1.4, boxstyle='round,pad=0.02,rounding_size=0.08',
                            facecolor='#b45309', edgecolor='#fde047', lw=1.5, zorder=5)
    ax.add_patch(gapura)
    ax.text(7.5, 3.9, 'GAPURA NUSANTARA DESA PANCASILA', ha='center', va='center',
            fontsize=7, fontweight='bold', color='#ffffff', zorder=6)

    guru_box = FancyBboxPatch((1.5, 1.8), 3.5, 2.5, boxstyle='round,pad=0.03,rounding_size=0.1',
                              facecolor='#0f172a', edgecolor='#38bdf8', lw=1.5, alpha=0.92, zorder=6)
    ax.add_patch(guru_box)
    ax.text(3.25, 3.95, 'Pak Guru Virtual 3D', ha='center', va='center',
            fontsize=7.5, fontweight='bold', color='#38bdf8', zorder=7)
    ax.text(3.25, 3.2, 'Selamat datang anak-anak!\nPelajari 4 macam norma di 5 pos desa ini!\nKumpulkan koin emas dan raih nilai terbaik!',
            ha='center', va='center', fontsize=6.2, color='#e2e8f0', zorder=7, multialignment='center')
    btn_audio = FancyBboxPatch((1.8, 2.1), 2.9, 0.5, boxstyle='round,pad=0.02,rounding_size=0.1',
                               facecolor='#0284c7', edgecolor='#38bdf8', lw=1.0, zorder=7)
    ax.add_patch(btn_audio)
    ax.text(3.25, 2.35, 'Dengarkan Arahan (Audio id-ID)', ha='center', va='center',
            fontsize=6.5, fontweight='bold', color='#ffffff', zorder=8)

    pos_coords = [(4.5, 2.8, 'Pos 1: Agama'), (9.5, 2.8, 'Pos 2: Susila'),
                  (3.5, 1.2, 'Pos 3: Sopan'), (10.5, 1.2, 'Pos 4: Hukum')]
    for px, py, pname in pos_coords:
        p_box = FancyBboxPatch((px, py), 1.6, 0.9, boxstyle='square,pad=0',
                               facecolor='#854d0e', edgecolor='#fef08a', lw=1.2, zorder=6)
        ax.add_patch(p_box)
        ax.text(px + 0.8, py + 0.45, pname, ha='center', va='center',
                fontsize=6.2, fontweight='bold', color='#ffffff', zorder=7)

    coins = [(6.8, 2.2), (7.8, 2.5), (7.2, 1.5), (8.0, 1.2)]
    for cx, cy in coins:
        cc = patches.Circle((cx, cy), 0.16, facecolor='#facc15', edgecolor='#ca8a04', lw=1.2, zorder=6)
        ax.add_patch(cc)
        ax.text(cx, cy, '+5', ha='center', va='center', fontsize=5.8, fontweight='bold', color='#713f12', zorder=7)

    peer_box = FancyBboxPatch((9.2, 4.3), 3.2, 0.8, boxstyle='round,pad=0.02,rounding_size=0.08',
                              facecolor='#1e293b', edgecolor='#a855f7', lw=1.2, zorder=7)
    ax.add_patch(peer_box)
    ax.text(10.8, 4.7, 'Teman Sekelas Online: Ridho', ha='center', va='center',
            fontsize=6.2, fontweight='bold', color='#d8b4fe', zorder=8)
    ax.text(10.8, 4.4, 'Hai kawan! Semangat belajar Pancasila!', ha='center', va='center',
            fontsize=5.8, color='#cbd5e1', zorder=8)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_7_1_mockup_pelajar.png'), dpi=300)
    plt.close()
    print('Gambar 7.1 Mockup Pelajar generated.')

# -------------------------------------------------------------
# GAMBAR 7.2: MOCKUP ANTARMUKA ROLE PENGAJAR
# -------------------------------------------------------------
def make_gambar_7_2():
    fig, ax = plt.subplots(figsize=(15, 11), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 11)
    ax.axis('off')

    ax.text(7.5, 10.6, 'Gambar 7.2 – Mockup Antarmuka Terkini Role Pengajar (Live Monitor Guru, Gauge & Remedial)',
            ha='center', va='center', fontsize=12.5, fontweight='bold', color='#0f172a')
    ax.text(7.5, 10.25, 'Visualisasi Dashboard Guru: Live Student Monitor, Gauge Pemahaman, Alert Siswa Remedial (<60) & Ekspor Laporan',
            ha='center', va='center', fontsize=8.5, color='#475569')

    frame = FancyBboxPatch((0.5, 0.4), 14.0, 9.6, boxstyle='round,pad=0.02,rounding_size=0.1',
                           facecolor='#0f172a', edgecolor='#334155', lw=2.0, zorder=1)
    ax.add_patch(frame)

    bar = FancyBboxPatch((0.5, 9.3), 14.0, 0.7, boxstyle='square,pad=0',
                         facecolor='#1e293b', edgecolor='#334155', lw=1.0, zorder=2)
    ax.add_patch(bar)
    ax.add_patch(patches.Circle((0.9, 9.65), 0.1, facecolor='#ef4444', edgecolor='none', zorder=3))
    ax.add_patch(patches.Circle((1.2, 9.65), 0.1, facecolor='#f59e0b', edgecolor='none', zorder=3))
    ax.add_patch(patches.Circle((1.5, 9.65), 0.1, facecolor='#10b981', edgecolor='none', zorder=3))
    ax.text(2.0, 9.65, 'ExplainMyLesson AI – Dashboard Pengajar / Meja Guru & Monitor Kelas',
            ha='left', va='center', fontsize=7.5, fontweight='bold', color='#f8fafc', zorder=3)

    nav = FancyBboxPatch((0.8, 8.3), 13.4, 0.9, boxstyle='round,pad=0.02,rounding_size=0.08',
                         facecolor='#1e3a8a', edgecolor='#3b82f6', lw=1.2, zorder=2)
    ax.add_patch(nav)
    ax.text(1.2, 8.75, 'Meja Guru ExplainMyLesson AI', fontsize=8.5, fontweight='bold', color='#ffffff', zorder=3)
    ax.text(4.2, 8.75, 'Pengampu: Darmawan Lahru R., S.Kom., M.MT', fontsize=7.2, color='#93c5fd', zorder=3)

    b_up = FancyBboxPatch((9.2, 8.45), 1.9, 0.6, boxstyle='round,pad=0.02,rounding_size=0.1',
                          facecolor='#15803d', edgecolor='#22c55e', lw=1.0, zorder=3)
    ax.add_patch(b_up)
    ax.text(10.15, 8.75, '+ Unggah Modul', ha='center', va='center', fontsize=6.8, fontweight='bold', color='#ffffff', zorder=4)

    b_exp = FancyBboxPatch((11.3, 8.45), 2.7, 0.6, boxstyle='round,pad=0.02,rounding_size=0.1',
                           facecolor='#0284c7', edgecolor='#38bdf8', lw=1.0, zorder=3)
    ax.add_patch(b_exp)
    ax.text(12.65, 8.75, 'Ekspor Rekap (PDF/Excel)', ha='center', va='center', fontsize=6.8, fontweight='bold', color='#ffffff', zorder=4)

    stat_cards = [
        (0.8, 'TOTAL PELAJAR', '32 Siswa', 'Kelas Aktif', '#1e293b', '#3b82f6'),
        (4.2, 'RATA-RATA KELAS', '84.5%', 'Kategori Sangat Baik', '#1e293b', '#10b981'),
        (7.6, 'ALERT REMEDIAL (<60)', '2 Siswa', 'Perlu Bimbingan Pos!', '#7f1d1d', '#ef4444'),
        (11.0, 'SKOR GAME KELAS', '4,850 Poin', 'Koin & EduGame 3D', '#78350f', '#f59e0b')
    ]
    for sx, stitle, sval, ssub, sbg, sedge in stat_cards:
        sc = FancyBboxPatch((sx, 6.9), 3.2, 1.2, boxstyle='round,pad=0.02,rounding_size=0.08',
                            facecolor=sbg, edgecolor=sedge, lw=1.3, zorder=2)
        ax.add_patch(sc)
        ax.text(sx + 0.2, 7.85, stitle, fontsize=6.5, fontweight='bold', color='#94a3b8' if sedge!='#ef4444' else '#fca5a5', zorder=3)
        ax.text(sx + 0.2, 7.45, sval, fontsize=9.5, fontweight='bold', color='#ffffff', zorder=3)
        ax.text(sx + 0.2, 7.1, ssub, fontsize=6.2, color='#cbd5e1', zorder=3)

    gauge_card = FancyBboxPatch((0.8, 0.7), 4.8, 5.9, boxstyle='round,pad=0.02,rounding_size=0.08',
                                facecolor='#1e293b', edgecolor='#475569', lw=1.2, zorder=2)
    ax.add_patch(gauge_card)
    ax.text(1.1, 6.25, 'ANALISIS PEMAHAMAN PER TOPIK', fontsize=7.8, fontweight='bold', color='#38bdf8', zorder=3)

    topics = [
        ('1. Norma & Aturan Masyarakat', 0.92, '#10b981', '92% (Tuntas)'),
        ('2. Sila Ke-3 Persatuan Indonesia', 0.88, '#10b981', '88% (Tuntas)'),
        ('3. Keberagaman Bhinneka Tunggal Ika', 0.81, '#3b82f6', '81% (Tuntas)'),
        ('4. Basa Jawa: Unggah-Ungguh Basa', 0.74, '#eab308', '74% (Cukup)'),
        ('5. Basa Jawa: Aksara Jawa Carakan', 0.58, '#ef4444', '58% (REMEDIAL)')
    ]
    cy = 5.6
    for tname, tfrac, tcol, tstatus in topics:
        ax.text(1.1, cy, tname, fontsize=6.8, fontweight='bold', color='#f8fafc', zorder=3)
        ax.add_patch(FancyBboxPatch((1.1, cy - 0.35), 4.2, 0.18, boxstyle='square,pad=0',
                                    facecolor='#334155', edgecolor='none', zorder=3))
        ax.add_patch(FancyBboxPatch((1.1, cy - 0.35), 4.2 * tfrac, 0.18, boxstyle='square,pad=0',
                                    facecolor=tcol, edgecolor='none', zorder=4))
        ax.text(5.3, cy, tstatus, ha='right', fontsize=6.2, fontweight='bold', color=tcol, zorder=3)
        cy -= 0.65

    alert_box = FancyBboxPatch((1.0, 0.9), 4.4, 1.2, boxstyle='round,pad=0.02,rounding_size=0.06',
                               facecolor='#450a0a', edgecolor='#dc2626', lw=1.2, zorder=3)
    ax.add_patch(alert_box)
    ax.text(1.2, 1.8, 'Peringatan Otomatis Remedial Guru:', fontsize=6.5, fontweight='bold', color='#fca5a5', zorder=4)
    ax.text(1.2, 1.4, 'Topik Aksara Jawa di bawah KKM (<60).\nSaran: Berikan materi pengayaan analogi cerita Hanacaraka!',
            fontsize=6.0, color='#fee2e2', zorder=4)

    table_card = FancyBboxPatch((5.8, 0.7), 8.4, 5.9, boxstyle='round,pad=0.02,rounding_size=0.08',
                                facecolor='#1e293b', edgecolor='#475569', lw=1.2, zorder=2)
    ax.add_patch(table_card)
    ax.text(6.1, 6.25, 'MONITOR REAL-TIME EVALUASI SISWA (DUAL SCORING)',
            fontsize=7.8, fontweight='bold', color='#38bdf8', zorder=3)

    th_box = FancyBboxPatch((6.0, 5.65), 8.0, 0.45, boxstyle='square,pad=0',
                            facecolor='#334155', edgecolor='none', zorder=3)
    ax.add_patch(th_box)
    headers = [(6.2, 'No'), (6.6, 'Nama Siswa'), (8.8, 'Skor Kuis'), (10.2, 'Skor Game'), (11.6, 'Status'), (13.0, 'Aksi')]
    for hx, htitle in headers:
        ax.text(hx, 5.88, htitle, fontsize=6.5, fontweight='bold', color='#ffffff', zorder=4)

    rows = [
        ('1', 'Ghandur Fauzan N. H.', '95 / 100', '320 Poin', 'LULUS', '#10b981', '[Detail]'),
        ('2', 'Ridho Asykuri', '90 / 100', '280 Poin', 'LULUS', '#10b981', '[Detail]'),
        ('3', 'Bima Sakti', '85 / 100', '250 Poin', 'LULUS', '#10b981', '[Detail]'),
        ('4', 'Ayu Lestari', '80 / 100', '210 Poin', 'LULUS', '#10b981', '[Detail]'),
        ('5', 'Siti Rahmawati', '75 / 100', '190 Poin', 'LULUS', '#10b981', '[Detail]'),
        ('6', 'Dodi Kurniawan', '55 / 100', '110 Poin', 'REMEDIAL', '#ef4444', '[Kirim Soal]'),
        ('7', 'Eko Prasetyo', '50 / 100', '95 Poin', 'REMEDIAL', '#ef4444', '[Kirim Soal]')
    ]
    ry = 5.25
    for r_no, r_name, r_q, r_g, r_stat, r_col, r_act in rows:
        row_bg = '#1e293b' if int(r_no)%2 == 1 else '#0f172a'
        ax.add_patch(FancyBboxPatch((6.0, ry - 0.15), 8.0, 0.4, boxstyle='square,pad=0',
                                    facecolor=row_bg, edgecolor='none', zorder=3))
        ax.text(6.2, ry + 0.05, r_no, fontsize=6.2, color='#cbd5e1', zorder=4)
        ax.text(6.6, ry + 0.05, r_name, fontsize=6.2, fontweight='bold', color='#ffffff', zorder=4)
        ax.text(8.8, ry + 0.05, r_q, fontsize=6.2, fontweight='bold', color='#34d399', zorder=4)
        ax.text(10.2, ry + 0.05, r_g, fontsize=6.2, fontweight='bold', color='#fbbf24', zorder=4)
        ax.text(11.6, ry + 0.05, r_stat, fontsize=6.2, fontweight='bold', color=r_col, zorder=4)
        ax.text(13.0, ry + 0.05, r_act, fontsize=6.2, color='#38bdf8', zorder=4)
        ry -= 0.45

    footer_box = FancyBboxPatch((6.0, 0.9), 8.0, 0.9, boxstyle='round,pad=0.02,rounding_size=0.06',
                                facecolor='#172554', edgecolor='#1e40af', lw=1.2, zorder=3)
    ax.add_patch(footer_box)
    ax.text(6.2, 1.55, 'Modul Kurikulum RAG Tervalidasi:', fontsize=6.5, fontweight='bold', color='#93c5fd', zorder=4)
    ax.text(6.2, 1.2, 'Pendidikan Pancasila (Bab 1-4) & Basa Jawa (Bab 1-5) telah diverifikasi guru dan siap dimainkan!',
            fontsize=6.0, color='#e0e7ff', zorder=4)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'gambar_7_2_mockup_pengajar.png'), dpi=300)
    plt.close()
    print('Gambar 7.2 Mockup Pengajar generated.')

make_gambar_7_1()
make_gambar_7_2()
