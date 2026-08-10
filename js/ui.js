// 通用 UI 渲染助手：标准扑克牌面（SVG）与数字桩视觉（图/emoji/文字降级）。
// 经典脚本全局版，挂到 window.BT.ui，供各模块调用（不依赖联网/外部资源）。
window.BT = window.BT || {};
window.BT.ui = window.BT.ui || {};
(function () {
  'use strict';

  // ---------- 标准扑克牌面（SVG，红桃/方块红、黑桃/梅花黑）----------
  function cardFace(card, opts) {
    opts = opts || {};
    const suit = card.suit;
    const rank = card.rank;
    const red = (window.RED_SUITS && window.RED_SUITS.has(suit)) || ['♥', '♦'].indexOf(suit) >= 0;
    const color = red ? '#d4264b' : '#1f2937';
    const cls = 'card-face' + (red ? ' red' : '') + (opts.small ? ' small' : '');
    // 人物牌（J/Q/K）：显示豆包生成的人物图（assets/cards/persons/{key}.png），失败回退纯牌面+姓名
    if (card && (card.type === 'person' || (card.person && card.person.name))) {
      const pkey = card.key;
      const name = (card.person && card.person.name) || card.num || '';
      const note = (card.person && card.person.note) ? ' ' + card.person.note : '';
      const cap = red ? ' card-person-red' : ' card-person-black';
      return (
        '<span class="card-face card-person' + cap + '">' +
          '<span class="pf-corner tl">' + rank + '<br>' + suit + '</span>' +
          '<span class="pf-corner br">' + rank + '<br>' + suit + '</span>' +
          '<img class="pf-img" src="assets/cards/persons/' + pkey + '.png" alt="' + name + '" ' +
          'onerror="this.parentNode.classList.add(\'no-img\')">' +
          '<span class="pf-name">' + name + (note ? '<span class="pf-note">' + note + '</span>' : '') + '</span>' +
        '</span>'
      );
    }
    const fb = 'data:text/html;utf8,';
    return (
      '<svg class="' + cls + '" viewBox="0 0 90 126" xmlns="http://www.w3.org/2000/svg" ' +
      'role="img" aria-label="' + suit + rank + '">' +
      '<rect x="2.5" y="2.5" width="85" height="121" rx="9" fill="#ffffff" stroke="' + color + '" stroke-width="2.5"/>' +
      // 左上角点数 + 花色
      '<text x="12" y="22" font-size="17" font-weight="700" fill="' + color + '" text-anchor="middle" font-family="Arial,Helvetica,sans-serif">' + rank + '</text>' +
      '<text x="12" y="38" font-size="15" text-anchor="middle" fill="' + color + '" font-family="Arial,sans-serif">' + suit + '</text>' +
      // 中心大花色
      '<text x="45" y="74" font-size="46" text-anchor="middle" fill="' + color + '" font-family="Arial,sans-serif">' + suit + '</text>' +
      // 右下角（旋转 180°）
      '<g transform="rotate(180 78 104)">' +
      '<text x="78" y="104" font-size="17" font-weight="700" fill="' + color + '" text-anchor="middle" font-family="Arial,Helvetica,sans-serif">' + rank + '</text>' +
      '<text x="78" y="120" font-size="15" text-anchor="middle" fill="' + color + '" font-family="Arial,sans-serif">' + suit + '</text>' +
      '</g>' +
      '</svg>'
    );
  }

  // ---------- 牌背（翻牌训练用）----------
  function cardBack(opts) {
    opts = opts || {};
    const cls = 'card-face card-back' + (opts.small ? ' small' : '');
    return (
      '<svg class="' + cls + '" viewBox="0 0 90 126" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="牌背">' +
      '<rect x="2.5" y="2.5" width="85" height="121" rx="9" fill="#2563eb" stroke="#1e40af" stroke-width="2.5"/>' +
      '<rect x="9" y="9" width="72" height="108" rx="6" fill="none" stroke="#93c5fd" stroke-width="1.6"/>' +
      '<g fill="#93c5fd" opacity=".75">' +
      '<circle cx="30" cy="40" r="4"/><circle cx="60" cy="40" r="4"/>' +
      '<circle cx="45" cy="63" r="4"/>' +
      '<circle cx="30" cy="86" r="4"/><circle cx="60" cy="86" r="4"/>' +
      '</g></svg>'
    );
  }

  // ---------- 数字桩视觉：优先 AI 图（豆包生成，按 id 命名）→ svg 兜底 → emoji 基线 → 文字 ----------
  function pegVisual(item, setId) {
    setId = setId || 'main';
    const data = window.BT.data || {};
    const imgMap = (data.pegImages && data.pegImages[setId]) || {};
    const emoMap = (data.pegEmoji && data.pegEmoji[setId]) || {};
    const cands = (item && item.imgs) || imgMap[item.id]; // 显式候选（人物牌）或按 id 查表
    const emo = emoMap[item.id] || '';
    if (cands) {
      const arr = Array.isArray(cands) ? cands : [cands];
      // 尝试第一候选；失败由全局 error 监听顺次降级到下一候选，最后回退 emoji/文字
      return (
        '<span class="peg-visual peg-img-wrap">' +
        '<img class="peg-img" src="' + arr[0] + '" alt="' + item.peg + '" ' +
        'data-cands="' + arr.join('|') + '" data-emoji="' + emo + '" data-text="' + item.peg + '"></span>'
      );
    }
    if (emo) return '<span class="peg-visual peg-emoji">' + emo + '</span>';
    return '<span class="peg-visual peg-text">' + item.peg + '</span>';
  }

  // 全局捕获图片加载失败 → 顺次尝试下一候选，全失败再降级为 emoji/文字（error 不冒泡，需 capture）
  document.addEventListener('error', function (e) {
    const t = e.target;
    if (t && t.classList && t.classList.contains('peg-img')) {
      const cands = (t.getAttribute('data-cands') || '').split('|');
      const cur = t.getAttribute('src');
      const idx = cands.indexOf(cur);
      if (idx >= 0 && idx < cands.length - 1) {
        t.setAttribute('src', cands[idx + 1]); // 试下一候选（如 png 缺则回退 svg）
        return;
      }
      const emo = t.getAttribute('data-emoji') || '';
      const txt = t.getAttribute('data-text') || '';
      const span = document.createElement('span');
      span.className = 'peg-visual ' + (emo ? 'peg-emoji' : 'peg-text');
      span.textContent = emo || txt;
      if (t.parentNode) t.parentNode.replaceChild(span, t);
    }
  }, true);

  window.BT.ui.cardFace = cardFace;
  window.BT.ui.cardBack = cardBack;
  window.BT.ui.pegVisual = pegVisual;
})();
