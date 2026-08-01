export default function Spinner({ size = 14, className = '' }) {
  return (
    <span
      className={['spinner', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Yükleniyor"
    />
  );
}
