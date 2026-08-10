// 专注力 —— 占位
window.BT = window.BT || {};
(function () {
BT.modules = BT.modules || {};

function renderFocus(container) {
  container.innerHTML = `
    <h2 class="page-title">专注力</h2>
    <p class="page-desc">持续注意与抗干扰训练，提升大脑稳定性。</p>
    <div class="notice">
      <p><strong>设计方向</strong>：舒尔特变体、持续绩效任务（CPT）、抗干扰目标搜索等。</p>
      <p class="muted">当前为占位页，将在舒尔特方格之后实现。</p>
    </div>
    <button class="btn" onclick="location.hash='#/'">返回首页</button>
  `;
}

BT.modules.focus = { render: renderFocus };
})();
