import Kit from './kit.js';
import { tdSymbol } from './fundamentals.js';

/* ── Aandeel Checker · datalaag ─────────────────────────────────────────────
   Bronnen, in volgorde:
   1. Stooq (gratis, geen sleutel, CORS-open) — werkt voor de meeste thuisgebruikers
   2. Twelve Data (gratis sleutel, VS + EU, CORS-open)
   3. Alpha Vantage (gratis sleutel, vooral VS, CORS-open)
   4. Deterministische demodata — de app opent altijd in werkende staat */

const NAMES = {
  AAPL: 'Apple Inc.', MSFT: 'Microsoft Corp.', NVDA: 'NVIDIA Corp.',
  AMZN: 'Amazon.com Inc.', GOOGL: 'Alphabet Inc. Class A', META: 'Meta Platforms Inc.',
  TSLA: 'Tesla Inc.', ASML: 'ASML Holding NV', AMD: 'Advanced Micro Devices',
  AVGO: 'Broadcom Inc.', NFLX: 'Netflix Inc.', INTC: 'Intel Corp.',
  CRM: 'Salesforce Inc.', ORCL: 'Oracle Corp.', ADBE: 'Adobe Inc.',
  QCOM: 'Qualcomm Inc.', TXN: 'Texas Instruments', PLTR: 'Palantir Technologies',
  JPM: 'JPMorgan Chase & Co.', V: 'Visa Inc.', KO: 'Coca-Cola Co.',
  DIS: 'Walt Disney Co.', NKE: 'Nike Inc.', SHEL: 'Shell plc', IBM: 'IBM Corp.',
};

export function toStooq(sym) {
  sym = String(sym).trim().toLowerCase();
  return sym.includes('.') ? sym : sym + '.us';
}
export const shortSymbol = sym => sym.toUpperCase().replace(/\.US$/, '');
export function currencyOf(sym) {
  if (sym.endsWith('.us')) return '$';
  if (/\.(as|nl|de|fr|at|be|ie|it|es|pt|fi|gr|pa|br|ls|mi|mc)$/.test(sym)) return '€';
  if (/\.(uk|l)$/.test(sym)) return '£';
  if (sym.endsWith('.sw')) return 'CHF ';
  if (/\.(st|co|he)$/.test(sym)) return 'kr ';
  if (sym.endsWith('.jp')) return '¥';
  return '';
}

/* ── deterministische offline reeks (7 jaar) ── */
function seedFrom(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function genHistory(sym) {
  const rng = Kit.rng(seedFrom(sym));
  const days = 1760, out = [];
  let price = 30 + rng() * 260;
  const drift = (rng() - 0.42) * 0.003;
  let d = new Date(Date.now() - days * 1.46 * 864e5);
  while (out.length < days) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      price = Math.max(2, price * (1 + drift + (rng() - 0.5) * 0.036));
      out.push({ date: d.toISOString().slice(0, 10), close: +price.toFixed(2), volume: Math.round(1e6 * (0.5 + rng() * 3)) });
    }
    d = new Date(d.getTime() + 864e5);
  }
  return out;
}

async function get(url, ms = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error('http ' + res.status);
    return await res.text();
  } finally { clearTimeout(t); }
}

/* ── bron 1: Stooq dag-CSV ── */
async function fetchStooq(sym) {
  const end = new Date(), start = new Date(end.getTime() - 2600 * 864e5);
  const p = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const text = await get(`https://stooq.com/q/d/l/?s=${sym}&d1=${p(start)}&d2=${p(end)}&i=d`);
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 60 || !/^\d{4}-\d{2}-\d{2}/.test(lines[1] || '')) throw new Error('geen csv');
  const rows = lines.slice(1).map(l => l.split(','))
    .filter(a => a.length >= 5 && a[4] && a[4] !== '0')
    .map(a => ({ date: a[0], close: +a[4], volume: +a[5] || 0 }))
    .filter(r => isFinite(r.close) && r.close > 0);
  if (rows.length < 60) throw new Error('te weinig rijen');
  return rows;
}

/* ── bron 2: Twelve Data (eigen gratis sleutel, VS + EU) ── */
async function fetchTwelveData(sym, key) {
  const r = await tdSymbol(sym, key);
  const q = `symbol=${encodeURIComponent(r.symbol)}${r.exchange ? '&exchange=' + encodeURIComponent(r.exchange) : ''}`;
  const json = await get(`https://api.twelvedata.com/time_series?${q}&interval=1day&outputsize=1760&order=ASC&apikey=${encodeURIComponent(key)}`, 12000)
    .then(t => JSON.parse(t));
  if (json.status === 'error' || !json.values) throw new Error(json.message || 'geen data');
  const rows = json.values
    .map(v => ({ date: v.datetime.slice(0, 10), close: +v.close, volume: +v.volume || 0 }))
    .filter(x => isFinite(x.close) && x.close > 0);
  if (rows.length < 60) throw new Error('te weinig rijen');
  return rows;
}

/* ── bron 3: Alpha Vantage (eigen gratis sleutel) ── */
async function fetchAlphaVantage(sym, key) {
  const avSym = sym.toUpperCase().replace(/\.US$/, '');
  const text = await get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(avSym)}&outputsize=full&apikey=${encodeURIComponent(key)}`, 12000);
  const json = JSON.parse(text);
  const ts = json['Time Series (Daily)'];
  if (!ts) throw new Error(json['Note'] || json['Information'] || 'geen data');
  const rows = Object.entries(ts)
    .map(([date, v]) => ({ date, close: +v['4. close'], volume: +v['5. volume'] || 0 }))
    .filter(r => isFinite(r.close) && r.close > 0)
    .sort((a, b) => a.date < b.date ? -1 : 1)
    .slice(-1760);
  if (rows.length < 60) throw new Error('te weinig rijen');
  return rows;
}

/* ── analyse: waar de drie checks op draaien ── */
const sma = (arr, n) => arr.length >= n ? arr.slice(-n).reduce((a, r) => a + r.close, 0) / n : null;

function analyze(sym, hist, source) {
  const last = hist[hist.length - 1], prev = hist[hist.length - 2] || last;
  const price = last.close;
  const chg = prev.close ? (price - prev.close) / prev.close * 100 : 0;

  const yr5 = hist.slice(-1260);
  const hi5 = Math.max(...yr5.map(r => r.close));
  const lo5 = Math.min(...yr5.map(r => r.close));
  const pos5 = hi5 > lo5 ? (price - lo5) / (hi5 - lo5) * 100 : 50;

  let peak = -Infinity, dd5 = 0;
  for (const r of yr5) {
    if (r.close > peak) peak = r.close;
    const dd = (r.close - peak) / peak * 100;
    if (dd < dd5) dd5 = dd;
  }

  const sma200 = sma(hist, 200);
  const sma200then = hist.length > 400 ? sma(hist.slice(0, -200), 200) : null;
  const slope200 = sma200 && sma200then ? (sma200 / sma200then - 1) * 100 : null;
  const ret1y = hist.length > 250 ? (price / hist[hist.length - 251].close - 1) * 100 : 0;
  const mom6 = hist.length > 126 ? (price / hist[hist.length - 127].close - 1) * 100 : 0;

  return {
    sym, short: shortSymbol(sym), name: NAMES[shortSymbol(sym)] || shortSymbol(sym),
    live: source !== 'demo', source,
    price, chg, date: last.date, volume: last.volume,
    sma200, slope200, hi5, lo5, pos5, dd5, ret1y, mom6,
    vs200: sma200 ? (price / sma200 - 1) * 100 : null,
    hist,
  };
}

export async function loadStock(inputSym, keys = {}) {
  const sym = toStooq(inputSym);
  const tries = [['stooq', () => fetchStooq(sym)]];
  if (keys.tdKey) tries.push(['twelvedata', () => fetchTwelveData(sym, keys.tdKey)]);
  if (keys.avKey) tries.push(['alphavantage', () => fetchAlphaVantage(sym, keys.avKey)]);
  for (const [source, fn] of tries) {
    try { return analyze(sym, await fn(), source); } catch (e) { /* volgende bron */ }
  }
  return analyze(sym, genHistory(sym), 'demo');
}

export const pct = (v, d = 1) => (v >= 0 ? '+' : '') + v.toFixed(d) + '%';
