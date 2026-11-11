with open('D:/ghandur rido 1/build_skpl.py', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = '("Gambar 7.2", "Mockup Antarmuka Terkini Role Pengajar (Live Monitor Guru, Gauge & Remedial)")'
repl1 = '("Gambar 7.2", "Mockup Antarmuka Terkini Role Pengajar (Live Monitor Guru, Gauge & Remedial)"),\n    ("Gambar 7.3", "Antarmuka 3D Petualangan Desa Nusantara & Pak Guru Virtual")'

if target1 in text:
    text = text.replace(target1, repl1, 1)

target2 = 'add_image_figure(doc, "gambar_7_2_mockup_pengajar.png", "Gambar 7.2 – Mockup Antarmuka Terkini Role Pengajar (Live Monitor Guru, Gauge & Remedial)")'
repl2 = '''add_image_figure(doc, "gambar_7_2_mockup_pengajar.png", "Gambar 7.2 – Mockup Antarmuka Terkini Role Pengajar (Live Monitor Guru, Gauge & Remedial)")

add_heading_3(doc, "7.1.3 Antarmuka 3D Petualangan Desa Adat Nusantara & Pak Guru Virtual")
add_body_p(doc, "Antarmuka Petualangan 3D Three.js menampilkan lanskap desa adat nusantara lengkap dengan Gapura Pancasila, 5 rumah pos budaya (Joglo, Gadang, dll.), koin emas yang dapat dikumpulkan, karakter teman sekelas online, serta Pak Guru Virtual yang memberikan arahan materi edukasi secara interaktif melalui Web Speech API:")
add_image_figure(doc, "gambar_7_3_game_3d_modal.png", "Gambar 7.3 – Antarmuka 3D Petualangan Desa Adat Nusantara & Pak Guru Virtual")'''

if target2 in text:
    text = text.replace(target2, repl2, 1)

with open('D:/ghandur rido 1/build_skpl.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated build_skpl.py successfully!')