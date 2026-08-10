// BrainTrain 数据层（经典脚本全局版，file:// 与 http 均可用）
// 优先 IndexedDB；在 file:// 等 IndexedDB 不可用/被拦截的环境下自动降级到 localStorage。
// 同时挂到 window.store 与同名的全局函数，方便各模块直接调用（addScore / kvGet ...）。
window.BT = window.BT || {};
(function () {
  const DB_NAME = 'braintrain';
  const DB_VERSION = 2;
  const STORE_SCORES = 'scores';
  const STORE_KV = 'kv';
  const STORE_PEG = 'pegState';

  const LS = { scores: 'bt_scores', kv: 'bt_kv', peg: 'bt_peg' };
  function lsGetAll(arr) {
    try { return JSON.parse(localStorage.getItem(LS[arr]) || '[]'); } catch (e) { return []; }
  }
  function lsPut(arr, obj, keyField) {
    const all = lsGetAll(arr);
    const i = all.findIndex((x) => x[keyField] === obj[keyField]);
    if (i >= 0) all[i] = obj; else all.push(obj);
    localStorage.setItem(LS[arr], JSON.stringify(all));
  }

  let _dbPromise = null;
  let backend = null; // 'idb' | 'ls'

  function openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_SCORES)) {
            const s = db.createObjectStore(STORE_SCORES, { keyPath: 'id', autoIncrement: true });
            s.createIndex('module', 'module', { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV, { keyPath: 'key' });
          if (!db.objectStoreNames.contains(STORE_PEG)) {
            const p = db.createObjectStore(STORE_PEG, { keyPath: 'digit' });
            p.createIndex('due', 'due', { unique: false });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => { _dbPromise = null; reject(req.error); };
      } catch (err) { _dbPromise = null; reject(err); }
    });
    return _dbPromise;
  }

  async function ensureBackend() {
    if (backend) return backend;
    try {
      await openDB();
      backend = 'idb';
    } catch (e) {
      backend = 'ls';
    }
    return backend;
  }

  function tx(store, mode) {
    return openDB().then((db) => db.transaction(store, mode).objectStore(store));
  }

  // ---- 成绩 ----
  async function addScore(module, opts) {
    const o = opts || {};
    const record = { module, score: o.score || 0, detail: o.detail || {}, ts: Date.now() };
    const be = await ensureBackend();
    if (be === 'idb') {
      const store = await tx(STORE_SCORES, 'readwrite');
      await new Promise((res, rej) => {
        const r = store.add(record);
        r.onsuccess = () => { record.id = r.result; res(); };
        r.onerror = () => rej(r.error);
      });
    } else {
      const all = lsGetAll('scores');
      record.id = Date.now() + Math.random();
      all.push(record);
      localStorage.setItem(LS.scores, JSON.stringify(all));
    }
    if (window.__braintrainSync) window.__braintrainSync.push(record).catch(() => {});
    return record;
  }

  async function getScores(module, limit) {
    limit = limit || 50;
    const be = await ensureBackend();
    let out;
    if (be === 'idb') {
      const store = await tx(STORE_SCORES, 'readonly');
      out = await new Promise((res, rej) => {
        const a = [];
        const cur = store.index('module').openCursor(IDBKeyRange.only(module));
        cur.onerror = () => rej(cur.error);
        cur.onsuccess = (e) => {
          const c = e.target.result;
          if (c && a.length < limit) { a.push(c.value); c.continue(); }
          else res(a);
        };
      });
    } else {
      out = lsGetAll('scores').filter((x) => x.module === module);
    }
    return out.sort((a, b) => b.ts - a.ts);
  }

  async function getAllScores() {
    const be = await ensureBackend();
    let out;
    if (be === 'idb') {
      const store = await tx(STORE_SCORES, 'readonly');
      out = await new Promise((res, rej) => {
        const r = store.getAll();
        r.onsuccess = () => res(r.result || []);
        r.onerror = () => rej(r.error);
      });
    } else {
      out = lsGetAll('scores');
    }
    return (out || []).sort((a, b) => b.ts - a.ts);
  }

  // ---- KV（自定义桩表 / 设置）----
  async function kvGet(key) {
    const be = await ensureBackend();
    if (be === 'idb') {
      const store = await tx(STORE_KV, 'readonly');
      const r = await new Promise((res, rej) => {
        const rq = store.get(key);
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      });
      return r ? r.value : undefined;
    }
    const item = lsGetAll('kv').find((x) => x.key === key);
    return item ? item.value : undefined;
  }
  async function kvSet(key, value) {
    const be = await ensureBackend();
    if (be === 'idb') {
      const store = await tx(STORE_KV, 'readwrite');
      await new Promise((res, rej) => {
        const rq = store.put({ key, value });
        rq.onsuccess = () => res();
        rq.onerror = () => rej(rq.error);
      });
    } else {
      lsPut('kv', { key, value }, 'key');
    }
    return true;
  }

  // ---- 数字桩 per-item 记忆状态（SM-2）----
  async function getPegState(digit) {
    const be = await ensureBackend();
    if (be === 'idb') {
      const store = await tx(STORE_PEG, 'readonly');
      const r = await new Promise((res, rej) => {
        const rq = store.get(digit);
        rq.onsuccess = () => res(rq.result || null);
        rq.onerror = () => rej(rq.error);
      });
      return r;
    }
    return lsGetAll('peg').find((x) => x.digit === digit) || null;
  }
  async function getAllPegState() {
    const be = await ensureBackend();
    let out;
    if (be === 'idb') {
      const store = await tx(STORE_PEG, 'readonly');
      out = await new Promise((res, rej) => {
        const r = store.getAll();
        r.onsuccess = () => res(r.result || []);
        r.onerror = () => rej(r.error);
      });
    } else {
      out = lsGetAll('peg');
    }
    return out || [];
  }
  async function savePegState(obj) {
    const be = await ensureBackend();
    if (be === 'idb') {
      const store = await tx(STORE_PEG, 'readwrite');
      await new Promise((res, rej) => {
        const rq = store.put(obj);
        rq.onsuccess = () => res();
        rq.onerror = () => rej(rq.error);
      });
    } else {
      lsPut('peg', obj, 'digit');
    }
    return true;
  }

  const syncAdapter = {
    _impl: null,
    mount(impl) { this._impl = impl; window.__braintrainSync = impl; },
    get active() { return !!this._impl; }
  };

  const api = {
    addScore, getScores, getAllScores, kvGet, kvSet,
    getPegState, getAllPegState, savePegState, syncAdapter,
    get backend() { return backend; }
  };
  window.store = api;
  BT.store = api;
  // 暴露为同名全局，便于模块直接调用
  ['addScore', 'getScores', 'getAllScores', 'kvGet', 'kvSet', 'getPegState', 'getAllPegState', 'savePegState']
    .forEach((k) => { window[k] = api[k]; });
})();
