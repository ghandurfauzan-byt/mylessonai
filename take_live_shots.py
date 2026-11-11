import os, time
from playwright.sync_api import sync_playwright

OUT = r"D:\ghandur rido 1\skpl_assets\diagrams"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    
    # 1. Login
    page.goto("http://localhost:3000/login", timeout=60000)
    time.sleep(3)
    page.screenshot(path=os.path.join(OUT, "live_login.png"))
    print("Login screenshot captured")

    # 2. Click Demo Siswa SD
    btn = page.locator("button:has-text('Demo Siswa SD')")
    btn.click()
    print("Clicked Demo Siswa SD, waiting 6s for compilation...")
    time.sleep(6)
    page.screenshot(path=os.path.join(OUT, "gambar_7_1_mockup_pelajar.png"))
    print("gambar_7_1_mockup_pelajar.png captured successfully")

    # 3. Go back to login and click Demo Guru SD
    page.goto("http://localhost:3000/login", timeout=60000)
    time.sleep(2)
    btn_g = page.locator("button:has-text('Demo Guru SD')")
    btn_g.click()
    print("Clicked Demo Guru SD, waiting 6s for compilation...")
    time.sleep(6)
    page.screenshot(path=os.path.join(OUT, "gambar_7_2_mockup_pengajar.png"))
    print("gambar_7_2_mockup_pengajar.png captured successfully")

    browser.close()
    print("DONE ALL LIVE SCREENSHOTS!")