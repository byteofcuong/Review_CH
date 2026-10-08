"""Chụp màn hình app ở nhiều kích cỡ và cả hai theme, kèm bắt lỗi console."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8787"
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else "shots")
TAG = sys.argv[3] if len(sys.argv) > 3 else ""
OUT.mkdir(parents=True, exist_ok=True)

SIZES = [("phone", 375, 760), ("ipad", 820, 1100), ("desk", 1440, 900)]
problems = []


def shoot(page, name, size_name):
    page.wait_for_timeout(450)
    path = OUT / f"{size_name}-{name}{TAG}.png"
    page.screenshot(path=str(path), full_page=True)
    return path


def check_overflow(page, size_name, where):
    """Trang không được cuộn ngang ở bất kỳ bề rộng nào."""
    data = page.evaluate("""() => ({
        doc: document.documentElement.scrollWidth,
        win: window.innerWidth,
        wide: [...document.querySelectorAll('*')]
            .filter(el => el.getBoundingClientRect().right > window.innerWidth + 1)
            .slice(0, 5)
            .map(el => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''))
    })""")
    if data["doc"] > data["win"] + 1:
        problems.append(f"[{size_name}/{where}] cuộn ngang: {data['doc']}px > {data['win']}px, thủ phạm: {data['wide']}")


def check_targets(page, size_name, where):
    """Vùng bấm nên đạt 44x44px trên thiết bị cảm ứng."""
    small = page.evaluate("""() => {
        const sel = 'button, a[href], select, input, [role=button], [role=tab], [role=radio]';
        return [...document.querySelectorAll(sel)]
            .filter(el => el.offsetParent !== null)
            .map(el => {
                const r = el.getBoundingClientRect();
                return {
                    id: el.id || (el.className ? String(el.className).split(' ')[0] : el.tagName.toLowerCase()),
                    w: Math.round(r.width), h: Math.round(r.height)
                };
            })
            .filter(x => (x.w > 0 && x.h > 0) && (x.w < 44 || x.h < 44));
    }""")
    seen = {}
    for s in small:
        key = s["id"]
        if key not in seen:
            seen[key] = s
    if seen:
        items = ", ".join(f"{v['id']} {v['w']}x{v['h']}" for v in list(seen.values())[:9])
        problems.append(f"[{size_name}/{where}] vùng bấm < 44px: {items}")


with sync_playwright() as p:
    browser = p.chromium.launch()
    for size_name, w, h in SIZES:
        for theme in ("light", "dark"):
            ctx = browser.new_context(viewport={"width": w, "height": h},
                                      device_scale_factor=2,
                                      color_scheme=theme)
            page = ctx.new_page()
            page.on("pageerror", lambda e: problems.append(f"[{size_name}] lỗi JS: {e}"))
            page.on("console", lambda m: problems.append(f"[{size_name}] console {m.type}: {m.text}")
                    if m.type == "error" else None)

            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(700)      # chờ font Google về

            suffix = "" if theme == "light" else "-dark"

            shoot(page, "home" + suffix, size_name)
            if theme == "light":
                check_overflow(page, size_name, "home")
                check_targets(page, size_name, "home")

            # màn cấu hình phiên
            page.evaluate("location.hash = '#/setup'")
            page.wait_for_timeout(350)
            shoot(page, "setup" + suffix, size_name)
            if theme == "light":
                check_overflow(page, size_name, "setup")
                check_targets(page, size_name, "setup")

            # màn hình học: bắt đầu một phiên rồi lật thẻ
            page.evaluate("document.getElementById('btn-start').click()")
            page.wait_for_timeout(400)
            shoot(page, "study" + suffix, size_name)
            if theme == "light":
                check_targets(page, size_name, "study")
            page.evaluate("document.getElementById('btn-flip').click()")
            page.wait_for_timeout(350)
            shoot(page, "study-back" + suffix, size_name)
            if theme == "light":
                check_overflow(page, size_name, "study-back")

            # tra cứu
            page.evaluate("location.hash = '#/browse'")
            page.wait_for_timeout(400)
            shoot(page, "browse" + suffix, size_name)
            if theme == "light":
                check_overflow(page, size_name, "browse")

            # tiến độ
            page.evaluate("location.hash = '#/stats'")
            page.wait_for_timeout(400)
            shoot(page, "stats" + suffix, size_name)
            if theme == "light":
                check_overflow(page, size_name, "stats")

            ctx.close()
    browser.close()

print(f"Đã chụp vào {OUT}")
if problems:
    print(f"\n{len(problems)} vấn đề:")
    for x in problems:
        print("  -", x)
else:
    print("\nKhông phát hiện vấn đề nào.")
