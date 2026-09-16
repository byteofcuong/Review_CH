#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Chuyển 'Biên du lịch.xlsx' thành docs/data/vocab.json + build_report.md.

Chạy lại được bất cứ lúc nào Excel thay đổi. File Excel gốc KHÔNG bị sửa.

    pip install -r tools/requirements.txt
    python tools/build_data.py
"""

import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

import openpyxl
from pypinyin import lazy_pinyin, Style

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
XLSX = ROOT / "Biên du lịch.xlsx"
OVERRIDES_PATH = HERE / "overrides.json"
OUT_JSON = ROOT / "docs" / "data" / "vocab.json"
OUT_JS = ROOT / "docs" / "data" / "vocab.js"
OUT_REPORT = ROOT / "build_report.md"

EM_DASH = "—"  # dùng để tách các dòng bị gộp vi + zh chung một ô
HAN_RE = re.compile(r"[㐀-䶿一-鿿]")
PAREN_RE = re.compile(r"\s*[（(]\s*([^（()）]*?)\s*[）)]\s*")
PUNCT_RE = re.compile("[‐-―\\-_,;:.\"'’“”]+")

# Cấu hình từng sheet: cột nào là gì, bắt đầu từ dòng nào.
TOPICS = [
    {
        "id": "dia-danh",
        "name": "Địa danh & Di sản Việt Nam",
        "sheet": "Địa danh",
        "prefix": "dd",
        "proper": True,
        "start": 2,
        "cols": {"vi": 1, "zh": 2, "pinyin": 3},
    },
    {
        "id": "tu-vung",
        "name": "Từ vựng ngành du lịch",
        "sheet": "Từ chuyên ngành",
        "prefix": "tv",
        "proper": False,
        "start": 1,
        "cols": {"vi": 1, "zh": 2},
    },
    {
        "id": "danh-thang-tq",
        "name": "Danh thắng Trung Quốc",
        "sheet": "Trang tính3",
        "prefix": "tq",
        "proper": True,
        "start": 2,
        "cols": {"zh": 2, "vi": 3, "pinyin": 4},
    },
    {
        "id": "cum-tu",
        "name": "Cụm từ & thành ngữ",
        "sheet": "Trang tính4",
        "prefix": "ct",
        "proper": False,
        "start": 1,
        "cols": {"zh": 1, "vi": 2},
    },
]

report = {"fixed_rows": [], "merged": [], "conflicts": [], "auto_pinyin": [],
          "overrides": [], "warnings": [], "skipped": []}


# ---------------------------------------------------------------- tiện ích


def cell(value):
    """Ô Excel thành chuỗi đã trim; ô trống thành ''."""
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return unicodedata.normalize("NFC", str(value)).strip()


def split_paren(text):
    """'Hồ Tây (Hà Nội)' thành ('Hồ Tây', 'Hà Nội')."""
    if not text:
        return "", ""
    ctx = [c for c in PAREN_RE.findall(text) if c]
    base = PAREN_RE.sub(" ", text)
    base = re.sub(r"\s+", " ", base).strip(" -–—,;")
    return base, "; ".join(ctx)


def split_alts(text):
    """'祠/ 庙' thành ('祠', ['庙']). Dấu / trong file gốc nghĩa là 'hoặc'."""
    if not text:
        return "", []
    parts = [p.strip() for p in text.split("/")]
    parts = [p for p in parts if p]
    if not parts:
        return "", []
    return parts[0], parts[1:]


def strip_marks(text):
    """Bỏ dấu thanh và dấu tiếng Việt để so khớp khoan dung."""
    decomposed = unicodedata.normalize("NFD", text)
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return stripped.replace("đ", "d").replace("Đ", "D")


def norm_key(text):
    """Khoá gộp trùng: bỏ ngoặc, bỏ dấu, gộp gạch ngang và khoảng trắng."""
    base, _ = split_paren(text)
    key = strip_marks(base).lower()
    key = PUNCT_RE.sub(" ", key)
    key = re.sub(r"\s+", " ", key)
    return key.strip()


def gen_pinyin(zh, proper):
    """Sinh pinyin cho chữ Hán còn thiếu.

    Các âm tiết Hán liền nhau được viết dính thành một từ theo quy tắc pinyin
    (chèn dấu ' trước âm tiết mở đầu bằng a/o/e để khỏi đọc nhầm ranh giới:
    义安 -> Yì'ān). Ký tự không phải Hán giữ nguyên và tách bằng khoảng trắng.
    """
    if not zh:
        return ""
    syllables = lazy_pinyin(zh, style=Style.TONE, errors=lambda chars: [chars])

    words = []      # các từ đã hoàn chỉnh
    current = ""    # khối âm tiết Hán đang nối
    for raw in syllables:
        syl = raw.strip()
        if not syl:
            continue
        if HAN_RE.search(raw) or strip_marks(syl).isalpha():
            # âm tiết pinyin: nối vào khối hiện tại
            if current and strip_marks(syl)[:1].lower() in "aoe":
                current += "'"
            current += syl
        else:
            if current:
                words.append(current)
                current = ""
            words.append(syl)
    if current:
        words.append(current)

    text = " ".join(words)
    text = re.sub(r"\s+([,，。、；;:：!！?？”“\"')）])", r"\1", text)
    text = re.sub(r"\s+", " ", text).strip()
    if proper and text:
        text = text[0].upper() + text[1:]
    return text


# ------------------------------------------------------------- đọc dữ liệu


def read_rows(wb):
    """Đọc 4 sheet, sửa dòng hỏng, trả về danh sách bản ghi thô."""
    records = []
    for topic in TOPICS:
        ws = wb[topic["sheet"]]
        cols = topic["cols"]
        for row in range(topic["start"], ws.max_row + 1):
            vi = cell(ws.cell(row, cols["vi"]).value)
            zh = cell(ws.cell(row, cols["zh"]).value)
            pinyin = cell(ws.cell(row, cols["pinyin"]).value) if "pinyin" in cols else ""

            if not vi and not zh:
                continue

            # Dòng hỏng: vi và zh bị gộp chung một ô, ngăn bởi em dash.
            if not zh and EM_DASH in vi:
                left, right = [p.strip() for p in vi.split(EM_DASH, 1)]
                if HAN_RE.search(right):
                    report["fixed_rows"].append(
                        {"sheet": topic["sheet"], "row": row, "before": vi,
                         "vi": left, "zh": right})
                    vi, zh = left, right

            records.append({
                "sheet": topic["sheet"], "row": row, "topic": topic["id"],
                "prefix": topic["prefix"], "proper": topic["proper"],
                "vi_raw": vi, "zh_raw": zh, "pinyin_raw": pinyin,
            })
    return records


def apply_pre_merge(records, overrides):
    """Sửa tay ở mức dòng, áp trước khi gộp."""
    for rule in overrides.get("preMerge", []):
        hit = next((r for r in records
                    if r["sheet"] == rule["sheet"] and r["row"] == rule["row"]), None)
        if hit is None:
            report["warnings"].append(
                "Override preMerge không khớp dòng nào: "
                f"{rule['sheet']} dòng {rule['row']}. Có thể file Excel đã thay đổi "
                "— cần kiểm tra lại tools/overrides.json.")
            continue
        before = dict(hit)
        for field, value in rule["set"].items():
            hit[f"{field}_raw"] = value
        report["overrides"].append({
            "stage": "preMerge", "where": f"{rule['sheet']} dòng {rule['row']}",
            "before": f"{before['vi_raw']} | {before['zh_raw']} | {before['pinyin_raw']}",
            "after": f"{hit['vi_raw']} | {hit['zh_raw']} | {hit['pinyin_raw']}",
            "reason": rule.get("reason", ""),
        })


def to_card(rec):
    """Bản ghi thô thành thẻ đã chuẩn hoá (tách ngoặc, tách đáp án thay thế)."""
    vi_first, vi_alts = split_alts(rec["vi_raw"])
    zh_first, zh_alts = split_alts(rec["zh_raw"])
    py_first, py_alts = split_alts(rec["pinyin_raw"])

    vi, vi_ctx = split_paren(vi_first)
    zh, zh_ctx = split_paren(zh_first)
    pinyin, _ = split_paren(py_first)

    # Phần trong ngoặc chỉ là ngữ cảnh (tỉnh thành, chú thích) nên dùng để
    # hiển thị gợi ý, không tính là đáp án hợp lệ khi chấm.
    alt_vi = [split_paren(a)[0] for a in vi_alts]
    alt_zh = [split_paren(a)[0] for a in zh_alts]

    return {
        "vi": vi, "zh": zh, "pinyin": pinyin,
        "context": vi_ctx or zh_ctx,
        "altVi": [a for a in alt_vi if a],
        "altZh": [a for a in alt_zh if a],
        "altPinyin": [split_paren(a)[0] for a in py_alts if a],
        "topics": [rec["topic"]],
        "prefix": rec["prefix"], "proper": rec["proper"],
        "sources": [f"{rec['sheet']}!{rec['row']}"],
        "pinyinAuto": False,
        "note": "",
    }


def merge(cards):
    """Gộp các thẻ trùng nhau theo khoá tiếng Việt đã chuẩn hoá."""
    groups = {}
    order = []
    for card in cards:
        # Chỉ gộp trong cùng một sheet. Hai sheet khác nhau có thể trùng tên
        # tiếng Việt mà là hai nơi khác hẳn (Hồ Tây Hà Nội vs Tây Hồ Hàng Châu).
        key = (card["topics"][0], norm_key(card["vi"]) or norm_key(card["zh"]))
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(card)

    merged = []
    for key in order:
        group = groups[key]
        if len(group) == 1:
            merged.append(group[0])
            continue

        # Bản đầy đủ nhất làm chuẩn: ưu tiên có pinyin, rồi có ngữ cảnh.
        best = max(group, key=lambda c: (bool(c["pinyin"]), bool(c["context"]),
                                         len(c["zh"])))
        variants = []
        for other in group:
            if other is best:
                continue
            for field in ("altVi", "altZh", "altPinyin", "topics", "sources"):
                for value in other[field]:
                    if value not in best[field]:
                        best[field].append(value)
            if not best["context"] and other["context"]:
                best["context"] = other["context"]
            if not best["pinyin"] and other["pinyin"]:
                best["pinyin"] = other["pinyin"]
            if other["zh"] and other["zh"] != best["zh"]:
                variants.append(other["zh"])
                if other["zh"] not in best["altZh"]:
                    best["altZh"].append(other["zh"])

        # Giữ tham chiếu tới thẻ để báo cáo đọc được giá trị CUỐI CÙNG,
        # sau khi apply_post_merge có thể đã đổi chữ Hán chuẩn.
        entry = {"card": best, "vi": best["vi"],
                 "sources": list(best["sources"]), "variants": variants}
        report["merged"].append(entry)
        if variants:
            report["conflicts"].append(entry)
        merged.append(best)
    return merged


def apply_post_merge(cards, overrides):
    """Sửa tay ở mức thẻ đã gộp: chốt chữ Hán chuẩn giữa các biến thể."""
    by_key = {norm_key(c["vi"]): c for c in cards}
    for rule in overrides.get("postMerge", []):
        card = by_key.get(rule["key"])
        if card is None:
            report["warnings"].append(
                f"Override postMerge không khớp thẻ nào: khoá '{rule['key']}'. "
                "Có thể file Excel đã thay đổi — cần kiểm tra lại tools/overrides.json.")
            continue
        before_zh = card["zh"]
        for field, value in rule.get("set", {}).items():
            card[field] = value
        for alt in rule.get("addAltZh", []):
            if alt not in card["altZh"]:
                card["altZh"].append(alt)
        if before_zh and before_zh != card["zh"] and before_zh not in card["altZh"]:
            card["altZh"].append(before_zh)
        card["altZh"] = [a for a in card["altZh"] if a != card["zh"]]
        if rule.get("note"):
            card["note"] = rule["note"]
        report["overrides"].append({
            "stage": "postMerge", "where": f"thẻ '{card['vi']}'",
            "before": before_zh, "after": card["zh"],
            "reason": rule.get("reason", ""),
        })


def fill_pinyin(cards):
    for card in cards:
        if card["pinyin"] or not card["zh"]:
            continue
        card["pinyin"] = gen_pinyin(card["zh"], card["proper"])
        card["pinyinAuto"] = True
        report["auto_pinyin"].append(
            {"vi": card["vi"], "zh": card["zh"], "pinyin": card["pinyin"]})


def finalise(cards):
    """Gán id, bỏ trường nội bộ, loại thẻ không dùng được."""
    counters = {}
    out = []
    for card in cards:
        if not card["zh"] or not card["vi"]:
            report["skipped"].append(
                {"vi": card["vi"], "zh": card["zh"], "sources": card["sources"],
                 "why": "thiếu tiếng Việt" if not card["vi"] else "thiếu chữ Hán"})
            continue
        prefix = card["prefix"]
        counters[prefix] = counters.get(prefix, 0) + 1
        out.append({
            "id": f"{prefix}-{counters[prefix]:03d}",
            "vi": card["vi"],
            "zh": card["zh"],
            "pinyin": card["pinyin"],
            "pinyinAuto": card["pinyinAuto"],
            "context": card["context"],
            "note": card["note"],
            "altVi": sorted({a for a in card["altVi"] if a != card["vi"]}),
            "altZh": sorted({a for a in card["altZh"] if a != card["zh"]}),
            "altPinyin": sorted({a for a in card["altPinyin"] if a != card["pinyin"]}),
            "topics": card["topics"],
            "sources": card["sources"],
        })
    return out


def check(cards):
    """Bảo đảm dữ liệu xuất ra dùng được, dừng build nếu không."""
    problems = []
    seen = set()
    for card in cards:
        if card["id"] in seen:
            problems.append(f"id trùng: {card['id']}")
        seen.add(card["id"])
        for field in ("vi", "zh", "pinyin"):
            if not card[field].strip():
                problems.append(f"{card['id']} thiếu trường '{field}'")
        if not card["topics"]:
            problems.append(f"{card['id']} không thuộc chủ đề nào")
    if problems:
        print("LỖI dữ liệu:", file=sys.stderr)
        for p in problems:
            print("  -", p, file=sys.stderr)
        sys.exit(1)


# ------------------------------------------------------------------ report


def write_report(cards, topic_counts, raw_count):
    lines = []
    add = lines.append
    add("# Báo cáo build dữ liệu")
    add("")
    add(f"Nguồn: `{XLSX.name}` · Ngày build: {date.today().isoformat()}")
    add("")
    add(f"- Dòng đọc được từ Excel: **{raw_count}**")
    add(f"- Thẻ sau khi gộp trùng lặp: **{len(cards)}**")
    add(f"- Số nhóm bị gộp: **{len(report['merged'])}**")
    add(f"- Pinyin sinh tự động: **{len(report['auto_pinyin'])}**")
    add("")
    for topic in TOPICS:
        add(f"- {topic['name']}: {topic_counts.get(topic['id'], 0)} thẻ")
    add("")

    add("## 1. Dòng hỏng đã tách lại")
    add("")
    if report["fixed_rows"]:
        add("Các ô gộp chung tiếng Việt và chữ Hán, tách theo dấu `—`:")
        add("")
        add("| Dòng | Nội dung gốc | Tiếng Việt | Chữ Hán |")
        add("|---|---|---|---|")
        for f in report["fixed_rows"]:
            add(f"| {f['sheet']}!{f['row']} | {f['before']} | {f['vi']} | {f['zh']} |")
    else:
        add("_Không có._")
    add("")

    add("## 2. Sửa tay (tools/overrides.json)")
    add("")
    if report["overrides"]:
        for o in report["overrides"]:
            add(f"- **{o['where']}** ({o['stage']})")
            add(f"  - Trước: `{o['before']}`")
            add(f"  - Sau: `{o['after']}`")
            add(f"  - Lý do: {o['reason']}")
    else:
        add("_Không có._")
    add("")

    add("## 3. Chữ Hán mâu thuẫn giữa các dòng trùng nhau")
    add("")
    if report["conflicts"]:
        add("Giữ bản chuẩn; các biến thể còn lại vẫn được chấp nhận khi chấm điểm:")
        add("")
        add("| Thẻ | Bản giữ | Biến thể | Dòng gốc |")
        add("|---|---|---|---|")
        for c in report["conflicts"]:
            kept = c["card"]["zh"]
            variants = [v for v in c["variants"] if v != kept]
            add(f"| {c['vi']} | {kept} | {', '.join(variants)} | "
                f"{', '.join(c['sources'])} |")
    else:
        add("_Không có._")
    add("")

    add("## 4. Nhóm trùng lặp đã gộp")
    add("")
    if report["merged"]:
        add("| Thẻ | Dòng gốc |")
        add("|---|---|")
        for m in report["merged"]:
            add(f"| {m['vi']} | {', '.join(m['sources'])} |")
    else:
        add("_Không có._")
    add("")

    add("## 5. Pinyin sinh tự động — cần rà lại")
    add("")
    add("Pinyin dưới đây do `pypinyin` sinh, chưa qua kiểm chứng. Trên web chúng "
        "hiển thị kèm dấu nhắc. Muốn sửa: bổ sung pinyin vào Excel rồi chạy lại script.")
    add("")
    if report["auto_pinyin"]:
        add("| Tiếng Việt | Chữ Hán | Pinyin tự sinh |")
        add("|---|---|---|")
        for a in report["auto_pinyin"]:
            add(f"| {a['vi']} | {a['zh']} | {a['pinyin']} |")
    else:
        add("_Không có._")
    add("")

    add("## 6. Dòng bị loại")
    add("")
    if report["skipped"]:
        add("| Nội dung | Dòng gốc | Lý do |")
        add("|---|---|---|")
        for s in report["skipped"]:
            add(f"| {s['vi']} {s['zh']} | {', '.join(s['sources'])} | {s['why']} |")
    else:
        add("_Không có._")
    add("")

    if report["warnings"]:
        add("## 7. Cảnh báo")
        add("")
        for w in report["warnings"]:
            add(f"- {w}")
        add("")

    OUT_REPORT.write_text("\n".join(lines), encoding="utf-8")


# -------------------------------------------------------------------- main


def main():
    if not XLSX.exists():
        sys.exit(f"Không tìm thấy {XLSX}")
    overrides = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))

    wb = openpyxl.load_workbook(XLSX, data_only=True)
    records = read_rows(wb)
    raw_count = len(records)

    apply_pre_merge(records, overrides)
    cards = [to_card(r) for r in records]
    cards = merge(cards)
    apply_post_merge(cards, overrides)
    fill_pinyin(cards)
    cards = finalise(cards)
    check(cards)

    topic_counts = {}
    for card in cards:
        for topic_id in card["topics"]:
            topic_counts[topic_id] = topic_counts.get(topic_id, 0) + 1

    payload = {
        "version": 1,
        "generatedAt": date.today().isoformat(),
        "source": XLSX.name,
        "topics": [{"id": t["id"], "name": t["name"],
                    "count": topic_counts.get(t["id"], 0)} for t in TOPICS],
        "cards": cards,
    }
    serialised = json.dumps(payload, ensure_ascii=False, indent=1)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(serialised, encoding="utf-8")
    # Bản .js để trang chạy được cả khi mở trực tiếp bằng file:// (fetch bị chặn).
    OUT_JS.write_text(
        "/* Tự sinh bởi tools/build_data.py — đừng sửa tay. */\n"
        "window.VOCAB = " + serialised + ";\n",
        encoding="utf-8")
    write_report(cards, topic_counts, raw_count)

    print(f"Đọc {raw_count} dòng -> {len(cards)} thẻ "
          f"(gộp {len(report['merged'])} nhóm, "
          f"sinh {len(report['auto_pinyin'])} pinyin)")
    for t in TOPICS:
        print(f"  {t['name']}: {topic_counts.get(t['id'], 0)}")
    if report["warnings"]:
        print(f"  {len(report['warnings'])} cảnh báo — xem {OUT_REPORT.name}")
    print(f"Đã ghi {OUT_JSON.relative_to(ROOT)}, {OUT_JS.relative_to(ROOT)} "
          f"và {OUT_REPORT.name}")


if __name__ == "__main__":
    main()
