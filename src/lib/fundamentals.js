/* ── Fundamentals automatisch ophalen ───────────────────────────────────────
   Bronnen, in volgorde:
   1. Twelve Data (gratis sleutel) — Amerikaanse én Europese beurzen
   2. Alpha Vantage (gratis sleutel) — alleen Amerikaanse aandelen

   Geeft terug: { values, auto, est, source, name }
   - values: de velden van de checklist (ndebt, icov, fcf, pe, peMed, growth, cyc)
   - auto:   velden die rechtstreeks uit de bron komen
   - est:    velden die geschat zijn (peMed, growth, cyc) — altijd zelf controleren
   Resultaat wordt 20 uur gecachet in localStorage (spaart API-limieten). */

const CACHE_KEY = 'aandeel-fund-v1';
const SYM_KEY = 'aandeel-tdsym-v1';
const TTL = 20 * 3600 * 1000;

async function getJson(url, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error('http ' + res.status);
    return await res.json();
  } finally { clearTimeout(t); }
}

/* ── cache ── */
function readCache(sym) {
  try {
    const m = JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
    const hit = m[sym];
    if (hit && Date.now() - hit.t < TTL) return hit.data;
  } catch (e) { /* negeren */ }
  return null;
}
function writeCache(sym, data) {
  try {
    const m = JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
    m[sym] = { t: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(m));
  } catch (e) { /* negeren */ }
}

/* ── Twelve Data symbool-resolutie (VS + EU) ── */
const EX_HINT = {
  as: ['amsterdam', 'xams'], nl: ['amsterdam', 'xams'],
  de: ['xetra', 'frankfurt', 'xfra'],
  pa: ['paris', 'xpar'], fr: ['paris', 'xpar'],
  br: ['brussels', 'xbru'], be: ['brussels', 'xbru'],
  ls: ['lisbon', 'xlis'], pt: ['lisbon', 'xlis'],
  mi: ['milan', 'borsa italiana', 'xmil'], it: ['milan', 'borsa italiana', 'xmil'],
  mc: ['madrid', 'xmad'], es: ['madrid', 'xmad'],
  at: ['vienna', 'wien', 'xvie'], ie: ['dublin', 'xdub'],
  fi: ['helsinki', 'xhel'], he: ['helsinki', 'xhel'],
  l: ['london', 'xlon'], uk: ['london', 'xlon'],
  sw: ['six', 'switzerland', 'xswx'], st: ['stockholm', 'xsto'],
};

export async function tdSymbol(sym, key) {
  if (sym.endsWith('.us')) return { symbol: sym.slice(0, -3).toUpperCase(), exchange: '' };
  let cached = null;
  try { cached = (JSON.parse(localStorage.getItem(SYM_KEY)) || {})[sym]; } catch (e) { /* negeren */ }
  if (cached) return cached;

  const up = sym.toUpperCase();
  const dot = up.indexOf('.');
  const base = dot > 0 ? up.slice(0, dot) : up;
  const hints = EX_HINT[up.slice(dot + 1).toLowerCase()] || [];
  const json = await getJson(`https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(base)}&apikey=${encodeURIComponent(key)}`);
  const data = json.data || [];
  if (!data.length) throw new Error('symbool niet gevonden');
  const eq = data.filter(d => /stock|depositary/i.test(d.instrument_type || ''));
  const pool = eq.length ? eq : data;
  const hit = pool.find(d =>
    hints.some(h => ((d.exchange || '') + ' ' + (d.mic_code || '') + ' ' + (d.country || '')).toLowerCase().includes(h)));
  const pick = hit || pool[0];
  const out = { symbol: pick.symbol, exchange: pick.exchange || '' };
  try {
    const m = JSON.parse(localStorage.getItem(SYM_KEY)) || {};
    m[sym] = out;
    localStorage.setItem(SYM_KEY, JSON.stringify(m));
  } catch (e) { /* negeren */ }
  return out;
}

/* ── sector → economiegevoelig? ── */
const CYC_SECTORS = ['energy', 'basic materials', 'materials', 'industrials',
  'consumer cyclical', 'consumer discretionary', 'financial services', 'financials',
  'financial', 'real estate'];
const CYC_IND = ['auto', 'airline', 'shipping', 'marine', 'steel', 'mining',
  'semiconductor', 'bank', 'insurance', 'construction', 'oil', 'gas', 'lodging',
  'casino', 'homebuilding', 'aluminum', 'chemical', 'trucking', 'metal'];
const DEF_SECTORS = ['healthcare', 'health care', 'consumer defensive', 'utilities',
  'technology', 'communication services'];

function cyclicalOf(sector, industry) {
  const s = (sector || '').toLowerCase(), i = (industry || '').toLowerCase();
  if (CYC_IND.some(k => i.includes(k))) return 'yes';
  if (CYC_SECTORS.some(k => s.includes(k))) return 'yes';
  if (DEF_SECTORS.some(k => s.includes(k))) return 'no';
  return null;
}

/* ── gedeelde berekeningen ── */
const r1 = v => Math.round(v * 10) / 10;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function medianClose(hist) {
  const arr = hist.slice(-1260).map(p => p.close).sort((a, b) => a - b);
  return arr.length ? arr[Math.floor(arr.length / 2)] : null;
}

function epsCagr(pairs) {
  // pairs: [{date, eps}] oud → nieuw, alleen positieve eps
  const pos = pairs.filter(p => p.eps > 0);
  if (pos.length < 2) return null;
  const first = pos[0], last = pos[pos.length - 1];
  const years = Math.max(1, (new Date(last.date) - new Date(first.date)) / (365.25 * 864e5));
  if (years < 1.5) return null;
  return (Math.pow(last.eps / first.eps, 1 / years) - 1) * 100;
}

function buildValues({ pe, eps, ebitda, debt, cash, ebit, interest, fcf, growthCagr, qGrowth, sector, industry, name }, hist, source) {
  const values = {}, auto = [], est = [];

  if (pe > 0 && pe < 1000) { values.pe = String(r1(pe)); auto.push('pe'); }
  if (debt != null && cash != null && ebitda > 0) {
    values.ndebt = String(r1((debt - cash) / ebitda)); auto.push('ndebt');
  }
  if (ebit > 0 && interest > 0) { values.icov = String(r1(ebit / interest)); auto.push('icov'); }
  if (fcf != null && isFinite(fcf)) { values.fcf = fcf > 0 ? 'yes' : 'no'; auto.push('fcf'); }

  const med = hist && hist.length ? medianClose(hist) : null;
  if (med && eps > 0) {
    const pm = r1(med / eps);
    if (pm > 0 && pm < 1000) { values.peMed = String(pm); est.push('peMed'); }
  }

  let g = growthCagr;
  if (g == null && qGrowth != null && isFinite(qGrowth)) g = qGrowth * 100;
  if (g != null && isFinite(g)) { values.growth = String(Math.round(clamp(g, -10, 25))); est.push('growth'); }

  const cyc = cyclicalOf(sector, industry);
  if (cyc) { values.cyc = cyc; est.push('cyc'); }

  return { values, auto, est, source, name: name || null };
}

/* ── bron 1: Twelve Data (VS + EU) ── */
async function fetchTD(sym, key, hist) {
  const r = await tdSymbol(sym, key);
  const q = `symbol=${encodeURIComponent(r.symbol)}${r.exchange ? '&exchange=' + encodeURIComponent(r.exchange) : ''}&apikey=${encodeURIComponent(key)}`;
  const [stat, prof, inc] = await Promise.all([
    getJson(`https://api.twelvedata.com/statistics?${q}`),
    getJson(`https://api.twelvedata.com/profile?${q}`),
    getJson(`https://api.twelvedata.com/income_statement?${q}`),
  ]);
  if (stat.status === 'error') throw new Error(stat.message || 'TD fout');

  const st = stat.statistics || {};
  const vm = st.valuations_metrics || {};
  const fin = st.financials || {};
  const isTtm = fin.income_statement || {};
  const bs = fin.balance_sheet || {};
  const cf = fin.cash_flow || {};

  const annual = (inc.income_statement || []);
  const latest = annual[0] || {};
  const interest = latest.non_operating_interest && +latest.non_operating_interest.expense;

  return buildValues({
    pe: +vm.trailing_pe,
    eps: +isTtm.diluted_eps_ttm,
    ebitda: +isTtm.ebitda,
    debt: bs.total_debt_mrq != null ? +bs.total_debt_mrq : null,
    cash: bs.total_cash_mrq != null ? +bs.total_cash_mrq : null,
    ebit: +latest.ebit,
    interest: interest > 0 ? interest : null,
    fcf: cf.levered_free_cash_flow_ttm != null ? +cf.levered_free_cash_flow_ttm : null,
    growthCagr: epsCagr(annual.map(a => ({ date: a.fiscal_date, eps: +a.eps_diluted })).reverse()),
    qGrowth: isTtm.quarterly_earnings_growth_yoy != null ? +isTtm.quarterly_earnings_growth_yoy : null,
    sector: prof.sector, industry: prof.industry, name: prof.name,
  }, hist, 'twelvedata');
}

/* ── bron 2: Alpha Vantage (alleen VS) ── */
async function fetchAV(sym, key, hist) {
  const avSym = sym.toUpperCase().replace(/\.US$/, '');
  const k = '&apikey=' + encodeURIComponent(key);
  const base = 'https://www.alphavantage.co/query?function=';
  const [ov, bs, is, cf] = await Promise.all([
    getJson(`${base}OVERVIEW&symbol=${avSym}${k}`),
    getJson(`${base}BALANCE_SHEET&symbol=${avSym}${k}`),
    getJson(`${base}INCOME_STATEMENT&symbol=${avSym}${k}`),
    getJson(`${base}CASH_FLOW&symbol=${avSym}${k}`),
  ]);
  if (!ov || !ov.Symbol) throw new Error((ov && (ov.Note || ov.Information)) || 'geen data');

  const bs0 = (bs.annualReports || [])[0] || {};
  const is0 = (is.annualReports || [])[0] || {};
  const cf0 = (cf.annualReports || [])[0] || {};

  let debt = null;
  if (bs0.longTermDebt != null || bs0.shortTermDebt != null) {
    debt = (+bs0.longTermDebt || 0) + (+bs0.shortTermDebt || 0);
  } else if (bs0.shortLongTermDebtTotal != null) debt = +bs0.shortLongTermDebtTotal;
  const cash = bs0.cashAndCashEquivalentsAtCarryingValue != null
    ? +bs0.cashAndCashEquivalentsAtCarryingValue + (+bs0.shortTermInvestments || 0) : null;

  const fcf = cf0.operatingCashflow != null
    ? +cf0.operatingCashflow - (+cf0.capitalExpenditures || 0) : null;

  return buildValues({
    pe: +ov.TrailingPE || +ov.PERatio,
    eps: +ov.EPS,
    ebitda: +ov.EBITDA,
    debt, cash,
    ebit: +is0.ebit,
    interest: +is0.interestExpense > 0 ? +is0.interestExpense : null,
    fcf,
    growthCagr: epsCagr((is.annualReports || []).map(a => ({ date: a.fiscalDateEnding, eps: +a.dilutedEPS })).reverse()),
    qGrowth: ov.QuarterlyEarningsGrowthYOY != null ? +ov.QuarterlyEarningsGrowthYOY : null,
    sector: ov.Sector, industry: ov.Industry, name: ov.Name,
  }, hist, 'alphavantage');
}

/* ── publieke functie ── */
export async function fetchFundamentals(sym, keys = {}, hist = null) {
  const cached = readCache(sym);
  if (cached) return cached;

  let out = null;
  if (keys.tdKey) {
    try { out = await fetchTD(sym, keys.tdKey, hist); } catch (e) { /* volgende bron */ }
  }
  if (!out && keys.avKey && sym.endsWith('.us')) {
    try { out = await fetchAV(sym, keys.avKey, hist); } catch (e) { /* handmatig invullen */ }
  }
  if (out && Object.keys(out.values).length) writeCache(sym, out);
  return out;
}
