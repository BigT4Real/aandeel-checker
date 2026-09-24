import Asterisk from './Asterisk'

export interface Row { label: string; value: string; state: 'pass' | 'fail' | 'na'; note: string }
export interface CheckResult { verdict: string; tone: string; rows: Row[] }

/* One editorial check block: coral label, serif question, signal rows,
   manual inputs, verdict pill. */
export default function CheckSection({ n, title, intro, result, children }: {
  n: number; title: string; intro: string;
  result: CheckResult; children?: React.ReactNode
}) {
  return (
    <section className="check" data-reveal>
      <div className="check-head">
        <span className="check-label"><Asterisk size={15} />CHECK #{n}</span>
        <span className={'verdict-pill vp-' + result.tone}>{result.verdict}</span>
      </div>
      <h3 className="check-title">{title}</h3>
      <p className="check-intro">{intro}</p>

      <div className="rows">
        {result.rows.map((r, i) => (
          <div className="sig-row" key={i}>
            <span className={'sig-mark sm-' + r.state}>
              {r.state === 'pass' ? '✓' : r.state === 'fail' ? '✗' : '·'}
            </span>
            <span className="sig-label">{r.label}<small>{r.note}</small></span>
            <span className={'sig-value sv-' + r.state}>{r.value}</span>
          </div>
        ))}
      </div>

      {children ? <div className="check-inputs">{children}</div> : null}
    </section>
  )
}

/* Small labelled number input used inside a check. */
export function NumInput({ label, value, onChange, hint, tag }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; tag?: string
}) {
  return (
    <label className="ninput">
      <span>{label}{tag ? <em className={'fldtag ' + (tag === 'auto' ? 'tg-a' : 'tg-e')}>{tag}</em> : null}</span>
      <input type="number" inputMode="decimal" value={value} placeholder="—"
             onChange={e => onChange(e.target.value)} />
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

/* Yes / no toggle used inside a check. */
export function YesNo({ label, value, onChange, hint, tag }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; tag?: string
}) {
  return (
    <div className="ninput">
      <span>{label}{tag ? <em className={'fldtag ' + (tag === 'auto' ? 'tg-a' : 'tg-e')}>{tag}</em> : null}</span>
      <div className="yn">
        <button type="button" className={value === 'yes' ? 'on yes' : ''}
                onClick={() => onChange(value === 'yes' ? '' : 'yes')}>Ja</button>
        <button type="button" className={value === 'no' ? 'on no' : ''}
                onClick={() => onChange(value === 'no' ? '' : 'no')}>Nee</button>
      </div>
      {hint ? <small>{hint}</small> : null}
    </div>
  )
}
