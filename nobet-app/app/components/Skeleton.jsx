// "Yükleniyor..." metin-swap deseninin yanına eklenen görsel shimmer bar.
// Mevcut disabled+metin mantığını DEĞİŞTİRMEZ, yalnızca yanına/yerine görsel katman ekler.
export default function Skeleton({ width = '100%', height = 14, radius = 6, className = '', style }) {
  return (
    <span
      className={['skeleton', className].filter(Boolean).join(' ')}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}
