# Báo cáo build dữ liệu

Nguồn: `Biên du lịch.xlsx` · Ngày build: 2026-09-17

- Dòng đọc được từ Excel: **224**
- Thẻ sau khi gộp trùng lặp: **203**
- Số nhóm bị gộp: **20**
- Pinyin sinh tự động: **75**

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

Pinyin dưới đây do `pypinyin` sinh, chưa qua kiểm chứng. Trên web chúng hiển thị kèm dấu nhắc. Muốn sửa: bổ sung pinyin vào Excel rồi chạy lại script.

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

## 6. Dòng bị loại

_Không có._
