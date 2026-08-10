// 记忆宫殿·数字桩 训练模块（Phase 1，作答方式移植自扑克模块）
// 设计依据（见知识库脑力训练规划笔记）：
//  - 主动回忆（active recall）为核心题型
//  - SM-2 间隔重复承载长期保持（Dresler 2017：约6周每日训练见效）
//  - 序列串记对应 method of loci 对有序材料强项（Crovitz 1971：每桩约4项即过载）
// 作答方式：① 翻牌自评（脑中想 → 翻牌核对 → 一键自评，默认，不打字）② 选项模式 ③ 打字（保留）
window.BT = window.BT || {};
(function () {
'use strict';
const { norm, shuffle, sm2 } = BT.utils;

let S = null;      // 当前 session
let keyHandler = null;

function bindKeys(fn) {
  if (keyHandler) document.removeEventListener('keydown', keyHandler);
  keyHandler = fn ? (e) => fn(e) : null;
  if (keyHandler) document.addEventListener('keydown', keyHandler);
}

// ---------- 设置页 ----------
async function render(container) {
  const cfg = (await kvGet('np_config')) || {};
  const setId = cfg.setId || 'main';
  const mode = cfg.mode || 'forward';
  const answer = cfg.answer || 'flip';
  const count = cfg.count || 10;
  const optionCount = cfg.optionCount || 4;
  const useSRS = cfg.useSRS !== false;

  container.innerHTML = `
    <section class="module">
      <h2>记忆宫殿 · 数字桩</h2>
      <p class="hint">把抽象数字变成脑中鲜活图像。基于你 E 盘的 1–100 数字桩表，融入间隔重复与主动回忆。</p>
      <div class="science-tip">
        📌 检索练习的效果来自"<strong>先努力想起来</strong>"，不来自打字。
        所以默认用<strong>翻牌自评</strong>：脑中出图 → 翻牌核对 → 一键判定，软件照样记录哪题错了。
      </div>
      <div id="np-overview" class="overview">加载进度…</div>

      <div class="card">
        <h3>训练设置</h3>
        <label>桩集
          <select id="np-set">
            <option value="main" ${setId === 'main' ? 'selected' : ''}>1–100 主体系</option>
            <option value="alt" ${setId === 'alt' ? 'selected' : ''}>0–11 备选小体系</option>
          </select>
        </label>
        <label>题型
          <select id="np-mode">
            <option value="forward" ${mode === 'forward' ? 'selected' : ''}>数字 → 桩（回忆图像）</option>
            <option value="reverse" ${mode === 'reverse' ? 'selected' : ''}>桩 → 数字（反向）</option>
            <option value="sequence" ${mode === 'sequence' ? 'selected' : ''}>序列串记（沿路线）</option>
            <option value="mixed" ${mode === 'mixed' ? 'selected' : ''}>混合</option>
          </select>
        </label>
        <label>作答方式
          <select id="np-answer">
            <option value="flip" ${answer === 'flip' ? 'selected' : ''}>翻牌自评（推荐，不打字）</option>
            <option value="choice" ${answer === 'choice' ? 'selected' : ''}>选项模式（点选）</option>
            <option value="type" ${answer === 'type' ? 'selected' : ''}>打字输入（保留）</option>
          </select>
        </label>
        <label>选项个数
          <select id="np-optcount">
            <option value="4" ${optionCount === 4 ? 'selected' : ''}>4 个</option>
            <option value="6" ${optionCount === 6 ? 'selected' : ''}>6 个</option>
          </select>
        </label>
        <label>每轮题数
          <input id="np-count" type="number" min="3" max="100" value="${count}">
        </label>
        <label class="check"><input id="np-srs" type="checkbox" ${useSRS ? 'checked' : ''}> 启用间隔重复（优先复习弱项）</label>
        <div class="row">
          <button id="np-start" class="primary">开始训练</button>
          <button id="np-weak" class="ghost">只练我的弱项</button>
        </div>
      </div>

      <div id="np-arena"></div>
    </section>`;

  loadOverview(document.getElementById('np-overview'));

  const readCfg = () => ({
    setId: document.getElementById('np-set').value,
    mode: document.getElementById('np-mode').value,
    answer: document.getElementById('np-answer').value,
    optionCount: parseInt(document.getElementById('np-optcount').value, 10) || 4,
    count: parseInt(document.getElementById('np-count').value, 10) || 10,
    useSRS: document.getElementById('np-srs').checked,
  });

  document.getElementById('np-start').onclick = async () => {
    const c = readCfg();
    await kvSet('np_config', c);
    startSession(container, c, false);
  };
  document.getElementById('np-weak').onclick = async () => {
    const c = readCfg();
    await kvSet('np_config', c);
    startSession(container, { ...c, useSRS: true }, true);
  };
}

async function loadOverview(el) {
  try {
    const [scores, states] = await Promise.all([
      getScores('numberPegs', 3000),
      getAllPegState(),
    ]);
    const today0 = new Date(); today0.setHours(0, 0, 0, 0);
    const todayCount = scores.filter((s) => s.ts >= today0.getTime()).length;
    const days = new Set(scores.map((s) => new Date(s.ts).toDateString()));
    let streak = 0; const d = new Date();
    while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
    const learned = states.filter((s) => s.setId === 'main').length;
    const due = states.filter((s) => (s.due || 0) <= Date.now() && s.setId === 'main').length;
    el.innerHTML = `
      <div class="stat"><span>${todayCount}</span><label>今日题量</label></div>
      <div class="stat"><span>${streak}</span><label>连续天数</label></div>
      <div class="stat"><span>${learned}</span><label>已学桩</label></div>
      <div class="stat"><span>${due}</span><label>待复习</label></div>`;
  } catch (e) {
    el.textContent = '进度读取失败：' + e.message;
  }
}

// ---------- 出题队列（每组内部都打乱，杜绝固定从 1 开始）----------
function buildQueue(set, cfg, stateMap, weakOnly) {
  const now = Date.now();
  const items = set.map((it) => ({ ...it }));
  let pool;
  if (weakOnly) {
    pool = items.filter((it) => {
      const st = stateMap.get(it.id);
      return !st || (st.due || 0) <= now || (st.lapses || 0) > 0 || (st.reps || 0) < 2;
    });
    if (pool.length === 0) pool = items.slice();
    pool = shuffle(pool);
  } else if (cfg.useSRS) {
    const due = shuffle(items.filter((it) => { const st = stateMap.get(it.id); return st && (st.due || 0) <= now; }));
    const fresh = shuffle(items.filter((it) => !stateMap.has(it.id)));
    const rest = shuffle(items.filter((it) => { const st = stateMap.get(it.id); return st && (st.due || 0) > now; }));
    pool = [...due, ...fresh, ...rest];
  } else {
    pool = shuffle(items);
  }
  const n = Math.min(cfg.count || 10, pool.length || set.length);
  const q = [];
  for (let i = 0; i < n; i++) {
    const it = pool[i % pool.length];
    let m = cfg.mode;
    if (m === 'mixed') m = i % 2 === 0 ? 'forward' : 'reverse';
    if (m === 'sequence') m = 'forward';
    q.push({ item: it, mode: m, seq: cfg.mode === 'sequence' });
  }
  return q;
}

async function startSession(container, cfg, weakOnly) {
  const set = PEG_SETS[cfg.setId] || PEG_SETS.main;
  const states = await getAllPegState();
  const stateMap = new Map(states.map((s) => [s.digit, s]));
  const queue = buildQueue(set, cfg, stateMap, weakOnly);
  if (queue.length === 0) {
    document.getElementById('np-arena').innerHTML = '<div class="card">该桩集暂无数据。</div>';
    return;
  }
  S = { queue, idx: 0, correct: 0, start: Date.now(), cfg, set, stateMap, weakOnly, wrong: [] };
  renderQuestion(container);
}

// ---------- 一道题的三要素 ----------
function questionSpec(cur) {
  const item = cur.item;
  const setId = S.cfg.setId;
  if (cur.mode === 'reverse') {
    return {
      promptHTML: `<div class="peg-prompt">${BT.ui.pegVisual(item, setId)}</div>`,
      sub: '这个图像对应哪个数字？',
      answerHTML: `<div class="seq-num">${item.id}</div><div class="ans-text">${item.peg}</div>`,
      visualHTML: `<div class="seq-num">${item.id}</div><div class="ans-text">${item.peg}</div>`,
      optionKind: 'num',
    };
  }
  // forward / sequence：数字 → 桩
  return {
    promptHTML: `<div class="seq-num">${item.id}</div>`,
    sub: '脑中回忆这个数字的桩图像',
    answerHTML: `<div class="peg-prompt">${BT.ui.pegVisual(item, setId)}</div><div class="ans-text">${item.peg}</div>`,
    visualHTML: `<div class="peg-prompt">${BT.ui.pegVisual(item, setId)}</div><div class="ans-text">${item.peg}</div>`,
    optionKind: 'peg',
  };
}

function optionLabel(item, kind, setId) {
  if (kind === 'num') return `<span class="opt-txt"><b>${item.id}</b></span>`;
  const emo = (BT.data.pegEmoji && BT.data.pegEmoji[setId] && BT.data.pegEmoji[setId][item.id]) || '';
  return `<span class="opt-emoji">${emo}</span><span class="opt-txt">${item.peg}</span>`;
}

// ---------- 干扰项：优先挑 id 相近（最容易混），再随机补充 ----------
function pickDistractors(item, k) {
  const set = PEG_SETS[S.cfg.setId] || PEG_SETS.main;
  const near = shuffle(set.filter((it) => it.id !== item.id && Math.abs(parseInt(it.id, 10) - parseInt(item.id, 10)) <= 5));
  const others = shuffle(set.filter((it) => it.id !== item.id));
  const seen = new Set([item.id]);
  const out = [];
  const push = (arr, max) => {
    let added = 0;
    for (const it of arr) {
      if (out.length >= k || added >= max) break;
      if (seen.has(it.id)) continue;
      seen.add(it.id); out.push(it); added++;
    }
  };
  push(near, 2); push(others, k);
  return out.slice(0, k);
}

function renderQuestion(container) {
  const cur = S.queue[S.idx];
  const arena = document.getElementById('np-arena');
  const total = S.queue.length;
  const spec = questionSpec(cur);
  const way = S.cfg.answer || 'flip';

  let bodyHTML = '';
  if (way === 'flip') {
    bodyHTML = `
      <div class="flip-wrap" id="np-flip">
        <div class="flip-inner">
          <div class="flip-face flip-front">${spec.promptHTML}</div>
          <div class="flip-face flip-back">${spec.answerHTML}</div>
        </div>
      </div>
      <div class="row"><button id="np-flipbtn" class="primary">翻牌核对（空格）</button></div>`;
  } else if (way === 'choice') {
    const k = (S.cfg.optionCount || 4) - 1;
    const opts = shuffle([cur.item, ...pickDistractors(cur.item, k)]);
    cur._opts = opts;
    bodyHTML = `
      <div class="q-prompt">${spec.promptHTML}</div>
      <div class="opt-grid">
        ${opts.map((it, i) => `<button class="opt-btn" data-id="${it.id}"><span class="opt-idx">${i + 1}</span>${optionLabel(it, spec.optionKind, S.cfg.setId)}</button>`).join('')}
      </div>`;
  } else {
    bodyHTML = `
      <div class="q-prompt">${spec.promptHTML}</div>
      <input id="np-input" type="text" placeholder="输入答案…" autocomplete="off">
      <div class="row">
        <button id="np-submit" class="primary">提交</button>
        <button id="np-reveal" class="ghost">直接看答案</button>
      </div>`;
  }

  arena.innerHTML = `
    <div class="card arena">
      ${cur.seq ? `<div class="seq-hint">🧠 路线串记：把这 ${total} 个数字沿你熟悉的路线依次摆放，<strong>每个位置只放一个鲜明图像</strong>（Crovitz：每桩约 4 项即过载）。</div>` : ''}
      <div class="progress-line">第 ${S.idx + 1} / ${total} 题</div>
      <div class="sub">${spec.sub}</div>
      ${bodyHTML}
      <div id="np-fb"></div>
    </div>`;

  if (way === 'flip') setupFlip(container, cur, spec);
  else if (way === 'choice') setupChoice(container, cur, spec);
  else setupType(container, cur, spec);
}

// —— 翻牌自评（不打字）——
function setupFlip(container, cur, spec) {
  const wrap = document.getElementById('np-flip');
  const btn = document.getElementById('np-flipbtn');
  let flipped = false;
  const doFlip = () => {
    if (flipped) return;
    flipped = true;
    wrap.classList.add('flipped');
    btn.remove();
    const fb = document.getElementById('np-fb');
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
  const choose = async (id) => {
    bindKeys(null);
    btns.forEach((b) => { b.disabled = true; });
    const correct = id === cur.item.id;
    btns.forEach((b) => {
      if (b.dataset.id === cur.item.id) b.classList.add('is-right');
      else if (b.dataset.id === id && !correct) b.classList.add('is-wrong');
    });
    await applyResult(cur, correct, correct ? 4 : 1);
    next(container, cur, correct, correct ? 4 : 1);
  };
  btns.forEach((b) => { b.onclick = () => choose(b.dataset.id); });
  bindKeys((e) => {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= btns.length) choose(btns[n - 1].dataset.id);
  });
}

// —— 打字模式（保留）——
function setupType(container, cur, spec) {
  const input = document.getElementById('np-input');
  input.focus();
  const submit = async (revealed) => {
    bindKeys(null);
    const correct = !revealed && isCorrect(cur, input.value);
    await applyResult(cur, correct, correct ? 5 : 1);
    next(container, cur, correct, correct ? 5 : 1);
  };
  input.onkeydown = (e) => { if (e.key === 'Enter') submit(false); };
  document.getElementById('np-submit').onclick = () => submit(false);
  document.getElementById('np-reveal').onclick = () => submit(true);
}

function isCorrect(cur, input) {
  const inp = norm(input);
  if (!inp) return false;
  if (cur.mode === 'reverse') return inp === norm(cur.item.id);
  const pegs = cur.item.peg.split('、').map((p) => norm(p));
  return pegs.includes(inp) || inp === norm(cur.item.peg);
}

async function applyResult(cur, correct, q) {
  if (correct) S.correct++;
  const prev = S.stateMap.get(cur.item.id) || {
    digit: cur.item.id, setId: S.cfg.setId, ef: 2.5, interval: 0, reps: 0, lapses: 0, due: 0,
  };
  const ns = sm2(prev, q);
  ns.digit = cur.item.id;
  ns.setId = S.cfg.setId;
  S.stateMap.set(cur.item.id, ns);
  await savePegState(ns);
  await addScore('numberPegs', {
    score: correct ? 1 : 0,
    detail: { digit: cur.item.id, mode: cur.mode, correct, q, setId: S.cfg.setId },
  });
  if (!correct) {
    const txt = cur.mode === 'reverse'
      ? `${cur.item.peg} → ${cur.item.id}`
      : `${cur.item.id} → ${cur.item.peg}`;
    S.wrong = (S.wrong || []).concat([txt]);
  }
}

function next(container, cur, correct, q) {
  const fb = document.getElementById('np-fb');
  const spec = questionSpec(cur);
  const head = correct
    ? `<div class="ok">✓ ${cur.item.id} → ${cur.item.peg}${q === 3 ? '（记为"想了一下"，会更早再考你）' : ''}</div>`
    : `<div class="bad">✗ 正确答案：${cur.item.id} → ${cur.item.peg}</div>`;
  const showAns = S.cfg.answer === 'flip' ? '' : (spec.visualHTML || '');
  const last = S.idx + 1 >= S.queue.length;
  fb.innerHTML = head + showAns + `<div class="muted" style="font-size:12px;margin-top:6px">${last ? '即将查看总结…' : '即将进入下一题…'}</div>`;
  bindKeys(null);
  if (S._advancing) return;
  S._advancing = true;
  setTimeout(() => {
    S._advancing = false;
    S.idx++;
    if (last) renderSummary(container);
    else renderQuestion(container);
  }, last ? 500 : 700);
}

function renderSummary(container) {
  bindKeys(null);
  const arena = document.getElementById('np-arena');
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
    ${wrong.length
      ? `<div class="wrong-list"><h4>这轮错的（已排进优先复习）</h4><ul>${wrong.map((w) => `<li>${w}</li>`).join('')}</ul></div>`
      : '<p class="muted">全对！这批桩会推到更长的复习间隔。</p>'}
    <div class="row">
      <button id="np-again" class="primary">再来一轮</button>
      <button id="np-weak2" class="ghost">只练刚才的弱项</button>
      <button id="np-back" class="ghost">返回设置</button>
    </div>
  </div>`;
  document.getElementById('np-again').onclick = () => startSession(container, S.cfg, false);
  document.getElementById('np-weak2').onclick = () => startSession(container, { ...S.cfg, useSRS: true }, true);
  document.getElementById('np-back').onclick = () => render(container);
  loadOverview(document.getElementById('np-overview'));
}

BT.modules = BT.modules || {};
BT.modules.numberPegs = { render };
})();
