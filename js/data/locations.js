// 记忆宫殿「地点桩 / 路线」默认数据（经典脚本全局版）。
// 地点桩是 method of loci 的核心：把要记的东西"放"在熟悉的固定位置上，沿路线回忆。
// 你可以在应用内用「设置」替换为自己的 1000 地点桩（导入 xlsx 后）。
window.BT = window.BT || {};
(function () {
window.DEFAULT_LOCATIONS = [
  '家门口', '鞋柜', '玄关镜子', '客厅沙发', '茶几', '电视柜',
  '餐桌', '厨房水槽', '冰箱', '卧室门', '床', '床头柜',
  '书桌', '书架', '窗台', '卫生间', '阳台'
];

window.BT.data = window.BT.data || {};
window.BT.data.locations = window.DEFAULT_LOCATIONS;
})();
