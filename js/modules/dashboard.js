// 首页：模块卡片网格
window.BT = window.BT || {};
(function () {
BT.modules = BT.modules || {};

const MODULES = [
  { route: 'number-pegs',   emoji: '🔢', title: '记忆宫殿·数字桩', desc: '用你的数字桩表做随机回忆训练', status: 'live' },
  { route: 'playing-cards', emoji: '🃏', title: '记忆宫殿·扑克牌', desc: '牌→数字→桩图，主动回忆+间隔重复', status: 'live' },
  { route: 'word-pegs',     emoji: '📝', title: '词语桩',           desc: '词语→图像转换，融合六种通用记忆法', status: 'live' },
  { route: 'schulte',       emoji: '🔲', title: '舒尔特方格',       desc: '顺序点击，提升视觉搜索与专注', status: 'live' },
  { route: 'focus',         emoji: '🎯', title: '专注力',           desc: '持续注意与抗干扰训练', status: 'soon' },
  { route: 'auditory',      emoji: '👂', title: '听觉记忆',         desc: '听数字/词语序列并复述', status: 'soon' },
  { route: 'visual',        emoji: '👁️', title: '视觉记忆',         desc: '闪现图形/位置并回忆', status: 'soon' },
  { route: 'daily',         emoji: '🔥', title: '每日挑战',         desc: '每天一份固定随机局，连打卡攒连续天数', status: 'live' },
  { route: 'progress',      emoji: '📈', title: '进度中心',         desc: '各模块成绩曲线与打卡', status: 'live' },
  { route: 'location-pegs', emoji: '🗺️', title: '千桩训练',       desc: '1-1000 地点桩：记桩自测+实战放置', status: 'live' }
];

function renderDashboard(container) {
  container.innerHTML = `
    <div class="hero">🧠</div>
    <h2 class="page-title center">开始今天的脑力训练</h2>
    <p class="page-desc center">选择下面的模块开始。进度自动保存在本机。</p>
    <div class="grid">
      ${MODULES.map((m) => `
        <a class="card" href="#/${m.route}">
          <div class="emoji">${m.emoji}</div>
          <h3>${m.title}</h3>
          <p>${m.desc}</p>
          <span class="badge ${m.status === 'live' ? 'live' : ''}">${m.status === 'live' ? '可体验' : '研发中'}</span>
        </a>
      `).join('')}
    </div>
    <div class="notice">
      <strong>提示</strong>：手机浏览器打开后，点菜单「添加到主屏幕」即可当 App 使用，离线也能训练。
    </div>
  `;
  maybeShowWelcome();
}

function dismissWelcome(save) {
  const el = document.getElementById('welcome-overlay');
  if (el) el.remove();
  if (save && typeof kvSet === 'function') {
    try { kvSet('seen_welcome', '1'); } catch (e) {}
  }
}

function maybeShowWelcome() {
  if (typeof kvGet !== 'function') return;
  kvGet('seen_welcome').then((seen) => {
    if (seen) return;
    const overlay = document.createElement('div');
    overlay.id = 'welcome-overlay';
    overlay.className = 'welcome-overlay';
    overlay.innerHTML = `
      <div class="welcome-card" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <div class="hero">🧠</div>
        <h2 id="welcome-title" class="page-title">欢迎来到 BrainTrain</h2>
        <p>这是一款本地运行的脑力训练 PWA：记忆宫殿数字桩、扑克牌、词语桩、千桩训练、每日挑战等模块。进度自动保存在本机，无需登录。</p>
        <p class="muted">建议从「每日挑战」开始：每天 12 个词，约 3 分钟，翻卡自评、自动跳题。</p>
        <div class="welcome-actions">
          <a class="btn" href="#/daily" id="welcome-start">🔥 开始每日挑战</a>
          <button class="btn secondary" id="welcome-later">先逛逛首页</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) dismissWelcome(true);
    });
    const start = overlay.querySelector('#welcome-start');
    start.addEventListener('click', () => dismissWelcome(true));
    overlay.querySelector('#welcome-later').addEventListener('click', () => dismissWelcome(true));
  }).catch(() => {});
}

BT.modules.dashboard = { render: renderDashboard };
})();
