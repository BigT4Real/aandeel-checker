import { useState } from 'react'
import { DEFAULT_SETTINGS, DEFAULT_TH, TH_LABELS } from '../lib/checks.js'
import Asterisk from './Asterisk'

/* Instellingen: API-sleutels voor live data, drempelwaarden van de checks,
   en de standaard-tickers onder de zoekbalk. */
export default function Settings({ settings, onSave, onClose }: {
  settings: any; onSave: (s: any) => void; onClose: () => void
}) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(settings)))
  const setKey = (k: string) => (e: any) => setDraft({ ...draft, [k]: e.target.value })
  const setTh = (k: string) => (e: any) => {
    const v = parseFloat(e.target.value)
    setDraft({ ...draft, th: { ...draft.th, [k]: isNaN(v) ? DEFAULT_TH[k] : v } })
  }

  return (
    <>
      <div className="sveil" onClick={onClose} />
      <aside className="spanel">
        <div className="sp-head">
          <span className="sec-label" style={{ margin: 0 }}><Asterisk size={14} />INSTELLINGEN</span>
          <button className="sx" onClick={onClose} aria-label="Sluiten">×</button>
        </div>

        <div className="sp-body">
          <h4>Live koersen én bedrijfscijfers</h4>
          <p className="sp-note">
            Met een Twelve Data-sleutel haalt de app koersen én de bedrijfscijfers
            (schuld, prijs-winstverhouding, kasstroom…) automatisch op — voor Amerikaanse én Europese
            aandelen. Alpha Vantage is een extra reservebron, vooral voor de VS.
            Zonder sleutels draait de app op Stooq-koersen en handmatig invullen.
          </p>
          <label className="sfield">
            <span>Twelve Data-sleutel (VS + Europa)</span>
            <input type="text" value={}} draft.tdKey} onChange={setKey('tdKey')} placeholder="bijv. abc123…" />
            <a href="https://twelvedata.com/apikey" target="_blank" rel="noreferrer">Gratis aanvragen (1 minuut) →</a>
          </label>
          <label className="sfield">
            <span>Alpha Vantage-sleutel (reserve, VS)</span>
            <input type="text" value={draft.avKey} onChange={setKey('avKey')} placeholder="bijv. ABC123…" />
            <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noreferrer">Gratis aanvragen (30 seconden) →</a>
          </label>

          <h4>Grenzen van de checks</h4>
          <p className="sp-note">Wanneer wordt iets groen, oranje of rood? Pas aan naar jouw smaak — de checks rekenen meteen opnieuw.</p>
          <div className="thgrid">
            {Object.keys(TH_LABELS).map(k => (
              <label className="sfield" key={k}>
                <span>{(TH_LABELS as any)[k]}</span>
                <input type="number" step="any" value={draft.th[k]} onChange={setTh(k)} />
              </label>
            ))}
          </div>

          <h4>Standaard-tickers</h4>
          <p className="sp-note">Verschijnen als knoppen onder de zoekbalk. Scheid ze met komma's.</p>
          <label className="sfield">
            <span>Tickers</span>
            <input type="text" value={draft.tickers} onChange={setKey('tickers')} placeholder="AAPL, MSFT, ASML.AS" />
          </label>

          <div className="sp-actions">
            <button className="btn-ghost" onClick={() => setDraft(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)))}>
              Herstel standaard
            </button>
            <button className="btn-save" style={{ margin: 0 }} onClick={() => { onSave(draft); onClose() }}>
              Opslaan
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
