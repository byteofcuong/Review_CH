# Báo cáo build dữ liệu

Ngày build: 2026-10-11

| Môn | Nguồn | Dòng đọc | Thẻ | Gộp | Tách cặp | Pinyin tự sinh |
|---|---|---|---|---|---|---|
| Biên du lịch | `Biên du lịch.xlsx` | 224 | 203 | 20 | 0 | 75 |
| Phiên dịch nâng cao | `Phiên dịch nâng cao.xlsx` | 577 | 577 | 0 | 36 | 2 |
| Lịch sử phong kiến Trung Quốc | `中国的古代历史 - 更新.pptx` | 272 | 272 | 0 | 0 | 0 |
| Đề cương lịch sử | `source/lịch sử - thầy/*.xlsx` | 265 | 265 | 0 | 0 | 0 |

Hai file Excel gốc không bị ghi vào. Chạy lại bất cứ lúc nào bằng
`python tools/build_data.py`.

---

# Biên du lịch

Nguồn: `Biên du lịch.xlsx` · 203 thẻ

- Địa danh & Di sản Việt Nam: 97 thẻ
- Từ vựng ngành du lịch: 60 thẻ
- Danh thắng Trung Quốc: 33 thẻ
- Cụm từ & thành ngữ: 13 thẻ

## 1. Dòng hỏng đã tách lại

Các ô gộp chung tiếng Việt và chữ Hán, tách theo dấu `—`:

| Dòng | Nội dung gốc | Tiếng Việt | Chữ Hán |
|---|---|---|---|
| Địa danh!108 | Điện Biên Phủ — 奠边府 | Điện Biên Phủ | 奠边府 |
| Địa danh!109 | Côn Sơn – Kiếp Bạc — 昆山 – 劫泊 | Côn Sơn – Kiếp Bạc | 昆山 – 劫泊 |
| Địa danh!110 | Côn Đảo — 昆岛 | Côn Đảo | 昆岛 |
| Địa danh!111 | Tràng An – Tam Cốc – Bích Động — 长安 – 三谷 – 碧洞 | Tràng An – Tam Cốc – Bích Động | 长安 – 三谷 – 碧洞 |
| Địa danh!112 | Phong Nha – Kẻ Bàng — 峰衍 – 己榜 | Phong Nha – Kẻ Bàng | 峰衍 – 己榜 |
| Địa danh!113 | động Hương Tích — 香迹洞 | động Hương Tích | 香迹洞 |
| Địa danh!114 | Nghệ An — 乂安 | Nghệ An | 乂安 |
| Địa danh!115 | Đồ Sơn — 涂山 | Đồ Sơn | 涂山 |
| Địa danh!116 | Sầm Sơn — 岑山 | Sầm Sơn | 岑山 |
| Địa danh!117 | Cửa Lò — 炉门 | Cửa Lò | 炉门 |
| Địa danh!118 | Khu Dự trữ sinh quyển Langbiang — 朗比昂 | Khu Dự trữ sinh quyển Langbiang | 朗比昂 |

## 2. Sửa tay (tools/overrides.json)

- **Trang tính4 dòng 11** (preMerge)
  - Trước: ` | 新中国 | `
  - Sau: `Trung Quốc mới (chỉ nước CHND Trung Hoa từ 1949) | 新中国 | Xīn Zhōngguó`
  - Lý do: Dòng gốc thiếu hoàn toàn nghĩa tiếng Việt cho 新中国.
- **Địa danh dòng 119** (preMerge)
  - Trước: `Cù Lao Chamf |  | `
  - Sau: `Cù Lao Chàm | 占婆岛 | Zhànpó Dǎo`
  - Lý do: Gốc ghi sai chính tả 'Cù Lao Chamf' và thiếu chữ Hán. Lấy chữ Hán + pinyin từ dòng 70 cùng sheet; sau bước gộp hai dòng này nhập làm một.
- **thẻ 'Phong Nha – Kẻ Bàng'** (postMerge)
  - Trước: `风牙—者榜`
  - Sau: `峰牙—己榜`
  - Lý do: Ba biến thể chữ Hán mâu thuẫn nhau giữa các dòng 24, 65 và 112.
- **thẻ 'Pác Bó'** (postMerge)
  - Trước: `巴克博`
  - Sau: `巴克博`
  - Lý do: Dòng 6 dùng 北坡, dòng 34 dùng 巴克博 — khác hẳn nhau về cách dịch chứ không phải lỗi gõ.
- **thẻ 'Nghệ An'** (postMerge)
  - Trước: `乂安`
  - Sau: `义安`
  - Lý do: Dòng 114 dùng 乂安 trong khi phần còn lại của file dùng 义安.

## 3. Chữ Hán mâu thuẫn giữa các dòng trùng nhau

Giữ bản chuẩn; các biến thể còn lại vẫn được chấp nhận khi chấm điểm:

| Thẻ | Bản giữ | Biến thể | Dòng gốc |
|---|---|---|---|
| Pác Bó | 巴克博 | 北坡 | Địa danh!34, Địa danh!6 |
| Côn Sơn – Kiếp Bạc | 昆山—劫泊 | 昆山 – 劫泊 | Địa danh!12, Địa danh!109 |
| Tràng An – Tam Cốc – Bích Động | 长安—三谷—碧洞 | 长安 – 三谷 – 碧洞 | Địa danh!22, Địa danh!111 |
| Phong Nha – Kẻ Bàng | 峰牙—己榜 | 峰衍 – 己榜 | Địa danh!65, Địa danh!112 |

## 4. Nhóm trùng lặp đã gộp

| Thẻ | Dòng gốc |
|---|---|
| Pác Bó | Địa danh!34, Địa danh!6 |
| Hoàng thành Thăng Long | Địa danh!8, Địa danh!54 |
| Điện Biên Phủ | Địa danh!11, Địa danh!108 |
| Côn Sơn – Kiếp Bạc | Địa danh!12, Địa danh!109 |
| Côn Đảo | Địa danh!18, Địa danh!110 |
| Cố đô Huế | Địa danh!19, Địa danh!61 |
| Thành nhà Hồ | Địa danh!20, Địa danh!60 |
| Thánh địa Mỹ Sơn | Địa danh!21, Địa danh!64 |
| Tràng An – Tam Cốc – Bích Động | Địa danh!22, Địa danh!111 |
| Vịnh Hạ Long | Địa danh!37, Địa danh!25, Địa danh!62 |
| Động Hương Tích | Địa danh!31, Địa danh!113 |
| Tràng An | Địa danh!32, Địa danh!59 |
| Hà Nội | Địa danh!53, Địa danh!89 |
| Kéo co | Địa danh!57, Địa danh!83 |
| Phong Nha – Kẻ Bàng | Địa danh!65, Địa danh!112 |
| Cù Lao Chàm | Địa danh!70, Địa danh!119 |
| Sa Pa | Địa danh!103, Địa danh!86 |
| Đồ Sơn | Địa danh!104, Địa danh!115 |
| Sầm Sơn | Địa danh!106, Địa danh!116 |
| Cửa Lò | Địa danh!107, Địa danh!117 |

## 5. Pinyin sinh tự động — cần rà lại

Pinyin dưới đây do `pypinyin` sinh, chưa qua kiểm chứng. Trên web chúng
hiển thị kèm dấu nhắc. Muốn sửa: bổ sung pinyin vào Excel rồi chạy lại script.

| Tiếng Việt | Chữ Hán | Pinyin tự sinh |
|---|---|---|
| ATK Thái Nguyên | 太原安全区 | Tàiyuán'ānquánqū |
| Nghệ An | 义安 | Yì'ān |
| Khu Dự trữ sinh quyển Langbiang | 朗比昂 | Lǎngbǐ'áng |
| khách du lịch | 游客 | yóukè |
| Sở du lịch | 旅游局 | lǚyóujú |
| lịch trình | 行程 | xíngchéng |
| du lịch biển | 海洋旅游 | hǎiyánglǚyóu |
| du lịch ẩm thực | 美食旅游 | měishílǚyóu |
| khách sạn 5 sao | 5星级酒店 | 5 xīngjíjiǔdiàn |
| khu nghỉ dưỡng | 度假村 | dùjiàcūn |
| lễ tân | 前台 | qiántái |
| phòng đơn | 单人间 | dānrénjiān |
| đền | 祠 | cí |
| miếu | 庙 | miào |
| vịnh | 湾 | wān |
| đèo | 山口 | shānkǒu |
| làng nghề | 传统手工艺村 | chuántǒngshǒugōngyìcūn |
| thị trấn | 镇 | zhèn |
| chè | 茶 | chá |
| chèo thuyền kayak | 划皮划艇 | huàpíhuátǐng |
| lặn biển | 潜水 | qiánshuǐ |
| chụp ảnh check-in | 拍照打卡 | pāizhàodǎkǎ |
| thị thực | 签证 | qiānzhèng |
| công ty du lịch | 旅行社 | lǚxíngshè |
| hạ tầng du lịch | 旅游基础设施 | lǚyóujīchǔshèshī |
| tuyến | 线路 | xiànlù |
| du lịch đại chúng | 大众旅游 | dàzhònglǚyóu |
| du lịch tâm linh | 宗教旅行 | zōngjiàolǚxíng |
| nhà nghỉ | 旅馆 | lǚguǎn |
| khu nghỉ mát | 避暑胜地 | bìshǔshèngdì |
| nhận phòng | 办理入住 | bànlǐrùzhù |
| phòng tiêu chuẩn | 标准间 | biāozhǔnjiān |
| chùa | 寺 | sì |
| lăng | 陵 | líng |
| hang động | 洞 | dòng |
| bản | 村寨 | cūnzhài |
| làng cổ | 古村 | gǔcūn |
| thị xã | 市社 | shìshè |
| nem | 春卷 | chūnjuǎn |
| dù lượn | 滑翔伞 | huáxiángsǎn |
| tắm bùn | 泥浴 | níyù |
| cắm trại | 露营 | lùyíng |
| giấy thông hành | 通行证 | tōngxíngzhèng |
| đại lý du lịch | 旅游代理商 | lǚyóudàilǐshāng |
| quảng bá du lịch | 旅游推广 | lǚyóutuīguǎng |
| điểm tham quan | 旅游景点 | lǚyóujǐngdiǎn |
| du lịch bền vững | 可持续旅游 | kěchíxùlǚyóu |
| du lịch cộng đồng | 社区旅游 | shèqūlǚyóu |
| homestay | 民宿 | mínsù |
| khu vui chơi | 游乐园 | yóulèyuán |
| trả phòng | 办理退房 | bànlǐtuìfáng |
| phòng cao cấp | 豪华间 | háohuájiān |
| đình | 亭 | tíng |
| phủ | 府 | fǔ |
| phố cổ | 古街 | gǔjiē |
| chợ đêm | 夜市 | yèshì |
| lễ hội | 庙会 | miàohuì |
| phường | 坊 | fāng |
| cốm | 扁米 | biǎnmǐ |
| cáp treo | 缆车 | lǎnchē |
| xông hơi | 桑拿 | sāngná |
| trekking | 徒步旅行 | túbùlǚxíng |
| visa cửa khẩu | 口岸签证 | kǒu'ànqiānzhèng |
| Huy Châu | 徽州 | huīzhōu |
| Vùng châu thổ Trường Giang | 长三角 | zhǎngsānjiǎo |
| Đầu mối giao thông thứ cấp khu vực Hoa Đông | 华东区域性次交通枢纽 | huádōngqūyùxìngcìjiāotōngshūniǔ |
| Hơn thế nữa còn được đưa vào | 更是 | gèngshì |
| "Tứ tuyệt": Thông kỳ, đá lạ, biển mây, suối nước nóng | 奇松，怪石，云海，温泉“四绝” | qísōng， guàishí， yúnhǎi， wēnquán“ sìjué” |
| Quận Quế Lâm | 桂林郡 | guìlínjùn |
| Kênh đào Linh Cừ | 灵渠 | língqú |
| sông Tương và sông Ly | 湘江, 漓江 | xiāngjiāng, líjiāng |
| Phía nam thông ra biển, phía bắc đến Trung Nguyên | 南通海域，北达中原的重镇 | nántōnghǎiyù， běidázhōngyuándezhòngzhèn |
| Được mệnh danh là "Tây Nam hội phủ" | 号称“西南会府” | hàochēng“ xīnánhuìfǔ” |
| Khắc đá và chữ trên vách đá | 石刻和壁书 | shíkèhébìshū |
| "Dạo núi như đọc sử, ngắm núi như xem tranh" | “游山如读史，看山如观画” | “ yóushānrúdúshǐ， kànshānrúguānhuà” |

## 6. Ghi chú mang từ Excel sang

Hiển thị ở mặt sau thẻ khi học:

| Thẻ | Ghi chú |
|---|---|
| 巴克博 | Hai lối dịch song song: 巴克博 phiên âm tên Tày, 北坡 dịch nghĩa. Cả hai đều được chấp nhận khi kiểm tra. |
| 峰牙—己榜 | Chữ Hán có 3 biến thể trong file gốc; chọn 峰牙—己榜 cho khớp với mục 'Vườn quốc gia Phong Nha – Kẻ Bàng'. |
| 义安 | Cả 义安 và 乂安 đều dùng cho Nghệ An; file thiên về 义安 (xem 'Tây Nghệ An', 'Cửa Lò'). |

---

# Phiên dịch nâng cao

Nguồn: `Phiên dịch nâng cao.xlsx` · 577 thẻ

- Tổ chức, Cơ quan và Hiệp định: 31 thẻ
- Khái niệm và Nguyên tắc thương mại: 51 thẻ
- Xung đột thương mại và Tác động: 45 thẻ
- Thuế quan, Trừng phạt và Trả đũa: 41 thẻ
- Phòng vệ thương mại: 80 thẻ
- Đàm phán và Hòa giải: 43 thẻ
- Giải quyết tranh chấp tại WTO: 89 thẻ
- Trọng tài, Tố tụng và Hợp đồng: 68 thẻ
- Hàng hóa và Ngành: 33 thẻ
- Ngôn ngữ ngoại giao và Cấu trúc câu: 64 thẻ
- Khác: 32 thẻ

## 1. Dòng liệt kê song song đã tách thành nhiều thẻ

Số phần chữ Hán bằng số phần tiếng Việt, nên đây là liệt kê song
song chứ không phải cách nói đồng nghĩa. Gộp làm một thẻ sẽ chấm
đúng cho đáp án của phần khác (gõ *thâm hụt* vào thẻ 贸易顺差),
nên mỗi phần thành một thẻ riêng, ghép theo vị trí.

| Dòng | Chữ Hán gốc | Tiếng Việt gốc | Số thẻ | Pinyin cắt được |
|---|---|---|---|---|
| 2. Khái niệm & Nguyên tắc!2 | 最惠国待遇（MFN）/ 国民待遇原则（NT） | Đối xử tối huệ quốc (MFN) / Nguyên tắc đối xử quốc gia (NT) | 2 | có |
| 2. Khái niệm & Nguyên tắc!6 | 善意履行条约 / 善意履约义务 | Thực thi điều ước một cách thiện chí / nghĩa vụ thực hiện thiện chí | 2 | có |
| 2. Khái niệm & Nguyên tắc!10 | 贸易保护主义 / 单边主义 | Chủ nghĩa bảo hộ thương mại / Chủ nghĩa đơn phương | 2 | có |
| 2. Khái niệm & Nguyên tắc!11 | 自由贸易 / 多边体制 | Tự do thương mại / Thể chế đa phương | 2 | có |
| 2. Khái niệm & Nguyên tắc!27 | 增值税 / 特别消费税 / 房地产税 | Thuế giá trị gia tăng / thuế tiêu thụ đặc biệt / thuế bất động sản (nhà đất) | 3 | có |
| 2. Khái niệm & Nguyên tắc!34 | 贸易顺差 / 贸易赤字 | Thặng dư thương mại / Thâm hụt thương mại | 2 | có |
| 2. Khái niệm & Nguyên tắc!40 | 供应链中断 / 供应链断裂 / 扰乱（全球）供应链 | Gián đoạn / đứt gãy / làm rối loạn chuỗi cung ứng (toàn cầu) | 3 | có |
| 3. Xung đột & Tác động!21 | 市场扭曲 / 扭曲市场竞争 | Bóp méo thị trường / làm méo mó cạnh tranh | 2 | có |
| 3. Xung đột & Tác động!38 | 连锁反应 / 对……带来连锁反应 | Phản ứng dây chuyền / tạo ra phản ứng dây chuyền đối với … | 2 | có |
| 4. Thuế quan, Trừng phạt!7 | 取消对……（产品）的关税 / 取消对……征税 | Hủy bỏ / chấm dứt áp thuế đối với (mặt hàng) … | 2 | có |
| 4. Thuế quan, Trừng phạt!13 | 将……税率适用 / 套用于…… | Áp dụng / áp thẳng mức thuế … cho … | 2 | có |
| 5. Phòng vệ thương mại!2 | 倾销 / 反倾销 | Bán phá giá / chống bán phá giá | 2 | có |
| 5. Phòng vệ thương mại!3 | 补贴 / 反补贴 | Trợ cấp (trợ giá) / chống trợ cấp (chống trợ giá) | 2 | có |
| 5. Phòng vệ thương mại!11 | 规避……税 / 规避关税壁垒 | Lẩn tránh thuế … / lách rào cản thuế quan | 2 | **không** — sinh lại |
| 5. Phòng vệ thương mại!31 | 涉案产品 / 涉案问题 | Sản phẩm / vấn đề liên quan đến vụ việc | 2 | có |
| 5. Phòng vệ thương mại!33 | 磋商 / 参与中国光伏产品反倾销调查 | Tham vấn / tham gia điều tra chống bán phá giá đối với sản phẩm quang điện của Trung Quốc | 2 | có |
| 5. Phòng vệ thương mại!34 | 就……对……产品反倾销立案调查进行沟通与磋商 / 对话 | Trao đổi và tham vấn / đối thoại về việc … khởi xướng điều tra chống bán phá giá đối với sản phẩm … | 2 | có |
| 5. Phòng vệ thương mại!40 | 经调查认定 / 确定……存在……行为 | Qua điều tra nhận định / xác định …tồn tại hành vi | 2 | có |
| 5. Phòng vệ thương mại!41 | 对……造成实质性损害 / 威胁 | Gây thiệt hại thực chất / đe dọa cho | 2 | có |
| 5. Phòng vệ thương mại!53 | 决定 / 裁定对……征收……%的反倾销税 | Quyết định / phán quyết đánh thuế chống bán phá giá…% đối với | 2 | có |
| 5. Phòng vệ thương mại!54 | 对……产品实施反倾销 / 反补贴措施 | Áp dụng biện pháp chống bán phá giá / chống trợ cấp đối với sản phẩm … | 2 | có |
| 6. Đàm phán & Hòa giải!13 | 缩小 / 弥合 / 消除分歧 | Thu hẹp / hàn gắn / loại bỏ bất đồng | 3 | có |
| 6. Đàm phán & Hòa giải!22 | 缓解……紧张 / 关系 | Giúp hạ nhiệt / làm dịu căng thẳng | 2 | có |
| 6. Đàm phán & Hòa giải!33 | 遵守 / 信守……承诺 | Tuân thủ / giữ đúng cam kết … | 2 | có |
| 7. Giải quyết tranh chấp WTO!15 | 违反……规则 / 违规 | Vi phạm quy tắc… / vi phạm quy định | 2 | có |
| 7. Giải quyết tranh chấp WTO!54 | 上诉 / 提出上诉 | Kháng cáo / đưa ra kháng cáo | 2 | có |
| 7. Giải quyết tranh chấp WTO!73 | 要求 A 调整 / 修正其与世贸组织规则不符的立法与做法 | Yêu cầu A điều chỉnh / sửa đổi luật pháp và quy định không phù hợp với quy tắc của WTO | 2 | có |
| 8. Trọng tài, Tố tụng, Hợp đồng!16 | 外国仲裁机构 / 组织 / 委员会 | Cơ quan / tổ chức / ủy ban trọng tài nước ngoài | 3 | có |
| 8. Trọng tài, Tố tụng, Hợp đồng!29 | 源于……的纠纷 / 因……引起的争议 | Tranh chấp bắt nguồn từ … / phát sinh do … | 2 | có |
| 8. Trọng tài, Tố tụng, Hợp đồng!57 | 盈利目的 / 谋取利润的目的 | Mục đích sinh lợi / tìm kiếm lợi nhuận | 2 | có |
| 9. Hàng hóa & Ngành!2 | 查鱼 / 巴沙鱼 | Cá tra / cá ba sa | 2 | có |
| 9. Hàng hóa & Ngành!30 | 输华商品 / 输美货物 / 输B商品 | Hàng hóa xuất khẩu sang Trung Quốc / sang Mỹ / sang nước B | 3 | có |
| 10. Ngoại giao & Cấu trúc câu!19 | 反驳 / 承认 / 辩护 / 申诉 / 指控（控告） | Phản bác / thừa nhận / biện hộ / khiếu nại / cáo buộc (tố cáo) | 5 | có |
| 10. Ngoại giao & Cấu trúc câu!29 | 以……为由 / 借……之名 | Với lý do… / Nhân danh… | 2 | có |
| 10. Ngoại giao & Cấu trúc câu!45 | 处理 / 干涉 / 解决 | Xử lý / can thiệp / giải quyết | 3 | có |
| 11. Khác!16 | 含金量 / 知名度 / 影响力 | Giá trị thực / mức độ nổi tiếng / tầm ảnh hưởng | 3 | có |

## 2. Dòng lệch số phần — giữ làm một thẻ, cần rà lại

Số phần chữ Hán và tiếng Việt không bằng nhau nên không ghép theo
vị trí được. Các phần sau dấu `/` được nhận làm đáp án phụ. Nếu đây
thực ra là những khái niệm khác nhau thì nên tách dòng trong Excel.

| Dòng | Chữ Hán | Tiếng Việt | Phần Hán / phần Việt |
|---|---|---|---|
| 4. Thuế quan, Trừng phạt!25 | 贸易报复 / 贸易报复措施 / 报复措施 | Trả đũa thương mại / biện pháp trả đũa (thương mại) | 3 / 2 |
| 5. Phòng vệ thương mại!36 | 初裁 / 初步裁决 / 宣布初步裁定结果 | Phán quyết sơ bộ / công bố kết quả phán quyết sơ bộ | 3 / 2 |
| 10. Ngoại giao & Cấu trúc câu!40 | 采取 / 收回……措施 / 行动 | Áp dụng / thu hồi biện pháp, hành động … | 3 / 2 |

## 3. Pinyin sinh tự động — cần rà lại

Pinyin dưới đây do `pypinyin` sinh, chưa qua kiểm chứng. Trên web chúng
hiển thị kèm dấu nhắc. Muốn sửa: bổ sung pinyin vào Excel rồi chạy lại script.

| Tiếng Việt | Chữ Hán | Pinyin tự sinh |
|---|---|---|
| Lẩn tránh thuế … | 规避……税 | guībì …… shuì |
| lách rào cản thuế quan | 规避关税壁垒 | guībìguānshuìbìlěi |

## 4. Ghi chú mang từ Excel sang

Hiển thị ở mặt sau thẻ khi học:

| Thẻ | Ghi chú |
|---|---|
| 打着……旗号 | VD: 中国货打着越南制造的旗号 – hàng TQ núp danh nghĩa “Made in Vietnam” |
| 另类国家 | 替代国 (nước thay thế) |
| 对……产品实施反倾销 | A针对原产于B的产品实施的反倾销反补贴措施; 针对……出口产品采取反倾销措施 |
| 反补贴措施 | A针对原产于B的产品实施的反倾销反补贴措施; 针对……出口产品采取反倾销措施 |
| 共识性否决 | 反向协商一致 (đồng thuận nghịch/ Nguyên tắc đồng thuận ngược) |
| 随即 | VD: 中国随即以“以牙还牙”的方式反击 – TQ lập tức đáp trả kiểu “ăn miếng trả miếng” |

---

# Lịch sử phong kiến Trung Quốc

Nguồn: `中国的古代历史 - 更新.pptx` · 272 thẻ

- Xã hội nguyên thủy: 17 thẻ
- Hạ, Thương, Tây Chu: 30 thẻ
- Xuân Thu, Chiến Quốc: 53 thẻ
- Tần, Hán: 43 thẻ
- Tam Quốc, Lưỡng Tấn, Nam Bắc triều: 38 thẻ
- Tùy, Đường: 40 thẻ
- Ngũ Đại, Tống, Nguyên: 31 thẻ
- Minh, Thanh: 20 thẻ

## 1. Pinyin sinh tự động — cần rà lại

Pinyin dưới đây do `pypinyin` sinh, chưa qua kiểm chứng. Trên web chúng
hiển thị kèm dấu nhắc. Muốn sửa: bổ sung pinyin vào Excel rồi chạy lại script.

_Không có — file gốc đã đủ pinyin._

---

# Đề cương lịch sử

Nguồn: `source/lịch sử - thầy/*.xlsx` · 265 thẻ

- Nguyên thuỷ – Thương: 40 thẻ
- Xuân Thu – Chiến Quốc: 45 thẻ
- Tần – Hán: 35 thẻ
- Tam Quốc – Đường: 40 thẻ
- Ngũ Đại – Thanh: 21 thẻ
- Cận đại: 48 thẻ
- Hiện đại & đương đại: 36 thẻ

## 1. Pinyin sinh tự động — cần rà lại

Pinyin dưới đây do `pypinyin` sinh, chưa qua kiểm chứng. Trên web chúng
hiển thị kèm dấu nhắc. Muốn sửa: bổ sung pinyin vào Excel rồi chạy lại script.

_Không có — file gốc đã đủ pinyin._

## 2. Ghi chú mang từ Excel sang

Hiển thị ở mặt sau thẻ khi học:

| Thẻ | Ghi chú |
|---|---|
| 陕西省西安市亲厚有多少个朝代？ | Chưa chắc, nên hỏi lại thầy. Tây An thường được gọi là 十三朝古都 (13 triều). Đề không có phương án 13 nên chọn số lớn nhất. Nên hỏi lại thầy. |
| 最能划分中国南北的是： | Ranh giới Nam–Bắc là tuyến Tần Lĩnh – Hoài Hà. |
| 中国奴隶社会大概在哪个阶段？ | Bài giảng: 奴隶社会(约前2070——前476). |
| 达尔文所提出的“进化论”是在： | Darwin ra 物种起源 năm 1859. |
| 大约四五十万年前，在周口店地区出土： | Bài giảng: 大约四五十万年以前北京猿人出现于北京周口店. |
| 考古学家发现中国时代最早的直立人遗迹是在： | Bài giảng: 云南 元谋人, 陕西 蓝田人. |
| 根据司马迁的想法，下面哪一位不属于“三皇五帝”系统： | Bài giảng liệt kê 黄帝、颛顼、帝喾、帝尧、帝舜 — không có 帝莱. |
| 夏朝存在多长时间？ | Bài giảng: 从禹开始到桀死亡，历时470年. |
| 夏朝的传位制度是： | Bài giảng: 禅让制 -> 世袭制 -> 家天下. |
| 夏中兴是谁的阶段？ | Bài giảng: 少康（中兴）. |
| 谁建立商朝： | Bài giảng: 成汤：建立商朝. |
| 史称“二帝三王”是指： | Phả hệ Thượng Thư: nhị đế = Nghiêu Thuấn, tam vương = Hạ Vũ, Thương Thang, Chu Văn Vương. Một số sách tính cả Chu Vũ Vương. |
| 商朝的统治时间是： | Bài giảng: 经过了554年. |
| 商朝的文明鼎盛时期是在： | Bài giảng: 在第十三代国王武丁时，商的国力到达极盛. |
| 中国原始人原始人类经历了母系民族社会（以仰韶文化为代表）和父系民族社会（以龙山文化为代表） | Bài giảng nguyên văn. |
| 汉字从甲骨文发展到今天的现代汉字，有一段时间被消失过 | Bài giảng: 汉字…一直在使用 — chữ Hán chưa từng biến mất. |
| 中国文化的延续性不太强。 | Tính liên tục của văn hoá Trung Quốc rất mạnh. |
| 长江中下游是中华文明的发源地 | Cái nôi là trung hạ du Hoàng Hà, không phải Trường Giang. |
| 河南的安阳就是发现甲骨文的地方，也是中国商代的都城 | An Dương (Ân Khư) là nơi tìm ra giáp cốt văn và là đô thành nhà Thương. |
| 周、秦、汉、隋、唐等朝代都定都于今陕西省西安市或其周边 | Bài giảng: 镐京(西安附近), 咸阳（今西安）, 长安（今西安）. |
| 封建社会的阶段大概是在前475至公元1840 | Khớp phương án C của trắc nghiệm câu 5: 前475—公元1840. |
| 原始人类发展了农业、畜牧业之后，出现了私有财产、阶级分化和阶级对立，原始社会因而解体，奴隶社会诞生 | Bài giảng nguyên văn. |
| 龙山文化是中国古代父系的代表 | Bài giảng: 父系…以龙山文化为代表. |
| 楚辞与史记对三皇五帝的说法是相同的 | Các thuyết về tam hoàng ngũ đế khác nhau giữa các sách. |
| 涿鹿是传说中的黄帝与神农的战争地 | Trận Trác Lộc là Hoàng Đế đánh Xuy Vưu, không phải Thần Nông. |
| 蚩尤是中国人的祖先 | Bài giảng dùng 炎黄子孙: tổ tiên là Viêm Đế và Hoàng Đế. |
| 夏朝从禹开始到桀死亡 | Bài giảng: 从禹开始到桀死亡. |
| 夏朝已开始开水道来引水和排水，可是当时农业没有发达，还没有出现日历 | Bài giảng: 当时适合农业的-日历已经出现，就是…夏历. |
| 夏朝从鲧禹开始到桀死亡 | Bài giảng tính từ Vũ, không phải từ Cổn. |
| 鲧只能做水坝，而禹就会挖运河。 | Cổn đắp đê nên thất bại; Vũ khơi dòng dẫn nước nên thành công. |
| 纣王本来不姓纣 | Trụ Vương họ Tử (子受/帝辛); 纣 là tên gọi xấu đặt sau khi chết. |
| 周王朝存在了多少年？ | Bài giảng: 周前后持续800多年. |
| 西周的京都在哪个地方？ | Bài giảng: 最初定都镐京. |
| 东周的京都在哪个地方？ | Bài giảng: 东迁洛邑. |
| “太公望”是谁的别称？ | Bài giảng: 姜子牙太公望. |
| “愿者上钩”是姜太公与谁的故事？ | Điển 姜太公钓鱼，愿者上钩: Khương Tử Nha chờ Chu Văn Vương. |
| “三监之乱”属于中国封建的哪一阶段？ | Tam giám chi loạn xảy ra thời Chu Thành Vương, thuộc Thành Khang chi trị. |
| 西周被灭亡的时间是： | Bài giảng: 公元前770年，西周灭亡. |
| 齐桓公以何言为旗号，九合诸侯？ | Bài giảng: 以 尊王攘夷 为旗号，九合诸侯. |
| 在城濮之战以少胜多，大败楚军，战后召集齐、宋等国于践土会盟，被周襄王策命为诸侯之伯，成为春秋时代的第二位霸主是： | Bài giảng: 晋文公五年（前632年），在城濮之战以少胜多. |
| 夫差继承王位后，励精图治，任用谁来整顿军队，大败越王勾践，一度使吴国达到了鼎盛时期？ | Bài giảng: 夫差继承王位后…任用伍子胥等人. |
| 成语”卧薪尝胆“是指谁的？ | Bài giảng: 勾践返国后…卧薪尝胆. |
| 战国四公子广招宾客，以扩大自己的势力，因此养“士”之风盛行，其中的宾客包括： | Bài giảng nguyên văn: 包括学士、方士、策士或术士以及食客. |
| 战国齐国的“四公子”之一是： | Bài giảng: 齐国的孟尝君田文. |
| 传说中，苏秦、张仪、孙膑、庞涓最可能是谁的弟子？ | Bài giảng: 鬼谷子…开创了纵横学. |
| ”远交近攻“是谁的策略？ | Phạm Thư dâng kế viễn giao cận công cho Tần Chiêu Vương. |
| “长平之战”最后得胜的统帅是： | Trận Trường Bình 260 TCN, Tần thắng, tướng là Bạch Khởi. |
| 军功爵制、重农抑商、连坐法是哪个政策的核心？ | Bài giảng: 军功爵制 và 什五连坐法 đều thuộc 商鞅变法. |
| “兼爱、非攻、尚贤”是谁的主张？ | Bài giảng: 墨家…兼爱、非攻、尚贤. |
| 西周王朝建立了一套严密的宗法、礼乐、刑罚制度，管理社会，让当时国的奴隶社会达到了顶峰。 | Bài giảng nguyên văn. |
| 周武王去世后， 成王继位， 成王年少， 由他的叔叔周公摄政 | Bài giảng nguyên văn. |
| 周公以宗法制的血缘亲疏原则和上下尊卑的等级原则为基本指导思想， 建立了一整套严格的典章制度 | Bài giảng nguyên văn. |
| 公元前 841 年， 终于发生国人暴动， 朝政由诸侯共管，史称“共和行政” | Bài giảng nguyên văn: 公元前841年…朝政由诸侯共管，史称 共和行政. |
| 周王朝时的犬绒是现在内蒙古地区的民族 | Khuyển Nhung ở phía tây (Thiểm Tây – Cam Túc), không phải Nội Mông. |
| 东周分为春秋（前770-前400）和战国（前400-前221） | Bài giảng: 春秋(前770—前476) — mốc chia là 476, không phải 400. |
| 越王勾践没有“春秋五霸”之称 | Bài giảng: Câu Tiễn 被周天子命为 伯，成为春秋时期最后一位霸主. |
| 齐桓公-春秋五霸之首，不是姜太公吕尚的后裔 | Bài giảng: 齐桓公…姜太公吕尚的第十二代孙. |
| 齐桓公文治武功卓著，是春秋时期的第一位霸主 | Bài giảng: 春秋五霸之首; Tấn Văn Công mới là bá chủ thứ hai. |
| 公元前606年，秦伐陆浑之戎，陈兵周疆，问鼎中原，有取周之意 | Bài giảng: 楚伐陆浑之戎 — là Sở, không phải Tần. |
| 越王勾践已经说过：蜚鸟尽，良弓藏；狡兔死，走狗烹 | Câu này là lời Phạm Lãi nói về Câu Tiễn, không phải Câu Tiễn nói ra. |
| 越王勾践被周天子命为“伯”，成为春秋时期最后一位霸主 | Bài giảng nguyên văn. |
| 公元前453年，韩、赵、秦三家瓜分了晋国，史称“三家分晋” | Tam gia phân Tấn là Hàn, Triệu, Ngụy — không có Tần. |
| 以养“士”著称的信陵君魏无忌、平原君赵胜、春申君黄歇、孟尝君田文。因其四人都是礼贤下士、结交宾客之人，后人称之为“战国四公子”，亦称战国四君 | Bài giảng nguyên văn. |
| 范雎，亦作范且，字叔。战国时楚国人 | Phạm Thư là người nước Ngụy, không phải nước Sở. |
| 秦国廉颇闻名天下于防守之战 | Liêm Pha là tướng nước Triệu, không phải nước Tần. |
| “宁为鸡口，无为牛后”是苏秦的想法 | Lời Tô Tần thuyết Hàn Vương. |
| 战国法家看重法制、礼仪，忽视共同利益与赏罚制度 | Pháp gia coi trọng pháp chế và thưởng phạt, gạt bỏ lễ nghi — mệnh đề nói ngược. |
| 秦始皇统一六国，定都于： | Bài giảng: 定都咸阳（今西安）. |
| 沙丘之变，秦始皇驾崩的年间是： | Bài giảng, dòng thời gian: 210 沙丘之变，秦始皇驾崩. |
| 陈胜吴广起义末期，秦将哪位将军率领由骊山徒隶组成的正规军大举反扑，击溃了缺乏作战经验的农民军？ | Chương Hàm chỉ huy quân dựng từ tù dịch Ly Sơn. |
| “文景之治”的开创者是哪位皇帝的时期？ | Người mở ra Văn Cảnh chi trị là Hán Văn Đế. |
| 中兴之主，使国家实力达到极盛，文治武功兼备是哪位汉朝皇帝的贡献？ | Hán Tuyên Đế — Tuyên Đế trung hưng. |
| 亲政后铲除外戚窦氏，此时蔡伦改进造纸术，东汉国力达到极盛，这是哪位皇帝的？ | Hán Hoà Đế; Thái Luân cải tiến giấy thời này. |
| 哪位皇帝被评为东汉末代皇帝，一生作为权臣傀儡，最终禅让于曹丕，汉朝正式灭亡？ | Bài giảng: 汉献帝…最终禅让于曹丕. |
| 秦朝重要的改变：郡县制、书同文、车同轨、统一货币与度量衡、确立了土地个人私有制度 | Bài giảng liệt kê đủ năm mục, gồm 确立了土地个人私有制度. |
| 从秦王朝建立到东汉结束，约440年，是中国封建社会巩固的时期 | Bài giảng nguyên văn: 约440年，是中国封建社会巩固的时期. |
| 引发出陈胜与吴广的起义是由项梁、项伯等人 | Khởi nghĩa do Trần Thắng và Ngô Quảng phát động, không liên quan Hạng Lương. |
| 公元前210年秦朝焚书坑儒，思想达到高度专制 | Bài giảng: 213 焚书坑儒; năm 210 là 沙丘之变. |
| 攻占陈县，建立“张楚”政权，迅速引发原六国地区的全面反秦浪潮是项羽军队所为 | Chiếm Trần Huyện, lập chính quyền Trương Sở là quân Trần Thắng. |
| 刘邦 出身豪族，知人善任，极具政治忍耐力，主张大一统 | Lưu Bang xuất thân nông dân thường, không phải hào tộc. |
| 楚汉交战时，因楚军精疲力竭，与汉军约定以红沟为界平分天下。 | Bài giảng tự viết 红沟: 约定以红沟为界平分天下 (sử gọi là 鸿沟). |
| 汉前期定都长安（今西安），又称西汉、前汉；后期定都洛阳，又称东汉、后汉 | Bài giảng nguyên văn. |
| “罢黜百家，独尊儒术”是汉武帝的建议 | Đó là đề nghị của Đổng Trọng Thư; Hán Vũ Đế là người chấp nhận. |
| 建立18国家藏书库，使文化事业得到很大的发展，杰出的史学家司马迁写下了中国第一部纪传体通史《史记》 | Bài giảng nguyên văn: 建立18国家藏书库…司马迁写下…史记. |
| 推行柔道治国，开启“光武中兴”，成为东汉开国皇帝的是汉明帝-刘庄 | Người mở Quang Vũ trung hưng là Hán Quang Vũ Đế Lưu Tú, không phải Hán Minh Đế Lưu Trang. |
| 到西汉时，中原地区在典章制度、语言文字、文化教育、风俗习惯等多方面都逐渐趋于统一，构成了共同的汉文化 | Bài giảng nguyên văn. |
| 谁夺取曹魏实权，奠定家族基础？ | Tư Mã Ý nắm thực quyền Tào Ngụy, đặt nền cho dòng họ. |
| 西晋灭吴，三国时代结束，全国实现统一是在哪一年？ | Bài giảng: 280年，西晋灭吴. |
| 哪一个国家建国一百多年， 是对南北朝历史影响很大的一个王朝？ | Bài giảng nguyên văn: 北魏建国一百多年，是对南北朝历史影响很大的一个王朝. |
| 隋炀帝最大的功劳之一是开凿了： | Bài giảng: 隋炀帝下令开凿了连接南北的大运河. |
| “三省六部制”是哪个朝代的典型制度改革？ | Bài giảng: 隋朝 建立了 三省六部制. |
| 唐朝通知时间为： | 通知 là lỗi gõ của 统治: nhà Đường 618–907, tức 289 năm. |
| “开元盛世”是指哪位皇帝的时期？ | Bài giảng: 唐玄宗前期年号 开元. |
| 874年到884年，唐朝出现了摧毁了关中经济，杀绝了门阀世族，帝国名存实亡的变故，这是： | Bài giảng: 黄巢起义（874-884）：摧毁了关中经济，杀绝了门阀世族. |
| 荀彧、郭嘉、贾诩、荀攸等人都是东吴作重要的人物。 | Tuân Úc, Quách Gia, Giả Hủ, Tuân Du đều là mưu sĩ của Tào Tháo. |
| 周瑜从关云长手中拿了荆州 | Kinh Châu không phải Chu Du lấy từ tay Quan Vũ. |
| 400年，司马睿在建康称帝 | Tư Mã Duệ xưng đế ở Kiến Khang năm 317, không phải năm 400. |
| 420-589年阶段是南方宋、齐、梁、陈与北方北魏、东魏、北齐、北周对峙 | Bài giảng ghi 北魏、东/西魏、北齐、北周 — mệnh đề thiếu Tây Ngụy. |
| 北魏孝文帝要求所有鲜卑贵族不可以讲汉语句子、穿汉服、改汉姓，并将迁都至洛阳 | Hiếu Văn Đế BẮT BUỘC nói tiếng Hán, mặc Hán phục, đổi họ Hán — mệnh đề nói ngược. |
| 公元 581 年，北周外戚杨坚夺取了帝位， 改国号为唐 | Dương Kiên đổi quốc hiệu thành Tuỳ, không phải Đường. |
| 唐朝是继汉朝之后最繁荣强大的朝代， 政治、经济、文化都非常发达， 标志着中国封建社会发展到了最高峰 | Bài giảng nguyên văn. |
| 638年，隋朝灭亡 | Nhà Tuỳ mất năm 618, không phải 638. |
| 公元 618 年，隋朝贵族李世民称帝，建立唐朝，定都长安 | Năm 618 Lý Uyên lập nhà Đường, không phải Lý Thế Dân. |
| 626 年，唐高祖李世民即位，年号贞观 | Bài giảng: 626年，唐太宗李世民即位 — là Đường Thái Tông, không phải Đường Cao Tổ. |
| 安史之乱的起因主要在于节度使权力过大（兵权、财权集于一身）、朝政腐败、玄宗后期怠政 | Bài giảng nêu đúng ba nguyên nhân này. |
| 从五代十国，经过宋、辽、西夏、金时期汉族和其他民族的融合，到实现元朝的统一，大约多少年？ | Bài giảng nguyên văn: …到实现元朝的统一，约460年. |
| 1402年至1424年是哪位皇帝的统治阶段？ | Vĩnh Lạc (Minh Thành Tổ Chu Đệ) trị vì 1402–1424. |
| 哪位皇帝将“后金”改成“清”？ | Hoàng Thái Cực đổi Hậu Kim thành Thanh năm 1636. |
| 清朝的最后一位皇帝是： | Phổ Nghi, niên hiệu Tuyên Thống. |
| 正黄、镶黄、正白等上三旗是由谁来管理的？ | Thượng tam kỳ do chính hoàng đế thống lĩnh. |
| 960年，西夏建立，李元昊称帝，宋夏在西北边境开启长期的战争 | Tây Hạ do Lý Nguyên Hạo lập năm 1038, không phải 960. |
| 公元1368年建立明朝后，中国恢复了汉人的统治，经历276年 | 1368–1644 đúng 276 năm. |
| 朱棣为了巩固自己的皇位，利用佛教的力量，下令按照自己的形象塑造真武大帝的塑像‌ | Chân Vũ Đại Đế là thần Đạo giáo, không phải Phật giáo. |
| 1626-1644年间，努尔哈赤与清朝建立 | Nỗ Nhĩ Cáp Xích mất năm 1626; nhà Thanh do Hoàng Thái Cực lập năm 1636. |
| 袁崇焕多次诬陷魏忠贤，之后魏忠贤被”凌迟”处死 | Ngược lại: phe Ngụy Trung Hiền vu hãm Viên Sùng Hoán; Ngụy Trung Hiền tự sát rồi bị phanh thây. |
| 被后人称为”六不总督“的是谁？ | Diệp Danh Sâm bị gọi là Lục bất tổng đốc. |
| 1859-1860阶段，为了报复清廷虐待战俘，英法联军劫掠并焚毁了中国的哪个建筑与文化的瑰宝 | Liên quân Anh–Pháp đốt Viên Minh Viên năm 1860. |
| 第二次鸦片战争（1856-1860）结束之后，中国清政府要签署的条约有： | 背景 là lỗi gõ của 北京: Thiên Tân điều ước và Bắc Kinh điều ước. |
| 1851年，洪秀全在哪个地方起义，建立太平天国？ | Hồng Tú Toàn khởi nghĩa ở Kim Điền (Quảng Tây) năm 1851. |
| 太平天国运动（1851-1864），曾国藩以自己的地方军进攻天京，该军队是： | Tăng Quốc Phiên chỉ huy Tương quân. |
| 1894年朝鲜爆发什么事变，使中日两国都以“协助朝鲜平乱”为由出兵？ | Khởi nghĩa nông dân Đông Học ở Triều Tiên năm 1894. |
| “门户开放政策”是哪个国家于19世纪末在中国采取的一种经济外交策略？ | Chính sách Mở cửa do Mỹ đưa ra năm 1899. |
| 《明定国是》的宗旨是： | Minh định quốc thị chiếu mở đầu Mậu Tuất biến pháp: bỏ cũ dựng mới. |
| “各国变法，无不从流血而成，今日中国未闻有因变法而流血者，此国之所以不昌也……”是谁的话？ | Câu nói của Đàm Tự Đồng. |
| 发起“公车上书”，辅助光绪皇帝进行维新变法，编写《大同书》是谁？ | Khang Hữu Vi: Công xa thượng thư, Đại đồng thư. |
| 名言：“少年强则国强。”是谁的？ | Lương Khải Siêu, Thiếu niên Trung Quốc thuyết. |
| ”鸦片战争“的一整个演变过程都在于1839年 – 1842年间 | Chiến tranh Nha phiến còn có lần hai (1856–1860), không gói trong 1839–1842. |
| 开放广州、厦门、福州、宁波、上海五处为通商口岸，允许外国商人自由贸易是《北京条约》的主要内容 | Năm cửa biển Quảng Châu, Hạ Môn, Phúc Châu, Ninh Ba, Thượng Hải là nội dung Nam Kinh điều ước. |
| 太平天国起义（1850—1864）完全只是一场普通的农民起义，其起义方式没有太多的改进 | Thái Bình Thiên Quốc có cương lĩnh, chính quyền và tôn giáo riêng — không phải khởi nghĩa nông dân thường. |
| 太平天国发展全盛（1851–1856），定都北京，分封诸王，推行《天朝田亩制度》 | Thái Bình Thiên Quốc định đô ở Nam Kinh (Thiên Kinh), không phải Bắc Kinh. |
| 1885年，中日签订《天津条约》朝鲜归于日本所控制 | Thiên Tân hội nghị chuyên điều 1885 quy định hai bên cùng rút quân; Triều Tiên không bị giao cho Nhật. |
| 1894年甲午战争之后，朝鲜正式独立 | Mã Quan điều ước 1895 điều 1: Trung Quốc thừa nhận Triều Tiên hoàn toàn độc lập. |
| ”百日维新“之所以失败是因为光绪帝柔弱无果断 | Thất bại vì phái bảo thủ của Từ Hi và vì không có thực quyền lẫn quân đội, không chỉ vì tính cách Quang Tự. |
| 义和团分子保护基督教，屠杀洋人 | Nghĩa Hoà Đoàn phù Thanh diệt dương: chống và sát hại giáo dân, không bảo vệ Cơ Đốc giáo. |
| 辛亥革命的成就是推翻封建，袁世凯就任大总督 | Viên Thế Khải nhậm chức Đại Tổng thống, không phải đại tổng đốc. |
| 五四运动基本上有几个阶段？ | Hai giai đoạn: sinh viên từ 4/5, công nhân từ đầu tháng 6. |
| 五四运动中，被广泛地提倡的“德先生”是： | Đức tiên sinh = Democracy = dân chủ; Tái tiên sinh = Science. |
| 军阀割据时期，控制整个资源丰富、面积辽阔的东北（满洲）地区的势力是： | Phụng hệ quân phiệt (Trương Tác Lâm) kiểm soát Đông Bắc. |
| 蒋介石正式在广州誓师，发布北伐宣言的时间是： | Tưởng thệ sư ở Quảng Châu tháng 7/1926. |
| 1927年8月1日，共产党领导的部分军队在哪里发动了起义？ | Khởi nghĩa Nam Xương 1/8/1927. |
| 遵义会议举行时间是： | Hội nghị Tuân Nghĩa tháng 1/1935. |
| 1947年7月—1948年8月是解放战争的低级阶段？ | 7/1947–8/1948 là giai đoạn hai: chuyển sang phản công chiến lược. |
| “虽然工业发展取得一定成就，但“大跃进”运动也带来了严重失误”这一说法是指哪一阶段？ | Đại nhảy vọt 1958–1960. |
| 2002—2012年间，谁提出“科学发展观”，强调社会协调发展与公平？ | Hồ Cẩm Đào nêu Khoa học phát triển quan. |
| 1921年，陈独秀在广州，首任党总书记，是精神与组织领袖 | Trần Độc Tú đang ở Quảng Châu khi Đại hội I họp, được chọn làm Thư ký Trung ương cục đầu tiên. |
| 1921年，邓小平与陈独秀等人共同创始共产党，成为北方地区思想领袖 | Năm 1921 Đặng Tiểu Bình mới 17 tuổi và đang ở Pháp; lãnh tụ phương Bắc là Lý Đại Chiêu. |
| 北伐战争的最后演变是张作霖宣布归顺接受蒋介石的南京政府，至此，中国在名义上实现统一 | Người tuyên bố quy thuận Nam Kinh là Trương Học Lương (Đông Bắc dịch xí, 12/1928); Trương Tác Lâm đã bị giết tháng 6/1928. |
| “井冈山会师”不是毛泽东与朱德成功会师，组建了红军第四军的事件 | Hội quân Tỉnh Cương Sơn ĐÚNG là Mao Trạch Đông gặp Chu Đức, lập Hồng quân đệ tứ quân — mệnh đề phủ định nên sai. |
| 五次围剿是共产党发动的战役，以反击国民党的进攻 | Năm lần vây quét do Quốc dân đảng phát động; Đảng Cộng sản chống vây quét. |
| 1938年发生长沙会战，三次挫败日军对这一战略重镇的进攻 | Các hội chiến Trường Sa diễn ra 1939–1942, không phải 1938. |
| 中国政府于1999年和2000年分别恢复对香港与澳门的主权 | Thu hồi Hồng Kông năm 1997 và Macao năm 1999. |
| 邓小平时期（1989—2002）开启现代化建设道路，确立“中国特色社会主义”发展方向 | 1989–2002 là thời Giang Trạch Dân; hiện đại hoá của Đặng Tiểu Bình mở ra từ 1978. |

## 3. Cảnh báo

- 05-ngu-dai-thanh.json: thầy để trống trắc nghiệm số 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 — bỏ qua.
- 05-ngu-dai-thanh.json: thầy để trống đúng/sai số 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22 — bỏ qua.
