const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(process.cwd(), 'data', 'timeline.db');
const db = new DatabaseSync(dbPath);

const insertTimeline = db.prepare(`
  INSERT OR REPLACE INTO timelines (id, title, description, color, parent_timeline_id, branch_point_node_id, order_index)
  VALUES (?, ?, ?, ?, ?, ?, ?)
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
  'Việt Nam: Từ Thời Âu Lạc Đến Thời Đại Nhà Lý (214 TCN – 1225 SCN)',
  'Lịch sử dựng nước & giữ nước của dân tộc Việt Nam: An Dương Vương, Hai Bà Trưng, Ngô Quyền đến triều Lý',
  'stone',
  null,
  null,
  1
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

// Insert nodes
chinaNodes.forEach(n => insertNode.run(...n));
vietnamNodes.forEach(n => insertNode.run(...n));

// Cross-timeline historical dependencies
insertDep.run('dep-qin-aulac', 'node-qin-empire', 'node-au-lac', 'historical_clash');
insertDep.run('dep-han-haibatrung', 'node-han-dynasty', 'node-hai-ba-trung', 'uprising');
insertDep.run('dep-three-batrieu', 'node-three-kingdoms', 'node-ba-trieu', 'uprising');
insertDep.run('dep-tang-bachdang', 'node-five-dynasties', 'node-bach-dang-938', 'decisive_victory');
insertDep.run('dep-song-lehoan', 'node-song-dynasty', 'node-le-hoan-pha-tong', 'defense');
insertDep.run('dep-song-lythuongkiet', 'node-song-dynasty', 'node-ly-thuong-kiet', 'defense');

console.log('Successfully seeded historical timelines 1 & 2');
