// 千桩（1-1000 地点桩）训练模块
// 两个子模式：
//   1) 记桩自测：记住每个空间的 10 个固定桩点物品名（观察法 + 自测）
//   2) 实战放置：把一串待记内容（或一副牌）挂到 1000 桩点，走位回忆（记忆宫殿实战）
// 数据：BT.data.locationPegs（js/data/locationPegs.js），前 20 空间已导入原图+命名版图+10 物品清单。
// 冲突处理：预制桩与用户数字桩意象不同，custom 字段预留"逐步替换成自己熟悉的地点"。
window.BT = window.BT || {};
(function () {
  'use strict';
  const { norm, shuffle } = BT.utils;

  function LP() { return window.BT.data.locationPegs; }
  function spaces() { return LP().spaces; }

  // 全局桩点 g(1-based) → {si 空间索引, pi 点索引(0-9), space}
  function locate(g) {
    const sp = spaces();
    const si = Math.floor((g - 1) / 10);
    const pi = (g - 1) % 10;
    return { si: si, pi: pi, space: sp[si] };
  }

  let S = null;
  let ROUTE = 'pegs'; // 实战放置路线：'pegs'=千桩空间；'home'=家中17点固定路线

  // 当前路线第 i 个桩点（i 从 1 起）的位置信息
  function currentLocation(i) {
    if (ROUTE === 'home') {
      const locs = window.DEFAULT_LOCATIONS || [];
      const name = locs[i - 1] || ('家中地点' + i);
      return { head: name, img: '', pegName: '' };
    }
    const loc = locate(i);
    const pegName = loc.space ? loc.space.items[loc.pi] : '';
    const head = loc.space ? (loc.space.num + '·' + pegName) : ('桩点' + i);
    const img = loc.space ? loc.space.orig : '';
    return { head, img, pegName };
  }

  // ---------------- 入口：模式选择 ----------------
  async function render(container) {
    const total = spaces().length;
    container.innerHTML = `
      <section class="module">
        <h2>千桩训练 · 1-1000 地点桩</h2>
        <p class="hint">把 <strong>100 个数字</strong>对应到 <strong>100 个空间</strong>，每空间 <strong>10 个固定桩点</strong>，共 1000 个记忆位置。已导入 ${total} 个空间（原图+命名版图+10 物品清单）。</p>
        <div class="warn-tip">⚠️ <strong>编号区分</strong>：本「千桩」是<strong>预制·数字谐音体系</strong>——两位数 <code>00–99</code>（如 <code>01</code>=椅/龙椅、<code>02</code>=鹅）；与你「数字桩」主体系（单数字 <code>1</code>=树、<code>2</code>=鹅…，私人意象）是<strong>两套独立意象，互不覆盖</strong>。预制空间可逐步用「自定义」替换成你自己的熟悉地点。</div>
        <div class="science-tip">
          📌 来源：无咎菩提《高清1000地点桩》。记忆法：①观察法（看图标 10 点）→ ②串联法（编故事）→ ③专业法（快速扑克联结）。空间起点在左下、顺时针排列。桩点可逐步替换成你自己的熟悉地点。
        </div>
        <div class="grid two">
          <button class="card select-mode" id="lp-mode-mem">
            <div class="emoji">🧭</div><h3>记桩自测</h3>
            <p>记住每个空间的 10 个桩点物品名</p>
          </button>
          <button class="card select-mode" id="lp-mode-place">
            <div class="emoji">📦</div><h3>实战放置</h3>
            <p>把一串待记内容挂到 1000 桩点走位回忆</p>
          </button>
        </div>
        <div id="lp-arena"></div>
      </section>`;
    document.getElementById('lp-mode-mem').onclick = () => renderMemSetup(container);
    document.getElementById('lp-mode-place').onclick = () => renderPlaceSetup(container);
    // 从词语桩「实战放置」跳转而来：自动进入放置设置并默认选词库
    const prefill = await kvGet('lp_words_prefill');
    if (prefill) { await kvSet('lp_words_prefill', null); renderPlaceSetup(container, 'words'); }
  }

  // ---------------- 模式 A：记桩自测 ----------------
  function renderMemSetup(container) {
    const sp = spaces();
    const opts = sp.map((s) => `<option value="${s.num}">空间 ${s.num} · ${s.theme}</option>`).join('');
    const arena = document.getElementById('lp-arena');
    arena.innerHTML = `
      <div class="card">
        <h3>记桩自测设置</h3>
        <label>练习空间
          <select id="lp-space">
            <option value="__random__">随机抽一个空间</option>
            ${opts}
          </select>
        </label>
        <label>图片版本
          <select id="lp-ver">
            <option value="named">命名版（图上标 10 物品，学用）</option>
            <option value="orig">原图（纯场景，自己找 10 点）</option>
          </select>
        </label>
        <label>自测顺序
          <select id="lp-order">
            <option value="seq">按 1→10 顺序</option>
            <option value="shuffle">乱序（期望困难）</option>
          </select>
        </label>
        <div class="row"><button id="lp-mem-start" class="primary">开始</button></div>
      </div>
      <div id="lp-mem-arena"></div>`;
    document.getElementById('lp-mem-start').onclick = () => {
      const spaceNum = document.getElementById('lp-space').value;
      const ver = document.getElementById('lp-ver').value;
      const order = document.getElementById('lp-order').value;
      startMem(container, spaceNum, ver, order);
    };
  }

  function startMem(container, spaceNum, ver, order) {
    const sp = spaces();
    let space = spaceNum === '__random__' ? sp[Math.floor(Math.random() * sp.length)] : sp.find((s) => s.num === spaceNum);
    const items = (space.custom && space.customItems && space.customItems.length === 10) ? space.customItems : space.items;
    const theme = (space.custom && space.customTheme) ? space.customTheme : space.theme;
    const orderArr = order === 'shuffle' ? shuffle([...Array(10).keys()]) : [...Array(10).keys()];
    S = { mode: 'mem', space, theme, items, ver, orderArr, idx: 0, correct: 0, phase: 'study', start: Date.now() };
    memStudy(container);
  }

  function memStudy(container) {
    const arena = document.getElementById('lp-mem-arena');
    const s = S.space;
    arena.innerHTML = `
      <div class="card">
        <h3>空间 ${s.num} · ${S.theme}</h3>
        <p class="muted">观察这张图，记住 <strong>10 个桩点</strong>（起点左下、顺时针）。先看命名版熟悉，再自测。</p>
        <div class="lp-img-wrap"><img class="lp-img" src="${s.named}" alt="${S.theme}" onerror="this.style.display='none'"></div>
        <ol class="lp-items">${S.items.map((it, i) => `<li><b>${i + 1}.</b> ${it}</li>`).join('')}</ol>
        <div class="row"><button id="lp-mem-go" class="primary">进入自测 →</button></div>
      </div>`;
    document.getElementById('lp-mem-go').onclick = () => memQuiz(container);
  }

  function memQuiz(container) { S.phase = 'quiz'; memRenderQ(container); }

  function memRenderQ(container) {
    const arena = document.getElementById('lp-mem-arena');
    const oi = S.orderArr[S.idx];
    const item = S.items[oi];
    const total = S.orderArr.length;
    const useOrig = S.ver === 'orig';
    arena.innerHTML = `
      <div class="card arena">
        <div class="progress-line">自测 ${S.idx + 1} / ${total} 个桩点</div>
        <div class="lp-img-wrap"><img class="lp-img" src="${useOrig ? S.space.orig : S.space.named}" alt="${S.theme}" onerror="this.style.display='none'"></div>
        <div class="sub">第 <strong>${oi + 1}</strong> 个桩点（${useOrig ? '看原图找位置' : '看图回忆'}）是什么物品？</div>
        <input id="lp-mem-input" type="text" placeholder="输入物品名" autocomplete="off">
        <div class="row">
          <button id="lp-mem-submit" class="primary">提交</button>
          <button id="lp-mem-reveal" class="ghost">显示答案</button>
        </div>
        <div id="lp-mem-fb"></div>
      </div>`;
    const input = document.getElementById('lp-mem-input');
    input.focus();
    input.onkeydown = (e) => { if (e.key === 'Enter') memAnswer(container, input.value, false); };
    document.getElementById('lp-mem-submit').onclick = () => memAnswer(container, input.value, false);
    document.getElementById('lp-mem-reveal').onclick = () => memAnswer(container, input.value, true);
  }

  function memAnswer(container, val, revealed) {
    const oi = S.orderArr[S.idx];
    const item = S.items[oi];
    const correct = !revealed && (norm(item).indexOf(norm(val)) >= 0 || norm(val).indexOf(norm(item)) >= 0) && norm(val).length > 0;
    if (correct) S.correct++;
    const fb = document.getElementById('lp-mem-fb');
    const last = S.idx + 1 >= S.orderArr.length;
    fb.innerHTML = (correct ? `<div class="ok">✓ 正确：${item}</div>` : `<div class="bad">✗ 正确答案：${item}</div>`)
      + `<div class="muted" style="font-size:12px;margin-top:6px">${last ? '即将查看总结…' : '即将进入下一题…'}</div>`;
    // 确认即跳题：自动进入下一题，无需再点按钮
    if (S._advancing) return;
    S._advancing = true;
    setTimeout(() => {
      S._advancing = false;
      S.idx++;
      if (last) memSummary(container); else memRenderQ(container);
    }, last ? 500 : 700);
  }

  function memSummary(container) {
    const arena = document.getElementById('lp-mem-arena');
    const total = S.orderArr.length;
    const acc = Math.round((S.correct / total) * 100);
    const sec = ((Date.now() - S.start) / 1000).toFixed(1);
    addScore('locationPegs_mem', { score: acc, detail: { space: S.space.num, acc, sec: parseFloat(sec) } });
    arena.innerHTML = `<div class="card">
      <h3>本轮完成</h3>
      <div class="overview">
        <div class="stat"><span>${S.correct}/${total}</span><label>正确</label></div>
        <div class="stat"><span>${acc}%</span><label>准确率</label></div>
        <div class="stat"><span>${sec}s</span><label>用时</label></div>
      </div>
      <div class="science-tip">下次可换<strong>乱序自测</strong>，或挑一个还没记熟的空间。坚持用观察法+串联法，约 6 周可见明显进步。</div>
      <div class="row">
        <button id="lp-mem-again" class="primary">再来一个空间</button>
        <button id="lp-mem-back" class="ghost">返回</button>
      </div>
    </div>`;
    document.getElementById('lp-mem-again').onclick = () => renderMemSetup(container);
    document.getElementById('lp-mem-back').onclick = () => render(container);
  }

  // ---------------- 模式 B：实战放置 ----------------
  // M3 难度阶梯：长度档位 + 解锁（连续 2 次≥80% 解锁下一档 [PLACEHOLDER·阈值]）
  const TIERS = [
    { key: 'short', label: '短', n: 5 },
    { key: 'mid', label: '中', n: 10 },
    { key: 'long', label: '长', n: 20 },
    { key: 'epic', label: '史诗', n: 30 }
  ];
  let keyHandler = null;
  function bindKeys(fn) {
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = fn ? (e) => fn(e) : null;
    if (keyHandler) document.addEventListener('keydown', keyHandler);
  }

  async function renderPlaceSetup(container, defaultSrc, defaultTier) {
    const arena = document.getElementById('lp-arena');
    const maxPegs = spaces().length * 10;
    const src = defaultSrc || 'text';
    const wordsCount = (window.BT.data.wordPegs || []).length;
    const vocabSize = (window.BT.data.vocabLib || { size: 0 }).size;
    const unlock = (await kvGet('lp_tier_unlock')) || 1; // 默认解锁到「中」
    const tier = (typeof defaultTier === 'number' && defaultTier <= unlock) ? defaultTier : Math.min(unlock, TIERS.length - 1);
    const tierOpts = TIERS.map((t, i) => {
      const locked = i > unlock;
      return `<option value="${i}" ${i === tier ? 'selected' : ''} ${locked ? 'disabled' : ''}>${t.label}（${t.n} 个）${locked ? ' · 未解锁' : ''}</option>`;
    }).join('');
    arena.innerHTML = `
      <div class="card">
        <h3>实战放置设置</h3>
        <p class="muted">把一串待记内容按顺序挂到固定路线。已导入 ${maxPegs} 个千桩空间点（前 ${spaces().length} 空间）有图；也可选「家中 17 点路线」免记桩直接练路径法。</p>
        <div class="route-select">
          <div class="route-tabs">
            <div class="route-tab ${ROUTE === 'pegs' ? 'active' : ''}" data-route="pegs">🗺️ 千桩空间<small>已记的 1-1000 地点桩</small></div>
            <div class="route-tab ${ROUTE === 'home' ? 'active' : ''}" data-route="home">🏠 家中路线<small>门口/沙发/床…17 点固定路线</small></div>
          </div>
        </div>
        <label>内容来源
          <select id="lp-src">
            <option value="text" ${src === 'text' ? 'selected' : ''}>手动输入（每行一个）</option>
            <option value="words" ${src === 'words' ? 'selected' : ''}>导入词语桩词库（${wordsCount} 个词）</option>
            <option value="vocab" ${src === 'vocab' ? 'selected' : ''}>词汇库（${vocabSize} 个短词随机抽取）</option>
            <option value="cards">导入一副扑克牌（52 张）</option>
            <option value="rndnum">随机数字</option>
          </select>
        </label>
        <textarea id="lp-text" rows="6" placeholder="每行一个要记的内容，如：&#10;苹果&#10;北京&#10;圆周率3.14" ${src !== 'text' ? 'disabled' : ''}>${src === 'text' ? '' : ''}</textarea>
        <label>序列长度（难度阶梯 M3）
          <select id="lp-tier">${tierOpts}</select>
        </label>
        <label>回忆顺序
          <select id="lp-porder">
            <option value="seq">沿路线顺序</option>
            <option value="shuffle">乱序（期望困难）</option>
          </select>
        </label>
        <div class="row"><button id="lp-place-start" class="primary">开始放置</button></div>
      </div>
      <div id="lp-place-arena"></div>`;
    arena.querySelectorAll('.route-tab').forEach((t) => {
      t.onclick = () => { ROUTE = t.dataset.route; renderPlaceSetup(container, src, tier); };
    });
    const srcSel = document.getElementById('lp-src');
    const txt = document.getElementById('lp-text');
    const tierSel = document.getElementById('lp-tier');
    srcSel.onchange = () => { txt.disabled = srcSel.value !== 'text'; };
    document.getElementById('lp-place-start').onclick = () => {
      const s = srcSel.value;
      const tierIdx = parseInt(tierSel.value, 10) || 0;
      let n = TIERS[tierIdx].n;
      if (ROUTE === 'home') n = Math.min(n, (window.DEFAULT_LOCATIONS || []).length); // 家中路线只有 17 点
      let items = [];
      if (s === 'text') {
        items = txt.value.split('\n').map((x) => x.trim()).filter(Boolean);
        if (items.length > n) items = items.slice(0, n);
      } else if (s === 'words') {
        items = shuffle((window.BT.data.wordPegs || []).map((w) => w.word)).slice(0, n);
      } else if (s === 'vocab') {
        items = (window.BT.data.vocabLib || { sample: () => [] }).sample(n);
      } else if (s === 'cards') {
        items = shuffle((window.CARD_NUMBERS || []).map((c) => window.cardLabel(c))).slice(0, n);
      } else {
        items = Array.from({ length: n }, () => String(Math.floor(Math.random() * 100)));
      }
      if (!items.length) { alert('请输入要记的内容'); return; }
      startPlace(container, items, document.getElementById('lp-porder').value, tierIdx);
    };
  }

  function startPlace(container, items, orderMode, tierIdx) {
    S = { mode: 'place', items, placeOrder: orderMode, tierIdx: tierIdx || 0, idx: 0, correct: 0, combo: 0, maxCombo: 0, score: 0, phase: 'study', start: Date.now() };
    placeStudy(container);
  }

  function placeStudy(container) {
    const arena = document.getElementById('lp-place-arena');
    const total = S.items.length;
    arena.innerHTML = `
      <div class="card">
        <h3>摆放阶段：把内容挂到桩点</h3>
        <p class="muted">逐点把右侧内容"挂"到左侧桩点（空间图 + 物品名作为位置锚）。每个桩点只放一个鲜明图像（Crovitz：每桩约 4 项即过载）。</p>
        <div class="study-grid">
          ${S.items.map((it, i) => {
            const loc = currentLocation(i + 1);
            return `<div class="study-row">
              <div class="loc">${i + 1}. ${loc.head}</div>
              <div class="item"><div class="item-label">${it}</div></div>
            </div>`;
          }).join('')}
        </div>
        <div class="row"><button id="lp-place-go" class="primary">我挂好了，开始回忆 →</button></div>
      </div>`;
    document.getElementById('lp-place-go').onclick = () => placeQuizSetup(container);
  }

  function placeQuizSetup(container) {
    S.phase = 'quiz';
    S.order = S.placeOrder === 'shuffle' ? shuffle([...Array(S.items.length).keys()]) : [...Array(S.items.length).keys()];
    S.idx = 0;
    placeRenderQ(container);
  }

  // 实战放置 · 翻卡自评（修 Enter 连击 bug + 确认即跳题，无二次确认）
  function placeRenderQ(container) {
    const arena = document.getElementById('lp-place-arena');
    const oi = S.order[S.idx];
    const loc = currentLocation(oi + 1);
    const content = S.items[oi];
    const total = S.order.length;
    S.qStart = Date.now(); // 局内计时起点（M2 速度奖）
    arena.innerHTML = `
      <div class="card arena">
        <div class="progress-line">回忆 ${S.idx + 1} / ${total} 个桩点</div>
        ${S.combo > 1 ? `<div class="combo-badge">🔥 连击 ${S.combo}</div>` : ''}
        ${loc.img ? `<div class="lp-img-wrap"><img class="lp-img" src="${loc.img}" alt="" onerror="this.style.display='none'"></div>` : ''}
        <div class="big-prompt loc-prompt">📍 ${ROUTE === 'home' ? '家中' : '空间'} ${loc.head}</div>
        <div class="sub">脑中回想：这个位置你放了什么？</div>
        <div class="flip-wrap" id="lp-flip">
          <div class="flip-inner">
            <div class="flip-face flip-front"><div class="flip-hint">点此翻牌核对</div></div>
            <div class="flip-face flip-back"><div class="reveal-content">${content}</div></div>
          </div>
        </div>
        <div class="row"><button id="lp-flipbtn" class="primary">翻牌核对（空格）</button></div>
        <div id="lp-fb"></div>
      </div>`;
    const wrap = document.getElementById('lp-flip');
    const btn = document.getElementById('lp-flipbtn');
    let flipped = false;
    const doFlip = () => {
      if (flipped) return;
      flipped = true;
      wrap.classList.add('flipped');
      btn.remove();
      const fb = document.getElementById('lp-fb');
      fb.innerHTML = `<div class="judge-tip">刚才脑中的内容对上了吗？</div>
        <div class="judge-row">
          <button class="judge ok" data-q="5"><b>1</b> 秒答对</button>
          <button class="judge mid" data-q="3"><b>2</b> 想了一下</button>
          <button class="judge bad" data-q="1"><b>3</b> 没想起 / 错了</button>
        </div>`;
      fb.querySelectorAll('.judge').forEach((b) => { b.onclick = () => placeJudge(container, oi, parseInt(b.dataset.q, 10)); });
      bindKeys((e) => {
        if (e.key === '1') placeJudge(container, oi, 5);
        else if (e.key === '2') placeJudge(container, oi, 3);
        else if (e.key === '3') placeJudge(container, oi, 1);
      });
    };
    wrap.onclick = doFlip;
    btn.onclick = doFlip;
    bindKeys((e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); doFlip(); } });
  }

  // 自评即跳下一题（无"下一个"按钮，满足"确认后直接跳到下一题"）
  function placeJudge(container, oi, q) {
    bindKeys(null);
    const content = S.items[oi];
    const correct = q >= 3;
    if (correct) {
      S.correct++;
      S.combo++;
      if (S.combo > S.maxCombo) S.maxCombo = S.combo;
      // M2 计分：基础 100；"秒答对"且 3 秒内 +50 速度奖 [PLACEHOLDER·阈值需 playtest]
      let gain = 100;
      const dt = (Date.now() - (S.qStart || Date.now())) / 1000;
      if (q === 5 && dt <= 3.0) gain += 50;
      S.score += gain;
    } else {
      S.combo = 0; // 断连不扣分（P3 零惩罚失败）
    }
    S.idx++;
    const last = S.idx >= S.order.length;
    if (last) placeSummary(container);
    else placeRenderQ(container);
  }

  async function placeSummary(container) {
    const arena = document.getElementById('lp-place-arena');
    const total = S.order.length;
    const acc = Math.round((S.correct / total) * 100);
    const sec = ((Date.now() - S.start) / 1000).toFixed(1);
    addScore('locationPegs_place', { score: acc, detail: { count: total, acc, sec: parseFloat(sec), score: S.score, maxCombo: S.maxCombo, tier: S.tierIdx } });
    // M3 解锁：当前档连续 2 次 ≥80% 解锁下一档 [PLACEHOLDER·阈值与次数]
    let unlockMsg = '';
    if (acc >= 80) {
      const ui = S.tierIdx;
      let st = await kvGet('lp_tier_streak');
      st = (st && st.tier === ui) ? { tier: ui, count: st.count + 1 } : { tier: ui, count: 1 };
      if (st.count >= 2 && ui < TIERS.length - 1) {
        const unlocked = Math.max((await kvGet('lp_tier_unlock')) || 1, ui + 1);
        await kvSet('lp_tier_unlock', unlocked);
        st = { tier: ui + 1, count: 0 };
        unlockMsg = `<div class="unlock-tip">🎉 解锁了「${TIERS[ui + 1].label}」难度（连续 2 次 ≥80%）！</div>`;
      }
      await kvSet('lp_tier_streak', st);
    }
    const perfect = S.correct === total;
    const finalScore = perfect ? Math.round(S.score * 1.5) : S.score; // [PLACEHOLDER] 满准确率 ×1.5
    arena.innerHTML = `<div class="card">
      <h3>本轮完成${perfect ? ' · 全中！' : ''}</h3>
      ${unlockMsg}
      <div class="overview">
        <div class="stat"><span>${S.correct}/${total}</span><label>正确</label></div>
        <div class="stat"><span>${acc}%</span><label>准确率</label></div>
        <div class="stat"><span>${sec}s</span><label>用时</label></div>
        <div class="stat"><span>${finalScore}</span><label>得分${perfect ? ' (×1.5)' : ''}</label></div>
        <div class="stat"><span>🔥${S.maxCombo}</span><label>最高连击</label></div>
      </div>
      <div class="science-tip">记忆宫殿对<strong>有序材料</strong>效果最强；乱序回忆属"期望困难"(Bjork)更能固化。下一步可把这份内容换成你真正要背的清单。</div>
      <div class="row">
        <button id="lp-place-again" class="primary">再来一轮</button>
        <button id="lp-place-back" class="ghost">返回</button>
      </div>
    </div>`;
    document.getElementById('lp-place-again').onclick = () => renderPlaceSetup(container, null, S.tierIdx);
    document.getElementById('lp-place-back').onclick = () => render(container);
  }

  BT.modules = BT.modules || {};
  BT.modules.locationPegs = { render };
})();
