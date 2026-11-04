#!/usr/bin/env python3
"""Regenerate docs/images from the dev page (pip install playwright; playwright install chromium).

    python -m http.server 8765 &      # repository root
    python dev/screenshots.py
"""
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:8765/dev/index.html"
OUT = Path(__file__).resolve().parents[1] / "docs" / "images"
JOBS = [("printing-dark", "dark", "printing", 440), ("paused-light", "light", "paused", 440),
        ("phone-paused", "light", "paused", 360), ("complete-dark", "dark", "idle", 440),
        ("fault-light", "light", "ready", 440), ("resin-dark", "dark", "mars", 440), ("fdm-dark", "dark", "fdm", 440)]


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, theme, s, w in JOBS:
            pg = await b.new_page(viewport={"width": 520, "height": 1000}, device_scale_factor=2)
            await pg.goto(f"{BASE}?theme={theme}&s={s}&lang=en")
            await pg.add_style_tag(content=f".slot{{width:{w}px}}")
            await pg.wait_for_timeout(1500)
            await pg.locator(f"#slot-{s}").screenshot(path=str(OUT / f"{name}.png"))
        pg = await b.new_page(viewport={"width": 620, "height": 420}, device_scale_factor=2)
        await pg.goto(f"{BASE}?theme=dark&s=ready&open=files&lang=en")
        await pg.wait_for_timeout(1500)
        await pg.evaluate("document.querySelector('sdcp-printer-card').shadowRoot.querySelector('[data-op=print]').click()")
        await pg.wait_for_timeout(300)
        dlg = await pg.evaluate_handle("document.querySelector('sdcp-printer-card').shadowRoot.querySelector('.dlg')")
        await dlg.as_element().screenshot(path=str(OUT / "files-dark.png"))
        await b.close()


asyncio.run(main())
