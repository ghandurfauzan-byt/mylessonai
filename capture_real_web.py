# -*- coding: utf-8 -*-
import os, time, json
from playwright.sync_api import sync_playwright

OUT_DIR = r"D:\ghandur rido 1\skpl_assets\diagrams"
os.makedirs(OUT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    # 1. Capture Login Page
    print("1. Capturing Login Page...")
    page.goto("http://localhost:3000/login", wait_until="networkidle")
    time.sleep(1)
    page.screenshot(path=os.path.join(OUT_DIR, "live_login_page.png"))
    print("Saved live_login_page.png")

    # 2. Set LocalStorage for Pelajar (Ghandur) and go to /dashboard/pelajar
    print("2. Setting Pelajar session and capturing Dashboard Pelajar...")
    pelajar_user = {
        "id": "usr_ghandur",
        "name": "Ghandur Fauzan Ngauf Hisam",
        "email": "ghandur@gmail.com",
        "role": "pelajar",
        "nimNip": "SD-Kelas4-01",
        "institution": "SD Negeri 1 Madiun"
    }
    page.evaluate(f"""() => {{
        localStorage.setItem("auth_token", "jwt_token_Z2hhbmR1ckBnbWFpbC5jb20=");
        localStorage.setItem("user_profile", JSON.stringify({json.dumps(pelajar_user)}));
    }}""")
    page.goto("http://localhost:3000/dashboard/pelajar", wait_until="networkidle")
    time.sleep(2)
    page.screenshot(path=os.path.join(OUT_DIR, "gambar_7_1_mockup_pelajar.png"))
    print("Saved real live gambar_7_1_mockup_pelajar.png")

    # Capture 3D Game Modal
    try:
        # Click button to open 3D Game
        btn = page.locator("button:has-text('Petualangan 3D'), button:has-text('Jelajah Desa'), button:has-text('Mulai Petualangan')").first
        if btn.is_visible():
            btn.click()
            time.sleep(4)
            page.screenshot(path=os.path.join(OUT_DIR, "live_pelajar_3d_modal.png"))
            print("Saved live_pelajar_3d_modal.png")
    except Exception as e:
        print("Note on 3D modal:", e)

    # 3. Set LocalStorage for Pengajar (Guru) and go to /dashboard/pengajar
    print("3. Setting Pengajar session and capturing Dashboard Pengajar...")
    teacher_user = {
        "id": "usr_teacher_darmawan",
        "name": "Bpk. Darmawan Lahru Riatma, S.Kom., M.MT",
        "email": "darmawan@gmail.com",
        "role": "pengajar",
        "nimNip": "1991091420200801",
        "institution": "SD Negeri 1 Madiun"
    }
    page.evaluate(f"""() => {{
        localStorage.setItem("auth_token", "jwt_token_darmawan@gmail.com");
        localStorage.setItem("user_profile", JSON.stringify({json.dumps(teacher_user)}));
    }}""")
    page.goto("http://localhost:3000/dashboard/pengajar", wait_until="networkidle")
    time.sleep(2)
    page.screenshot(path=os.path.join(OUT_DIR, "gambar_7_2_mockup_pengajar.png"))
    print("Saved real live gambar_7_2_mockup_pengajar.png")

    browser.close()
    print("ALL REAL SCREENSHOTS COMPLETED!")