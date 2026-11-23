const _store = {};

if (!globalThis.localStorage) {
  globalThis.localStorage = {
    getItem: k => Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null,
    setItem: (k, v) => { _store[k] = String(v); },
    removeItem: k => { delete _store[k]; },
    clear: () => { Object.keys(_store).forEach(k => delete _store[k]); }
  };
}

export function clearMockStorage() {
  if (globalThis.localStorage.clear) {
    globalThis.localStorage.clear();
  } else {
    Object.keys(_store).forEach(k => delete _store[k]);
  }
}

