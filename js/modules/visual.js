// 视觉记忆 —— 占位
window.BT = window.BT || {};
(function () {
BT.modules = BT.modules || {};

function renderVisual(container) {
  container.innerHTML = `
    <h2 class="page-title">视觉记忆</h2>
    <p class="page-desc">闪现图形或位置阵列，闭眼回忆并复原，锻炼视觉工作记忆。</p>
    <div class="notice">
      <p><strong>设计方向</strong>：网格位置闪现 → 隐藏后点选 → 图形矩阵配对 → 渐进难度。</p>
      <p class="muted">当前为占位页。</p>
    </div>
    <button class="btn" onclick="location.hash='#/'">返回首页</button>
  `;
}

BT.modules.visual = { render: renderVisual };
})();
