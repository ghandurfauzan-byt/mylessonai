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
    page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
    time.sleep(2)
    page.screenshot(path=os.path.join(OUT_DIR, "live_login_page.png"), timeout=5000, animations="disabled")
    print("Saved live_login_page.png")

    # 2. Click Demo Siswa SD
    print("Clicking Demo Siswa SD...")
    page.click("button:has-text('Demo Siswa SD')")
    time.sleep(4)

    # Pelajar Dashboard Screenshot
    page.screenshot(path=os.path.join(OUT_DIR, "gambar_7_1_mockup_pelajar.png"), timeout=5000, animations="disabled")
    print("Saved live gambar_7_1_mockup_pelajar.png")

    # 3. Navigate to Demo Guru SD
    print("Navigating back to login...")
    page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
    time.sleep(2)
    print("Clicking Demo Guru SD...")
    page.click("button:has-text('Demo Guru SD')")
    time.sleep(4)

    # Pengajar Dashboard Screenshot
    page.screenshot(path=os.path.join(OUT_DIR, "gambar_7_2_mockup_pengajar.png"), timeout=5000, animations="disabled")
    print("Saved live gambar_7_2_mockup_pengajar.png")

    browser.close()
    print("ALL LIVE ACTUAL SCREENSHOTS CAPTURED!")