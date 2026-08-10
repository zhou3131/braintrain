// 每日记忆挑战（M4）· 日期种子固定局 + 连续天数 streak
// 设计：种子 = YYYYMMDD → 当天同一份随机词（人人/自己当天相同）；完成后打卡，连续天数累加。
// 自带一套精简的"翻卡自评"流程（与实战放置同源但独立，避免跨模块耦合）。
window.BT = window.BT || {};
(function () {
  'use strict';
  const { norm, shuffle } = BT.utils;

  let S = null;
  let keyHandler = null;
  function bindKeys(fn) {
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = fn ? (e) => fn(e) : null;
    if (keyHandler) document.addEventListener('keydown', keyHandler);
  }

  // 日期种子
  function ymd(d) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return '' + y + m + day;
  }
  function todayKey() { return ymd(new Date()); }
  function yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); }

  // mulberry32：可复现 PRNG（同一天同一份）
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seededShuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildDailyItems() {
    const seed = parseInt(todayKey(), 10);
    const rng = mulberry32(seed);
    const pool = (window.BT.data.vocabLib || { pool: [] }).pool;
    const picked = seededShuffle(pool, rng).slice(0, 12); // 固定 12 个
    return picked;
  }

  async function render(container) {
    const dateKey = todayKey();
    const done = await kvGet('daily_done_' + dateKey);
    const streak = (await kvGet('daily_streak')) || { date: '', count: 0 };
    const todayDone = streak.date === dateKey;
    container.innerHTML = `
      <section class="module">
        <h2>每日记忆挑战</h2>
        <p class="hint">每天一份<strong>固定随机词</strong>（种子=当天日期），用记忆宫殿走位回忆。完成即打卡，连续天数会累积。</p>
        <div class="streak-card">
          <div class="streak-num">🔥 ${streak.count}</div>
          <div class="streak-label">连续训练天数${todayDone ? '（今日已打卡 ✓）' : ''}</div>
        </div>
        <div class="card">
          <h3>${done ? '今日已完成' : '今日挑战 · ' + dateKey}</h3>
          <p class="muted">${done ? `上次成绩：${done.acc}% · 得分 ${done.score} · 用时 ${done.sec}s` : '把 12 个短词依次挂到 12 个站点，走位回忆。'}</p>
          <div class="row">
            <button id="daily-go" class="primary">${done ? '再练一次（不打卡）' : '开始今日挑战'}</button>
            ${done ? '<button id="daily-redo" class="ghost">重新打卡</button>' : ''}
          </div>
        </div>
        <div class="row"><button id="daily-back" class="ghost">返回首页</button></div>
      </section>`;
    document.getElementById('daily-go').onclick = () => startDaily(container, !done);
    if (document.getElementById('daily-redo')) document.getElementById('daily-redo').onclick = () => startDaily(container, true);
    document.getElementById('daily-back').onclick = () => { location.hash = '#/'; };
  }

  function startDaily(container, countAsDone) {
    const items = buildDailyItems();
    S = { items, idx: 0, correct: 0, combo: 0, maxCombo: 0, score: 0, start: Date.now(), countAsDone };
    studyPhase(container);
  }

  function studyPhase(container) {
    const arena = document.getElementById('app');
    const total = S.items.length;
    arena.innerHTML = `
      <div class="card">
        <h3>摆放阶段：把 12 个词挂到 12 站</h3>
        <p class="muted">逐站把右侧词"挂"到左侧站点（也可直接想象一条你熟悉的路线）。每个站点一个鲜明图像。</p>
        <div class="study-grid">
          ${S.items.map((it, i) => `
            <div class="study-row">
              <div class="loc">第 ${i + 1} 站</div>
              <div class="item"><div class="item-label">${it}</div></div>
            </div>`).join('')}
        </div>
        <div class="row"><button id="daily-go2" class="primary">我挂好了，开始回忆 →</button></div>
      </div>`;
    document.getElementById('daily-go2').onclick = () => quizSetup(container);
  }

  function quizSetup(container) {
    S.order = [...Array(S.items.length).keys()];
    S.idx = 0;
    renderQ(container);
  }

  function renderQ(container) {
    const arena = document.getElementById('app');
    const oi = S.order[S.idx];
    const content = S.items[oi];
    const total = S.order.length;
    S.qStart = Date.now();
    arena.innerHTML = `
      <div class="card arena">
        <div class="progress-line">回忆 ${S.idx + 1} / ${total} 站</div>
        ${S.combo > 1 ? `<div class="combo-badge">🔥 连击 ${S.combo}</div>` : ''}
        <div class="big-prompt loc-prompt">📍 第 ${oi + 1} 站</div>
        <div class="sub">脑中回想：这一站你挂了什么词？</div>
        <div class="flip-wrap" id="daily-flip">
          <div class="flip-inner">
            <div class="flip-face flip-front"><div class="flip-hint">点此翻牌核对</div></div>
            <div class="flip-face flip-back"><div class="reveal-content">${content}</div></div>
          </div>
        </div>
        <div class="row"><button id="daily-flipbtn" class="primary">翻牌核对（空格）</button></div>
        <div id="daily-fb"></div>
      </div>`;
    const wrap = document.getElementById('daily-flip');
    const btn = document.getElementById('daily-flipbtn');
    let flipped = false;
    const doFlip = () => {
      if (flipped) return;
      flipped = true;
      wrap.classList.add('flipped');
      btn.remove();
      const fb = document.getElementById('daily-fb');
      fb.innerHTML = `<div class="judge-tip">刚才脑中的词对上了吗？</div>
        <div class="judge-row">
          <button class="judge ok" data-q="5"><b>1</b> 秒答对</button>
          <button class="judge mid" data-q="3"><b>2</b> 想了一下</button>
          <button class="judge bad" data-q="1"><b>3</b> 没想起 / 错了</button>
        </div>`;
      fb.querySelectorAll('.judge').forEach((b) => { b.onclick = () => judge(container, oi, parseInt(b.dataset.q, 10)); });
      bindKeys((e) => {
        if (e.key === '1') judge(container, oi, 5);
        else if (e.key === '2') judge(container, oi, 3);
        else if (e.key === '3') judge(container, oi, 1);
      });
    };
    wrap.onclick = doFlip;
    btn.onclick = doFlip;
    bindKeys((e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); doFlip(); } });
  }

  function judge(container, oi, q) {
    bindKeys(null);
    const correct = q >= 3;
    if (correct) {
      S.correct++;
      S.combo++;
      if (S.combo > S.maxCombo) S.maxCombo = S.combo;
      let gain = 100;
      const dt = (Date.now() - (S.qStart || Date.now())) / 1000;
      if (q === 5 && dt <= 3.0) gain += 50; // [PLACEHOLDER] 速度奖阈值
      S.score += gain;
    } else {
      S.combo = 0;
    }
    S.idx++;
    if (S.idx >= S.order.length) summary(container);
    else renderQ(container);
  }

  async function summary(container) {
    bindKeys(null);
    const total = S.order.length;
    const acc = Math.round((S.correct / total) * 100);
    const sec = ((Date.now() - S.start) / 1000).toFixed(1);
    const perfect = S.correct === total;
    const finalScore = perfect ? Math.round(S.score * 1.5) : S.score;
    addScore('daily', { score: acc, detail: { acc, score: finalScore, sec: parseFloat(sec), maxCombo: S.maxCombo } });
    let streakHtml = '';
    if (S.countAsDone) {
      const dateKey = todayKey();
      const yKey = yesterdayKey();
      let streak = (await kvGet('daily_streak')) || { date: '', count: 0 };
      if (streak.date === dateKey) { /* 今日已计，保持 */ }
      else if (streak.date === yKey) streak = { date: dateKey, count: streak.count + 1 };
      else streak = { date: dateKey, count: 1 };
      await kvSet('daily_done_' + dateKey, { acc, score: finalScore, sec: parseFloat(sec) });
      await kvSet('daily_streak', streak);
      streakHtml = `<div class="streak-card"><div class="streak-num">🔥 ${streak.count}</div><div class="streak-label">连续训练天数（今日已打卡 ✓）</div></div>`;
    }
    const arena = document.getElementById('app');
    arena.innerHTML = `<div class="card">
      <h3>今日挑战完成${perfect ? ' · 全中！' : ''}</h3>
      ${streakHtml}
      <div class="overview">
        <div class="stat"><span>${S.correct}/${total}</span><label>正确</label></div>
        <div class="stat"><span>${acc}%</span><label>准确率</label></div>
        <div class="stat"><span>${sec}s</span><label>用时</label></div>
        <div class="stat"><span>${finalScore}</span><label>得分${perfect ? ' (×1.5)' : ''}</label></div>
        <div class="stat"><span>🔥${S.maxCombo}</span><label>最高连击</label></div>
      </div>
      <div class="science-tip">每天一份固定局，是把记忆训练变成<strong>习惯</strong>的最小成本方式。明天同一时间再来，词会换。</div>
      <div class="row">
        <button id="daily-again" class="primary">再来一次</button>
        <button id="daily-home" class="ghost">返回首页</button>
      </div>
    </div>`;
    document.getElementById('daily-again').onclick = () => startDaily(container, false);
    document.getElementById('daily-home').onclick = () => { location.hash = '#/'; };
  }

  BT.modules = BT.modules || {};
  BT.modules.daily = { render };
})();
