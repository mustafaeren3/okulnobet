const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
const ROWS = [
  ['A. Yılmaz', 'B. Kaya', '', 'C. Demir', 'A. Yılmaz'],
  ['', 'B. Kaya', 'D. Şahin', '', 'C. Demir'],
  ['D. Şahin', '', 'A. Yılmaz', 'B. Kaya', ''],
];

// Statik illüstratif çizelge önizlemesi — gerçek ekran görüntüsü değil,
// tasarım varlığı olmadığı için hero bölümünde sağ tarafı doldurmak üzere
// düz CSS/JSX ile üretildi.
export default function HeroMockup() {
  return (
    <div className="hero-mockup" aria-hidden="true">
      <div className="hero-mockup-topbar">
        <span className="hero-mockup-dot" style={{ background: 'var(--danger)' }} />
        <span className="hero-mockup-dot" style={{ background: '#f5b942' }} />
        <span className="hero-mockup-dot" style={{ background: 'var(--accent)' }} />
        <span className="hero-mockup-title">Nöbet Programı — Kasım</span>
      </div>

      <div className="hero-mockup-grid">
        {DAYS.map((d) => (
          <div key={d} className="hero-mockup-head">{d}</div>
        ))}
        {ROWS.flatMap((row, ri) =>
          row.map((cell, ci) => (
            <div key={`${ri}-${ci}`} className={`hero-mockup-cell ${cell ? 'filled' : ''}`}>
              {cell}
            </div>
          ))
        )}
      </div>

      <div className="hero-mockup-legend">
        <span><i style={{ background: 'var(--primary)' }} /> Atandı</span>
        <span><i style={{ background: 'var(--accent)' }} /> Uygun</span>
      </div>
    </div>
  );
}
