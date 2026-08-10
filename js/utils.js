// BrainTrain 共享工具函数（经典脚本全局版）
// 供各模块 IIFE 内部引用，避免在全局作用域重复声明 const/let/function。
window.BT = window.BT || {};

BT.utils = {
  DAY: 86400000,

  norm(s) {
    return (s || '').trim().toLowerCase();
  },

  shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // SM-2 间隔重复算法
  sm2(state, q) {
    let ef = state.ef ?? 2.5;
    let reps = state.reps ?? 0;
    let interval = state.interval ?? 0;
    let lapses = state.lapses ?? 0;
    if (q < 3) {
      reps = 0;
      interval = 0;
      lapses += 1;
    } else {
      if (reps === 0) interval = 1;
      else if (reps === 1) interval = 6;
      else interval = Math.round(interval * ef);
      reps += 1;
    }
    ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ef < 1.3) ef = 1.3;
    return {
      ef,
      interval,
      reps,
      lapses,
      due: Date.now() + interval * this.DAY,
      lastSeen: Date.now(),
    };
  },
};
