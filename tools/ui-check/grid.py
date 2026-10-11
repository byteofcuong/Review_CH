# -*- coding: utf-8 -*-
"""Soi cac luoi nut: hang cuoi co bi hut mot o khong.

Luoi dat so cot co dinh (vi du #setup-subject la 2 cot) se de lai mot lo
trong khi so phan tu khong chia het cho so cot. Them mot mon la dinh ngay.
Do bang hinh hoc that chu khong doan theo so luong.

    python tools/ui-check/grid.py http://localhost:8787
"""
import sys
from playwright.sync_api import sync_playwright

base = sys.argv[1]
GRIDS = [("#/setup", "#setup-subject"), ("#/setup", "#setup-mode"),
         ("#/setup", "#setup-size"), ("#/setup", "#setup-direction")]
WIDTHS = [1280, 820, 390]

PROBE = """sel => {
  const box = document.querySelector(sel);
  if (!box || box.offsetParent === null) return null;
  const br = box.getBoundingClientRect();
  const kids = [...box.children].filter(e => e.getBoundingClientRect().width > 0);
  if (!kids.length) return null;
  // Gom theo hang bang toa do y
  const rows = {};
  kids.forEach(e => {
    const r = e.getBoundingClientRect();
    const k = Math.round(r.top);
    (rows[k] = rows[k] || []).push(r);
  });
  const out = [];
  Object.keys(rows).forEach(k => {
    const rs = rows[k].sort((a, b) => a.left - b.left);
    const phu = rs.reduce((s, r) => s + r.width, 0);
    // Tru vien: cho sai so 2px
    out.push({ y: +k, so: rs.length, hut: Math.round(br.width - phu) });
  });
  return { w: Math.round(br.width), hang: out, tong: kids.length };
}"""

bad = []
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for w in WIDTHS:
        pg = b.new_page(viewport={"width": w, "height": 1000})
        for route, sel in GRIDS:
            pg.goto(base + "/" + route, wait_until="networkidle")
            pg.wait_for_timeout(300)
            r = pg.evaluate(PROBE, sel)
            if not r:
                continue
            for h in r["hang"]:
                if h["hut"] > 2:
                    bad.append("%dpx %s: hang y=%d co %d o, hut %dpx"
                               % (w, sel, h["y"], h["so"], h["hut"]))
            print("%4dpx %-16s %d o, %d hang, hut toi da %dpx"
                  % (w, sel, r["tong"], len(r["hang"]),
                     max(h["hut"] for h in r["hang"])))
        pg.close()
    b.close()

if bad:
    print("\nLO TRONG:")
    for x in bad:
        print("  " + x)
    sys.exit(1)
print("\nKhong hang nao bi hut o.")
