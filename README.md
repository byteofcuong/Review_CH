# Biên Du Lịch — học từ vựng du lịch Trung – Việt

Web học thuộc lòng 203 thẻ từ vựng và địa danh tiếng Trung chuyên ngành du lịch,
rút từ bảng `Biên du lịch.xlsx`.

**Học tại đây: https://byteofcuong.github.io/Review_CH/**

Mở link là học được ngay — không cài đặt, không đăng nhập, không clone repo.
Tiến độ lưu trong trình duyệt của từng người.

## Có gì

- **Ba cách kiểm tra**: lật thẻ tự chấm · trắc nghiệm 4 đáp án · gõ đáp án trên trang
- **Bốn chiều học**: Việt → Trung, Trung → Việt, Pinyin → Hán tự, hoặc trộn
- **Lịch ôn giãn dần** (SM-2 rút gọn): thẻ quên quay lại ngay, thẻ thuộc giãn ra 1 → 3 → 7 ngày rồi xa hơn
- **Chấm khoan dung**: bỏ qua hoa thường, dấu thanh pinyin và dấu tiếng Việt;
  đáp án chữ Hán nhận cả pinyin, nên gõ được trên bàn phím thường
- Tra cứu toàn bộ, đánh dấu thẻ khó, phát âm chữ Hán, chạy offline sau lần mở đầu

## Cấu trúc

```
Biên du lịch.xlsx     nguồn dữ liệu — sửa từ vựng ở đây
tools/
  build_data.py       Excel  →  docs/data/vocab.{json,js} + build_report.md
  overrides.json      các sửa tay không suy ra được từ file gốc
build_report.md       báo cáo mọi thay đổi script đã áp lên dữ liệu
docs/                 trang web tĩnh, GitHub Pages phục vụ thẳng từ đây
```

## Cập nhật từ vựng

Sửa trong `Biên du lịch.xlsx`, rồi:

```bash
pip install -r tools/requirements.txt
python tools/build_data.py
```

Script không bao giờ ghi vào file Excel. Nó đọc 4 sheet, tách các dòng bị gộp
tiếng Việt lẫn chữ Hán, gộp thẻ trùng, sinh pinyin còn thiếu bằng `pypinyin`,
rồi ghi kết quả ra `docs/data/`. Mọi thay đổi được liệt kê trong
`build_report.md` — đọc file đó để rà lại, nhất là mục *pinyin sinh tự động*.

Muốn sửa một mục mà không đụng Excel thì thêm luật vào `tools/overrides.json`.

Sau khi build, commit và push — GitHub Pages tự cập nhật.

## Chạy thử tại máy

```bash
python -m http.server 8000 --directory docs
```

Rồi mở http://localhost:8000.

## Bật GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → branch `main`, thư mục `/docs`.
