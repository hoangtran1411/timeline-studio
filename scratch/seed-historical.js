const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(process.cwd(), 'data', 'timeline.db');
const db = new DatabaseSync(dbPath);

const insertTimeline = db.prepare(`
  INSERT OR REPLACE INTO timelines (id, project_id, title, description, color, parent_timeline_id, branch_point_node_id, order_index)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertNode = db.prepare(`
  INSERT OR REPLACE INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertDep = db.prepare(`
  INSERT OR REPLACE INTO dependencies (id, from_node_id, to_node_id, type)
  VALUES (?, ?, ?, ?)
`);

// 1. Timeline 1: Trung Hoa (Tần -> Tống)
insertTimeline.run(
  'track-china',
  'proj-historical',
  'Trung Hoa: Từ Nhà Tần Đến Nhà Tống (221 TCN – 1279 SCN)',
  'Lịch sử Trung Quốc từ Tần Thủy Hoàng thống nhất thiên hạ, Hán, Tam Quốc, Tùy, Đường đến Nhà Tống',
  'zinc',
  null,
  null,
  0
);

// 2. Timeline 2: Việt Nam (song song)
insertTimeline.run(
  'track-vietnam',
  'proj-historical',
  'Việt Nam: Từ Thời Âu Lạc Đến Thời Đại Nhà Lý (214 TCN – 1225 SCN)',
  'Lịch sử dựng nước & giữ nước của dân tộc Việt Nam: An Dương Vương, Hai Bà Trưng, Ngô Quyền đến triều Lý',
  'stone',
  null,
  null,
  1
);

// 3. Timeline 3: Châu Âu (La Mã -> Sơ Kỳ & Trung Kỳ Trung Cổ)
insertTimeline.run(
  'track-europe',
  'proj-historical',
  'Châu Âu: Từ Cộng Hòa La Mã Đến Thời Trung Cổ (202 TCN – 1280 SCN)',
  'Đế chế La Mã cổ đại, Pax Romana, thời kỳ di cư, đế chế Carolingian, Thập tự chinh và Đại Hiến chương Magna Carta',
  'cyan',
  null,
  null,
  2
);

// 4. Timeline 4: Trung Á (Thảo Nguyên & Con Đường Tơ Lụa)
insertTimeline.run(
  'track-central-asia',
  'proj-historical',
  'Trung Á: Thảo Nguyên & Con Đường Tơ Lụa (209 TCN – 1279 SCN)',
  'Đế chế Hung Nô, Kushan, các mạng lưới thương nhân Sogdia trên Con đường Tơ lụa, Đột Quyết Khả Hãn và Đế quốc Mông Cổ',
  'amber',
  null,
  null,
  3
);

// Nodes for Timeline 1: China
const chinaNodes = [
  [
    'node-qin-empire',
    'track-china',
    'Tần Thủy Hoàng Thống Nhất Trung Hoa',
    'Nhà Tần diệt 6 nước, lập đế chế tập quyền đầu tiên, xây Vạn Lý Trường Thành, thống nhất tiền tệ & văn tự',
    '-0221-01-01',
    '-0207-12-31',
    'completed',
    'high',
    0,
    '#nhatan,#thongnhat,#vanlytruongthanh'
  ],
  [
    'node-qin-fall-han-chu',
    'track-china',
    'Tần Diệt Vong & Hán Sở Tranh Hùng',
    'Khởi nghĩa Trần Thắng - Ngô Quảng bùng nổ, Hán vương Lưu Bang và Tây Sở Bá vương Hạng Vũ tranh hùng',
    '-0206-01-01',
    '-0202-02-01',
    'completed',
    'high',
    1,
    '#tandietvong,#hanso,#hangvu'
  ],
  [
    'node-han-dynasty',
    'track-china',
    'Thời Đại Nhà Hán (Tây Hán & Đông Hán)',
    'Hán Vũ Đế mở mang bờ cõi, khai thông Con đường Tơ lụa, Nho giáo trở thành quốc giáo, Tư Mã Thiên viết Sử Ký',
    '-0202-02-01',
    '0220-12-10',
    'completed',
    'medium',
    2,
    '#nhahan,#conduongtolua,#nhohoc'
  ],
  [
    'node-three-kingdoms',
    'track-china',
    'Thời Kỳ Tam Quốc (Ngụy - Thục - Ngô)',
    'Trận Xích Bích (208), thế chân vạc ba nước Ngụy - Thục - Ngô, tài trí Gia Cát Lượng, Tào Tháo, Lưu Bị, Tôn Quyền',
    '0220-12-10',
    '0280-05-01',
    'completed',
    'high',
    3,
    '#tamquoc,#xichbich,#giacatluong'
  ],
  [
    'node-jin-north-south',
    'track-china',
    'Nhà Tấn & Nam Bắc Triều',
    'Tư Mã Viêm lập nhà Tấn, Loạn Bát Vương, thời kỳ Ngũ Hồ loạn Hoa và phân liệt Nam Bắc Triều',
    '0280-05-01',
    '0581-03-04',
    'completed',
    'low',
    4,
    '#nhatan,#nambactrieu'
  ],
  [
    'node-sui-dynasty',
    'track-china',
    'Thời Đại Nhà Tùy',
    'Tùy Văn Đế thống nhất lại Trung Hoa sau gần 300 năm phân liệt, xây dựng Đại Vận Hà nối liền Nam Bắc',
    '0581-03-04',
    '0618-06-18',
    'completed',
    'medium',
    5,
    '#nhatuy,#daivanha'
  ],
  [
    'node-tang-dynasty',
    'track-china',
    'Thời Đại Nhà Đường Cực Thịnh',
    'Đường Thái Tông - Trinh Quán Chi Trị, thời kỳ hoàng kim văn hóa, thơ Đường Lý Bạch - Đỗ Phủ, biến loạn An Sử (755)',
    '0618-06-18',
    '0907-06-01',
    'completed',
    'high',
    6,
    '#nhaduong,#trinhquan,#thoduong'
  ],
  [
    'node-five-dynasties',
    'track-china',
    'Thời Kỳ Ngũ Đại Thập Quốc',
    'Hậu Lương, Hậu Đường, Hậu Tấn, Hậu Hán, Hậu Chu và các phiên trấn phương Nam (trong đó có Nam Hán) tranh quyền',
    '0907-06-01',
    '0960-02-04',
    'completed',
    'medium',
    7,
    '#ngudai,#thapquoc,#namhan'
  ],
  [
    'node-song-dynasty',
    'track-china',
    'Thời Đại Nhà Tống (Bắc Tống & Nam Tống)',
    'Tống Thái Tổ Trần Kiều binh biến, kinh tế phát triển đỉnh cao, phát minh thuốc súng & la bàn, Nhạc Phi kháng Kim',
    '0960-02-04',
    '1279-03-19',
    'completed',
    'high',
    8,
    '#nhatong,#bactong,#namtong'
  ]
];

// Nodes for Timeline 2: Vietnam
const vietnamNodes = [
  [
    'node-au-lac',
    'track-vietnam',
    'An Dương Vương Lập Nước Âu Lạc',
    'Thục Phán hợp nhất Âu Việt & Lạc Việt sau khi kháng chiến chống quân Tần thắng lợi, xây Cổ Loa, chế nỏ liên châu',
    '-0214-01-01',
    '-0208-01-01',
    'completed',
    'high',
    0,
    '#aulac,#anduongvuong,#thanhcoloa'
  ],
  [
    'node-trieu-da',
    'track-vietnam',
    'Thời Kỳ Nam Việt (Triệu Đà)',
    'Truyền thuyết Trọng Thủy - Mỵ Châu nỏ thần, Nam Việt thiết lập quyền cai trị tại vùng đất Âu Lạc',
    '-0207-01-01',
    '-0111-04-01',
    'completed',
    'medium',
    1,
    '#trieuda,#namviet'
  ],
  [
    'node-bac-thuoc-early',
    'track-vietnam',
    'Thời Kỳ Bắc Thuộc Sơ Kỳ',
    'Nhà Tây Hán sáp nhập lãnh thổ thành Giao Chỉ, Cửu Chân, Nhật Nam; thái thú Tô Định cai trị hà khắc',
    '-0111-04-01',
    '0040-03-01',
    'completed',
    'low',
    2,
    '#bacthuoc,#giaochi'
  ],
  [
    'node-hai-ba-trung',
    'track-vietnam',
    'Khởi Nghĩa Hai Bà Trưng (40–43)',
    'Trưng Trắc và Trưng Nhị dựng cờ khởi nghĩa: "Đền nợ nước, trả thù nhà", xưng vương tại Mê Linh',
    '0040-03-01',
    '0043-05-01',
    'completed',
    'high',
    3,
    '#haibatrung,#melinh,#khoinghia'
  ],
  [
    'node-ba-trieu',
    'track-vietnam',
    'Khởi Nghĩa Bà Triệu (248)',
    'Triệu Thị Trinh nổi dậy chống nhà Đông Ngô: "Tôi muốn cưỡi cơn gió mạnh, đạp luồng sóng dữ, chém cá kình ở biển Đông"',
    '0248-01-01',
    '0248-12-31',
    'completed',
    'high',
    4,
    '#batrieu,#khangdongngo'
  ],
  [
    'node-ly-bi-van-xuan',
    'track-vietnam',
    'Lý Bí Khởi Nghĩa & Nước Vạn Xuân (544–602)',
    'Lý Nam Đế đánh đuổi thứ sử Tiêu Tư nhà Lương, xưng hoàng đế, đặt quốc hiệu Vạn Xuân, đầm Dạ Trạch Triệu Việt Vương',
    '0544-02-01',
    '0602-01-01',
    'completed',
    'high',
    5,
    '#vanxuan,#lynamde,#trieuvietvuong'
  ],
  [
    'node-khuc-thua-du',
    'track-vietnam',
    'Khúc Thừa Dụ Giành Quyền Tự Chủ (905)',
    'Nhân cơ hội nhà Đường suy vong, Khúc Thừa Dụ được nhân dân ủng hộ đánh chiếm Tống Bình, xưng Tiết độ sứ tự chủ',
    '0905-01-01',
    '0930-01-01',
    'completed',
    'high',
    6,
    '#khucthuadu,#tuchu'
  ],
  [
    'node-bach-dang-938',
    'track-vietnam',
    'Chiến Thắng Bạch Đằng Lịch Sử (938)',
    'Ngô Quyền dùng trận địa cọc ngầm tiêu diệt toàn bộ thủy quân Nam Hán của Lưu Hoằng Tháo, chấm dứt nghìn năm Bắc thuộc',
    '0938-11-01',
    '0939-01-01',
    'completed',
    'high',
    7,
    '#ngoquyen,#bachdang938,#namhan'
  ],
  [
    'node-dinh-tien-hoang',
    'track-vietnam',
    'Đinh Bộ Lĩnh Dẹp Loạn 12 Sứ Quân (968)',
    'Thống nhất giang sơn, lên ngôi Hoàng đế (Đinh Tiên Hoàng), đặt quốc hiệu Đại Cồ Việt, định đô tại Hoa Lư',
    '0968-01-01',
    '0980-01-01',
    'completed',
    'high',
    8,
    '#dinhbolinh,#daicoviet,#hoalu'
  ],
  [
    'node-le-hoan-pha-tong',
    'track-vietnam',
    'Lê Hoàn Đại Phá Quân Tống (981)',
    'Thập đạo tướng quân Lê Hoàn chỉ huy kháng chiến, đánh tan thủy bộ quân Tống do Hầu Nhân Bảo chỉ huy trên sông Bạch Đằng',
    '0981-03-01',
    '0981-05-01',
    'completed',
    'high',
    9,
    '#lehoan,#phatong,#bachdang981'
  ],
  [
    'node-ly-thang-long',
    'track-vietnam',
    'Nhà Lý & Chiếu Dời Đô Thăng Long (1010)',
    'Lý Thái Tổ dời đô từ Hoa Lư về thành Đại La đổi tên thành Thăng Long, mở đầu thời đại văn minh Đại Việt rực rỡ',
    '1009-11-21',
    '1054-01-01',
    'completed',
    'high',
    10,
    '#nhaly,#thanglong,#chieudoido'
  ],
  [
    'node-ly-thuong-kiet',
    'track-vietnam',
    'Kháng Chiến Chống Tống & Nam Quốc Sơn Hà (1075–1077)',
    'Lý Thường Kiệt chủ động phá căn cứ Ung Châu, lập phòng tuyến sông Như Nguyệt, ngâm bài thơ thần Nam Quốc Sơn Hà',
    '1075-10-01',
    '1077-03-15',
    'completed',
    'high',
    11,
    '#lythuongkiet,#namquocsonha,#nhunguyet'
  ]
];

// Nodes for Timeline 3: Europe
const europeNodes = [
  [
    'node-europe-zama',
    'track-europe',
    'Trận Zama & La Mã Thống Trị Tây Địa Trung Hải',
    'Scipio Africanus đánh bại Hannibal, La Mã toàn thắng Chiến tranh Punic lần 2, mở ra kỷ nguyên bá chủ Địa Trung Hải',
    '-0202-10-19',
    '-0201-01-01',
    'completed',
    'high',
    0,
    '#lama,#zama,#hannibal,#punic'
  ],
  [
    'node-europe-augustus',
    'track-europe',
    'Augustus & Khởi Đầu Đế Chế La Mã (Pax Romana)',
    'Sau khi Cộng hòa La Mã sụp đổ vì nội chiến, Octavianus trở thành Hoàng đế đầu tiên, mở ra hơn 200 năm hòa bình La Mã',
    '-0027-01-16',
    '0014-08-19',
    'completed',
    'high',
    1,
    '#augustus,#paxromana,#dechelama'
  ],
  [
    'node-europe-marcus-aurelius',
    'track-europe',
    'Thời Kỳ Cực Thịnh Pax Romana & Marcus Aurelius',
    'Hoàng đế triết gia Marcus Aurelius lãnh đạo La Mã trong chiến tranh Marcomanni và đại dịch Antonine, đỉnh cao thời kỳ Ngũ hiền đế',
    '0161-03-08',
    '0180-03-17',
    'completed',
    'medium',
    2,
    '#marcusaurelius,#triethocstoic,#paxromana'
  ],
  [
    'node-europe-constantine',
    'track-europe',
    'Constantine Đại Đế & Sắc Lệnh Milan',
    'Công nhận Cơ Đốc giáo, dời đô về Byzantium (Constantinople), đặt nền móng cho Đế quốc Đông La Mã (Byzantine)',
    '0313-02-01',
    '0337-05-22',
    'completed',
    'high',
    3,
    '#constantine,#milan,#byzantine'
  ],
  [
    'node-europe-fall-rome',
    'track-europe',
    'Tây La Mã Sụp Đổ & Thời Kỳ Di Cư',
    'Thủ lĩnh người Germanic Odoacer phế truất Hoàng đế Romulus Augustulus, Tây La Mã sụp đổ, Tây Âu bước vào thời kỳ Sơ Kỳ Trung Cổ',
    '0476-09-04',
    '0480-01-01',
    'completed',
    'high',
    4,
    '#taylamasupdo,#odoacer,#trungco'
  ],
  [
    'node-europe-charlemagne',
    'track-europe',
    'Charlemagne & Đế Chế Carolingian',
    'Giáo hoàng Leo III tôn Charlemagne làm Hoàng đế La Mã Thần thánh tại Rome, thống nhất Tây và Trung Âu, Phục hưng Carolingian',
    '0800-12-25',
    '0814-01-28',
    'completed',
    'high',
    5,
    '#charlemagne,#carolingian,#holyroman'
  ],
  [
    'node-europe-hastings',
    'track-europe',
    'Trận Hastings & Cuộc Chinh Phục Norman (1066)',
    'William Nhà Chinh Phạt đánh bại Vua Harold II của Anh, sáp nhập văn hóa Anglo-Saxon và Pháp, định hình lịch sử nước Anh',
    '1066-10-14',
    '1066-12-25',
    'completed',
    'medium',
    6,
    '#hastings,#williamchinhphat,#norman'
  ],
  [
    'node-europe-first-crusade',
    'track-europe',
    'Cuộc Thập Tự Chinh Thứ Nhất (1096–1099)',
    'Giáo hoàng Urban II kêu gọi các hiệp sĩ châu Âu giành lại Đất Thánh Jerusalem; thiết lập các quốc gia Thập tự quân ở Cận Đông',
    '1096-08-15',
    '1099-07-15',
    'completed',
    'high',
    7,
    '#thaptuchinh,#crusade,#jerusalem'
  ],
  [
    'node-europe-magna-carta',
    'track-europe',
    'Đại Hiến Chương Magna Carta (1215)',
    'Các quý tộc Anh buộc Vua John ký kết Magna Carta tại Runnymede, hạn chế quyền lực quân vương, nền tảng của nhà nước pháp quyền hiện đại',
    '1215-06-15',
    '1215-06-19',
    'completed',
    'high',
    8,
    '#magnacarta,#phapquyen,#anhquoc'
  ]
];

// Nodes for Timeline 4: Central Asia
const centralAsiaNodes = [
  [
    'node-asia-xiongnu',
    'track-central-asia',
    'Mạo Đốn Thiền Vu Thống Nhất Hung Nô (209 TCN)',
    'Mạo Đốn (Modu Chanyu) thống nhất các bộ lạc du mục Trung Á, lập nên đế chế thảo nguyên hùng mạnh đối trọng trực tiếp với nhà Hán',
    '-0209-01-01',
    '-0174-01-01',
    'completed',
    'high',
    0,
    '#hungno,#moduchanyu,#thaonguyen'
  ],
  [
    'node-asia-kushan',
    'track-central-asia',
    'Đế Quốc Kushan & Giao Thoa Văn Hóa Hy-Phật (30–375)',
    'Đế quốc Kushan (Quý Sương) kiểm soát ngã tư Trung Á - Ấn Độ, phát triển nghệ thuật Gandhara và thúc đẩy Phật giáo truyền sang Đông Á',
    '0030-01-01',
    '0375-01-01',
    'completed',
    'high',
    1,
    '#kushan,#quysuong,#phatgiao,#gandhara'
  ],
  [
    'node-asia-sogdian',
    'track-central-asia',
    'Thương Nhân Sogdia & Mạng Lưới Con Đường Tơ Lụa',
    'Các ốc đảo Samarkand, Bukhara phát triển cực thịnh; người Sogdia là mạng lưới huyết mạch trao đổi hàng hóa từ Ba Tư đến Trường An',
    '0400-01-01',
    '0650-01-01',
    'completed',
    'medium',
    2,
    '#sogdia,#samarkand,#bukhara,#tolua'
  ],
  [
    'node-asia-gokturk',
    'track-central-asia',
    'Đột Quyết Khả Hãn Quốc (552–603)',
    'Bumin Qaghan lập nên đế chế du mục Göktürk kiểm soát từ Hắc Hải đến Mãn Châu, là quốc gia đầu tiên sử dụng danh xưng chính thức "Turk"',
    '0552-01-01',
    '0603-01-01',
    'completed',
    'high',
    3,
    '#dotquyet,#gokturk,#buminqaghan'
  ],
  [
    'node-asia-talas',
    'track-central-asia',
    'Trận Chiến Sông Talas Lịch Sử (751)',
    'Quân Ả Rập Abbasid liên minh người Karluk đánh bại quân đội nhà Đường do Cao Tiên Chi chỉ huy tại sông Talas; kỹ thuật làm giấy truyền sang phương Tây',
    '0751-07-01',
    '0751-07-31',
    'completed',
    'high',
    4,
    '#talas,#abbasid,#nhaduong,#kythuatlamgiay'
  ],
  [
    'node-asia-samani-karakhanid',
    'track-central-asia',
    'Thời Kỳ Hoàng Kim Hồi Giáo Trung Á (Samanid & Karakhanid)',
    'Thời kỳ bùng nổ khoa học & triết học với các học giả vĩ đại Ibn Sina (Avicenna), Al-Biruni; Hồi giáo hóa thảo nguyên Trung Á',
    '0819-01-01',
    '1055-01-01',
    'completed',
    'medium',
    5,
    '#samanid,#ibnsina,#albiruni,#khoahoc'
  ],
  [
    'node-asia-mongol-conquest',
    'track-central-asia',
    'Thành Cát Tư Hãn & Đại Mông Cổ Chinh Phạt (1206–1279)',
    'Genghis Khan thống nhất các bộ lạc thảo nguyên, chinh phục Khwarezm, Tây Hạ, Kim và Nam Tống; lập Pax Mongolica nối liền Âu - Á',
    '1206-03-01',
    '1279-03-19',
    'completed',
    'high',
    6,
    '#thanhcattuhan,#mongco,#genghiskhan,#paxmongolica'
  ]
];

// Insert nodes for all 4 timelines
chinaNodes.forEach(n => insertNode.run(...n));
vietnamNodes.forEach(n => insertNode.run(...n));
europeNodes.forEach(n => insertNode.run(...n));
centralAsiaNodes.forEach(n => insertNode.run(...n));

// Cross-timeline historical dependencies
// 1. China <-> Vietnam
insertDep.run('dep-qin-aulac', 'node-qin-empire', 'node-au-lac', 'historical_clash');
insertDep.run('dep-han-haibatrung', 'node-han-dynasty', 'node-hai-ba-trung', 'uprising');
insertDep.run('dep-three-batrieu', 'node-three-kingdoms', 'node-ba-trieu', 'uprising');
insertDep.run('dep-tang-bachdang', 'node-five-dynasties', 'node-bach-dang-938', 'decisive_victory');
insertDep.run('dep-song-lehoan', 'node-song-dynasty', 'node-le-hoan-pha-tong', 'defense');
insertDep.run('dep-song-lythuongkiet', 'node-song-dynasty', 'node-ly-thuong-kiet', 'defense');

// 2. China <-> Central Asia
insertDep.run('dep-han-xiongnu', 'node-han-dynasty', 'node-asia-xiongnu', 'steppe_rivalry');
insertDep.run('dep-han-kushan', 'node-han-dynasty', 'node-asia-kushan', 'silk_road_trade');
insertDep.run('dep-sogdian-tang', 'node-asia-sogdian', 'node-tang-dynasty', 'cultural_exchange');
insertDep.run('dep-tang-talas', 'node-tang-dynasty', 'node-asia-talas', 'clash_of_civilizations');
insertDep.run('dep-mongol-song', 'node-asia-mongol-conquest', 'node-song-dynasty', 'conquest');

// 3. Central Asia <-> Europe
insertDep.run('dep-talas-europe', 'node-asia-talas', 'node-europe-charlemagne', 'paper_tech_transfer');
insertDep.run('dep-crusade-asia', 'node-europe-first-crusade', 'node-asia-samani-karakhanid', 'geopolitical_shift');
insertDep.run('dep-mongol-europe', 'node-asia-mongol-conquest', 'node-europe-magna-carta', 'pax_mongolica_era');

console.log('Successfully seeded 4 historical timelines into proj-historical:');
console.log('  1. Trung Hoa (track-china) - 9 nodes');
console.log('  2. Việt Nam (track-vietnam) - 12 nodes');
console.log('  3. Châu Âu (track-europe) - 9 nodes');
console.log('  4. Trung Á (track-central-asia) - 7 nodes');
console.log('Total nodes: 37, total cross-timeline dependencies: 14');
