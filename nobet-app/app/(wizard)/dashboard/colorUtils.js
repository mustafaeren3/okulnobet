// Eski tasarımın renk paleti + parlaklık hesabı. Öğretmen/müdür yardımcısı
// adına göre kalıcı bir renk üretir (isim hash'lenir) — DB'de saklanmaz,
// salt görsel. Dashboard.jsx ve DistributionTab.jsx ikisi de kullanıyor
// (2. somut kullanımda ortak dosyaya çıkarıldı, CLAUDE.md sadelik kuralı).
const PALETTE = [
  '4472C4', 'ED7D31', 'A9D18E', 'FF6666', '00B0F0', 'D4C400', '00B050',
  '9966CC', 'FF8533', '9999FF', 'E05252', '00CCCC', '339966', 'D4A300',
  '999999', '843C0C', '4C8C5C', '2E75B6', 'FF69B4', 'E040FB', '26A69A',
  'F06292', '8D6E63', '78909C', 'D4E157', 'FF7043', '5C6BC0', 'AB47BC',
];

export function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function luminance(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function formatDate(ymd) {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}
