import Asterisk from './Asterisk'

const STEPS = [
  { n: '01', t: 'Maak het vaste hoofdkwartier',
    d: 'Eén vaste plek per aandeel, met regels die hallucinaties uitsluiten: bronnen eerst citeren, alleen de meest recente cijfers, en “niet gevonden” in plaats van verzonnen feiten.' },
  { n: '02', t: 'Leer de fundamenten van de sector',
    d: 'Begrijp de sector vóór je het bedrijf analyseert: hoe waarde wordt gecreëerd, waar de groei vandaan komt en wat hem structureel begrenst. Doe dit één keer en bewaar het voor altijd.' },
  { n: '03', t: 'Leer de bedrijfsgeschiedenis',
    d: 'Verzamel het volledige officiële dossier — jaarverslagen, kwartaalcijfers, verslagen van de gesprekken over de cijfers. Ga minstens vijf jaar terug. Alleen officiële bronnen.' },
  { n: '04', t: 'Maak een bull case en een bear case',
    d: 'De Lynch-pitch: waarom zou ik dit aandeel bezitten? De Munger-omkering: hoe kan ik hier geld mee verliezen? Twee anker-memo’s die je in 90 seconden herleest.' },
  { n: '05', t: 'Werk de coverage elk kwartaal bij',
    d: 'Vergelijk elk kwartaal de nieuwe cijfers met de eerdere richtlijnen en historie. Richtlijn vs werkelijkheid, KPI-trends, wat er echt veranderde. Zo stapelt onderzoek zich op.' },
]

export default function Method({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="sveil" onClick={onClose} />
      <div className="mpanel" role="dialog" aria-label="De methode achter de checklist">
        <div className="mp-head">
          <span className="sec-label"><Asterisk size={13} />DE METHODE ACHTER DE CHECKLIST</span>
          <button className="iconbtn" onClick={onClose} aria-label="Sluiten">✕</button>
        </div>
        <h3 className="mp-title">Bouw je eigen aandelenanalist.</h3>
        <p className="mp-intro">
          De checklist is het snelle filter. Voor de aandelen die erdoorheen komen,
          maken deze vijf stappen van losse antwoorden oplopend onderzoek.
        </p>
        <div className="mp-steps">
          {STEPS.map(s => (
            <div className="mp-step" key={s.n}>
              <span className="mp-step-n">{s.n}</span>
              <div>
                <div className="mp-step-t">{s.t}</div>
                <p className="mp-step-d">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
