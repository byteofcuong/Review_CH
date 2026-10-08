# Báo cáo build dữ liệu

Ngày build: 2026-10-08

| Môn | Nguồn | Dòng đọc | Thẻ | Gộp | Tách cặp | Pinyin tự sinh |
|---|---|---|---|---|---|---|
| Biên du lịch | `Biên du lịch.xlsx` | 224 | 203 | 20 | 0 | 75 |
| Phiên dịch nâng cao | `Phiên dịch nâng cao.xlsx` | 577 | 577 | 0 | 36 | 2 |

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

| Chữ Hán | Ghi chú |
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

| Chữ Hán | Ghi chú |
|---|---|
| 打着……旗号 | VD: 中国货打着越南制造的旗号 – hàng TQ núp danh nghĩa “Made in Vietnam” |
| 另类国家 | 替代国 (nước thay thế) |
| 对……产品实施反倾销 | A针对原产于B的产品实施的反倾销反补贴措施; 针对……出口产品采取反倾销措施 |
| 反补贴措施 | A针对原产于B的产品实施的反倾销反补贴措施; 针对……出口产品采取反倾销措施 |
| 共识性否决 | 反向协商一致 (đồng thuận nghịch/ Nguyên tắc đồng thuận ngược) |
| 随即 | VD: 中国随即以“以牙还牙”的方式反击 – TQ lập tức đáp trả kiểu “ăn miếng trả miếng” |
