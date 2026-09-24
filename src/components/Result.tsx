import { useEffect, useMemo, useRef } from 'react'
import Kit from '../lib/kit.js'
import { currencyOf, pct } from '../lib/stocks.js'
import { EMPTY_INPUTS, evalCheck1, evalCheck2, evalCheck3, overall } from '../lib/checks.js'
import CheckSection, { NumInput, YesNo } from './CheckSection'
import Asterisk from './Asterisk'

const SOURCE_LABEL: Record<string, string> = {
  stooq: 'live koersen · Stooq',
  twelvedata: 'live koersen · Twelve Data',
  alphavantage: 'live koersen · Alpha Vantage',
  demo: 'voorbeelddata (offline)',
}
const FUND_LABEL: Record<string, string> = {
  twelvedata: 'Twelve Data',
  alphavantage: 'Alpha Vantage',
}

function PriceChart({ s }: { s: any }) {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const data = s.hist.slice(-260)
    const inst = Kit.chart(el.current, () => ({
      grid: { left: 6, right: 10, top: 14, bottom: 2, containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: Kit.axis('category', {
        data: data.map((p: any) => p.date.slice(2)),
        axisLabel: { color: Kit.css('faint'), fontSize: 9.5, interval: Math.floor(data.length / 6) },
      }),
      yAxis: Kit.axis('value', { scale: true }),
      series: [
        { name: 'Slot', type: 'line', data: data.map((p: any) => p.close), showSymbol: false,
          lineStyle: { width: 1.8, color: Kit.css('accent') },
          itemStyle: { color: Kit.css('accent') },
          areaStyle: { color: Kit.css('accent'), opacity: 0.08 } },
        { name: '200-daags', type: 'line', showSymbol: false,
          data: data.map((_: any, i: number) => {
            if (i < 199) return null
            let sum = 0
            for (let k = i - 199; k <= i; k++) sum += data[k].close
            return +(sum / 200).toFixed(2)
          }),
          lineStyle: { width: 1, type: [4, 3], color: Kit.css('faint') }, itemStyle: { color: Kit.css('faint') } },
      ],
    }))
    return () => { Kit.release(inst) }
  }, [s.sym])
  return <div ref={el} style={{ width: '100%', height: '190px' }} />
}

export default function Result({ s, inputs, onInputs, onSave, saved, th, auto, onFav }: {
  s: any; inputs: typeof EMPTY_INPUTS; onInputs: (i: typeof EMPTY_INPUTS, key?: string) => void;
  onSave: () => void; saved: boolean; th: any;
  auto?: { source: string; auto: string[]; est: string[] } | null;
  onFav?: (which: 'portfolio' | 'buys') => void
}) {
  const cur = currencyOf(s.sym)
  const c1 = useMemo(() => evalCheck1(s, inputs, th), [s, inputs, th])
  const c2 = useMemo(() => evalCheck2(s, inputs, th), [s, inputs, th])
  const c3 = useMemo(() => evalCheck3(s, inputs, th), [s, inputs, th])
  const ov = useMemo(() => overall(c1, c2, c3), [c1, c2, c3])
  const set = (k: string) => (v: string) => onInputs({ ...inputs, [k]: v }, k)
  const tagFor = (k: string) =>
    auto?.auto.includes(k) ? 'auto' : auto?.est.includes(k) ? 'schatting' : undefined
  const hasAuto = auto && (auto.auto.length + auto.est.length > 0)

  return (
    <div className="result">
      {/* ── bedrijfskop ── */}
      <div className="rcard" data-reveal>
        <div className="rhead">
          <div>
            <div className="rname">{s.name}</div>
            <div className="rsub">
              {s.short} · {s.sym.toUpperCase()} · {SOURCE_LABEL[s.source] || s.source}
            </div>
          </div>
          <div className="rprice">
            <span className="p">{cur + Kit.fmt(s.price, 2)}</span>
            <span className={'c ' + (s.chg >= 0 ? 'pos' : 'neg')}>{pct(s.chg)} vandaag</span>
          </div>
        </div>
        <PriceChart s={s} />
      </div>

      {hasAuto ? (
        <div className="autoline" data-reveal>
          Bedrijfscijfers automatisch ingevuld — bron: {FUND_LABEL[auto.source] || auto.source}.
          <span className="fldtag tg-a">auto</span> = uit de bron ·
          <span className="fldtag tg-e">schatting</span> = zelf controleren
        </div>
      ) : null}

      {/* ── de drie checks ── */}
      <CheckSection n={1} result={c1}
        title="Kan dit bedrijf omvallen?"
        intro="Fraude, een kapot bedrijfsmodel, of schulden die nooit worden terugbetaald. Drie verschillende problemen, hetzelfde resultaat: je verliest alles. Deze check filtert alle drie.">
        <NumInput label="Schuld / winst (×)" value={inputs.ndebt} onChange={set('ndebt')} tag={tagFor('ndebt')} hint={'boven ' + th.ndebtDanger + '× is riskant'} />
        <NumInput label="Rente betaalbaar? (×)" value={inputs.icov} onChange={set('icov')} tag={tagFor('icov')} hint={'winst ÷ rentekosten — onder ' + th.icovFragile + '× is zwak'} />
        <YesNo label="Blijft er echt geld over?" value={inputs.fcf} onChange={set('fcf')} tag={tagFor('fcf')} hint="afgelopen boekjaar" />
      </CheckSection>

      <CheckSection n={2} result={c2}
        title="Koop je op het verkeerde moment?"
        intro="Een aandeel kan er goedkoop uitzien vlak voordat de winst instort. Bedrijven die afhankelijk zijn van de economie — grondstoffen, scheepvaart, auto’s, chemicaliën, bouw — lijken het goedkoopst vlak voordat ze crashen.">
        <YesNo label="Gevoelig voor de economie?" value={inputs.cyc} onChange={set('cyc')} tag={tagFor('cyc')} hint="grondstoffen, scheepvaart, auto’s, bouw…" />
        <NumInput label="Prijs-winst nu" value={inputs.pe} onChange={set('pe')} tag={tagFor('pe')} hint='zoek "P/E ratio" in een screener' />
        <NumInput label="Normale prijs-winst (5 jaar)" value={inputs.peMed} onChange={set('peMed')} tag={tagFor('peMed')} hint="geschat uit de koershistorie" />
      </CheckSection>

      <CheckSection n={3} result={c3}
        title="Betaal je niet te veel?"
        intro="Microsoft 2000–2012: de winst groeide, maar het aandeel ging twaalf jaar nergens heen omdat beleggers in 2000 veel te veel betaalden. Een geweldig bedrijf kan op de verkeerde prijs een slechte belegging zijn.">
        <NumInput label="Prijs-winst nu" value={inputs.pe} onChange={set('pe')} tag={tagFor('pe')} hint="hoeveel je betaalt voor elke euro winst" />
        <NumInput label="Normale prijs-winst (5 jaar)" value={inputs.peMed} onChange={set('peMed')} tag={tagFor('peMed')} hint="waar de prijs naartoe terugvalt" />
        <NumInput label="Winstgroei per jaar (%)" value={inputs.growth} onChange={set('growth')} tag={tagFor('growth')} hint="historisch gemiddelde — pas aan naar verwachting" />
      </CheckSection>

      {/* ── eindoordeel ── */}
      <div className={'final fv-' + ov.tone} data-reveal>
        <div className="final-label"><Asterisk size={15} />HET OORDEEL</div>
        <div className="final-word">{ov.verdict}</div>
        <p className="final-note">{ov.note}</p>
        <div className="final-mini">
          <span className={'verdict-pill vp-' + c1.tone}>#1 {c1.verdict}</span>
          <span className={'verdict-pill vp-' + c2.tone}>#2 {c2.verdict}</span>
          <span className={'verdict-pill vp-' + c3.tone}>#3 {c3.verdict}</span>
        </div>
        <button className="btn-save" onClick={onSave}>
          {saved ? '✓ Opgeslagen in volglijst' : 'Bewaar in volglijst'}
        </button>
        {onFav ? (
          <div className="favquick">
            <button className="btn-ghost" onClick={() => onFav('portfolio')}>+ Portefeuille</button>
            <button className="btn-ghost" onClick={() => onFav('buys')}>+ Mogelijke koop</button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
