"""Đo tương phản chữ/nền thật trên trang đã render, cả hai theme."""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8787"

JS = r"""
() => {
  const lum = (c) => {
    const [r, g, b] = c.map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const parse = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x));
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  };
  const bgOf = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0.95) return c.rgb;
      node = node.parentElement;
    }
    const c = parse(getComputedStyle(document.body).backgroundColor);
    return c ? c.rgb : [255, 255, 255];
  };
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  const out = [];
  const seen = new Set();
  document.querySelectorAll('*').forEach(el => {
    if (el.offsetParent === null && el.tagName !== 'BODY') return;
    const txt = [...el.childNodes]
      .filter(n => n.nodeType === 3 && n.textContent.trim())
      .map(n => n.textContent.trim()).join(' ');
    if (!txt) return;
    const st = getComputedStyle(el);
    const fg = parse(st.color);
    if (!fg || fg.a < 0.5) return;
    const size = parseFloat(st.fontSize);
    const weight = parseInt(st.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const r = ratio(fg.rgb, bgOf(el));
    const need = large ? 3 : 4.5;
    if (r < need) {
      const key = el.className + '|' + Math.round(r * 10);
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        sel: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
        text: txt.slice(0, 32),
        ratio: Math.round(r * 100) / 100,
        need: need,
        size: Math.round(size)
      });
    }
  });
  return out;
}
"""

views = [("home", ""), ("setup", "#/setup"), ("browse", "#/browse"), ("stats", "#/stats")]
bad = []

with sync_playwright() as p:
    browser = p.chromium.launch()
    for theme in ("light", "dark"):
        ctx = browser.new_context(viewport={"width": 390, "height": 800}, color_scheme=theme)
        page = ctx.new_page()
        page.goto(BASE, wait_until="networkidle")
        page.wait_for_timeout(600)
        for name, hash_ in views:
            if hash_:
                page.evaluate(f"location.hash = '{hash_}'")
                page.wait_for_timeout(350)
            for item in page.evaluate(JS):
                bad.append((theme, name, item))
        # màn hình học
        page.evaluate("location.hash = '#/setup'")
        page.wait_for_timeout(250)
        page.evaluate("document.getElementById('btn-start').click()")
        page.wait_for_timeout(300)
        page.evaluate("document.getElementById('btn-flip').click()")
        page.wait_for_timeout(300)
        for item in page.evaluate(JS):
            bad.append((theme, "study", item))
        ctx.close()
    browser.close()

if not bad:
    print("Mọi đoạn chữ đều đạt tương phản yêu cầu (4.5:1, chữ lớn 3:1).")
else:
    print(f"{len(bad)} chỗ chưa đạt tương phản:\n")
    for theme, view, it in bad:
        print(f"  [{theme}/{view}] {it['sel']} — {it['ratio']}:1 (cần {it['need']}), "
              f"{it['size']}px — \"{it['text']}\"")
