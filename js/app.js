// BrainTrain 路由与导航（经典脚本全局版）
window.BT = window.BT || {};
BT.modules = BT.modules || {};

const M = BT.modules;

const routes = {
  '':               { render: M.dashboard.render,     title: '脑力训练' },
  'number-pegs':   { render: M.numberPegs.render,    title: '记忆宫殿·数字桩' },
  'playing-cards': { render: M.playingCards.render,  title: '记忆宫殿·扑克牌' },
  'word-pegs':    { render: M.wordPegs.render,       title: '词语桩' },
  'schulte':       { render: M.schulte.render,        title: '舒尔特方格' },
  'focus':         { render: M.focus.render,          title: '专注力' },
  'auditory':      { render: M.auditory.render,       title: '听觉记忆' },
  'visual':        { render: M.visual.render,         title: '视觉记忆' },
  'progress':      { render: M.progress.render,       title: '进度中心' },
  'daily':         { render: M.daily.render,           title: '每日挑战' },
  'location-pegs': { render: M.locationPegs.render,    title: '千桩训练' }
};

const app = document.getElementById('app');
const backBtn = document.getElementById('backBtn');
const bottomNav = document.getElementById('bottomNav');

function router() {
  const key = (location.hash || '#/').slice(2); // 去掉 '#/'
  const route = routes[key] || routes[''];
  route.render(app);
  document.title = route.title + ' · BrainTrain';
  backBtn.hidden = (key === '');
  bottomNav.querySelectorAll('a').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === key);
  });
}

backBtn.addEventListener('click', () => { location.hash = '#/'; });
window.addEventListener('hashchange', router);
router();
