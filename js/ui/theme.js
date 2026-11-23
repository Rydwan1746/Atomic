import * as S from '../core/storage.js';
export function applyTheme() {
  const t = S.load().settings.theme;
  const dark = t === 'night' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'night' : 'paper';
}
