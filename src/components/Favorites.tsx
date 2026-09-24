import { useState } from 'react';

function findCheck(list, f) {
  return list.find(x => x.sym === f.sym || (x.short && x.short === (f.short || f.sym)));
}

function adviceOf(w) {
  if (!w) return { tone: 'grey', label: 'nog geen check' };
  if (w.overall === 'AKKOORD') return { tone: 'green', label: 'aankopen' };
  if (w.overall === 'OPGEPAST') return { tone: 'blue', label: 'houden' };
  return { tone: 'red', label: 'verkopen' };
}

function fmtDate(d) {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  return parts[2] + '-' + parts[1] + '-' + parts[0].slice(2);
}

function PortfolioCol({ items, onAdd, onOpen, onRemove, list }) {
  const [sym, setSym] = useState('');
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState('');
  const add = () => {
    if (!sym.trim()) return;
    onAdd('portfolio', sym, { shares: shares.trim(), buyPrice: price.trim(), buyDate: date });
    setSym(''); setShares(''); setPrice(''); setDate('');
  };
  return (
    <div className="favcol">
      <div className="favcol-head">
        <span className="favcol-t">Mijn portefeuille</span>
        <span className="favcol-h">wat je bezit</span>
      </div>
      <div className="favadd fp-grid">
        <input className="fa-sym" value={sym} onChange={e => setSym(e.target.value)} placeholder="Ticker — bijv. ASML.AS" />
        <input value={shares} onChange={e => setShares(e.target.value)} placeholder="Aantal stuks — bijv. 10" inputMode="decimal" />
        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Aankoopprijs per stuk — bijv. 680" inputMode="decimal" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} title="Datum van aankoop" aria-label="Datum van aankoop" />
        <button className="fa-btn" onClick={add} aria-label="toevoegen">+</button>
      </div>
      <div className="favrows">
        {items.length === 0 && <div className="favempty">Nog niets toegevoegd.</div>}
        {items.map(f => {
          const w = findCheck(list, f);
          const adv = adviceOf(w);
          const detail = [
            f.shares ? f.shares + ' stuks' : '',
            f.buyPrice ? 'à ' + f.buyPrice : '',
            f.buyDate ? fmtDate(f.buyDate) : '',
          ].filter(Boolean).join(' · ');
          return (
            <div className="favrow" key={f.sym}>
              <div className="favname">
                <b>{f.short || f.sym}</b>
                {detail && <small>{detail}</small>}
              </div>
              <div className="favadv" title={'Advies op basis van je laatste check'}>
                <i className={'dot d-' + adv.tone} />
                <span>{adv.label}</span>
              </div>
              <button className="favgo" onClick={() => onOpen(f.sym)}>check →</button>
              <button className="wrm" onClick={() => onRemove('portfolio', f.sym)}>×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BuysCol({ items, onAdd, onOpen, onRemove, list }) {
  const [sym, setSym] = useState('');
  const [note, setNote] = useState('');
  const add = () => {
    if (!sym.trim()) return;
    onAdd('buys', sym, { note: note.trim() });
    setSym(''); setNote('');
  };
  return (
    <div className="favcol">
      <div className="favcol-head">
        <span className="favcol-t">Mogelijke koop</span>
        <span className="favcol-h">op de radar</span>
      </div>
      <div className="favadd">
        <input className="fa-sym" value={sym} onChange={e => setSym(e.target.value)} placeholder="Ticker — NVDA" />
        <input className="fa-note" value={note} onChange={e => setNote(e.target.value)} placeholder="Notitie — kopen onder $400" />
        <button className="fa-btn" onClick={add} aria-label="toevoegen">+</button>
      </div>
      <div className="favrows">
        {items.length === 0 && <div className="favempty">Nog niets toegevoegd.</div>}
        {items.map(f => {
          const w = findCheck(list, f);
          const adv = adviceOf(w);
          return (
            <div className="favrow" key={f.sym}>
              <div className="favname">
                <b>{f.short || f.sym}</b>
                {f.note && <small>{f.note}</small>}
              </div>
              <div className="favadv" title={'Advies op basis van je laatste check'}>
                <i className={'dot d-' + adv.tone} />
                <span>{adv.label}</span>
              </div>
              <button className="favgo" onClick={() => onOpen(f.sym)}>check →</button>
              <button className="wrm" onClick={() => onRemove('buys', f.sym)}>×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Favorites({ favs, list, onAdd, onOpen, onRemove }) {
  return (
    <section className="favs">
      <div className="favgrid">
        <PortfolioCol items={favs.portfolio} onAdd={onAdd} onOpen={onOpen} onRemove={onRemove} list={list} />
        <BuysCol items={favs.buys} onAdd={onAdd} onOpen={onOpen} onRemove={onRemove} list={list} />
      </div>
    </section>
  );
}
