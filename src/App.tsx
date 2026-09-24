import { useEffect, useMemo, useRef, useState } from 'react'
import Kit from './lib/kit.js'
import { loadStock } from './lib/stocks.js'
import { fetchFundamentals } from './lib/fundamentals.js'
import {
  EMPTY_INPUTS, evalCheck1, evalCheck2, evalCheck3, overall,
  loadInputsMap, saveInputs, loadWatchlist, saveWatchlist,
  loadSettings, saveSettings, loadFavs, saveFavs,
} from './lib/checks.js'
import Result from './components/Result'
import Watchlist from './components/Watchlist'
import Favorites from './components/Favorites'
import Method from './components/Method'
import Settings from './components/Settings'
import Asterisk from './components/Asterisk'

const GEAR = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="15" height="15">
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
  </svg>
)

export default function App() {
  const [q, setQ] = useState('')
  const [stock, setStock] = useState<any>(null)
  const [inputs, setInputs] = useState<any>(EMPTY_INPUTS)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [list, setList] = useState<any[]>(() => loadWatchlist())
  const [favs, setFavs] = useState<any>(() => loadFavs())
  const [settings, setSettings] = useState<any>(() => loadSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [autoInfo, setAutoInfo] = useState<any>(null)
  const manualRef = useRef<Record<string, Set<string>>>({})
  const themeSlot = useRef<HTMLSpanElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Kit.themeToggle(() => {}, themeSlot.current)
    return () => { if (themeSlot.current) themeSlot.current.innerHTML = '' }
  }, [])
  useEffect(() => { Kit.reveal() }, [stock, list.length])

  const chips = useMemo(
    () => settings.tickers.split(',').map((t: string) => t.trim().toUpperCase()).filter(Boolean).slice(0, 8),
    [settings.tickers]
  )

  const run = async (symRaw?: string) => {
    const raw = (symRaw ?? q).trim()
    if (!raw || busy) return
    setBusy(true); setErr('')
    try {
      const s = await loadStock(raw, settings)
      let fund: any = null
      try { fund = await fetchFundamentals(s.sym, settings, s.hist) } catch (e) { /* handmatig invullen */ }
      if (fund?.name && s.name === s.short) s.name = fund.name
      const saved = loadInputsMap()[s.sym]
      setInputs({ ...EMPTY_INPUTS, ...(fund?.values || {}), ...(saved || {}) })
      setAutoInfo(fund ? { source: fund.source, auto: fund.auto || [], est: fund.est || [] } : null)
      setStock(s)
      setQ('')
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    } catch (e) {
      setErr('Kon die ticker niet laden — probeer bijv. AAPL of ASML.AS')
    } finally { setBusy(false) }
  }

  const changeInputs = (next: any, key?: string) => {
    setInputs(next)
    if (!stock) return
    // Alleen velden die de gebruiker zelf aanraakt worden bewaard —
    // automatisch ingevulde waarden verversen zo bij elke check.
    const set = manualRef.current[stock.sym] || (manualRef.current[stock.sym] = new Set<string>())
    if (key) set.add(key)
    const manual: any = {}
    for (const k of set) manual[k] = next[k]
    saveInputs(stock.sym, manual)
  }

  const changeSettings = (next: any) => {
    setSettings(next)
    saveSettings(next)
    Kit.toast('Instellingen opgeslagen')
  }

  const savedEntry = stock ? list.find(w => w.sym === stock.sym) : null

  const save = () => {
    if (!stock) return
    const c1 = evalCheck1(stock, inputs, settings.th)
    const c2 = evalCheck2(stock, inputs, settings.th)
    const c3 = evalCheck3(stock, inputs, settings.th)
    const ov = overall(c1, c2, c3)
    const entry = {
      sym: stock.sym, short: stock.short, name: stock.name,
      date: new Date().toISOString().slice(0, 10),
      v1: c1.verdict, t1: c1.tone, v2: c2.verdict, t2: c2.tone,
      v3: c3.verdict, t3: c3.tone, overall: ov.verdict, tone: ov.tone,
    }
    const next = [entry, ...list.filter(w => w.sym !== stock.sym)]
    setList(next); saveWatchlist(next)
    Kit.toast(stock.short + ' opgeslagen in je volglijst')
  }

  const remove = (sym: string) => {
    const next = list.filter(w => w.sym !== sym)
    setList(next); saveWatchlist(next)
  }

  const addFav = (which: 'portfolio' | 'buys', sym: string, fields: any = {}) => {
    const s = sym.trim().toUpperCase()
    if (!s) return
    const entry = { sym: s, short: s.replace(/\.US$/, ''), ...fields }
    const next = {
      ...favs,
      [which]: [entry, ...favs[which].filter((f: any) => f.sym !== s)],
    }
    setFavs(next); saveFavs(next)
    Kit.toast(s + ' toegevoegd aan ' + (which === 'portfolio' ? 'je portefeuille' : 'mogelijke koop'))
  }

  const removeFav = (which: 'portfolio' | 'buys', sym: string) => {
    const next = { ...favs, [which]: favs[which].filter((f: any) => f.sym !== sym) }
    setFavs(next); saveFavs(next)
  }

  return (
    <div className="page">
      <header className="topbar">
        <span className="brand"><span className="dot-c" />AANDEEL CHECKER</span>
        <span className="top-right">SIMPEL CHECKEN VOORDAT JE KOOPT</span>
        <button className="infobtn" onClick={() => setShowInfo(true)}>Info</button>
        <button className="iconbtn" title="Instellingen" aria-label="Instellingen"
                onClick={() => setShowSettings(true)}>{GEAR}</button>
        <span ref={themeSlot} />
      </header>

      {/* ── hero ── */}
      <section className="hero">
        <img className="hero-logo" src="/logo.svg" alt="Aandeel Checker logo" />
        <h1>
          Checklist voor aankoop<br />
          van <em>een aandeel</em>.
        </h1>
        <p className="tagline">Want 90% van de verliezen op aandelen is te voorkomen.</p>

        <div className="searchpill">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') run() }}
            placeholder="Voer een ticker in — AAPL, MSFT, ASML.AS…"
            aria-label="Aandeel-ticker"
          />
          <button onClick={() => run()} disabled={busy}>
            {busy ? 'Checken…' : 'Start de check →'}
          </button>
        </div>
        {err ? <p className="errline">{err}</p> : null}

        {chips.length ? (
          <div className="chips">
            {chips.map((t: string) => (
              <button key={t} className="chipbtn" onClick={() => run(t)}>{t}</button>
            ))}
          </div>
        ) : null}

        <p className="hintline">
          Drie vragen, één oordeel: <b>kan het omvallen?</b> · <b>koop je op de top?</b> · <b>betaal je te veel?</b>
        </p>
      </section>

      {/* ── resultaat ── */}
      <div ref={resultRef}>
        {stock ? (
          <Result s={stock} inputs={inputs} onInputs={changeInputs}
                  onSave={save} saved={!!savedEntry} th={settings.th}
                  auto={autoInfo}
                  onFav={which => addFav(which, stock.sym, {})} />
        ) : null}
      </div>

      {/* ── favorieten: portefeuille + mogelijke koop ── */}
      <Favorites favs={favs} list={list} onAdd={addFav} onOpen={sym => run(sym)} onRemove={removeFav} />

      {/* ── volglijst ── */}
      <Watchlist list={list} onOpen={sym => run(sym)} onRemove={remove} />

      <footer className="foot">
        <span className="brand"><span className="dot-c" />AANDEEL CHECKER</span>
        <p>
          Koersen en bedrijfscijfers: Stooq, Twelve Data of Alpha Vantage.
          Velden met “schatting” altijd zelf controleren. Deze checklist is educatie, geen beleggingsadvies.
        </p>
      </footer>

      {showSettings ? (
        <Settings settings={settings} onSave={changeSettings} onClose={() => setShowSettings(false)} />
      ) : null}
      {showInfo ? <Method onClose={() => setShowInfo(false)} /> : null}
    </div>
  )
}
