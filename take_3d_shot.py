import os, time
from playwright.sync_api import sync_playwright

OUT = r"D:\ghandur rido 1\skpl_assets\diagrams"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    
    page.goto("http://localhost:3000/login", timeout=60000)
    time.sleep(2)
    btn = page.locator("button:has-text('Demo Siswa SD')")
    btn.click()
    time.sleep(4)

    # Click the 3D game button
    btn_3d = page.locator("button:has-text('Petualangan 3D')").first
    if btn_3d.is_visible():
        btn_3d.click()
        print("Clicked 3D adventure button, waiting 4s for modal...")
        time.sleep(4)
        page.screenshot(path=os.path.join(OUT, "gambar_7_3_game_3d_modal.png"))
        print("gambar_7_3_game_3d_modal.png captured successfully")

    browser.close()