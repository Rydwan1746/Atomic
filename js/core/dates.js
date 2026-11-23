const pad = n => String(n).padStart(2, '0');
export const toDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => toDate(new Date());
export const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return toDate(d); };
