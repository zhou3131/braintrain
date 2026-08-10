// 词语桩 · 常用词语 → 图像转换数据集（经典脚本全局版）
// 字段：
//   id     唯一 slug（同时用作图片文件名 assets/words/{id}.png）
//   word   要记的词（中文词 / 英文单词带中文义）
//   peg    脑中要浮现的图像（越夸张、越动态越好记）
//   method 用的记忆法：形象 / 谐音 / 关键词 / 语义 / 故事 / 路径
//   hint   怎么把词变成图像（给用户的"转换提示"）
//   img    可选，词图路径（用户用豆包生成后丢 assets/words/ 即自动显示）
//
// 设计依据（网上通用方法，已融入）：
//   · 形象联想法：把抽象/具体词直接画成鲜明图像（look→oo像两只眼）
//   · 谐音法：用发音近似的中文钩子（house→耗子；ambulance→俺不能死）
//   · 关键词法：外语词→母语声似词→图像（tiger→泰山上一只虎）
//   · 语义联想：把新词挂到已知知识/比喻（自由→冲出牢笼的飞鸟）
//   · 故事串联法：一串无序词编成一个荒诞故事（无序清单用）
//   · 记忆宫殿/路径法：把词按序钉在固定地点上（有序清单→千桩路线）
window.BT = window.BT || {};
window.BT.data = window.BT.data || {};

window.BT.data.wordPegs = [
  // ---------- 形象法：直接画鲜明图像（具体名词最常用）----------
  { id: 'apple',      word: '苹果',       peg: '一个红透的苹果砸在牛顿头上', method: '形象', hint: '直接想一个红苹果', img: '' },
  { id: 'elephant',   word: '大象',       peg: '大象用长鼻子卷起字母 E',     method: '形象', hint: 'elephant→想大鼻子卷东西', img: '' },
  { id: 'sun',        word: '太阳',       peg: '金红火球喷着光芒',          method: '形象', hint: '直接想发光的大太阳', img: '' },
  { id: 'book',       word: '书本',       peg: '翻开的书页飞出知识光点',     method: '形象', hint: '想一本翻开的书', img: '' },
  { id: 'clock',      word: '钟表',       peg: '钟摆左右摆动滴答走',        method: '形象', hint: '想挂钟的钟摆', img: '' },
  { id: 'key',        word: '钥匙',       peg: '一把金钥匙插进锁孔转动',     method: '形象', hint: '想手中转动的钥匙', img: '' },
  { id: 'umbrella',   word: '雨伞',       peg: '伞面撑开挡住倾盆大雨',       method: '形象', hint: '想撑开的雨伞', img: '' },
  { id: 'bulb',       word: '灯泡',       peg: '灯泡亮起一道光柱',          method: '形象', hint: '想发光的灯泡', img: '' },
  { id: 'plane',      word: '飞机',       peg: '飞机撕裂云层喷出蓝焰',       method: '形象', hint: '想起飞的客机', img: '' },
  { id: 'ship',       word: '轮船',       peg: '巨轮犁开海面留下白浪',       method: '形象', hint: '想破浪的轮船', img: '' },
  { id: 'tree',       word: '树',         peg: '大树扎根、枝头松鼠探头',     method: '形象', hint: '想一棵枝繁叶茂的树', img: '' },
  { id: 'fire',       word: '火',         peg: '火苗窜起舔舐木柴',          method: '形象', hint: '想跳动的火苗', img: '' },
  { id: 'mountain',   word: '山',         peg: '尖顶雪山云雾绕腰',          method: '形象', hint: '想一座高山', img: '' },
  { id: 'river',      word: '河',         peg: '河水弯弯流向远方',          method: '形象', hint: '想流动的小河', img: '' },

  // ---------- 语义/比喻法：抽象词挂到已知形象 ----------
  { id: 'freedom',    word: '自由',       peg: '挣脱锁链冲向天空的飞鸟',     method: '语义', hint: '自由=冲出牢笼的鸟', img: '' },
  { id: 'time',       word: '时间',       peg: '流沙从指缝漏下',            method: '语义', hint: '时间=指缝流沙', img: '' },
  { id: 'love',       word: '爱',         peg: '两颗心被红线系在一起',       method: '语义', hint: '爱=相连的两颗心', img: '' },
  { id: 'dream',      word: '梦想',       peg: '星星化作阶梯伸向月亮',       method: '语义', hint: '梦想=登天的星梯', img: '' },
  { id: 'courage',    word: '勇气',       peg: '小人举起比自己大的盾牌',     method: '语义', hint: '勇气=举盾前行', img: '' },
  { id: 'hope',       word: '希望',       peg: '黑暗中破土的新芽',          method: '语义', hint: '希望=破土新芽', img: '' },
  { id: 'lonely',     word: '孤独',       peg: '空房间里单人影对灯',        method: '语义', hint: '孤独=空房孤灯', img: '' },
  { id: 'memory',     word: '记忆',       peg: '抽屉里一格格存放的小物件',   method: '语义', hint: '记忆=收纳的抽屉', img: '' },

  // ---------- 谐音法：发音近似的中文钩子 ----------
  { id: 'house',      word: 'house (房子)',  peg: '房子里钻出一只耗子',      method: '谐音', hint: 'house→"耗子"', img: '' },
  { id: 'ambulance',  word: 'ambulance (救护车)', peg: '俺不能死，快叫救护车', method: '谐音', hint: 'ambulance→"俺不能死"', img: '' },
  { id: 'pest',       word: 'pest (害虫)',    peg: '边喊"拍死它"边拍虫子',    method: '谐音', hint: 'pest→"拍死它"', img: '' },
  { id: 'postman',    word: 'postman (邮递员)', peg: '邮递员跑死他们累瘫',    method: '谐音', hint: 'postman→"跑死他们"', img: '' },
  { id: 'beer',       word: 'beer (啤酒)',    peg: '啤酒杯冒泡"必喝"',        method: '谐音', hint: 'beer→"必喝"', img: '' },
  { id: 'bus',        word: 'bus (公交)',     peg: '巴士"爸死"吓一跳',        method: '谐音', hint: 'bus→"爸死"(玩笑钩子)', img: '' },

  // ---------- 关键词法：外语词→母语声似词→图像 ----------
  { id: 'tiger',      word: 'tiger (老虎)',  peg: '泰山上一只虎',            method: '关键词', hint: 'tiger 音似"泰山"→泰山上一只虎', img: '' },
  { id: 'ambition',   word: 'ambition (野心)', peg: '俺必胜的雄心举火炬',     method: '关键词', hint: 'ambition→"俺必胜"', img: '' },
  { id: 'pizza',      word: 'pizza (披萨)',  peg: '"披撒"酱料的圆饼',        method: '关键词', hint: 'pizza→"披撒"酱料', img: '' },
  { id: 'coffee',     word: 'coffee (咖啡)',  peg: '"考费"熬夜喝咖啡',        method: '关键词', hint: 'coffee→"考费"', img: '' },
  { id: 'bridge',     word: 'bridge (桥)',   peg: '"布里奇"木板搭的桥',      method: '关键词', hint: 'bridge→"布里奇"', img: '' },

  // ---------- 故事串联法：一组无序词编荒诞故事（练习用串词清单）----------
  { id: 'cat',        word: '猫',         peg: '猫跳上月亮',                method: '故事', hint: '编故事：猫跳上月亮', img: '' },
  { id: 'moon',       word: '月亮',       peg: '月亮被猫踩出坑',            method: '故事', hint: '接上：月亮被猫踩', img: '' },
  { id: 'fish',       word: '鱼',         peg: '鱼在云里游',                method: '故事', hint: '编故事：鱼游进云', img: '' },
  { id: 'cloud',      word: '云',         peg: '云朵托起鲸鱼',              method: '故事', hint: '接上：云托鲸鱼', img: '' },
  { id: 'whale',      word: '鲸',         peg: '鲸鱼喷出彩虹',              method: '故事', hint: '接上：鲸喷彩虹', img: '' },
  { id: 'rainbow',    word: '彩虹',       peg: '彩虹落进杯子',              method: '故事', hint: '接上：彩虹落杯', img: '' },

  // ---------- 路径法示例词（放固定地点用，配合千桩路线）----------
  { id: 'door',       word: '门',         peg: '家门口那扇门',              method: '路径', hint: '放家里"门"这个位置', img: '' },
  { id: 'bed',        word: '床',         peg: '卧室里的大床',              method: '路径', hint: '放"床"这个位置', img: '' },
  { id: 'desk',       word: '书桌',       peg: '书桌上的台灯',              method: '路径', hint: '放"书桌"这个位置', img: '' },
  { id: 'window',     word: '窗',         peg: '窗台望出去的景',            method: '路径', hint: '放"窗"这个位置', img: '' },
  { id: 'fridge',     word: '冰箱',       peg: '冰箱门打开冒冷气',          method: '路径', hint: '放"冰箱"这个位置', img: '' },
  { id: 'sofa',       word: '沙发',       peg: '沙发陷个坑',                method: '路径', hint: '放"沙发"这个位置', img: '' },

  // ---------- 再补几个高频抽象/工具词，丰富题库 ----------
  { id: 'money',      word: '钱',         peg: '金币雨砸下来',              method: '形象', hint: '想掉下来的金币', img: '' },
  { id: 'water',      word: '水',         peg: '一杯水晃荡',                method: '形象', hint: '想晃荡的水杯', img: '' },
  { id: 'phone',      word: '手机',       peg: '手机亮屏弹消息',            method: '形象', hint: '想亮屏的手机', img: '' },
  { id: 'star',       word: '星',         peg: '夜空闪烁的星',              method: '形象', hint: '想一颗亮星', img: '' },
  { id: 'flower',     word: '花',         peg: '一朵花绽放',                method: '形象', hint: '想绽放的花', img: '' },
  { id: 'bird',       word: '鸟',         peg: '小鸟啄食',                  method: '形象', hint: '想啄食的小鸟', img: '' },
  { id: 'happy',      word: '快乐',       peg: '笑脸蹦跳撒花',              method: '语义', hint: '快乐=蹦跳的笑脸', img: '' },
  { id: 'angry',      word: '愤怒',       peg: '涨红的脸冒火',              method: '语义', hint: '愤怒=冒火的脸', img: '' },
  { id: 'think',      word: '思考',       peg: '脑中齿轮转动',              method: '语义', hint: '思考=脑中齿轮', img: '' },
  { id: 'word',       word: '词语',       peg: '嘴吐出文字气泡',            method: '形象', hint: '想吐字的气泡', img: '' },

  // ---------- 增补：形象法（更多具体名词）----------
  { id: 'balloon',   word: '气球',       peg: '彩色气球挣脱手飞上天空',     method: '形象', hint: '想飘起的气球', img: '' },
  { id: 'kite',      word: '风筝',       peg: '风筝在云端拉出长线',         method: '形象', hint: '想飞高的风筝', img: '' },
  { id: 'lighthouse',word: '灯塔',       peg: '灯塔射出光柱刺穿浓雾',       method: '形象', hint: '想海边灯塔', img: '' },
  { id: 'wave',      word: '波浪',       peg: '蓝色波浪层层涌来退去',       method: '形象', hint: '想海浪', img: '' },
  { id: 'snowman',   word: '雪人',       peg: '雪人顶着胡萝卜鼻笑',         method: '形象', hint: '想堆的雪人', img: '' },
  { id: 'candle',    word: '蜡烛',       peg: '蜡烛火苗轻轻摇曳',           method: '形象', hint: '想点燃的蜡烛', img: '' },
  { id: 'robot',     word: '机器人',     peg: '机器人关节咔咔转动',         method: '形象', hint: '想走路的机器人', img: '' },
  { id: 'rocket',    word: '火箭',       peg: '火箭拖火尾冲出大气层',       method: '形象', hint: '想发射的火箭', img: '' },
  { id: 'camera',    word: '相机',       peg: '相机快门咔嚓闪光',           method: '形象', hint: '想举起的相机', img: '' },
  { id: 'map',       word: '地图',       peg: '地图展开标红终点',           method: '形象', hint: '想摊开的地图', img: '' },
  { id: 'hand',      word: '手',         peg: '一只张开的手掌',             method: '形象', hint: '想自己的手', img: '' },
  { id: 'eye',       word: '眼睛',       peg: '一只眨动的大眼睛',           method: '形象', hint: '想眼睛', img: '' },

  // ---------- 增补：谐音法 ----------
  { id: 'cake2',     word: 'cake (蛋糕)',   peg: '蛋糕卡喉"咳嗽"一声',       method: '谐音', hint: 'cake→"咳嗽"', img: '' },
  { id: 'mouse2',    word: 'mouse (鼠标)',  peg: '老鼠"猫死"吓一跳变鼠标',   method: '谐音', hint: 'mouse→"猫死"(玩笑)', img: '' },
  { id: 'fork2',     word: 'fork (叉子)',   peg: '佛客用金叉吃饭',           method: '谐音', hint: 'fork→"佛客"', img: '' },
  { id: 'glass2',    word: 'glass (玻璃杯)',peg: '哥辣死抱着玻璃杯',         method: '谐音', hint: 'glass→"哥辣死"', img: '' },
  { id: 'queen2',    word: 'queen (女王)',  peg: '亏恩欠女王一个人情',       method: '谐音', hint: 'queen→"亏恩"', img: '' },
  { id: 'pencil',    word: 'pencil (铅笔)', peg: '盆碎了露出铅笔',           method: '谐音', hint: 'pencil→"盆碎"', img: '' },

  // ---------- 增补：关键词法 ----------
  { id: 'lion',      word: 'lion (狮子)',   peg: '"来恩"送来一只狮',         method: '关键词', hint: 'lion 音似"来恩"', img: '' },
  { id: 'rose',      word: 'rose (玫瑰)',   peg: '"肉丝"缠着玫瑰',           method: '关键词', hint: 'rose→"肉丝"', img: '' },
  { id: 'stone2',    word: 'stone (石头)',  peg: '"斯顿"踢飞石头',           method: '关键词', hint: 'stone→"斯顿"', img: '' },
  { id: 'green2',    word: 'green (绿)',    peg: '"哥林"披绿披风',           method: '关键词', hint: 'green→"哥林"', img: '' },
  { id: 'bank2',     word: 'bank (银行)',   peg: '"板客"在银行排队',         method: '关键词', hint: 'bank→"板客"', img: '' },

  // ---------- 增补：语义/比喻法（抽象词）----------
  { id: 'pressure',  word: '压力',       peg: '被压到变形的弹簧',           method: '语义', hint: '压力=压缩的弹簧', img: '' },
  { id: 'success',   word: '成功',       peg: '登顶举奖杯的人',             method: '语义', hint: '成功=登顶举杯', img: '' },
  { id: 'fail',      word: '失败',       peg: '摔在地的runner',             method: '语义', hint: '失败=摔一跤', img: '' },
  { id: 'knowledge', word: '知识',       peg: '脑中亮起灯泡',               method: '语义', hint: '知识=脑中灯', img: '' },
  { id: 'friendship',word: '友谊',       peg: '两只手紧紧相握',             method: '语义', hint: '友谊=握手', img: '' },
  { id: 'warmth',    word: '温暖',       peg: '围炉烤火的人',               method: '语义', hint: '温暖=围炉', img: '' },
  { id: 'heart2',    word: '心',         peg: '胸腔里跳动的心',             method: '语义', hint: '心=跳动', img: '' },

  // ---------- 增补：故事串联法（一组无序词编荒诞故事）----------
  { id: 'letter',    word: '信',         peg: '信封长出翅膀飞走',           method: '故事', hint: '编故事：信飞了', img: '' },
  { id: 'road',      word: '路',         peg: '路口分出两条道',             method: '故事', hint: '接上：走到分叉路', img: '' },
  { id: 'lamppost',  word: '路灯',       peg: '路灯突然全亮',               method: '故事', hint: '接上：路灯亮', img: '' },
  { id: 'key2',      word: '钥匙串',     peg: '一串钥匙叮当响',             method: '故事', hint: '接上：钥匙响', img: '' },
  { id: 'clock2',    word: '闹钟',       peg: '闹钟狂响震醒人',             method: '故事', hint: '接上：闹钟响', img: '' },

  // ---------- 增补：路径法（放固定地点用）----------
  { id: 'kitchen',   word: '厨房',       peg: '厨房的灶台',                 method: '路径', hint: '放"厨房"位置', img: '' },
  { id: 'balcony',   word: '阳台',       peg: '阳台上的绿植',               method: '路径', hint: '放"阳台"位置', img: '' },
  { id: 'stairs',    word: '楼梯',       peg: '楼梯转角',                   method: '路径', hint: '放"楼梯"位置', img: '' },
  { id: 'bathroom',  word: '浴室',       peg: '浴室的花洒',                 method: '路径', hint: '放"浴室"位置', img: '' },
  { id: 'study2',    word: '书房',       peg: '书房的书架',                 method: '路径', hint: '放"书房"位置', img: '' },
  { id: 'garden',    word: '花园',       peg: '花园的秋千',                 method: '路径', hint: '放"花园"位置', img: '' },
  { id: 'warehouse', word: '仓库',       peg: '仓库的货架',                 method: '路径', hint: '放"仓库"位置', img: '' },
  { id: 'gate',      word: '院门',       peg: '院门外的邮箱',               method: '路径', hint: '放"院门"位置', img: '' }
];

// 便捷：按 method 分组（用于选项干扰项"同法优先"）
window.BT.data.wordPegs.byMethod = function (method) {
  return window.BT.data.wordPegs.filter((w) => w.method === method);
};
