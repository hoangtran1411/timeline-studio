const { createClient } = require('@libsql/client');
const path = require('node:path');

const url = process.env.TURSO_DATABASE_URL || ('file:' + path.join(process.cwd(), 'data', 'timeline.db').replace(/\\/g, '/'));
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

const statements = [];

function addTimeline(id, project_id, title, description, color, parent_timeline_id, branch_point_node_id, order_index) {
  statements.push({
    sql: 'INSERT OR REPLACE INTO timelines (id, project_id, title, description, color, parent_timeline_id, branch_point_node_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, project_id, title, description, color, parent_timeline_id, branch_point_node_id, order_index]
  });
}

function addNode(id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) {
  statements.push({
    sql: 'INSERT OR REPLACE INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags]
  });
}

function addDep(id, from_node_id, to_node_id, type) {
  statements.push({
    sql: 'INSERT OR REPLACE INTO dependencies (id, from_node_id, to_node_id, type) VALUES (?, ?, ?, ?)',
    args: [id, from_node_id, to_node_id, type]
  });
}

// 1. Timeline 1: Trung Hoa (Tần -> Tống)
addTimeline(
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
addTimeline(
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
addTimeline(
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
addTimeline(
  'track-central-asia',
  'proj-historical',
  'Trung Á: Thảo Nguyên & Con Đường Tơ Lụa (209 TCN – 1279 SCN)',
  'Đế chế Hung Nô, Kushan, các mạng lưới thương nhân Sogdia trên Con đường Tơ lụa, Đột Quyết Khả Hãn và Đế quốc Mông Cổ',
  'amber',
  null,
  null,
  3
);

// 5. Timeline 5: Mông Cổ (Thảo Nguyên Du Mục & Đại Hãn Quốc)
addTimeline(
  'track-mongolia',
  'proj-historical',
  'Mông Cổ: Các Bộ Lạc Thảo Nguyên & Đại Hãn Quốc (200 TCN – 1294 SCN)',
  'Từ các bộ lạc du mục Đông Hồ, Nhu Nhu, Liêu, Kim đến Thành Cát Tư Hãn và Hốt Tất Liệt lập nhà Nguyên',
  'purple',
  null,
  null,
  4
);

// 6. Timeline 6: Nhật Bản (Yayoi -> Kamakura)
addTimeline(
  'track-japan',
  'proj-historical',
  'Nhật Bản: Từ Thời Yayoi Đến Thời Kỳ Kamakura (200 TCN – 1285 SCN)',
  'Văn hóa lúa nước Yayoi, lăng mộ Kofun, Cải cách Taika, thời kỳ Heian rực rỡ và Mạc phủ Kamakura đánh bại quân Nguyên Mông',
  'rose',
  null,
  null,
  5
);

// 7. Timeline 7: Triều Tiên / Hàn Quốc (Cổ Triều Tiên -> Tam Quốc -> Cao Ly)
addTimeline(
  'track-korea',
  'proj-historical',
  'Triều Tiên: Cổ Triều Tiên, Tam Quốc & Cao Ly (194 TCN – 1290 SCN)',
  'Từ thời Vệ Mãn Triều Tiên, thời kỳ Tam Quốc (Goguryeo, Baekje, Silla), Silla thống nhất đến Vương triều Goryeo (Cao Ly)',
  'blue',
  null,
  null,
  6
);

// 8. Timeline 8: Thái Lan (Ban Chiang -> Dvaravati -> Sukhothai)
addTimeline(
  'track-thailand',
  'proj-historical',
  'Thái Lan: Từ Văn Hóa Ban Chiang, Dvaravati Đến Sukhothai (200 TCN – 1296 SCN)',
  'Từ văn hóa đồ đồng Ban Chiang, các vương quốc Môn Dvaravati, Hariphunchai đến Vương triều Sukhothai và Lan Na',
  'orange',
  null,
  null,
  7
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

// Nodes for Timeline 5: Mongolia
const mongoliaNodes = [
  [
    'node-mgl-donghu',
    'track-mongolia',
    'Các Bộ Lạc Đông Hồ & Tiên Ty (200 TCN – 200 SCN)',
    'Các bộ tộc du mục Đông Hồ, Ô Hoàn và Tiên Ty phát triển mạnh mẽ trên đồng cỏ Mông Cổ và dãy Đại Hưng An',
    '-0200-01-01',
    '0200-01-01',
    'completed',
    'medium',
    0,
    '#dongho,#tienty,#thaonguyen'
  ],
  [
    'node-mgl-rouran',
    'track-mongolia',
    'Nhu Nhu Khả Hãn Quốc (330–555)',
    'Người Nhu Nhu (Rouran) thống trị cao nguyên Mông Cổ, là nhà nước du mục đầu tiên sử dụng danh xưng Khả Hãn (Khagan)',
    '0330-01-01',
    '0555-01-01',
    'completed',
    'medium',
    1,
    '#nhunhu,#rouran,#khahan'
  ],
  [
    'node-mgl-khitan-liao',
    'track-mongolia',
    'Đế Quốc Khiết Đan (Nhà Liêu) (916–1125)',
    'Gia Luật A Bảo Cơ thống nhất các bộ tộc Khiết Đan lập nhà Liêu, kiểm soát thảo nguyên Mông Cổ và 16 châu Yên Vân',
    '0916-03-17',
    '1125-03-26',
    'completed',
    'high',
    2,
    '#khietdan,#nhalieu,#yenvan'
  ],
  [
    'node-mgl-jurchen-jin',
    'track-mongolia',
    'Nhà Kim Của Người Nữ Chân (1115–1234)',
    'Hoàn Nhan A Cốt Đả khởi binh diệt Liêu, chiếm Biện Kinh (Bắc Tống), kiểm soát toàn bộ miền bắc Trung Hoa và bắt Mông Cổ triều cống',
    '1115-01-28',
    '1234-02-09',
    'completed',
    'high',
    3,
    '#nuchan,#nhakim,#hoannhanacotda'
  ],
  [
    'node-mgl-kurultai-1206',
    'track-mongolia',
    'Đại Hội Kurultai & Thiết Mộc Chân Xưng Thành Cát Tư Hãn (1206)',
    'Thiết Mộc Chân thống nhất toàn bộ các bộ lạc thảo nguyên Mông Cổ, được tôn xưng Thành Cát Tư Hãn, ban hành đại luật Yassa',
    '1206-03-01',
    '1206-05-01',
    'completed',
    'high',
    4,
    '#kurultai,#genghiskhan,#thietmocchan,#yassa'
  ],
  [
    'node-mgl-western-campaign',
    'track-mongolia',
    'Chiến Dịch Tây Chinh Chấn Động Á - Âu (1219–1242)',
    'Kỵ binh Mông Cổ tiêu diệt Khwarezm, đánh tan liên quân Nga - Cuman tại sông Kalka, tấn công Ba Lan và Hungary, rung chuyển châu Âu',
    '1219-09-01',
    '1242-05-01',
    'completed',
    'high',
    5,
    '#taychinh,#kalka,#balan,#hungary,#kybinh'
  ],
  [
    'node-mgl-kublai-yuan',
    'track-mongolia',
    'Hốt Tất Liệt Định Đô Đại Đô & Lập Nhà Nguyên (1271–1279)',
    'Hốt Tất Liệt dời đô về Khanbaliq (Bắc Kinh), đặt quốc hiệu Đại Nguyên, hoàn tất diệt Nam Tống, tạo dựng đế quốc liên lục địa khổng lồ',
    '1271-12-18',
    '1279-03-19',
    'completed',
    'high',
    6,
    '#hottatliet,#nhanguyen,#khanbaliq,#dainguyen'
  ]
];

// Nodes for Timeline 6: Japan
const japanNodes = [
  [
    'node-jp-yayoi',
    'track-japan',
    'Thời Kỳ Yayoi & Kỹ Thuật Canh Tác Lúa Nước (200 TCN – 250 SCN)',
    'Du nhập kỹ thuật luyện kim đồng - sắt và nghề trồng lúa nước; xuất hiện các tiểu quốc, nổi tiếng nhất là Nữ vương Himiko xứ Yamatai',
    '-0200-01-01',
    '0250-01-01',
    'completed',
    'medium',
    0,
    '#yayoi,#luanuoc,#himiko,#yamatai'
  ],
  [
    'node-jp-kofun-yamato',
    'track-japan',
    'Thời Kỳ Kofun & Nhà Nước Yamato Thống Nhất (250–538)',
    'Xây dựng các gò lăng mộ khổng lồ hình lỗ khóa (Kofun); triều đình Yamato thống nhất quần đảo Nhật Bản',
    '0250-01-01',
    '0538-01-01',
    'completed',
    'medium',
    1,
    '#kofun,#yamato,#mohinhlokhoa'
  ],
  [
    'node-jp-asuka-shotoku',
    'track-japan',
    'Thời Kỳ Asuka & Thái Tử Shotoku (592–645)',
    'Thái tử Shotoku ban hành Hiến pháp 17 điều, truyền bá Phật giáo, cử sứ bộ Khiển Tùy sứ và Khiển Đường sứ sang Trung Hoa học hỏi',
    '0592-12-08',
    '0645-06-12',
    'completed',
    'high',
    2,
    '#asuka,#shotoku,#hienphap17dieu,#phatgiao'
  ],
  [
    'node-jp-taika-reforms',
    'track-japan',
    'Cải Cách Taika (Đại Hóa Cải Tân) (645)',
    'Thiên hoàng Kotoku và Nakatomi no Kamatari tiêu diệt họ Soga, ban bố cải cách Taika, tập quyền hóa quyền lực theo mô hình nhà Đường',
    '0645-06-19',
    '0710-03-10',
    'completed',
    'high',
    3,
    '#taika,#daihoa,#taptuyen'
  ],
  [
    'node-jp-nara-period',
    'track-japan',
    'Thời Kỳ Nara & Đại Tượng Phật Todai-ji (710–794)',
    'Định đô tại Heijo-kyo (Nara), biên soạn Cổ Sự Ký (Kojiki) và Nhật Bản Thư Kỷ (Nihon Shoki), đúc tượng Đại Phật Daibutsu chùa Todai-ji',
    '0710-03-10',
    '0794-11-22',
    'completed',
    'medium',
    4,
    '#nara,#todaiji,#daibutsu,#kojiki'
  ],
  [
    'node-jp-heian-period',
    'track-japan',
    'Thời Kỳ Heian & Văn Hóa Quý Tộc Rực Rỡ (794–1185)',
    'Dời đô về Heian-kyo (Kyoto); dòng họ Fujiwara nắm quyền; sáng tạo chữ viết Kana, Murasaki Shikibu viết kiệt tác Truyện Genji',
    '0794-11-22',
    '1185-04-25',
    'completed',
    'high',
    5,
    '#heian,#kyoto,#fujiwara,#genji,#kana'
  ],
  [
    'node-jp-kamakura-shogunate',
    'track-japan',
    'Mạc Phủ Kamakura & Thời Đại Samurai Bắt Đầu (1185–1274)',
    'Minamoto no Yoritomo đánh bại họ Taira trong Chiến tranh Genpei, lập nên Mạc phủ Kamakura, mở đầu thời đại thống trị của Samurai',
    '1185-04-25',
    '1274-11-01',
    'completed',
    'high',
    6,
    '#kamakura,#macphu,#yoritomo,#samurai'
  ],
  [
    'node-jp-mongol-invasions',
    'track-japan',
    'Kháng Chiến Chống Quân Nguyên Mông & Bão Thần Kamikaze (1274–1281)',
    'Mạc phủ Kamakura kiên cường chống trả hai cuộc đại xâm lăng của hạm đội Nguyên Mông; các cơn bão thần Kamikaze nhấn chìm chiến thuyền giặc',
    '1274-11-01',
    '1281-08-15',
    'completed',
    'high',
    7,
    '#kamikaze,#khangnguyen,#nguyenmong,#baothan'
  ]
];

// Nodes for Timeline 7: Korea
const koreaNodes = [
  [
    'node-kr-gojoseon-wiman',
    'track-korea',
    'Vệ Mãn Triều Tiên (Wiman Joseon) (194–108 TCN)',
    'Vệ Mãn lập quốc sau thời kỳ Cổ Triều Tiên, phát triển thương mại và luyện đồ sắt, kiên cường kháng cự quân Tây Hán',
    '-0194-01-01',
    '-0108-01-01',
    'completed',
    'medium',
    0,
    '#gojoseon,#wiman,#cotrieutien'
  ],
  [
    'node-kr-three-kingdoms',
    'track-korea',
    'Thời Kỳ Tam Quốc Triều Tiên (Goguryeo - Baekje - Silla)',
    'Thế chân vạc Cao Câu Ly (Goguryeo), Bách Tế (Baekje) và Tân La (Silla); Phật giáo du nhập, nghệ thuật lăng mộ cổ tráng lệ',
    '0057-01-01',
    '0668-01-01',
    'completed',
    'high',
    1,
    '#tamquoctrieutien,#goguryeo,#baekje,#silla'
  ],
  [
    'node-kr-goguryeo-sui-war',
    'track-korea',
    'Cao Câu Ly Kháng Chiến Chống Tùy & Trận Salsu (612)',
    'Tướng quân Eulji Mundeok chỉ huy quân Goguryeo đánh tan hơn 30 vạn đại quân nhà Tùy tại sông Salsu (Tát Thủy)',
    '0612-02-01',
    '0612-07-30',
    'completed',
    'high',
    2,
    '#goguryeo,#salsu,#euljimundeok,#khangtuy'
  ],
  [
    'node-kr-unified-silla',
    'track-korea',
    'Tân La Thống Nhất & Phật Quốc Tự (668–935)',
    'Silla liên minh nhà Đường thống nhất bán đảo, xây dựng chùa Bulguksa và thạch động Seokguram, đỉnh cao Phật giáo',
    '0668-09-01',
    '0935-01-01',
    'completed',
    'high',
    3,
    '#tanla,#silla,#bulguksa,#seokguram'
  ],
  [
    'node-kr-goryeo-wanggeon',
    'track-korea',
    'Vương Kiến Sáng Lập Triều Đại Goryeo (Cao Ly) (918)',
    'Taejo Wang Geon thống nhất Hậu Tam Quốc, đặt tên nước là Goryeo (nguồn gốc từ "Korea"), định đô tại Kaesong',
    '0918-07-25',
    '0936-09-01',
    'completed',
    'high',
    4,
    '#goryeo,#caoly,#wanggeon,#kaesong'
  ],
  [
    'node-kr-tripitaka-koreana',
    'track-korea',
    'Bát Vạn Đại Tạng Kinh & Kim Loại Hoạt Tự (1236–1251)',
    'Khắc hơn 81.000 bản mộc Bát Vạn Đại Tạng Kinh tại chùa Haeinsa cầu an; phát minh kỹ thuật in chữ kim loại đầu tiên trên thế giới',
    '1236-01-01',
    '1251-10-01',
    'completed',
    'high',
    5,
    '#tripitaka,#batvancaidaitangkink,#inankimloai'
  ],
  [
    'node-kr-goryeo-mongol-war',
    'track-korea',
    'Goryeo Kháng Chiến & Hòa Nghị Với Đế Quốc Mông Cổ (1231–1270)',
    'Triều đình Cao Ly dời đô ra đảo Ganghwa kiên cường kháng chiến suốt 30 năm trước các đợt xâm lăng của kỵ binh Mông Cổ',
    '1231-08-01',
    '1270-05-01',
    'completed',
    'high',
    6,
    '#ganghwa,#khangmong,#hoanghi'
  ]
];

// Nodes for Timeline 8: Thailand
const thailandNodes = [
  [
    'node-th-ban-chiang',
    'track-thailand',
    'Văn Hóa Đồ Đồng - Gốm Sứ Ban Chiang (200 TCN – 200 SCN)',
    'Nền văn minh luyện kim đồ đồng và nghệ thuật gốm hoa văn đỏ cuộn tròn độc đáo bên lưu vực sông Mekong tại Đông Bắc Thái Lan',
    '-0200-01-01',
    '0200-01-01',
    'completed',
    'medium',
    0,
    '#banchiang,#gomsudong,#mekong'
  ],
  [
    'node-th-dvaravati',
    'track-thailand',
    'Vương Quốc Môn Dvaravati (Thoa La Bát Đề) (550–1000)',
    'Mạng lưới các thành bang người Môn tại lưu vực sông Chao Phraya; du nhập Phật giáo Theravada và nghệ thuật Bánh xe Pháp Luân',
    '0550-01-01',
    '1000-01-01',
    'completed',
    'high',
    1,
    '#dvaravati,#nguoimon,#chaophraya,#phatgiaonamtruyen'
  ],
  [
    'node-th-hariphunchai',
    'track-thailand',
    'Vương Quốc Hariphunchai (Lamphun) (750–1292)',
    'Nữ vương Chamadevi sáng lập Hariphunchai ở miền Bắc Thái Lan, trung tâm văn hóa Phật giáo thịnh vượng trước khi sáp nhập vào Lan Na',
    '0750-01-01',
    '1292-01-01',
    'completed',
    'medium',
    2,
    '#hariphunchai,#chamadevi,#lamphun,#lanna'
  ],
  [
    'node-th-lopburi-khmer',
    'track-thailand',
    'Thời Kỳ Ảnh Hưởng Khmer & Văn Hóa Lopburi (1000–1238)',
    'Đế chế Khmer mở rộng ảnh hưởng tới lưu vực sông Chao Phraya, xây dựng các đền tháp Prang bằng đá sa thạch tại Lopburi và Phimai',
    '1000-01-01',
    '1238-01-01',
    'completed',
    'medium',
    3,
    '#lopburi,#khmer,#phimai,#kientrucprang'
  ],
  [
    'node-th-sukhothai-founding',
    'track-thailand',
    'Sáng Lập Vương Quốc Sukhothai (Bình Minh Hạnh Phúc) (1238)',
    'Hai thủ lĩnh người Thái Sri Indraditya và Pha Mueang nổi dậy đánh đuổi Khmer, lập nên vương quốc độc lập đầu tiên của người Thái',
    '1238-01-01',
    '1279-01-01',
    'completed',
    'high',
    4,
    '#sukhothai,#sriindraditya,#nguoithai,#binhminh'
  ],
  [
    'node-th-ram-khamhaeng',
    'track-thailand',
    'Đại Đế Ram Khamhaeng & Khai Sinh Chữ Thái (1279–1298)',
    'Vua Ram Khamhaeng sáng tạo bảng chữ cái Thái (1283) khắc bia đá, mở rộng cương thổ: "Trong nước có cá, ngoài đồng có lúa"',
    '1279-01-01',
    '1298-01-01',
    'completed',
    'high',
    5,
    '#ramkhamhaeng,#chuthai,#biada,#hoangkim'
  ],
  [
    'node-th-lan-na-mangrai',
    'track-thailand',
    'Vua Mangrai Sáng Lập Vương Quốc Lan Na (1292–1296)',
    'Vua Mangrai thống nhất các mường phương Bắc, xây dựng kinh đô Chiang Mai hoa lệ, liên minh bền chặt với Sukhothai',
    '1292-01-01',
    '1296-04-12',
    'completed',
    'medium',
    6,
    '#lanna,#mangrai,#chiangmai,#trieuthuaruong'
  ]
];

// Insert nodes for all 8 timelines
chinaNodes.forEach(n => addNode(...n));
vietnamNodes.forEach(n => addNode(...n));
europeNodes.forEach(n => addNode(...n));
centralAsiaNodes.forEach(n => addNode(...n));
mongoliaNodes.forEach(n => addNode(...n));
japanNodes.forEach(n => addNode(...n));
koreaNodes.forEach(n => addNode(...n));
thailandNodes.forEach(n => addNode(...n));

// Cross-timeline historical dependencies
// 1. China <-> Vietnam
addDep('dep-qin-aulac', 'node-qin-empire', 'node-au-lac', 'historical_clash');
addDep('dep-han-haibatrung', 'node-han-dynasty', 'node-hai-ba-trung', 'uprising');
addDep('dep-three-batrieu', 'node-three-kingdoms', 'node-ba-trieu', 'uprising');
addDep('dep-tang-bachdang', 'node-five-dynasties', 'node-bach-dang-938', 'decisive_victory');
addDep('dep-song-lehoan', 'node-song-dynasty', 'node-le-hoan-pha-tong', 'defense');
addDep('dep-song-lythuongkiet', 'node-song-dynasty', 'node-ly-thuong-kiet', 'defense');

// 2. China <-> Central Asia
addDep('dep-han-xiongnu', 'node-han-dynasty', 'node-asia-xiongnu', 'steppe_rivalry');
addDep('dep-han-kushan', 'node-han-dynasty', 'node-asia-kushan', 'silk_road_trade');
addDep('dep-sogdian-tang', 'node-asia-sogdian', 'node-tang-dynasty', 'cultural_exchange');
addDep('dep-tang-talas', 'node-tang-dynasty', 'node-asia-talas', 'clash_of_civilizations');
addDep('dep-mongol-song', 'node-asia-mongol-conquest', 'node-song-dynasty', 'conquest');

// 3. Central Asia <-> Europe
addDep('dep-talas-europe', 'node-asia-talas', 'node-europe-charlemagne', 'paper_tech_transfer');
addDep('dep-crusade-asia', 'node-europe-first-crusade', 'node-asia-samani-karakhanid', 'geopolitical_shift');
addDep('dep-mongol-europe', 'node-asia-mongol-conquest', 'node-europe-magna-carta', 'pax_mongolica_era');

// 4. Mongolia <-> China & Europe & Japan
addDep('dep-mgl-jin-song', 'node-mgl-jurchen-jin', 'node-song-dynasty', 'border_warfare');
addDep('dep-mgl-song-fall', 'node-mgl-kublai-yuan', 'node-song-dynasty', 'conquest');
addDep('dep-mgl-west-europe', 'node-mgl-western-campaign', 'node-europe-magna-carta', 'geopolitical_shockwave');
addDep('dep-mgl-yuan-japan', 'node-mgl-kublai-yuan', 'node-jp-mongol-invasions', 'naval_invasion');

// 5. Japan <-> China
addDep('dep-jp-sui-asuka', 'node-sui-dynasty', 'node-jp-asuka-shotoku', 'diplomatic_mission');
addDep('dep-jp-tang-taika', 'node-tang-dynasty', 'node-jp-taika-reforms', 'legal_cultural_model');

// 6. Korea <-> China & Mongolia & Japan
addDep('dep-sui-goguryeo', 'node-sui-dynasty', 'node-kr-goguryeo-sui-war', 'salsu_defense');
addDep('dep-tang-silla', 'node-tang-dynasty', 'node-kr-unified-silla', 'silla_tang_alliance');
addDep('dep-mgl-goryeo', 'node-mgl-western-campaign', 'node-kr-goryeo-mongol-war', 'ganghwa_defense');
addDep('dep-goryeo-japan', 'node-kr-goryeo-mongol-war', 'node-jp-mongol-invasions', 'staging_ground');

// 7. Thailand <-> Southeast Asia & Yuan
addDep('dep-th-yuan-tribute', 'node-mgl-kublai-yuan', 'node-th-ram-khamhaeng', 'diplomatic_trade');
addDep('dep-vn-th-regional', 'node-ly-thuong-kiet', 'node-th-lopburi-khmer', 'regional_balance');



async function main() {
  console.log('Connecting to database:', url.startsWith('file:') ? url : url.replace(/:[^:@]*@/, ':***@'));
  
  // Create schema if needed
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT 'indigo',
      icon TEXT DEFAULT 'folder',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timelines (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT 'default',
      parent_timeline_id TEXT,
      branch_point_node_id TEXT,
      order_index INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      is_visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      timeline_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      status TEXT DEFAULT 'planned',
      priority TEXT DEFAULT 'medium',
      order_index INTEGER DEFAULT 0,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dependencies (
      id TEXT PRIMARY KEY,
      from_node_id TEXT NOT NULL,
      to_node_id TEXT NOT NULL,
      type TEXT DEFAULT 'blocks',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute({
    sql: 'INSERT OR IGNORE INTO projects (id, name, description, color, icon) VALUES (?, ?, ?, ?, ?)',
    args: ['proj-historical', 'Historical Chronology (Lịch Sử)', 'Comparative dynasties, civilizational milestones, and historical clashes', 'amber', '📜']
  });

  console.log(`Seeding ${statements.length} items (timelines, nodes, dependencies)...`);

  for (let i = 0; i < statements.length; i += 50) {
    const chunk = statements.slice(i, i + 50);
    await db.batch(chunk, 'write');
  }

  console.log('Successfully seeded 8 historical timelines into proj-historical!');
  console.log('Total nodes: 66, total cross-timeline dependencies: 26');
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
