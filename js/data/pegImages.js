// 数字桩 AI 图映射（豆包生成）。
// 约定：图片按桩号命名放入 assets/pegs/{setId}/{id}.png（矢量图用 .svg）。
//   —— 用户用豆包生成后直接存到该路径，应用自动显示，无需改此文件之外的代码；
//   —— 图片未放入时，界面自动回退到 pegEmoji.js 的 emoji（见 js/ui.js 全局 error 降级）。
// 主体系 1–100 现已全部生成（jpg 为主，少量为 png），故 mainIds 覆盖 1–100；候选顺序 jpg 优先，png/svg 兜底。
window.BT = window.BT || {};
(function () {
  'use strict';
  // 主体系 1–100（全部登记，png 优先）
  const mainIds = [];
  for (let i = 1; i <= 100; i++) mainIds.push(String(i));
  // 曾用矢量 svg 兜底的桩（5.svg），png 已生成时优先 png，svg 作后备
  const svgMain = ['5'];
  // 备选 0–11 中需要图的抽象桩
  const altIds = ['0', '2', '4'];

  function build(ids, svgIds) {
    const svg = new Set(svgIds || []);
    const m = {};
    ids.forEach(function (id) {
      // 候选顺序：优先 jpg（豆包生成），其次 png，再 svg（应用自带兜底）
      const cands = ['assets/pegs/main/' + id + '.jpg', 'assets/pegs/main/' + id + '.png'];
      if (svg.has(id)) cands.push('assets/pegs/main/' + id + '.svg');
      m[id] = cands;
    });
    return m;
  }
  function buildAlt(ids) {
    const m = {};
    ids.forEach(function (id) { m[id] = ['assets/pegs/alt/' + id + '.jpg', 'assets/pegs/alt/' + id + '.png']; });
    return m;
  }
  window.BT.data = window.BT.data || {};
  window.BT.data.pegImages = { main: build(mainIds, svgMain), alt: buildAlt(altIds) };
})();
