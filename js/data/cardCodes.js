// 扑克牌编码（你的私人体系，2026-08-09 按你口述确定）
// 规则：花色定十位（♠1 ♥2 ♣3 ♦4），点数定个位（A=1…9=9，10=0）→ 数字牌编码 10–49，直接复用 1–100 数字桩。
//       JQK 用人物牌：J=侍卫（刘关张+赵云）/ Q=皇后（二次元女角）/ K=西游记师徒。
// 一牌一图。若日后要改，改 DEFAULT_CONFIG 或在应用内调用 BT.data.cards.applyConfig(cfg)。
window.BT = window.BT || {};
(function () {
  'use strict';

  const SUITS = ['♠', '♥', '♣', '♦']; // 黑桃 红桃 梅花 方片
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const RED_SUITS = new Set(['♥', '♦']);
  const FACE_RANKS = new Set(['J', 'Q', 'K']);

  const SUIT_META = {
    '♠': { key: 'S', name: '黑桃' },
    '♥': { key: 'H', name: '红桃' },
    '♣': { key: 'C', name: '梅花' },
    '♦': { key: 'D', name: '方片' },
  };

  // ---------- 默认配置 ----------
  const DEFAULT_CONFIG = {
    suitTens: { '♠': 1, '♥': 2, '♣': 3, '♦': 4 }, // 花色 → 十位
    tenAsZero: true,     // 10 的个位记 0（♠10 = 10）
    faceMode: 'person',  // JQK：'person' 人物牌 / 'number' 数字化
    faceDigits: { J: 7, Q: 9, K: 8 }, // faceMode='number' 时 JQK 的十位（花色落个位）
    persons: {
      // J = 侍卫：刘关张 + 赵云
      '♠J': { name: '张飞', alias: ['张飞', '翼德'], note: '黑桃黑脸 → 张飞' },
      '♥J': { name: '关羽', alias: ['关羽', '关公', '云长'], note: '红桃红脸 → 关羽' },
      '♣J': { name: '刘备', alias: ['刘备', '玄德'], note: '' },
      '♦J': { name: '赵云', alias: ['赵云', '子龙'], note: '' },
      // Q = 皇后：二次元女角
      '♠Q': { name: '朽木露琪亚', alias: ['露琪亚', '朽木露琪亚', '朽木'], note: '《死神》' },
      '♥Q': { name: '春野樱', alias: ['小樱', '春野樱', '樱'], note: '《火影忍者》' },
      '♣Q': { name: '妮可·罗宾', alias: ['罗宾', '妮可罗宾', '妮可·罗宾'], note: '《海贼王》' },
      '♦Q': { name: '井上织姬', alias: ['井上', '井上织姬', '织姬'], note: '《死神》' },
      // K = 西游记师徒
      '♠K': { name: '唐僧', alias: ['唐僧', '唐三藏', '玄奘'], note: '' },
      '♥K': { name: '孙悟空', alias: ['孙悟空', '悟空', '猴子'], note: '' },
      '♣K': { name: '猪八戒', alias: ['猪八戒', '八戒'], note: '' },
      '♦K': { name: '沙僧', alias: ['沙僧', '沙和尚', '沙悟净'], note: '' },
    },
  };

  let CONFIG = clone(DEFAULT_CONFIG);
  let CARD_NUMBERS = [];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function onesOf(rank) {
    if (rank === 'A') return 1;
    if (rank === '10') return CONFIG.tenAsZero ? 0 : 10;
    return parseInt(rank, 10);
  }

  // ---------- 构建整副牌 ----------
  function build() {
    const deck = [];
    for (const suit of SUITS) {
      const meta = SUIT_META[suit];
      const tens = CONFIG.suitTens[suit];
      for (const rank of RANKS) {
        const key = meta.key + rank;              // 'SA' 'S10' 'HQ' …（SRS 键，与编码方案无关）
        const label = suit + rank;
        const isFace = FACE_RANKS.has(rank);
        let type, n, code, person = null;
        if (isFace && CONFIG.faceMode === 'person') {
          type = 'person';
          person = CONFIG.persons[label] || { name: label, alias: [label], note: '' };
          n = null;
          code = '';
        } else if (isFace) {
          type = 'num';
          n = CONFIG.faceDigits[rank] * 10 + tens; // 数字化流派：J/Q/K 在十位，花色落个位
          code = String(n).padStart(2, '0');
        } else {
          type = 'num';
          n = tens * 10 + onesOf(rank);
          code = String(n).padStart(2, '0');
        }
        deck.push({
          suit, rank, key, label, type, n, code, person,
          num: code || (person ? person.name : ''), // 兼容旧字段
          red: RED_SUITS.has(suit),
          suitName: meta.name,
        });
      }
    }
    CARD_NUMBERS = deck;
    window.CARD_NUMBERS = deck;
    if (window.BT.data && window.BT.data.cards) window.BT.data.cards.CARD_NUMBERS = deck;
    return deck;
  }

  function applyConfig(cfg) {
    CONFIG = Object.assign(clone(DEFAULT_CONFIG), cfg || {});
    if (cfg && cfg.persons) CONFIG.persons = Object.assign(clone(DEFAULT_CONFIG.persons), cfg.persons);
    if (cfg && cfg.suitTens) CONFIG.suitTens = Object.assign(clone(DEFAULT_CONFIG.suitTens), cfg.suitTens);
    return build();
  }
  function getConfig() { return clone(CONFIG); }

  // ---------- 查询 ----------
  function findCard(suit, rank) {
    return CARD_NUMBERS.find((c) => c.suit === suit && c.rank === rank) || null;
  }
  function getCardByNum(num) {
    const n = typeof num === 'number' ? num : parseInt(String(num), 10);
    return CARD_NUMBERS.find((c) => c.type === 'num' && c.n === n) || null;
  }
  function getCardByKey(key) {
    return CARD_NUMBERS.find((c) => c.key === key) || null;
  }

  // 数字牌 → 对应的数字桩条目（1–100 主体系）；人物牌返回 null
  function getCardPeg(card, setId) {
    if (!card || card.type !== 'num') return null;
    const set = (window.PEG_SETS && (window.PEG_SETS[setId || 'main'] || window.PEG_SETS.main)) || [];
    return set.find((p) => p.id === String(card.n)) || null;
  }

  // 这张牌"脑中该出现的那个图"的文字答案：数字牌=桩物，人物牌=人物名
  function cardPegText(card) {
    if (!card) return '';
    if (card.type === 'person') return card.person.name;
    const peg = getCardPeg(card);
    return peg ? peg.peg : '?';
  }

  // 完整答案串（用于反馈展示）
  function cardAnswerText(card) {
    if (!card) return '';
    if (card.type === 'person') return card.person.name + (card.person.note ? '（' + card.person.note + '）' : '');
    return card.code + ' · ' + cardPegText(card);
  }

  // 判定用的所有可接受写法
  function cardAliases(card) {
    if (!card) return [];
    if (card.type === 'person') return (card.person.alias || []).concat([card.person.name]);
    const out = [card.code, String(card.n)];
    const peg = getCardPeg(card);
    if (peg) peg.peg.split('、').forEach((p) => out.push(p));
    return out;
  }

  // 供 BT.ui.pegVisual 渲染的 item：人物牌带图片候选（把豆包生成的图丢进 assets/cards/persons/ 即自动显示）
  function cardVisualItem(card) {
    if (!card) return { id: '?', peg: '?' };
    if (card.type === 'person') {
      return {
        id: card.key,
        peg: card.person.name,
        imgs: ['assets/cards/persons/' + card.key + '.jpg', 'assets/cards/persons/' + card.key + '.png'],
      };
    }
    return { id: String(card.n), peg: cardPegText(card) };
  }

  // SM-2 键：'C' + 牌位键（如 CSA、CHQ），与编码方案解耦
  function cardDigit(card) { return 'C' + (card && card.key ? card.key : '??'); }
  function cardLabel(card) { return card ? card.suit + card.rank : ''; }

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  build();

  // 全局导出（经典脚本，供各模块直接使用）
  window.SUITS = SUITS;
  window.RANKS = RANKS;
  window.RED_SUITS = RED_SUITS;
  window.findCard = findCard;
  window.getCardPeg = getCardPeg;
  window.getCardByNum = getCardByNum;
  window.cardDigit = cardDigit;
  window.cardLabel = cardLabel;
  window.cardPegText = cardPegText;
  window.cardAnswerText = cardAnswerText;
  window.shuffle = shuffle;

  window.BT.data = window.BT.data || {};
  window.BT.data.cards = {
    SUITS, RANKS, RED_SUITS, SUIT_META, FACE_RANKS,
    get CARD_NUMBERS() { return CARD_NUMBERS; },
    findCard, getCardByNum, getCardByKey, getCardPeg,
    cardPegText, cardAnswerText, cardAliases, cardVisualItem,
    cardDigit, cardLabel, shuffle,
    applyConfig, getConfig, DEFAULT_CONFIG,
  };
})();
