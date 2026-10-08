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
XLSX_TRAVEL = ROOT / "Biên du lịch.xlsx"
XLSX_INTERPRET = ROOT / "Phiên dịch nâng cao.xlsx"
OVERRIDES_PATH = HERE / "overrides.json"
OUT_JSON = ROOT / "docs" / "data" / "vocab.json"
OUT_JS = ROOT / "docs" / "data" / "vocab.js"
OUT_REPORT = ROOT / "build_report.md"

EM_DASH = "—"  # dùng để tách các dòng bị gộp vi + zh chung một ô
HAN_RE = re.compile(r"[㐀-䶿一-鿿]")
PAREN_RE = re.compile(r"\s*[（(]\s*([^（()）]*?)\s*[）)]\s*")
PUNCT_RE = re.compile("[‐-―\\-_,;:.\"'’“”]+")
# Tên viết tắt trong ngoặc: WTO, IMF, UNCTAD, DSU, MFN, G20…
ABBREV_RE = re.compile(r"^[A-Z][A-Z0-9\-\.]{1,9}$")

# ══════════════════════════════════════════════════════ môn Biên du lịch ══
# Cấu hình từng sheet: cột nào là gì, bắt đầu từ dòng nào.
TRAVEL_TOPICS = [
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

# ═══════════════════════════════════════════════ môn Phiên dịch nâng cao ══
# Nguồn là 11 sheet đã phân loại sẵn. Bỏ qua 'Tổng quan' (chỉ là mục lục) và
# 'Trang tính1' (master list thô — việc gộp trùng đã được áp vào 11 sheet này).
# Sheet 1-10 có cột B là nhóm con, chỉ điền ở dòng đầu mỗi nhóm nên phải
# forward-fill; sheet 11 không có cột đó nên các cột dịch sang trái một ô.
INTERPRET_SHEETS = [
    {"sheet": "1. Tổ chức, Cơ quan, Hiệp định", "id": "pd-to-chuc", "prefix": "pd01",
     "name": "Tổ chức, Cơ quan và Hiệp định"},
    {"sheet": "2. Khái niệm & Nguyên tắc", "id": "pd-khai-niem", "prefix": "pd02",
     "name": "Khái niệm và Nguyên tắc thương mại"},
    {"sheet": "3. Xung đột & Tác động", "id": "pd-xung-dot", "prefix": "pd03",
     "name": "Xung đột thương mại và Tác động"},
    {"sheet": "4. Thuế quan, Trừng phạt", "id": "pd-thue-quan", "prefix": "pd04",
     "name": "Thuế quan, Trừng phạt và Trả đũa"},
    {"sheet": "5. Phòng vệ thương mại", "id": "pd-phong-ve", "prefix": "pd05",
     "name": "Phòng vệ thương mại"},
    {"sheet": "6. Đàm phán & Hòa giải", "id": "pd-dam-phan", "prefix": "pd06",
     "name": "Đàm phán và Hòa giải"},
    {"sheet": "7. Giải quyết tranh chấp WTO", "id": "pd-wto", "prefix": "pd07",
     "name": "Giải quyết tranh chấp tại WTO"},
    {"sheet": "8. Trọng tài, Tố tụng, Hợp đồng", "id": "pd-trong-tai", "prefix": "pd08",
     "name": "Trọng tài, Tố tụng và Hợp đồng"},
    {"sheet": "9. Hàng hóa & Ngành", "id": "pd-hang-hoa", "prefix": "pd09",
     "name": "Hàng hóa và Ngành"},
    {"sheet": "10. Ngoại giao & Cấu trúc câu", "id": "pd-ngoai-giao", "prefix": "pd10",
     "name": "Ngôn ngữ ngoại giao và Cấu trúc câu"},
    {"sheet": "11. Khác", "id": "pd-khac", "prefix": "pd11", "name": "Khác"},
]


def new_report():
    return {"fixed_rows": [], "merged": [], "conflicts": [], "auto_pinyin": [],
            "overrides": [], "warnings": [], "skipped": [], "split_pairs": [],
            "kept_whole": []}


report = new_report()


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


def read_travel_rows(wb):
    """Đọc 4 sheet môn Biên du lịch, sửa dòng hỏng, trả về bản ghi thô."""
    records = []
    for topic in TRAVEL_TOPICS:
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
                "vi_raw": vi, "zh_raw": zh, "pinyin_raw": pinyin, "group": "",
            })
    return records


def slash_parts(text):
    return [p.strip() for p in str(text or "").split("/") if p.strip()]


def read_interpret_rows(wb):
    """Đọc 11 sheet môn Phiên dịch nâng cao.

    Dấu '/' trong file này mang hai nghĩa khác nhau, nên phải phân biệt:

    - số phần chữ Hán bằng số phần tiếng Việt và lớn hơn 1: đây là liệt kê
      song song, thường là cặp đối lập ('贸易顺差 / 贸易赤字' = thặng dư /
      thâm hụt). Gộp làm một thẻ sẽ chấm đúng cho người gõ 'thâm hụt' vào thẻ
      thặng dư, nên tách thành nhiều thẻ độc lập, ghép theo vị trí.
    - các trường hợp còn lại là cách nói đồng nghĩa, để `to_card` đưa phần
      sau vào đáp án phụ như môn Biên du lịch.
    """
    records = []
    for conf in INTERPRET_SHEETS:
        ws = wb[conf["sheet"]]
        is_last = conf["sheet"].startswith("11.")
        # Sheet 11 không có cột 'Phân loại' nên các cột dịch sang trái một ô.
        group_col = None if is_last else 2
        zh_col, py_col, vi_col, note_col = (2, 3, 4, 5) if is_last else (3, 4, 5, 6)

        group = ""
        for row in range(2, ws.max_row + 1):
            zh = cell(ws.cell(row, zh_col).value)
            vi = cell(ws.cell(row, vi_col).value)
            pinyin = cell(ws.cell(row, py_col).value)
            note = cell(ws.cell(row, note_col).value)

            if group_col:
                label = cell(ws.cell(row, group_col).value)
                if label:
                    group = label          # forward-fill cho cả nhóm
            if not zh and not vi:
                continue

            base = {
                "sheet": conf["sheet"], "row": row, "topic": conf["id"],
                "prefix": conf["prefix"], "proper": False,
                "group": group, "note_raw": note,
            }

            zh_parts = slash_parts(zh)
            vi_parts = slash_parts(vi)
            py_parts = slash_parts(pinyin)

            if len(zh_parts) > 1 and len(zh_parts) == len(vi_parts):
                aligned = len(py_parts) == len(zh_parts)
                for i, zh_part in enumerate(zh_parts):
                    piece = dict(base)
                    piece["vi_raw"] = vi_parts[i]
                    piece["zh_raw"] = zh_part
                    # Pinyin cắt song song được thì dùng, không thì để trống
                    # cho fill_pinyin sinh lại và đánh dấu là tự sinh.
                    piece["pinyin_raw"] = py_parts[i] if aligned else ""
                    records.append(piece)
                report["split_pairs"].append({
                    "sheet": conf["sheet"], "row": row, "zh": zh, "vi": vi,
                    "parts": len(zh_parts), "pinyin_aligned": aligned,
                })
                continue

            if len(zh_parts) > 1 and len(vi_parts) > 1:
                # Số phần lệch nhau: coi là đồng nghĩa, phần sau thành đáp án
                # phụ. Ghi lại để người dùng rà vì không suy được chắc chắn.
                report["kept_whole"].append({
                    "sheet": conf["sheet"], "row": row, "zh": zh, "vi": vi,
                    "zh_parts": len(zh_parts), "vi_parts": len(vi_parts),
                })

            piece = dict(base)
            piece["vi_raw"] = vi
            piece["zh_raw"] = zh
            piece["pinyin_raw"] = pinyin
            records.append(piece)
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


def split_paren_tail(text):
    """Như split_paren nhưng chỉ cắt phần ngoặc nằm ở CUỐI chuỗi.

    Môn Phiên dịch có ngoặc giữa câu ('取消对……（产品）的关税') là một phần của
    cấu trúc câu, cắt ra sẽ làm hỏng nghĩa. Ngoặc ở cuối thì thường là chú
    thích hoặc tên viết tắt ('最惠国待遇（MFN）') nên cắt được.
    """
    if not text:
        return "", ""
    match = re.search(r"\s*[（(]\s*([^（()）]*?)\s*[）)]\s*$", text)
    if not match:
        return re.sub(r"\s+", " ", text).strip(), ""
    return text[:match.start()].strip(" -–—,;"), match.group(1).strip()


def to_card(rec):
    """Bản ghi thô thành thẻ đã chuẩn hoá (tách ngoặc, tách đáp án thay thế)."""
    vi_first, vi_alts = split_alts(rec["vi_raw"])
    zh_first, zh_alts = split_alts(rec["zh_raw"])
    py_first, py_alts = split_alts(rec["pinyin_raw"])

    cut = split_paren_tail if rec.get("tail_paren") else split_paren
    vi, vi_ctx = cut(vi_first)
    zh, zh_ctx = cut(zh_first)
    pinyin, _ = cut(py_first)

    # Phần trong ngoặc chỉ là ngữ cảnh (tỉnh thành, chú thích) nên dùng để
    # hiển thị gợi ý, không tính là đáp án hợp lệ khi chấm.
    alt_vi = [cut(a)[0] for a in vi_alts]
    alt_zh = [cut(a)[0] for a in zh_alts]

    # Ngoại lệ: ngoặc chứa tên viết tắt của tổ chức hay hiệp định (WTO, IMF,
    # UNCTAD, DSU…) thì chính nó là cách gọi thông dụng nhất, phải chấm đúng.
    if vi_ctx and ABBREV_RE.match(vi_ctx):
        alt_vi.append(vi_ctx)

    return {
        "vi": vi, "zh": zh, "pinyin": pinyin,
        "context": vi_ctx or zh_ctx,
        "altVi": [a for a in alt_vi if a],
        "altZh": [a for a in alt_zh if a],
        "altPinyin": [cut(a)[0] for a in py_alts if a],
        "topics": [rec["topic"]],
        "group": rec.get("group", ""),
        "prefix": rec["prefix"], "proper": rec["proper"],
        "sources": [f"{rec['sheet']}!{rec['row']}"],
        "pinyinAuto": False,
        "note": rec.get("note_raw", ""),
    }


def merge(cards, key_field="vi"):
    """Gộp các thẻ trùng nhau theo khoá đã chuẩn hoá.

    Môn Biên du lịch gốc là tiếng Việt nên gộp theo cột tiếng Việt. Môn Phiên
    dịch gốc là chữ Hán, và nhiều chữ Hán khác nhau dịch ra cùng một nghĩa
    tiếng Việt, nên phải gộp theo chữ Hán.
    """
    other_field = "zh" if key_field == "vi" else "vi"
    groups = {}
    order = []
    for card in cards:
        # Chỉ gộp trong cùng một sheet. Hai sheet khác nhau có thể trùng tên
        # tiếng Việt mà là hai nơi khác hẳn (Hồ Tây Hà Nội vs Tây Hồ Hàng Châu).
        key = (card["topics"][0],
               norm_key(card[key_field]) or norm_key(card[other_field]))
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
            "group": card.get("group", ""),
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


def write_report(subjects, reports):
    """Một báo cáo chung, mỗi môn một chương."""
    lines = []
    add = lines.append
    add("# Báo cáo build dữ liệu")
    add("")
    add(f"Ngày build: {date.today().isoformat()}")
    add("")
    add("| Môn | Nguồn | Dòng đọc | Thẻ | Gộp | Tách cặp | Pinyin tự sinh |")
    add("|---|---|---|---|---|---|---|")
    for subject in subjects:
        rep = reports[subject["id"]]
        add(f"| {subject['name']} | `{subject['source']}` | {subject['rawCount']} | "
            f"{len(subject['cards'])} | {len(rep['merged'])} | "
            f"{len(rep['split_pairs'])} | {len(rep['auto_pinyin'])} |")
    add("")
    add("Hai file Excel gốc không bị ghi vào. Chạy lại bất cứ lúc nào bằng")
    add("`python tools/build_data.py`.")
    add("")

    for subject in subjects:
        rep = reports[subject["id"]]
        add("---")
        add("")
        add(f"# {subject['name']}")
        add("")
        add(f"Nguồn: `{subject['source']}` · {len(subject['cards'])} thẻ")
        add("")
        for topic in subject["topicConf"]:
            add(f"- {topic['name']}: {subject['topicCounts'].get(topic['id'], 0)} thẻ")
        add("")
        write_subject_sections(add, subject, rep)

    OUT_REPORT.write_text("\n".join(lines), encoding="utf-8")


def write_subject_sections(add, subject, rep):
    section = [0]

    def heading(title):
        section[0] += 1
        add(f"## {section[0]}. {title}")
        add("")

    if rep["fixed_rows"]:
        heading("Dòng hỏng đã tách lại")
        add("Các ô gộp chung tiếng Việt và chữ Hán, tách theo dấu `—`:")
        add("")
        add("| Dòng | Nội dung gốc | Tiếng Việt | Chữ Hán |")
        add("|---|---|---|---|")
        for f in rep["fixed_rows"]:
            add(f"| {f['sheet']}!{f['row']} | {f['before']} | {f['vi']} | {f['zh']} |")
        add("")

    if rep["split_pairs"]:
        heading("Dòng liệt kê song song đã tách thành nhiều thẻ")
        add("Số phần chữ Hán bằng số phần tiếng Việt, nên đây là liệt kê song")
        add("song chứ không phải cách nói đồng nghĩa. Gộp làm một thẻ sẽ chấm")
        add("đúng cho đáp án của phần khác (gõ *thâm hụt* vào thẻ 贸易顺差),")
        add("nên mỗi phần thành một thẻ riêng, ghép theo vị trí.")
        add("")
        add("| Dòng | Chữ Hán gốc | Tiếng Việt gốc | Số thẻ | Pinyin cắt được |")
        add("|---|---|---|---|---|")
        for s in rep["split_pairs"]:
            ok = "có" if s["pinyin_aligned"] else "**không** — sinh lại"
            add(f"| {s['sheet']}!{s['row']} | {s['zh']} | {s['vi']} | "
                f"{s['parts']} | {ok} |")
        add("")

    if rep["kept_whole"]:
        heading("Dòng lệch số phần — giữ làm một thẻ, cần rà lại")
        add("Số phần chữ Hán và tiếng Việt không bằng nhau nên không ghép theo")
        add("vị trí được. Các phần sau dấu `/` được nhận làm đáp án phụ. Nếu đây")
        add("thực ra là những khái niệm khác nhau thì nên tách dòng trong Excel.")
        add("")
        add("| Dòng | Chữ Hán | Tiếng Việt | Phần Hán / phần Việt |")
        add("|---|---|---|---|")
        for k in rep["kept_whole"]:
            add(f"| {k['sheet']}!{k['row']} | {k['zh']} | {k['vi']} | "
                f"{k['zh_parts']} / {k['vi_parts']} |")
        add("")

    if rep["overrides"]:
        heading("Sửa tay (tools/overrides.json)")
        for o in rep["overrides"]:
            add(f"- **{o['where']}** ({o['stage']})")
            add(f"  - Trước: `{o['before']}`")
            add(f"  - Sau: `{o['after']}`")
            add(f"  - Lý do: {o['reason']}")
        add("")

    if rep["conflicts"]:
        heading("Chữ Hán mâu thuẫn giữa các dòng trùng nhau")
        add("Giữ bản chuẩn; các biến thể còn lại vẫn được chấp nhận khi chấm điểm:")
        add("")
        add("| Thẻ | Bản giữ | Biến thể | Dòng gốc |")
        add("|---|---|---|---|")
        for c in rep["conflicts"]:
            kept = c["card"]["zh"]
            variants = [v for v in c["variants"] if v != kept]
            add(f"| {c['vi']} | {kept} | {', '.join(variants)} | "
                f"{', '.join(c['sources'])} |")
        add("")

    if rep["merged"]:
        heading("Nhóm trùng lặp đã gộp")
        add("| Thẻ | Dòng gốc |")
        add("|---|---|")
        for m in rep["merged"]:
            add(f"| {m['vi']} | {', '.join(m['sources'])} |")
        add("")

    heading("Pinyin sinh tự động — cần rà lại")
    add("Pinyin dưới đây do `pypinyin` sinh, chưa qua kiểm chứng. Trên web chúng")
    add("hiển thị kèm dấu nhắc. Muốn sửa: bổ sung pinyin vào Excel rồi chạy lại script.")
    add("")
    if rep["auto_pinyin"]:
        add("| Tiếng Việt | Chữ Hán | Pinyin tự sinh |")
        add("|---|---|---|")
        for a in rep["auto_pinyin"]:
            add(f"| {a['vi']} | {a['zh']} | {a['pinyin']} |")
    else:
        add("_Không có — file gốc đã đủ pinyin._")
    add("")

    notes = [c for c in subject["cards"] if c["note"]]
    if notes:
        heading("Ghi chú mang từ Excel sang")
        add("Hiển thị ở mặt sau thẻ khi học:")
        add("")
        add("| Chữ Hán | Ghi chú |")
        add("|---|---|")
        for c in notes:
            add(f"| {c['zh']} | {c['note']} |")
        add("")

    if rep["skipped"]:
        heading("Dòng bị loại")
        add("| Nội dung | Dòng gốc | Lý do |")
        add("|---|---|---|")
        for s in rep["skipped"]:
            add(f"| {s['vi']} {s['zh']} | {', '.join(s['sources'])} | {s['why']} |")
        add("")

    if rep["warnings"]:
        heading("Cảnh báo")
        for w in rep["warnings"]:
            add(f"- {w}")
        add("")


# -------------------------------------------------------------------- build


def build_travel(overrides):
    """Môn Biên du lịch: dữ liệu gốc lắm lỗi nên phải sửa và gộp nhiều."""
    wb = openpyxl.load_workbook(XLSX_TRAVEL, data_only=True)
    records = read_travel_rows(wb)
    raw_count = len(records)

    apply_pre_merge(records, overrides)
    cards = [to_card(r) for r in records]
    cards = merge(cards, key_field="vi")
    apply_post_merge(cards, overrides)
    fill_pinyin(cards)
    cards = finalise(cards)

    return {
        "id": "bien-du-lich",
        "name": "Biên du lịch",
        "zh": "旅游",
        "source": XLSX_TRAVEL.name,
        "topicConf": TRAVEL_TOPICS,
        "cards": cards,
        "rawCount": raw_count,
    }


def build_interpret():
    """Môn Phiên dịch nâng cao: dữ liệu đã sàng lọc sẵn, chỉ cần tách dấu /."""
    wb = openpyxl.load_workbook(XLSX_INTERPRET, data_only=True)
    records = read_interpret_rows(wb)
    raw_count = len(records)

    for rec in records:
        rec["tail_paren"] = True       # ngoặc giữa câu là phần của cấu trúc
    cards = [to_card(r) for r in records]
    cards = merge(cards, key_field="zh")
    fill_pinyin(cards)
    cards = finalise(cards)

    return {
        "id": "phien-dich",
        "name": "Phiên dịch nâng cao",
        "zh": "经贸",
        "source": XLSX_INTERPRET.name,
        "topicConf": INTERPRET_SHEETS,
        "cards": cards,
        "rawCount": raw_count,
    }


def main():
    global report

    for path in (XLSX_TRAVEL, XLSX_INTERPRET):
        if not path.exists():
            sys.exit(f"Không tìm thấy {path}")
    overrides = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))

    subjects = []
    reports = {}

    report = new_report()
    travel = build_travel(overrides)
    reports[travel["id"]] = report

    report = new_report()
    interpret = build_interpret()
    reports[interpret["id"]] = report

    for subject in (travel, interpret):
        counts = {}
        for card in subject["cards"]:
            for topic_id in card["topics"]:
                counts[topic_id] = counts.get(topic_id, 0) + 1
        subject["topicCounts"] = counts
        subjects.append({
            "id": subject["id"],
            "name": subject["name"],
            "zh": subject["zh"],
            "source": subject["source"],
            "topics": [{"id": t["id"], "name": t["name"],
                        "count": counts.get(t["id"], 0)}
                       for t in subject["topicConf"]],
            "cards": subject["cards"],
        })

    # id phải duy nhất trên toàn bộ hai môn: tiến độ học lưu theo id thẻ.
    check([card for subject in subjects for card in subject["cards"]])

    payload = {
        "version": 2,
        "generatedAt": date.today().isoformat(),
        "subjects": subjects,
    }
    serialised = json.dumps(payload, ensure_ascii=False, indent=1)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(serialised, encoding="utf-8")
    # Bản .js để trang chạy được cả khi mở trực tiếp bằng file:// (fetch bị chặn).
    OUT_JS.write_text(
        "/* Tự sinh bởi tools/build_data.py — đừng sửa tay. */\n"
        "window.VOCAB = " + serialised + ";\n",
        encoding="utf-8")

    write_report([travel, interpret], reports)

    total = 0
    warnings = 0
    for subject in (travel, interpret):
        rep = reports[subject["id"]]
        total += len(subject["cards"])
        warnings += len(rep["warnings"])
        print(f"{subject['name']}: đọc {subject['rawCount']} dòng -> "
              f"{len(subject['cards'])} thẻ (gộp {len(rep['merged'])} nhóm, "
              f"tách {len(rep['split_pairs'])} cặp, "
              f"sinh {len(rep['auto_pinyin'])} pinyin)")
        for t in subject["topicConf"]:
            print(f"    {t['name']}: {subject['topicCounts'].get(t['id'], 0)}")
    print(f"Tổng: {total} thẻ")
    if warnings:
        print(f"{warnings} cảnh báo — xem {OUT_REPORT.name}")
    print(f"Đã ghi {OUT_JSON.relative_to(ROOT)}, {OUT_JS.relative_to(ROOT)} "
          f"và {OUT_REPORT.name}")


if __name__ == "__main__":
    main()
