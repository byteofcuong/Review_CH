# Web học từ vựng tiếng Trung chuyên ngành — Requirements

Hai môn, hai file Excel, một trang web: 780 thẻ.

## 1. Mục tiêu

Một web app học thuộc lòng từ vựng tiếng Trung chuyên ngành cho hai môn.
Người dùng chỉ cần **mở link là học được ngay** — không clone repo, không cài đặt,
không đăng nhập. Chọn môn bằng tab ở trang chủ; tiến độ của hai môn độc lập nhau.

## 2. Nguồn dữ liệu

### Môn Biên du lịch — `Biên du lịch.xlsx` (203 thẻ)

| Sheet gốc | Tên hiển thị | Số mục | Trường có sẵn |
|---|---|---|---|
| Địa danh | Địa danh & Di sản Việt Nam | 118 | vi, zh, pinyin |
| Từ chuyên ngành | Từ vựng ngành du lịch | 60 | vi, zh |
| Trang tính3 | Danh thắng Trung Quốc | 33 | zh, vi, pinyin |
| Trang tính4 | Cụm từ & thành ngữ | 13 | zh, vi |

### Môn Phiên dịch nâng cao — `Phiên dịch nâng cao.xlsx` (577 thẻ)

Nguồn là **11 sheet đã phân loại** (`1. Tổ chức…` → `11. Khác`), tổng 531 mục,
chủ đề tranh chấp thương mại quốc tế và WTO. Mỗi sheet có cột *Phân loại* đánh
dấu nhóm con (45 tên nhóm), chỉ điền ở dòng đầu mỗi nhóm nên phải forward-fill.

Hai sheet bị **bỏ qua** có lý do: `Tổng quan` chỉ là bảng mục lục;
`Trang tính1` là master list thô 646 dòng mà việc gộp trùng của nó đã được áp
vào 11 sheet kia rồi, dùng lại sẽ ra dữ liệu cũ hơn.

Dữ liệu môn này sạch: 0 ô thiếu, 0 trùng chữ Hán, pinyin có sẵn gần như đủ.

### Schema chuẩn hoá (JSON)

```json
{
  "version": 2,
  "subjects": [
    {
      "id": "phien-dich",
      "name": "Phiên dịch nâng cao",
      "zh": "经贸",
      "topics": [ { "id": "pd-wto", "name": "…", "count": 89 } ],
      "cards": [
        {
          "id": "pd02-039",
          "vi": "Thặng dư thương mại",
          "zh": "贸易顺差",
          "pinyin": "màoyì shùnchā",
          "pinyinAuto": false,
          "context": "",
          "note": "",
          "group": "Thuế, hạn ngạch",
          "altVi": [], "altZh": [], "altPinyin": [],
          "topics": ["pd-khai-niem"],
          "sources": ["2. Khái niệm & Nguyên tắc!34"]
        }
      ]
    }
  ]
}
```

- `altVi` / `altZh` / `altPinyin`: đáp án thay thế, đều được chấm đúng
- `context`: phần trong ngoặc — hiển thị làm gợi ý, **không** tính là đáp án,
  trừ khi là tên viết tắt tổ chức (WTO, IMF, DSU…) thì mới chấm đúng
- `group`: nhóm con, chỉ môn Phiên dịch có
- `pinyinAuto: true` = pinyin do máy sinh, UI hiển thị dấu hiệu "cần rà soát"
- **`id` phải duy nhất trên cả hai môn** vì tiến độ học lưu theo id thẻ.
  Môn cũ giữ tiền tố `dd-` `tv-` `tq-` `ct-` để tiến độ đã có không mất;
  môn mới dùng `pd01-` … `pd11-`

## 3. Pipeline dữ liệu

Một script Python `tools/build_data.py` xử lý cả hai môn, chạy lại được bất cứ
lúc nào Excel cập nhật. **Không bao giờ ghi vào file Excel.**

### Quy tắc dấu `/` của môn Phiên dịch

Dấu `/` trong file này mang hai nghĩa khác nhau nên phải phân biệt. Gọi `nz`/`nv`
là số phần chữ Hán / tiếng Việt sau khi cắt theo `/`:

| Trường hợp | Số dòng | Xử lý |
|---|---|---|
| `nz == nv > 1` | 36 | **Tách thành `nz` thẻ riêng**, ghép theo vị trí |
| `nz == 1`, `nv > 1` | 54 | Một thẻ; phần sau vào `altVi` |
| `nz > 1`, `nv == 1` | 17 | Một thẻ; phần sau vào `altZh` |
| `nz != nv`, cả hai > 1 | 3 | Một thẻ, phần sau thành đáp án phụ; ghi vào report để rà |

Hàng đầu là quyết định quan trọng: `贸易顺差 / 贸易赤字` là thặng dư và thâm hụt —
hai khái niệm **trái ngược**. Gộp làm một thẻ sẽ chấm đúng cho người gõ "thâm hụt"
vào thẻ thặng dư, tức dạy sai. Tách thì tệ nhất chỉ là vài cặp gần nghĩa
(`供应链中断 / 供应链断裂`) thành hai thẻ hơi dư, không sai kiến thức.

Ngoặc giữa câu (`取消对……（产品）的关税`) là phần của cấu trúc câu nên **không**
bị cắt; chỉ ngoặc ở cuối chuỗi mới tách ra làm `context`.

### Pipeline môn Biên du lịch

Script một chiều: `xlsx → data.json`, chạy lại được khi Excel cập nhật.

1. Đọc 4 sheet bằng `openpyxl`.
2. **Sửa 12 dòng hỏng** (Địa danh, dòng 108–119): dạng `Điện Biên Phủ — 奠边府`
   gộp chung một ô ⇒ tách theo dấu `—` thành cột `vi` / `zh`.
3. **Sinh pinyin thiếu** bằng `pypinyin` cho 74 mục (60 từ chuyên ngành + 14 địa danh),
   đánh dấu `pinyinAuto: true`.
4. **Gộp trùng lặp**: 8 mục (Vịnh Hạ Long, Cố đô Huế, Tràng An, Kéo co, Hà Nội,
   Hoàng thành Thăng Long, Thành nhà Hồ, Thánh địa Mỹ Sơn) ⇒ giữ 1 thẻ,
   gắn nhiều `topics`.
5. **Tách `alt`** từ dấu `/`.
6. Xuất `data.json` + `report.md` liệt kê mọi thay đổi để người dùng duyệt.

### Việc cần người quyết (ghi vào report, không tự đoán)
- Dòng `新中国` thiếu nghĩa tiếng Việt.
- `Cù Lao Chamf` (dòng 119) — lỗi chính tả, thiếu chữ Hán.

**File Excel gốc không bị sửa.**

## 4. Chức năng

### 4.0 Chọn môn
- Tab chọn môn ở trang chủ; chủ đề, ôn tập và thống kê đi theo môn đang chọn.
- Môn đang chọn nhớ trong `localStorage` (`lc.subject`).
- Có dòng nhắc khi môn còn lại có thẻ đến hạn, kèm nút chuyển nhanh.
- Màn cấu hình phiên có thêm lựa chọn **trộn cả hai môn**.
- Trang Tiến độ: con số tổng ở trên, biểu đồ chia theo từng môn ở dưới.

### 4.1 Chế độ học
- **Flashcard**: lật thẻ, tự đánh giá (Dễ / Bình thường / Khó / Quên).
- **Trắc nghiệm**: 4 đáp án. Distractor lấy từ **cùng môn** và cùng chủ đề —
  nếu lẫn môn thì thẻ địa danh du lịch sẽ có ba đáp án nhiễu là thuật ngữ WTO,
  đoán ra ngay mà không cần biết nghĩa.
- **Gõ đáp án**: nhập ngay trên trang, không mở Excel. Chấp nhận mọi giá trị
  trong `altVi`/`altZh`/`altPinyin`, bỏ qua khác biệt hoa/thường, dấu thanh
  pinyin và dấu tiếng Việt. Thẻ đáp án chữ Hán nhận cả pinyin.

### 4.2 Chiều học (chọn được)
- Việt → Trung
- Trung → Việt
- Pinyin → Hán tự
- Ngẫu nhiên hỗn hợp

### 4.3 Spaced repetition
- Thuật toán SM-2 rút gọn, lịch ôn: 1 ngày → 3 → 7 → 16 → 35.
- Thẻ trả lời sai quay lại trong cùng phiên.
- Màn hình chính hiện số thẻ đến hạn ôn hôm nay.

### 4.4 Khác
- Lọc theo chủ đề / theo sheet; chọn số thẻ mỗi phiên (10/20/50/tất cả).
- Đánh dấu sao thẻ khó → bộ "thẻ khó" riêng.
- Phát âm chữ Hán bằng Web Speech API (`zh-CN`), fallback im lặng nếu
  trình duyệt không hỗ trợ.
- Thống kê: số thẻ đã thuộc, streak ngày học, tỉ lệ đúng theo chủ đề.
- Tìm kiếm tra cứu toàn bộ từ vựng.

## 5. Kỹ thuật

- **Static site thuần**, không backend. Dữ liệu nhúng sẵn dạng JSON.
- **Deploy**: GitHub Pages hoặc Vercel → link công khai, ai cũng vào được.
- **Tiến độ**: `localStorage` trên máy người học. Không đăng nhập,
  không thu thập dữ liệu cá nhân. Mỗi người có tiến độ độc lập.
- **PWA**: service worker cache toàn bộ app ⇒ chạy offline sau lần mở đầu.
- **Mobile-first**, responsive; font hỗ trợ đầy đủ chữ Hán + dấu tiếng Việt.
- Hỗ trợ dark mode theo thiết lập hệ thống.

## 6. Ngoài phạm vi (v1)

- Tài khoản người dùng, đồng bộ đa thiết bị.
- Bảng xếp hạng, tính năng xã hội.
- Nhận diện viết tay chữ Hán.
- Chỉnh sửa từ vựng trực tiếp trên web (vẫn sửa qua Excel rồi chạy lại script).
