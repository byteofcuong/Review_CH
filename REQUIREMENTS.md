# Web học thuộc từ vựng tiếng Trung du lịch — Requirements

Nguồn dữ liệu: `Biên du lịch.xlsx` (4 sheet, ~224 mục).

## 1. Mục tiêu

Một web app học thuộc lòng từ vựng/địa danh tiếng Trung chuyên ngành du lịch.
Người dùng chỉ cần **mở link là học được ngay** — không clone repo, không cài đặt,
không đăng nhập.

## 2. Nguồn dữ liệu

| Sheet gốc | Tên hiển thị | Số mục | Trường có sẵn |
|---|---|---|---|
| Địa danh | Địa danh & Di sản Việt Nam | 118 | vi, zh, pinyin |
| Từ chuyên ngành | Từ vựng ngành du lịch | 60 | vi, zh |
| Trang tính3 | Danh thắng Trung Quốc | 33 | zh, vi, pinyin |
| Trang tính4 | Cụm từ & thành ngữ | 13 | zh, vi |

### Schema chuẩn hoá (JSON)

```json
{
  "id": "dd-001",
  "vi": "Vịnh Hạ Long",
  "zh": "下龙湾",
  "pinyin": "Xiàlóng Wān",
  "pinyinAuto": false,
  "topics": ["dia-danh", "di-san-unesco"],
  "alt": []
}
```

- `alt`: các đáp án thay thế, tách từ dấu `/` trong dữ liệu gốc
  (vd `đền → 祠/ 庙` ⇒ `zh: "祠"`, `alt: ["庙"]`). 15 mục thuộc loại này.
- `pinyinAuto: true` = pinyin do máy sinh, UI hiển thị dấu hiệu "cần rà soát".

## 3. Pipeline dữ liệu

Script Python một chiều: `xlsx → data.json`, chạy lại được khi Excel cập nhật.

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

### 4.1 Chế độ học
- **Flashcard**: lật thẻ, tự đánh giá (Dễ / Bình thường / Khó / Quên).
- **Trắc nghiệm**: 4 đáp án, distractor lấy từ cùng chủ đề.
- **Gõ đáp án**: nhập pinyin hoặc tiếng Việt, chấp nhận mọi giá trị trong `alt`,
  bỏ qua khác biệt hoa/thường và dấu thanh pinyin.

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
