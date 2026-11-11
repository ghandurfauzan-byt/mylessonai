# -*- coding: utf-8 -*-
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

DIAGRAMS_DIR = r"D:\ghandur rido 1\skpl_assets\diagrams"
DOCX_OUT = r"D:\ghandur rido 1\SKPL_ExplainMyLesson_AI_Terbaru.docx"
MD_OUT = r"D:\ghandur rido 1\SKPL_ExplainMyLesson_AI_Terbaru.md"

doc = docx.Document()

for sec in doc.sections:
    sec.top_margin = Inches(1.57)
    sec.left_margin = Inches(1.57)
    sec.bottom_margin = Inches(1.18)
    sec.right_margin = Inches(1.18)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=130, right=130):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_table(doc, headers, rows, col_widths=None):
    table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    hdr_cells = table.rows[0].cells
    for i, header_text in enumerate(headers):
        hdr_cells[i].text = header_text
        set_cell_background(hdr_cells[i], "1E3A8A")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=130, right=130)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)
            run.font.size = Pt(9.5)
            run.font.name = "Calibri"

    for r_idx, row_data in enumerate(rows):
        row_cells = table.rows[r_idx + 1].cells
        bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, cell_value in enumerate(row_data):
            row_cells[c_idx].text = str(cell_value)
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=110, right=110)
            p = row_cells[c_idx].paragraphs[0]
            if c_idx == 0 and len(str(cell_value)) <= 8:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.size = Pt(9)
                run.font.name = "Calibri"
                run.font.color.rgb = RGBColor(30, 41, 59)

    if col_widths:
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_after = Pt(4)
    return table

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = RGBColor(30, 58, 138)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(11.5)
    run.font.bold = True
    run.font.color.rgb = RGBColor(14, 116, 144)
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(10)
    run.font.bold = True
    run.font.color.rgb = RGBColor(51, 65, 85)
    return p

def add_body_p(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.15
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(30, 41, 59)
    return p

def add_image_figure(doc, img_filename, caption_text, width_inches=5.8):
    img_path = os.path.join(DIAGRAMS_DIR, img_filename)
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(2)
        run = p_img.add_run()
        run.add_picture(img_path, width=Inches(width_inches))

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(10)
        p_cap.paragraph_format.keep_with_next = True
        run_cap = p_cap.add_run(caption_text)
        run_cap.font.name = "Calibri"
        run_cap.font.size = Pt(8.5)
        run_cap.font.bold = True
        run_cap.font.italic = True
        run_cap.font.color.rgb = RGBColor(71, 85, 105)

# 1. HALAMAN JUDUL (COVER)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("UNIVERSITAS SEBELAS MARET\nSEKOLAH VOKASI\nPROGRAM STUDI D3 TEKNIK INFORMATIKA KABUPATEN MADIUN\n\n\n")
run.font.name = "Calibri"
run.font.size = Pt(13)
run.font.bold = True
run.font.color.rgb = RGBColor(30, 58, 138)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("DOKUMEN SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK\n(Software Requirements Specification – SRS)\n\nUNTUK APLIKASI & WEBSITE\n")
run.font.name = "Calibri"
run.font.size = Pt(14)
run.font.bold = True
run.font.color.rgb = RGBColor(15, 23, 42)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("EXPLAINMYLESSON AI: SISTEM PEMBELAJARAN ADAPTIF BERBASIS RAG, GAMIFIKASI 3D TIGA DIMENSI, DAN ANALITIK PEMAHAMAN PELAJAR\n\n")
run.font.name = "Calibri"
run.font.size = Pt(16)
run.font.bold = True
run.font.color.rgb = RGBColor(2, 132, 199)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Version 2.0 (Edisi Mutakhir Selaras Rilis Web v8.0)\n\n\n")
run.font.name = "Calibri"
run.font.size = Pt(11)
run.font.bold = True
run.font.color.rgb = RGBColor(100, 116, 139)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Mata Kuliah: Manajemen Proyek Teknologi Informasi & Analisis Perancangan Sistem\n\nDisusun Oleh:\nGhandur Fauzan Ngauf Hisam (NIM. V3925024)\nRidho Asykuri (NIM. V3925015)\n\nDosen Pengampu:\nDarmawan Lahru Riatma, S.Kom., M.MT (NIP. 1991091420200801)\n\n\nMADIUN, 2026")
run.font.name = "Calibri"
run.font.size = Pt(11)
run.font.color.rgb = RGBColor(30, 41, 59)

doc.add_page_break()

# 2. LEMBAR PENGESAHAN
add_heading_1(doc, "LEMBAR PENGESAHAN")
add_body_p(doc, "Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SKPL) ini disusun sebagai dokumentasi teknis resmi, acuan perancangan sistem, dan pemenuhan tugas proyek mata kuliah Manajemen Proyek Teknologi Informasi pada Program Studi D3 Teknik Informatika Kabupaten Madiun, Sekolah Vokasi, Universitas Sebelas Maret.")
add_body_p(doc, "1. Nama Sistem: ExplainMyLesson AI (Platform Pembelajaran Adaptif Berbasis RAG & Gamifikasi 3D)\n2. Program Studi: D3 Teknik Informatika Kabupaten Madiun\n3. Pengembang / Mahasiswa Penyusun:\n   a. Nama Lengkap: Ghandur Fauzan Ngauf Hisam (NIM. V3925024)\n   b. Nama Lengkap: Ridho Asykuri (NIM. V3925015)\n4. Dosen Pengampu Mata Kuliah: Darmawan Lahru Riatma, S.Kom., M.MT (NIP. 1991091420200801)")
add_body_p(doc, "Madiun, 10 November 2026\n\nMenyetujui,\nDosen Pengampu Mata Kuliah,\n\n\n\nDarmawan Lahru Riatma, S.Kom., M.MT\nNIP. 1991091420200801\n\nDisusun Oleh Mahasiswa,\n\n\n\nGhandur Fauzan Ngauf Hisam / Ridho Asykuri\nNIM. V3925024 / V3925015")

doc.add_page_break()

# 3. DAFTAR ISI & DAFTAR GAMBAR
add_heading_1(doc, "DAFTAR ISI & STRUKTUR DOKUMEN")
toc_rows = [
    ("BAB I", "PENDAHULUAN (Latar Belakang, Tujuan, Ruang Lingkup, Glossary)"),
    ("BAB II", "DESKRIPSI UMUM SISTEM (Gambaran Umum, Aktor, Metode Agile Scrum)"),
    ("BAB III", "ANALISIS KEBUTUHAN SISTEM (25 Functional & 15 Non-Functional Requirements)"),
    ("BAB IV", "PEMODELAN PROSES BISNIS & STRUKTUR LOGIS (Swimlane, Flowchart, DFD, UML)"),
    ("BAB V", "ARSITEKTUR SISTEM & INFRASTRUKTUR TEKNIS (Three-Tier, Gemini API, Stack)"),
    ("BAB VI", "KEBUTUHAN DATA & STRUKTUR BASIS DATA (Kamus Data, ERD / CDM, PDM Fisik)"),
    ("BAB VII", "PERANCANGAN ANTARMUKA (High-Fidelity Mockup Siswa & Guru, Navigasi)"),
    ("BAB VIII", "KEAMANAN, PENGUJIAN & BATASAN (Security Control, 64 Unit Test, Usability SUS)"),
    ("BAB IX", "PENUTUP & DAFTAR PUSTAKA (Kesimpulan, Saran Pengembangan, Standar IEEE)")
]
create_table(doc, ["Bab", "Deskripsi Konten & Rincian Pembahasan"], toc_rows, [1.5, 4.5])

add_heading_2(doc, "DAFTAR GAMBAR RESMI SISTEM")
fig_rows = [
    ("Gambar 4.1", "Swimlane Diagram Sistem Usulan (To-Be) ExplainMyLesson AI"),
    ("Gambar 4.2", "Flowchart Logika RAG Pipeline, Validasi Kurikulum & 3D Gamification"),
    ("Gambar 4.3", "Diagram Konteks (Context Diagram / DFD Level 0 Boundary)"),
    ("Gambar 4.4", "Data Flow Diagram (DFD) Level 0 Sistem ExplainMyLesson AI"),
    ("Gambar 4.5", "Use Case Diagram Lengkap dengan Relasi <<include>> dan <<extend>>"),
    ("Gambar 4.6", "Activity Diagram Siklus Pembelajaran 3D Desa Nusantara & Kuis Adaptif"),
    ("Gambar 4.7", "Sequence Diagram Interaksi RAG, Web Speech API & Gamifikasi 3D"),
    ("Gambar 4.8", "Class Diagram Struktur Objek Sistem ExplainMyLesson AI"),
    ("Gambar 5.1", "Arsitektur Sistem (Three-Tier Architecture) ExplainMyLesson AI"),
    ("Gambar 6.1", "Entity Relationship Diagram (ERD / CDM) ExplainMyLesson AI"),
    ("Gambar 6.2", "Physical Data Model (PDM / Skema Database Fisik) ExplainMyLesson AI"),
    ("Gambar 7.1", "Mockup Antarmuka Terkini Role Pelajar (Dashboard Siswa, Twin Badges & 3D)"),
    ("Gambar 7.2", "Mockup Antarmuka Terkini Role Pengajar (Live Monitor Guru, Gauge & Remedial)"),
    ("Gambar 7.3", "Antarmuka 3D Petualangan Desa Nusantara & Pak Guru Virtual")
]
create_table(doc, ["No. Gambar", "Judul Gambar & Keterangan Diagram"], fig_rows, [1.5, 4.5])

doc.add_page_break()

# BAB I: PENDAHULUAN
add_heading_1(doc, "BAB I: PENDAHULUAN")
add_heading_2(doc, "1.1 Latar Belakang Masalah")
add_body_p(doc, "Dalam proses pendidikan modern, peserta didik dihadapkan pada materi pembelajaran dan buku ajar yang sangat tebal (sering kali mencapai 100 hingga 300+ halaman, seperti mata pelajaran Pendidikan Pancasila, Sejarah Perjuangan Bangsa, dan Muatan Lokal Basa Jawa). Volume bacaan yang masif tanpa adanya pemandu interaktif memicu fenomena cognitive overload (kelebihan beban kognitif), di mana siswa mengalami kesulitan membedakan inti materi dari teks pendukung, cepat jenuh, dan kehilangan fokus belajar.")
add_body_p(doc, "Di sisi lain, pengajar menghadapi tantangan besar dalam memantau daya serap siswa secara real-time. Pada sistem manual konvensional, evaluasi hanya dilakukan pada Ujian Tengah Semester (UTS) atau Ujian Akhir Semester (UAS). Akibatnya, pengajar terlambat mendeteksi siswa yang tertinggal pada topik-topik tertentu sehingga intervensi remedial tidak dapat segera diberikan.")
add_body_p(doc, "Untuk menjembatani kesenjangan tersebut, dikembangkan ExplainMyLesson AI sebagai platform pembelajaran cerdas dan adaptif. Sistem ini menggabungkan kecanggihan Retrieval-Augmented Generation (RAG) berbasis LLM (Google Gemini) yang terikat ketat pada buku ajar resmi guru (grounded learning), dunia virtual interaktif 3D Three.js ('Jelajah Desa Pancasila & Suku Nusantara') dengan narasi suara Web Speech API id-ID/jv-ID, sistem penilaian skor ganda (Skor Game & Skor Kuis), linimasa sejarah emas (Connected Milestone Stepper), serta dasbor pemantauan analitik pemahaman kelas.")

table_1_1 = [
    ("Sumber Pengetahuan", "Pengetahuan internet terbuka (rentan halusinasi fakta)", "Buku ajar / modul resmi unggahan pengajar (Grounded RAG)"),
    ("Gaya Bahasa & Pedagogi", "Teks teknis kaku dan formal", "Dongeng ramah anak, analogi dunia nyata, & suara guru"),
    ("Interaktivitas & Game", "Hanya obrolan teks tanya-jawab statis", "Dunia 3D Three.js, gapura, pos budaya, koin emas & avatar"),
    ("Evaluasi & Skor", "Tidak ada pelacakan skor kompetensi", "Dual Badges: Skor Game (eksplorasi) & Skor Kuis (daya serap)"),
    ("Monitoring Pengajar", "Tidak ada visibilitas bagi guru kelas", "Live Monitor Kelas, gauge pemahaman topik, & alert remedial (<60)")
]
create_table(doc, ["Dimensi Fitur", "Platform AI Umum (ChatGPT/Umum)", "ExplainMyLesson AI (Terkini)"], table_1_1, [1.5, 2.2, 2.3])

add_heading_2(doc, "1.2 Tujuan Sistem")
add_body_p(doc, "1. Mengurangi beban kognitif siswa melalui ekstraksi cerdas RAG 500 karakter menjadi 4 aset inti: Ringkasan Intisari, Analogi Cerita Ramah Anak, Mind Map Konsep, dan Latihan Soal Kontekstual.\n2. Meningkatkan motivasi dan keterlibatan belajar melalui simulasi petualangan 3D Three.js berlatar Desa Adat Nusantara dengan karakter Pak Guru Virtual bersuara nyata.\n3. Menerapkan sistem penilaian objektif dan seimbang melalui Dual Scoring (Skor Game dan Skor Kuis).\n4. Memberikan sarana bagi pengajar untuk memantau pemahaman siswa secara live, mendeteksi topik rawan (<60), dan mengekspor rekapitulasi nilai dalam format PDF, CSV, dan Excel.")

add_heading_2(doc, "1.3 Ruang Lingkup Sistem")
add_body_p(doc, "1. Pengguna sistem mencakup dua peran utama: Pengajar (Guru/Dosen) dan Pelajar (Siswa/Mahasiswa).\n2. Format materi masukan mendukung berkas dokumen PDF yang diproses secara lokal dan terkurasi.\n3. Modul pembelajaran baku mencakup Pendidikan Pancasila (Norma, Sila ke-3, Bhinneka Tunggal Ika, Nasionalisme, Gotong Royong) dan Basa Jawa (Aksara Jawa, Punokawan, Pandhawa, Unggah-Ungguh Basa, Geguritan) serta modul kustom guru.\n4. Lingkungan game 3D dapat dijalankan secara lancar langsung di peramban web modern tanpa instalasi plugin tambahan.")

add_heading_2(doc, "1.4 Daftar Istilah Penting (Glossary)")
glossary_rows = [
    ("RAG", "Retrieval-Augmented Generation: Metode penggabungan temu kembali data relevan dengan model bahasa untuk mencegah halusinasi."),
    ("Three.js", "Pustaka JavaScript WebGL untuk merender grafik 3D interaktif di peramban web tanpa plugin eksternal."),
    ("Web Speech API", "Antarmuka peramban untuk sintesis suara Text-to-Speech (TTS) alami berbahasa Indonesia dan Basa Jawa."),
    ("Twin Badges", "Dua lencana skor simetris pada dasbor siswa: Skor Game (koin & interaksi 3D) dan Skor Kuis (evaluasi pos)."),
    ("Roadmap Stepper", "Visualisasi linimasa sejarah berbentuk rel waktu dengan 7 medali tonggak sejarah yang saling terhubung."),
    ("Remedial Engine", "Mekanisme cerdas pendeteksi otomatis siswa dengan skor pemahaman < 60 untuk rekomendasi bimbingan.")
]
create_table(doc, ["Istilah", "Definisi & Penjelasan Teknis"], glossary_rows, [1.8, 4.2])

doc.add_page_break()

# BAB II: DESKRIPSI UMUM SISTEM
add_heading_1(doc, "BAB II: DESKRIPSI UMUM SISTEM")
add_heading_2(doc, "2.1 Gambaran Umum Sistem")
add_body_p(doc, "ExplainMyLesson AI beroperasi sebagai ekosistem pembelajaran web berbasis client-server modern. Pengajar mengunggah dokumen kurikulum yang diekstraksi ke dalam potongan semantik 500 karakter dan diproses oleh mesin RAG. Hasil kurasi pengajar diterbitkan menjadi panggung petualangan 3D di mana siswa dapat menjelajahi 5 pos belajar budaya, menyimak bimbingan suara Pak Guru, mengumpulkan koin emas, menjawab kuis kontekstual, dan berinteraksi dengan sesama teman sekelas.")

add_heading_2(doc, "2.2 Karakteristik & Stakeholder Aktor Sistem")
table_2_1 = [
    ("Pengajar (Guru / Dosen)", "Pendidik pengampu mata pelajaran", "Mengunggah modul PDF, memvalidasi RAG, memantau live dashboard, meninjau alert remedial, mengekspor laporan."),
    ("Pelajar (Siswa / Murid)", "Peserta didik kelas aktif", "Mengakses ringkasan & analogi, mendengarkan narasi suara, menjelajahi desa 3D, menjawab kuis pos, melihat twin badges."),
    ("Administrator Sistem", "Pengelola infrastruktur TI", "Memelihara server Node.js Express, basis data MySQL/JSON, container Docker, dan API gateway.")
]
create_table(doc, ["Aktor Stakeholder", "Profil Pengguna", "Tanggung Jawab & Wewenang Fitur Utama"], table_2_1, [1.8, 1.8, 2.4])

add_heading_2(doc, "2.3 Metode Pengembangan Sistem (Scrum Agile)")
add_body_p(doc, "Pengembangan ExplainMyLesson AI menerapkan metode Scrum Agile dengan 4 sprint terstruktur berdurasi masing-masing 2 minggu (total siklus 8 minggu):")
sprint_rows = [
    ("Sprint 1", "Arsitektur dasar Express & Next.js, autentikasi multi-role JWT/bcrypt, dan modul ekstraksi teks PDF."),
    ("Sprint 2", "Pipeline RAG, semantic chunking 500 char, integrasi Gemini API, dan sintesis Web Speech API."),
    ("Sprint 3", "Dunia virtual 3D Three.js, gapura, 5 pos budaya, koin emas, Pak Guru virtual, dan twin badges skor."),
    ("Sprint 4", "Live monitor dashboard pengajar, gauge topik, alert remedial, ekspor laporan, dan 64 uji Vitest.")
]
create_table(doc, ["Sprint", "Ruang Lingkup Pekerjaan & Target Deliverables"], sprint_rows, [1.5, 4.5])

doc.add_page_break()

# BAB III: ANALISIS KEBUTUHAN SISTEM
add_heading_1(doc, "BAB III: ANALISIS KEBUTUHAN SISTEM")
add_heading_2(doc, "3.1 Kebutuhan Fungsional (Functional Requirements – FR)")
fr_rows = [
    ("FR-01", "Registrasi Akun", "Pendaftaran pengguna baru dengan email dan kata sandi terenkripsi.", "Pengajar, Pelajar"),
    ("FR-02", "Login Multi-Role", "Autentikasi akun dengan token JWT dan pengarahan dasbor sesuai role.", "Pengajar, Pelajar"),
    ("FR-03", "Logout Sesi", "Pengakhiran sesi pengguna secara aman dan pembersihan token sesi.", "Pengajar, Pelajar"),
    ("FR-04", "Upload Modul PDF", "Pengunggahan berkas modul ajar PDF untuk diproses oleh RAG.", "Pengajar"),
    ("FR-05", "Validasi Modul Kurikulum", "Antarmuka kurasi pengajar untuk menyetujui hasil ekstraksi RAG.", "Pengajar"),
    ("FR-06", "Chunking Semantik 500 Karakter", "Sistem memecah teks modul menjadi potongan 500 karakter untuk RAG.", "Sistem"),
    ("FR-07", "Generasi Ringkasan Inti", "AI merangkum materi tebal menjadi poin intisari esensial.", "Sistem, Pelajar"),
    ("FR-08", "Generasi Analogi Ramah Anak", "AI memproduksi perumpamaan cerita nyata yang mudah dipahami siswa.", "Sistem, Pelajar"),
    ("FR-09", "Generasi Mind Map Hierarkis", "AI menyusun bagan hierarki konsep pokok bahasan.", "Sistem, Pelajar"),
    ("FR-10", "Generasi Soal Kuis Pos", "AI membuat soal pilihan ganda kontekstual dengan pembahasan.", "Sistem, Pengajar"),
    ("FR-11", "Dunia Virtual 3D Desa Adat", "Visualisasi desa pedesaan Three.js lengkap dengan gapura dan 5 pos.", "Pelajar"),
    ("FR-12", "Pak Guru Virtual Bersuara", "Karakter guru 3D yang memberikan briefing materi secara dinamis.", "Pelajar"),
    ("FR-13", "Web Speech API TTS", "Narasi suara guru dan robot berbahasa Indonesia dan Basa Jawa.", "Pelajar"),
    ("FR-14", "Koleksi Koin Emas (+5 Poin)", "Interaksi karakter mengambil koin emas untuk menambah Skor Game.", "Pelajar"),
    ("FR-15", "Kuis Rumah Pos Adat (+25 Poin)", "Soal materi di tiap pos untuk menguji pemahaman dan menambah Skor Kuis.", "Pelajar"),
    ("FR-16", "Twin Badges Header", "Tampilan sejajar lencana Skor Game dan Skor Kuis.", "Pelajar"),
    ("FR-17", "Interaksi Teman Sekelas Online", "Karakter siswa kelas yang hadir di desa dengan tombol sapa Dadah.", "Pelajar"),
    ("FR-18", "Roadmap Linimasa Sejarah", "Rel waktu 7 medali emas untuk visualisasi peristiwa sejarah nasional.", "Pelajar"),
    ("FR-19", "Minigames Edukasi", "Game Ular Tangga, Susun Kata, Roda Putar, dan Kartu Menjodohkan.", "Pelajar"),
    ("FR-20", "Live Monitor Dasbor Pengajar", "Statistik kehadiran, capaian kelas, dan tabel hasil kuis siswa real-time.", "Pengajar"),
    ("FR-21", "Radial Gauge Pemahaman Topik", "Indikator persentase ketuntasan kelas per pokok bahasan.", "Pengajar"),
    ("FR-22", "Alert Remedial Otomatis (<60)", "Peringatan otomatis bagi pengajar jika nilai siswa di bawah KKM 60.", "Pengajar, Sistem"),
    ("FR-23", "Ekspor Laporan Multi-Format", "Unduh rekapitulasi nilai kelas dalam format PDF, CSV, dan Excel.", "Pengajar"),
    ("FR-24", "Regenerasi Konten AI (Refresh)", "Tombol minta ulang respons AI bila hasil generasi perlu diperbarui.", "Pelajar, Pengajar"),
    ("FR-25", "Manajemen Profil Akun", "Pembaruan informasi profil pengguna dan kata sandi.", "Pengajar, Pelajar")
]
create_table(doc, ["Kode", "Nama Fitur", "Deskripsi Kebutuhan Fungsional", "Aktor Terkait"], fr_rows, [1.0, 1.8, 2.4, 0.8])

add_heading_2(doc, "3.2 Kebutuhan Non-Fungsional (Non-Functional Requirements – NFR)")
nfr_rows = [
    ("NFR-01", "Keamanan", "Password di-hash bcrypt salt 10, autentikasi stateless JWT, proteksi injeksi SQL & XSS."),
    ("NFR-02", "Performa RAG AI", "Waktu respons pencarian konteks dan generasi AI < 10 detik."),
    ("NFR-03", "Performa Load Web", "Initial load halaman web < 3 detik pada koneksi internet standar."),
    ("NFR-04", "Kelancaran Render 3D", "Frame rate animasi Three.js stabil di 50-60 FPS pada peramban web modern."),
    ("NFR-05", "Respons Suara Audio", "Web Speech API mulai bersuara dalam waktu < 500 ms setelah tombol ditekan."),
    ("NFR-06", "Akurasi Grounding RAG", "Kesesuaian materi dengan buku ajar resmi mencapai > 85% tanpa halusinasi fakta."),
    ("NFR-07", "Ketersediaan Sistem", "Tingkat ketersediaan (uptime) mencapai 99% dalam kondisi operasional."),
    ("NFR-08", "Skalabilitas", "Dapat menangani 100+ siswa bersamaan tanpa degradasi performa server."),
    ("NFR-09", "Usability (SUS)", "Skor kemudahan System Usability Scale (SUS) ditargetkan minimal 80 (Grade A)."),
    ("NFR-10", "Kompatibilitas Browser", "Dukungan penuh pada Google Chrome, Mozilla Firefox, Microsoft Edge, dan Safari.")
]
create_table(doc, ["Kode", "Kategori", "Deskripsi Kebutuhan Non-Fungsional"], nfr_rows, [1.0, 1.8, 3.2])

doc.add_page_break()

# BAB IV: PEMODELAN PROSES BISNIS & STRUKTUR LOGIS
add_heading_1(doc, "BAB IV: PEMODELAN PROSES BISNIS & STRUKTUR LOGIS")
add_heading_2(doc, "4.1 Bisnis Proses Sistem Saat Ini (As-Is / Manual)")
add_body_p(doc, "Alur proses konvensional diawali dengan pengajar membagikan buku teks/PDF tebal ke siswa. Siswa membaca mandiri tanpa panduan interaktif, mengalami kejenuhan, dan kesulitan memilah intisari. Evaluasi hanya berlangsung pada UTS/UAS sehingga pengajar tidak memiliki data capaian harian per topik. Masalah utama: cognitive overload, tidak ada pelacakan pemahaman real-time, dan intervensi remedial terlambat.")

add_heading_2(doc, "4.2 Bisnis Proses Sistem Usulan (To-Be / ExplainMyLesson AI)")
add_body_p(doc, "Pada sistem usulan, pengajar mengunggah PDF ke ExplainMyLesson AI. Sistem mengekstrak teks, memecah menjadi chunk 500 karakter, dan memproduksi ringkasan, analogi, mind map, dan kuis. Pengajar meninjau dan memvalidasi materi. Selanjutnya, siswa menjelajahi dunia 3D Desa Nusantara, mendengarkan briefing suara Pak Guru, mengumpulkan koin emas (+5), dan menjawab kuis pos (+25). Nilai tersinkronisasi ke twin badges dan dasbor guru. Jika skor < 60, sistem otomatis memberikan rekomendasi remedial terarah.")

add_heading_2(doc, "4.3 Swimlane Diagram Sistem")
add_body_p(doc, "Swimlane diagram memodelkan koordinasi antara tiga entitas: Pengajar, Sistem AI (RAG, 3D Canvas, & Audio Engine), serta Pelajar:")
add_image_figure(doc, "gambar_4_1_swimlane.png", "Gambar 4.1 – Swimlane Diagram Sistem Usulan (To-Be) ExplainMyLesson AI")

add_heading_2(doc, "4.4 Flowchart Logika Fitur Utama")
add_body_p(doc, "Flowchart di bawah ini merincikan alur logika dari upload PDF materi, validasi format, chunking semantik, kurasi pengajar, hingga inisialisasi desa 3D Three.js dan pembagian skor ganda:")
add_image_figure(doc, "gambar_4_2_flowchart.png", "Gambar 4.2 – Flowchart Logika RAG Pipeline, Validasi Kurikulum & 3D Gamification")

add_heading_2(doc, "4.5 Data Flow Diagram (DFD)")
add_heading_3(doc, "4.5.1 Diagram Konteks")
add_body_p(doc, "Diagram konteks memposisikan sistem utama ExplainMyLesson AI (proses 0.0) di tengah batas sistem, berinteraksi dengan 4 entitas eksternal: Pengajar, Pelajar, Google Gemini LLM API, dan Web Speech API:")
add_image_figure(doc, "gambar_4_3_diagram_konteks.png", "Gambar 4.3 – Diagram Konteks (Context Diagram / DFD Level 0 Boundary)")

add_heading_3(doc, "4.5.2 DFD Level 0")
add_body_p(doc, "DFD Level 0 mendekonstruksi sistem menjadi 6 proses utama (Autentikasi 1.0, RAG Chunking 2.0, Generasi AI 3.0, Petualangan 3D 4.0, Evaluasi Kuis 5.0, Analitik Guru 6.0) dan 5 data store (Users D1, Modul D2, Game Sessions D3, Quiz Results D4, Remedial D5):")
add_image_figure(doc, "gambar_4_4_dfd_level_0.png", "Gambar 4.4 – Data Flow Diagram (DFD) Level 0 Sistem ExplainMyLesson AI")

add_heading_2(doc, "4.6 Pemodelan Berorientasi Objek (UML)")
add_heading_3(doc, "4.6.1 Use Case Diagram")
add_body_p(doc, "Use Case Diagram menggambarkan hak akses aktor Pengajar dan Pelajar terhadap fitur-fitur sistem lengkap dengan relasi <<include>> (seperti login dan chunking) serta relasi <<extend>> (seperti peringatan remedial dan interaksi sapa teman):")
add_image_figure(doc, "gambar_4_5_use_case.png", "Gambar 4.5 – Use Case Diagram Lengkap dengan Relasi <<include>> dan <<extend>>")

add_heading_3(doc, "4.6.2 Activity Diagram")
add_body_p(doc, "Activity Diagram menggambarkan siklus siswa saat membuka petualangan 3D, menyimak briefing Pak Guru, berjalan mengambil koin, menjawab kuis pos, dan menerima pembaruan twin badges:")
add_image_figure(doc, "gambar_4_6_activity_diagram.png", "Gambar 4.6 – Activity Diagram Siklus Pembelajaran 3D Desa Nusantara & Kuis Adaptif")

add_heading_3(doc, "4.6.3 Sequence Diagram")
add_body_p(doc, "Sequence Diagram di bawah ini menggunakan fragmen standar UML: LOOP (percobaan autentikasi), ALT (percabangan sukses respons Gemini AI versus fallback modul lokal), dan OPT (sintesis audio Web Speech API):")
add_image_figure(doc, "gambar_4_7_sequence_diagram.png", "Gambar 4.7 – Sequence Diagram Interaksi RAG, Web Speech API & Gamifikasi 3D")

add_heading_3(doc, "4.6.4 Class Diagram")
add_body_p(doc, "Class Diagram merefleksikan model data dan arsitektur kelas berorientasi objek aktual (User, Module, Chapter, EduGameSession, QuizResult, RemedialRecommendation):")
add_image_figure(doc, "gambar_4_8_class_diagram.png", "Gambar 4.8 – Class Diagram Struktur Objek Sistem ExplainMyLesson AI")

doc.add_page_break()

# BAB V: ARSITEKTUR SISTEM & INFRASTRUKTUR TEKNIS
add_heading_1(doc, "BAB V: ARSITEKTUR SISTEM & INFRASTRUKTUR TEKNIS")
add_heading_2(doc, "5.1 Desain Arsitektur Sistem (Three-Tier Architecture)")
add_body_p(doc, "Sistem dibangun di atas arsitektur Three-Tier modern yang memisahkan presentasi antarmuka, logika bisnis, dan penyimpanan data secara independen:")
add_image_figure(doc, "gambar_5_1_arsitektur_sistem.png", "Gambar 5.1 – Arsitektur Sistem (Three-Tier Architecture) ExplainMyLesson AI")

add_heading_2(doc, "5.2 Integrasi Layanan Pihak Ketiga (Third-Party Service)")
add_body_p(doc, "1. Google Gemini REST API: Layanan model bahasa besar mutakhir yang bertugas memproses konteks modul ajar untuk menghasilkan ringkasan terstruktur, analogi cerita anak, dan paket kuis adaptif.\n2. Web Speech API Browser Synthesis: Pustaka bawaan peramban web modern untuk membacakan teks dengan intonasi ramah berbahasa Indonesia (id-ID) dan bahasa daerah (jv-ID) secara instan tanpa biaya server.")

add_heading_2(doc, "5.3 Spesifikasi Infrastruktur (Deployment Technology Stack)")
stack_rows = [
    ("Frontend UI Shell", "Next.js (App Router) + React 18 SPA", "Antarmuka responsif tanpa reload halaman, cepat dan adaptif."),
    ("3D Graphics Engine", "Three.js WebGL Engine", "Merender gapura, lanskap desa, avatar guru, koin, dan rumah adat."),
    ("Styling & Bundler", "Tailwind CSS + Vite", "Styling berbasis utility class modern dan build sistem berkecepatan tinggi."),
    ("Backend Runtime", "Node.js (v20 LTS) + Express.js", "Server RESTful API performa tinggi berbasis asynchronous event-driven."),
    ("Language Core", "TypeScript (Strict Typing Mode)", "Menjamin keamanan kode, mengurangi bug runtime, dan konsistensi tipe data."),
    ("Autentikasi & Keamanan", "JWT (JSON Web Token) + Bcrypt Hashing", "Keamanan token stateless dan pengacakan kata sandi berstandar industri."),
    ("Database Relasional", "MySQL 8.0 / MariaDB", "Penyimpanan data tabular terstruktur dengan integritas referensial kuat."),
    ("Persistence Storage", "Structured JSON Store (Atomic Write)", "Penyimpanan data lokal mandiri tanpa friksi untuk kemudahan evaluasi."),
    ("Containerization", "Docker & Docker Compose", "Multi-container orkestrasi (layanan web, API backend, dan basis data).")
]
create_table(doc, ["Komponen Sistem", "Teknologi Terpilih", "Keterangan & Rationale Arsitektural"], stack_rows, [1.6, 2.2, 2.2])

doc.add_page_break()

# BAB VI: KEBUTUHAN DATA & STRUKTUR BASIS DATA
add_heading_1(doc, "BAB VI: KEBUTUHAN DATA & STRUKTUR BASIS DATA")
add_heading_2(doc, "6.1 Identifikasi & Kamus Data")
data_dict = [
    ("Data Users", "Menyimpan kredensial dan hak akses pengajar serta pelajar.", "id_user, nama, email, password_hash, role, created_at"),
    ("Data Modules", "Menyimpan metadata buku ajar PDF dan status kurasi guru.", "id_module, id_pengajar, title, subject, file_path, is_validated"),
    ("Data Chapters", "Menyimpan bab materi, urutan, ringkasan, dan teks briefing.", "id_chapter, id_module, chapter_title, order_index, briefing_guru"),
    ("Data Chunks", "Menyimpan potongan teks 500 karakter untuk semantik RAG.", "id_chunk, id_chapter, chunk_content, char_count, vector_data"),
    ("Data GameSessions", "Menyimpan progres eksplorasi 3D dan koin emas siswa.", "id_session, id_pelajar, id_chapter, skor_game, koin_emas, visited_pos"),
    ("Data QuizSubmissions", "Menyimpan hasil pengerjaan kuis materi pos dan persentase.", "id_submission, id_pelajar, id_chapter, skor_kuis, benar, total"),
    ("Data RemedialAlerts", "Menyimpan riwayat rekomendasi intervensi topik nilai < 60.", "id_alert, id_pelajar, id_chapter, skor_terakhir, status, created_at")
]
create_table(doc, ["Nama Entitas Data", "Deskripsi Kegunaan Entitas", "Atribut Kunci & Struktur"], data_dict, [1.5, 2.3, 2.2])

add_heading_2(doc, "6.2 Conceptual Data Model (CDM / ERD)")
add_body_p(doc, "Diagram relasi entitas konseptual di bawah ini memodelkan hubungan antara pengguna, modul, potongan teks RAG, sesi game 3D, dan kuis adaptif:")
add_image_figure(doc, "gambar_6_1_erd.png", "Gambar 6.1 – Entity Relationship Diagram (ERD / CDM) ExplainMyLesson AI")

add_heading_2(doc, "6.3 Physical Data Model (PDM / Skema Database Fisik)")
add_body_p(doc, "Physical Data Model memetakan spesifikasi teknis tabel basis data relasional SQL lengkap dengan tipe data kolom, panjang karakter, batasan, primary key, dan foreign key:")
add_image_figure(doc, "gambar_6_2_pdm.png", "Gambar 6.2 – Physical Data Model (PDM / Skema Database Fisik) ExplainMyLesson AI")

doc.add_page_break()

# BAB VII: PERANCANGAN ANTARMUKA (UI/UX)
add_heading_1(doc, "BAB VII: PERANCANGAN ANTARMUKA (UI/UX)")
add_heading_2(doc, "7.1 Desain Interface (High-Fidelity Mockup)")
add_heading_3(doc, "7.1.1 Mockup Antarmuka Role Pelajar")
add_body_p(doc, "Antarmuka siswa dirancang menarik dan ramah anak. Header menyajikan Twin Score Badges yang seimbang dan kontras, diikuti oleh Connected Milestone Stepper (7 medali emas peristiwa sejarah), serta modal simulasi 3D Desa Nusantara lengkap dengan karakter Pak Guru Virtual bersuara, koin emas, pos adat, dan teman sekelas:")
add_image_figure(doc, "gambar_7_1_mockup_pelajar.png", "Gambar 7.1 – Mockup Antarmuka Terkini Role Pelajar (Dashboard Siswa, Twin Badges & Game 3D)")

add_heading_3(doc, "7.1.2 Mockup Antarmuka Role Pengajar")
add_body_p(doc, "Antarmuka guru menyajikan kartu ringkasan kelas, indikator radial gauge pemahaman topik, banner peringatan otomatis remedial bagi siswa dengan skor < 60, tabel pemantauan live skor siswa, kurasi validasi modul RAG, dan tombol ekspor rekapitulasi nilai:")
add_image_figure(doc, "gambar_7_2_mockup_pengajar.png", "Gambar 7.2 – Mockup Antarmuka Terkini Role Pengajar (Live Monitor Guru, Gauge & Remedial)")

add_heading_3(doc, "7.1.3 Antarmuka 3D Petualangan Desa Adat Nusantara & Pak Guru Virtual")
add_body_p(doc, "Antarmuka Petualangan 3D Three.js menampilkan lanskap desa adat nusantara lengkap dengan Gapura Pancasila, 5 rumah pos budaya (Joglo, Gadang, dll.), koin emas yang dapat dikumpulkan, karakter teman sekelas online, serta Pak Guru Virtual yang memberikan arahan materi edukasi secara interaktif melalui Web Speech API:")
add_image_figure(doc, "gambar_7_3_game_3d_modal.png", "Gambar 7.3 – Antarmuka 3D Petualangan Desa Adat Nusantara & Pak Guru Virtual")

add_heading_2(doc, "7.2 Deskripsi Antarmuka & Navigasi Fitur")
nav_rows = [
    ("Login & Autentikasi", "Form email institusi, password, pemilih peran.", "Mengarahkan otomatis ke dasbor pelajar atau pengajar."),
    ("Dasbor Siswa", "Twin badges (Skor Game & Kuis), roadmap stepper.", "Pusat aktivitas belajar, eksplorasi materi, dan kuis."),
    ("Modal Game 3D", "Kanvas Three.js, gapura desa, 5 pos, koin emas.", "Eksplorasi interaktif dan dialog edukasi Pak Guru bersuara."),
    ("Dasbor Monitor Guru", "Gauge pemahaman kelas, alert remedial, tabel siswa.", "Pemantauan komprehensif daya serap siswa dan remedial."),
    ("Kurasi Modul RAG", "Pratinjau ringkasan, analogi, mind map, dan kuis.", "Pemeriksaan dan persetujuan guru sebelum modul aktif dimainkan."),
    ("Ekspor Rekap Nilai", "Dialog pemilihan format (PDF, CSV, Excel).", "Pengunduhan rekapitulasi nilai kelas untuk laporan resmi.")
]
create_table(doc, ["Komponen Antarmuka", "Elemen Visual Utama", "Fungsi & Navigasi Antar Halaman"], nav_rows, [1.6, 2.2, 2.2])

doc.add_page_break()

# BAB VIII: KEAMANAN, PENGUJIAN, DAN BATASAN SISTEM
add_heading_1(doc, "BAB VIII: KEAMANAN, PENGUJIAN, DAN BATASAN SISTEM")
add_heading_2(doc, "8.1 Batasan Sistem")
add_body_p(doc, "1. Berkas kurikulum masukan dibatasi pada format dokumen PDF dengan ukuran berkas maksimal 20 MB per modul.\n2. Sintesis suara Web Speech API bergantung pada ketersediaan mesin suara peramban web pengguna.\n3. Fitur render grafis 3D Three.js mensyaratkan peramban dengan dukungan akselerasi perangkat keras WebGL aktif.")

add_heading_2(doc, "8.2 Mekanisme Keamanan Sistem (Security Control)")
sec_rows = [
    ("Enkripsi Kata Sandi", "Bcrypt Hashing (Salt 10)", "Mencegah kebocoran kata sandi teks polos dalam basis data."),
    ("Autentikasi Sesi", "JWT (JSON Web Token)", "Token stateless dengan masa kedaluwarsa aman di header permintaan."),
    ("Proteksi Injeksi SQL", "Prepared Statement & Sanitizer", "Mencegah eksekusi kueri berbahaya pada database relasional."),
    ("Proteksi XSS", "React DOM Escaping & Validation", "Mencegah injeksi skrip JavaScript jahat pada tampilan antarmuka.")
]
create_table(doc, ["Mekanisme Keamanan", "Implementasi Teknologi", "Tujuan Perlindungan Data"], sec_rows, [1.8, 2.0, 2.2])

add_heading_2(doc, "8.3 Rencana & Hasil Pengujian Sistem (Automated Test Cases)")
add_body_p(doc, "Pengujian ExplainMyLesson AI dilakukan secara komprehensif menggunakan kerangka pengujian otomatis Vitest. Sebanyak 64 skenario uji (test cases) dalam 7 berkas tes telah diuji dan lulus 100% tanpa kegagalan:")
tc_summary = [
    ("tests/system/testcases.test.ts", "22 Tests", "Validasi alur fungsional sistem, navigasi, dan kuis adaptif.", "PASSED (100%)"),
    ("tests/shared/schema.test.ts", "12 Tests", "Validasi integritas skema data modul, chapter, dan user payload.", "PASSED (100%)"),
    ("tests/system/curriculum_management.test.ts", "6 Tests", "Validasi pipeline kurasi modul ajar dan RAG chunking.", "PASSED (100%)"),
    ("tests/quiz/gamification.test.ts", "8 Tests", "Validasi kalkulasi Skor Game, Skor Kuis, dan ranking leaderboard.", "PASSED (100%)"),
    ("tests/auth/security.test.ts", "7 Tests", "Validasi hashing bcrypt, otentikasi kredensial, dan token JWT.", "PASSED (100%)"),
    ("tests/ui/audio-speech.test.ts", "5 Tests", "Validasi pemicu Web Speech API dan sintesis suara guru virtual.", "PASSED (100%)"),
    ("tests/ui/design-system.test.ts", "4 Tests", "Validasi komponen twin badges skor dan stepper linimasa sejarah.", "PASSED (100%)")
]
create_table(doc, ["Berkas Pengujian", "Jumlah Uji", "Fokus Pengujian Validasi Sistem", "Status Hasil Uji"], tc_summary, [2.0, 0.8, 2.2, 1.0])

add_heading_2(doc, "8.4 Evaluasi Usability (System Usability Scale – SUS)")
add_body_p(doc, "Sistem dievaluasi menggunakan instrumen standar System Usability Scale (SUS) dengan 10 butir pertanyaan terstandar kepada 20 responden uji coba (pengajar dan siswa). Target skor SUS ditetapkan minimal 80 (Grade A - Excellent Usability), membuktikan sistem sangat mudah dipelajari dan dioperasikan.")

doc.add_page_break()

# BAB IX: PENUTUP & DAFTAR PUSTAKA
add_heading_1(doc, "BAB IX: PENUTUP & DAFTAR PUSTAKA")
add_heading_2(doc, "9.1 Kesimpulan")
add_body_p(doc, "1. ExplainMyLesson AI berhasil diwujudkan sebagai platform pembelajaran adaptif berbasis web mutakhir yang secara efektif mengatasi fenomena cognitive overload pada materi buku ajar tebal melalui teknologi Retrieval-Augmented Generation (RAG) yang terikat pada modul resmi guru.\n2. Inovasi petualangan 3D Three.js Desa Adat Nusantara dengan karakter Pak Guru Virtual bersuara dinamis Web Speech API berhasil menghadirkan pengalaman belajar yang interaktif, kontekstual, dan menyenangkan bagi siswa.\n3. Penerapan Dual Scoring System (Skor Game dan Skor Kuis) memberikan penilaian komprehensif yang mengapresiasi keaktifan eksplorasi sekaligus mengukur ketuntasan pemahaman akademis secara objektif.\n4. Dasbor Meja Guru dengan indikator radial gauge dan deteksi otomatis remedial (<60) memberikan transparansi penuh bagi pendidik untuk memberikan intervensi belajar yang cepat dan tepat sasaran.\n5. Seluruh 64 skenario pengujian unit dan integrasi otomatis berbasis Vitest telah teruji dan lulus 100%, membuktikan keandalan, stabilitas, dan keamanan sistem.")

add_heading_2(doc, "9.2 Saran Pengembangan Sistem")
saran_rows = [
    ("1", "Aplikasi Mobile Multiplatform", "Mengembangkan versi Progressive Web App (PWA) atau mobile hybrid."),
    ("2", "Model Visi Multimodal AI", "Meningkatkan kemampuan RAG dalam mengekstrak diagram dan infografis."),
    ("3", "Multiplayer Sync WebSockets", "Sinkronisasi pergerakan avatar teman sekelas di desa secara live."),
    ("4", "Analitik Prediktif Kelulusan", "Menerapkan machine learning untuk memprediksi risiko ketidaktuntasan siswa."),
    ("5", "Dukungan Bahasa Daerah Tambahan", "Menambah modul suara bahasa daerah lain seperti Sunda dan Bali.")
]
create_table(doc, ["No", "Rekomendasi Pengembangan", "Uraian Manfaat & Nilai Tambah"], saran_rows, [0.6, 2.2, 3.2])

add_heading_2(doc, "9.3 Daftar Pustaka Standar IEEE")
add_body_p(doc, "[1] K. E. Kendall and J. E. Kendall, Systems Analysis and Design, 8th ed. Upper Saddle River, N.J.: Pearson Prentice Hall, 2011.\n[2] V. D. Nguyen, N. H. Tran, K. A. Dao, and P. V. Nguyen, \"Towards Personalized AI Education: Context-Aware Retrieval-Augmented Generation With Grade-Level LLM Adaptation,\" Computer Applications in Engineering Education, vol. 34, no. 1, 2026, doi: 10.1002/cae.70153.\n[3] J. Guan, J. Li, K. Hou, and J. Li, \"EduChatQA: Curriculum-aware hybrid retrieval and teacher-aligned prompting for textbook-grounded educational QA,\" Complex & Intelligent Systems, 2026, doi: 10.1007/s40747-026-02342-z.\n[4] L. Y. Tan et al., \"CalcTutor: Multi-Agent LLM Grading with RAG-Grounded Feedback for Adaptive Learning Support,\" Mathematics, vol. 14, no. 7, p. 1094, 2026.\n[5] P.-H. Chen, Y.-M. Huang, T.-T. Wu, and H.-Y. Lee, \"Mitigating Artificial Intelligence Hallucinations in Education: A Comparative Study of Retrieval-Augmented Generation (RAG) and Large Language Models,\" in Proc. 2025 7th Int. Conf. Modern Educational Technology (ICMET), 2025, pp. 230–236.\n[6] J. Brooke, \"SUS - A quick and dirty usability scale,\" in Usability Evaluation in Industry, London: Taylor & Francis, 1996, pp. 189–194.")

doc.save(DOCX_OUT)
print("SUCCESS: Dokumen Word berhasil dibuat:", DOCX_OUT)

md_text = """# DOKUMEN SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK (SKPL / SRS)
## ExplainMyLesson AI: Platform Pembelajaran Adaptif Berbasis RAG, Gamifikasi 3D, dan Analitik Pemahaman Pelajar
**Version 2.0 (Mutakhir Selaras Rilis Web v8.0) | Madiun, 2026**

- **Institusi**: Program Studi D3 Teknik Informatika Kabupaten Madiun, Sekolah Vokasi, Universitas Sebelas Maret
- **Mata Kuliah**: Manajemen Proyek Teknologi Informasi & Analisis Perancangan Sistem
- **Disusun Oleh**:
  - Ghandur Fauzan Ngauf Hisam (NIM. V3925024)
  - Ridho Asykuri (NIM. V3925015)
- **Dosen Pengampu**: Darmawan Lahru Riatma, S.Kom., M.MT (NIP. 1991091420200801)

---

## DAFTAR GAMBAR & DIAGRAM SISTEM (300 DPI)
1. **Gambar 4.1**: Swimlane Diagram Sistem Usulan (To-Be) ExplainMyLesson AI
2. **Gambar 4.2**: Flowchart Logika RAG Pipeline, Validasi Kurikulum & 3D Gamification
3. **Gambar 4.3**: Diagram Konteks (Context Diagram / DFD Level 0 Boundary)
4. **Gambar 4.4**: Data Flow Diagram (DFD) Level 0 Sistem ExplainMyLesson AI
5. **Gambar 4.5**: Use Case Diagram Lengkap Relasi <<include>> dan <<extend>>
6. **Gambar 4.6**: Activity Diagram Siklus Pembelajaran 3D Desa Nusantara & Kuis Adaptif
7. **Gambar 4.7**: Sequence Diagram Interaksi RAG, Web Speech API & Gamifikasi 3D
8. **Gambar 4.8**: Class Diagram Struktur Objek Sistem ExplainMyLesson AI
9. **Gambar 5.1**: Arsitektur Sistem (Three-Tier Architecture) Terkini
10. **Gambar 6.1**: Entity Relationship Diagram (ERD / CDM)
11. **Gambar 6.2**: Physical Data Model (PDM / Skema Database Fisik)
12. **Gambar 7.1**: Mockup Antarmuka Terkini Role Pelajar (Twin Badges & Game 3D)
13. **Gambar 7.2**: Mockup Antarmuka Terkini Role Pengajar (Live Monitor & Remedial)

---

## RINGKASAN BAB DOKUMEN
- **BAB I: PENDAHULUAN** - Menguraikan latar belakang cognitive overload pada materi buku ajar 100-300+ halaman, tabel perbandingan AI umum vs ExplainMyLesson AI, tujuan sistem, ruang lingkup mata pelajaran (Pendidikan Pancasila & Basa Jawa), dan kamus istilah teknik (RAG, Three.js, Web Speech API, Twin Badges, Roadmap Stepper, Remedial Engine).
- **BAB II: DESKRIPSI UMUM SISTEM** - Menguraikan gambaran umum arsitektur pembelajaran interaktif, profil stakeholder aktor sistem (Pengajar, Pelajar, Administrator), dan metode pengembangan sistem Agile Scrum dengan 4 sprint terstruktur @ 2 minggu.
- **BAB III: ANALISIS KEBUTUHAN SISTEM** - Merinci 25 Kebutuhan Fungsional (FR-01 s/d FR-25) dan 10 Kebutuhan Non-Fungsional (NFR-01 s/d NFR-10) yang telah mencakup seluruh modul mutakhir web saat ini.
- **BAB IV: PEMODELAN PROSES BISNIS & STRUKTUR LOGIS** - Menampilkan proses bisnis As-Is dan To-Be, serta menyematkan seluruh 8 diagram proses (Swimlane, Flowchart, DFD Konteks, DFD Level 0, Use Case, Activity, Sequence, dan Class Diagram).
- **BAB V: ARSITEKTUR SISTEM & INFRASTRUKTUR TEKNIS** - Menguraikan arsitektur Three-Tier terkini (Next.js/React 18 + Three.js Client, Node.js Express API Tier, MySQL/JSON & Gemini AI Data Tier) beserta diagram arsitektur Gambar 5.1 dan tabel spesifikasi teknologi.
- **BAB VI: KEBUTUHAN DATA & STRUKTUR BASIS DATA** - Menyajikan kamus data 7 entitas utama, Conceptual Data Model (ERD Gambar 6.1), serta skema database fisik (PDM Gambar 6.2).
- **BAB VII: PERANCANGAN ANTARMUKA (UI/UX)** - Menyajikan mockup antarmuka aktual pelajar (Twin Badges, Roadmap Stepper, Game 3D Desa Nusantara) dan mockup pengajar (Live Monitor Kelas, Radial Gauges, Alert Remedial) beserta tabel navigasi komponen.
- **BAB VIII: KEAMANAN, PENGUJIAN, DAN BATASAN SISTEM** - Menjelaskan kontrol keamanan (Bcrypt, JWT, HTTPS), rekapitulasi hasil pengujian otomatis 64 test cases berbasis Vitest yang lulus 100%, evaluasi System Usability Scale (SUS), dan batasan sistem.
- **BAB IX: PENUTUP & DAFTAR PUSTAKA** - Merumuskan kesimpulan kebaruan sistem, 5 saran pengembangan strategis masa depan, dan daftar pustaka standar IEEE.

*Dokumen lengkap resmi beserta seluruh tabel terformat rapi dan 13 diagram beresolusi tinggi tersimpan dalam berkas Microsoft Word: `D:\\ghandur rido 1\\SKPL_ExplainMyLesson_AI_Terbaru.docx`.*
"""

with open(MD_OUT, "w", encoding="utf-8") as f_md:
    f_md.write(md_text)
print("SUCCESS: Dokumen Markdown berhasil dibuat:", MD_OUT)
