// 进度中心 —— 读取本地成绩，展示最近记录
window.BT = window.BT || {};
(function () {
BT.modules = BT.modules || {};

async function renderProgress(container) {
  container.innerHTML = `
    <h2 class="page-title">进度中心</h2>
    <p class="page-desc">各模块的成绩与打卡记录。</p>
    <div class="notice" id="box">读取中…</div>
    <button class="btn" onclick="location.hash='#/'">返回首页</button>
  `;
  const box = container.querySelector('#box');
  try {
    const scores = await getAllScores();
    if (!scores.length) {
      box.innerHTML = `
        <div class="empty-state">
          <div class="big-emoji">📭</div>
          <h3>还没有训练记录</h3>
          <p>完成一次训练后，这里会显示各模块的成绩曲线。</p>
          <button class="btn" onclick="location.hash='#/daily'">🔥 开始每日挑战</button>
          <button class="btn secondary" style="margin-top:10px" onclick="location.hash='#/'">返回首页</button>
        </div>
      `;
      return;
    }
    const byMod = {};
    scores.forEach((s) => { (byMod[s.module] ||= []).push(s); });
    box.innerHTML = Object.entries(byMod).map(([mod, list]) => `
      <p><strong>${mod}</strong>：最近 ${list.length} 次，最新得分 ${list[0].score}</p>
    `).join('');
  } catch (e) {
    box.innerHTML = '<p class="muted">读取失败：' + e.message + '</p>';
  }
}

BT.modules.progress = { render: renderProgress };
})();
