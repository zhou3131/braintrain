// 舒尔特方格 —— 顺序点击，提升视觉搜索与专注力。
// 后续将加入随机生成、计时、分级（5×5/7×7）与成绩记录。
window.BT = window.BT || {};
(function () {
BT.modules = BT.modules || {};

function renderSchulte(container) {
  const size = 3;
  const fixed = [5, 3, 8, 1, 9, 2, 7, 4, 6];

  container.innerHTML = `
    <h2 class="page-title">舒尔特方格</h2>
    <p class="page-desc">按顺序点击 1→9。这是开发雏形，完整版将支持随机生成、计时、分级（5×5/7×7）与成绩记录。</p>
    <div class="schulte-board" id="board" style="grid-template-columns:repeat(${size},1fr)"></div>
    <p class="muted center" id="hint">下一个：1</p>
    <button class="btn secondary" id="reset">重置</button>
  `;

  const board = container.querySelector('#board');
  const hint = container.querySelector('#hint');
  let next = 1;

  function paint() {
    board.innerHTML = '';
    fixed.forEach((n) => {
      const cell = document.createElement('div');
      cell.className = 'schulte-cell' + (n < next ? ' done' : '');
      cell.textContent = n;
      cell.addEventListener('click', () => {
        if (n === next) {
          next++;
          if (next > size * size) {
            hint.textContent = '完成！🎉（完整版将记录用时）';
          } else {
            hint.textContent = '下一个：' + next;
          }
          paint();
        }
      });
      board.appendChild(cell);
    });
  }
  paint();

  container.querySelector('#reset').addEventListener('click', () => {
    next = 1;
    hint.textContent = '下一个：1';
    paint();
  });
}

BT.modules.schulte = { render: renderSchulte };
})();
