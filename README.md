# Hán Ngữ Đường 汉语堂

Web học thuộc lòng **1052 thẻ** tiếng Trung của ba môn, rút từ hai bảng Excel và một bộ slide bài giảng.

**Học tại đây: https://byteofcuong.github.io/Review_CH/**

Mở link là học được ngay — không cài đặt, không đăng nhập, không clone repo.
Tiến độ lưu trong trình duyệt của từng người.

| Môn | Nội dung | Số thẻ | Dạng thẻ |
|---|---|---|---|
| **Biên du lịch** 旅游 | Địa danh, di sản, từ vựng ngành du lịch, danh thắng Trung Quốc | 203 | từ vựng |
| **Phiên dịch nâng cao** 经贸 | Tranh chấp thương mại quốc tế, WTO, trọng tài, thuế quan | 577 | từ vựng |
| **Lịch sử phong kiến Trung Quốc** 历史 | Từ xã hội nguyên thủy đến nhà Thanh, 8 giai đoạn | 272 | hỏi đáp |

## Có gì

- **Tab chọn môn** ở trang chủ; chủ đề, ôn tập và thống kê đi theo môn đang chọn.
  Có dòng nhắc khi môn còn lại có thẻ đến hạn, và tuỳ chọn **trộn cả hai môn**
  trong một phiên.
- **Hai dạng thẻ**: thẻ từ vựng (Việt ↔ Hán ↔ pinyin) và thẻ hỏi đáp kiến thức.
  Thẻ hỏi đáp hỏi và đáp hoàn toàn bằng tiếng Trung; **nghĩa tiếng Việt ẩn đi**,
  chỉ bung ra khi bấm nút, để không phá việc tự nhớ bằng tiếng Trung.
- **Ba cách kiểm tra**: lật thẻ tự chấm · trắc nghiệm 4 đáp án · gõ đáp án trên trang
- **Bốn chiều học** cho thẻ từ vựng: Việt → Trung, Trung → Việt, Pinyin → Hán tự, hoặc trộn
- **Lịch ôn giãn dần** (SM-2 rút gọn): thẻ quên quay lại ngay, thẻ thuộc giãn ra
  1 → 3 → 7 ngày rồi xa hơn
- **Chấm khoan dung**: bỏ qua hoa thường, dấu thanh pinyin và dấu tiếng Việt;
  đáp án chữ Hán nhận cả pinyin, nên gõ được trên bàn phím thường; tên viết tắt
  tổ chức (WTO, IMF, DSU…) cũng được chấp nhận
- Tra cứu toàn bộ, đánh dấu thẻ khó, phát âm chữ Hán, chạy offline sau lần mở đầu

## Cấu trúc

```
Biên du lịch.xlsx          nguồn môn 1 — sửa từ vựng ở đây
Phiên dịch nâng cao.xlsx   nguồn môn 2
中国的古代历史 - 更新.pptx     slide gốc môn 3 (chỉ để tham khảo, không build từ đây)
tools/
  build_data.py            nguồn  →  docs/data/vocab.{json,js} + build_report.md
  overrides.json           các sửa tay không suy ra được từ file gốc
  lich-su/*.json           bộ câu hỏi môn Lịch sử — sửa câu hỏi ở đây
build_report.md            báo cáo mọi thay đổi script đã áp lên dữ liệu
docs/                      trang web tĩnh, GitHub Pages phục vụ thẳng từ đây
```

## Cập nhật từ vựng

Sửa trong file Excel tương ứng, rồi chạy **một lệnh cho cả hai môn**:

```bash
pip install -r tools/requirements.txt
python tools/build_data.py
```

Script không bao giờ ghi vào file Excel. Mọi thay đổi nó áp lên dữ liệu đều được
liệt kê trong `build_report.md` — đọc file đó để rà lại, nhất là mục *pinyin sinh
tự động* và *dòng lệch số phần*.

Muốn sửa một mục mà không đụng Excel thì thêm luật vào `tools/overrides.json`.

Sau khi build, commit và push — GitHub Pages tự cập nhật.

### Script xử lý gì

**Môn Biên du lịch** (dữ liệu gốc nhiều lỗi): tách 11 dòng bị gộp chung tiếng Việt
và chữ Hán trong một ô, gộp 20 nhóm thẻ trùng, sinh 75 pinyin còn thiếu.

**Môn Lịch sử**: câu hỏi không trích máy móc từ slide được nên được soạn tay thành
8 file JSON trong `tools/lich-su/`, mỗi file một giai đoạn. Muốn thêm hay sửa câu
hỏi thì sửa thẳng file JSON rồi chạy lại script — **không sửa file pptx**.

**Môn Phiên dịch nâng cao** (dữ liệu đã sàng lọc sẵn): đọc 11 sheet đã phân loại,
giữ nhóm con làm nhãn, và phân biệt hai nghĩa của dấu `/`:

- số phần chữ Hán **bằng** số phần tiếng Việt → liệt kê song song, **tách thành
  nhiều thẻ** (`贸易顺差 / 贸易赤字` thành hai thẻ thặng dư và thâm hụt riêng biệt,
  vì gộp lại sẽ chấm đúng cho đáp án của phần kia)
- các trường hợp khác → cách nói đồng nghĩa, phần sau thành đáp án phụ

## Kiểm tra giao diện

```bash
pip install playwright && python -m playwright install chromium
python -m http.server 8787 --directory docs

python tools/ui-check/screenshot.py http://localhost:8787 shots
python tools/ui-check/contrast.py   http://localhost:8787
```

Chụp 6 màn hình × 3 kích cỡ × 2 giao diện sáng tối, đồng thời bắt vùng bấm nhỏ
hơn 44px, cuộn ngang, lỗi JavaScript và chữ không đủ tương phản. Xem
[tools/ui-check/README.md](tools/ui-check/README.md).

## Chạy thử tại máy

```bash
python -m http.server 8000 --directory docs
```

Rồi mở http://localhost:8000.

## Bật GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → branch `main`, thư mục `/docs`.
