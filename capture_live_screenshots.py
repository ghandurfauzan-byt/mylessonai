# -*- coding: utf-8 -*-
import os, time
from playwright.sync_api import sync_playwright

OUT_DIR = r"D:\ghandur rido 1\skpl_assets\diagrams"
os.makedirs(OUT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    # 1. Login Page
    print("Navigating to login page...")
    page.goto("http://localhost:3000/login", wait_until="networkidle")
    time.sleep(2)
    page.screenshot(path=os.path.join(OUT_DIR, "live_login_page.png"))
    print("Saved live_login_page.png")

    # 2. Login as Pelajar (Ghandur)
    print("Logging in as Pelajar...")
    page.fill("input[type=email], input[name=email]", "ghandur@gmail.com")
    page.fill("input[type=password], input[name=password]", "secret123")
    page.click("button[type=submit], button:has-text('Masuk'), button:has-text('Login')")
    time.sleep(3)
    page.wait_for_load_state("networkidle")
    
    # Pelajar Dashboard Screenshot
    page.screenshot(path=os.path.join(OUT_DIR, "gambar_7_1_mockup_pelajar.png"))
    print("Saved live gambar_7_1_mockup_pelajar.png")

    # Try opening 3D game modal if button exists
    try:
        btn_game = page.locator("button:has-text('Petualangan 3D'), button:has-text('Mulai Petualangan'), button:has-text('Jelajah Desa')").first
        if btn_game.is_visible():
            btn_game.click()
            time.sleep(4)
            page.screenshot(path=os.path.join(OUT_DIR, "live_pelajar_3d_game_modal.png"))
            print("Saved live_pelajar_3d_game_modal.png")
    except Exception as e:
        print("Note on 3D game modal button:", e)

    # 3. Logout and Login as Pengajar (Guru)
    context.clear_cookies()
    page.goto("http://localhost:3000/login", wait_until="networkidle")
    time.sleep(1)
    print("Logging in as Pengajar...")
    page.fill("input[type=email], input[name=email]", "guru@gmail.com")
    page.fill("input[type=password], input[name=password]", "guru123")
    page.click("button[type=submit], button:has-text('Masuk'), button:has-text('Login')")
    time.sleep(3)
    page.wait_for_load_state("networkidle")

    # Pengajar Dashboard Screenshot
    page.screenshot(path=os.path.join(OUT_DIR, "gambar_7_2_mockup_pengajar.png"))
    print("Saved live gambar_7_2_mockup_pengajar.png")

    browser.close()
    print("All live screenshots captured successfully!")