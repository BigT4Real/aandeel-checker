/* ── De drie checks, rechtstreeks uit de carousel ──────────────────────────
   #1 Kan dit bedrijf omvallen?               → VEILIG / TWIJFEL / VERMIJD
   #2 Cyclisch aandeel op topwinsten kopen?   → valrisico LAAG / MIDDEN / HOOG
   #3 Te veel betalen voor een geweldig bedrijf? → REDELIJK / VOL / DUUR / TE DUUR

   Koerssignalen worden automatisch berekend. Schulden, winst en waardering
   vul je zelf in (uit elke screener) — de app verzint nooit fundamentals.
   Alle drempelwaarden zijn instelbaar via Instellingen. */

export const DEFAULT_TH = {
  ndebtDanger: 4,      // netto schuld / EBITDA gevaarlijk boven
  icovFragile: 2,      // rentedekking zwak onder
  ddWipeout: -70,      // instorting: diepste daling erger dan (%)
  offHighBroken: -60,  // gebroken: zover onder 5-jaar hoog (%)
  trendDeath: -20,     // neerwaartse spiraal: 200-daagse trend onder (%/jr)
  rangeTop: 85,        // top van 5-jaar bereik boven (%)
  extensionMax: 30,    // extreme uitbolling boven 200-daags (%)
  parabolic1y: 60,     // parabolisch 1-jaar rendement boven (%)
  trapPeDiscount: 0.7, // K/W lager dan dit deel van de mediaan = "goedkoop"
  trapRangeMin: 70,    // …én positie in bereik boven (%)
  retFair: 10,         // REDELIJK vanaf impliciet rendement (%/jr)
  retFull: 5,          // VOL vanaf (%/jr)
  horizonYears: 5,     // terugval naar mediaan binnen zoveel jaar
};

export const TH_LABELS = {
  ndebtDanger: 'Schuld / winst riskant boven (×)',
  icovFragile: 'Rente moeilijk te betalen onder (×)',
  ddWipeout: 'Koersval erger dan (%) = instorting',
  offHighBroken: 'Zover onder de top van 5 jaar (%) = afgebroken',
  trendDeath: 'Trend slechter dan (% per jaar) = blijvend dalend',
  rangeTop: 'Koers in de top van 5 jaar boven (%)',
  extensionMax: 'Te ver boven het gemiddelde (%)',
  parabolic1y: 'Stijging in 1 jaar boven (%) = overdreven',
  trapPeDiscount: 'Prijs-winst lager dan dit deel van normaal = val (0–1)',
  trapRangeMin: '…én koers hoog in het bereik boven (%)',
  retFair: 'REDELIJK vanaf opbrengst (% per jaar)',
  retFull: 'VOL vanaf opbrengst (% per jaar)',
  horizonYears: 'Prijs wordt weer normaal binnen (jaren)',
};

export const EMPTY_INPUTS = {
  ndebt: '', icov: '', fcf: '', pe: '', peMed: '', growth: '', cyc: '',
};

const num = v => (v === '' || v == null || isNaN(+v)) ? null : +v;

function toneOf(verdict) {
  if (['VEILIG', 'LAAG', 'REDELIJK'].includes(verdict)) return 'green';
  if (['TWIJFEL', 'MIDDEN', 'VOL', 'DUUR'].includes(verdict)) return 'amber';
  if (['VERMIJD', 'HOOG', 'TE DUUR'].includes(verdict)) return 'red';
  return 'grey';
}

/* ── CHECK #1 · overleving ── */
export function evalCheck1(s, inp, TH = DEFAULT_TH) {
  const rows = [];
  const reds = [];
  const push = (label, value, state, note, red) => {
    rows.push({ label, value, state, note });
    if (red) reds.push(label);
  };

  push('Grootste koersval in 5 jaar', s.dd5.toFixed(0) + '%',
    s.dd5 <= TH.ddWipeout ? 'fail' : 'pass',
    s.dd5 <= TH.ddWipeout ? 'zo’n diepe val wijst meestal op echte problemen' : 'geen totale instorting in de koershistorie',
    s.dd5 <= TH.ddWipeout);

  const offHigh = (s.price / s.hi5 - 1) * 100;
  push('Afstand tot de top van 5 jaar', offHigh.toFixed(0) + '%',
    offHigh <= TH.offHighBroken ? 'fail' : 'pass',
    offHigh <= TH.offHighBroken ? 'de markt heeft dit aandeel al afgeschreven' : 'de koers beweegt normaal ten opzichte van de top',
    offHigh <= TH.offHighBroken);

  const trendBad = s.slope200 != null && s.slope200 < TH.trendDeath;
  push('Trend op lange termijn', s.slope200 == null ? '—' : (s.slope200 >= 0 ? '+' : '') + s.slope200.toFixed(0) + '% / jr',
    s.slope200 == null ? 'na' : trendBad ? 'fail' : 'pass',
    trendBad ? 'de koers daalt al lange tijd stevig' : 'geen langdurige daling',
    trendBad);

  const ndebt = num(inp.ndebt);
  push('Schuld vergeleken met de winst', ndebt == null ? 'invullen' : ndebt.toFixed(1) + '×',
    ndebt == null ? 'na' : ndebt > TH.ndebtDanger ? 'fail' : 'pass',
    ndebt == null ? `te vinden in elke aandelenscreener — boven ${TH.ndebtDanger}× is riskant` : ndebt > TH.ndebtDanger ? 'schulden die ze misschien nooit terugbetalen' : 'de schulden zijn goed te dragen',
    ndebt != null && ndebt > TH.ndebtDanger);

  const icov = num(inp.icov);
  push('Kan het bedrijf de rente betalen?', icov == null ? 'invullen' : icov.toFixed(1) + '×',
    icov == null ? 'na' : icov < TH.icovFragile ? 'fail' : 'pass',
    icov == null ? `winst ÷ rentekosten — onder ${TH.icovFragile}× is zwak` : icov < TH.icovFragile ? 'de winst is amper genoeg voor de rente' : 'de rente is ruim te betalen',
    icov != null && icov < TH.icovFragile);

  push('Blijft er echt geld over?', inp.fcf === '' ? 'invullen' : inp.fcf === 'yes' ? 'ja' : 'nee',
    inp.fcf === '' ? 'na' : inp.fcf === 'yes' ? 'pass' : 'fail',
    inp.fcf === '' ? 'komt er meer geld binnen dan eruit gaat?' : inp.fcf === 'yes' ? 'het bedrijf betaalt zichzelf' : 'het bedrijf verbrandt geld en heeft nieuw geld nodig',
    inp.fcf === 'no');

  const manualMissing = ndebt == null && icov == null && inp.fcf === '';
  let verdict;
  if (reds.length >= 3) verdict = 'VERMIJD';
  else if (reds.length >= 1) verdict = 'TWIJFEL';
  else verdict = manualMissing ? 'TWIJFEL' : 'VEILIG';
  const note = verdict === 'VERMIJD'
    ? reds.length + ' rode vlaggen — hetzelfde resultaat: je verliest alles. Blijf weg.'
    : verdict === 'VEILIG'
      ? 'Geen alarmsignalen in koers, schuld of geldstroom.'
      : manualMissing && !reds.length
        ? 'De koershistorie ziet er goed uit — vul de schuldcijfers in om deze check af te maken.'
        : reds.join(' · ') + ' — lees eerst de jaarverslagen.';
  return { verdict, tone: toneOf(verdict), rows, redCount: reds.length };
}

/* ── CHECK #2 · cyclische topwinst-val ── */
export function evalCheck2(s, inp, TH = DEFAULT_TH) {
  const rows = [];
  const reds = [];
  const push = (label, value, state, note, red) => {
    rows.push({ label, value, state, note });
    if (red) reds.push(label);
  };

  push('Hoe hoog staat de koers in 5 jaar?', Math.round(s.pos5) + '%',
    s.pos5 >= TH.rangeTop ? 'fail' : 'pass',
    s.pos5 >= TH.rangeTop ? 'je koopt vlak onder de top — weinig ruimte omhoog' : 'niet aan de top van het bereik',
    s.pos5 >= TH.rangeTop);

  const ext = s.vs200 != null && s.vs200 > TH.extensionMax;
  push('Hoe ver boven het gemiddelde?', s.vs200 == null ? '—' : (s.vs200 >= 0 ? '+' : '') + s.vs200.toFixed(0) + '%',
    s.vs200 == null ? 'na' : ext ? 'fail' : 'pass',
    ext ? 'ver boven de normale lijn — zo ontstaan toppen' : 'geen extreme stijging boven het gemiddelde',
    ext);

  const hot = s.ret1y > TH.parabolic1y;
  push('Stijging in 1 jaar', (s.ret1y >= 0 ? '+' : '') + s.ret1y.toFixed(0) + '%',
    hot ? 'fail' : 'pass',
    hot ? 'de koers ging bijna recht omhoog — dat houdt zelden stand' : 'geen overdreven stijging',
    hot);

  const pe = num(inp.pe), peMed = num(inp.peMed);
  let trapPe = false;
  if (pe != null && peMed != null && peMed > 0) {
    trapPe = pe < TH.trapPeDiscount * peMed && s.pos5 >= TH.trapRangeMin;
    push('Is de prijs verdacht laag?', pe.toFixed(1) + '× vs ' + peMed.toFixed(1) + '×',
      trapPe ? 'fail' : 'pass',
      trapPe ? 'een “goedkope” prijs op een koerstop — de klassieke val' : 'de prijs is niet verdacht laag voor een top',
      trapPe);
  } else {
    push('Is de prijs verdacht laag?', 'invullen', 'na',
      'Een lage prijs-winstverhouding lijkt goedkoop — tot de winst instort. Vul beide cijfers in.', false);
  }

  push('Gevoelig voor de economie?', inp.cyc === '' ? 'invullen' : inp.cyc === 'yes' ? 'ja' : 'nee',
    inp.cyc === '' ? 'na' : 'pass',
    inp.cyc === ''
      ? 'grondstoffen, scheepvaart, auto’s, chemicaliën, bouw…'
      : inp.cyc === 'yes'
        ? 'dan is de winst van vandaag niet de winst voor altijd'
        : 'niet economiegevoelig — het risico op een val is kleiner',
    false);

  let verdict;
  if (inp.cyc === 'no' && reds.length === 0) verdict = 'LAAG';
  else if (reds.length >= 2) verdict = 'HOOG';
  else if (reds.length === 1) verdict = 'MIDDEN';
  else verdict = 'LAAG';
  const note = verdict === 'HOOG'
    ? 'Het risico op een val vanaf de top is reëel: ' + reds.join(' · ').toLowerCase() + '.'
    : verdict === 'MIDDEN'
      ? 'Eén waarschuwing: ' + reds[0].toLowerCase() + '. Bepaal waar de economie staat.'
      : inp.cyc === 'no'
        ? 'Niet economiegevoelig en geen topsignalen in de koers.'
        : 'Geen topsignalen — maar economiegevoelige aandelen lijken het goedkoopst vlak voordat ze instorten.';
  return { verdict, tone: toneOf(verdict), rows, redCount: reds.length };
}

/* ── CHECK #3 · waardering ── */
export function evalCheck3(s, inp, TH = DEFAULT_TH) {
  const rows = [];
  const pe = num(inp.pe), peMed = num(inp.peMed), g = num(inp.growth);
  const Y = TH.horizonYears;

  rows.push({ label: 'Koers nu', value: s.price.toFixed(2), state: 'pass', note: 'laatste slotkoers · ' + s.date });

  let verdict = 'INVULLEN', implied = null;
  if (pe == null || pe <= 0) {
    rows.push({ label: 'Prijs-winstverhouding nu', value: 'invullen', state: 'na', note: 'zoek "P/E ratio" in een aandelenscreener' });
  } else {
    rows.push({ label: 'Prijs-winstverhouding nu', value: pe.toFixed(1) + '×', state: 'pass', note: 'hoeveel je betaalt voor elke euro winst' });
  }
  if (peMed == null || peMed <= 0) {
    rows.push({ label: 'Normale prijs-winst (afgelopen 5 jaar)', value: 'invullen', state: 'na', note: 'wat beleggers normaal betalen' });
  } else {
    rows.push({ label: 'Normale prijs-winst (afgelopen 5 jaar)', value: peMed.toFixed(1) + '×', state: 'pass', note: 'waar de prijs normaal naartoe terugvalt' });
  }
  if (g == null) {
    rows.push({ label: 'Verwachte winstgroei', value: 'invullen', state: 'na', note: '% per jaar — wees voorzichtig met schatten' });
  } else {
    rows.push({ label: 'Verwachte winstgroei', value: g.toFixed(0) + '% / jr', state: 'pass', note: 'jouw eigen inschatting' });
  }

  if (pe != null && pe > 0 && peMed != null && peMed > 0 && g != null) {
    const factor = Math.pow(1 + g / 100, Y) * (peMed / pe);
    implied = (Math.pow(factor, 1 / Y) - 1) * 100;
    rows.push({
      label: 'Verwachte opbrengst per jaar', value: (implied >= 0 ? '+' : '') + implied.toFixed(1) + '%',
      state: implied >= TH.retFair ? 'pass' : implied >= 0 ? 'na' : 'fail',
      note: `als de groei uitkomt en de prijs binnen ${Y} jaar weer normaal wordt`,
    });
    verdict = implied >= TH.retFair ? 'REDELIJK' : implied >= TH.retFull ? 'VOL' : implied >= 0 ? 'DUUR' : 'TE DUUR';
  }

  const note = verdict === 'INVULLEN'
    ? 'Vul de prijs-winstverhouding, de normale waarde en een groeiverwachting in — de check rekent verder.'
    : verdict === 'REDELIJK'
      ? 'Op deze prijs klopt de rekensom, zelfs als de prijs alleen maar normaliseert.'
      : verdict === 'VOL'
        ? 'Een redelijke uitkomst alleen als de groei uitkomt — geen koopje.'
        : verdict === 'DUUR'
          ? 'De groei redt de prijs amper. Microsoft 2000–2012: de winst groeide, het aandeel ging nergens heen.'
          : 'Zelfs mét groei verlies je geld doordat de prijs normaliseert. Je betaalt te veel.';
  return { verdict, tone: toneOf(verdict), rows, implied };
}

/* ── eindoordeel ── */
export function overall(c1, c2, c3) {
  const tones = [c1.tone, c2.tone, c3.tone];
  if (tones.includes('red')) return { verdict: 'NIET KOPEN', tone: 'red',
    note: 'Minstens één check is rood. 90% van de verliezen op aandelen is te voorkomen — zo voorkom je ze.' };
  if (tones.includes('amber') || tones.includes('grey')) return { verdict: 'OPGEPAST', tone: 'amber',
    note: 'Geen fatale fout, maar de checklist is niet volledig groen. Rond de open punten af vóór je koopt.' };
  return { verdict: 'AKKOORD', tone: 'green',
    note: 'Alle drie de checks zijn groen. Zo ziet een afgewogen aankoop eruit.' };
}

/* ── opslag ── */
const IN_KEY = 'aandeel-inputs', WL_KEY = 'aandeel-watchlist-v2', SET_KEY = 'aandeel-settings-v1';
export function loadInputsMap() {
  try { return JSON.parse(localStorage.getItem(IN_KEY)) || {}; } catch (e) { return {}; }
}
export function saveInputs(sym, inputs) {
  try {
    const m = loadInputsMap();
    m[sym] = inputs;
    localStorage.setItem(IN_KEY, JSON.stringify(m));
  } catch (e) { /* privémodus */ }
}
export function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem(WL_KEY)) || []; } catch (e) { return []; }
}
export function saveWatchlist(list) {
  try { localStorage.setItem(WL_KEY, JSON.stringify(list)); } catch (e) { /* negeren */ }
}

/* favorieten: eigen portefeuille + mogelijke koop */
const FAV_KEY = 'aandeel-favs-v1';
export const EMPTY_FAVS = { portfolio: [], buys: [] };
export function loadFavs() {
  try {
    const f = JSON.parse(localStorage.getItem(FAV_KEY));
    if (f && typeof f === 'object')
      return { portfolio: Array.isArray(f.portfolio) ? f.portfolio : [], buys: Array.isArray(f.buys) ? f.buys : [] };
  } catch (e) { /* negeren */ }
  return { portfolio: [], buys: [] };
}
export function saveFavs(f) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(f)); } catch (e) { /* negeren */ }
}

export const DEFAULT_SETTINGS = {
  tdKey: '',
  avKey: '',
  tickers: 'AAPL, MSFT, NVDA, ASML.AS, TSLA',
  th: { ...DEFAULT_TH },
};
export function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SET_KEY));
    if (s && typeof s === 'object') return { ...DEFAULT_SETTINGS, ...s, th: { ...DEFAULT_TH, ...(s.th || {}) } };
  } catch (e) { /* negeren */ }
  return { ...DEFAULT_SETTINGS, th: { ...DEFAULT_TH } };
}
export function saveSettings(s) {
  try { localStorage.setItem(SET_KEY, JSON.stringify(s)); } catch (e) { /* negeren */ }
}
