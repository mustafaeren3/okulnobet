// Resmi marka dosyası (public/brand/okulnobet-logo.png) TEK doğruluk kaynağı —
// burada yeniden çizilmiyor, yalnızca CSS ile görünüm penceresi ayarlanıyor.
// "mark": kare logo bloğunun yalnızca ikon (ON monogramı) bölgesini gösterir
// (background-size/position ile piksel kırpma, dosya değişmiyor) — koyu
// zeminlerde okunurluk için beyaz yuvarlak "chip" içine oturtulur.
// "full": dosyanın tamamı (ikon + "OkulNöbet" + slogan), büyük/açık bağlamlar için.
export default function Logo({ variant = 'mark', size = 32, className = '', chip = true }) {
  if (variant === 'full') {
    const img = (
      <img
        src="/brand/okulnobet-logo.png"
        alt="OkulNöbet"
        className={['logo-full', className].filter(Boolean).join(' ')}
        style={{ height: size, width: 'auto', display: 'block' }}
      />
    );
    // Kaynak dosyanın kendi opak beyaz zemini var — koyu arka planda çıplak
    // dikdörtgen gibi durmaması için aynı chip tekniğiyle yuvarlatılmış
    // beyaz bir kart içine oturtuluyor.
    if (!chip) return img;
    return (
      <span className="logo-full-chip" style={{ padding: size * 0.18, borderRadius: size * 0.22 }}>
        {img}
      </span>
    );
  }

  const mark = (
    <span
      role="img"
      aria-label="OkulNöbet"
      className={['logo-mark', className].filter(Boolean).join(' ')}
      style={{
        display: 'block',
        width: size,
        height: size,
        backgroundImage: 'url(/brand/okulnobet-logo.png)',
        backgroundSize: '200% 200%',
        backgroundPosition: '52% 25%',
        backgroundRepeat: 'no-repeat',
        borderRadius: size * 0.28,
      }}
    />
  );

  if (!chip) return mark;

  return (
    <span className="logo-mark-chip" style={{ width: size + 8, height: size + 8, borderRadius: size * 0.34 }}>
      {mark}
    </span>
  );
}
