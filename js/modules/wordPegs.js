// 词语桩 · 常用词语 → 图像转换练习（经典脚本全局版）
// 与数字桩/扑克同套逻辑：① 翻牌自评（脑中出图→翻牌核对→一键自评，默认）② 选项模式 ③ 打字
// 融合网上通用记忆法：形象 / 谐音 / 关键词 / 语义 / 故事 / 路径（见 js/data/wordPegsData.js）
// 出口：把要记的词"实战放置"到千桩路线（调用 locationPegs 模块，kv 预填词表）
window.BT = window.BT || {};
(function () {
  'use strict';
  const { norm, shuffle, sm2 } = BT.utils;
  const WORDS = BT.data.wordPegs;

  let S = null;
  let keyHandler = null;

  function bindKeys(fn) {
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = fn ? (e) => fn(e) : null;
    if (keyHandler) document.addEventListener('keydown', keyHandler);
  }

  // 词图：有图用图，没图用文字描述（桩意象）
  function wordVisual(item, big) {
    if (item.img) {
      return `<img class="peg-img" src="${item.img}" alt="${item.word}" onerror="this.style.display='none'">`;
    }
    return `<div class="peg-text">${item.peg}</div>`;
  }

  // ---------------- 设置页 ----------------
  async function render(container) {
    const cfg = (await kvGet('wp_config')) || {};
    const mode = cfg.mode || 'forward';
    const answer = cfg.answer || 'flip';
    const count = cfg.count || 12;
    const optionCount = cfg.optionCount || 4;
    const useSRS = cfg.useSRS !== false;

    container.innerHTML = `
      <section class="module">
        <h2>词语桩 · 词语转图像</h2>
        <p class="hint">把<strong>常用词语</strong>变成<strong>鲜明图像</strong>——这是记忆宫殿挂物的基本功。已内置 ${WORDS.length} 个词，覆盖<strong>形象 / 谐音 / 关键词 / 语义 / 故事 / 路径</strong>六种通用记忆法。</p>
        <div class="science-tip">
          📌 词→图是"把抽象变具体"。检索练习（先努力想出图像）比死记硬背牢得多；
          熟练后可把词<strong>挂到千桩路线</strong>（下方「实战放置」），有序清单用路径法、无序清单用故事串联法。
        </div>
        <div id="wp-overview" class="overview">加载进度…</div>

        <div class="card">
          <h3>训练设置</h3>
          <label>题型
            <select id="wp-mode">
              <option value="forward" ${mode === 'forward' ? 'selected' : ''}>词 → 图像（想画面）</option>
              <option value="reverse" ${mode === 'reverse' ? 'selected' : ''}>图像 → 词（反向）</option>
            </select>
          </label>
          <label>作答方式
            <select id="wp-answer">
              <option value="flip" ${answer === 'flip' ? 'selected' : ''}>翻牌自评（推荐，不打字）</option>
              <option value="choice" ${answer === 'choice' ? 'selected' : ''}>选项模式（点选）</option>
              <option value="type" ${answer === 'type' ? 'selected' : ''}>打字输入</option>
            </select>
          </label>
          <label>每轮词数
            <input id="wp-count" type="number" min="3" max="${WORDS.length}" value="${count}">
          </label>
          <label>选项个数
            <select id="wp-optcount">
              <option value="4" ${optionCount === 4 ? 'selected' : ''}>4 个</option>
              <option value="6" ${optionCount === 6 ? 'selected' : ''}>6 个</option>
            </select>
          </label>
          <label class="check"><input id="wp-srs" type="checkbox" ${useSRS ? 'checked' : ''}> 启用间隔重复（优先弱项词）</label>
          <div class="row">
            <button id="wp-start" class="primary">开始训练</button>
            <button id="wp-weak" class="ghost">只练弱项</button>
            <button id="wp-place" class="ghost">实战放置（挂千桩路线）→</button>
          </div>
        </div>
        <div id="wp-methods" class="card">
          <h3>六类通用记忆法（数据集里已标注每词用了哪种）</h3>
          <ul class="method-list">
            <li><b>形象法</b>：直接画鲜明图像（苹果→红苹果）</li>
            <li><b>谐音法</b>：发音近似钩子（house→耗子）</li>
            <li><b>关键词法</b>：外语词→母语声似词→图（tiger→泰山上一只虎）</li>
            <li><b>语义法</b>：挂到已知比喻（自由→冲出牢笼的鸟）</li>
            <li><b>故事法</b>：无序词编荒诞故事串联</li>
            <li><b>路径法</b>：有序词钉在固定地点（→千桩路线）</li>
          </ul>
        </div>
        <div id="wp-arena"></div>
      </section>`;

    loadOverview(document.getElementById('wp-overview'));

    const readCfg = () => ({
      mode: document.getElementById('wp-mode').value,
      answer: document.getElementById('wp-answer').value,
      count: parseInt(document.getElementById('wp-count').value, 10) || 12,
      optionCount: parseInt(document.getElementById('wp-optcount').value, 10) || 4,
      useSRS: document.getElementById('wp-srs').checked,
    });

    document.getElementById('wp-start').onclick = async () => {
      const c = readCfg();
      await kvSet('wp_config', c);
      startSession(container, c, false);
    };
    document.getElementById('wp-weak').onclick = async () => {
      const c = readCfg();
      await kvSet('wp_config', c);
      startSession(container, { ...c, useSRS: true }, true);
    };
    document.getElementById('wp-place').onclick = () => goPlace(container);
  }

  // 跳到千桩实战放置，并预填词表（先 await 写完 kv 再跳转，避免竞态）
  async function goPlace(container) {
    await kvSet('lp_words_prefill', WORDS.map((w) => w.word).join('\n'));
    location.hash = '#/location-pegs';
  }

  async function loadOverview(el) {
    if (!el) return;
    try {
      const [scores, states] = await Promise.all([getScores('wordPegs', 3000), getAllPegState()]);
      const learned = states.filter((s) => String(s.digit || '').startsWith('W')).length;
      const today0 = new Date(); today0.setHours(0, 0, 0, 0);
      const todayCount = scores.filter((s) => s.ts >= today0.getTime()).length;
      el.innerHTML = `
        <div class="stat"><span>${todayCount}</span><label>今日题量</label></div>
        <div class="stat"><span>${learned}</span><label>已练词</label></div>
        <div class="stat"><span>${WORDS.length}</span><label>词库总数</label></div>`;
    } catch (e) {
      el.textContent = '进度读取失败：' + e.message;
    }
  }

  // ---------------- 出题队列（每组内部打乱，杜绝固定顺序）----------------
  function buildQueue(cfg, stateMap, weakOnly) {
    const now = Date.now();
    let pool;
    if (weakOnly) {
      pool = WORDS.filter((w) => {
        const st = stateMap.get('W' + w.id);
        return !st || (st.due || 0) <= now || (st.lapses || 0) > 0 || (st.reps || 0) < 2;
      });
      if (pool.length === 0) pool = WORDS.slice();
      pool = shuffle(pool);
    } else if (cfg.useSRS) {
      const due = shuffle(WORDS.filter((w) => { const st = stateMap.get('W' + w.id); return st && (st.due || 0) <= now; }));
      const fresh = shuffle(WORDS.filter((w) => !stateMap.has('W' + w.id)));
      const rest = shuffle(WORDS.filter((w) => { const st = stateMap.get('W' + w.id); return st && (st.due || 0) > now; }));
      pool = [...due, ...fresh, ...rest];
    } else {
      pool = shuffle(WORDS);
    }
    const n = Math.min(cfg.count || 12, pool.length || WORDS.length);
    return pool.slice(0, n).map((w) => ({ word: w, mode: cfg.mode }));
  }

  async function startSession(container, cfg, weakOnly) {
    const states = await getAllPegState();
    const stateMap = new Map(states.map((s) => [s.digit, s]));
    const queue = buildQueue(cfg, stateMap, weakOnly);
    S = { queue, idx: 0, correct: 0, start: Date.now(), cfg, stateMap, weakOnly, wrong: [] };
    renderQuestion(container);
  }

  // 干扰项：同记忆法优先（最容易混），再随机
  function pickWordDistractors(word, k) {
    const same = WORDS.filter((w) => w.id !== word.id);
    const byMethod = shuffle(same.filter((w) => w.method === word.method));
    const others = shuffle(same);
    const seen = new Set([word.id]);
    const out = [];
    const push = (arr, max) => {
      let added = 0;
      for (const w of arr) {
        if (out.length >= k || added >= max) break;
        if (seen.has(w.id)) continue;
        seen.add(w.id); out.push(w); added++;
      }
    };
    push(byMethod, 2); push(others, k);
    return out.slice(0, k);
  }

  function questionSpec(cur) {
    const w = cur.word;
    if (cur.mode === 'reverse') {
      return {
        promptHTML: `<div class="peg-prompt">${wordVisual(w)}</div>`,
        sub: '这是哪个词？（' + w.method + '法）',
        answerHTML: `<div class="big-prompt">${w.word}</div><div class="ans-text">${w.peg} · 记忆法：${w.method}</div>`,
        optionKind: 'word',
      };
    }
    return {
      promptHTML: `<div class="big-prompt">${w.word}</div><div class="method-tag">${w.method}法</div>`,
      sub: '在脑中想出它的图像（' + w.method + '法）',
      answerHTML: `<div class="peg-prompt">${wordVisual(w)}</div><div class="ans-text">${w.peg} · 提示：${w.hint}</div>`,
      optionKind: 'peg',
    };
  }

  function renderQuestion(container) {
    const cur = S.queue[S.idx];
    const arena = document.getElementById('wp-arena');
    const total = S.queue.length;
    const spec = questionSpec(cur);
    const way = S.cfg.answer || 'flip';

    let bodyHTML = '';
    if (way === 'flip') {
      bodyHTML = `
        <div class="flip-wrap" id="wp-flip">
          <div class="flip-inner">
            <div class="flip-face flip-front">${spec.promptHTML}</div>
            <div class="flip-face flip-back">${spec.answerHTML}</div>
          </div>
        </div>
        <div class="row"><button id="wp-flipbtn" class="primary">翻牌核对（空格）</button></div>`;
    } else if (way === 'choice') {
      const k = (S.cfg.optionCount || 4) - 1;
      let opts;
      if (spec.optionKind === 'word') {
        opts = shuffle([cur.word, ...pickWordDistractors(cur.word, k)]);
        cur._optWords = opts;
      } else {
        opts = shuffle([cur.word, ...pickWordDistractors(cur.word, k)]);
        cur._optWords = opts;
      }
      const labelOf = (w) => (spec.optionKind === 'word' ? `<span class="opt-txt"><b>${w.word}</b></span>` : `<span class="opt-txt">${w.peg}</span>`);
      bodyHTML = `
        <div class="q-prompt">${spec.promptHTML}</div>
        <div class="opt-grid">
          ${opts.map((w, i) => `<button class="opt-btn" data-id="${w.id}"><span class="opt-idx">${i + 1}</span>${labelOf(w)}</button>`).join('')}
        </div>`;
    } else {
      bodyHTML = `
        <div class="q-prompt">${spec.promptHTML}</div>
        <input id="wp-input" type="text" placeholder="输入图像/词…" autocomplete="off">
        <div class="row">
          <button id="wp-submit" class="primary">提交</button>
          <button id="wp-reveal" class="ghost">直接看答案</button>
        </div>`;
    }

    arena.innerHTML = `
      <div class="card arena">
        <div class="progress-line">第 ${S.idx + 1} / ${total} 个词</div>
        <div class="sub">${spec.sub}</div>
        ${bodyHTML}
        <div id="wp-fb"></div>
      </div>`;

    if (way === 'flip') setupFlip(container, cur, spec);
    else if (way === 'choice') setupChoice(container, cur, spec);
    else setupType(container, cur, spec);
  }

  // —— 翻牌自评 ——
  function setupFlip(container, cur, spec) {
    const wrap = document.getElementById('wp-flip');
    const btn = document.getElementById('wp-flipbtn');
    let flipped = false;
    const doFlip = () => {
      if (flipped) return;
      flipped = true;
      wrap.classList.add('flipped');
      btn.remove();
      const fb = document.getElementById('wp-fb');
      fb.innerHTML = `<div class="judge-tip">刚才脑中的图对上了吗？</div>
        <div class="judge-row">
          <button class="judge ok" data-q="5"><b>1</b> 秒答对</button>
          <button class="judge mid" data-q="3"><b>2</b> 想了一下</button>
          <button class="judge bad" data-q="1"><b>3</b> 没想起 / 错了</button>
        </div>`;
      fb.querySelectorAll('.judge').forEach((b) => { b.onclick = () => judge(container, cur, parseInt(b.dataset.q, 10)); });
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
    await record(container, cur, correct, q);
  }

  // —— 选项模式 ——
  function setupChoice(container, cur, spec) {
    const btns = Array.from(document.querySelectorAll('.opt-btn'));
    const correctId = cur.word.id;
    const choose = async (id) => {
      bindKeys(null);
      btns.forEach((b) => { b.disabled = true; });
      const correct = id === correctId;
      btns.forEach((b) => {
        if (b.dataset.id === correctId) b.classList.add('is-right');
        else if (b.dataset.id === id && !correct) b.classList.add('is-wrong');
      });
      await record(container, cur, correct, correct ? 4 : 1);
    };
    btns.forEach((b) => { b.onclick = () => choose(b.dataset.id); });
    bindKeys((e) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= btns.length) choose(btns[n - 1].dataset.id);
    });
  }

  // —— 打字模式 ——
  function setupType(container, cur, spec) {
    const input = document.getElementById('wp-input');
    input.focus();
    const submit = async (revealed) => {
      bindKeys(null);
      const correct = !revealed && norm(input.value).length > 0 &&
        (norm(input.value) === norm(cur.word.word) || norm(input.value).indexOf(norm(cur.word.word)) >= 0);
      await record(container, cur, correct, correct ? 5 : 1);
    };
    input.onkeydown = (e) => { if (e.key === 'Enter') submit(false); };
    document.getElementById('wp-submit').onclick = () => submit(false);
    document.getElementById('wp-reveal').onclick = () => submit(true);
  }

  async function record(container, cur, correct, q) {
    if (correct) S.correct++; else S.wrong = (S.wrong || []).concat([cur.word.word + ' → ' + cur.word.peg]);
    const digit = 'W' + cur.word.id;
    const prev = S.stateMap.get(digit) || { digit, setId: 'wordPegs', ef: 2.5, interval: 0, reps: 0, lapses: 0, due: 0 };
    const ns = sm2(prev, q);
    ns.digit = digit; ns.setId = 'wordPegs';
    S.stateMap.set(digit, ns);
    await savePegState(ns);
    await addScore('wordPegs', {
      score: correct ? 1 : 0,
      detail: { word: cur.word.word, method: cur.word.method, mode: cur.mode, way: S.cfg.answer, correct, q },
    });
    next(container, cur, correct, q);
  }

  function next(container, cur, correct, q) {
    const fb = document.getElementById('wp-fb');
    const spec = questionSpec(cur);
    const w = cur.word;
    const head = correct
      ? `<div class="ok">✓ ${w.word} → ${w.peg}${q === 3 ? '（记为"想了一下"，更早再考）' : ''}</div>`
      : `<div class="bad">✗ 正确答案：${w.word} → ${w.peg}</div>`;
    const showAns = S.cfg.answer === 'flip' ? '' : spec.answerHTML;
    const last = S.idx + 1 >= S.queue.length;
    fb.innerHTML = head + showAns + `<div class="muted" style="font-size:12px;margin-top:6px">${last ? '即将查看总结…' : '即将进入下一题…'}</div>`;
    bindKeys(null);
    if (S._advancing) return;
    S._advancing = true;
    setTimeout(() => {
      S._advancing = false;
      S.idx++;
      if (last) renderSummary(container); else renderQuestion(container);
    }, last ? 500 : 700);
  }

  function renderSummary(container) {
    bindKeys(null);
    const arena = document.getElementById('wp-arena');
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
      ${wrong.length ? `<div class="wrong-list"><h4>这轮错的（已排进优先复习）</h4><ul>${wrong.map((w) => `<li>${w}</li>`).join('')}</ul></div>` : '<p class="muted">全对，这批词会推到更长复习间隔。</p>'}
      <div class="science-tip">下一步：把要背的词<strong>实战放置</strong>到千桩路线——有序清单用<strong>路径法</strong>（按桩点顺序），无序清单用<strong>故事串联法</strong>。</div>
      <div class="row">
        <button id="wp-again" class="primary">再来一轮</button>
        <button id="wp-place2" class="ghost">实战放置（挂千桩路线）→</button>
        <button id="wp-back" class="ghost">返回设置</button>
      </div>
    </div>`;
    document.getElementById('wp-again').onclick = () => startSession(container, S.cfg, S.weakOnly);
    document.getElementById('wp-place2').onclick = () => goPlace(container);
    document.getElementById('wp-back').onclick = () => render(container);
    loadOverview(document.getElementById('wp-overview'));
  }

  BT.modules = BT.modules || {};
  BT.modules.wordPegs = { render };
})();
