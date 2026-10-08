# Kiểm tra giao diện

Hai script dùng Playwright để kiểm những thứ không nhìn bằng mắt thường được,
và để chụp lại giao diện ở nhiều kích cỡ màn hình.

## Cài một lần

```bash
pip install playwright
python -m playwright install chromium
```

## Dùng

Mở server rồi chạy:

```bash
python -m http.server 8787 --directory docs

python tools/ui-check/screenshot.py http://localhost:8787 shots
python tools/ui-check/contrast.py   http://localhost:8787
```

`screenshot.py` chụp 6 màn hình × 3 kích cỡ (điện thoại 375, iPad 820, máy tính
1440) × 2 giao diện sáng tối, đồng thời báo:

- vùng bấm nhỏ hơn 44×44px (ngón tay bấm dễ trượt trên điện thoại)
- trang bị cuộn ngang, kèm tên phần tử gây ra
- lỗi JavaScript và lỗi console

`contrast.py` đo tỉ lệ tương phản chữ trên nền thật sau khi render, cả hai giao
diện, yêu cầu 4.5:1 cho chữ thường và 3:1 cho chữ lớn.

Chạy lại hai script này sau mỗi lần sửa CSS.
