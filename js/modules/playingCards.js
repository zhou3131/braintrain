// 记忆宫殿·扑克牌 训练模块
// 编码：花色定十位（♠1 ♥2 ♣3 ♦4）+ 点数定个位（A=1…9=9，10=0）→ 10–49 复用数字桩；JQK 用人物牌。
// 作答方式：① 翻牌自评（脑中想 → 翻牌核对 → 一键自评，默认）② 选项模式 ③ 打字（保留）
window.BT = window.BT || {};
(function () {
'use strict';
const { norm, shuffle, sm2 } = BT.utils;
const C = BT.data.cards;

let S = null;      // 当前 session
let keyHandler = null;

function bindKeys(fn) {
  if (keyHandler) document.removeEventListener('keydown', keyHandler);
  keyHandler = fn ? (e) => fn(e) : null;
  if (keyHandler) document.addEventListener('keydown', keyHandler);
}

// ---------- 牌池 ----------
function scopePool(scope) {
  const all = C.CARD_NUMBERS;
  if (scope === 'numbers') return all.filter((c) => c.type === 'num');
  if (scope === 'faces') return all.filter((c) => c.type === 'person');
  return all;
}

// ---------- 设置页 ----------
async function render(container) {
  const cfg = (await kvGet('pc_config')) || {};
  const mode = cfg.mode || 'forward';
  const answer = cfg.answer || 'flip';
  const scope = cfg.scope || 'all';
  const count = cfg.count || 12;
  const optionCount = cfg.optionCount || 4;
  const useSRS = cfg.useSRS !== false;

  container.innerHTML = `
    <section class="module">
      <h2>记忆宫殿 · 扑克牌</h2>
      <p class="hint">你的编码：<strong>花色定十位</strong>（♠1 ♥2 ♣3 ♦4）+ <strong>点数定个位</strong>（A=1…9=9，10=0）→ 数字牌落在 <strong>10–49</strong>，直接调用你的数字桩；<strong>JQK 走人物牌</strong>。训练时<strong>看花色就联想对应人物</strong>（熟悉花色比记名字更重要）——所以界面只放大花色，不剧透人物名。一牌一图。</p>
      <div class="science-tip">
        📌 检索练习（retrieval practice）的效果来自"<strong>先努力想起来</strong>"，不来自打字。
        所以默认用<strong>翻牌自评</strong>：脑中出图 → 翻牌核对 → 一键判定，软件照样记录哪张错了。
      </div>
      <div id="pc-overview" class="overview">加载进度…</div>

      <div class="card">
        <h3>训练设置</h3>
        <label>题型
          <select id="pc-mode">
            <option value="forward" ${mode === 'forward' ? 'selected' : ''}>牌面 → 图像（编码/人物）</option>
            <option value="reverse" ${mode === 'reverse' ? 'selected' : ''}>图像 → 牌面（反向）</option>
            <option value="sequence" ${mode === 'sequence' ? 'selected' : ''}>串联复述（整段牌序）</option>
          </select>
        </label>
        <label>作答方式
          <select id="pc-answer">
            <option value="flip" ${answer === 'flip' ? 'selected' : ''}>翻牌自评（推荐，不打字）</option>
            <option value="choice" ${answer === 'choice' ? 'selected' : ''}>选项模式（点选）</option>
            <option value="type" ${answer === 'type' ? 'selected' : ''}>打字输入</option>
          </select>
        </label>
        <label>练习范围
          <select id="pc-scope">
            <option value="all" ${scope === 'all' ? 'selected' : ''}>全部 52 张</option>
            <option value="numbers" ${scope === 'numbers' ? 'selected' : ''}>只练数字牌（40 张）</option>
            <option value="faces" ${scope === 'faces' ? 'selected' : ''}>只练人物牌 JQK（12 张）</option>
          </select>
        </label>
        <label>每轮张数
          <input id="pc-count" type="number" min="3" max="52" value="${count}">
        </label>
        <label>选项个数
          <select id="pc-optcount">
            <option value="4" ${optionCount === 4 ? 'selected' : ''}>4 个</option>
            <option value="6" ${optionCount === 6 ? 'selected' : ''}>6 个</option>
          </select>
        </label>
        <label class="check"><input id="pc-srs" type="checkbox" ${useSRS ? 'checked' : ''}> 启用间隔重复（优先弱项牌）</label>
        <div class="row">
          <button id="pc-start" class="primary">开始训练</button>
          <button id="pc-weak" class="ghost">只练我的弱项</button>
          <button id="pc-table" class="ghost">查看我的编码表</button>
        </div>
      </div>

      <div id="pc-table-box"></div>
      <div id="pc-arena"></div>
    </section>`;

  loadOverview(document.getElementById('pc-overview'));

  const readCfg = () => ({
    mode: document.getElementById('pc-mode').value,
    answer: document.getElementById('pc-answer').value,
    scope: document.getElementById('pc-scope').value,
    count: parseInt(document.getElementById('pc-count').value, 10) || 12,
    optionCount: parseInt(document.getElementById('pc-optcount').value, 10) || 4,
    useSRS: document.getElementById('pc-srs').checked,
  });

  document.getElementById('pc-start').onclick = async () => {
    const c = readCfg();
    await kvSet('pc_config', c);
    if (c.mode === 'sequence') startSequence(container, c);
    else startSession(container, c, false);
  };
  document.getElementById('pc-weak').onclick = async () => {
    const c = readCfg();
    await kvSet('pc_config', c);
    if (c.mode === 'sequence') startSequence(container, c);
    else startSession(container, { ...c, useSRS: true }, true);
  };
  document.getElementById('pc-table').onclick = () => toggleTable();
}

function toggleTable() {
  const box = document.getElementById('pc-table-box');
  if (box.innerHTML) { box.innerHTML = ''; return; }
  const rows = C.SUITS.map((s) => {
    const tds = C.RANKS.map((r) => {
      const c = C.findCard(s, r);
      const v = c.type === 'person' ? c.person.name : c.code;
      return `<td class="${c.type === 'person' ? 'person' : ''}">${v}</td>`;
    }).join('');
    return `<tr><th>${s} ${C.SUIT_META[s].name}=${C.getConfig().suitTens[s]}</th>${tds}</tr>`;
  }).join('');
  box.innerHTML = `<div class="card">
    <h3>我的扑克编码表</h3>
    <div class="table-scroll"><table class="code-table">
      <tr><th>花色\\点数</th>${C.RANKS.map((r) => `<th>${r}</th>`).join('')}</tr>
      ${rows}
    </table></div>
    <p class="muted">数字牌 10–49 直接复用你的 1–100 数字桩图；JQK 12 张为人物牌，图片可放到
      <code>assets/cards/persons/SJ.png</code> 这样的路径（S/H/C/D + J/Q/K），放了就自动显示。</p>
  </div>`;
}

async function loadOverview(el) {
  if (!el) return;
  try {
    const [scores, states] = await Promise.all([getScores('playingCards', 3000), getAllPegState()]);
    const cards = states.filter((s) => String(s.digit || '').startsWith('C') && s.setId === 'cards');
    const today0 = new Date(); today0.setHours(0, 0, 0, 0);
    const todayCount = scores.filter((s) => s.ts >= today0.getTime()).length;
    const due = cards.filter((s) => (s.due || 0) <= Date.now()).length;
    el.innerHTML = `
      <div class="stat"><span>${todayCount}</span><label>今日题量</label></div>
      <div class="stat"><span>${cards.length}</span><label>已练牌</label></div>
      <div class="stat"><span>${due}</span><label>待复习</label></div>
      <div class="stat"><span>52</span><label>总牌数</label></div>`;
  } catch (e) {
    el.textContent = '进度读取失败：' + e.message;
  }
}

// ---------- 出题队列（已修：每组内部都打乱，杜绝固定从 ♠A 开始）----------
function buildQueue(cards, cfg, stateMap, weakOnly) {
  const now = Date.now();
  let pool;
  if (weakOnly) {
    pool = cards.filter((c) => {
      const st = stateMap.get(C.cardDigit(c));
      return !st || (st.due || 0) <= now || (st.lapses || 0) > 0 || (st.reps || 0) < 2;
    });
    if (pool.length === 0) pool = cards.slice();
    pool = shuffle(pool);
  } else if (cfg.useSRS) {
    const due = shuffle(cards.filter((c) => { const st = stateMap.get(C.cardDigit(c)); return st && (st.due || 0) <= now; }));
    const fresh = shuffle(cards.filter((c) => !stateMap.has(C.cardDigit(c))));
    const rest = shuffle(cards.filter((c) => { const st = stateMap.get(C.cardDigit(c)); return st && (st.due || 0) > now; }));
    pool = [...due, ...fresh, ...rest];
  } else {
    pool = shuffle(cards);
  }
  const n = Math.min(cfg.count || 12, pool.length || cards.length);
  const q = [];
  for (let i = 0; i < n; i++) q.push({ card: pool[i % pool.length], mode: cfg.mode });
  return q;
}

async function startSession(container, cfg, weakOnly) {
  const states = await getAllPegState();
  const stateMap = new Map(states.map((s) => [s.digit, s]));
  const pool = scopePool(cfg.scope);
  const queue = buildQueue(pool, cfg, stateMap, weakOnly);
  S = { queue, idx: 0, correct: 0, start: Date.now(), cfg, stateMap, weakOnly, pool };
  renderQuestion(container);
}

// ---------- 干扰项：同花色 / 同点数 / 编码近邻，最容易混的先来 ----------
function pickDistractors(card, pool, k) {
  const same = pool.filter((c) => c.type === card.type && c.key !== card.key);
  const bySuit = shuffle(same.filter((c) => c.suit === card.suit));
  const byRank = shuffle(same.filter((c) => c.rank === card.rank));
  const near = card.type === 'num'
    ? shuffle(same.filter((c) => c.type === 'num' && Math.abs(c.n - card.n) <= 3))
    : [];
  const seen = new Set([card.key]);
  const out = [];
  const push = (arr, max) => {
    let added = 0;
    for (const c of arr) {
      if (out.length >= k || added >= max) break;
      if (seen.has(c.key)) continue;
      seen.add(c.key); out.push(c); added++;
    }
  };
  push(byRank, 1); push(near, 2); push(bySuit, 2); push(shuffle(same), k);
  return out.slice(0, k);
}

// ---------- 一道题的三要素 ----------
function questionSpec(cur) {
  const card = cur.card;
  const item = C.cardVisualItem(card);
  function suitTenText(suit) {
    const t = C.getConfig().suitTens[suit];
    return t !== undefined ? '（十位 ' + t + '）' : '';
  }
  if (cur.mode === 'reverse') {
    return {
      promptHTML: `<div class="peg-prompt">${BT.ui.pegVisual(item, 'main')}</div>`,
      sub: '这个图像是哪张牌？',
      answerHTML: `<div class="reveal-card">${BT.ui.cardFace(card)}</div>
                   <div class="ans-text">${C.cardLabel(card)} · ${C.cardAnswerText(card)}</div>`,
      visualHTML: `<div class="reveal-card">${BT.ui.cardFace(card)}</div>`,
      optionKind: 'card',
    };
  }
  if (cur.mode === 'seq') {
    return {
      promptHTML: `<div class="seq-num">第 ${cur.pos} 张</div>`,
      sub: '按顺序回忆：这一站是哪张牌？',
      answerHTML: `<div class="reveal-card">${BT.ui.cardFace(card)}</div>
                   <div class="ans-text">${C.cardLabel(card)} · ${C.cardAnswerText(card)}</div>`,
      visualHTML: `<div class="reveal-card">${BT.ui.cardFace(card)}</div>`,
      optionKind: 'card',
    };
  }
  return {
    promptHTML: `<div class="reveal-card">${BT.ui.cardFace(card)}</div>`,
    sub: card.type === 'person' ? '看花色 ♠♥♣♦ 联想：这张牌对应谁？' : '它的编码和桩图是什么？',
    answerHTML: card.type === 'person'
      ? `<div class="suit-big ${card.red ? 'red' : ''}">${card.suit}</div>
         <div class="suit-cap">${card.suitName}${suitTenText(card.suit)}</div>
         <div class="suit-person">联想人物：${card.person.name}${card.person.note ? '（' + card.person.note + '）' : ''}</div>`
      : `<div class="peg-prompt">${BT.ui.pegVisual(item, 'main')}</div>
         <div class="ans-text">${C.cardAnswerText(card)}</div>`,
    visualHTML: card.type === 'person'
      ? `<div class="suit-big ${card.red ? 'red' : ''}">${card.suit}</div>`
      : `<div class="peg-prompt">${BT.ui.pegVisual(item, 'main')}</div>`,
    optionKind: 'answer',
  };
}

function optionLabel(card, kind) {
  if (kind === 'card') return BT.ui.cardFace(card, { small: true }) + `<span class="opt-cap">${C.cardLabel(card)}</span>`;
  return card.type === 'person'
    ? `<span class="opt-suit ${card.red ? 'red' : ''}">${card.suit}</span><span class="opt-cap">${card.suitName} ${card.rank}</span>`
    : `<span class="opt-txt"><b>${card.code}</b> ${C.cardPegText(card)}</span>`;
}

function renderQuestion(container) {
  const cur = S.queue[S.idx];
  const arena = document.getElementById('pc-arena');
  const total = S.queue.length;
  const spec = questionSpec(cur);
  const way = S.cfg.answer || 'flip';

  let bodyHTML = '';
  if (way === 'flip') {
    bodyHTML = `
      <div class="flip-wrap" id="pc-flip">
        <div class="flip-inner">
          <div class="flip-face flip-front">${spec.promptHTML}</div>
          <div class="flip-face flip-back">${spec.answerHTML}</div>
        </div>
      </div>
      <div class="row"><button id="pc-flipbtn" class="primary">翻牌核对（空格）</button></div>`;
  } else if (way === 'choice') {
    const k = (S.cfg.optionCount || 4) - 1;
    const opts = shuffle([cur.card, ...pickDistractors(cur.card, S.pool.length > 6 ? S.pool : C.CARD_NUMBERS, k)]);
    cur._opts = opts;
    bodyHTML = `
      <div class="q-prompt">${spec.promptHTML}</div>
      <div class="opt-grid ${spec.optionKind === 'card' ? 'opt-cards' : ''}">
        ${opts.map((c, i) => `<button class="opt-btn" data-key="${c.key}"><span class="opt-idx">${i + 1}</span>${optionLabel(c, spec.optionKind)}</button>`).join('')}
      </div>`;
  } else {
    bodyHTML = `
      <div class="q-prompt">${spec.promptHTML}</div>
      <input id="pc-input" type="text" placeholder="输入答案…" autocomplete="off">
      <div class="row">
        <button id="pc-submit" class="primary">提交</button>
        <button id="pc-reveal" class="ghost">直接看答案</button>
      </div>`;
  }

  arena.innerHTML = `
    <div class="card arena">
      <div class="progress-line">第 ${S.idx + 1} / ${total} 张</div>
      <div class="sub">${spec.sub}</div>
      ${bodyHTML}
      <div id="pc-fb"></div>
    </div>`;

  if (way === 'flip') setupFlip(container, cur, spec);
  else if (way === 'choice') setupChoice(container, cur, spec);
  else setupType(container, cur, spec);
}

// —— 翻牌自评 ——
function setupFlip(container, cur, spec) {
  const wrap = document.getElementById('pc-flip');
  const btn = document.getElementById('pc-flipbtn');
  let flipped = false;
  const doFlip = () => {
    if (flipped) return;
    flipped = true;
    wrap.classList.add('flipped');
    btn.remove();
    const fb = document.getElementById('pc-fb');
    fb.innerHTML = `<div class="judge-tip">刚才脑中的图对上了吗？</div>
      <div class="judge-row">
        <button class="judge ok" data-q="5"><b>1</b> 秒答对</button>
        <button class="judge mid" data-q="3"><b>2</b> 想了一下</button>
        <button class="judge bad" data-q="1"><b>3</b> 没想起 / 错了</button>
      </div>`;
    fb.querySelectorAll('.judge').forEach((b) => {
      b.onclick = () => judge(container, cur, parseInt(b.dataset.q, 10));
    });
    bindKeys((e) => {
      if (e.key === '1') judge(container, cur, 5);
      else if (e.key === '2') judge(container, cur, 3);
      else if (e.key === '3') judge(container, cur, 1);
    });
  };
  wrap.onclick = doFlip;
  btn.onclick = doFlip;
  bindKeys((e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); doFlip(); } });
}

async function judge(container, cur, q) {
  bindKeys(null);
  const correct = q >= 3;
  await applyResult(cur, correct, q);
  next(container, cur, correct, q);
}

// —— 选项模式 ——
function setupChoice(container, cur, spec) {
  const btns = Array.from(document.querySelectorAll('.opt-btn'));
  const choose = async (key) => {
    bindKeys(null);
    btns.forEach((b) => { b.disabled = true; });
    const correct = key === cur.card.key;
    btns.forEach((b) => {
      if (b.dataset.key === cur.card.key) b.classList.add('is-right');
      else if (b.dataset.key === key && !correct) b.classList.add('is-wrong');
    });
    await applyResult(cur, correct, correct ? 4 : 1);
    next(container, cur, correct, correct ? 4 : 1);
  };
  btns.forEach((b) => { b.onclick = () => choose(b.dataset.key); });
  bindKeys((e) => {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= btns.length) choose(btns[n - 1].dataset.key);
  });
}

// —— 打字模式（保留）——
function setupType(container, cur, spec) {
  const input = document.getElementById('pc-input');
  input.focus();
  const submit = async (revealed) => {
    bindKeys(null);
    const correct = !revealed && isCorrect(cur, input.value);
    await applyResult(cur, correct, correct ? 5 : 1);
    next(container, cur, correct, correct ? 5 : 1);
  };
  input.onkeydown = (e) => { if (e.key === 'Enter') submit(false); };
  document.getElementById('pc-submit').onclick = () => submit(false);
  document.getElementById('pc-reveal').onclick = () => submit(true);
}

function isCorrect(cur, input) {
  const inp = norm(input);
  if (!inp) return false;
  if (cur.mode === 'forward') return C.cardAliases(cur.card).map(norm).includes(inp);
  // reverse / seq：答牌面，接受 "♠A" "黑桃A" "SA"
  const c = cur.card;
  const cands = [c.suit + c.rank, c.suitName + c.rank, c.key, c.suitName + '' + c.rank].map(norm);
  return cands.includes(inp);
}

async function applyResult(cur, correct, q) {
  if (correct) S.correct++;
  const digit = C.cardDigit(cur.card);
  const prev = S.stateMap.get(digit) || { digit, setId: 'cards', ef: 2.5, interval: 0, reps: 0, lapses: 0, due: 0 };
  const ns = sm2(prev, q);
  ns.digit = digit;
  ns.setId = 'cards';
  S.stateMap.set(digit, ns);
  await savePegState(ns);
  await addScore('playingCards', {
    score: correct ? 1 : 0,
    detail: { digit, card: cur.card.label, mode: cur.mode, way: S.cfg.answer, correct, q, setId: 'cards' },
  });
  if (!correct) S.wrong = (S.wrong || []).concat([cur.card.label + ' → ' + C.cardAnswerText(cur.card)]);
}

function next(container, cur, correct, q) {
  const fb = document.getElementById('pc-fb');
  const spec = questionSpec(cur);
  const head = correct
    ? `<div class="ok">✓ ${C.cardLabel(cur.card)} → ${C.cardAnswerText(cur.card)}${q === 3 ? '（记为"想了一下"，会更早再考你）' : ''}</div>`
    : `<div class="bad">✗ 正确答案：${C.cardLabel(cur.card)} → ${C.cardAnswerText(cur.card)}</div>`;
  const showAns = S.cfg.answer === 'flip' ? '' : (spec.visualHTML || '');
  const last = S.idx + 1 >= S.queue.length;
  fb.innerHTML = head + showAns + `<div class="muted" style="font-size:12px;margin-top:6px">${last ? '即将查看总结…' : '即将进入下一题…'}</div>`;
  bindKeys(null);
  if (S._advancing) return;
  S._advancing = true;
  setTimeout(() => {
    S._advancing = false;
    S.idx++;
    if (S.seq) { if (last) seqSummary(container); else renderQuestion(container); }
    else if (last) renderSummary(container);
    else renderQuestion(container);
  }, last ? 500 : 700);
}

function renderSummary(container) {
  bindKeys(null);
  const arena = document.getElementById('pc-arena');
  const total = S.queue.length;
  const acc = Math.round((S.correct / total) * 100);
  const sec = ((Date.now() - S.start) / 1000).toFixed(1);
  const wrong = S.wrong || [];
  arena.innerHTML = `<div class="card">
    <h3>本轮完成</h3>
    <div class="overview">
      <div class="stat"><span>${S.correct}/${total}</span><label>正确</label></div>
      <div class="stat"><span>${acc}%</span><label>准确率</label></div>
      <div class="stat"><span>${sec}s</span><label>用时</label></div>
    </div>
    ${wrong.length ? `<div class="wrong-list"><h4>这轮错的（已排进优先复习）</h4><ul>${wrong.map((w) => `<li>${w}</li>`).join('')}</ul></div>` : '<p class="muted">全对，这批牌会推到更长的复习间隔。</p>'}
    <div class="row">
      <button id="pc-again" class="primary">再来一轮</button>
      <button id="pc-weak2" class="ghost">只练刚才的弱项</button>
      <button id="pc-back" class="ghost">返回设置</button>
    </div>
  </div>`;
  document.getElementById('pc-again').onclick = () => startSession(container, S.cfg, S.weakOnly);
  document.getElementById('pc-weak2').onclick = () => startSession(container, { ...S.cfg, useSRS: true }, true);
  document.getElementById('pc-back').onclick = () => render(container);
  loadOverview(document.getElementById('pc-overview'));
}

// ---------- 串联复述（整段牌序）----------
async function startSequence(container, cfg) {
  const states = await getAllPegState();
  const stateMap = new Map(states.map((s) => [s.digit, s]));
  const pool = scopePool(cfg.scope);
  const cards = shuffle(pool).slice(0, Math.min(cfg.count || 12, pool.length));
  S = {
    seq: true, cfg, stateMap, pool,
    queue: cards.map((c, i) => ({ card: c, mode: 'seq', pos: i + 1 })),
    idx: 0, correct: 0, start: Date.now(), cards,
  };
  studySequence(container);
}

function studySequence(container) {
  const arena = document.getElementById('pc-arena');
  arena.innerHTML = `
    <div class="card">
      <h3>串联复述：先记住这 ${S.cards.length} 张牌的顺序</h3>
      <p class="muted">每张牌先变成它的图（数字牌=桩图，人物牌=人物），沿路线依次串成动作链。记熟后开始复述。</p>
      <div class="study-grid cards2">
        ${S.cards.map((c, i) => `
          <div class="study-row">
            <div class="loc">${i + 1}</div>
            <div class="item ${c.red ? 'red' : ''}">
              ${BT.ui.cardFace(c, { small: true })}
              <div class="item-label">${C.cardLabel(c)}${c.type === 'num' ? ' · ' + c.code : ''}</div>
              <div class="item-peg">${BT.ui.pegVisual(C.cardVisualItem(c), 'main')}</div>
              <div class="item-label">${C.cardPegText(c)}</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="row"><button id="pc-recall" class="primary">开始复述 →</button></div>
    </div>`;
  document.getElementById('pc-recall').onclick = () => renderQuestion(container);
}

function seqSummary(container) {
  bindKeys(null);
  const arena = document.getElementById('pc-arena');
  const total = S.queue.length;
  const acc = Math.round((S.correct / total) * 100);
  const sec = ((Date.now() - S.start) / 1000).toFixed(1);
  addScore('playingCards', { score: acc, detail: { mode: 'sequence', length: total, acc, sec: parseFloat(sec) } });
  arena.innerHTML = `<div class="card">
    <h3>本轮完成</h3>
    <div class="overview">
      <div class="stat"><span>${S.correct}/${total}</span><label>正确</label></div>
      <div class="stat"><span>${acc}%</span><label>准确率</label></div>
      <div class="stat"><span>${sec}s</span><label>用时</label></div>
    </div>
    <div class="row">
      <button id="pc-again" class="primary">再来一轮</button>
      <button id="pc-back" class="ghost">返回设置</button>
    </div>
  </div>`;
  document.getElementById('pc-again').onclick = () => startSequence(container, S.cfg);
  document.getElementById('pc-back').onclick = () => render(container);
}

BT.modules = BT.modules || {};
BT.modules.playingCards = { render };
})();
