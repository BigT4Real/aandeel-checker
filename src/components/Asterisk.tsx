/* The coral asterisk mark from the carousel. */
export default function Asterisk({ size = 22 }: { size?: number }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 22.5)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="asterisk" aria-hidden="true">
      {petals.map(a => (
        <line key={a} x1="12" y1="12"
          x2={12 + 9.5 * Math.cos((a * Math.PI) / 180)}
          y2={12 + 9.5 * Math.sin((a * Math.PI) / 180)}
          stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" />
      ))}
    </svg>
  )
}
