import Asterisk from './Asterisk'

/* Aandelen die de gebruiker heeft gecheckt en bewaard. */
export default function Watchlist({ list, onOpen, onRemove }: {
  list: any[]; onOpen: (sym: string) => void; onRemove: (sym: string) => void
}) {
  if (!list.length) return null
  return (
    <section className="watch" data-reveal>
      <div className="sec-label"><Asterisk size={15} />JOUW GECHECKTE AANDELEN</div>
      <div className="wtable">
        <div className="wrow whead">
          <span>Aandeel</span><span>Gecheckt</span>
          <span>#1 Omvallen?</span><span>#2 Moment</span><span>#3 Prijs</span>
          <span>Oordeel</span><span />
        </div>
        {list.map(w => (
          <div className="wrow" key={w.sym} onClick={() => onOpen(w.short)}>
            <span className="wname"><b>{w.short}</b><small>{w.name}</small></span>
            <span className="faint">{w.date}</span>
            <span><i className={'dot d-' + w.t1} />{w.v1}</span>
            <span><i className={'dot d-' + w.t2} />{w.v2}</span>
            <span><i className={'dot d-' + w.t3} />{w.v3}</span>
            <span><span className={'verdict-pill vp-' + w.tone}>{w.overall}</span></span>
            <span className="wrm" onClick={e => { e.stopPropagation(); onRemove(w.sym) }}>×</span>
          </div>
        ))}
      </div>
    </section>
  )
}
