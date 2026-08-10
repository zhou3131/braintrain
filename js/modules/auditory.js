// 听觉记忆 —— 占位
window.BT = window.BT || {};
(function () {
BT.modules = BT.modules || {};

function renderAuditory(container) {
  container.innerHTML = `
    <h2 class="page-title">听觉记忆</h2>
    <p class="page-desc">听数字或词语序列并复述，锻炼听觉工作记忆。</p>
    <div class="notice">
      <p><strong>设计方向</strong>：Web Audio 播放数字/音节序列 → 用户复述 → 长度渐进（2 位→N 位）→ 成绩曲线。</p>
      <p class="muted">当前为占位页。</p>
    </div>
    <button class="btn" onclick="location.hash='#/'">返回首页</button>
  `;
}

BT.modules.auditory = { render: renderAuditory };
})();
